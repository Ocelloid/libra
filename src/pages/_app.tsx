import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";

import { api } from "~/utils/api";

import {Poppins, Montserrat} from "next/font/google";

import "~/styles/globals.css";
import Navigation from "../components/Navigation";

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
    <div className={`${poppinsFont.variable} ${montserratFont.variable}`}>
      <SessionProvider session={session}>
        <Navigation/>
        <Component {...pageProps} />
      </SessionProvider>
    </div>
  );
};

export default api.withTRPC(MyApp);
