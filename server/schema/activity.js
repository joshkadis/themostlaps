const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
	_id: Number,
	start_date_local: String,
	total_elevation_gain: Number,
	athlete_id: Number,
	start_latlng: Array,
	end_latlng: Array,
	segment_efforts: Array,
	estimated_laps: Number,
});

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;
