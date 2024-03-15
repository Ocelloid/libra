import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "~/server/api/trpc";

export interface User {
    id: string,
    name: string | null,
    email: string | null,
    image: string | null,
    emailVerified: Date | null,
}

export const UserRouter = createTRPCRouter({

    getUserByEmail: protectedProcedure
        .input(z.object({ email: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const {db} = ctx;
            const {email} = input;

            const data = await db.user.findFirst({
                where: {
                    email: email
                },
            });

            return data;
        }),
})