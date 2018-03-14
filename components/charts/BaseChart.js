import React, { Component } from 'react';

class BaseChart extends Component {
  constructor(props) {
    super(props);
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
        <h2>{this.renderTitle(this.props)}</h2>
        {this.renderChart(this.props)}
      </div>
    );
  }
}

export default BaseChart;
