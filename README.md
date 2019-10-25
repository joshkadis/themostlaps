# themostlaps
Who rides the most laps of Prospect Park?
Find out at https://themostlaps.com

## Branches and deployment pipeline

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

### ESLint
`.eslintignore` ignores everything because the legacy codebase is messy. We un-ignore files and directories as we go, e.g. `!server.js`.
```
$ npm run lint
```

### Babel
 Server-side code is not compiled by anything so Babel only runs on the frontend code. Next has its own setup for that.

 Eventually we'll get around to separating client and server applications.

### Webpack
Same as Babel: Next for frontend, nothing for server-side.
