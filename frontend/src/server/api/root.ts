import { createTRPCRouter } from "./trpc";
import { exampleRouter } from "./routers/example";
import { gettingStartRouter } from "./routers/gettingStart";
import { conversationRouter } from "./routers/conversation";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  gettingStart:gettingStartRouter,
  conversation:conversationRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
