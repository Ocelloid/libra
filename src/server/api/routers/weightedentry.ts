import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "~/server/api/trpc";

export const weightedEntryRouter = createTRPCRouter({

    createEntry: protectedProcedure
        .input(z.object({ content: z.string(), weight: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {content, weight} = input;

            const newWeightedEntry = await db.weightedEntry.create({
                data: {
                    content: content,
                    weightRating: weight,
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

    updateEntry: protectedProcedure
        .input(z.object({ id: z.string(), content: z.string(), weight: z.number() }))
        .mutation(async ({ ctx, input }) => {     
            const {db, session} = ctx;
            const {id, content, weight} = input;

            await db.weightedEntry.update({
                where: {
                    userId: session.user.id,
                    id: id
                },                
                data: {
                    weightRating: weight,
                    content: content,
                }
            })
        }),

    updateEntryWeight: protectedProcedure
        .input(z.object({ id: z.string(), weight: z.number() }))
        .mutation(async ({ ctx, input }) => {     
            const {db, session} = ctx;
            const {id, weight} = input;

            await db.weightedEntry.update({
                where: {
                    userId: session.user.id,
                    id: id
                },                
                data: {
                    weightRating: weight,
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
