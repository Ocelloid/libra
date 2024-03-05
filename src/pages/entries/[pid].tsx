import moment from "moment";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import 'moment/locale/ru';
import { TrashIcon } from "@heroicons/react/24/solid";
import { Button, Slider } from "@nextui-org/react";

moment.locale('ru')

const Entry = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace, query } = useRouter();
    const entryId = Array.isArray(query.id)? query.pid[0] : query.pid;
    const [entryContent, setEntryContent] = useState("");
    const [weightRating, setWeightRating] = useState("");

    const {data: entryData, status, isLoading} = api.weightedEntry.getEntryById.useQuery(
        {id: entryId!}, 
        {   
            enabled: entryId !== undefined,
            onSuccess: (data) => {
                setEntryContent(data.content);
                setWeightRating(data.weightRating);
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
            replace('/entries')
        }
    });

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            replace("/");
        }
    }, [sessionStatus]);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        updateMutation({ id: entryId, content: entryContent, weight: Number(weightRating) });
    };

    if (sessionStatus === "loading" || isLoading || isUpdating) { return <Loading/> }
    if (!sessionData) return;
    return <>
        <Head><title>Запись</title></Head>

        <div className="h-screen w-screen g-cover bg-center flex flex-col" 
            style={{backgroundImage: `url(/background.png)`}}
        >
            <section className="sec-container">
                {
                    entryData !== null && (
                        <div className="mx-auto flex w-1/2 flex-col gap-5 max-w-md">
                            <div className="flex flex-row items-center justify-between max-w-md">
                                <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                    {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                                </h1>
                                <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => deletionMutation({id: entryId})}>
                                    <TrashIcon width={25} className="text-gray-50"/>
                                </button>
                            </div>         
                            <form className="flex w-full flex-col justify-center gap-5 max-w-md" onSubmit={e => handleFormSubmit(e)}>                
                                <textarea 
                                    cols={30} 
                                    rows={10} 
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
                                      className="gap-0 max-w-md"/>
                                <button 
                                    type="submit" 
                                    className="font-montserrat mx-auto max-w-md whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 py-3 text-xl font-bold text-gray-50 md:w-full">
                                    Обновить
                                </button>
                            </form>
                        </div>
                    )
                }
            </section>
        </div>
    </>;
}

export default Entry;