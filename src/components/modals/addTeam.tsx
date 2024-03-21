import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tooltip} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { useState } from "react";
import { api } from "~/utils/api";
import { ReactMultiEmail } from 'react-multi-email';
import { useSession } from "next-auth/react";
import { useTranslation } from 'next-i18next';
moment.locale('ru')

const AddTeamModal: React.FC<{
        isOpen: boolean | undefined,
        onOpenChange: () => void,
        onRefetch:() => void,
}> = ({isOpen, onOpenChange, onRefetch}) => {  
    const { data: sessionData                 } = useSession();
    const [teamTitle,   setTeamTitle          ] = useState<string>("");
    const [teamDescription, setTeamDescription] = useState<string>("");
    const [emails, setEmails                  ] = useState<string[]>([sessionData?.user?.email ?? ""]);
    const [userErrorOpen, setUserErrorOpen    ] = useState<boolean>(false);
    const { t } = useTranslation(['ru', 'en']);

    
    const { mutate: createMutation } = api.Team.createTeam.useMutation();
    const getUserMutation = api.User.getUserByEmail.useMutation();

    const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        createMutation({
             title: teamTitle, description: teamDescription, userEmails: emails 
            }, {
                onSuccess() {
                    resetForm();
                }
        });
    };

    const resetForm = () => {
        setTeamTitle("");
        setTeamDescription("");
        setEmails([sessionData?.user?.email ?? ""]);
        setUserErrorOpen(false);
    }

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (teamTitle && !!teamDescription) {
                handleFormSubmit();
                onRefetch();
            }
        };
    } 

    const handleEmailsChange = (newEmails: string[]) => {
        if (newEmails.length < emails.length) {
            setEmails(newEmails);
            return;
        }

        getUserMutation.mutateAsync({email: newEmails[newEmails.length - 1] ?? ""}).then((user) => {
            if (!!user) {
                setEmails(newEmails);
            } else {
                newEmails.pop();
                setEmails(newEmails);
                setUserErrorOpen(true);
            }
        }).catch(() => {
            setUserErrorOpen(true);
        });
    }

    return(            
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange}
            size="2xl" 
            placement="top-center" 
            backdrop="blur"
            classNames={{
                body: "py-6",
                base: "bg-slate-800 bg-opacity-60 text-neutral-100",
                closeButton: "hover:bg-white/5 active:bg-white/10 w-12 h-12 p-4",
            }}>
            <ModalContent className="font-montserrat">
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex flex-row items-center justify-between">
                                <h3 className="font-montserrat text-neutral-100">
                                    {t('common:add_team')}
                                </h3>
                            </div>         
                        </ModalHeader>
                        <ModalBody className="py-0">
                            <form className="flex w-full flex-col justify-center gap-2" 
                                onSubmit={e => handleFormSubmit(e)}>
                                <div className="flex flex-row gap-2">
                                    <input 
                                        required
                                        value={teamTitle}
                                        onKeyDown={e => onCtrlEnterPress(e)}
                                        onChange={e => setTeamTitle(e.target.value)}
                                        placeholder={t('common:team_name')}
                                        className="font-montserrat mx-auto rounded-sm border-slate-800 bg-gray-800 bg-opacity-60 p-2 tracking-wide w-full"/>                                                   
                                </div>   
                                <textarea 
                                    cols={30} 
                                    rows={3} 
                                    required
                                    value={teamDescription}
                                    onKeyDown={e => onCtrlEnterPress(e)}
                                    onChange={e => setTeamDescription(e.target.value)}
                                    placeholder={t('common:describe_team')} 
                                    className={`font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 bg-opacity-60 p-2 tracking-wide w-full`}>
                                </textarea>                 
                                <ReactMultiEmail
                                    placeholder='email'
                                    emails={emails}
                                    onChange={handleEmailsChange}
                                    getLabel={(email, index, removeEmail) => {
                                        return (
                                            <div data-tag key={index}>
                                            <div data-tag-item>{email}</div>
                                            {index > 0 && <span data-tag-handle onClick={() => removeEmail(index)}>
                                                ×
                                            </span>}
                                            </div>
                                        );
                                    }}
                                />                                    
                                <Tooltip
                                    isOpen={userErrorOpen}
                                    closeDelay={2000}
                                    placement="bottom"
                                    onOpenChange={(open) => setUserErrorOpen(open)}                                
                                    classNames={{
                                        content: [
                                        "py-2 px-4 shadow-xl",
                                        "text-neutral-100 bg-gradient-to-br from-red-700 to-red-500",
                                        ],
                                    }}
                                    content={t('common:user_not_found')}>
                                    <div></div>
                                </Tooltip>
                            </form>           
                        </ModalBody>
                        <ModalFooter>
                            <Button color="secondary" variant="light" onPress={() => {onRefetch(); resetForm(); onClose();}} className="font-montserrat mr-auto">
                                {t('common:cancel')}
                            </Button>
                            <Button 
                                isDisabled={!teamTitle || !teamDescription || !emails.length} 
                                color="primary" 
                                onPress={() => {handleFormSubmit(); onRefetch(); resetForm(); onClose();}} 
                                className="font-montserrat">
                                {t('common:add')}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export default AddTeamModal;