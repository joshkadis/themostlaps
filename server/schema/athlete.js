const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
	id: Number,
	date: String,
	laps: Number,
});

const athleteSchema = new Schema({
	token: { type: String, required: true, unique: true },
	id: { type: Number, required: true, unique: true },
	firstname: String,
	lastname: String,
	activities: [ activitySchema ],
});

const Athlete = mongoose.model('Athlete', athleteSchema);

module.exports = Athlete;
