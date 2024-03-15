import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { Button, Checkbox, Chip, Select, SelectItem, Tab, Tabs, Tooltip, useDisclosure } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import Head from "next/head"
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "~/components/Loading";
import { type Team } from "~/server/api/routers/Team";
import { type WeightedTask } from "~/server/api/routers/WeightedTask";
import { type Message } from "~/server/api/routers/Message";
import { api } from "~/utils/api";
import AddTeamModal from "~/components/modals/addTeam";
import NoTasks from "~/components/NoTasks";
import FlipMove from "react-flip-move";
import TaskCard from "~/components/TaskCard";
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import moment from "moment";
import EditTeamModal from "~/components/modals/editTeam";
import DeleteTeamModal from "~/components/modals/deleteTeam";
        
const Teams = () => {
    const { status: sessionStatus           } = useSession();
    const { data: sessionData               } = useSession();
    const { replace                         } = useRouter();    
    const [teams,          setTeams         ] = useState<Team[]>([]);      
    const [teamMessages,   setTeamMessages  ] = useState<Message[]>([]);    
    const [teamTasks,      setTeamTasks     ] = useState<WeightedTask[]>([]);                
    const [teamId,         setTeamId        ] = useState<string>("");                  
    const [team,           setTeam          ] = useState<Team>(); 
    const [taskTitle,      setTaskTitle     ] = useState<string>("");
    const [taskContent,    setTaskContent   ] = useState<string>("");    
    const [messageContent, setMessageContent] = useState<string>("");    
    const [isSystemHidden, setIsSystemHidden] = useState<boolean>(true);
    const {
        isOpen: isAddingOpen, 
        onOpen: onAddingOpen, 
        onOpenChange: onAddingOpenChange    } = useDisclosure();  
    const {
        isOpen: isEditingOpen, 
        onOpen: onEditingOpen, 
        onOpenChange: onEditingOpenChange   } = useDisclosure();      
    const {
        isOpen: isDeleteTeamOpen, 
        onOpen: onDeleteTeamOpen, 
        onOpenChange: onDeleteTeamOpenChange} = useDisclosure();  

    const utils = api.useUtils();

    useEffect(() => {
        if (sessionStatus === "unauthenticated") {
            void replace("/")
        }
    }, [replace, sessionStatus]);

    const {isLoading: isMessagesLoading, refetch: refetchMessages} = api.Message.getAllMessagesByTeam.useQuery(
        {teamId: teamId},  
        {
            enabled: sessionStatus === "authenticated" && teamId !== "",
            refetchInterval: 1000,
            onSuccess: (data: Message[]) => {
                setTeamMessages(data);
            }
        },
    );

    const {isLoading: isTeamsLoading, refetch: refetchTeams} = api.Team.getAllTeams.useQuery(
        undefined, 
        {
            enabled: sessionStatus === "authenticated",
            onSuccess: (data: Team[]) => {
                setTeams(data);
                setTeamId(data[0]?.id ?? "");
                setTeam(data[0]);
            }
        }
    );

    const {isLoading: isTasksLoading} = api.WeightedTask.getAllTasksByTeam.useQuery(
        {teamId: teamId},  
        {
            enabled: sessionStatus === "authenticated" && teamId !== "",
            refetchInterval: 1000,
            onSuccess: (data: WeightedTask[]) => {
                setTeamTasks(data.map((val: WeightedTask) => {
                    val.childTasks = data.filter((childTask: WeightedTask) => childTask.parentId === val.id);
                    return val;
                }).filter(v => !v.parentId).sort((a,b) => b.weightRating - a.weightRating));
            }
        }
    );

    const { mutate: updateTaskMutation } = api.WeightedTask.updateTaskWeight.useMutation({ 
        async onSuccess() {        
            setTaskTitle("");
            setTaskContent("");  
            await refetchMessages();  
        }
    });

    const { mutate: createTask } = api.WeightedTask.createTask.useMutation({
        async onSuccess(data) {
            setTeamTasks([...teamTasks, {
                id: data.id,
                title: taskTitle,
                userId: data.userId,
                parentId: '',
                teamId: teamId,
                content: taskContent,
                weightRating: 100,
                dateCreated: data.dateCreated,
                childTasks: []
            }].sort((a,b) => b.weightRating - a.weightRating));    
            setTaskTitle("");
            setTaskContent(""); 
            await refetchMessages();       
        }
    });

    const { mutate: createMessage } = api.Message.createMessage.useMutation({
        onSuccess(data) {
            setTeamMessages([{
                id: data.id,
                content: messageContent,
                creatorId: data.creatorId,
                teamId: teamId,
                dateCreated: data.dateCreated,
                user: data.user
            }, ...teamMessages]);    
            setMessageContent("");     
        }
    });

    const handleRefetch = async () => {
        if (isEditingOpen) onEditingOpenChange();
        if (isDeleteTeamOpen) onDeleteTeamOpenChange();
        await refetchTeams();
        await utils.Team.invalidate();
    }

    const handleWeightChange = (taskId: string, weight: number, commit: boolean | undefined) => {
        if (isNaN(Number(weight))) return;

        const newTasks: WeightedTask[] = teamTasks.map((task) => {
            if (task.id === taskId) {
                return {
                    ...task,
                    weightRating: weight
                }
            }
            else return task;
        });

        if (commit) {
            setTeamTasks(
                newTasks
                    .sort((a,b) => b.weightRating - a.weightRating)
            );
            updateTaskMutation({id: taskId, weight: weight});
        }
        else setTeamTasks(newTasks);
    }

    const handleDelete = (taskId: string) => {
        const newTasks: WeightedTask[] = teamTasks.filter((task) => task.id !== taskId);
        setTeamTasks(newTasks);
    }

    const handleNewTask = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        createTask({ content: taskContent, title: taskTitle, weight: 100, teamId: teamId });
    };

    const onTaskCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (!!taskTitle && !!taskContent) handleNewTask();
        };
    }

    const onCtrlEnterPress = (e: React.KeyboardEvent) => {
        if (e.ctrlKey && e.key === "Enter") {
            e.preventDefault();
            if (!!messageContent) handleNewMessage();
        };
    }

    const handleNewMessage = () => {
        createMessage({content: messageContent, teamId: teamId});
    }

    if (sessionStatus === "loading" || isTeamsLoading || isTasksLoading || isMessagesLoading ) { return <Loading/> }
    if (!sessionData) return;
    return(<>
        <Head><title>Команды</title></Head>
        <AddTeamModal isOpen={isAddingOpen} onOpenChange={onAddingOpenChange} onRefetch={handleRefetch}/>
        <DeleteTeamModal
            team={team} 
            isOpen={isDeleteTeamOpen} 
            onOpenChange={onDeleteTeamOpenChange} 
            onDelete={handleRefetch}/>
        <EditTeamModal 
            teamId={teamId} 
            isOpen={isEditingOpen} 
            onOpenChange={onEditingOpenChange} 
            onRefetch={handleRefetch} 
            onDeleteTeam={onDeleteTeamOpen}/>
        <div className="h-screen w-screen flex flex-col overflow-x-hidden overflow-y-hidden">       
            <section className="sec-container">
                <div className="flex flex-1 flex-col md:w-3/4 lg:w-2/3 xl:w-1/2 2xl:w-3/7 mx-10 md:mx-auto">
                    <div className="flex flex-row items-center justify-between gap-1">
                        <Select variant="underlined" label="Выбери команду" className=""
                            selectedKeys={[teamId]}
                            onChange={e => {
                                setTeamId(e.target.value ? e.target.value : teamId);
                                setTeam(e.target.value 
                                    ? teams.find(team => team.id === e.target.value) 
                                    : teams.find(team => team.id === teamId));
                            }}>
                            {teams.map((team: Team) => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.title}
                                </SelectItem>
                            ))}
                        </Select>
                        <Tooltip
                            className="text-tiny text-default-500 rounded-md"
                            content="Добавить команду"
                            placement="top">
                            <Button 
                                variant="bordered" 
                                onClick={onAddingOpen}
                                className="min-w-unit-10 flex-1 hover:text-gray-300 border-none font-montserrat text-medium py-0 px-2">
                                <PlusIcon width={25} className="my-auto"/>
                            </Button>
                        </Tooltip>
                        {(team?.creatorId === sessionData.user.id) && <Tooltip
                            className="text-tiny text-default-500 rounded-md"
                            content="Изменить команду"
                            placement="top">
                            <Button 
                                variant="bordered" 
                                onClick={onEditingOpen}
                                className="min-w-unit-10 flex-1 hover:text-gray-300 border-none font-montserrat text-medium py-0 px-2">
                                <PencilIcon width={25} className="my-auto"/>
                            </Button>
                        </Tooltip>}
                    </div>
                    {!!teamId && <Tabs aria-label="Вкладки" variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-[#22d3ee]",
                            tab: "max-w-fit px-0 h-12",
                        }}>
                        <Tab key="tasks" title={
                            <div className="flex items-center space-x-2">
                                <span className="font-montserrat">Задачи</span>
                                <Chip size="sm" variant="faded">{teamTasks.length}</Chip>
                            </div>
                        }>     
                            <form className={`flex flex-col justify-center gap-2 rounded-md pt-2`} 
                                onSubmit={e => handleNewTask(e)}>
                                <div className="flex flex-row gap-2">
                                    <input 
                                        required
                                        value={taskTitle}
                                        onKeyDown={e => onTaskCtrlEnterPress(e)}
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
                                    onKeyDown={e => onTaskCtrlEnterPress(e)}
                                    onChange={e => setTaskContent(e.target.value)}
                                    placeholder="Опиши свои мысли" 
                                    className={`font-montserrat rounded-sm border border-slate-800 bg-gray-800 p-3 tracking-wide 
                                    ${
                                        !taskTitle ? '-mt-24 -z-10 opacity-0' : 'mt-0 z-0 opacity-100'
                                    }
                                    transition-all ease-in-out delay-150 duration-300`}>
                                </textarea>
                            </form>    
                            {teamTasks?.length === 0 
                                ? <NoTasks/> 
                                : <FlipMove className="h-[65vh] overflow-y-auto pb-5 noscroll">
                                    {teamTasks?.map((task: WeightedTask, index) => (
                                        <div key={task.id}>
                                            <TaskCard 
                                                task={task}
                                                fullWidth={true}
                                                handleWeightChange={handleWeightChange} 
                                                tabIndex={3 * (index + 1)} 
                                                onDelete={handleDelete}/>
                                        </div>
                                    ))}
                                </FlipMove>
                            }
                        </Tab>
                        <Tab key="messages" title={
                            <div className="flex items-center space-x-2">
                                <span className="font-montserrat">Сообщения</span>
                                <Chip size="sm" variant="faded">{teamMessages.length}</Chip>
                            </div>
                        } className="flex flex-col flex-1">
                            <div className="flex flex-row">
                                <div className="flex h-[60vh] overflow-y-auto w-full flex-col-reverse">                                        
                                    {teamMessages.map((message: Message) => {
                                            if ((message.user?.id === "system") && isSystemHidden) return null;
                                            else return(
                                            <div key={message.id} className="felx flex-col pb-2">
                                                <div className="flex flex-row text-gray-500">
                                                    {moment(message.dateCreated).format("D MMMM YYYY HH:mm")}&nbsp;
                                                    {message.user?.id === "system" ? "Система" : message.user?.name}
                                                </div>                                                  
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm]}
                                                    className={`break-all whitespace-normal font-montserrat rounded-sm border border-slate-800 bg-gray-800 bg-opacity-30 p-5 tracking-wide w-full flex flex-row ${message.user?.id === "system" ? "text-yellow-200" : "text-normal-100"}`}>
                                                    {message.content}
                                                </ReactMarkdown>      
                                            </div>
                                        )}
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-row pb-1">                                
                                <Checkbox isSelected={isSystemHidden} onValueChange={setIsSystemHidden}>
                                    Скрыть системные сообщения
                                </Checkbox>
                            </div>
                            <div className="flex flex-row pb-5">
                                <div className="flex flex-row w-full gap-1">
                                    <div className="flex flex-col flex-1">
                                        <textarea 
                                            value={messageContent}
                                            onKeyDown={e => onCtrlEnterPress(e)}
                                            onChange={e => setMessageContent(e.target.value)}
                                            className="font-montserrat rounded-sm border border-slate-800 bg-gray-800 bg-opacity-60 p-2 tracking-wide" 
                                            placeholder="Сообщение"/>
                                    </div>
                                    <div className="flex flex-col">
                                        <Button 
                                            onClick={handleNewMessage} 
                                            variant="bordered" 
                                            className="w-min flex-1 hover:text-gray-300 border-none font-montserrat text-medium py-0 px-2">
                                            <PaperAirplaneIcon width={25} className="my-auto"/>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Tab>
                    </Tabs>}
                </div>
            </section>             
        </div>
    </>)
}

export default Teams;