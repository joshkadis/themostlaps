function dateIsDst(date) {
  return [
    [20180311, 20181104],
    [20170312, 20171105],
    [20160313, 20161106],
    [20150308, 20151101],
    [20140309, 20141102],
    [20130310, 20131103],
    [20120311, 20121104],
    [20110313, 20111106],
    [20100314, 20101107],
    [20090308, 20091101],
  ].reduce((acc, [start, end]) => {
    if (acc) {
      return acc;
    }
    return date >= start && date < end;
  }, false);
}

function getISODateTimeFromLocal(local) {
  const matches = /^(\d{4,4})-(\d{2,2})-(\d{2,2})T/.exec(local);
  if (!matches) {
    return null;
  }

  const [str, year, month, day] = matches;
  const date = parseInt(year + month + day);

  const offset = dateIsDst(date) ? 4 : 5;
  return local.replace(/Z$/i, `-0${offset}:00`)
}

function getActivityQueryData({
  athlete_id,
  source,
  _id,
  start_date_local,
}, activityStatsData, segmentEffortsData) {

  return `{
    athlete: {
      connect: {
        strava_id: ${athlete_id}
      }
    }
    source: "${source}"
    start_date: "${getISODateTimeFromLocal(start_date_local)}"
    strava_id: ${_id}
    stats: {
      create: [${activityStatsData.join(',')}]
    }
    segment_efforts: {
      create: [${segmentEffortsData.join(',')}]
    }
  }`;
}

function getActivityStatsQueriesData(activityJson) {
  return ['laps', 'coldLapsPoints'].map((key) => activityJson[key] ?
  `{
    type: "${key}"
    value: ${activityJson[key]}
  }` : false)
    .filter((data) => !!data);
}

function getSegmentEffortsQueriesData({segment_efforts}) {

  return segment_efforts.map(function (effort) {
    if (effort.segment && effort.segment.id && effort.segment.id !== 5313629) {
      return false;
    }
    const {
      _id,
      elapsed_time,
      moving_time,
      start_date_local,
    } = effort;
    return `{
      elapsed_time: ${elapsed_time}
      moving_time: ${moving_time}
      start_date: "${getISODateTimeFromLocal(start_date_local)}"
      strava_id: ${_id}
    }`;
  })
  .filter((data) => !!data);
};

module.exports = {
  getActivityQueryData,
  getActivityStatsQueriesData,
  getSegmentEffortsQueriesData,
  dateIsDst,
  getISODateTimeFromLocal,
};
