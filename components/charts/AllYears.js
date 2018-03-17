import PropTypes from 'prop-types';
import classNames from 'classnames';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import BaseChart from './BaseChart';
import {
  baseChartPropTypes,
  baseChartDefaultProps,
} from './baseChartProps';
import * as styles from '../Layout.css';
import { mergeStats } from '../../utils/athleteStatsClient';

// Inherited props
// compareTo: PropTypes.object, // Athlete metadata object
// compareData: PropTypes.array, // Compare athlete's data
// hasCompare: PropTypes.bool.isRequired, // Compare athlete ID !== 0
// primaryData: PropTypes.array.isRequired, // Athlete whose page we're looking at
// onChange: PropTypes.func.isRequired,
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
    return <h2 className={styles.chart__title}>
      {hasCompare ?
        this.renderBaseTitleCompare('Yearly Totals', 'Change') :
        this.renderBaseTitle('Yearly Totals', 'Compare')
      }
    </h2>;
  }

  renderChart(props, state) {
    const horiz = state.shouldRenderHorizontal;
    let xAxis, yAxis;
    if (horiz) {
      xAxis = <XAxis type="number" />
      yAxis = <YAxis dataKey="year" type="category" onClick={props.onClickTick} />
    } else {
      xAxis = <XAxis dataKey="year" onClick={props.onClickTick} />
      yAxis = <YAxis />
    }

    return (
      <BarChart
        width={state.width}
        height={this.getChartHeight(state, props.hasCompare)}
        data={state.chartData}
        className={classNames(
          styles.chart__singleAthlete,
          { [styles.chart__singleAthlete__vertical]: !horiz },
          { [styles.chart__singleAthlete__horizontal]: horiz },
        )}
        layout={horiz ? 'vertical' : 'horizontal'}
      >
        {xAxis}
        {yAxis}
        <Bar
          label={(coords) => this.renderBarLabel(coords, horiz)}
          dataKey={props.hasCompare ? 'primary' : 'value'}
          fill="#450082"
          onClick={(evt) => props.onClickTick(evt.year || false)}
        />
        {props.hasCompare &&
          <Bar
            label={(coords) => this.renderBarLabel(coords, horiz)}
            dataKey="secondary"
            fill="#914dff"
            onClick={(evt) => props.onClickTick(evt.year || false)}
          />
        }
      </BarChart>
    );
  }
}

AllYears.defaultProps = baseChartDefaultProps;
AllYears.propTypes = Object.assign({...baseChartPropTypes}, {
  onClickTick: PropTypes.func.isRequired,
});

export default AllYears;
