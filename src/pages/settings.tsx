import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { Avatar, Select, SelectItem, Switch } from "@nextui-org/react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useState } from "react";
import Loading from "~/components/Loading";
import { useTranslation } from "next-i18next";
import { type GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTheme } from "next-themes";

const Settings = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(["ru", "en"]);
  const { status: sessionStatus } = useSession();
  const { data: sessionData } = useSession();
  const [lngValue, setLngValue] = useState<string>(i18n.language);

  const handleLanguageChange = (lng: string) => {
    setLngValue(lng);
    void router.push(router.pathname, router.asPath, {
      locale: lng,
    });
  };

  if (sessionStatus === "loading") {
    return <Loading />;
  }
  if (!sessionData) return;
  return (
    <>
      <Head>
        <title>{t("common:settings")}</title>
      </Head>
      <div
        className="flex h-screen w-screen flex-col overflow-y-auto overflow-x-hidden"
        style={{
          backgroundImage: `url(/background-${theme}.png)`,
          backgroundSize: "100% 100%",
        }}
      >
        <section className="sec-container">
          <div className="2xl:w-3/7 mx-10 flex flex-col gap-5 md:mx-auto md:w-3/4 lg:w-2/3 xl:w-1/2">
            <div className="flex flex-row font-montserrat text-3xl">
              {t("common:settings")}
            </div>
            <div className="flex flex-row font-montserrat">
              <Switch
                isSelected={theme === "light"}
                onValueChange={(value) => {
                  setTheme(value ? "light" : "dark");
                }}
                size="md"
                color="success"
                startContent={<SunIcon />}
                endContent={<MoonIcon />}
              >
                {theme === "light"
                  ? t("common:theme_light")
                  : t("common:theme_dark")}
              </Switch>
            </div>
            <div>
              <Select
                variant="underlined"
                selectedKeys={[lngValue]}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full"
                classNames={{ label: "font-montserrat text-2lg" }}
                listboxProps={{
                  itemClasses: {
                    title: ["font-montserrat", "text-lg"],
                    base: ["font-montserrat", "text-lg"],
                  },
                }}
                placeholder={t("common:choose_language")}
                label={t("common:language")}
              >
                <SelectItem
                  key="ru"
                  startContent={
                    <Avatar
                      alt="Русский"
                      className="h-6 w-6"
                      src="https://flagcdn.com/ru.svg"
                    />
                  }
                >
                  Русский
                </SelectItem>
                <SelectItem
                  key="en"
                  startContent={
                    <Avatar
                      alt="English"
                      className="h-6 w-6"
                      src="https://flagcdn.com/us.svg"
                    />
                  }
                >
                  English
                </SelectItem>
              </Select>
            </div>
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

export default Settings;
