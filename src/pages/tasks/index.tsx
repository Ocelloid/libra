import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import NoTasks from "~/components/NoTasks";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";
import moment from "moment";
import "moment/locale/ru";
moment.locale("ru");
import FlipMove from "react-flip-move";
import TaskCard from "~/components/TaskCard";
import { type WeightedTask } from "~/server/api/routers/WeightedTask";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "next-i18next";
import { type GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTheme } from "next-themes";

const Tasks = () => {
  const { status: sessionStatus } = useSession();
  const { data: sessionData } = useSession();
  const { replace } = useRouter();
  const [styleProp, setStyleProp] = useState({});
  const { theme } = useTheme();
  const [tasks, setTasks] = useState<WeightedTask[]>([]);
  const [taskTitle, setTaskTitle] = useState<string>("");
  const [taskContent, setTaskContent] = useState<string>("");
  const [buttonStyleProp, setButtonStyleProp] = useState("");
  const { t } = useTranslation(["ru", "en"]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      void replace("/");
    }
  }, [replace, sessionStatus]);

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

  const { isLoading } = api.WeightedTask.getAllTasks.useQuery(undefined, {
    enabled: sessionStatus === "authenticated",
    onSuccess: (data: WeightedTask[]) => {
      setTasks(
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
  });

  const { mutate: updateTaskMutation } =
    api.WeightedTask.updateTaskWeight.useMutation();

  const { mutate: createTask } = api.WeightedTask.createTask.useMutation({
    onSuccess(data) {
      setTasks(
        [
          ...tasks,
          {
            id: data.id,
            title: taskTitle,
            userId: data.userId,
            parentId: "",
            content: taskContent,
            weightRating: 100,
            dateCreated: data.dateCreated,
            childTasks: [],
          },
        ].sort((a, b) => b.weightRating - a.weightRating),
      );
      setTaskTitle("");
      setTaskContent("");
    },
  });

  const handleWeightChange = (
    taskId: string,
    weight: number,
    commit: boolean | undefined,
  ) => {
    if (isNaN(Number(weight))) return;

    const newTasks: WeightedTask[] = tasks.map((task) => {
      if (task.id === taskId) {
        return {
          ...task,
          weightRating: weight,
        };
      } else return task;
    });

    if (commit) {
      setTasks(newTasks.sort((a, b) => b.weightRating - a.weightRating));
      updateTaskMutation({ id: taskId, weight: weight });
    } else setTasks(newTasks);
  };

  const handleDelete = (taskId: string) => {
    const newTasks: WeightedTask[] = tasks.filter((task) => task.id !== taskId);
    setTasks(newTasks);
  };

  const handleNewTask = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    createTask({ content: taskContent, title: taskTitle, weight: 100 });
  };

  const onCtrlEnterPress = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "Enter") {
      e.preventDefault();
      if (!!taskTitle) handleNewTask();
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return <Loading />;
  }
  if (!sessionData) return;
  return (
    <>
      <Head>
        <title>{t("common:personal_tasks")}</title>
      </Head>
      <div
        className="flex h-screen w-screen flex-col overflow-y-auto overflow-x-hidden"
        style={styleProp}
      >
        <section className="sec-container">
          <form
            className={`2xl:w-3/7 mx-10 flex flex-col justify-center gap-2 rounded-md pt-2 md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2`}
            onSubmit={(e) => handleNewTask(e)}
          >
            <div className="flex flex-row gap-2">
              <input
                required
                value={taskTitle}
                onKeyDown={(e) => onCtrlEnterPress(e)}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder={t("common:new_task_name")}
                tabIndex={1}
                className="mx-auto w-full rounded-sm border px-3 py-1 font-montserrat tracking-wide dark:border-slate-800 dark:bg-gray-800"
              />
              <button
                tabIndex={3}
                type="submit"
                className={`mx-auto whitespace-pre-line rounded-sm bg-gradient-to-br font-montserrat ${buttonStyleProp} w-25 p-3 text-xl font-bold dark:text-neutral-100`}
              >
                <PlusIcon width={12} />
              </button>
            </div>
            <textarea
              cols={30}
              rows={3}
              tabIndex={2}
              value={taskContent}
              onKeyDown={(e) => onCtrlEnterPress(e)}
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
          {tasks?.length === 0 ? (
            <NoTasks />
          ) : (
            <FlipMove className="noscroll h-[80vh] overflow-y-auto pb-5">
              {tasks?.map((task: WeightedTask, index) => (
                <div key={task.id}>
                  <TaskCard
                    task={task}
                    handleWeightChange={handleWeightChange}
                    tabIndex={3 * (index + 1)}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </FlipMove>
          )}
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

export default Tasks;
