# themostlaps
Who rides the most laps of Prospect Park?

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
