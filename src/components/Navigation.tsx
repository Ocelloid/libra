import Link from "next/link";
//import {PlusCircleIcon, XMarkIcon} from "@heroicons/react/24/solid";
import {PlusCircleIcon, XMarkIcon, ScaleIcon} from "@heroicons/react/24/outline";
import {useState} from "react";
import {signOut, useSession} from "next-auth/react";
import {
    Tooltip,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownSection,
    DropdownItem,
    Button
  } from "@nextui-org/react";

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
            <ul className={`flex flex-col gap-8 md:flex-row text-neutral-100 font-montserrat items-center md:justify-end md:gap-10 ${!isOpen && "hidden md:flex"}`}>                          
                    {/* <Button variant="bordered" className="rounded-full border-none p-0">
                        <Link href="/write" className="p-2"><PlusCircleIcon width={25} className="text-neutral-100"/></Link> 
                    </Button> */}
                    <Button variant="bordered" className="w-min hover:text-gray-300 border-none font-montserrat text-medium p-0">
                        <Link href="/entries" className="p-2">Список</Link>
                    </Button>       
                    <Button variant="bordered" className="w-min hover:text-gray-300 border-none font-montserrat text-medium p-0">
                        <Link href="/write" className="p-2">Добавить</Link>   
                    </Button>       
                <Dropdown>
                    <DropdownTrigger>
                        <Button variant="bordered" className="w-min hover:text-gray-300 border-none font-montserrat text-medium">
                            {sessionData.user?.name}
                        </Button>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Static Actions">
                        <DropdownItem key="settings" href="/settings">Настройки</DropdownItem>
                        <DropdownItem key="teams" href="/teams">Команды</DropdownItem>
                        <DropdownItem key="exit" className="text-danger" color="danger" onClick={() => void signOut()}>
                            Выйти
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </ul>
        </nav>
    )
}

export default Navigation;