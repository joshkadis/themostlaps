import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as styles from '../Layout.css';

/**
 * Extendable Chart class requires methods:
 * renderTitle(this.props, this.state)
 * renderChart(this.props, this.state)
 * transformData(this.props)
 */
class BaseChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: 500,
      height: 400,
      chartData: this.transformData(props),
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ chartData: this.transformData(nextProps) })
  }

  componentDidMount() {
    if (this.container) {
      this.setState({ width: this.container.clientWidth })
    }
  }

  render() {
    return (
      <div
        ref={(el) => this.container = el}
      >
        <h2
          className={styles.chart__title}
        >
          {this.renderTitle(this.props, this.state)}
        </h2>

        {this.renderChart(this.props, this.state)}
      </div>
    );
  }
}

BaseChart.defaultProps = {
  compareTo: {},
  compareData: [],
};

BaseChart.propTypes = {
  compareTo: PropTypes.object, // Athlete metadata object
  compareData: PropTypes.array, // Compare athlete's data
  hasCompare: PropTypes.bool.isRequired, // Compare athlete ID !== 0
  primaryData: PropTypes.array.isRequired, // Athlete whose page we're looking at
};

export default BaseChart;
