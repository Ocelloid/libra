import {useSession} from "next-auth/react";
import {useRouter} from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import NoEntries from "~/components/NoEntries";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import moment from "moment";
import 'moment/locale/ru';
moment.locale('ru')
import FlipMove from 'react-flip-move';
import Card from "~/components/Card";
import { type WeightedEntry } from "~/server/api/routers/weightedentry";

const Entries = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace } = useRouter();    
    const [entries, setEntries] = useState<WeightedEntry[]>([]);

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            void replace("/")
        }
    }, [replace, sessionStatus]);


    const {data: entriesData, status, isLoading} = api.weightedEntry.getAllEntries.useQuery(
        undefined, 
        {
            enabled: sessionStatus === "authenticated",
            onSuccess: (data: WeightedEntry[]) => {
                setEntries(data.map((val: WeightedEntry) => {
                    val.childEntries = data.filter((childEntry: WeightedEntry) => childEntry.parentId === val.id);
                    return val;
                }).filter(v => !v.parentId).sort((a,b) => b.weightRating - a.weightRating));
            }
        }
    );

    const { mutate: updateEntryMutation, statusWeight, isLoadingWeight } = api.weightedEntry.updateEntryWeight.useMutation();

    const handleWeightChange = (entryId: string, weight: number, commit: boolean | undefined) => {
        if (isNaN(Number(weight))) return;

        const newEntries: WeightedEntry[] = entries.map((entry) => {
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
                        {entries?.map((entry: WeightedEntry) => (
                            <div key={entry.id}>
                                <Card entry={entry} handleWeightChange={handleWeightChange}/>
                            </div>
                        ))}
                    </FlipMove>
                }
            </section>
        </div>
    </>);
}

export default Entries;