import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const TeamMessages = () => {
    const { status: sessionStatus       } = useSession();
    const { data: sessionData           } = useSession();
    const { query                       } = useRouter();
    const teamId: string = (Array.isArray(query.pid) ? query.pid[0] : query.pid) ?? "";
    
    return (<div></div>)
}

export default TeamMessages;