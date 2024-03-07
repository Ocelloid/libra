import Link from "next/link";
import {XMarkIcon} from "@heroicons/react/24/solid";
import {ScaleIcon} from "@heroicons/react/24/outline";
import {useState} from "react";
import {signOut, useSession} from "next-auth/react";
import { Tooltip } from "@nextui-org/react";

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const {data: sessionData} = useSession();

    if (sessionData) return (
        <nav className="flex flex-col md:flex-row absolute left-0 top-0 z-10 w-full items-center justify-between gap-8 p-7 backdrop-blur-md bg-transparent md:fixed md:gap-0">
            <div className="flex w-full items-center justify-between text-neutral-100 font-poppins font-bold lowercase tracking-tight md:text-4xl">
                <Link href="/" className="hover:text-gray-300">Libra</Link>
                <div className="md:hidden flex" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <XMarkIcon width={30}/> : <ScaleIcon width={30}/>}
                </div>
            </div>
            <ul className={`flex flex-col gap-8 md:flex-row text-neutral-100 font-montserrat items-center md:justify-end md:gap-20 ${!isOpen && "hidden md:flex"}`}>
                <Link href="/entries" className="hover:text-gray-300">Список</Link>
                <Link href="/write" className="hover:text-gray-300">Добавить</Link>
                    <Tooltip
                        className="text-tiny text-default-500 rounded-md"
                        content={`Вы зашли как ${sessionData.user?.name}`}
                        placement="bottom">
                    <button className="w-min hover:text-gray-300" onClick={() => void signOut()}>
                        Выйти
                    </button>
                </Tooltip>
            </ul>
        </nav>
    )
}

export default Navigation;