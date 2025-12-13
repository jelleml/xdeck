/**
 * Main tRPC router
 * Combines all sub-routers
 */
import { router } from './init';
import { adminRouter } from './routers/admin';
import { authRouter } from './routers/auth';
import { billingRouter } from './routers/billing';
import { decksRouter } from './routers/decks';
import { engineRouter } from './routers/engine';
import { ordersRouter } from './routers/orders';
import { organizationsRouter } from './routers/organizations';
import { sharesRouter } from './routers/shares';
import { tasksRouter } from './routers/tasks';
import { userRouter } from './routers/user';
import { viewsRouter } from './routers/views';

export const appRouter = router({
  auth: authRouter,
  tasks: tasksRouter,
  user: userRouter,
  organizations: organizationsRouter,
  billing: billingRouter,
  engine: engineRouter,
  orders: ordersRouter,
  decks: decksRouter,
  shares: sharesRouter,
  views: viewsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
