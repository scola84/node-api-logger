import Transport from '../transport';

const queries = {
  stat: `
    INSERT INTO %(db)s.log_stat VALUES ?`,
  text: `
    INSERT INTO %(db)s.log_text VALUES ?`
};

export default class MysqlTransport extends Transport {
  stat(logs, connection, shard, callback) {
    this._write(queries.stat, logs, connection, shard, callback);
  }

  text(logs, connection, shard, callback) {
    this._write(queries.text, logs, connection, shard, callback);
  }

  _write(query, logs, connection = 'logger',
    shard = null, callback = () => {}) {

    query = this._server
      .database()
      .connection(connection)
      .query(query);

    if (shard !== null) {
      query.shard(shard);
    }

    query.execute([logs], (error) => {
      if (error instanceof Error === true) {
        console.error(error);
      }

      callback();
    });
  }
}
