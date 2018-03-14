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
  constructor(props) {
    super(props);
    this.onClickBar = this.onClickBar.bind(this);
  }

  onClickBar(evt) {
    if (evt.year) {
      this.props.onClickTick({ value: evt.year });
    }
  }

  renderTitle() {
    return 'Yearly Totals';
  }

  renderChart({ data, onClickTick }) {
    return (
      <BarChart
        width={this.state.width}
        height={this.state.height}
        data={data}
        className={styles['chart__singleAthlete']}
      >
        <XAxis
          dataKey="year"
          onClick={onClickTick}
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
          dataKey="value"
          fill="#6100FF"
          onClick={this.onClickBar}
        />
      </BarChart>
    );
  }
}

SingleAthleteYearChart.propTypes = {
  data: PropTypes.array.isRequired,
  year: PropTypes.string.isRequired,
};

export default SingleAthleteYearChart;
