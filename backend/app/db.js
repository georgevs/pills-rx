import mysql from 'mysql2';

export default function db({ host, port, user, password }) {
  const connection = mysql.createConnection({ host, port, user, password });
  connection.connect();
  const query = ({ sql, values }, callback) => {
    connection.query(sql, values, callback);
  };
  return { query };
}
