import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "~/server/api/trpc";

export const weightedEntryRouter = createTRPCRouter({

    createEntry: protectedProcedure
        .input(z.object({ content: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {content} = input;

            const newWeightedEntry = await db.weightedEntry.create({
                data: {
                    content: content,
                    userId: session.user.id
                },
                select: {id: true}
            });

            return newWeightedEntry;
        }),
    
    getEntryById: protectedProcedure
        .input(z.object({id: z.string()}))
        .query(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {id} = input;

            const entry = await db.weightedEntry.findUnique({
                where: {
                    userId: session.user.id,
                    id: id
                }
            });

            return entry;
        }),

    deleteEntry: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {            
            const {db, session} = ctx;
            const {id} = input;

            await db.weightedEntry.delete({
                where: {
                    userId: session.user.id,
                    id: id
                }
            })
        }),

    getAllEntries: protectedProcedure
        .query(async ({ ctx }) => {
            const {db, session} = ctx;
            const data = await db.weightedEntry.findMany({
                where: {
                    userId: session.user.id
                },
                orderBy: {
                    dateCreated: "desc",
                },
            });
            return data;
        }),
});
