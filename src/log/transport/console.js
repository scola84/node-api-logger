import Transport from '../transport';

export default class ConsoleTransport extends Transport {
  stat(logs, connection, shard, callback = () => {}) {
    logs.forEach((log) => {
      this._write(log, callback);
    });

    callback();
  }

  text(logs, connection, shard, callback = () => {}) {
    logs.forEach((log) => {
      this._write(log, callback);
    });

    callback();
  }

  _write([id, name, timestamp, offset, value]) {
    console.log(
      '%s %s %s %s %s',
      id || '-',
      name,
      new Date(timestamp + offset).toISOString(),
      offset,
      value
    );
  }
}
