import { Button, Slider } from "@nextui-org/react";
import Link from "next/link";
import moment from "moment";
import 'moment/locale/ru';
import type { Entry } from "~/server/api/routers/weightedentry";
import FlipMove from "react-flip-move";
import { api } from "~/utils/api";
import { useState } from "react";
moment.locale('ru')

const Card: React.FC<{
        entry: Entry, 
        handleWeightChange: (id: string, weight: number, commit?: boolean | undefined) => void,
        isChild?: boolean
    }> = ({entry, handleWeightChange, isChild}) => {
        const [childEntries, setChildEntries] = useState<Entry[]>(
            entry.childEntries 
                ? entry.childEntries.sort((a,b) => b.weightRating - a.weightRating)
                : []);

        const { mutate: updateEntryMutation, statusWeight, isLoadingWeight } = api.weightedEntry.updateEntryWeight.useMutation();

        const handleChildEntriesWeightChange = (entryId: string, weight: number, commit: boolean | undefined) => {
            console.log(entryId, weight, commit)
            if (isNaN(Number(weight))) return;
            //if (!entry.childEntries || entry.childEntries?.length === 0) return;

            const newEntries: Entry[] = childEntries.map((childEntry) => {
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
            
            //handleWeightChange(entry.id, entry.weight, true);
        }

        return(
            <div className={`truncate ${isChild ? "ml-5 pl-3 pt-5" : "mx-10 px-3 md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 my-5 py-5"} flex flex-col rounded-md bg-slate-800`}>
                <Link 
                    href={`/entries/${entry.id}`} 
                    className="">
                    <p className="font-montserrat px-2 text-lg text-gray-50">
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
                    aria-label="Вес"
                    showTooltip={true}
                    value={entry.weightRating}
                    onChange={value => handleWeightChange(entry.id.toString(), Number(value))}
                    onChangeEnd={value => handleWeightChange(entry.id.toString(), Number(value), true)}
                    startContent={
                        <Button
                            isIconOnly
                            radius="full"
                            variant="light"
                            onPress={() => handleWeightChange(entry.id.toString(), 0, true)}>
                            0
                        </Button>
                    }
                    endContent={
                        <Button
                            isIconOnly
                            radius="full"
                            variant="light"
                            onPress={() => handleWeightChange(entry.id.toString(), 100, true)}>
                            100
                        </Button>
                    }
                    className="gap-0"/>
                <FlipMove>
                    {childEntries.map((childEntry: Entry) => (
                        <div key={childEntry.id}>
                            <Card entry={childEntry} handleWeightChange={handleChildEntriesWeightChange} isChild/>
                        </div>
                    ))}
                </FlipMove>
            </div>
        )
    }

export default Card;