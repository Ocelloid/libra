import { useTranslation } from "next-i18next";

const Loading = () => {
  const { t } = useTranslation(["ru", "en"]);
  return (
    <div className="flex h-screen justify-center">
      <h1 className="m-auto font-poppins text-4xl font-bold text-neutral-100">
        {t("common:loading")}...
      </h1>
    </div>
  );
};

export default Loading;
