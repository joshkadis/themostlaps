import React, { Component } from 'react';
import classNames from 'classnames';
import * as styles from '../Layout.css';
import Button from '../lib/Button';
import SearchUsers from '../lib/SearchUsers';
import AthleteHeader from '../lib/AthleteHeader';

/**
 * Extendable Chart class requires methods:
 * renderTitle(this.props, this.state)
 * renderChart(this.props, this.state)
 * transformData(this.props)
 */
class BaseChart extends Component {
  constructor(props) {
    super(props);
    this.renderTitle = this.renderTitle.bind(this);
    this.onClickCompareButton = this.onClickCompareButton.bind(this);
    this.onClickCloseSearchUsers = this.onClickCloseSearchUsers.bind(this);
    this.renderCompareButton = this.renderCompareButton.bind(this);
    this.renderBaseTitle = this.renderBaseTitle.bind(this);
    this.renderBaseTitleCompare = this.renderBaseTitleCompare.bind(this);
    this.state = {
      width: 500,
      height: 350,
      chartData: this.transformData(props),
      showSelectField: false,
      shouldHideChart: true,
    }
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      chartData: this.transformData(nextProps),
      showSelectField: false,
    });
  }

  componentDidMount() {
    if (this.container) {
      this.setState({
        width: this.container.clientWidth,
        shouldHideChart: false,
      });
    }
  }

  onClickCompareButton(evt) {
    evt.preventDefault();
    this.setState({ showSelectField: true });
  }

  onClickCloseSearchUsers(evt) {
    evt.preventDefault();
    this.props.onChange(null);
    this.setState({ showSelectField: false });
  }

  renderCompareButton(buttonText = 'Compare') {
    return (<Button
      onClick={this.onClickCompareButton}
      className={styles.compare__compareButton}
    >
      {buttonText}
    </Button>);
  }

  renderBaseTitle(baseTitleText, buttonText) {
    return <span className={styles.chart__baseTitle__container}>
      <span className={styles.chart__baseTitle}>
        {baseTitleText}
      </span>
      {this.renderCompareButton(buttonText)}
    </span>
  }

  renderBaseTitleCompare(baseTitleText, buttonText) {
    return <span className={styles.chart__baseTitle__container}>
      <span className={styles.chart__baseTitle}>
        {`${baseTitleText} vs.`}
      </span>
      <span className={styles.chart__compareName}>
        <AthleteHeader
          firstname={this.props.compareTo.firstname}
          lastname={this.props.compareTo.lastname}
          img={this.props.compareTo.profile}
          reverse
          linkId={this.props.compareTo.id}
        />
      </span>
      {this.renderCompareButton(buttonText)}
    </span>
  }

  renderBarLabel({ value, x, y, width, height }) {
    if (0 === value) {
      return null;
    }

    return (
      <text
        x={x + width / 2}
        y={y - 10}
        width={width}
        height={height}
        className="recharts-text recharts-label"
        textAnchor="middle"
        fill="black"
      >
        <tspan x={x + width / 2} dy="0.355em">{value}</tspan>
      </text>
    );
  }

  render() {
    return (
      <div
        ref={(el) => this.container = el}
      >
        {this.state.showSelectField &&
          <div className={styles.compare__searchContainer}>
            <SearchUsers
              onChange={this.props.onChange}
              value={this.props.compareTo.id || 0}
              wrapperClassName={styles.compare_searchUsers}
              skipUsers={[this.props.primaryId]}
            />
            <Button
              onClick={this.onClickCloseSearchUsers}
              className={styles.compare_closeSearchUsersButton}
            >
              Clear
            </Button>
          </div>
        }

        {!this.state.showSelectField &&
          <div className={styles.chart__titleContainer}>
            {this.renderTitle(this.props, this.state)}
          </div>
        }

        {!this.state.shouldHideChart && this.renderChart(this.props, this.state)}
      </div>
    );
  }
}

export default BaseChart;
