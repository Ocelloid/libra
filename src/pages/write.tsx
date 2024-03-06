import { Button, Slider } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import Head from "next/head"
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";

const Write = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace } = useRouter();

    const [entryContent, setEntryContent] = useState("");
    const [entryTitle,   setEntryTitle]   = useState("");
    const [weightRating, setWeightRating] = useState(50);

    const { mutate: createEntry, isLoading } = api.weightedEntry.createEntry.useMutation({
        onSuccess(data) {
            void replace(`/entries/${data.id}`)
        }
    });

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            void replace("/");
        }
    }, [replace, sessionStatus]);

    if (sessionStatus === "loading" || isLoading) { return <Loading/> }

    const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        createEntry({ content: entryContent, title: entryTitle, weight: Number(weightRating) });
    };

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (!!entryTitle && !!entryContent) handleFormSubmit();
        };
    }

    if (!sessionData) return;
    return (
        <>
            <Head>
                <title>Новая задача</title>
            </Head>
            <div className="h-screen w-screen g-cover bg-center flex flex-col overflow-x-hidden overflow-y-auto" 
                style={{backgroundImage: `url(/background.png)`}}
            >
                <section className="sec-container">
                    <div className="mx-auto flex md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 flex-col gap-5">
                        <form className="flex w-full flex-col justify-center gap-5" onSubmit={e => handleFormSubmit(e)}>
                            <input 
                                required
                                value={entryTitle}
                                onKeyDown={e => onCtrlEnterPress(e)}
                                onChange={e => setEntryTitle(e.target.value)}
                                placeholder="Название новой задачи" 
                                className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide w-full"/>
                            <textarea 
                                cols={30} 
                                rows={10} 
                                required
                                value={entryContent}
                                onKeyDown={e => onCtrlEnterPress(e)}
                                onChange={value => setEntryContent(value.target.value)}
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
                                className="mx-auto"/>
                            <button 
                                type="submit" 
                                className="font-montserrat mx-auto w-full whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-gray-50">
                                Отправить
                            </button>
                        </form>
                    </div>
                </section>
            </div>
        </>
    )
}

export default Write;