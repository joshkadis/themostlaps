import React, { Component } from 'react';
import * as styles from '../Layout.css';

class BaseChart extends Component {
  constructor(props) {
    super(props);
    this.renderTitle = this.renderTitle.bind(this);
    this.renderChart = this.renderChart.bind(this);
    this.state = {
      width: 500,
      height: 400,
    }
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
          {this.renderTitle(this.props)}
        </h2>

        {this.renderChart(this.props)}
      </div>
    );
  }
}

export default BaseChart;
