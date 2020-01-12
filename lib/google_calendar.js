const fs = require('fs');
const readline = require('readline');
const moment = require('moment');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

function callApi(action) {
  return new Promise((resolve, reject) => {
    // Load client secrets from a local file.
    fs.readFile('credentials.json', (err, content) => {
      if (err) {
        console.log('Error loading client secret file:', err);
        reject(err);
      }
      // Authorize a client with credentials, then call the Google Calendar API.
      resolve(authorize(JSON.parse(content), action));
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]
  );

  return new Promise((resolve, reject) => {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        reject();
        return getAccessToken(oAuth2Client, callback);
      }
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(callback(oAuth2Client));
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  calendar.events.list({
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);

    const events = res.data.items;

    if (events.length) {
      console.log('Upcoming 10 events:');
      events.map((event, i) => {
        const start = event.start.dateTime || event.start.date;
        console.log(`${start} - ${event.summary}`);
      });
    } else {
      console.log('No upcoming events found.');
    }
  });
}

/**
 * Lists calendars.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listCalendars(auth) {
  const calendar = google.calendar({ version: 'v3', auth });
  calendar.calendarList.list({
    maxResults: 10,
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);

    const cals = res.data.items;

    if (cals.length) {
      console.log('Calendars:');
      cals.map((cal, i) => {
        console.log(`${cal.summary} (${cal.id})`);
      });
    } else {
      console.log('No calendars found.');
    }
  });
}

/**
 * Checks a if a specific event was already created.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function eventExists(calendarId, title, date) {
  return (auth) => {
    const calendar = google.calendar({ version: 'v3', auth });

    return new Promise((resolve, reject) => {
      calendar.events.list({
        calendarId,
        timeMax: moment(date, 'DD-MM-YYYY').endOf('day').toISOString(),
        timeMin: moment(date, 'DD-MM-YYYY').startOf('day').toISOString(),
        q: title
      }, (err, res) => {
        if (err) {
          console.log('The API returned an error: ' + err);
          reject(err);
          return;
        }

        const events = res.data.items;

        resolve(events.length > 0);
      });
    });
  };
}

/**
 * Checks a if a specific event was already created.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function createEvent(calendarId, title, desc, date) {
  return (auth) => {
    const calendar = google.calendar({ version: 'v3', auth });
    const event = {
      summary: title,
      location: 'Sengestr. 1, 76187 Karlsruhe',
      description: desc,
      start: { date: moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD') },
      end: { date: moment(date, 'DD-MM-YYYY').format('YYYY-MM-DD') },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 6 * 60 },
          { method: 'popup', minutes: 6 * 60 },
        ],
      },
      transparency: 'transparent',
    };

    return new Promise((resolve, reject) => {
      calendar.events.insert({
        calendarId,
        resource: event,
      }, (err, res) => {
        if (err) {
          console.log('The API returned an error: ' + err);
          reject(err);
          return;
        }

        resolve(res.data.item);
      });
    });
  };
}

module.exports = {
  callApi,
  createEvent,
  eventExists,
};
