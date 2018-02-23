#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const prompt = require('prompt');
const Athlete = require('./schema/Athlete');
const Activity = require('./schema/Activity');

const deleteUser = (id) => {
  prompt.start();
  prompt.get({ properties: {
    confirm: {
      description: `Enter the admin code to delete user ${id}.`,
      hidden: true,
      required: false,
    }
  }}, (err, result) => {
    if (err) throw err;
    if (result.confirm !== process.env.ADMIN_CODE) {
      console.log('Invalid admin code.');
      process.exit(0);
    }
    mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection;
    db.once('open', () => {
      Athlete.findByIdAndRemove(id, (err) => {
        if (err) throw err;
        console.log(`Deleted user ${id} from athletes collection`);
        Activity.deleteMany({ athlete_id: id }, (err) => {
          if (err) throw err;
          console.log(`Deleted user ${id}'s activities`);
          process.exit(0);
        })
      });
    });
  });
};


const argv = require('yargs')
  .usage('$0 <cmd> [args]')
  .command(
    'delete [user]',
    false,
    (yargs) => {
      yargs.positional('user', {
        type: 'number',
      });
    },
    (argv) => {
      deleteUser(argv.user);
    }
  )
  .argv;
