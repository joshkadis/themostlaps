const fetch = require('isomorphic-unfetch');

const fetchOptions = (data) => ({
  method: 'post',
  headers: {
    Authorization: `Basic ${process.env.MC_API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

/**
 * Subscribe email to mailing list
 */
async function subscribeToMailingList(email_address = '', newsletter = false) {
  if (!email_address.length) {
    return;
  }

  // Add everyone to the main list in case we need
  // to contact them for non-marketing purposes
  const response = await fetch(
    `https://us1.api.mailchimp.com/3.0/lists/${process.env.MC_LIST_ID}/members`,
    fetchOptions({
      email_address,
      status: 'subscribed',
    })
  );
  const result = await response.json();

  if (response.status !== 200 || result.status !== 'subscribed') {
    if (result.title === 'Member Exists') {
      console.log(`${email_address} is already subscribed`);
    } else {
      console.log(`Failed to add ${email_address} to main list`);
    }
    return;
  }

  console.log(`Subscribed ${email_address} to main list`);
  if (!newsletter) {
    return;
  }

  const segmentResponse = await fetch(
    `https://us1.api.mailchimp.com/3.0/lists/${process.env.MC_LIST_ID}/segments/${process.env.MC_SEGMENT_ID}`,
    fetchOptions({ members_to_add: [email_address] })
  );
  const segmentResult = await segmentResponse.json();

  if (segmentResponse.status !== 200 || !segmentResult.members_added.length) {
    console.log(`Failed to add ${email_address} to newsletter segment`);
  } else {
    console.log(`Added ${email_address} to newsletter segment`);
  }
}

module.exports = subscribeToMailingList;
