import {useSession} from "next-auth/react";
import {useRouter} from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import NoEntries from "~/components/NoEntries";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import Link from "next/link";
import moment from "moment";
import 'moment/locale/ru';
moment.locale('ru')

const Entries = () => {
    const {status: sessionStatus} = useSession();
    const { data: sessionData } = useSession();
    const { replace } = useRouter();

    const {data: entriesData} = api.weightedEntry.getAllEntries.useQuery(
        undefined, 
        {enabled: sessionStatus === "authenticated"}
    );

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            replace("/")
        }
    }, [sessionStatus]);


    if (sessionStatus === "loading") { return <Loading/> }

    if (!sessionData) return;
    return (<>
        <Head>
            <title>Список</title>
        </Head>

        <section className="sec-container">
            {entriesData?.length === 0 
                ? <NoEntries/> 
                : entriesData?.map((entry, index) => (
                    <Link 
                        key={entry.id} 
                        href={`/entries/${entry.id}`} 
                        className="mx-auto flex w-1/2 flex-row rounded-sm bg-slate-800 p-10">
                        <div className="truncate">
                            <p className="font-montserrat text-lg text-gray-50">
                                {entry.content}
                            </p>
                            <p className="text-gray-500 font-montserrat">
                                {moment(entry.dateCreated).format("D MMMM YYYY HH:mm")}
                            </p>
                        </div>
                    </Link>
                ))
            }
        </section>
    </>);
}

export default Entries;