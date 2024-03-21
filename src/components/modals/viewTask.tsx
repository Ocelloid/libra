import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Tooltip} from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { useState } from "react";
import { type WeightedTask } from "~/server/api/routers/WeightedTask";
import { api } from "~/utils/api";
import { useTranslation } from 'next-i18next';
moment.locale('ru')

const ViewTaskModal: React.FC<{
        task: WeightedTask, 
        isOpen: boolean | undefined,
        onOpenChange: () => void,
        onDeleteOpen: () => void,
}> = ({task, isOpen, onOpenChange, onDeleteOpen}) => {  
    const [isEditing,   setIsEditing   ] = useState<boolean>(false); 
    const [taskTitle,   setEntryTitle  ] = useState<string>(task.title);
    const [taskContent, setEntryContent] = useState<string>(task.content);
    const { t } = useTranslation(['ru', 'en']);

    const { mutate: updateMutation } = api.WeightedTask.updateTask.useMutation();

    const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        updateMutation({ id: task.id, content: taskContent, title: taskTitle, weight: task.weightRating });
    };

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (!!taskTitle && !!taskContent) handleFormSubmit();
        };
    } 

    return(            
        <Modal 
            isOpen={isOpen} 
            onOpenChange={onOpenChange}
            onClose={() => setIsEditing(false)}
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
                                    {moment(task.dateCreated).format("D MMMM YYYY HH:mm")}
                                </h3>
                            </div>         
                        </ModalHeader>
                        <ModalBody>
                            {!isEditing && <div className="flex w-full flex-col justify-center gap-2">
                                <div className="flex flex-row gap-2">
                                    <input 
                                        disabled={true}
                                        value={taskTitle}
                                        className="font-montserrat mx-auto rounded-sm border-slate-800 bg-gray-800 bg-opacity-60 px-2 tracking-wide w-full"/>                                                   
                                    <Tooltip
                                        className="text-tiny text-default-500 rounded-md"
                                        content={t('common:edit_task')}
                                        placement="top">
                                        <button className="rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 p-2 ml-auto hover:from-gray-700" 
                                            tabIndex={10003}
                                            onClick={() => setIsEditing(true)}>
                                            <PencilIcon width={25} className="text-neutral-100"/>
                                        </button>                                        
                                    </Tooltip>
                                </div>   
                                <textarea 
                                    cols={30} 
                                    rows={10} 
                                    disabled
                                    value={taskContent}
                                    className="font-montserrat mx-auto rounded-sm border-slate-800 bg-gray-800 bg-opacity-60 p-2 tracking-wide w-full mb-4">
                                </textarea>
                            </div>}
                            {isEditing && <form className="flex w-full flex-col justify-center gap-2" 
                                onSubmit={e => handleFormSubmit(e)}>
                                <div className="flex flex-row gap-2">
                                    <input 
                                        required
                                        value={taskTitle}
                                        tabIndex={10001}
                                        onKeyDown={e => onCtrlEnterPress(e)}
                                        onChange={e => setEntryTitle(e.target.value)}
                                        placeholder={t('common:new_task_name')}
                                        className="font-montserrat mx-auto rounded-sm border-slate-800 bg-gray-800 bg-opacity-60 px-2 tracking-wide w-full"/>                                                   
                                    <Tooltip
                                        className="text-tiny text-default-500 rounded-md"
                                        content={t('common:delete_task')}
                                        placement="top">
                                        <button className="rounded-sm bg-gradient-to-br from-red-500 to-red-800 p-2 ml-auto hover:from-red-500" 
                                            tabIndex={10003}
                                            onClick={() => onDeleteOpen()}>
                                            <TrashIcon width={25} className="text-neutral-100"/>
                                        </button>
                                    </Tooltip>
                                </div>   
                                <textarea 
                                    cols={30} 
                                    rows={10} 
                                    required
                                    tabIndex={10002}
                                    value={taskContent}
                                    onKeyDown={e => onCtrlEnterPress(e)}
                                    onChange={e => setEntryContent(e.target.value)}
                                    placeholder={t('common:describe_task')}
                                    className={`font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 bg-opacity-60 p-2 tracking-wide w-full`}>
                                </textarea>
                            </form>} 
                        </ModalBody>
                        {isEditing && <ModalFooter>
                            <Button color="secondary" variant="light" onPress={() => setIsEditing(false)} className="font-montserrat mr-auto">
                                {t('common:cancel')}
                            </Button>
                            <Button color="primary" onPress={() => {handleFormSubmit(); setIsEditing(false);}} className="font-montserrat">
                                {t('common:update')}
                            </Button>
                        </ModalFooter>}
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}

export default ViewTaskModal;