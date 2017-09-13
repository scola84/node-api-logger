import Transport from '../transport';

export default class ConsoleTransport extends Transport {
  stat(logs) {
    logs.forEach((log) => {
      this._write(log);
    });
  }

  text(logs) {
    logs.forEach((log) => {
      this._write(log);
    });
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
