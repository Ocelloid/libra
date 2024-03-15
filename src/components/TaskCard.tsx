import { Button, Slider, Tooltip, useDisclosure } from "@nextui-org/react";
import moment from "moment";
import 'moment/locale/ru';
import { type WeightedTask } from "~/server/api/routers/WeightedTask";
import FlipMove from "react-flip-move";
import { api } from "~/utils/api";
import { useEffect, useState } from "react";
import { ArrowLeftIcon, ArrowRightIcon, PlusIcon } from "@heroicons/react/24/solid";
import DeleteTaskModal from "./modals/deleteTask";
import ViewTaskModal from "./modals/viewTask";
moment.locale('ru')

const TaskCard: React.FC<{
    task: WeightedTask, 
    handleWeightChange: (id: string, weight: number, commit?: boolean | undefined) => void,
    onDelete: (id: string) => void,
    fullWidth?: boolean,
    tabIndex: number,
    isChild?: boolean,
    className?: string,
}> = ({task, handleWeightChange, onDelete, fullWidth, tabIndex, isChild, className}) => {
    const [childTasks, setchildTasks] = useState<WeightedTask[]>(
        task.childTasks 
            ? task.childTasks.sort((a: WeightedTask, b: WeightedTask) => b.weightRating - a.weightRating)
            : []
    );

    const {
        isOpen: isDeleteOpen, 
        onOpen: onDeleteOpen, 
        onOpenChange: onDeleteOpenChange} = useDisclosure();
    const {
        isOpen: isEditOpen,   
        onOpen: onEditOpen,   
        onOpenChange: onEditOpenChange  } = useDisclosure();

    const [taskUserId                   ] = useState<string>(task.userId);
    const [inputValue,   setInputValue  ] = useState<string>(task.weightRating.toString());

    const [childTitle,   setChildTitle  ] = useState<string>("");
    const [childContent, setChildContent] = useState<string>("");
    const [childRating,  setChildRating ] = useState<number>(50);

    const { mutate: updateTaskMutation } = api.WeightedTask.updateTaskWeight.useMutation();

    const { mutate: childMutation } = api.WeightedTask.createTask.useMutation({
        onSuccess(newEntry) {
            const newchildTasks: WeightedTask[] = [
                ...childTasks, 
                {
                    id: newEntry.id,
                    parentId: task.id,
                    teamId: task.teamId,
                    title: childTitle,
                    content: childContent,
                    weightRating: childRating,
                    userId: taskUserId,
                    dateCreated: new Date()
                }
            ];
            setchildTasks(newchildTasks);
            setChildTitle("");
            setChildContent("");
            setChildRating(50);
        }
    });

    const handleChildDelete = (taskId: string) => {
        const newEntries: WeightedTask[] = task.childTasks
            ? task.childTasks.filter((childEntry) => childEntry.id !== taskId)
            : [];
        setchildTasks(newEntries);
    }

    const handlechildTasksWeightChange = (taskId: string, weight: number, commit: boolean | undefined) => {
        if (isNaN(Number(weight))) return;
        const newEntries: WeightedTask[] = childTasks.map((childEntry) => {
            if (childEntry.id === taskId) {
                return {
                    ...childEntry,
                    weightRating: weight
                }
            }
            else return childEntry;
        });

        if (commit) {
            setchildTasks(
                newEntries
                    .sort((a,b) => b.weightRating - a.weightRating)
            );
            updateTaskMutation({id: taskId, weight: weight});
        }
        else setchildTasks(newEntries);
    }

    const handleNewChild = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        childMutation({content: childContent, title: childTitle, weight: childRating, parentId: task.id, teamId: task.teamId});
    }

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (!!childTitle && !!childContent) handleNewChild();
        };
    } 

    useEffect(() => {
        setInputValue(task.weightRating.toString());
    }, [setInputValue, task.weightRating])

    return(
        <div className={
            `truncate ${isChild 
                ? "ml-2 pl-2 pt-0" 
                : `p-3 pl-2 pb-0 pr-0 ${fullWidth ? "" : "mx-10 md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7"} mb-5 rounded-md`
            } flex flex-col bg-slate-800 bg-opacity-30 ${className}`}>
            <DeleteTaskModal task={task} isOpen={isDeleteOpen} onOpenChange={onDeleteOpenChange} onDelete={onDelete}/>
            <ViewTaskModal task={task} isOpen={isEditOpen} onOpenChange={onEditOpenChange} onDeleteOpen={onDeleteOpen}/>
            <div className={`flex flex-row ${isChild ? '' : 'mr-3'}`}>
                <Button 
                    variant="bordered" 
                    className="w-full hover:text-gray-300 border-none font-montserrat text-medium p-0" 
                    onClick={onEditOpen}>
                    <p className="font-montserrat px-2 text-lg text-neutral-100 hover:text-gray-300 w-full text-left">
                        {task.title}
                    </p>
                </Button> 
            </div>
            <div className={`flex flex-row ${isChild ? '' : 'mr-3'}`}>
                <Slider 
                    size="sm"
                    step={1} 
                    minValue={0} 
                    maxValue={100}                                     
                    aria-label=" "
                    value={Number(inputValue)}
                    color="foreground"
                    onChange={value => {
                        handleWeightChange(task.id.toString(), Number(value));
                        setInputValue(value.toString());                    
                    }}
                    onChangeEnd={value => {
                        handleWeightChange(task.id.toString(), Number(value), true);
                        setInputValue(value.toString()); 
                    }}
                    startContent={
                        <Button
                            isIconOnly
                            radius="full"
                            variant="light"
                            onPress={() => {
                                handleWeightChange(task.id.toString(), 0, true);
                                setInputValue("0");                    
                            }}>
                            <ArrowLeftIcon width={24} className="text-neutral-100"/>
                        </Button>
                    }
                    endContent={
                        <Button
                            isIconOnly
                            radius="full"
                            variant="light"
                            onPress={() => {
                                handleWeightChange(task.id.toString(), 100, true);
                                setInputValue("100");             
                            }}>
                            <ArrowRightIcon width={24} className="text-neutral-100"/>
                        </Button>
                    }      
                    classNames={{
                        label: "ml-auto text-medium text-gray-500 font-montserrat",
                        filler: "bg-neutral-100 hover:bg-gray-300",
                        thumb: "bg-neutral-100 hover:bg-gray-300"
                    }}
                    className="gap-0 py-1"/>
                    <Tooltip
                        className="text-tiny text-default-500 rounded-md"
                        content="Нажми Enter, чтобы применить"
                        placement="top">
                        <input
                            className={`px-0 py-0.5 w-9 my-1 text-center text-medium font-montserrat
                                text-gray-500 font-medium bg-slate-800 outline-none transition-colors
                                rounded-small border-medium border-transparent hover:border-primary 
                                focus:border-primary bg-transparent  ${isChild ? 'mr-3' : ''}`}
                            type="text"
                            aria-label="Вес"
                            value={inputValue}
                            onChange={(e) => {
                                const v = e.target.value;
                                setInputValue(v);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isNaN(Number(inputValue))) {
                                    handleWeightChange(task.id.toString(), Number(inputValue), true);
                                }
                            }}/>
                    </Tooltip>
                <div>
            </div>
            </div>
            <form className={`flex flex-col justify-center gap-2 pl-2 ${isChild ? 'pb-0' : 'pb-2 mr-3'}`} 
                onSubmit={e => handleNewChild(e)}>
                <div className="flex flex-row gap-2">
                    <input 
                        required
                        tabIndex={tabIndex + 1}
                        value={childTitle}
                        onKeyDown={e => onCtrlEnterPress(e)}
                        onChange={e => setChildTitle(e.target.value)}
                        placeholder="Название новой подзадачи" 
                        className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 bg-opacity-60 py-1 px-3 tracking-wide w-full"/>  
                        <button 
                            tabIndex={tabIndex + 3}
                            type="submit" 
                            className={`font-montserrat mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-700 p-3 text-xl font-bold text-neutral-100 w-25 ${isChild ? 'mr-3' : ''}`}>
                            <PlusIcon width={12}/>
                        </button>        
                </div>
                <textarea 
                    cols={30} 
                    rows={3} 
                    required
                    tabIndex={tabIndex + 2}
                    value={childContent}
                    onKeyDown={e => onCtrlEnterPress(e)}
                    onChange={e => setChildContent(e.target.value)}
                    placeholder="Опиши свои мысли" 
                    className={`font-montserrat rounded-sm border border-slate-800 bg-gray-800 bg-opacity-60 p-3 tracking-wide 
                    ${
                        !childTitle ? '-mt-24 -z-10 opacity-0' : 'mt-0 z-0 opacity-100'
                    }
                    ${
                        isChild ? 'mr-3' : ''
                    }
                    transition-all ease-in-out delay-150 duration-300`}>
                </textarea>
            </form>          
            <FlipMove>
                {childTasks.map((childEntry: WeightedTask, index) => (
                    <div key={childEntry.id} className="child-entry">
                        <TaskCard 
                            task={childEntry}
                            handleWeightChange={handlechildTasksWeightChange} 
                            isChild 
                            tabIndex={tabIndex * 30 * (index + 1)}  
                            onDelete={handleChildDelete} 
                            className="child-entry-card"/>
                    </div>
                ))}
            </FlipMove>
        </div>
    )
}

export default TaskCard;