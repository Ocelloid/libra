import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import type { GetServerSideProps, NextPage } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const Home: NextPage = () => {
  const { data: sessionData } = useSession();
  const [styleProp, setStyleProp] = useState({});
  const { theme } = useTheme();
  const { t } = useTranslation(["ru", "en"]);

  useEffect(() => {
    const newStyleProp = {
      backgroundImage: `url(/background-${theme}.png)`,
      backgroundSize: "100% 100%",
    };
    setStyleProp(newStyleProp);
  }, [theme]);

  return (
    <>
      <Head>
        <title>Libra</title>
        <meta name="description" content={t("common:subtitle")} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className="flex h-screen items-center bg-cover bg-center"
        style={styleProp}
      >
        <div className="m-auto mt-64 flex flex-col justify-center gap-5 text-center align-middle">
          <h1 className=" flex flex-col bg-gradient-to-br from-slate-300 to-slate-900 box-decoration-slice bg-clip-text p-2 font-poppins text-9xl font-extrabold lowercase text-transparent">
            Libra
            <span className="font-montserrat text-2xl font-normal dark:text-white">
              {t("common:subtitle")}
            </span>
          </h1>
          <AuthShowcase />
          <button
            onClick={sessionData ? () => void signOut() : () => void signIn()}
            className="mx-auto rounded-sm bg-gradient-to-br from-indigo-500 to-indigo-600 px-20 py-2 font-montserrat text-2xl font-bold text-neutral-50 shadow-sm"
          >
            {sessionData ? t("common:logout") : t("common:login")}
          </button>
        </div>
      </div>
    </>
  );
};

function AuthShowcase() {
  const { data: sessionData } = useSession();
  const { t } = useTranslation(["ru", "en"]);
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-1xl text-center font-montserrat dark:text-white">
        {sessionData && (
          <span>
            {t("common:login_as")} {sessionData.user?.name}
          </span>
        )}
      </p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? "en", ["common"])),
    },
  };
};

export default Home;
