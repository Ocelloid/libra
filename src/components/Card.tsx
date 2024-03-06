import { Button, Slider } from "@nextui-org/react";
import Link from "next/link";
import moment from "moment";
import 'moment/locale/ru';
import type { Entry } from "~/server/api/routers/weightedentry";
moment.locale('ru')

const Card: React.FC<{
        entry: Entry, 
        handleWeightChange: (id: string, weight: number, commit?: boolean | undefined) => void
    }> = ({entry, handleWeightChange}) => (
    <div className="truncate md:mx-auto mx-10 my-5 flex md:w-1/2 flex-col rounded-md bg-slate-800 px-3 pb-2 pt-5">
        <Link 
            href={`/entries/${entry.id}`} 
            className="">
            <p className="font-montserrat px-2 text-lg text-gray-50">
                {entry.content}
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
    </div>
)

export default Card;