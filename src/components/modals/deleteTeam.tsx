import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { type Team } from "~/server/api/routers/Team";
import { api } from "~/utils/api";
moment.locale('ru')

const DeleteTeamModal: React.FC<{ 
        team?: Team,
        onDelete: (id?: string) => void,
        isOpen: boolean | undefined,
        onOpenChange: () => void,
    }> = ({team, onDelete, isOpen, onOpenChange}) => {     

        const {mutate: deletionMutation} = api.Team.deleteTeam.useMutation(
            {
                onSuccess() {
                    onDelete(team?.id);
                }
            }
        );    

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
                            <ModalHeader className="flex flex-col gap-1">Ты действительно хочешь удалить команду?</ModalHeader>
                            <ModalBody>
                                Команда &quot;{team?.title}&quot; будет удалена.
                            </ModalBody>
                            <ModalFooter>
                                <Button color="secondary" variant="light" onPress={() => onClose()} className="font-montserrat mr-auto">
                                    Отмена
                                </Button>
                                <Button color="danger" onPress={() => {
                                        deletionMutation({teamId: team?.id ?? ""});
                                        onClose(); 
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

export default DeleteTeamModal;