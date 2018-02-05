require('dotenv').config()
const express = require('express');

// Route handlers
const handleAuthCallback = require('./server/handleAuthCallback');
const renderApp = require('./server/renderApp');
const devSaveData = require('./server/devSaveData');
const showRiderData = require('./server/showRiderData');

/* Express Setup */
const app = express();

app.get('/', renderApp);
app.get('/auth-callback', handleAuthCallback);
app.get('/rider/:id', showRiderData);

// Development routes
if ('development' === process.env.NODE_ENV) {
	app.get('/save', devSaveData);
}


const port = 'production' === process.env.NODE_ENV ? 8080 : 3000;

app.listen(port, () => console.log(`Example app listening on port ${port}`));
