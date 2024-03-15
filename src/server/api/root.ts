import { TeamRouter } from './routers/Team';
import { MessageRouter } from './routers/Message';
import { CommentRouter } from './routers/Comment';
import { createTRPCRouter } from "~/server/api/trpc";
import { WeightedTaskRouter } from "~/server/api/routers/WeightedTask";
import { UserRouter } from '~/server/api/routers/User';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  WeightedTask: WeightedTaskRouter,
  Comment: CommentRouter,
  Message: MessageRouter,
  Team: TeamRouter,
  User: UserRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
