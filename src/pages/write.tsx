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
    const [weightRating, setWeightRating] = useState("50");

    const { mutate: createEntry, status, isLoading } = api.weightedEntry.createEntry.useMutation({
        onSuccess(data) {
            replace(`/entries/${data.id}`)
        }
    });

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            replace("/");
        }
    }, [sessionStatus]);

    if (sessionStatus === "loading" || isLoading) { return <Loading/> }

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        createEntry({ content: entryContent, weight: Number(weightRating) });
    };

    if (!sessionData) return;
    return (
        <>
            <Head>
                <title>Новая запись</title>
            </Head>
            <div className="h-screen w-screen g-cover bg-center flex flex-col" 
                style={{backgroundImage: `url(/background.png)`}}
            >
                <section className="sec-container ">
                    <h1 className="text-center font-montserrat text-4xl font-bold text-neutral-50">Новая запись</h1>
                    <form className="flex w-full flex-col justify-center gap-5" onSubmit={e => handleFormSubmit(e)}>
                        <textarea 
                            cols={30} 
                            rows={10} 
                            required
                            value={entryContent}
                            onChange={value => setEntryContent(value.target.value)}
                            placeholder="Опиши свои мысли" 
                            className="font-montserrat mx-auto max-w-md rounded-sm border border-slate-800 bg-gray-800 p-5 tracking-wide md:w-1/2">
                        </textarea>
                        <Slider 
                            size="sm"
                            step={1} 
                            minValue={0} 
                            maxValue={100}                                  
                            aria-label="Вес"
                            showTooltip={true}
                            value={weightRating}
                            onChange={value => setWeightRating(value)}
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
                            className="max-w-md mx-auto gap-0"/>
                        <button 
                            type="submit" 
                            className="font-montserrat mx-auto max-w-md w-2/3 whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-gray-50 md:w-1/2">
                            Отправить
                        </button>
                    </form>
                </section>
            </div>
        </>
    )
}

export default Write;