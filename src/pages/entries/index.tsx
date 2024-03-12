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
import { PlusIcon } from "@heroicons/react/24/solid";

const Entries = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace } = useRouter();    
    const [entries,      setEntries     ] = useState<WeightedEntry[]>([]);
    const [entryTitle,   setEntryTitle  ] = useState<string>("");
    const [entryContent, setEntryContent] = useState<string>("");

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            void replace("/")
        }
    }, [replace, sessionStatus]);

    const {isLoading} = api.weightedEntry.getAllEntries.useQuery(
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

    const { mutate: updateEntryMutation } = api.weightedEntry.updateEntryWeight.useMutation();

    const { mutate: createEntry } = api.weightedEntry.createEntry.useMutation({
        onSuccess(data) {
            setEntries([...entries, {
                id: data.id,
                title: entryTitle,
                userId: data.userId,
                parentId: '',
                content: entryContent,
                weightRating: 100,
                dateCreated: data.dateCreated,
                childEntries: []
            }].sort((a,b) => b.weightRating - a.weightRating));    
            setEntryTitle("");
            setEntryContent("");        
        }
    });

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

    const handleDelete = (entryId: string) => {
        const newEntries: WeightedEntry[] = entries.filter((entry) => entry.id !== entryId);
        setEntries(newEntries);
    }

    const handleNewEntry = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        createEntry({ content: entryContent, title: entryTitle, weight: 100 });
    };

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (entryTitle && !!entryContent) handleNewEntry();
        };
    }

    if (sessionStatus === "loading" || isLoading ) { return <Loading/> }
    if (!sessionData) return;
    return (<>
        <Head><title>Список</title></Head>
        <div className="h-screen w-screen g-cover bg-center flex flex-col overflow-x-hidden overflow-y-auto">      
            <section className="sec-container">
                <form className={`flex flex-col justify-center gap-2 mx-10 md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 rounded-md pt-2`} 
                    onSubmit={e => handleNewEntry(e)}>
                    <div className="flex flex-row gap-2">
                        <input 
                            required
                            value={entryTitle}
                            onKeyDown={e => onCtrlEnterPress(e)}
                            onChange={e => setEntryTitle(e.target.value)}
                            placeholder="Название новой задачи" 
                            tabIndex={1}
                            className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 py-1 px-3 tracking-wide w-full"/>  
                            <button 
                                tabIndex={3}
                                type="submit" 
                                className={`font-montserrat mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-700 p-3 text-xl font-bold text-neutral-100 w-25`}>
                                <PlusIcon width={12}/>
                            </button>        
                    </div>
                    <textarea 
                        cols={30} 
                        rows={3} 
                        required
                        tabIndex={2}
                        value={entryContent}
                        onKeyDown={e => onCtrlEnterPress(e)}
                        onChange={e => setEntryContent(e.target.value)}
                        placeholder="Опиши свои мысли" 
                        className={`font-montserrat rounded-sm border border-slate-800 bg-gray-800 p-3 tracking-wide 
                        ${
                            !entryTitle ? '-mt-24 -z-10 opacity-0' : 'mt-0 z-0 opacity-100'
                        }
                        transition-all ease-in-out delay-150 duration-300`}>
                    </textarea>
                </form>    
                {entries?.length === 0 
                    ? <NoEntries/> 
                    : <FlipMove className="-mt-4">
                        {entries?.map((entry: WeightedEntry, index) => (
                            <div key={entry.id}>
                                <Card 
                                    entry={entry}
                                    handleWeightChange={handleWeightChange} 
                                    tabIndex={3 * (index + 1)} 
                                    onDelete={handleDelete}/>
                            </div>
                        ))}
                    </FlipMove>
                }
            </section>
        </div>
    </>);
}

export default Entries;