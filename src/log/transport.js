export default class Transport {
  constructor() {
    this._server = null;
  }

  server(value = null) {
    if (value === null) {
      return this._server;
    }

    this._server = value;
    return this;
  }
}
