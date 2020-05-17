/* eslint-disable no-return-assign */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import * as styles from '../Layout.css';
import Button from '../lib/Button';
import SearchUsers from '../lib/SearchUsers';
import AthleteHeader from '../lib/AthleteHeader';
import { isSmallViewport } from '../../utils/window';
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
      shouldRenderChart: false,
      shouldRenderHorizontal: false,
    };
  }

  propTypes = {
    onChartRendered: PropTypes.func,
    onChange: PropTypes.func,
    compareTo: PropTypes.object,
    primaryId: PropTypes.number,
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      chartData: this.transformData(nextProps),
      showSelectField: false,
    });
  }

  componentDidMount() {
    if (this.container) {
      this.setState({
        width: this.container.clientWidth,
        shouldRenderHorizontal: isSmallViewport(),
        shouldRenderChart: true,
      });
    }
  }

  /**
   * Call render callback when shouldRenderChart changes from false to true
   */
  componentDidUpdate(prevProps, prevState) {
    if (!prevState.shouldRenderChart
      && this.state.shouldRenderChart
      && typeof this.props.onChartRendered === 'function'
    ) {
      this.props.onChartRendered();
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
    </span>;
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
    </span>;
  }

  renderBarLabel = ({
    value, x, y, width, height,
  }, shouldTranspose = false) => {
    if (value === 0) {
      return null;
    }

    let renderAttrs;
    if (!shouldTranspose) {
      renderAttrs = {
        x: x + width / 2,
        y: y - 10,
        width,
        height,
        dx: null,
        dy: '0.355em',
      };
    } else {
      renderAttrs = {
        x: x + width + 10,
        y: y + height / 2,
        height: width,
        width: height,
        dy: null,
        dx: '0.355em',
      };
    }

    return (
      <text
        x={renderAttrs.x}
        y={renderAttrs.y}
        width={renderAttrs.width}
        height={renderAttrs.height}
        className="recharts-text recharts-label"
        textAnchor="middle"
        fill="black"
      >
        <tspan
          x={renderAttrs.x}
          dx={renderAttrs.dx}
          dy={renderAttrs.dy}
        >
          {value}
        </tspan>
      </text>
    );
  };

  getChartHeight = ({ height, shouldRenderHorizontal }, hasCompare) => (
    hasCompare && shouldRenderHorizontal
      ? height * 1.5
      : height
  );

  render() {
    return (
      <div
        ref={(el) => this.container = el}
      >
        {this.state.showSelectField
          && <div className={styles.compare__searchContainer}>
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

        {!this.state.showSelectField
          && <div className={styles.chart__titleContainer}>
            {this.renderTitle(this.props, this.state)}
          </div>
        }

        {this.state.shouldRenderChart && this.renderChart(this.props, this.state) /* eslint-disable-line */}
      </div>
    );
  }
}

export default BaseChart;
