import { debuglog } from 'util';
import each from 'async/each';
import sprintf from 'sprintf';
import ovalues from 'lodash-es/values';
import parts from './task/parts';

export default class TransformTask {
  constructor() {
    this._log = debuglog('logger');

    this._config = null;
    this._data = null;
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

  server(value = null) {
    if (value === null) {
      return this._server;
    }

    this._server = value;
    return this;
  }

  run(callback) {
    this._log('TransformTask run data=%j', this._data);

    this._server
      .database()
      .connection(this._config.database.source)
      .query(parts.transform, [this._data.name], (error, transformers) => {
        if (error instanceof Error === true) {
          callback(error);
          return;
        }

        each(transformers, (transformer, eachCallback) => {
          this._transform(transformer, eachCallback);
        }, callback);
      });
  }

  _inner(transformer, name, query, values) {
    let object = {};

    query += parts.inner.select.main;
    values.push(name);

    [object, values] = this._db(transformer, object, values);
    [object, values] = this._id(transformer, object, values);
    [object, values] = this._group(transformer, object, values);
    [object, values] = this._aggr(transformer, object, values);
    [object, values] = this._prev(transformer, object, values);

    [query, values] = this._from(transformer, query, values);
    [query, values] = this._where(transformer, query, values, 'main');

    query += parts.inner.group;

    [object, values] = this._group(transformer, object, values);

    query = sprintf(query, object);

    return [query, values];
  }

  _db(transformer, object, values) {
    object.db = '%(db)s';
    return [object, values];
  }

  _id(transformer, object, values) {
    object.id = parts.id[transformer.id_name];

    if (transformer.id_value) {
      values.push(transformer.id_value);
    } else if (this._data.idval) {
      values.push(this._data.idval);
    }

    return [object, values];
  }

  _group(transformer, object, values) {
    object.group = parts.group.level[transformer.group_name];

    if (transformer.group_name === 'date') {
      values.push(parts.group.value[transformer.group_value]);
    } else if (transformer.group_name === 'time') {
      values.push(transformer.group_value);
      values.push(transformer.group_value);
    } else {
      object.group = 'timestamp';
    }

    return [object, values];
  }

  _aggr(transformer, object, values) {
    object.aggr = parts.aggr[transformer.aggr_name];

    if (this._data.aggrval) {
      values.push(this._data.aggrval);
    }

    return [object, values];
  }

  _prev(transformer, object, values) {
    if (typeof this._data.timestamp === 'undefined') {
      object.prev = 0;
      return [object, values];
    }

    let query = parts.inner.select.prev;

    [query, values] = this._from(transformer, query, values);
    [query, values] = this._where(transformer, query, values, 'prev');

    object.prev = '(' + query + ')';

    return [object, values];
  }

  _from(transformer, query, values) {
    query += parts.inner.from[transformer.type];
    return [query, values];
  }

  _where(transformer, query, values, part) {
    query += parts.inner.where.name;
    values.push(this._data.name);

    if (this._data.id) {
      query += parts.inner.where.id;
      values.push(String(this._data.id).split(','));
    }

    if (this._data.timestamp) {
      query += parts.inner.where.timestamp[part];
      values.push(this._convert(transformer, this._data.timestamp));
    }

    return [query, values];
  }

  _transform(transformer, callback) {
    this._log('TransformTask _transform data=%j transformer=%j',
      this._data, transformer);

    const name =
      (transformer.base || this._data.name) +
      '.' +
      (transformer.group_value || transformer.group_name);

    let query = '';
    let values = [];

    [query, values] = this._inner(transformer, name, query, values);

    if (transformer.wrap_name) {
      query = sprintf(parts[transformer.wrap_name], {
        query
      });
    }

    query = sprintf(parts.outer, {
      query
    });

    let replace = parts.replace.into;

    if (transformer.source === transformer.target) {
      query = replace + query;
    } else {
      replace += parts.replace.values;
    }

    query = this._server
      .database()
      .connection(transformer.source)
      .query(query);

    if (typeof this._data.shard !== 'undefined') {
      query.shard(this._data.shard);
    }

    query.execute(values, (error, result) => {
      if (error) {
        callback(error);
        return;
      }

      if (transformer.source === transformer.target) {
        this._finish(name, result.affectedRows, callback);
        return;
      }

      query = this._server
        .database()
        .connection(transformer.target)
        .query(replace);

      if (typeof this._data.shard !== 'undefined') {
        query.shard(this._data.shard);
      }

      result = result.map((row) => ovalues(row));

      query.execute([result], (targetError) => {
        if (targetError) {
          callback(targetError);
          return;
        }

        this._finish(name, result.length, callback);
      });
    });
  }

  _finish(name, rows, callback) {
    this._log('TransformTask _finish name=%s #rows=%d', name, rows);

    this._config.publish.forEach((path) => {
      this._server
        .pubsub()
        .client()
        .publish(path, {
          event: 'done',
          data: Object.assign(this._data, {
            name
          })
        });
    });

    callback();
  }

  _convert(transformer, timestamp) {
    const name = transformer.group_name === 'time' ?
      transformer.group_name : transformer.group_value;

    if (parts.convert[name]) {
      return this._server
        .i18n()
        .date()
        .moment(Number(timestamp))
        .startOf(name)
        .valueOf();
    }

    return 0;
  }
}
