import moment from "moment";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import 'moment/locale/ru';
import { BackwardIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button, Slider } from "@nextui-org/react";
import type { Entry } from "~/server/api/routers/weightedentry";
import FlipMove from "react-flip-move";
import Card from "~/components/Card";

moment.locale('ru')

const Entry = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace, query } = useRouter();
    const entryId: string = Array.isArray(query.id) ? query.pid[0] : query.pid;

    const [parentId,     setParentId]     = useState<string>("");
    const [entryUserId,  setEntryUserId]  = useState<string>("");
    const [entryContent, setEntryContent] = useState<string>("");
    const [weightRating, setWeightRating] = useState<number>(50);
    const [childContent, setChildContent] = useState<string>("");
    const [childRating,  setChildRating]  = useState<number>(50);
    const [childEntries, setChildEntries] = useState<Entry[]>([]);
    const [isEditing,    setIsEditing]    = useState<boolean>(false);

    const {data: entryData, status, isLoading} = api.weightedEntry.getEntryById.useQuery(
        {id: entryId}, 
        {   
            enabled: entryId !== undefined,
            onSuccess: (data: Entry) => {
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
                setChildEntries(data);
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
                    content: childContent,
                    weightRating: childRating,
                    userId: entryUserId,
                    dateCreated: new Date()
                }
            ];
            setChildEntries(newChildEntries);
            setIsEditing(false);
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
        updateMutation({ id: entryId, content: entryContent, weight: weightRating });
    };

    const handleNewChild = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        childMutation({content: childContent, weight: childRating, parentId: entryId});
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
        <Head><title>Запись</title></Head>

        <div className="h-screen w-screen g-cover bg-center flex flex-col" 
            style={{backgroundImage: `url(/background.png)`}}
        >
            {isEditing ? <section className="sec-container">
                {
                    entryData !== null && (
                        <div className="mx-auto flex w-1/2 flex-col gap-5 max-w-md">
                            <div className="flex flex-row items-center justify-between max-w-md">
                                <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => setIsEditing(false)}>
                                    <BackwardIcon width={25} className="text-gray-50"/>
                                </button>
                                <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                    {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                                </h1>
                                <button className="rounded-sm bg-gradient-to-br from-red-500 to-red-800 p-2" onClick={() => deletionMutation({id: entryId})}>
                                    <TrashIcon width={25} className="text-gray-50"/>
                                </button>
                            </div>         
                            <form className="flex w-full flex-col justify-center gap-5 max-w-md" onSubmit={e => handleFormSubmit(e)}>                
                                <textarea 
                                    cols={30} 
                                    rows={3} 
                                    required
                                    value={entryContent}
                                    onChange={value => setEntryContent(value.target.value)}
                                    placeholder="Опиши свои мысли" 
                                    className="font-montserrat max-w-md mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full">
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
                                      className="gap-0 max-w-md"/>
                                <button 
                                    type="submit" 
                                    className="font-montserrat mx-auto max-w-md whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-gray-50 md:w-full">
                                    Обновить
                                </button>
                            </form>
                            <div className="flex flex-row items-center justify-between max-w-md pt-10">
                                <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                    Новая подзадача
                                </h1>
                            </div> 
                            <form className="flex w-full flex-col justify-center gap-5 max-w-md" onSubmit={e => handleNewChild(e)}>   
                                <textarea 
                                    cols={30} 
                                    rows={3} 
                                    required
                                    value={childContent}
                                    onChange={value => setChildContent(value.target.value)}
                                    placeholder="Новая подзадача" 
                                    className="font-montserrat max-w-md mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full">
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
                                      className="gap-0 max-w-md"/>  
                                <button 
                                    type="submit"
                                    className="font-montserrat mx-auto max-w-md whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-gray-50 md:w-full">
                                    Добавить подзадачу
                                </button>
                            </form>
                        </div>
                    )
                }
            </section>
            : <section className="sec-container">
                {entryData !== null && (
                    <div className="mx-auto flex md:w-1/2 flex-col gap-5 max-w-md w-full max-w-full">
                        <div className="flex flex-row items-center justify-between max-w-md">
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => loadParent()}>
                                <BackwardIcon width={25} className="text-gray-50"/>
                            </button>
                            <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                            </h1>
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => setIsEditing(true)}>
                                <PencilIcon width={25} className="text-gray-50"/>
                            </button>
                        </div>                      
                        <textarea 
                            cols={30} 
                            rows={3} 
                            disabled
                            value={entryContent}
                            placeholder="Опиши свои мысли" 
                            className="font-montserrat max-w-md mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full">
                        </textarea>
                        <Slider 
                            isDisabled 
                            size="sm"
                            step={1} 
                            minValue={0} 
                            maxValue={100}                                  
                            label="Вес"
                            showTooltip={true}
                            value={weightRating}
                            className="gap-0 max-w-md"/>
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