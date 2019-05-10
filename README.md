# themostlaps
Who rides the most laps of Prospect Park?

## Git branches

**development**
* Run locally
* Merge in feature branches
* Resolve conflicts
* Merge into staging

**staging**
* Automatically deploys to Heroku
* Review changes on [staging site](https:themostlaps-staging.herokuapp.com)
* Merge into master

**master**
* Automatically deploys to [production](https://themostlaps.com)
* Should always be in sync with staging
* Hotfixes on master should be pushed down to staging and development
