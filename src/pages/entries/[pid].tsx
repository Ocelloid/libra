import moment from "moment";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import 'moment/locale/ru';
import { TrashIcon } from "@heroicons/react/24/solid";

moment.locale('ru')

const Entry = () => {
    const {status: sessionStatus} = useSession();
    const { data: sessionData } = useSession();
    const { replace, query } = useRouter();
    const entryId = Array.isArray(query.id)? query.pid[0] : query.pid;

    const {data: entryData, status, isLoading} = api.weightedEntry.getEntryById.useQuery(
        {id: entryId!}, 
        {enabled: entryId !== undefined} 
    );

    const {mutate: deletionMutation} = api.weightedEntry.deleteEntry.useMutation({
        onSuccess() {
            replace('/entries')
        }
    });

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            replace("/");
        }
    }, [sessionStatus]);

    if (sessionStatus === "loading" || isLoading) { return <Loading/> }

    if (!sessionData) return;
    return <>
        <Head><title>Запись</title></Head>
        <section className="sec-container">
            {
                entryData !== null && (
                    <div className="mx-auto flex w-1/2 flex-col gap-5">
                        <div className="flex flex-row items-center justify-between">
                            <h1 className="font-montserrat text-3xl font-extrabold text-gray-50">
                                {moment(entryData?.dateCreated).format("D MMMM YYYY HH:mm")}
                            </h1>
                            <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2" onClick={() => deletionMutation({id: entryId})}>
                                <TrashIcon width={25} className="text-gray-50"/>
                            </button>
                        </div>

                        <p className="whitespace-pre-line bg-gray-900 font-montserrat text-lg text-gray-50 p-5">
                            {entryData?.content}
                        </p>
                    </div>
                )
            }
        </section>
    </>;
}

export default Entry;