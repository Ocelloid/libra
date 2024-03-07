import moment from "moment";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import 'moment/locale/ru';
import { ArrowUpLeftIcon, PencilIcon, PlusCircleIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Slider, Tooltip, useDisclosure } from "@nextui-org/react";
import { type WeightedEntry } from "~/server/api/routers/weightedentry";
import FlipMove from "react-flip-move";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Card from "~/components/Card";

moment.locale('ru')

const Entry = () => {
    const { status: sessionStatus       } = useSession();
    const { data: sessionData           } = useSession();
    const { replace, query              } = useRouter();

    const entryId: string = (Array.isArray(query.pid) ? query.pid[0] : query.pid) ?? "";

    const {isOpen, onOpen, onOpenChange } = useDisclosure();

    const [parentId,     setParentId    ] = useState<string>("");
    const [entryUserId,  setEntryUserId ] = useState<string>("");
    const [entryTitle,   setEntryTitle  ] = useState<string>("");
    const [entryContent, setEntryContent] = useState<string>("");
    const [weightRating, setWeightRating] = useState<number>(50);
    const [inputValue,   setInputValue  ] = useState<string>("50");
    const [editingValue, setEditingValue] = useState<string>("50");

    const [childTitle,   setChildTitle  ] = useState<string>("");
    const [childContent, setChildContent] = useState<string>("");
    const [childRating,  setChildRating ] = useState<number>(50);

    const [childEntries, setChildEntries] = useState<WeightedEntry[]>([]);

    const [isEditing,    setIsEditing   ] = useState<boolean>(false);
    const [isAdding,     setIsAdding    ] = useState<boolean>(false);

    const {data: entryData, isLoading} = api.weightedEntry.getEntryById.useQuery(
        {id: entryId}, 
        {   
            enabled: (entryId !== undefined && entryId!== ""),
            onSuccess: (data: WeightedEntry) => {
                setParentId(data.parentId);
                setEntryUserId(data.userId);
                setEntryTitle(data.title);
                setEntryContent(data.content);
                setWeightRating(data.weightRating);
                setEditingValue(data.weightRating.toString());
            }
        }
    );

    api.weightedEntry.getChildEntriesById.useQuery(
        { parentId: entryId },
        {
            enabled: (entryId !== undefined && entryId !== ""),
            onSuccess: (data: WeightedEntry[]) => {
                setChildEntries(data.sort((a, b) => b.weightRating - a.weightRating));
            }
        }
    );

    const {mutate: deletionMutation} = api.weightedEntry.deleteEntry.useMutation({
        onSuccess() {
            void replace('/entries')
        }
    });

    const { mutate: updateMutation } = api.weightedEntry.updateEntry.useMutation({
        onSuccess() {
            setIsEditing(false);
        }
    });

    const { mutate: childMutation } = api.weightedEntry.createChild.useMutation({
        onSuccess(newEntry) {
            const newChildEntries: WeightedEntry[] = [
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
            setIsAdding(false);
            setChildTitle("");
            setChildContent("");
            setChildRating(50);
        }
    });

    const { mutate: updateEntryMutation } = api.weightedEntry.updateEntryWeight.useMutation();

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            void replace("/");
        }
    }, [replace, sessionStatus]);

    const loadParent = () => {
        if (!!parentId) void replace(`${parentId}`);
        else void replace("/entries");
    }

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (isEditing && !!entryTitle && !!entryContent) handleFormSubmit();
            else if (isAdding && !!childTitle && !!childContent) handleNewChild();
        };
    }

    const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        updateMutation({ id: entryId, content: entryContent, title: entryTitle, weight: weightRating });
    };

    const handleNewChild = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        childMutation({content: childContent, title: childTitle, weight: childRating, parentId: entryId});
    }

    const handleWeightChange = (entryId: string, weight: number, commit: boolean | undefined) => {
        if (isNaN(Number(weight))) return;

        const newEntries: WeightedEntry[] = childEntries.map((entry) => {
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

    if (sessionStatus === "loading" || isLoading) { return <Loading/> }
    if (!sessionData) return;
    return <>
        <Head><title>Задача</title></Head>

        <div className="h-screen w-screen g-cover bg-center flex flex-col overflow-x-hidden overflow-y-auto" 
            style={{backgroundImage: `url(/background.png)`}}
        >
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent className="font-montserrat">
                {(onClose) => (
                    <>
                    <ModalHeader className="flex flex-col gap-1">Удалить задачу?</ModalHeader>
                    <ModalBody>
                        Эта задача будет удалена.<br/>
                        Вы действительно хотите удалить её?<br/>
                        Все подзадачи будут удалены вместе с ней.
                    </ModalBody>
                    <ModalFooter>
                        <Button color="secondary" variant="light" onPress={() => onClose()} className="font-montserrat mr-auto">
                        Отмена
                        </Button>
                        <Button color="danger" onPress={() => {deletionMutation({id: entryId}); onClose();}} className="font-montserrat">
                        Подтвердить
                        </Button>
                    </ModalFooter>
                    </>
                )}
                </ModalContent>
            </Modal>
            {isEditing ? <section className="sec-container">
                {entryData !== null && (
                    <div className="mx-auto flex md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 flex-col gap-5">
                        <div className="flex flex-row items-center justify-between">
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2 mr-auto hover:from-gray-700" onClick={() => setIsEditing(false)}>
                                <ArrowUpLeftIcon width={25} className="text-neutral-100"/>
                            </button>
                            <h1 className="font-montserrat text-3xl font-extrabold text-neutral-100">
                                {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                            </h1>
                            <button className="rounded-sm bg-gradient-to-br from-red-500 to-red-800 p-2 ml-auto mr-2 hover:from-red-500" onClick={() => onOpen()}>
                                <TrashIcon width={25} className="text-neutral-100"/>
                            </button>
                            <button className="rounded-sm bg-gradient-to-br from-gray-500 to-gray-800 p-2 hover:from-gray-500" onClick={() => {setIsAdding(true); setIsEditing(false)}}>
                                <PlusCircleIcon width={25} className="text-neutral-100"/>
                            </button>
                        </div>         
                        <form className="flex w-full flex-col justify-center gap-5" onSubmit={e => handleFormSubmit(e)} onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }}>
                            <input 
                                required
                                value={entryTitle}
                                onKeyDown={e => onCtrlEnterPress(e)}
                                onChange={e => setEntryTitle(e.target.value)}
                                placeholder="Название новой задачи" 
                                className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full"/>          
                            <textarea 
                                cols={30} 
                                rows={20} 
                                required
                                value={entryContent}
                                onKeyDown={e => onCtrlEnterPress(e)}
                                onChange={e => setEntryContent(e.target.value)}
                                placeholder="Опиши свои мысли" 
                                className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full">
                            </textarea>
                            <Slider 
                                size="sm"
                                step={1} 
                                minValue={0} 
                                maxValue={100}                               
                                label="Вес:&nbsp;"
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
                                        onPress={() => setWeightRating(100)}>
                                        100
                                    </Button>
                                }                       
                                renderValue={(...props) => (
                                    <output {...props}>
                                        <Tooltip
                                            className="text-tiny text-default-500 rounded-md"
                                            content="Нажми Enter чтобы применить"
                                            placement="left">
                                        <input
                                            className="px-1 py-0.5 w-10 my-1 text-center text-medium font-montserrat text-gray-500 font-medium bg-slate-800 outline-none transition-colors rounded-small border-medium border-transparent hover:border-primary focus:border-primary bg-transparent"
                                            type="text"
                                            aria-label="Вес"
                                            value={editingValue}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setEditingValue(v);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !isNaN(Number(editingValue))) {
                                                    setWeightRating(Number(editingValue));
                                                }
                                            }}/>
                                        </Tooltip>
                                    </output>
                                )}                                 
                                color="foreground"
                                classNames={{
                                    label: "ml-auto text-medium text-gray-500 font-montserrat",
                                    value: "text-medium text-gray-500 font-montserrat",
                                    filler: "bg-neutral-100 hover:bg-gray-300",
                                    thumb: "bg-neutral-100 hover:bg-gray-300"
                                }}
                                className="gap-0"/>
                            <button 
                                type="submit" 
                                className="font-montserrat mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-neutral-100 w-full">
                                Обновить
                            </button>
                        </form>                            
                    </div>
                )}
            </section>
            : isAdding ? <section className="sec-container">
                <div className="mx-auto flex md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 flex-col gap-5">
                    <div className="flex flex-row items-center justify-between">
                        <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2 hover:from-gray-700" onClick={() => setIsAdding(false)}>
                            <ArrowUpLeftIcon width={25} className="text-neutral-100"/>
                        </button>
                        <h1 className="font-montserrat text-3xl font-extrabold text-neutral-100 mx-auto">
                            Новая подзадача
                        </h1>
                    </div> 
                    <form className="flex w-full flex-col justify-center gap-5" onSubmit={e => handleNewChild(e)} onKeyPress={(e) => { e.key === 'Enter' && e.preventDefault(); }}>   
                        <input 
                            required
                            value={childTitle}
                            onChange={e => setChildTitle(e.target.value)}
                            onKeyDown={e => onCtrlEnterPress(e)}
                            placeholder="Название новой подзадачи" 
                            className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full"/>
                        <textarea 
                            cols={30} 
                            rows={20} 
                            required
                            value={childContent}
                            onChange={e => setChildContent(e.target.value)}
                            onKeyDown={e => onCtrlEnterPress(e)}
                            placeholder="Новая подзадача" 
                            className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full">
                        </textarea>
                        <Slider 
                            size="sm"
                            step={1} 
                            minValue={0} 
                            maxValue={100}                                  
                            label="Вес:&nbsp;"
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
                                    onPress={() => setChildRating(100)}>
                                    100
                                </Button>
                            }         
                            renderValue={(...props) => (
                                <output {...props}>
                                    <Tooltip
                                        className="text-tiny text-default-500 rounded-md"
                                        content="Нажми Enter чтобы применить"
                                        placement="left">
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
                                                setChildRating(Number(inputValue));
                                            }
                                        }}/>
                                    </Tooltip>
                                </output>
                            )}    
                            color="foreground"
                            classNames={{
                                label: "ml-auto text-medium text-gray-500 font-montserrat",
                                value: "text-medium text-gray-500 font-montserrat",
                                filler: "bg-neutral-100 hover:bg-gray-300",
                                thumb: "bg-neutral-100 hover:bg-gray-300"
                            }}
                            className="gap-0"/>  
                        <button 
                            type="submit"
                            className="font-montserrat mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-neutral-100 w-full mb-10">
                            Добавить подзадачу
                        </button>
                    </form>
                </div>
            </section> 
            : <section className="sec-container">
                {entryData !== null && (
                    <div className="mx-auto flex md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 flex-col gap-5" onDoubleClick={() => setIsEditing(true)}>
                        <div className="flex flex-row items-center justify-between">
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2 mr-auto hover:from-gray-700" onClick={() => loadParent()}>
                                <ArrowUpLeftIcon width={25} className="text-neutral-100"/>
                            </button>
                            <h1 className="font-montserrat text-3xl font-extrabold text-neutral-100">
                                {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                            </h1>
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2 ml-auto mr-2 hover:from-gray-700" onClick={() => setIsEditing(true)}>
                                <PencilIcon width={25} className="text-neutral-100"/>
                            </button>                            
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2 hover:from-gray-700" onClick={() => setIsAdding(true)}>
                                <PlusCircleIcon width={25} className="text-neutral-100"/>
                            </button>
                        </div>          
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            className="font-montserrat mx-auto rounded-sm border border-transparent bg-transparent p-5 tracking-wide w-full">           
                            {entryTitle}
                        </ReactMarkdown>
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
                            label="Вес:&nbsp;"
                            showTooltip={true}
                            value={weightRating}
                            color="foreground"
                            classNames={{
                                label: "ml-auto text-medium text-gray-500 font-montserrat",
                                value: "text-medium text-gray-500 font-montserrat",
                                filler: "bg-neutral-100 hover:bg-gray-300",
                                thumb: "bg-neutral-100 hover:bg-gray-300"
                            }}
                            className="gap-0"/>
                    </div>
                )}
                <FlipMove>
                    {childEntries.map((childEntry: WeightedEntry) => (
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