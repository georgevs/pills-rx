import express from 'express';
import createError from 'http-errors';

export default function takes(db) {
  const router = express.Router();

  router.route('/')
    .get((req, res, next) => {
      const sql = 'SELECT * FROM pills_rx.Takes';
      db.query({ sql }, (err, results) => {
        if (!err) {
          results = normalizeResults(results);
        }
        if (err) { next(err) }
        else { res.json(results) }
      });
    })
    .all(() => { throw createError.MethodNotAllowed() });

  router.route('/:pid')
    .get((req, res, next) => {
      const pid = Number.parseInt(req.params.pid);
      if (isNaN(pid)) { throw createError.BadRequest('Invalid id') }
      const sql = 'SELECT * FROM pills_rx.Takes WHERE pid=?';
      const values = [pid];
      db.query({ sql, values }, (err, results) => {
        if (!results?.length) { err = createError.NotFound() }
        if (!err) {
          results = normalizeResults(results);
        }
        if (err) { next(err) }
        else { res.json(results) }
      });
    })
    .all(() => { throw createError.MethodNotAllowed() });

  return router;
}

function normalizeResults(results) {
  return (
    results.map(({ days, ...rest }) => Object.assign(
      rest,
      days && { days: days.split(',').map(x => parseInt(x.trim())).filter(Boolean) }
    ))
  );
}
