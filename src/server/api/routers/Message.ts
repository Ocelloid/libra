import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type User } from "./User";

export interface Message {
  id: string;
  content: string;
  messageProps?: string;
  creatorId: string | null;
  teamId: string;
  dateCreated: Date;
  user: User | null;
}

export const MessageRouter = createTRPCRouter({
  getAllMessagesByTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db } = ctx;
      const { teamId } = input;

      const messages = await db.message.findMany({
        where: {
          teamId: teamId,
        },
        include: {
          user: true,
        },
        orderBy: {
          dateCreated: "desc",
        },
      });

      return messages;
    }),

  createMessage: protectedProcedure
    .input(z.object({ teamId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { teamId, content } = input;

      const newMessage = await db.message.create({
        data: {
          creatorId: session.user.id,
          teamId: teamId,
          content: content,
        },
        select: { id: true, creatorId: true, dateCreated: true, user: true },
      });

      return newMessage;
    }),

  updateMessage: protectedProcedure
    .input(z.object({ messageId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { messageId, content } = input;

      const newMessage = await db.message.update({
        where: {
          id: messageId,
          creatorId: session.user.id,
        },
        data: {
          content: content,
        },
        select: { id: true },
      });

      return newMessage;
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { messageId } = input;

      await db.message.delete({
        where: {
          id: messageId,
          creatorId: session.user.id,
        },
      });
    }),
});
