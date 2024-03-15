import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { type WeightedTask } from "~/server/api/routers/WeightedTask";
import { api } from "~/utils/api";
moment.locale('ru')

const RecursiveChildList: React.FC<{
    listingEntries: WeightedTask[] | undefined, 
}> = ({listingEntries}) => {
    return (
        <>
            <ul className="ml-3">
                {listingEntries?.map(listingEntry => (
                    <li key={listingEntry.id}>
                        ↳&quot;{listingEntry.title}&quot;
                        <RecursiveChildList listingEntries={listingEntry.childTasks}/>  
                    </li>)
                )}
            </ul>
        </>
    );
}

const DeleteTaskModal: React.FC<{
        task: WeightedTask, 
        onDelete: (id: string) => void,
        isOpen: boolean | undefined,
        onOpenChange: () => void,
    }> = ({task, onDelete, isOpen, onOpenChange}) => {     

        const {mutate: deletionMutation} = api.WeightedTask.deleteTask.useMutation({
            onSuccess() {
                onDelete(task.id);
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
                            <ModalHeader className="flex flex-col gap-1">Ты действительно хочешь удалить задачу?</ModalHeader>
                            <ModalBody>
                                Задача &quot;{task.title}&quot; будет удалена.<br/>
                                {!!task.childTasks?.length && <div>
                                    Подзадачи, которые будут удалены:
                                    <RecursiveChildList listingEntries={task.childTasks}/>
                                </div>}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="secondary" variant="light" onPress={() => onClose()} className="font-montserrat mr-auto">
                                    Отмена
                                </Button>
                                <Button color="danger" onPress={() => {
                                        onClose(); 
                                        deletionMutation({id: task.id});
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

export default DeleteTaskModal;