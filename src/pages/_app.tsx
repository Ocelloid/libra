import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppProps, type AppType } from "next/app";
import { appWithTranslation } from "next-i18next";
import { type ComponentType } from "react";
import { api } from "~/utils/api";
import { Poppins, Montserrat } from "next/font/google";
import "~/styles/globals.css";
import Navigation from "../components/Navigation";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const poppinsFont = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["100", "400", "800"],
  variable: "--font-poppins",
});

const montserratFont = Montserrat({
  subsets: ["cyrillic", "latin", "latin-ext"],
  weight: ["100", "400", "800"],
  variable: "--font-montserrat",
});

interface MyAppProps {
  session: Session | null;
}

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <div className={`${poppinsFont.variable} ${montserratFont.variable}`}>
          <SessionProvider session={session}>
            <Component {...pageProps} />
            <Navigation />
          </SessionProvider>
          <div className="fixed bottom-0 flex h-6 w-full flex-col justify-between bg-slate-950 px-12 py-1">
            <a
              href="https://ocelloid.com"
              target="_blank"
              className="ml-auto text-xs"
            >
              © Ocelloid 2024
            </a>
          </div>
        </div>
      </NextThemesProvider>
    </NextUIProvider>
  );
};

export default appWithTranslation(
  api.withTRPC(MyApp) as ComponentType<AppProps<MyAppProps>>,
);
