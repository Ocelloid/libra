import {useSession} from "next-auth/react";
import {useRouter} from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import NoEntries from "~/components/NoEntries";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import Link from "next/link";
import moment from "moment";
import 'moment/locale/ru';
moment.locale('ru')

import {Button, Slider} from "@nextui-org/react";
import FlipMove from 'react-flip-move';

const Entries = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace } = useRouter();    
    const [entries, setEntries] = useState("");

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            replace("/")
        }
    }, [sessionStatus]);


    const {data: entriesData, status, isLoading} = api.weightedEntry.getAllEntries.useQuery(
        undefined, 
        {
            enabled: sessionStatus === "authenticated",
            onSuccess: (data) => {
                setEntries(data.sort((a,b) => b.weightRating - a.weightRating));
            }
        }
    );

    const { mutate: updateEntryMutation, statusWeight, isLoadingWeight } = api.weightedEntry.updateEntryWeight.useMutation();

    const handleWeightChange = (entryId: string, weight: number, commit: boolean | undefined) => {
        if (isNaN(Number(weight))) return;
        console.log(weight);
        const newEntries = entries.map((entry) => {
            if (entry.id === entryId) {
                return {
                    ...entry,
                    weightRating: weight
                }
            }
            else return entry;
        });

        if (commit) {
            setEntries(
                newEntries
                    .sort((a,b) => b.weightRating - a.weightRating)
            );
            updateEntryMutation({id: entryId, weight: weight});
        }
        else setEntries(newEntries);
    }

    if (sessionStatus === "loading" || isLoading || isLoadingWeight) { return <Loading/> }
    if (!sessionData) return;
    return (<>
        <Head>
            <title>Список</title>
        </Head>

        <div className="h-screen w-screen g-cover bg-center flex flex-col overflow-x-hidden overflow-y-auto" 
            style={{backgroundImage: `url(/background.png)`}}
        >
            <section className="sec-container">
                {entries?.length === 0 
                    ? <NoEntries/> 
                    : <FlipMove>
                        {entries?.map((entry) => (
                            <div className="truncate mx-auto my-5 flex w-1/2 flex-col rounded-md bg-slate-800 px-3 pb-2 pt-5" key={entry.id}>
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
                                    onChange={value => handleWeightChange(entry.id, value)}
                                    onChangeEnd={value => handleWeightChange(entry.id, value, true)}
                                    startContent={
                                        <Button
                                          isIconOnly
                                          radius="full"
                                          variant="light"
                                          onPress={() => handleWeightChange(entry.id, 0, true)}>
                                          0
                                        </Button>
                                      }
                                      endContent={
                                        <Button
                                          isIconOnly
                                          radius="full"
                                          variant="light"
                                          onPress={() => handleWeightChange(entry.id, 100, true)}
                                        >
                                          100
                                        </Button>
                                      }
                                      className="gap-0"/>
                            </div>
                        ))}
                    </FlipMove>
                }
            </section>
        </div>
    </>);
}

export default Entries;