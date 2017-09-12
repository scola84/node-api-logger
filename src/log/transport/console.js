import Transport from '../transport';

export default class ConsoleTransport extends Transport {
  stat(logs) {
    this._write(logs[0], logs.length);
  }

  text(logs) {
    this._write(logs[0], logs.length);
  }

  _write([id, name, timestamp, offset, value], length = 0) {
    console.log(
      id,
      name,
      new Date(timestamp + offset).toISOString(),
      value,
      length > 1 ? length : ''
    );
  }
}
