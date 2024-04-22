import express from 'express';
import createError from 'http-errors';

export default function prescriptions(db) {
  const router = express.Router();
  
  router.route('/')
    .get((req, res, next) => {
      const sql = 'SELECT * FROM pills_rx.Prescriptions';
      db.query({ sql }, (err, results) => {
        if (err) { next(err) }
        else { res.json(results) }
      });
    })
    .all(() => { throw createError.MethodNotAllowed() });

  router.route('/:pid')
    .get((req, res, next) => {
      const pid = Number.parseInt(req.params.pid);
      if (isNaN(pid)) { throw createError.BadRequest('Invalid id') }
      const sql = 'SELECT * FROM pills_rx.Prescriptions WHERE pid=?';
      const values = [pid];
      db.query({ sql, values }, (err, results) => {
        if (!results?.length) { err = createError.NotFound() }
        if (err) { next(err) }
        else { res.json(results[0]) }
      });
    })
    .all(() => { throw createError.MethodNotAllowed() });

  return router;
}
