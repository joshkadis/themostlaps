import PropTypes from 'prop-types';
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
import { mergeStatsSingleYear } from '../../utils/athleteStatsClient';

// Inherited props
// compareTo: PropTypes.object, // Athlete metadata object
// compareData: PropTypes.array, // Compare athlete's data
// hasCompare: PropTypes.bool.isRequired, // Compare athlete ID !== 0
// primaryData: PropTypes.array.isRequired, // Athlete whose page we're looking at
// onChange: PropTypes.func.isRequired,
//
// Custom props:
// year: PropTypes.string.isRequired,
// availableYears: PropTypes.array,
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
    const {
      availableYears,
      year: propsYear,
    } = props;

    const year = Number(propsYear);
    const yearIdx = availableYears.indexOf(year);
    let nextYear = null;
    let prevYear = null;

    if (!availableYears.length) {
      // v1 rider page doesn't have props.availableYears
      // so we don't use it for logic here
      if ('function' === typeof props.onClickNextYear) {
        nextYear = year + 1;
      }
      if ('function' === typeof props.onClickPrevYear) {
        prevYear = year - 1;
      }
    } else {
      // v2 will always pass onClickNextYear and onClickPrevYear in props
      if (year < availableYears[availableYears.length - 1]) {
        // Show next year if current year isn't the last available year
        nextYear = availableYears[yearIdx + 1];
      }
      if (year > availableYears[0]) {
        // Show prev year if current year isn't the first available year
        prevYear = availableYears[yearIdx - 1];
      }
    }

    return (
      <div>
        <h2 className={styles.chart__title}>
          {this.props.hasCompare ?
            this.renderBaseTitleCompare(`${props.year} Laps`, 'Change') :
            this.renderBaseTitle(`${props.year} Laps`, 'Compare')
          }
        </h2>
        <div className={styles.chart__singleYear__nav}>
          {prevYear &&
            <a
              className={styles['chart__header--nav']}
              href="#0"
              onClick={props.onClickPrevYear}
            >{`< ${prevYear}`}</a>
          }

          {'function' === typeof props.onClickBack &&
            <a
              className={styles['chart__header--nav']}
              href="#0"
              onClick={props.onClickBack}
            >All Years</a>
          }

          {nextYear &&
            <a
              className={styles['chart__header--nav']}
              href="#0"
              onClick={props.onClickNextYear}
            >{`${nextYear} >`}</a>
          }
        </div>
      </div>
    );
  }

  renderChart(props, state) {
    const chartHeight = this.getChartHeight(state, props.hasCompare);

    if (!state.chartData.length) {
      return <div style={{
        height: `${chartHeight}px`,
      }}>
        <h3 style={{
          marginTop: '1.5rem',
          textAlign: 'center',
        }}>
          {`No laps in ${props.year} 😢`}
        </h3>
      </div>;
    }

    const horiz = state.shouldRenderHorizontal;
    let xAxis, yAxis;
    if (state.shouldRenderHorizontal) {
      xAxis = <XAxis type="number" />
      yAxis = <YAxis dataKey="month" type="category" interval={0} />
    } else {
      xAxis = <XAxis dataKey="month" interval={0} />
      yAxis = <YAxis />
    }

    return (
      <BarChart
        width={state.width}
        height={chartHeight}
        data={state.chartData}
        layout={state.shouldRenderHorizontal ? 'vertical' : 'horizontal'}
      >
        {xAxis}
        {yAxis}
        <Bar
          label={(coords) => this.renderBarLabel(coords, horiz)}
          dataKey={props.hasCompare ? 'primary' : 'value'}
          fill="#450082"
        />
        {props.hasCompare &&
          <Bar
            label={(coords) => this.renderBarLabel(coords, horiz)}
            dataKey="secondary"
            fill="#914dff"
          />
        }
      </BarChart>
    );
  }
}

SingleYear.defaultProps = {
  ...baseChartDefaultProps,
  availableYears: [],
};
SingleYear.propTypes = Object.assign({...baseChartPropTypes}, {
  year: PropTypes.string.isRequired,
  availableYears: PropTypes.array,
  onClickPrevYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired,
  onClickNextYear: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired,
  onClickBack: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]).isRequired,
});

export default SingleYear;
