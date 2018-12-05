#!/bin/bash -e
source .db_vars

# Prep local database
mongo < prepLocalDBForImport.js

# Export athletes and activities to local JSON files
mongoexport -h $REMOTE_HOST -d $REMOTE_DB -c activities -u $REMOTE_USER -p $REMOTE_PASS -o activities.json
mongoexport -h $REMOTE_HOST -d $REMOTE_DB -c athletes -u $REMOTE_USER -p $REMOTE_PASS -o athletes.json
mongoexport -h $REMOTE_HOST -d $REMOTE_DB -c conditions -u $REMOTE_USER -p $REMOTE_PASS -o conditions.json

# Import to database
mongoimport -h $LOCAL_HOST -d $LOCAL_DB -c activities --file activities.json
mongoimport -h $LOCAL_HOST -d $LOCAL_DB -c athletes --file athletes.json
mongoimport -h $LOCAL_HOST -d $LOCAL_DB -c conditions --file conditions.json

# Delete temp files
rm activities.json
rm athletes.json
rm conditions.json
