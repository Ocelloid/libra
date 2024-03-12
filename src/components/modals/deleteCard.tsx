import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { type WeightedEntry } from "~/server/api/routers/weightedentry";
import { api } from "~/utils/api";
moment.locale('ru')

const RecursiveChildList: React.FC<{
    listingEntries: WeightedEntry[] | undefined, 
}> = ({listingEntries}) => {
    return (
        <>
            <ul className="ml-3">
                {listingEntries?.map(listingEntry => (
                    <li key={listingEntry.id}>
                        ↳&quot;{listingEntry.title}&quot;
                        <RecursiveChildList listingEntries={listingEntry.childEntries}/>  
                    </li>)
                )}
            </ul>
        </>
    );
}

const DeleteCardModal: React.FC<{
        entry: WeightedEntry, 
        onDelete: (id: string) => void,
        isOpen: boolean | undefined,
        onOpenChange: () => void,
    }> = ({entry, onDelete, isOpen, onOpenChange}) => {     

        const {mutate: deletionMutation} = api.weightedEntry.deleteEntry.useMutation({
            onSuccess() {
                onDelete(entry.id);
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
                                Задача &quot;{entry.title}&quot; будет удалена.<br/>
                                {!!entry.childEntries?.length && <div>
                                    Подзадачи, которые будут удалены:
                                    <RecursiveChildList listingEntries={entry.childEntries}/>
                                </div>}
                            </ModalBody>
                            <ModalFooter>
                                <Button color="secondary" variant="light" onPress={() => onClose()} className="font-montserrat mr-auto">
                                    Отмена
                                </Button>
                                <Button color="danger" onPress={() => {
                                        onClose(); 
                                        deletionMutation({id: entry.id});
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

export default DeleteCardModal;