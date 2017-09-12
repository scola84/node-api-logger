export default {
  convert: {
    time: 'day',
    day: 'month',
    month: 'year'
  },

  aggr: {
    avg: 'AVG(value)',
    cnt: 'COUNT(value)',
    max: 'MAX(value)',
    min: 'MIN(value)',
    sum: 'SUM(value)',

    pls: 'value + ?',
    mns: 'value - ?',
    mul: 'value * ?',
    div: 'value / ?',

    stdpop: 'STDDEV_POP(value)',
    stdsmp: 'STDDEV_SAMP(value)',
    varpop: 'VAR_POP(value)',
    varsmp: 'VAR_SAMP(value)'
  },

  group: {
    level: {
      date: `
        UNIX_TIMESTAMP(
          FROM_UNIXTIME(
            ROUND(timestamp / 1000) + offset,
            ?
          )
        ) * 1000
      `,
      time: 'FLOOR(timestamp / (? * 1000)) * (? * 1000)',
    },
    value: {
      day: '%Y-%m-%d',
      month: '%Y-%m-01',
      year: '%Y-01-01',
    }
  },

  id: {
    mask: 'id & ~(POWER(2,?) - 1)',
    self: 'id',
    val: '?'
  },

  inner: {
    select: `
      SELECT
        ? AS name,
        %(id)s AS id,
        %(group)s AS timestamp,
        MAX(offset) AS offset,
        %(aggr)s AS value,
        @prev := 0`,
    from: {
      stat: `
        FROM %(db)s.log_stat`,
      text: `
        FROM %(db)s.log_text`,
    },
    where: {
      name: `
        WHERE name = ?`,
      id: `
        AND id IN (?)`,
      timestamp: `
        AND timestamp > ?`
    },
    group: `
      GROUP BY %(group)s FOR UPDATE`
  },

  mic: `
    SELECT
      name,
      id,
      timestamp,
      offset,
      IF(@prev < i.value, i.value - @prev, i.value) AS value,
      @prev := i.value
    FROM (
      %(query)s
    ) AS i`,

  outer: `
    SELECT
      name,
      id,
      timestamp,
      offset,
      value
    FROM (
      %(query)s
    ) AS o`,

  replace: {
    into: `
      REPLACE INTO %(db)s.log_stat`,
    values: `
      VALUES ?`
  },

  transform: `
    SELECT *
    FROM %(db)s.log_transform
    WHERE
      name = ? AND
      \`order\` > 0
    ORDER BY \`order\` ASC`
};
