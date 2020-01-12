# karlsruhe-garbage-calendar-sync
Little script to syncs the garbage calendar from the Karlsruhe city website to a Google calendar. Running the service every week with `launchd` is only appicable on MacOS.

## Installation

Install dependecies:
```
$ npm install
```

Go to [Node.js Quickstart](https://developers.google.com/calendar/quickstart/nodejs) to enable the Google Calendar API for your account and generate a `credentials.json` file. 

Get an access token for the API:
```
$ node getAccessToken.js
```

This will create a `token.json` in the directory and print your available calendars.

Update the calendar id of your google calendar and the street name your wish to check garbage disposal dates for in the `config.js` file:
```
{
  "street": "SENGESTRASSE",
  "calendarId": "t1jr9e2v5rkcqt55971dc3scls@group.calendar.google.com"
}
```

**MacOS only**
Update the user in `karlsruhe-garbage-calendar-sync.plist` to your user.
Install `launchd` service to run weekly:
```
$ sh install.sh
```

## Uninstall
**MacOS only**
To uninstall the launchd deamon run:
```
$ sh uninstall.sh
```
