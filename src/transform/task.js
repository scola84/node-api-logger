import each from 'async/each';
import sprintf from 'sprintf';
import ovalues from 'lodash-es/values';

import Abstract from '../abstract';
import parts from './task/parts';

export default class TransformerTask extends Abstract {
  run(callback) {
    this._debuglog('LogTransformerTask run data=%j',
      this._data);

    this._database
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

  _transform(transformer, callback) {
    this._debuglog('LogTransformerTask _transform data=%j transformer=%j',
      this._data, transformer);

    const name =
      (transformer.base || this._data.name) +
      '.' +
      (transformer.group_value || transformer.group_name);

    let query = '';
    const values = [];

    query += parts.inner.select;
    values.push(name);

    if (transformer.id_value) {
      values.push(transformer.id_value);
    } else if (this._data.idval) {
      values.push(this._data.idval);
    }

    if (transformer.group_name === 'date') {
      values.push(parts.group[transformer.group_value]);
    } else if (transformer.group_name === 'time') {
      values.push(transformer.group_value);
      values.push(transformer.group_value);
    }

    if (this._data.aggrval) {
      values.push(this._data.aggrval);
    }

    query += parts.inner.from[transformer.type];
    query += parts.inner.where.name;
    values.push(this._data.name);

    if (this._data.id) {
      query += parts.inner.where.id;
      values.push(this._data.id.split(','));
    }

    query += parts.inner.group;

    if (transformer.group_name === 'date') {
      values.push(parts.group[transformer.group_value]);
    } else if (transformer.group_name === 'time') {
      values.push(transformer.group_value);
      values.push(transformer.group_value);
    }

    query = sprintf(query, {
      db: '%(db)s',
      id: parts.id[transformer.id_name],
      aggr: parts.aggr[transformer.aggr_name],
      group: parts.group[transformer.group_name]
    });

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

    query = this._database
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
        this._finish(name, callback);
        return;
      }

      query = this._database
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

        this._finish(name, callback);
      });
    });
  }

  _finish(name, callback) {
    this._pubsub.publish(this._config.pubsub.path, {
      event: this._config.pubsub.event,
      data: Object.assign(this._data, {
        name
      })
    });

    callback();
  }
}
