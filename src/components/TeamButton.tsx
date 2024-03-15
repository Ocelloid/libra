import Link from "next/link";
import { type Team } from "~/server/api/routers/Team";

const TeamButton: React.FC<{team: Team}> = ({team}) => {
    return(<div>
        <Link href={`/teams/${team.id}`}>{team.title}</Link>
    </div>)
}

export default TeamButton;