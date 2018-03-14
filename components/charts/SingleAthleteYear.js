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

const TooltipContent = ({ label, payload }) => {
  const value = ('undefined' !== typeof payload && payload.length) ? payload[0].value : 0;
  return <span>{label}: {value} laps</span>;
};

class SingleAthleteYearChart extends BaseChart {
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

          {`${props.year} Laps`}

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

  renderChart({ data }) {
    return (
      <BarChart
        width={this.state.width}
        height={this.state.height}
        data={data}
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
        <Bar dataKey="value" fill="#6100FF" />
      </BarChart>
    );
  }
}

SingleAthleteYearChart.propTypes = {
  data: PropTypes.array.isRequired,
  year: PropTypes.string.isRequired,
  onClickPrevYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  onClickNextYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  onClickBack: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
};

export default SingleAthleteYearChart;
