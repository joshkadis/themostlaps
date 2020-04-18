# themostlaps
Who rides the most laps of Prospect Park?
Find out at https://themostlaps.com

<!-- toc -->

- [Branches and deployment pipelines](#branches-and-deployment-pipelines)
- [Dev tools](#dev-tools)
  * [Dev server scripts](#dev-server-scripts)
  * [ESLint](#eslint)
  * [Babel](#babel)
  * [Webpack](#webpack)
- [V2 API](#v2-api)
  * [Athletes](#athletes)
  * [Ranking](#ranking)

<!-- tocstop -->

## Branches and deployment pipelines

**development**
* For feature testing
* Merge in feature branches locally and push to GitHub
* Do not merge `development` into other branches
* Automated deployment to https://themostlaps-develop.herokuapp.com/

**master**
* Hotfixes on master should be pushed down to `development`
* Merge in features branches with Pull Requests
* Automated deployment to https://themostlaps-staging.herokuapp.com/

**production**

* Use to avoid bottlenecks with `master`
* Manual deployment to production via [Heroku pipeline](https://dashboard.heroku.com/pipelines/f5d2a8c2-2cfb-401b-8442-ded0cbb5e593)

## Dev tools

### Dev server scripts

`npm run dev`
* Starts a Next.js development environment with hot reloading, etc.
* Only watches files relevant to Next
* Edits to non-Next files don't take effect until the server is restarted.

`npm run dev-server`
* Starts a Next.js development environment using Nodemon
* Only watches directories related to _server_ development; restarts on changes
* Does not rebuild the Next bundle, so changes in Next's files require restarting the server.

**Note:** `nodemon` must be installed globally in order to use `dev-server`.

### ESLint
`.eslintignore` defaults to ignoring everything because the legacy codebase is messy. To lint new work, we un-ignore files and directories as we go, e.g. `!server.js`.

Then:
```
$ npm run lint
```

### Babel
Server-side code is not compiled by anything so Babel only runs on the frontend code. Next has its own setup for that.

Rather than relying purely no Next for Babel configuration, we have a `.babelrc` file so that the same config is also available to Jest.

Eventually we'll get around to separating client and server applications.

### Webpack
Same as Babel: Next for frontend, nothing for server-side.

## V2 API

Base path is `/api/v2`

### Athletes

`/athletes/:ids`

Param | Accepts
----|----
`ids`|CSV string of athlete IDs

Returns **array** of athletes in format:

```
[
  {
    "_id": 541773,
    "status": "ready",
    "athlete": {
      "firstname": "josh",
      "lastname": "kadis – themostlaps.com",
      "profile": <Absolute URL of profile picture>
    },
    "stats": {
      <Top-level stats TBD>,
      "locations": {
        <Additional locations in same format>,
        "centralpark": {
          "allTime": 39,
          "single": 10,
          "numActivities": 10,
          <Additional years included as below>
          "availableYears": [
            2013,
          ],
          "byYear": {
            "2013": 39,
          },
          "byMonth": {
              "2013": [
                0,
                0,
                0,
                0,
                0,
                10,
                13,
                16,
                0,
                0,
                0,
                0
              ]
            }
          }
        }
      }
    },
    "stats_version": "v2"
  }
]
```
### Ranking

`</ranking/:reqPrimary/:reqSeconday`

Param | Accepts
----|----
`reqPrimary`|Top-level ranking: `allTime`, `single`, `numActivities`, or year as YYYY
`reqSecondary`|Optional. Month as MM if `reqPrimary` is a Year
`?location`|Required. `prospectpark` or `centralpark`
`?page`|Defaults to 1
`?perPage`|Defaults to 15

### Recent Activities

`/recentactivities`

Param | Accepts
----|----
`days`|Number of days back from today, defaults to 10
`location`|Valid location, defaults to `prospectpark`
`perPage`|results per page, defaults to 10
`page`|Defaults to 1, obviously

Results will include activities with laps in the requested location. Recall that an activity may have laps in multiple locations.

```
[
  {
    date: '2020-03-20T15:57:35.000Z',
    locations: [
      {
        location: 'centralpark',
        laps: 3
      }
    ]
  }
]
```
