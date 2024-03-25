import { PencilIcon, PlusIcon } from "@heroicons/react/24/outline";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Checkbox,
  Chip,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Tooltip,
  useDisclosure,
} from "@nextui-org/react";
import { useSession } from "next-auth/react";
import Head from "next/head";
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
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import moment from "moment";
import EditTeamModal from "~/components/modals/editTeam";
import DeleteTeamModal from "~/components/modals/deleteTeam";
import { useTranslation } from "next-i18next";
import { type GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTheme } from "next-themes";

const Teams = () => {
  const { t } = useTranslation(["ru", "en"]);
  const { status: sessionStatus } = useSession();
  const { data: sessionData } = useSession();
  const { replace } = useRouter();
  const [styleProp, setStyleProp] = useState({});
  const { theme } = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMessages, setTeamMessages] = useState<Message[]>([]);
  const [teamTasks, setTeamTasks] = useState<WeightedTask[]>([]);
  const [teamId, setTeamId] = useState<string>("");
  const [team, setTeam] = useState<Team>();
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskContent, setTaskContent] = useState<string>("");
  const [messageContent, setMessageContent] = useState<string>("");
  const [isSystemHidden, setIsSystemHidden] = useState<boolean>(true);
  const [buttonStyleProp, setButtonStyleProp] = useState("");

  const {
    isOpen: isAddingOpen,
    onOpen: onAddingOpen,
    onOpenChange: onAddingOpenChange,
  } = useDisclosure();
  const {
    isOpen: isEditingOpen,
    onOpen: onEditingOpen,
    onOpenChange: onEditingOpenChange,
  } = useDisclosure();
  const {
    isOpen: isDeleteTeamOpen,
    onOpen: onDeleteTeamOpen,
    onOpenChange: onDeleteTeamOpenChange,
  } = useDisclosure();

  const utils = api.useUtils();

  useEffect(() => {
    const newStyleProp = {
      backgroundImage: `url(/background-${theme}.png)`,
      backgroundSize: "100% 100%",
    };
    setStyleProp(newStyleProp);
  }, [theme]);

  useEffect(() => {
    const newStyleProp =
      theme === "light"
        ? "from-gray-300 to-gray-400 hover:to-gray-700"
        : "from-gray-700 to-gray-800 hover:from-gray-700";
    setButtonStyleProp(newStyleProp);
  }, [theme]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      void replace("/");
    }
  }, [replace, sessionStatus]);

  const { isLoading: isMessagesLoading, refetch: refetchMessages } =
    api.Message.getAllMessagesByTeam.useQuery(
      { teamId: teamId },
      {
        enabled: sessionStatus === "authenticated" && teamId !== "",
        refetchInterval: 1000,
        onSuccess: (data: Message[]) => {
          setTeamMessages(data);
        },
      },
    );

  const { isLoading: isTeamsLoading, refetch: refetchTeams } =
    api.Team.getAllTeams.useQuery(undefined, {
      enabled: sessionStatus === "authenticated",
      onSuccess: (data: Team[]) => {
        setTeams(data);
        setTeamId(data[0]?.id ?? "");
        setTeam(data[0]);
      },
    });

  const { isLoading: isTasksLoading } =
    api.WeightedTask.getAllTasksByTeam.useQuery(
      { teamId: teamId },
      {
        enabled: sessionStatus === "authenticated" && teamId !== "",
        refetchInterval: 1000,
        onSuccess: (data: WeightedTask[]) => {
          setTeamTasks(
            data
              .map((val: WeightedTask) => {
                val.childTasks = data.filter(
                  (childTask: WeightedTask) => childTask.parentId === val.id,
                );
                return val;
              })
              .filter((v) => !v.parentId)
              .sort((a, b) => b.weightRating - a.weightRating),
          );
        },
      },
    );

  const { mutate: updateTaskMutation } =
    api.WeightedTask.updateTaskWeight.useMutation({
      async onSuccess() {
        setTaskTitle("");
        setTaskContent("");
        await refetchMessages();
      },
    });

  const { mutate: createTask } = api.WeightedTask.createTask.useMutation({
    async onSuccess(data) {
      setTeamTasks(
        [
          ...teamTasks,
          {
            id: data.id,
            title: taskTitle,
            userId: data.userId,
            parentId: "",
            teamId: teamId,
            content: taskContent,
            weightRating: 100,
            dateCreated: data.dateCreated,
            childTasks: [],
          },
        ].sort((a, b) => b.weightRating - a.weightRating),
      );
      setTaskTitle("");
      setTaskContent("");
      await refetchMessages();
    },
  });

  const { mutate: createMessage } = api.Message.createMessage.useMutation({
    onSuccess(data) {
      setTeamMessages([
        {
          id: data.id,
          content: messageContent,
          creatorId: data.creatorId,
          teamId: teamId,
          dateCreated: data.dateCreated,
          user: data.user,
        },
        ...teamMessages,
      ]);
      setMessageContent("");
    },
  });

  const handleRefetch = async () => {
    if (isEditingOpen) onEditingOpenChange();
    if (isDeleteTeamOpen) onDeleteTeamOpenChange();
    await refetchTeams();
    await utils.Team.invalidate();
  };

  const handleWeightChange = (
    taskId: string,
    weight: number,
    commit: boolean | undefined,
  ) => {
    if (isNaN(Number(weight))) return;

    const newTasks: WeightedTask[] = teamTasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          weightRating: weight,
        };
      } else return task;
    });

    if (commit) {
      setTeamTasks(newTasks.sort((a, b) => b.weightRating - a.weightRating));
      updateTaskMutation({ id: taskId, weight: weight });
    } else setTeamTasks(newTasks);
  };

  const handleDelete = (taskId: string) => {
    const newTasks: WeightedTask[] = teamTasks.filter(
      (task) => task.id !== taskId,
    );
    setTeamTasks(newTasks);
  };

  const handleNewTask = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    createTask({
      content: taskContent,
      title: taskTitle,
      weight: 100,
      teamId: teamId,
    });
  };

  const onTaskCtrlEnterPress = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      if (!!taskTitle) handleNewTask();
    }
  };

  const onCtrlEnterPress = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      if (!!messageContent) handleNewMessage();
    }
  };

  const handleNewMessage = () => {
    createMessage({ content: messageContent, teamId: teamId });
  };

  if (
    sessionStatus === "loading" ||
    isTeamsLoading ||
    isTasksLoading ||
    isMessagesLoading
  ) {
    return <Loading />;
  }
  if (!sessionData) return;
  return (
    <>
      <Head>
        <title>{t("common:teams")}</title>
      </Head>
      <AddTeamModal
        isOpen={isAddingOpen}
        onOpenChange={onAddingOpenChange}
        onRefetch={handleRefetch}
      />
      <DeleteTeamModal
        team={team}
        isOpen={isDeleteTeamOpen}
        onOpenChange={onDeleteTeamOpenChange}
        onDelete={handleRefetch}
      />
      <EditTeamModal
        teamId={teamId}
        isOpen={isEditingOpen}
        onOpenChange={onEditingOpenChange}
        onRefetch={handleRefetch}
        onDeleteTeam={onDeleteTeamOpen}
      />
      <div
        className="flex h-screen w-screen flex-col overflow-x-hidden overflow-y-hidden"
        style={styleProp}
      >
        <section className="sec-container">
          <div className="2xl:w-3/7 mx-10 flex flex-1 flex-col md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2">
            <div className="flex flex-row items-center justify-between gap-1">
              <Select
                variant="underlined"
                label={t("common:choose_team")}
                className=""
                selectedKeys={[teamId]}
                onChange={(e) => {
                  setTeamId(e.target.value ? e.target.value : teamId);
                  setTeam(
                    e.target.value
                      ? teams.find((team) => team.id === e.target.value)
                      : teams.find((team) => team.id === teamId),
                  );
                }}
              >
                {teams.map((team: Team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.title}
                  </SelectItem>
                ))}
              </Select>
              <Tooltip
                className="rounded-md text-tiny text-default-500"
                content={t("common:add_team")}
                placement="top"
              >
                <Button
                  variant="bordered"
                  onClick={onAddingOpen}
                  className="min-w-unit-10 flex-1 border-none px-2 py-0 font-montserrat text-medium hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <PlusIcon width={25} className="my-auto" />
                </Button>
              </Tooltip>
              {team?.creatorId === sessionData.user.id && (
                <Tooltip
                  className="rounded-md text-tiny text-default-500"
                  content={t("common:edit_team")}
                  placement="top"
                >
                  <Button
                    variant="bordered"
                    onClick={onEditingOpen}
                    className="min-w-unit-10 flex-1 border-none px-2 py-0 font-montserrat text-medium hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <PencilIcon width={25} className="my-auto" />
                  </Button>
                </Tooltip>
              )}
            </div>
            {!!teamId && (
              <Tabs
                aria-label="tabs"
                variant="underlined"
                classNames={{
                  tabList:
                    "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-[#22d3ee]",
                  tab: "max-w-fit px-0 h-12",
                }}
              >
                <Tab
                  key="tasks"
                  title={
                    <div className="flex items-center space-x-2">
                      <span className="font-montserrat">
                        {t("common:tasks")}
                      </span>
                      <Chip size="sm" variant="faded">
                        {teamTasks.length}
                      </Chip>
                    </div>
                  }
                >
                  <form
                    className={`flex flex-col justify-center gap-2 rounded-md pt-2`}
                    onSubmit={(e) => handleNewTask(e)}
                  >
                    <div className="flex flex-row gap-2">
                      <input
                        required
                        value={taskTitle}
                        onKeyDown={(e) => onTaskCtrlEnterPress(e)}
                        onChange={(e) => setTaskTitle(e.target.value)}
                        placeholder={t("common:new_task_name")}
                        tabIndex={1}
                        className="mx-auto w-full rounded-sm border px-3 py-1 font-montserrat tracking-wide dark:border-slate-800 dark:bg-gray-800"
                      />
                      <Tooltip
                        className="rounded-md text-tiny text-default-500"
                        content={t("common:add_task")}
                        placement="top"
                      >
                        <button
                          tabIndex={3}
                          type="submit"
                          className={`mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br font-montserrat ${buttonStyleProp} w-25 p-3 text-xl font-bold dark:text-neutral-100`}
                        >
                          <PlusIcon width={12} />
                        </button>
                      </Tooltip>
                    </div>
                    <textarea
                      cols={30}
                      rows={3}
                      tabIndex={2}
                      value={taskContent}
                      onKeyDown={(e) => onTaskCtrlEnterPress(e)}
                      onChange={(e) => setTaskContent(e.target.value)}
                      placeholder={t("common:describe_task")}
                      className={`rounded-sm border p-3 font-montserrat tracking-wide dark:border-slate-800 dark:bg-gray-800 
                                    ${
                                      !taskTitle
                                        ? "-z-10 -mt-24 opacity-0"
                                        : "z-0 mt-0 opacity-100"
                                    }
                                    transition-all delay-150 duration-300 ease-in-out`}
                    ></textarea>
                  </form>
                  {teamTasks?.length === 0 ? (
                    <NoTasks />
                  ) : (
                    <FlipMove className="noscroll h-[65vh] overflow-y-auto pb-5">
                      {teamTasks?.map((task: WeightedTask, index) => (
                        <div key={task.id}>
                          <TaskCard
                            task={task}
                            fullWidth={true}
                            handleWeightChange={handleWeightChange}
                            tabIndex={3 * (index + 1)}
                            onDelete={handleDelete}
                          />
                        </div>
                      ))}
                    </FlipMove>
                  )}
                </Tab>
                <Tab
                  key="messages"
                  title={
                    <div className="flex items-center space-x-2">
                      <span className="font-montserrat">
                        {t("common:messages")}
                      </span>
                      <Chip size="sm" variant="faded">
                        {teamMessages.length}
                      </Chip>
                    </div>
                  }
                  className="flex flex-1 flex-col"
                >
                  <div className="flex flex-row">
                    <div className="flex h-[60vh] w-full flex-col-reverse overflow-y-auto">
                      {teamMessages.map((message: Message) => {
                        if (message.user?.id === "system" && isSystemHidden)
                          return null;
                        else {
                          let content = message.content;
                          if (
                            message.user?.id === "system" &&
                            message.messageProps
                          ) {
                            content = t(message.content);
                            content = content.replace(
                              "msgpropuser",
                              message.messageProps.split(",")[0] ?? "",
                            );
                            content = content.replace(
                              "msgproptask",
                              message.messageProps.split(",")[1] ?? "",
                            );
                            content = content.replace(
                              "msgpropweight",
                              message.messageProps.split(",")[2] ?? "",
                            );
                          }

                          return (
                            <div
                              key={message.id}
                              className="felx flex-col pb-2"
                            >
                              <div className="flex flex-row text-gray-500">
                                {moment(message.dateCreated).format(
                                  "D MMMM YYYY HH:mm",
                                )}
                                &nbsp;
                                {message.user?.id === "system"
                                  ? t("common:system")
                                  : message.user?.name}
                              </div>
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                className={`flex w-full flex-row whitespace-normal break-all rounded-sm border border-slate-800 bg-gray-800 bg-opacity-30 p-5 font-montserrat tracking-wide ${message.user?.id === "system" ? "text-yellow-200" : "text-normal-100"}`}
                              >
                                {content}
                              </ReactMarkdown>
                            </div>
                          );
                        }
                      })}
                    </div>
                  </div>
                  <div className="flex flex-row pb-1">
                    <Checkbox
                      isSelected={isSystemHidden}
                      onValueChange={setIsSystemHidden}
                    >
                      {t("common:hide_system_messages")}
                    </Checkbox>
                  </div>
                  <div className="flex flex-row pb-5">
                    <div className="flex w-full flex-row gap-1">
                      <div className="flex flex-1 flex-col">
                        <textarea
                          value={messageContent}
                          onKeyDown={(e) => onCtrlEnterPress(e)}
                          onChange={(e) => setMessageContent(e.target.value)}
                          className="rounded-sm border bg-opacity-60 p-2 font-montserrat tracking-wide dark:border-slate-800 dark:bg-gray-800"
                          placeholder={t("common:message")}
                        />
                      </div>
                      <div className="flex flex-col">
                        <Button
                          onClick={handleNewMessage}
                          variant="bordered"
                          className="w-min flex-1 border-none px-2 py-0 font-montserrat text-medium hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          <PaperAirplaneIcon width={25} className="my-auto" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  };
};

export default Teams;
