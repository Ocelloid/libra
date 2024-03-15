import {useSession} from "next-auth/react";
import {useRouter} from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import NoTasks from "~/components/NoTasks";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import moment from "moment";
import 'moment/locale/ru';
moment.locale('ru')
import FlipMove from 'react-flip-move';
import TaskCard from "~/components/TaskCard";
import { type WeightedTask } from "~/server/api/routers/WeightedTask";
import { PlusIcon } from "@heroicons/react/24/solid";

const Tasks = () => {
    const { status: sessionStatus } = useSession();
    const { data: sessionData } = useSession();
    const { replace } = useRouter();    
    const [tasks,       setTasks    ] = useState<WeightedTask[]>([]);
    const [taskTitle,   setTaskTitle  ] = useState<string>("");
    const [taskContent, setTaskContent] = useState<string>("");

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            void replace("/")
        }
    }, [replace, sessionStatus]);

    const {isLoading} = api.WeightedTask.getAllTasks.useQuery(
        undefined, 
        {
            enabled: sessionStatus === "authenticated",
            onSuccess: (data: WeightedTask[]) => {
                setTasks(data.map((val: WeightedTask) => {
                    val.childTasks = data.filter((childTask: WeightedTask) => childTask.parentId === val.id);
                    return val;
                }).filter(v => !v.parentId).sort((a,b) => b.weightRating - a.weightRating));
            }
        }
    );

    const { mutate: updateTaskMutation } = api.WeightedTask.updateTaskWeight.useMutation();

    const { mutate: createTask } = api.WeightedTask.createTask.useMutation({
        onSuccess(data) {
            setTasks([...tasks, {
                id: data.id,
                title: taskTitle,
                userId: data.userId,
                parentId: '',
                content: taskContent,
                weightRating: 100,
                dateCreated: data.dateCreated,
                childTasks: []
            }].sort((a,b) => b.weightRating - a.weightRating));    
            setTaskTitle("");
            setTaskContent("");        
        }
    });

    const handleWeightChange = (taskId: string, weight: number, commit: boolean | undefined) => {
        if (isNaN(Number(weight))) return;

        const newTasks: WeightedTask[] = tasks.map((task) => {
            if (task.id === taskId) {
                return {
                    ...task,
                    weightRating: weight
                }
            }
            else return task;
        });

        if (commit) {
            setTasks(
                newTasks
                    .sort((a,b) => b.weightRating - a.weightRating)
            );
            updateTaskMutation({id: taskId, weight: weight});
        }
        else setTasks(newTasks);
    }

    const handleDelete = (taskId: string) => {
        const newTasks: WeightedTask[] = tasks.filter((task) => task.id !== taskId);
        setTasks(newTasks);
    }

    const handleNewTask = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        createTask({ content: taskContent, title: taskTitle, weight: 100 });
    };

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (!!taskTitle && !!taskContent) handleNewTask();
        };
    }

    if (sessionStatus === "loading" || isLoading ) { return <Loading/> }
    if (!sessionData) return;
    return (<>
        <Head><title>Личные задачи</title></Head>
        <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-y-auto">      
            <section className="sec-container">
                <form className={`flex flex-col justify-center gap-2 mx-10 md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 rounded-md pt-2`} 
                    onSubmit={e => handleNewTask(e)}>
                    <div className="flex flex-row gap-2">
                        <input 
                            required
                            value={taskTitle}
                            onKeyDown={e => onCtrlEnterPress(e)}
                            onChange={e => setTaskTitle(e.target.value)}
                            placeholder="Название новой задачи" 
                            tabIndex={1}
                            className="font-montserrat mx-auto rounded-sm border border-slate-800 bg-gray-800 py-1 px-3 tracking-wide w-full"/>  
                            <button 
                                tabIndex={3}
                                type="submit" 
                                className={`font-montserrat mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-700 p-3 text-xl font-bold text-neutral-100 w-25`}>
                                <PlusIcon width={12}/>
                            </button>        
                    </div>
                    <textarea 
                        cols={30} 
                        rows={3} 
                        required
                        tabIndex={2}
                        value={taskContent}
                        onKeyDown={e => onCtrlEnterPress(e)}
                        onChange={e => setTaskContent(e.target.value)}
                        placeholder="Опиши свои мысли" 
                        className={`font-montserrat rounded-sm border border-slate-800 bg-gray-800 p-3 tracking-wide 
                        ${
                            !taskTitle ? '-mt-24 -z-10 opacity-0' : 'mt-0 z-0 opacity-100'
                        }
                        transition-all ease-in-out delay-150 duration-300`}>
                    </textarea>
                </form>    
                {tasks?.length === 0 
                    ? <NoTasks/> 
                    : <FlipMove className="h-[80vh] overflow-y-auto pb-5 noscroll">
                        {tasks?.map((task: WeightedTask, index) => (
                            <div key={task.id}>
                                <TaskCard 
                                    task={task}
                                    handleWeightChange={handleWeightChange} 
                                    tabIndex={3 * (index + 1)} 
                                    onDelete={handleDelete}/>
                            </div>
                        ))}
                    </FlipMove>
                }
            </section>
        </div>
    </>);
}

export default Tasks;