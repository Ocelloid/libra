import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { type User } from "~/server/api/routers/User";
import { api } from "~/utils/api";
moment.locale('ru')

const CancelMembershipModal: React.FC<{
        user: User, 
        teamId: string,
        onDelete: (id: string) => void,
        isOpen: boolean | undefined,
        onOpenChange: () => void,
    }> = ({user, teamId, onDelete, isOpen, onOpenChange}) => {     

        const {mutate: deletionMutation} = api.Team.cancelMembership.useMutation({
            onSuccess() {
                onDelete(user.id);
            }
        });    

        return(            
            <Modal 
                isOpen={isOpen} 
                onOpenChange={onOpenChange}
                size="md" 
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
                            <ModalHeader className="flex flex-col gap-1">Ты действительно хочешь удалить пользователя из команды?</ModalHeader>
                            <ModalBody>
                                Пользователь &quot;{user.name}&quot; будет удален.
                            </ModalBody>
                            <ModalFooter>
                                <Button color="secondary" variant="light" onPress={() => onClose()} className="font-montserrat mr-auto">
                                    Отмена
                                </Button>
                                <Button color="danger" onPress={() => {
                                        onClose(); 
                                        deletionMutation({memberId: user.id, teamId: teamId});
                                    }} className="font-montserrat">
                                    Подтвердить
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        )
    }

export default CancelMembershipModal;