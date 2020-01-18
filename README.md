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

### Dev server scripts

`npm run dev` starts a Next.js **development environment** with page reloading, etc. Only watches files relevant to Next. Changes to non-Next files require restarting the server.

`npm run dev-server` starts a Next.js **development** using Nodemon but only watches directories related to server development. Does not rebuild the Next bundle, so changes in Next's files are require restarting the server.

**Note:** `nodemon` must be installed globally in order to use `dev-server`.

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

## Import/Export

_This assumes 3 shards on the remote host._

To export from production, do this _for each collection_:
```
mongoexport --host <CLUSTERNAME>-shard-0/<CLUSTERNAME>-shard-00-00-<HOSTNAME>:27017,<CLUSTERNAME>-shard-00-01-<HOSTNAME>:27017,<CLUSTERNAME>-shard-00-02-<HOSTNAME>:27017 --ssl --username <USERNAME> --password <PASSWORD> --authenticationDatabase admin --db <PRODUCTION DB> --collection <COLLECTION> --out <SOMETHING>.json
```

To import to a remote DB – e.g. when pulling production down to a lower tier – do this _for each collection_:
```
mongoimport --host <CLUSTERNAME>-shard-0/<CLUSTERNAME>-shard-00-00-<HOSTNAME>:27017,<CLUSTERNAME>-shard-00-01-<HOSTNAME>:27017,<CLUSTERNAME>-shard-00-02-<HOSTNAME>:27017 --ssl --username <USERNAME> --password <PASSWORD> --authenticationDatabase admin --db <DB NAME> --collection <COLLECTION> --drop --file <SAME AS mongoexport>.json
```

To import to `localhost`, again for each collection...
```
mongoimport --host localhost:27017 --db <DB NAME> --collection <COLLECTION> --drop --file <SAME AS mongoexport>.json
```
