import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
      height: 400,
      chartData: this.transformData(props),
      showSelectField: false,
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
      this.setState({ width: this.container.clientWidth });
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
      style={{ fontSize: '1rem' }}
    >
      {buttonText}
    </Button>);
  }

  renderBaseTitle(baseTitleText, buttonText) {
    return <span className={styles.chart__baseTitle}>
      {baseTitleText}
      {this.renderCompareButton(buttonText)}
    </span>
  }

  renderBaseTitleCompare(baseTitleText, buttonText) {
    return <span>
      <span className={styles.chart__baseTitle}>{`${baseTitleText} vs. `}</span>
      <span className={styles.chart__compareName}>
        <AthleteHeader
          firstname={this.props.compareTo.firstname}
          lastname={this.props.compareTo.lastname}
          img={this.props.compareTo.profile}
          reverse
        />
        {this.renderCompareButton(buttonText)}
      </span>
    </span>
  }

  render() {
    return (
      <div
        ref={(el) => this.container = el}
      >
        {this.state.showSelectField &&
          <div className={styles.compare_searchContainer}>
            <SearchUsers
              onChange={this.props.onChange}
              value={this.props.compareTo.id || 0}
              wrapperClassName={styles.compare_searchUsers}
            />
            <Button
              onClick={this.onClickCloseSearchUsers}
              className={styles.compare_closeSearchUsersButton}
            >
              Clear
            </Button>
          </div>
        }

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
  onChange: PropTypes.func.isRequired,
};

export default BaseChart;
