import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import BaseChart from './BaseChart';
import * as styles from '../Layout.css';
import { mergeStats } from '../../utils/athleteStatsClient';


const TooltipContent = ({ label, payload }) => {
  const value = ('undefined' !== typeof payload && payload.length) ? payload[0].value : 0;
  return <span>{label}: {value} laps</span>;
};

// Inherited props
// compareTo: PropTypes.object, // Athlete metadata object
// compareData: PropTypes.array, // Compare athlete's data
// hasCompare: PropTypes.bool.isRequired, // Compare athlete ID !== 0
// primaryData: PropTypes.array.isRequired, // Athlete whose page we're looking at
//
// Custom props:
// onClickTick: PropTypes.func.isRequired,

class AllYears extends BaseChart {

  transformData({ hasCompare, compareData, primaryData }) {
    if (!hasCompare) {
      return primaryData;
    }
    return mergeStats(primaryData, compareData);
  }

  renderTitle({ hasCompare, compareTo }) {
    if (hasCompare) {
      return <span>
        <span className={styles.chart__baseTitle}>Yearly Totals vs. </span>
        <span className={styles.chart__compareName}>{`${compareTo.firstname} ${compareTo.lastname}`}</span>
      </span>;
    }
    return <span className={styles.chart__baseTitle}>Yearly Totals</span>;
  }

  renderChart(props, state) {
    return (
      <BarChart
        width={state.width}
        height={state.height}
        data={state.chartData}
        className={styles['chart__singleAthlete']}
      >
        <XAxis
          dataKey="year"
          onClick={props.onClickTick}
        />
        <YAxis />
        <Tooltip
          isAnimationActive={false}
          content={<TooltipContent />}
          cursor={false}
          wrapperStyle={{
            backgroundColor: 'white',
            lineHeight: '1',
            padding: '1rem',
            border: '1px solid #914dff',
          }}
        />
        <Bar
          dataKey={props.hasCompare ? 'primary' : 'value'}
          fill="#450082"
          onClick={(evt) => props.onClickTick(evt.year || false)}
        />
        {props.hasCompare &&
          <Bar
            dataKey="secondary"
            fill="#914dff"
            onClick={(evt) => props.onClickTick(evt.year || false)}
          />
        }
      </BarChart>
    );
  }
}

AllYears.propTypes = Object.assign(BaseChart.propTypes, {
  onClickTick: PropTypes.func.isRequired,
});

export default AllYears;
