import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import BaseChart from './BaseChart';

const TooltipContent = ({ label, payload }) => {
  const value = ('undefined' !== typeof payload && payload.length) ? payload[0].value : 0;
  return <span>{label}: {value} laps</span>;
};

class SingleAthleteYearChart extends BaseChart {
  renderTitle({ year }) {
    return `${year} Laps`;
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
};

export default SingleAthleteYearChart;
