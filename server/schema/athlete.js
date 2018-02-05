const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
	_id: Number,
	date: String,
	laps: Number,
});

const athleteSchema = new Schema({
	token: { type: String, required: true, unique: true },
	_id: Number,
	firstname: String,
	lastname: String,
	activities: [ activitySchema ],
});

const Athlete = mongoose.model('Athlete', athleteSchema);

module.exports = Athlete;
