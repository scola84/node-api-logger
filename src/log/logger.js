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

  stat(logs, database, shard, publish) {
    this._setup().stat(logs, database, shard);
    this._publish(logs[0], shard, publish);
  }

  text(logs, database, shard, publish) {
    this._setup().text(logs, database, shard);
    this._publish(logs[0], shard, publish);
  }

  _publish([name, id], shard, publish = true) {
    if (typeof this._config.pubsub === 'undefined') {
      return;
    }

    if (publish === false) {
      return;
    }

    this._server
      .pubsub()
      .client()
      .publish(this._config.pubsub.path, {
        event: this._config.pubsub.event,
        data: {
          id,
          name,
          shard
        }
      });
  }

  _setup() {
    if (this._transport === null) {
      this._transport = new transports[this._config.transport]()
        .server(this._server);
    }

    return this._transport;
  }
}
