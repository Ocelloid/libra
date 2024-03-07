import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import {Poppins, Montserrat} from "next/font/google";

import "~/styles/globals.css";
import Navigation from "../components/Navigation";

import {NextUIProvider} from "@nextui-org/react";

const poppinsFont = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["100", "400", "800"],
  variable: "--font-poppins",
})

const montserratFont = Montserrat({
  subsets: ["cyrillic", "latin", "latin-ext"],
  weight: ["100", "400", "800"],
  variable: "--font-montserrat",
})

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <NextUIProvider>
      <div className={`${poppinsFont.variable} ${montserratFont.variable}`} style={{backgroundImage: `url(/background.png)`, backgroundSize: '100% 100%'}}>
          <SessionProvider session={session}>
            <Component {...pageProps} />
            <Navigation/> 
          </SessionProvider>
      </div>
    </NextUIProvider>
  );
};

export default api.withTRPC(MyApp);
