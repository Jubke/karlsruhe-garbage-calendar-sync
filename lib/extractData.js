const { parse } = require('node-html-parser');

function parseCol(col) {
  return col.toString()
    .replace(/(<|<\/)td.*?>/g, '');
}

function parseDates(dates) {
  return dates
    .replace(/(<|<\/)b>/g, '')
    .split('<br />')
    .map((date) => date.split(' ')[2]);
}

function parseRow(row) {
  const [title, dates] = row.querySelectorAll('td')
    .slice(1, 3)
    .map(parseCol);
  const parsedDates = parseDates(dates);

  return {
    title,
    description: parsedDates[0],
    dates: parsedDates.slice(1, -1),
  };
}

function parseHtml(htmlText) {
  return parse(htmlText)
    .querySelectorAll('#foo tr')
    .slice(0, 4) // Four table rows with garbage calendar dates
    .map(parseRow);
}

module.exports = parseHtml;
