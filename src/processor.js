import queue from 'async/queue';
import Abstract from './abstract';

export default class LogProcessor extends Abstract {
  constructor() {
    super();

    this._queue = null;
    this._task = null;
  }

  task(value = null) {
    if (value === null) {
      return this._task;
    }

    this._task = value;
    return this;
  }

  start() {
    this._debuglog('Processor start %j', this._config);

    this._server
      .pubsub()
      .client()
      .subscribe(this._config.pubsub.path)
      .on(this._config.pubsub.event, (data) => {
        this._publish(data);
      });

    this._setup();
  }

  _setup() {
    this._queue = queue((t, c) => this._process(t, c),
      this._config.queue.concurrency);

    this._queue.drain = () => {
      this._stat('run', 0);
    };

    this._queue.error = (error) => {
      this._text('error', error.message);
    };

    if (this._config.queue.paused === true) {
      this._pause();
      return;
    }

    this._resume();
  }

  _process(data, callback) {
    this._debuglog('Processor _process data=%j', data);

    this._task()
      .config(this._config)
      .database(this._server.database())
      .i18n(this._server.i18n())
      .logger(this._server.logger())
      .pubsub(this._server.pubsub().client())
      .data(data)
      .run(callback);
  }

  _publish(data) {
    this._debuglog('Processor _pubsub data=%j', data);

    if (this._cancel(data) === true) {
      return false;
    }

    if (data.action === 'pause') {
      this._pause();
    }

    if (data.action === 'reset') {
      this._clear();
      this._setup();
    }

    if (data.action === 'resume') {
      this._resume();
    }

    if (data.action === 'run') {
      this._run(data);
    }

    return true;
  }

  _cancel(data) {
    if (typeof data.sid !== 'undefined') {
      return data.sid !== this._config.server.id;
    }

    if (typeof data.sn !== 'undefined') {
      return data.sn !== this._config.server.name;
    }

    return false;
  }

  _clear() {
    if (this._queue) {
      this._queue.kill();
      this._queue = null;
    }
  }

  _stat(name, value) {
    this._server
      .logger()
      .stat(
        [this._log(name, value)],
        this._config.database.queue,
        null,
        false
      );
  }

  _text(name, value) {
    this._server
      .logger()
      .text(
        [this._log(name, value)],
        this._config.database.queue,
        null,
        false
      );
  }

  _log(name, value) {
    return [
      this._config.server.name + '.queue.' + name,
      this._config.server.id,
      Date.now(),
      0,
      value
    ];
  }

  _pause() {
    this._queue.pause();
    this._stat('paused', 1);
  }

  _resume() {
    this._queue.resume();
    this._stat('paused', 0);
  }

  _run(data) {
    if (this._queue.paused === true) {
      return;
    }

    this._queue.push(data, () => {
      this._stat('tasks', this._length());
    });

    this._stat('run', 1);
    this._stat('tasks', this._length());
  }

  _length() {
    return this._queue.length() + this._queue.running();
  }
}
