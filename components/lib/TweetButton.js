import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { stringify } from 'query-string';
import { locale } from '../../config';

class TweetButton extends Component {
  // Client-side only
  // https://dev.twitter.com/web/javascript/loading
  componentDidMount() {
    window.twttr = (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0],
        t = window.twttr || {};
      if (d.getElementById(id)) return t;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://platform.twitter.com/widgets.js";
      fjs.parentNode.insertBefore(js, fjs);

      t._e = [];
      t.ready = function(f) {
        t._e.push(f);
      };

      return t;
    }(document, "script", "twitter-wjs"));

    // Track social share
    twttr.ready(function(twttr) {
      twttr.events.bind('tweet', function(evt) {
        if (window.ga && evt.target.getAttribute('data-url')) {
          ga('send', 'social', 'twitter', 'share', evt.target.getAttribute('data-url'));
        }
      });
    });
  }

  render() {
    const params = {
      text: `I\'ve ridden ${this.props.laps.toLocaleString(locale)} laps of Prospect Park! Get your stats at`,
      via: 'themostlaps',
      url: 'https://themostlaps.com',
    };
    return (
      <a
        className="twitter-share-button"
        href={'https://twitter.com/intent/tweet?' + stringify(params)}
        data-size="large"
      >
        Tweet
      </a>
    );
  }
}


TweetButton.propTypes = {
  laps: PropTypes.number.isRequired,
};

export default TweetButton;
