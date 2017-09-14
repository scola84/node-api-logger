import ConsoleTransport from './transport/console';
import MysqlTransport from './transport/mysql';

const transports = {
  console: ConsoleTransport,
  mysql: MysqlTransport
};

export default class Logger {
  constructor() {
    this._config = null;
    this._server = null;
    this._transport = null;
  }

  config(value = null) {
    if (value === null) {
      return this._config;
    }

    this._config = value;
    return this;
  }

  server(value = null) {
    if (value === null) {
      return this._server;
    }

    this._server = value;
    return this;
  }

  stat(logs, database, shard, callback) {
    this._setup().stat(logs, database, shard, callback);
  }

  text(logs, database, shard, callback) {
    this._setup().text(logs, database, shard, callback);
  }

  _setup() {
    if (this._transport === null) {
      this._transport = new transports[this._config.transport]()
        .server(this._server);
    }

    return this._transport;
  }
}
