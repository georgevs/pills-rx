import express from 'express';
import createError from 'http-errors';

export default function drugs(db) {
  const router = express.Router();
  
  router.route('/')
    .get((req, res, next) => {
      const sql = 'SELECT * FROM pills_rx.Drugs';
      db.query({ sql }, (err, results) => {
        if (err) { next(err) }
        else { res.json(results) }
      });
    })
    .all(() => { throw createError.MethodNotAllowed() });

  router.route('/:did')
    .get((req, res, next) => {
      const did = Number.parseInt(req.params.did);
      if (isNaN(did)) { throw createError.BadRequest('Invalid id') }
      const sql = 'SELECT * FROM pills_rx.Drugs WHERE did=?';
      const values = [did];
      db.query({ sql, values }, (err, results) => {
        if (!results?.length) { err = createError.NotFound() }
        if (err) { next(err) }
        else { res.json(results[0]) }
      });
    })
    .all(() => { throw createError.MethodNotAllowed() });

  return router;
}
