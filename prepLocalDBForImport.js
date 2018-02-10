// Make new backup
use themostlaps;
db.copyDatabase('themostlaps', `themostlaps_backup_${Date.now()}`);

// Clear collections in main local db
use themostlaps;
db.getCollection('athletes').remove({});
db.getCollection('activities').remove({});
