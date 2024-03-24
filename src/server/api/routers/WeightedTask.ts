import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "~/server/api/trpc";

export interface WeightedTask {
    id: string,
    title: string,
    content: string,
    userId: string,
    parentId: string,
    dateCreated: Date,
    weightRating: number,
    teamId?: string,
    childTasks?: WeightedTask[] // this should be illegal
}

export const WeightedTaskRouter = createTRPCRouter({

    createTask: protectedProcedure
        .input(z.object({ content: z.string(), title: z.string(), weight: z.number(), teamId: z.string().nullable().optional(), parentId: z.string().nullable().optional() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {content, title, weight, teamId, parentId} = input;

            if (teamId) {
                const newWeightedTask = await db.weightedTask.create({
                    data: {
                        title: title,
                        content: content,
                        weightRating: weight,
                        userId: session.user.id,
                        parentId: parentId,
                        teamId: teamId,
                    },
                    select: {id: true, userId: true, dateCreated: true}
                });

                await db.message.create({
                    data: {
                        teamId: teamId,
                        creatorId: "system",
                        content: "Пользователь " + session.user.name + " добавил задачу " + "\"" + title + "\""
                    }
                })

                return newWeightedTask;
            }
            else { 
                const newWeightedTask = await db.weightedTask.create({
                    data: {
                        title: title,
                        content: content,
                        weightRating: weight,
                        userId: session.user.id,
                        parentId: parentId
                    },
                    select: {id: true, userId: true, dateCreated: true}
                });

                return newWeightedTask;
            }
        }),
    
    getTaskById: protectedProcedure
        .input(z.object({id: z.string()}))
        .query(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {id} = input;

            const entry = await db.weightedTask.findUnique({
                where: {
                    userId: session.user.id,
                    id: id
                },
                include: {
                    comments: true,
                    user: true,
                    team: true,
                }
            });

            return entry;
        }),

    deleteTask: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {            
            const {db, session} = ctx;
            const {id} = input;

            const task = await db.weightedTask.findUnique({
                where: {id: id},
            })

            if (task?.teamId) {
                await db.message.create({
                    data: {
                        teamId: task.teamId,
                        creatorId: "system",
                        content: "Пользователь " + session.user.name + " удалил задачу " + "\"" + task.title + "\""
                    }
                })
            }

            await db.weightedTask.deleteMany({
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

    updateTask: protectedProcedure
        .input(z.object({ id: z.string(), content: z.string(), title: z.string(), weight: z.number() }))
        .mutation(async ({ ctx, input }) => {     
            const {db, session} = ctx;
            const {id, content, title, weight} = input;

            const task = await db.weightedTask.findUnique({
                where: {id: id},
            })

            if (task?.teamId) {
                await db.message.create({
                    data: {
                        teamId: task.teamId,
                        creatorId: "system",
                        content: "Пользователь " + session.user.name + " изменил задачу " + "\"" + task.title + "\""
                    }
                })
            }

            await db.weightedTask.update({
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

    updateTaskWeight: protectedProcedure
        .input(z.object({ id: z.string(), weight: z.number() }))
        .mutation(async ({ ctx, input }) => {     
            const {db, session} = ctx;
            const {id, weight} = input;

            const task = await db.weightedTask.findUnique({
                where: {id: id},
            })

            if (task?.teamId) {
                await db.message.create({
                    data: {
                        teamId: task.teamId,
                        creatorId: "system",
                        content: "Пользователь " + session.user.name + " изменил вес задачи " + "\"" + task.title + "\"" + " на " + weight
                    }
                })
            }

            await db.weightedTask.update({
                where: {
                    userId: session.user.id,
                    id: id
                },                
                data: {
                    weightRating: weight,
                }
            })
        }),

    getAllTasks: protectedProcedure
        .query(async ({ ctx }) => {
            const {db, session} = ctx;
            const data = await db.weightedTask.findMany({
                where: {
                    userId: session.user.id,
                    teamId: null,
                },
                include: {
                    comments: true,
                },
                orderBy: {
                    dateCreated: "desc",
                },
            });
            return data;
        }),

    getAllTasksByTeam: protectedProcedure
        .input(z.object({teamId: z.string()}))    
        .query(async ({ ctx, input }) => {
            const {db} = ctx;
            const {teamId} = input;
            const data = await db.weightedTask.findMany({
                where: {
                    teamId: teamId
                },
                include: {
                    comments: true,
                },
                orderBy: {
                    dateCreated: "desc",
                },
            });
            return data;
        }),

    getChildTasksById: protectedProcedure
        .input(z.object({parentId: z.string()}))
        .query(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {parentId} = input;
            const data = await db.weightedTask.findMany({
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
