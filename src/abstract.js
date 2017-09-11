import { debuglog } from 'util';

export default class Abstract {
  constructor() {
    this._debuglog = debuglog('logger');

    this._config = null;
    this._data = null;
    this._database = null;
    this._i18n = null;
    this._logger = null;
    this._pubsub = null;
    this._server = null;
  }

  config(value = null) {
    if (value === null) {
      return this._config;
    }

    this._config = value;
    return this;
  }

  data(value = null) {
    if (value === null) {
      return this._data;
    }

    this._data = value;
    return this;
  }

  database(value = null) {
    if (value === null) {
      return this;
    }

    this._database = value;
    return this;
  }

  i18n(value = null) {
    if (value === null) {
      return this._i18n;
    }

    this._i18n = value;
    return this;
  }

  logger(value = null) {
    if (value === null) {
      return this._logger;
    }

    this._logger = value;
    return this;
  }

  pubsub(value = null) {
    if (value === null) {
      return this._pubsub;
    }

    this._pubsub = value;
    return this;
  }

  server(value = null) {
    if (value === null) {
      return this._server;
    }

    this._server = value;
    return this;
  }
}
