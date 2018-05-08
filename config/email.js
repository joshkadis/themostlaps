module.exports = {
  domain: 'themostlaps.com',
  defaultSendOpts: {
    from: 'The Most Laps <info@themostlaps.com>',
    subject: 'A message from The Most Laps',
  },
  htmlSubjects: {
    monthly: 'Laps-related news for spring!',
    ingest: 'Ready to ride laps?',
    default: 'A message from The Most Laps',
  },
  listAliases: [
    'test@themostlaps.com',
    'friends@themostlaps.com',
  ],
  unsubTemplateTag: '%mailing_list_unsubscribe_url%',
};
