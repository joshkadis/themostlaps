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
import { mergeStatsSingleYear } from '../../utils/athleteStatsClient';

const TooltipContent = ({ label, payload }) => {
  const value = ('undefined' !== typeof payload && payload.length) ? payload[0].value : 0;
  return <span>{label}: {value} laps</span>;
};

// Inherited props
// compareTo: PropTypes.object, // Athlete metadata object
// compareData: PropTypes.array, // Compare athlete's data
// hasCompare: PropTypes.bool.isRequired, // Compare athlete ID !== 0
// primaryData: PropTypes.array.isRequired, // Athlete whose page we're looking at
// onChange: PropTypes.func.isRequired,
//
// Custom props:
// year: PropTypes.string.isRequired,
// onClickPrevYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
// onClickNextYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
// onClickBack: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),


class SingleYear extends BaseChart {
  transformData({ hasCompare, compareData, primaryData }) {
    if (!hasCompare) {
      return primaryData;
    }
    return mergeStatsSingleYear(primaryData, compareData);
  }

  renderTitle(props) {
    return (
      <div>
        <span>
          {'function' === typeof props.onClickPrevYear &&
            <a
              className={styles['chart__header--nav']}
              href="#0"
              onClick={props.onClickPrevYear}
            >prev</a>
          }

          {this.props.hasCompare ?
            this.renderBaseTitleCompare(`${props.year} Laps`, 'Change') :
            this.renderBaseTitle(`${props.year} Laps`, 'Compare')
          }

          {'function' === typeof props.onClickNextYear &&
            <a
              className={styles['chart__header--nav']}
              href="#0"
              onClick={props.onClickNextYear}
            >next</a>
          }
        </span>
        {'function' === typeof props.onClickBack &&
          <div>
            <a
              className={styles['chart__header--nav']}
              href="#0"
              onClick={props.onClickBack}
            >back</a>
          </div>
        }
      </div>
    );
  }

  renderChart(props, state) {
    return (
      <BarChart
        width={state.width}
        height={state.height}
        data={state.chartData}
      >
        <XAxis dataKey="month" interval={0} />
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
        />
        {props.hasCompare &&
          <Bar
            dataKey="secondary"
            fill="#914dff"
          />
        }
      </BarChart>
    );
  }
}

SingleYear.propTypes = {
  year: PropTypes.string.isRequired,
  onClickPrevYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired,
  onClickNextYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired,
  onClickBack: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired,
};

export default SingleYear;
