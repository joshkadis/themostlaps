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
- [Other stuff](#other-stuff)
  * [V2 stats data structure](#v2-stats-data-structure)

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

## Other stuff
In no particular order...

### V2 stats data structure

API output should look like this for _the initial release_ of v2:

```
{
  <Other properties from athlete document>,
  locations: ['prospectpark', 'centralpark'],
  stats_version: 'v2',
  stats: {
    <Top-level athlete stats TBD>,
    locations: {
      prospectpark: {
        allTime: xx,
        single: xx,
        numActivities: xx,
        availableYears: [2014],
        byYear: {
          { year: 2014, value: xx },
        },
        byMonth: {
          2014: [
            { month: 'Jan', value: xx },
            { month: 'Feb', value: xx },
            { month: 'Mar', value: xx },
            { month: 'Apr', value: xx },
            { month: 'May', value: xx },
            { month: 'Jun', value: xx },
            { month: 'Jul', value: xx },
            { month: 'Aug', value: xx },
            { month: 'Sep', value: xx },
            { month: 'Oct', value: xx },
            { month: 'Nov', value: xx },
            { month: 'Dec', value: xx }
          ],
        }
      },
      centralpark: <Same thing as prospectpark>
    }
  }
}
```
