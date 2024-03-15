import { z } from "zod";
import { createTRPCRouter, protectedProcedure} from "~/server/api/trpc";

export interface Comment {
    id: string,
    content: string,
    creatorId: string | null,
    taskId: string,
    dateCreated: Date,
}

export const CommentRouter = createTRPCRouter({

    getAllCommentsByTask: protectedProcedure
        .input(z.object({ taskId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const {db} = ctx;
            const {taskId,} = input;

            const comments = await db.comment.findMany({
                where: {
                    taskId: taskId,
                }
            });

            return comments;
        }),

    createComment: protectedProcedure
        .input(z.object({ taskId: z.string(), content: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {taskId, content} = input;

            const newComment = await db.comment.create({
                data: {
                    creatorId: session.user.id,
                    taskId: taskId,
                    content: content,
                },
                select: {id: true}
            });

            return newComment;
        }),

    updateComment: protectedProcedure
        .input(z.object({ commentId: z.string(), content: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {commentId, content} = input;

            const newComment = await db.comment.update({
                where: {
                    id: commentId,
                    creatorId: session.user.id,
                },
                data: {
                    content: content,
                },
                select: {id: true}
            });

            return newComment;
        }),

    deleteComment: protectedProcedure
        .input(z.object({ commentId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const {db, session} = ctx;
            const {commentId} = input;

            await db.comment.delete({
                where: {
                    id: commentId,
                    creatorId: session.user.id,
                },
            });
        }),

})