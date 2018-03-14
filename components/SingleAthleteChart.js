import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

const TooltipContent = ({ label, payload }) => {
  const value = payload.length ? payload[0].value : 0;
  return <span>{label}: {value} laps</span>;
};

const SingleAthleteChart = ({ data }) => {
  return (
    <div>
      <h2>Yearly Totals</h2>
      <BarChart width={450} height={300} data={data}>
        <XAxis dataKey="year" />
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
    </div>
  );
};

export default SingleAthleteChart;
