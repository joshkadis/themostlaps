import PropTypes from 'prop-types';
import Markdown from 'react-markdown';
import { getEnvOrigin } from '../utils/envUtils';
import { prodDomain } from '../config';

const shouldForceProd = true;
const imgUrl = (filename) => {
  const hostname = shouldForceProd ? `https://${prodDomain}` : getEnvOrigin();
  return `${hostname}/static/img/${filename}`;
};

const unsubUrl = (unsubHash) => {
  const hostname = shouldForceProd ? `https://${prodDomain}` : getEnvOrigin();
  return `${hostname}/notifications/${unsubHash}`;
};

const footerMarkdown = (unsubHash, type) => [
  `Email sent by [The Most Laps](${getEnvOrigin()}).`,
  `To unsubscribe from these ${type} updates, [click here](${unsubUrl(unsubHash)}).`
].join(' ');

/**
 * Quick and dirty way to build email template with hot reloading
 */
const EmailTemplate = ({ title, body, type, unsubHash }) => (
  <div>
    <style dangerouslySetInnerHTML={ { __html: `
      /* Template dev styles */
      body {
        background: #e6e6e6;
        padding-top: 24px;
      }

      #__next {
        max-width: 90%;
        margin: 0 auto;
        border: 1px solid lightgray;
        background: #fff
      }
      /* End template dev styles */

      body {
        font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
        font-size: 18px;
        line-height: 1.5;
        color: #000;
        margin: 0;
        padding: 0;
      }

      .container {
        background: #fff;
      }

      .header,
      .footer {
        background: url('${imgUrl('email_bg.png')}') repeat-y;
        background-size: 100% 1px;
        padding: 12px 0;
        text-align: center;
      }

      .header__img {
        width: 300px;
        max-width: 65%;
        height: auto;
      }

      .title,
      .body {
        background: url('${imgUrl('email_bg_light.png')}') repeat-y;
        background-size: 100% 1px;
        padding: 12px 36px;
        text-align: center;
      }

      .title__text {
        margin: 0;
        font-size: 1.7em;
        font-weight: bold;
      }

      .body__content p {
        margin: 0 0 1.5em 0;
        text-align: left;
      }

      .body__content a {
        color: #6100ff;
        text-decoration: underline;
      }

      .body__content a:hover {
        color: #450082;
        text-decoration: none;
      }

      .footer {
        color: #fff;
        font-size: .7em;
        padding-left: 20%;
        padding-right: 20%;
      }

      .footer a {
        color: white;
        text-decoration: underline;
      }

      .footer a:hover {
        color: #914dff;
      }
    ` } }
    />
    <div className="container">
      <div className="header">
        <img
          title="The Most Laps"
          className="header__img"
          src={imgUrl('tml_horizontal_email.png')}
        />
      </div>
      <div className="title">
        <h2 className="title__text">{title}</h2>
      </div>
      <div className="body">
        <div className="body__content">
          <Markdown
            source={body}
            escapeHtml={false}
          />
        </div>
      </div>
      <div className="footer">
        <Markdown
          source={footerMarkdown(unsubHash, type)}
          escapeHtml={false}
        />
      </div>
    </div>
  </div>
);

const body = `Curabitur arcu erat, [accumsan id](#) imperdiet et, porttitor at sem. Curabitur aliquet quam id dui posuere blandit. Donec sollicitudin molestie malesuada.

Nulla porttitor accumsan tincidunt. Pellentesque in ipsum id orci porta dapibus. Cras ultricies ligula sed magna dictum porta.

Donec rutrum congue leo eget malesuada. Quisque velit nisi, pretium ut lacinia in, elementum id enim. Pellentesque in ipsum id orci porta dapibus.`;

EmailTemplate.defaultProps = {
  body,
  title: 'Your Monthly Update',
  type: 'monthly',
  unsubHash: 'notarealhash',
}

export default EmailTemplate;
