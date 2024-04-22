import dotenv from 'dotenv';

import db from './db.js';
import app from './app.js';

dotenv.config({ path: 'secrets/.env' });

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

app(db(config.db)).listen(config.server.port);
