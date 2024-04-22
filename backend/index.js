const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const createError = require('http-errors');

require('dotenv').config({ path: 'secrets/.env' });

const config = {
  server: {
    port: 8080
  },
  db: {
    host: '172.20.0.103', 
    port: 3306, 
    user: 'root', 
    password: process.env.MYSQL_ROOT_PASSWORD
  }
};

const db = ({ host, port, user, password }) => {
  const connection = mysql.createConnection({ host, port, user, password });
  connection.connect();
  const query = ({ sql, values }, callback) => {
    connection.query(sql, values, callback);
  };
  return { query };
};

const drugs = (db) => {
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
};

const prescriptions = (db) => {
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
};

const takes = (db) => {
  const router = express.Router();

  const normalizeResults = results => (
    results.map(({ days, ...rest }) => Object.assign(
      rest, 
      days && { days: days.split(',').map(x => parseInt(x.trim())).filter(Boolean) }
    ))
  );
  
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
};

const app = (db) => {
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
};

app(db(config.db)).listen(config.server.port);
