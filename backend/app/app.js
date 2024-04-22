import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import createError from 'http-errors';

import drugs from './routes/drugs.js';
import prescriptions from './routes/prescriptions.js';
import takes from './routes/takes.js';

export default function app(db) {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api/v1/drugs', drugs(db));
  app.use('/api/v1/prescriptions', prescriptions(db));
  app.use('/api/v1/takes', takes(db));
  app.route('*').all(() => { throw createError.NotFound() });

  app.use((err, req, res, next) => {
    if (err?.sqlMessage) { err = createError.InternalServerError(err.sqlMessage) }
    if (!err?.status) { err = createError.InternalServerError(err) }
    const { status, message } = { ...err, ...err.constructor.prototype };
    res.status(status).json({ status, message });
  });

  return app;
}
