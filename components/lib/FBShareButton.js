import React, { Component } from 'react';

class FBShareButton extends Component {
  // Client-side only
  // https://developers.facebook.com/docs/plugins/share-button
  componentDidMount() {
    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s); js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.12&appId=123548614412671';
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }

  render() {
    return (
      <span>
        <span id="fb-root" />
        <span
          className="fb-share-button"
          data-href="https://themostlaps.com"
          data-layout="button"
          data-size="large"
          data-mobile-iframe="true"
        >
          <a
            target="_blank"
            href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fthemostlaps.com%2F&amp;src=sdkpreparse" class="fb-xfbml-parse-ignore"
          />
        </span>
      </span>
    );
  }
}

export default FBShareButton;
