import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "~/server/api/trpc";

export interface WeightedEntry {
    id: string,
    title: string,
    content: string,
    userId: string,
    parentId: string,
    dateCreated: Date,
    weightRating: number,
    childEntries?: WeightedEntry[] // this should be illegal
}

export const weightedEntryRouter = createTRPCRouter({

    createEntry: protectedProcedure
        .input(z.object({ content: z.string(), title: z.string(), weight: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {content, title, weight} = input;

            const newWeightedEntry = await db.weightedEntry.create({
                data: {
                    title: title,
                    content: content,
                    weightRating: weight,
                    userId: session.user.id
                },
                select: {id: true}
            });

            return newWeightedEntry;
        }),

    createChild: protectedProcedure
        .input(z.object({ content: z.string(), weight: z.number(), title: z.string(), parentId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {content, weight, title, parentId} = input;

            const newWeightedEntry = await db.weightedEntry.create({
                data: {
                    title: title,
                    content: content,
                    weightRating: weight,
                    userId: session.user.id,
                    parentId: parentId
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

            await db.weightedEntry.deleteMany({
                where: {
                    OR:[
                        {
                            userId: session.user.id,
                            id: id
                        },
                        {
                            userId: session.user.id,
                            parentId: id
                        },
                    ]
                }
            })
        }),

    updateEntry: protectedProcedure
        .input(z.object({ id: z.string(), content: z.string(), title: z.string(), weight: z.number() }))
        .mutation(async ({ ctx, input }) => {     
            const {db, session} = ctx;
            const {id, content, title, weight} = input;

            await db.weightedEntry.update({
                where: {
                    userId: session.user.id,
                    id: id
                },                
                data: {
                    weightRating: weight,
                    content: content,
                    title: title,
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

    getChildEntriesById: protectedProcedure
        .input(z.object({parentId: z.string()}))
        .query(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {parentId} = input;
            const data = await db.weightedEntry.findMany({
                where: {
                    userId: session.user.id,
                    parentId: parentId
                },
                orderBy: {
                    dateCreated: "desc",
                },
            });
            return data;
        }),
});
