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

class SingleAthleteChart extends BaseChart {
  constructor(props) {
    super(props);
    this.onClickBar = this.onClickBar.bind(this);
  }

  componentWillMount() {
    this.setState({
      hasCompare: this.props.compare > 0,
    });
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      hasCompare: nextProps.compare > 0,
    });
  }

  onClickBar(evt) {
    if (evt.year) {
      this.props.onClickTick({ value: evt.year });
    }
  }

  renderTitle() {
    if (this.state.hasCompare && this.props.compareName) {
      return <span>
        <span className={styles.chart__baseTitle}>Yearly Totals vs. </span>
        <span className={styles.chart__compareName}>{this.props.compareName}</span>
      </span>;
    }
    return <span className={styles.chart__baseTitle}>Yearly Totals</span>;
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
          dataKey={this.state.hasCompare ? 'primary' : 'value'}
          fill="#450082"
          onClick={this.onClickBar}
        />
        {this.state.hasCompare &&
          <Bar
            dataKey="secondary"
            fill="#914dff"
            onClick={this.onClickBar}
          />
        }
      </BarChart>
    );
  }
}

SingleAthleteChart.propTypes = {
  data: PropTypes.array.isRequired,
  year: PropTypes.string.isRequired,
  compare: PropTypes.number.isRequired,
  compareName: PropTypes.string.isRequired,
};

export default SingleAthleteChart;
