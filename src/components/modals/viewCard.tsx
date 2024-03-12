import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { useState } from "react";
import { type WeightedEntry } from "~/server/api/routers/weightedentry";
import { api } from "~/utils/api";
moment.locale('ru')

const ViewCardModal: React.FC<{
        entry: WeightedEntry, 
        isOpen: boolean | undefined,
        onOpenChange: () => void,
        onDeleteOpen: () => void,
}> = ({entry, isOpen, onOpenChange, onDeleteOpen}) => {  
    const [isEditing,    setIsEditing   ] = useState<boolean>(false); 
    const [entryTitle,   setEntryTitle  ] = useState<string>(entry.title);
    const [entryContent, setEntryContent] = useState<string>(entry.content);
    
    const { mutate: updateMutation } = api.weightedEntry.updateEntry.useMutation();

    const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        updateMutation({ id: entry.id, content: entryContent, title: entryTitle, weight: entry.weightRating });
    };

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (entryTitle && !!entryContent) handleFormSubmit();
        };
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
                                    {moment(entry.dateCreated).format("D MMMM YYYY HH:mm")}
                                </h3>
                            </div>         
                        </ModalHeader>
                        <ModalBody>
                            {!isEditing && <div className="flex w-full flex-col justify-center gap-2">
                                <div className="flex flex-row gap-2">
                                    <input 
                                        disabled={true}
                                        value={entryTitle}
                                        className="font-montserrat mx-auto rounded-sm border-slate-800 bg-gray-800 bg-opacity-60 px-2 tracking-wide w-full"/>                                                   
                                    <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2 ml-auto hover:from-gray-700" 
                                        tabIndex={10003}
                                        onClick={() => setIsEditing(true)}>
                                        <PencilIcon width={25} className="text-neutral-100"/>
                                    </button>
                                </div>   
                                <textarea 
                                    cols={30} 
                                    rows={10} 
                                    disabled
                                    value={entryContent}
                                    className="font-montserrat mx-auto rounded-sm border-slate-800 bg-gray-800 bg-opacity-60 p-2 tracking-wide w-full mb-4">
                                </textarea>
                            </div>}
                            {isEditing && <form className="flex w-full flex-col justify-center gap-2" 
                                onSubmit={e => handleFormSubmit(e)}>
                                <div className="flex flex-row gap-2">
                                    <input 
                                        required
                                        value={entryTitle}
                                        tabIndex={10001}
                                        onKeyDown={e => onCtrlEnterPress(e)}
                                        onChange={e => setEntryTitle(e.target.value)}
                                        placeholder="Название новой задачи" 
                                        className="font-montserrat mx-auto rounded-sm border-slate-800 bg-gray-800 bg-opacity-60 px-2 tracking-wide w-full"/>                                                   
                                    <button className="rounded-sm bg-gradient-to-br from-red-500 to-red-800 p-2 ml-auto hover:from-red-500" 
                                        tabIndex={10003}
                                        onClick={() => onDeleteOpen()}>
                                        <TrashIcon width={25} className="text-neutral-100"/>
                                    </button>
                                </div>   
                                <textarea 
                                    cols={30} 
                                    rows={10} 
                                    required
                                    tabIndex={10002}
                                    value={entryContent}
                                    onKeyDown={e => onCtrlEnterPress(e)}
                                    onChange={e => setEntryContent(e.target.value)}
                                    placeholder="Опиши свои мысли" 
                                    className={`font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 bg-opacity-60 p-2 tracking-wide w-full`}>
                                </textarea>
                            </form>} 
                        </ModalBody>
                        {isEditing && <ModalFooter>
                            <Button color="secondary" variant="light" onPress={() => setIsEditing(false)} className="font-montserrat mr-auto">
                                Отмена
                            </Button>
                            <Button color="primary" onPress={() => {handleFormSubmit(); setIsEditing(false);}} className="font-montserrat">
                                Обновить
                            </Button>
                        </ModalFooter>}
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export default ViewCardModal;