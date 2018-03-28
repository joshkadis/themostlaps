/**
 * Quick and dirty way to build email template with hot reloading
 */
const EmailTemplate = (props) => (
  <div>
    <style dangerouslySetInnerHTML={ { __html: `
      p {
        text-transform: uppercase;
      }
    ` } } />
    <p style={{ color: 'blue' }}>hello</p>
  </div>
);

export default EmailTemplate;
