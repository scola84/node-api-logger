export default {
  convert: {
    time: 'day',
    day: 'month',
    month: 'year'
  },

  aggr: {
    avg: 'AVG(value)',
    max: 'MAX(value)',
    min: 'MIN(value)',
    sum: 'SUM(value)',

    mic: `
      MIN(value) AS min,
      MAX(value)`,

    pls: 'value + ?',
    mns: 'value - ?',
    mul: 'value * ?',
    div: 'value / ?',

    cntall: 'COUNT(value)',
    cntdis: 'COUNT(DISTINCT value)',

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
            (timestamp / 1000) + offset,
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
    select: {
      main: `
        SELECT
          ? AS name,
          %(id)s AS id,
          %(group)s AS timestamp,
          ANY_VALUE(offset) AS offset,
          %(aggr)s AS value,
          @prev := %(prev)s`,
      prev: `
        SELECT
          COALESCE(MAX(value), 0)`
    },
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
      timestamp: {
        main: `
          AND timestamp >= ?`,
        prev: `
          AND timestamp < ?`
      }
    },
    group: `
      GROUP BY %(group)s`
  },

  mic: `
    SELECT
      name,
      id,
      timestamp,
      offset,
      IF(
        @prev < i.value,
        i.value - @prev,
        i.value - i.min
      ) AS value,
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
