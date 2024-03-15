import { Button, Modal, ModalBody, ModalContent, ModalHeader} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { useState } from "react";
import { api } from "~/utils/api";
import { type Membership } from "~/server/api/routers/Team";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
moment.locale('ru')

interface ConfirmedMembership extends Membership {
    confirmAccept?: boolean;
    confirmDecline?: boolean;
}

const SeeInvitesModal: React.FC<{
        isOpen: boolean | undefined,
        onOpenChange: () => void,
        onRefetch: () => void,
}> = ({isOpen, onOpenChange, onRefetch}) => {  
    const [ invites, setInvites ] = useState<ConfirmedMembership[]>([]);    

    const { mutate: membershipMutation } = api.Team.respondToInvitation.useMutation();

    const { refetch } = api.Team.getAllInvitations.useQuery(
        undefined, 
        {
            onSuccess: (data: Membership[]) => {
                setInvites(data);
            }
        }
    );

    const handleResponse = (inviteId: string, accepted: boolean) => {
        invites.map((invite: Membership) => {
            if (invite.id === inviteId) {
                return {
                    ...invite,
                    status: accepted ? "accepted" : "declined"
                }
            } else return invite;
        });
        membershipMutation({membershipId: inviteId, status: accepted ? "accepted" : "declined"}, {
            async onSuccess() {await refetch(); onRefetch();}
        });
    }

    const handleConfirm = (inviteId: string, confirmAccept: boolean, confirmDecline: boolean) => {
        setInvites(invites.map((invite: ConfirmedMembership) => {
            if (invite.id === inviteId) {
                invite.confirmAccept = confirmAccept;
                invite.confirmDecline = confirmDecline;
                return invite;
            } else return invite;
        }));
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
                {() => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <div className="flex flex-row items-center justify-between">
                                <h3 className="font-montserrat text-neutral-100">
                                    Приглашения
                                </h3>
                            </div>         
                        </ModalHeader>
                        <ModalBody className="pt-0">
                            {invites.map(invite => <div key={invite.id} className="flex flex-1 flex-row gap-1">
                                <div className="flex flex-col flex-1 truncate py-2">
                                    {invite.team.title}
                                </div>
                                {invite.status === "invited" && <div className="flex flex-row gap-1">
                                    <Button color="success" className="min-w-unit-10 px-2" onClick={() => {
                                            if (invite.confirmAccept) handleResponse(invite.id, true)
                                            else handleConfirm(invite.id, true, false)
                                        }}>
                                        {invite.confirmAccept ? "Принять" : <CheckIcon/>}
                                    </Button>
                                    <Button color="danger" className="min-w-unit-10 px-2" onClick={() => {
                                            if (invite.confirmDecline) handleResponse(invite.id, false)
                                            else handleConfirm(invite.id, false, true)
                                        }}>
                                        {invite.confirmDecline ? "Отклонить" : <XMarkIcon/>}
                                    </Button>
                                </div>}
                            </div>)}
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export default SeeInvitesModal;