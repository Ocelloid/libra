import { PencilIcon } from "@heroicons/react/24/solid";
import { useTranslation } from "next-i18next";

const NoTasks = () => {
  const { t } = useTranslation(["ru", "en"]);
  return (
    <div className="mx-auto flex w-3/4 flex-row items-center justify-center gap-8 rounded-sm bg-slate-800 bg-opacity-30 p-10 font-montserrat text-lg text-neutral-50 md:w-1/2">
      <PencilIcon width={40} />
      <p>{t("common:no_entries")}</p>
    </div>
  );
};

export default NoTasks;
