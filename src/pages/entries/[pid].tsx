import moment from "moment";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import 'moment/locale/ru';
import { ArrowUpLeftIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button, Slider } from "@nextui-org/react";
import type { Entry } from "~/server/api/routers/weightedentry";
import FlipMove from "react-flip-move";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Card from "~/components/Card";

moment.locale('ru')

const Entry = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace, query } = useRouter();
    const entryId: string = Array.isArray(query.id) ? query.pid[0] : query.pid;

    const [parentId,     setParentId]     = useState<string>("");
    const [entryUserId,  setEntryUserId]  = useState<string>("");
    const [entryTitle,   setEntryTitle]   = useState<string>("");
    const [entryContent, setEntryContent] = useState<string>("");
    const [weightRating, setWeightRating] = useState<number>(50);
    const [childTitle,   setChildTitle]   = useState<string>("");
    const [childContent, setChildContent] = useState<string>("");
    const [childRating,  setChildRating]  = useState<number>(50);
    const [childEntries, setChildEntries] = useState<Entry[]>([]);
    const [isEditing,    setIsEditing]    = useState<boolean>(false);

    const {data: entryData, status, isLoading} = api.weightedEntry.getEntryById.useQuery(
        {id: entryId}, 
        {   
            enabled: entryId !== undefined,
            onSuccess: (data: Entry) => {
                setEntryTitle(data.title);
                setParentId(data.parentId);
                setEntryUserId(data.userId);
                setEntryContent(data.content);
                setWeightRating(data.weightRating);
            }
        }
    );

    const {data: childEntriesData, statusChildEntries, isLoadingChildEntries} = api.weightedEntry.getChildEntriesById.useQuery(
        {parentId: entryId}, 
        {   
            enabled: entryId !== undefined,
            onSuccess: (data: Entry[]) => {
                setChildEntries(data.sort((a,b) => b.weightRating - a.weightRating));
            }
        }
    );

    const {mutate: deletionMutation} = api.weightedEntry.deleteEntry.useMutation({
        onSuccess() {
            replace('/entries')
        }
    });

    const { mutate: updateMutation, updateStatus, isUpdating } = api.weightedEntry.updateEntry.useMutation({
        onSuccess() {
            setIsEditing(false);
        }
    });

    const { mutate: childMutation, updateChildStatus, isChildUpdating } = api.weightedEntry.createChild.useMutation({
        onSuccess(newEntry) {
            const newChildEntries: Entry[] = [
                ...childEntries, 
                {
                    id: newEntry.id,
                    parentId: entryId,
                    title: childTitle,
                    content: childContent,
                    weightRating: childRating,
                    userId: entryUserId,
                    dateCreated: new Date()
                }
            ];
            setChildEntries(newChildEntries);
            setIsEditing(false);
            setChildTitle("");
            setChildContent("");
            setChildRating(50);
        }
    });

    const { mutate: updateEntryMutation, statusWeight, isLoadingWeight } = api.weightedEntry.updateEntryWeight.useMutation();

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            replace("/");
        }
    }, [sessionStatus]);

    const loadParent = () => {
        if (!!parentId) replace(`${parentId}`);
        else replace("/entries");
    }

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        updateMutation({ id: entryId, content: entryContent, title: entryTitle, weight: weightRating });
    };

    const handleNewChild = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        childMutation({content: childContent, title: childTitle, weight: childRating, parentId: entryId});
    }

    const handleWeightChange = (entryId: string, weight: number, commit: boolean | undefined) => {
        if (isNaN(Number(weight))) return;

        const newEntries: Entry[] = childEntries.map((entry) => {
            if (entry.id === entryId) {
                return {
                    ...entry,
                    weightRating: weight
                }
            }
            else return entry;
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

    if (sessionStatus === "loading" || isLoading || isUpdating || isChildUpdating) { return <Loading/> }
    if (!sessionData) return;
    return <>
        <Head><title>Задача</title></Head>

        <div className="h-screen w-screen g-cover bg-center flex flex-col overflow-x-hidden overflow-y-auto" 
            style={{backgroundImage: `url(/background.png)`}}
        >
            {isEditing ? <section className="sec-container">
                {
                    entryData !== null && (
                        <div className="mx-auto flex md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 flex-col gap-5">
                            <div className="flex flex-row items-center justify-between">
                                <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => setIsEditing(false)}>
                                    <ArrowUpLeftIcon width={25} className="text-gray-50"/>
                                </button>
                                <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                    {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                                </h1>
                                <button className="rounded-sm bg-gradient-to-br from-red-500 to-red-800 p-2" onClick={() => deletionMutation({id: entryId})}>
                                    <TrashIcon width={25} className="text-gray-50"/>
                                </button>
                            </div>         
                            <form className="flex w-full flex-col justify-center gap-5" onSubmit={e => handleFormSubmit(e)}>
                                <input 
                                    required
                                    value={entryTitle}
                                    onChange={e => setEntryTitle(e.target.value)}
                                    placeholder="Название новой задачи" 
                                    className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full"/>          
                                <textarea 
                                    cols={30} 
                                    rows={20} 
                                    required
                                    value={entryContent}
                                    onChange={e => setEntryContent(e.target.value)}
                                    placeholder="Опиши свои мысли" 
                                    className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full">
                                </textarea>
                                <Slider 
                                    size="sm"
                                    step={1} 
                                    minValue={0} 
                                    maxValue={100}                                  
                                    aria-label="Вес"
                                    showTooltip={true}
                                    value={weightRating}
                                    onChange={value => setWeightRating(Number(value))}
                                    startContent={
                                        <Button
                                          isIconOnly
                                          radius="full"
                                          variant="light"
                                          onPress={() => setWeightRating(0)}>
                                          0
                                        </Button>
                                      }
                                      endContent={
                                        <Button
                                          isIconOnly
                                          radius="full"
                                          variant="light"
                                          onPress={() => setWeightRating(100)}
                                        >
                                          100
                                        </Button>
                                      }
                                      className="gap-0"/>
                                <button 
                                    type="submit" 
                                    className="font-montserrat mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-gray-50 w-full">
                                    Обновить
                                </button>
                            </form>
                            <div className="flex flex-row items-center justify-between pt-5">
                                <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                    Новая подзадача
                                </h1>
                            </div> 
                            <form className="flex w-full flex-col justify-center gap-5" onSubmit={e => handleNewChild(e)}>   
                                <input 
                                    required
                                    value={childTitle}
                                    onChange={e => setChildTitle(e.target.value)}
                                    placeholder="Название новой подзадачи" 
                                    className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full"/>
                                <textarea 
                                    cols={30} 
                                    rows={20} 
                                    required
                                    value={childContent}
                                    onChange={e => setChildContent(e.target.value)}
                                    placeholder="Новая подзадача" 
                                    className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full">
                                </textarea>
                                <Slider 
                                    size="sm"
                                    step={1} 
                                    minValue={0} 
                                    maxValue={100}                                  
                                    aria-label="Вес"
                                    showTooltip={true}
                                    value={childRating}
                                    onChange={value => setChildRating(Number(value))}
                                    startContent={
                                        <Button
                                          isIconOnly
                                          radius="full"
                                          variant="light"
                                          onPress={() => setChildRating(0)}>
                                          0
                                        </Button>
                                      }
                                      endContent={
                                        <Button
                                          isIconOnly
                                          radius="full"
                                          variant="light"
                                          onPress={() => setChildRating(100)}
                                        >
                                          100
                                        </Button>
                                      }
                                      className="gap-0"/>  
                                <button 
                                    type="submit"
                                    className="font-montserrat mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-gray-50 w-full mb-10">
                                    Добавить подзадачу
                                </button>
                            </form>
                        </div>
                    )
                }
            </section>
            : <section className="sec-container">
                {entryData !== null && (
                    <div className="mx-auto flex md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 flex-col gap-5">
                        <div className="flex flex-row items-center justify-between">
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => loadParent()}>
                                <ArrowUpLeftIcon width={25} className="text-gray-50"/>
                            </button>
                            <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                            </h1>
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => setIsEditing(true)}>
                                <PencilIcon width={25} className="text-gray-50"/>
                            </button>
                        </div>          
                        <input 
                            disabled
                            value={entryTitle}
                            className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full"/>                                       
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            className={"font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full"}>
                            {entryContent}
                        </ReactMarkdown>
                        <Slider 
                            isDisabled 
                            size="sm"
                            step={1} 
                            minValue={0} 
                            maxValue={100}                                  
                            label="Вес"
                            showTooltip={true}
                            value={weightRating}
                            className="gap-0"/>
                    </div>
                )}
                <FlipMove>
                    {childEntries.map((childEntry: Entry) => (
                        <div key={childEntry.id}>
                            <Card entry={childEntry} handleWeightChange={handleWeightChange}/>
                        </div>
                    ))}
                </FlipMove>
            </section>}
        </div>
    </>;
}

export default Entry;