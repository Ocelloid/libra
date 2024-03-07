import { Button, Slider, Tooltip } from "@nextui-org/react";
import Link from "next/link";
import moment from "moment";
import 'moment/locale/ru';
import { type WeightedEntry } from "~/server/api/routers/weightedentry";
import FlipMove from "react-flip-move";
import { api } from "~/utils/api";
import { useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/solid";
moment.locale('ru')

const Card: React.FC<{
        entry: WeightedEntry, 
        handleWeightChange: (id: string, weight: number, commit?: boolean | undefined) => void,
        isChild?: boolean,
        className?: string,
    }> = ({entry, handleWeightChange, isChild, className}) => {
        const [childEntries, setChildEntries] = useState<WeightedEntry[]>(
            entry.childEntries 
                ? entry.childEntries.sort((a: WeightedEntry, b: WeightedEntry) => b.weightRating - a.weightRating)
                : []
        );
        const [inputValue, setInputValue] = useState<string>(entry.weightRating.toString());

        const { mutate: updateEntryMutation } = api.weightedEntry.updateEntryWeight.useMutation();

        const handleChildEntriesWeightChange = (entryId: string, weight: number, commit: boolean | undefined) => {
            if (isNaN(Number(weight))) return;
            const newEntries: WeightedEntry[] = childEntries.map((childEntry) => {
                if (childEntry.id === entryId) {
                    return {
                        ...childEntry,
                        weightRating: weight
                    }
                }
                else return childEntry;
            });
    
            if (commit) {
                setChildEntries(
                    newEntries
                        .sort((a,b) => b.weightRating - a.weightRating)
                );
                updateEntryMutation({id: entryId, weight: weight});
            }
            else setChildEntries(newEntries);
        }

        return(
            <div className={
                `truncate ${isChild 
                    ? "ml-5 pl-3 pt-5" 
                    : "mx-10 px-3 md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 my-5 py-5 rounded-md"
                } flex flex-col bg-slate-800 bg-opacity-30 ${className}`}>
                <Link 
                    href={`/entries/${entry.id}`} 
                    className="">
                    <p className="font-montserrat px-2 text-lg text-neutral-100 hover:text-gray-300">
                        {entry.title}
                    </p>
                    <p className="text-gray-500 px-2 font-montserrat">
                        {moment(entry.dateCreated).format("D MMMM YYYY HH:mm")}
                    </p>
                </Link>
                <Slider 
                    size="sm"
                    step={1} 
                    minValue={0} 
                    maxValue={100}                                     
                    label="Вес: "
                    value={entry.weightRating}
                    color="foreground"
                    onChange={value => {
                        handleWeightChange(entry.id.toString(), Number(value));
                        setInputValue(value.toString());                    
                    }}
                    onChangeEnd={value => {
                        handleWeightChange(entry.id.toString(), Number(value), true);
                        setInputValue(value.toString()); 
                    }}
                    startContent={
                        <Button
                            isIconOnly
                            radius="full"
                            variant="light"
                            onPress={() => {
                                handleWeightChange(entry.id.toString(), 0, true);
                                setInputValue("0");                    
                            }}>
                            <ArrowLeftIcon width={24} className="text-neutral-100"/>
                        </Button>
                    }
                    endContent={
                        <Button
                            isIconOnly
                            radius="full"
                            variant="light"
                            onPress={() => {
                                handleWeightChange(entry.id.toString(), 100, true);
                                setInputValue("100");             
                            }}>
                            <ArrowRightIcon width={24} className="text-neutral-100"/>
                        </Button>
                    }                    
                    renderValue={(...props) => (
                        <output {...props}>
                            <Tooltip
                                className="text-tiny text-default-500 rounded-md"
                                content="Нажми Enter чтобы применить"
                                placement="left"
                            >
                                <input
                                className="px-1 py-0.5 w-10 my-1 text-center text-medium font-montserrat text-gray-500 font-medium bg-slate-800 outline-none transition-colors rounded-small border-medium border-transparent hover:border-primary focus:border-primary bg-transparent"
                                type="text"
                                aria-label="Вес"
                                value={inputValue}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setInputValue(v);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isNaN(Number(inputValue))) {
                                        handleWeightChange(entry.id.toString(), Number(inputValue), true);
                                    }
                                }}/>
                            </Tooltip>
                        </output>
                    )}
                    classNames={{
                      label: "ml-auto text-medium text-gray-500 font-montserrat",
                      filler: "bg-neutral-100 hover:bg-gray-300",
                      thumb: "bg-neutral-100 hover:bg-gray-300"
                    }}
                    className="gap-0 -mt-8"/>
                <FlipMove>
                    {childEntries.map((childEntry: WeightedEntry) => (
                        <div key={childEntry.id} className="child-entry">
                            <Card entry={childEntry} handleWeightChange={handleChildEntriesWeightChange} isChild className="child-entry-card"/>
                        </div>
                    ))}
                </FlipMove>
            </div>
        )
    }

export default Card;