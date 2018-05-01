const inlineCSS = require('inline-css');
const { getEnvOrigin } = require('../envUtils');

/**
 * Manually created from /pages/emailtemplate.js rendering
 *
 * @param {String} bodyContent
 * @param {String} footerContent
 */
const getHTMLEmail = async (bodyContent, footerContent) => await inlineCSS(
`<!DOCTYPE html>
<html>
<head>
  <meta charSet="utf-8"/>
  <style>
    body {
      font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
      font-size: 17px;
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
      background: url('https://themostlaps.com/static/img/email_bg.png') repeat-y;
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
      background: url('https://themostlaps.com/static/img/email_bg_light.png') repeat-y;
      background-size: 100% 1px;
      padding: 24px 36px;
      text-align: center;
    }

    .title__text {
      margin: 0;
      font-size: 1.7em;
      font-weight: bold;
    }

    .body__content {
      max-width: 580px;
      margin: 0 auto;
    }

    .body__content h1,
    .body__content h2,
    .body__content h3,
    .body__content h4,
    .body__content p {
      text-align: left;
    }

    .body__content p {
      margin: 0 0 1.5em 0;
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
  </style>
</head>
<body>
    <div class="container">
      <div class="header">
        <a href="${getEnvOrigin()}">
          <img
            title="The Most Laps"
            class="header__img"
            src="https://themostlaps.com/static/img/tml_horizontal_email.png"
          />
        </a>
      </div>
      <div class="body">
        <div class="body__content">${bodyContent}</div>
      </div>
      <div class="footer">${footerContent}</div>
    </div>
</body>
</html>`, {
  url: getEnvOrigin(),
});

module.exports = getHTMLEmail;
