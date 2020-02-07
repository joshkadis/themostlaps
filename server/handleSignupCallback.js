const { stringify } = require('querystring');
const exchangeCodeForAthleteInfo = require('../utils/ingest/exchangeCodeForAthleteInfo');
const { handleDuplicateSignup } = require('../utils/ingest/handleDuplicateSignup');
const Athlete = require('../schema/Athlete');
const { getAthleteModelFormat } = require('../utils/athleteUtils');
const { captureSentry } = require('../utils/v2/services/sentry');
const getInternalError = require('../utils/internalErrors');
const ingestAthleteHistory = require('../utils/v2/ingestAthlete/ingestAthleteHistory');

/**
 * Factory for handling error while creating athlete in db
 *
 * @param {Response}
 * @return {Function}
 */
function createHandleSignupError(res) {
  /**
   * Log error to Sentry and redirect to error page
   *
   * @param {Number} errorCode
   * @param {Any} errorAddtlInfo
   */
  return (errorCode = 0, errorAddtlInfo = false) => {
    captureSentry(
      getInternalError(errorCode),
      'handleSignupCallback',
      {
        extra: errorAddtlInfo,
      },
    );

    // @todo Make this a util getter/setter
    let errorQuery;
    switch (errorCode) {
      case 50:
        errorQuery = { type: 2, id: errorAddtlInfo.id || 0 };
        break;

      default:
        errorQuery = { type: 1 };
    }

    res.redirect(303, `/error?${stringify(errorQuery)}`);
  };
}

/**
 * Handle OAuth callback from signup by creating new Athlete
 * or updating existing athlete
 *
 * @param {Next} app Next.js application
 * @param {Request} req
 * @param {Response} res
 */
async function handleSignupCallback(req, res) {
  const handleSignupError = createHandleSignupError(res);

  // Handle request error, most likely error=access_denied
  if (req.query.error) {
    handleSignupError(10, req.query);
    return;
  }

  // Get athlete profile info
  const tokenExchangeResponse = await exchangeCodeForAthleteInfo(
    req.query.code,
  );

  // For some reason had 'errorCode' before and it never caused a problem
  const error_code = tokenExchangeResponse.error_code
    || tokenExchangeResponse.errorCode;

  if (error_code) {
    handleSignupError(error_code, tokenExchangeResponse);
    return;
  }

  let athleteDoc;
  try {
    // Handle if athlete exists in DB
    const { id: athleteId } = tokenExchangeResponse.athlete;
    const existingAthleteDoc = await Athlete.findById(athleteId);
    if (existingAthleteDoc instanceof Athlete) {
      await handleDuplicateSignup(
        existingAthleteDoc,
        tokenExchangeResponse,
        res,
        handleSignupError,
      );
      return;
    }

    const formattedAthleteData = getAthleteModelFormat(tokenExchangeResponse);
    if (!formattedAthleteData) {
      return;
    }

    athleteDoc = await Athlete.create(formattedAthleteData);
    console.log(`Saved ${athleteDoc.get('_id')} to database`);
  } catch (err) {
    const errCode = err.message.indexOf('duplicate key') !== -1 ? 50 : 55;
    handleSignupError(errCode, tokenExchangeResponse);
    return;
  }

  // Render the welcome page, athlete status will be 'ingesting'
  res.redirect(303, `/welcome?${stringify({
    id: tokenExchangeResponse.athlete.id,
  })}`);

  // Fetch athlete history
  await ingestAthleteHistory(athleteDoc);
}

module.exports = handleSignupCallback;
