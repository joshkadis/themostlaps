import PropTypes from 'prop-types';
import Link from 'next/link';

/**
 * If {_blank} is appened to href, add target="_blank" attribute
 * If href is a "page" /about, /privacy, /terms, use Next's <Link />
 */
const convertMarkdownLink = ({ href, children }) => {
  if (/{_blank}$/.test(href)) {
    return <a
      href={href.replace('{_blank}', '')}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>;
  }

  const matches = /^\/(about|privacy|terms)\/?$/.exec(href);
  if (!matches) {
    return <a href={href}>{children}</a>;
  }

  return (
    <Link
      href={`/page?pageName=${matches[1]}`}
      as={href}
    >
      <a>{children}</a>
    </Link>
  );
};

convertMarkdownLink.propTypes = {
  href: PropTypes.string,
  children: PropTypes.any,
};

export default convertMarkdownLink;
