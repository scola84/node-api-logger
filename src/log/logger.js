import LogAbstract from '../abstract';
import ConsoleTransport from './transport/console';
import MysqlTransport from './transport/mysql';

const transports = {
  console: ConsoleTransport,
  mysql: MysqlTransport
};

export default class Logger extends LogAbstract {
  constructor() {
    super();
    this._transport = null;
  }

  stat(logs, database, shard, publish) {
    this._setup().stat(logs, database, shard);
    this._publish(logs[0], shard, publish);
  }

  text(logs, database, shard, publish) {
    this._setup().text(logs, database, shard);
    this._publish(logs[0], shard, publish);
  }

  _publish([, id, name], shard, publish = true) {
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
