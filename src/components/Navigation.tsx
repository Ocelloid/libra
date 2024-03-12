import Link from "next/link";
import {XMarkIcon, ScaleIcon} from "@heroicons/react/24/outline";
import {useState} from "react";
import {signOut, useSession} from "next-auth/react";
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
    User
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
            <ul className={`flex flex-col gap-8 md:flex-row text-neutral-100 font-montserrat items-right mr-auto md:justify-end md:gap-10 ${!isOpen && "hidden md:flex"}`}>
                <Button variant="bordered" className="w-min hover:text-gray-300 border-none font-montserrat text-medium py-0 px-2">
                    <Link href="/entries" className="p-2">Личные задачи</Link>
                </Button>       
                <Button variant="bordered" className="w-min hover:text-gray-300 border-none font-montserrat text-medium py-0 px-2">
                    <Link href="/teams" className="p-2">Команды</Link>
                </Button>    
                <Button variant="bordered" className="w-min hover:text-gray-300 border-none font-montserrat text-medium py-0 px-2 md:hidden">
                    <Link href="/settings" className="p-2">Настройки</Link>
                </Button>    
                <Button variant="bordered" className="w-min text-red-500 border-none font-montserrat text-medium py-0 px-4 md:hidden" onClick={() => void signOut()}>
                    Выйти
                </Button>  
                <Dropdown>
                    <DropdownTrigger>                        
                        <User
                            as="button"
                            avatarProps={{
                                isBordered: true,
                                size: "sm",
                                className: "w-10 h-8",
                                src: sessionData.user.image ?? "",
                            }}
                            className="hover:text-gray-300 border-none font-montserrat text-medium hidden md:flex"
                            name={sessionData.user.name}/>
                    </DropdownTrigger>
                    <DropdownMenu aria-label="Действия с аккаунтом" 
                        itemClasses={{
                            title: ["font-montserrat", "text-medium", "hover:text-gray-300"],
                            base: ["bg-transparent", "hover:bg-transparent", "text-neutral-100"]
                        }}>
                        <DropdownItem key="settings" href="/settings">Настройки</DropdownItem>
                        <DropdownItem key="exit"     className="text-danger" color="danger" onClick={() => void signOut()}>
                            Выйти
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </ul>
        </nav>
    )
}

export default Navigation;