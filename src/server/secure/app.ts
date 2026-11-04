import express, { type Express, type RequestHandler, type Router } from 'express';

/**
 * Secure API boundary. The legacy mockDb backend is NEVER mounted here.
 * Route modules may be registered only after verified authentication and
 * tenant authorization are implemented in subsequent migration tasks.
 */
export interface SecureDeps {
  requireActor?: RequestHandler;
  registerCourses?: (router: Router) => void;
}

export function createSecureApp(deps: SecureDeps = {}): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Do not register any protected routes without a mandatory identity guard.
  if (deps.requireActor && deps.registerCourses) {
    const protectedRouter = express.Router();
    deps.registerCourses(protectedRouter);
    // The guard wraps the entire router, even if a future module omits it.
    app.use('/api', deps.requireActor, protectedRouter);
  }

  // Missing features must never fall back to the demo API.
  app.use((_req, res) => {
    res.status(404).json({ message: 'Endpoint unavailable' });
  });

  return app;
}
