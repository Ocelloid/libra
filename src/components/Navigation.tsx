import Link from "next/link";
import {XMarkIcon, ScaleIcon} from "@heroicons/react/24/outline";
import {useState} from "react";
import {signOut, useSession} from "next-auth/react";
import { useTranslation } from 'next-i18next';
import {
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
    User,
    useDisclosure,
    Chip
} from "@nextui-org/react";
import SeeInvitesModal from "./modals/seeInvites";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

const Navigation = () => {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();    
    const {data: sessionData} = useSession();       
    const {
        isOpen: isInvitesOpen, 
        onOpen: onInvitesOpen, 
        onOpenChange: onInvitesOpenChange } = useDisclosure();   
    const { t, i18n } = useTranslation(['ru', 'en']);

    const {data: userInvites, refetch} = api.Team.countAllInvitations.useQuery(undefined, {refetchInterval: 5000});

    const pathOpen = (pathname: string) => {
        void router.replace(`${i18n.language === router.defaultLocale ? "" : i18n.language}/${pathname}`)
    }

    if (sessionData) return (
        <nav className="flex flex-col md:flex-row absolute left-0 top-0 z-10 w-full items-center justify-between gap-8 p-7 backdrop-blur-md bg-transparent md:fixed md:gap-0">
            <SeeInvitesModal isOpen={isInvitesOpen} onOpenChange={onInvitesOpenChange} onRefetch={refetch}/>
            <div className="flex w-full items-center justify-between dark:text-neutral-100 font-poppins font-bold lowercase tracking-tight md:text-4xl">
                <Link href="/" className="dark:hover:text-gray-300 hover:text-gray-700">Libra</Link>
                <div className="md:hidden flex" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <XMarkIcon width={30}/> : <ScaleIcon width={30}/>}
                </div>
            </div>
            <ul className={`flex flex-col gap-8 md:flex-row dark:text-neutral-100 font-montserrat items-right mr-auto md:justify-end md:gap-10 ${!isOpen && "hidden md:flex"}`}>
                <Button onClick={() => {setIsOpen(false); pathOpen("tasks")}} variant="bordered" className="w-min dark:hover:text-gray-300 hover:text-gray-700 border-none font-montserrat text-medium py-2 px-4">
                    {t('common:personal_tasks')}
                </Button>       
                <Button onClick={() => {setIsOpen(false); pathOpen("teams")}} variant="bordered" className="w-min dark:hover:text-gray-300 hover:text-gray-700 border-none font-montserrat text-medium py-2 px-4">
                    {t('common:teams')}
                </Button>    
                {!!userInvites && <Button variant="bordered" onClick={onInvitesOpen} className="w-min dark:hover:text-gray-300 hover:text-gray-700 border-none font-montserrat text-medium py-0 px-4 md:hidden">
                    {t('common:invites')} <Chip size="sm" variant="flat" color="warning">{userInvites}</Chip>
                </Button>}    
                <Button onClick={() => {setIsOpen(false); pathOpen("settings")}} variant="bordered" className="w-min dark:hover:text-gray-300 hover:text-gray-700 border-none font-montserrat text-medium py-2 px-4 md:hidden">
                    {t('common:settings')}
                </Button>    
                <Button onClick={() => {setIsOpen(false); void signOut();}} variant="bordered" className="w-min text-red-500 border-none font-montserrat text-medium py-0 px-4 md:hidden">
                    {t('common:logout')}
                </Button>  
                <Dropdown>
                    <DropdownTrigger>    
                        <div className="flex relative">          
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
                                {!!userInvites && <Chip size="sm" variant="solid" color="warning"
                                    className="absolute left-6 top-6">
                                    {userInvites}
                                </Chip>}   
                        </div>         
                    </DropdownTrigger>
                    <DropdownMenu aria-label="acconut_actions" 
                        disabledKeys={!userInvites ? ["invitations"] : []}
                        itemClasses={{
                            title: ["font-montserrat", "text-medium", "dark:hover:text-gray-300", "hover:text-gray-700"],
                            base: ["bg-transparent", "hover:bg-transparent", "dark:text-neutral-100"]
                        }}>
                        <DropdownItem key="invitations" onClick={onInvitesOpen}
                            endContent={!!userInvites && <Chip size="sm" variant="solid" color="warning">{userInvites}</Chip>}>
                            {t('common:invites')} 
                        </DropdownItem>
                        <DropdownItem key="settings" onClick={() => pathOpen("settings")}>{t('common:settings')} </DropdownItem>
                        <DropdownItem key="exit"     className="text-danger" color="danger" onClick={() => signOut()}>
                            {t('common:logout')}
                        </DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </ul>
        </nav>
    )
}

// export const getServerSideProps: GetServerSideProps = async ({ locale }) => {  
//     return {
//       props: {
//         ...(await serverSideTranslations(locale ?? "en", ["common"])),
//       },
//     };
//   };

export default Navigation;