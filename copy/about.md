## Infrequently Asked Questions

#### Who made this?

The Most Laps was conceived, designed, and built by [Josh Kadis][1], a cyclist, developer, and product manager from Brooklyn. Josh is currently looking for a job, by the way.

In case you were wondering, it's an isomorphic React web application with a MongoDB database.

#### How can I contact you?

[Email][6], [Twitter][7], or [Instagram][8], take your pick.

#### How does it work?

The most important thing to know is that we **do not** collect or retain any of your data without your consent. Once you authorize The Most Laps to access your Strava account, we look back through your past [segment efforts][2] and calculate your all-time, yearly, and monthly totals, and the most laps in a single ride. Then we check automatically every night to see if you've ridden any new laps, and we add those to your stats.

#### How are laps calculated?

It's more complicated than you might think! The [segment][3] we use to calculate laps starts and finishes on the Flatbush side of the park. But let's say you enter at 15th Street and Prospect Park West. If you do 5 laps, your Strava activity will only include that segment 4 times. To make up for the half-laps at the beginning and end of your ride, we look at shorter Strava segments along the route to piece together the extra lap.

Because of performance constraints during your initial setup, we give you the benefit of the doubt and add an extra lap to any ride that contains more than one lap.

#### What personal data is stored?

From your Strava profile, we store your user id, first and last names, a link to your profile photo, and your email address. Unless you subscribe to our [newsletter][4], we will _only_ use your email address for administrative purposes. We'll never share it with anyone.

We also store, of course, the authentication token used to fetch your rides from the Strava API. However, this is only used "behind the scenes" on our server. It is never exposed to your browser.

#### What about private rides?

Private rides (or "activities" in Strava's technical terminology) _are_ included in your total stats. However, information that could identify any specific ride is _never_ displayed on the site.

#### Can you remove me from the site?

Yes, no problem. [Email us](mailto:info@themostlaps.com) and we'll take care of it right away.

Note that if you revoke access in [your Strava settings][5], your data will still be on the site until you let us know to remove you.

#### Where can I read the legal stuff?

Check out our [Privacy Statement](/privacy) and [Terms of Service](/terms)

[1]: https://kadisco.com
[2]: https://developers.strava.com/docs/reference/#api-SegmentEfforts-getEffortsBySegmentId
[3]: https://www.strava.com/segments/5313629
[4]: https://eepurl.com/dl6VVT
[5]: https://www.strava.com/settings/apps
[6]: mailto:info@themostlaps.com
[7]: https://twitter.com/themostlaps
[8]: https://instagram.com/themostlaps
