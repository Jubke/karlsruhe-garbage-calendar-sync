const request = require('request');
const zlib = require('zlib');
const extractData = require('./lib/extractData');
const { callApi, eventExists, createEvent } = require('./lib/google_calendar.js');
const fs = require('fs');
const { default: PQueue } = require('p-queue');

function onError(err, res, body) {
  console.error(err);
}

function handleResponse(calendarId) {
  return (err, res, body) => {
    if (err) {
      return onError(err, res, body);
    }

    let html = body;

    if (res.headers['content-encoding'] === 'gzip') {
      zlib.gunzip(body, (unzipErr, dezipped) => {
        if (unzipErr) {
          console.error(unzipErr);
          return;
        }

        html = dezipped.toString();
      });
    }

    const data = extractData(html);

    console.table(data);

    const queue = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      interval: 1000,
      autoStart: true,
    });

    data.forEach((event) => {
      const { title, description, dates } = event;

      dates.forEach((date) => {
        queue.add(() => {
          callApi(eventExists(calendarId, title, date))
            .then((exists) => {
              if (exists) {
                console.log(
                  `Event ${title} on ${date} already exists. Skipping.`
                );
              } else {
                console.log(
                  `Adding task to create new event for ${title} on ${date}.`
                );
                queue.add(() => {
                  callApi(createEvent(calendarId, title, description, date))
                    .then(() => {
                      console.log(`Created new event for ${title} on ${date}.`);
                    });
                });
              }
            });
        });
      });
    });

    return data;
  };
}

fs.readFile('config.json', (err, content) => {
  if (err) return console.log('Error loading config.js file:', err);

  const config = JSON.parse(content);
  const { calendarId, street } = config;

  request.get(
    {
      url: `https://web5.karlsruhe.de/service/abfall/akal/akal.php?strasse=${street}`,
    },
    handleResponse(calendarId),
  );
});
