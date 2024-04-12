import Link from "next/link";
import { XMarkIcon, ScaleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
  User,
  useDisclosure,
  Chip,
} from "@nextui-org/react";
import SeeInvitesModal from "./modals/seeInvites";
import { api } from "~/utils/api";
import { useRouter } from "next/router";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { data: sessionData } = useSession();
  const {
    isOpen: isInvitesOpen,
    onOpen: onInvitesOpen,
    onOpenChange: onInvitesOpenChange,
  } = useDisclosure();
  const { t, i18n } = useTranslation(["ru", "en"]);

  const { data: userInvites, refetch } = api.Team.countAllInvitations.useQuery(
    undefined,
    { refetchInterval: 5000 },
  );

  const pathOpen = (pathname: string) => {
    void router.replace(
      `${i18n.language === router.defaultLocale ? "" : i18n.language}/${pathname}`,
    );
  };

  if (sessionData)
    return (
      <nav className="iphone-backdrop absolute left-0 top-0 z-10 flex w-full flex-col items-center justify-between gap-8 bg-transparent p-7 md:fixed md:flex-row md:gap-0">
        <SeeInvitesModal
          isOpen={isInvitesOpen}
          onOpenChange={onInvitesOpenChange}
          onRefetch={refetch}
        />
        <div className="flex w-full items-center justify-between font-poppins font-bold lowercase tracking-tight dark:text-neutral-100 md:text-4xl">
          <Link
            href="/"
            className="hover:text-gray-700 dark:hover:text-gray-300"
          >
            Libra
          </Link>
          <div className="flex md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <XMarkIcon width={30} /> : <ScaleIcon width={30} />}
          </div>
        </div>
        <ul
          className={`items-right mr-auto flex flex-col gap-8 font-montserrat dark:text-neutral-100 md:flex-row md:justify-end md:gap-10 ${!isOpen && "hidden md:flex"}`}
        >
          <Button
            onClick={() => {
              setIsOpen(false);
              pathOpen("tasks");
            }}
            variant="bordered"
            className="w-min border-none px-4 py-2 font-montserrat text-medium hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t("common:personal_tasks")}
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              pathOpen("teams");
            }}
            variant="bordered"
            className="w-min border-none px-4 py-2 font-montserrat text-medium hover:text-gray-700 dark:hover:text-gray-300"
          >
            {t("common:teams")}
          </Button>
          {!!userInvites && (
            <Button
              variant="bordered"
              onClick={onInvitesOpen}
              className="w-min border-none px-4 py-0 font-montserrat text-medium hover:text-gray-700 dark:hover:text-gray-300 md:hidden"
            >
              {t("common:invites")}{" "}
              <Chip size="sm" variant="flat" color="warning">
                {userInvites}
              </Chip>
            </Button>
          )}
          <Button
            onClick={() => {
              setIsOpen(false);
              pathOpen("settings");
            }}
            variant="bordered"
            className="w-min border-none px-4 py-2 font-montserrat text-medium hover:text-gray-700 dark:hover:text-gray-300 md:hidden"
          >
            {t("common:settings")}
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              void signOut();
            }}
            variant="bordered"
            className="w-min border-none px-4 py-0 font-montserrat text-medium text-red-500 md:hidden"
          >
            {t("common:logout")}
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <div className="relative flex">
                <User
                  as="button"
                  avatarProps={{
                    isBordered: true,
                    size: "sm",
                    className: "w-10 h-8",
                    src: sessionData.user.image ?? "",
                  }}
                  className="hidden border-none font-montserrat text-medium hover:text-gray-300 md:flex"
                  name={sessionData.user.name}
                />
                {!!userInvites && (
                  <Chip
                    size="sm"
                    variant="solid"
                    color="warning"
                    className="absolute left-6 top-6"
                  >
                    {userInvites}
                  </Chip>
                )}
              </div>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="acconut_actions"
              disabledKeys={!userInvites ? ["invitations"] : []}
              itemClasses={{
                title: [
                  "font-montserrat",
                  "text-medium",
                  "dark:hover:text-gray-300",
                  "hover:text-gray-700",
                ],
                base: [
                  "bg-transparent",
                  "hover:bg-transparent",
                  "dark:text-neutral-100",
                ],
              }}
            >
              <DropdownItem
                key="invitations"
                onClick={onInvitesOpen}
                endContent={
                  !!userInvites && (
                    <Chip size="sm" variant="solid" color="warning">
                      {userInvites}
                    </Chip>
                  )
                }
              >
                {t("common:invites")}
              </DropdownItem>
              <DropdownItem key="settings" onClick={() => pathOpen("settings")}>
                {t("common:settings")}{" "}
              </DropdownItem>
              <DropdownItem
                key="exit"
                className="text-danger"
                color="danger"
                onClick={() => signOut()}
              >
                {t("common:logout")}
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </ul>
      </nav>
    );
};

// export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
//     return {
//       props: {
//         ...(await serverSideTranslations(locale ?? "en", ["common"])),
//       },
//     };
//   };

export default Navigation;
