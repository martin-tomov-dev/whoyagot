/***************
 *
 * YAHOO SCRAPER v1.0
 * author: Aditya @Clarte
 *
 ****************/

function yahoo_scraper(config) {
  // Loading the dependencies.
  const { Connection, Request } = require('tedious');
  const puppeteer = require('puppeteer');
  const cheerio = require('cheerio');
  const moment = require('moment-timezone');

  const executeSQL = (sql, callback) => {
    let connection = new Connection(config);
    connection.connect((err) => {
      if (err) return callback(err, null);
      const request = new Request(sql, (err, rowCount, rows) => {
        connection.close();
        if (err) return callback(err, null);
        callback(null, { rowCount, rows });
      });
      connection.execSql(request);
    });
  };

  // URLs of the pages we want to scrape
  const GamesData = [
    {
      url: 'https://sports.yahoo.com/nfl/odds',
      name: 'NFL',
    },
    {
      url: 'https://sports.yahoo.com/nba/odds',
      name: 'NBA',
    },
    {
      url: 'https://sports.yahoo.com/college-football/odds/',
      name: 'NCAAF',
    },
    {
      url: 'https://sports.yahoo.com/college-basketball/odds/',
      name: 'NCAAB',
    },
    {
      url: 'https://sports.yahoo.com/nhl/odds',
      name: 'NHL',
    },
    {
      url: 'https://sports.yahoo.com/mlb/odds',
      name: 'MLB',
    },
  ];

  // Async function which scrapes the data
  async function scrapeData(url, category) {
    try {
      // Stores data for all matches
      const matches = [];
      const match_abbrs = [];

      // Fetching all the abbreviations for the team names on the mobile mode
      const browser1 = await puppeteer.launch();
      const page1 = await browser1.newPage();
      await page1.emulate(puppeteer.devices['iPhone 6']);
      await page1.goto(url);
      const html1 = await page1.content();
      browser1.close();

      let $ = cheerio.load(html1);
      const listItems1 = $('.bet-packs-wrapper').find('.PREGAME.sixpack');

      listItems1.each((idx, el) => {
        match_abbrs.push({
          team1: $(el)
            .find('.sixpack-away-team:nth-child(1)')
            .find('.Ell')
            .text(),
          team2: $(el)
            .find('.sixpack-home-team:nth-child(1)')
            .find('.Ell')
            .text(),
        });
      });

      // Fetching actual data with desktop mode
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.emulateTimezone('America/New_York');
      await page.goto(url, { waitUntil: 'networkidle0' });
      const html = await page.content();
      browser.close();

      $ = cheerio.load(html);
      // Select all the list items in plainlist class
      const listItems = $('.bet-packs-wrapper').find('.PREGAME.sixpack');
      // .find('tbody');
      // Use .each method to loop through the li we selected
      listItems.each((idx, el) => {
        // Object holding data for each match
        const match = {
          match_id: '',
          category: category,
          team1: {
            code: '',
            name: '',
            logo: null,
            spread_data: '',
            total_data: '',
            moneyline_data: '',
          },
          team2: {
            code: '',
            name: '',
            logo: null,
            spread_data: '',
            total_data: '',
            moneyline_data: '',
          },
          timing: '',
        };
        // Select the text content of a and span elements
        // Store the textcontent in the above object

        try {
          match.team1.name = $(el)
            .find('.sixpack-away-team:nth-child(1)')
            .find('.Ell')
            .text();

          match.team2.name = $(el)
            .find('.sixpack-home-team:nth-child(1)')
            .find('.Ell')
            .text();

          match.team1.code = match_abbrs[idx].team1;
          match.team2.code = match_abbrs[idx].team2;

          let match_time = $(el)
            .find('thead > tr')
            .children()
            .first()
            .text()
            .trim();
          if (match_time == 'Invalid Date') {
            return;
          }

          let yahoo_est = moment(match_time, 'ddd, M/D, h:mm A');
          let yahoo_est_formatted = yahoo_est.format('YYYY-MM-DDTHH:mm:ss');
          let unixTimestamp = Date.parse(yahoo_est_formatted) / 1000;
          match.timing = yahoo_est_formatted;

          match.match_id =
            category +
            '_' +
            match.team1.code +
            '_' +
            match.team2.code +
            '_' +
            unixTimestamp;

          match.team1.logo = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(1) > div > img'
            )
            .attr('src');
          match.team2.logo = $(el)
            .find(
              'table > tbody > tr:nth-child(2) > td:nth-child(1) > div > img'
            )
            .attr('src');

          var spread_1 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(3) > .sixpack-bet-ODDS_POINT_SPREAD > div > button > span:nth-child(2) > span'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(3) > .sixpack-bet-ODDS_POINT_SPREAD > div > button > span:nth-child(2) > span'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var spread_bets_1 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(3) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(1)'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(3) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(1)'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var spread_2 = $(el)
            .find(
              'table > tbody > tr:nth-child(2) > td:nth-child(3) > .sixpack-bet-ODDS_POINT_SPREAD > div > button > span:nth-child(2) > span'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(2) > td:nth-child(3) > .sixpack-bet-ODDS_POINT_SPREAD > div > button > span:nth-child(2) > span'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var spread_bets_2 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(3) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(2)'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(3) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(2)'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          match.team1.spread_data = JSON.stringify({
            spread: spread_1,
            spread_bets: spread_bets_1,
            spread_handled: null,
          });

          match.team2.spread_data = JSON.stringify({
            spread: spread_2,
            spread_bets: spread_bets_2,
            spread_handled: null,
          });

          var total_1 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(4) > .sixpack-bet-ODDS_TOTAL_POINTS > div > button > span:nth-child(2) > span'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(4) > .sixpack-bet-ODDS_TOTAL_POINTS > div > button > span:nth-child(2) > span'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var total_bets_1 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(4) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(1)'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(4) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(1)'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var total_2 = $(el)
            .find(
              'table > tbody > tr:nth-child(2) > td:nth-child(4) > .sixpack-bet-ODDS_TOTAL_POINTS > div > button > span:nth-child(2) > span'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(2) > td:nth-child(4) > .sixpack-bet-ODDS_TOTAL_POINTS > div > button > span:nth-child(2) > span'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var total_bets_2 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(4) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(2)'
            )
            .text()
            .replace(/[^0-9.-]/g, '')
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(4) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(2)'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          match.team1.total_data = JSON.stringify({
            total: total_1,
            total_bets: total_bets_1,
            total_handled: null,
          });

          match.team2.total_data = JSON.stringify({
            total: total_2,
            total_bets: total_bets_2,
            total_handled: null,
          });

          var moneyline_1 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(2) > .sixpack-bet-ODDS_MONEY_LINE > div > button > span:nth-child(2) > span'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(2) > .sixpack-bet-ODDS_MONEY_LINE > div > button > span:nth-child(2) > span'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var moneyline_bets_1 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(2) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(1)'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(2) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(1)'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var moneyline_2 = $(el)
            .find(
              'table > tbody > tr:nth-child(2) > td:nth-child(2) > .sixpack-bet-ODDS_MONEY_LINE > div > button > span:nth-child(2) > span'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(2) > td:nth-child(2) > .sixpack-bet-ODDS_MONEY_LINE > div > button > span:nth-child(2) > span'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          var moneyline_bets_2 = $(el)
            .find(
              'table > tbody > tr:nth-child(1) > td:nth-child(2) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(2)'
            )
            .text()
            ? $(el)
                .find(
                  'table > tbody > tr:nth-child(1) > td:nth-child(2) > div > div > div > div > div > div:nth-child(2) > div > div:nth-child(2)'
                )
                .text()
                .replace(/[^0-9.-]/g, '')
            : null;

          match.team1.moneyline_data = JSON.stringify({
            moneyline: moneyline_1,
            moneyline_bets: moneyline_bets_1,
            moneyline_handled: null,
          });

          match.team2.moneyline_data = JSON.stringify({
            moneyline: moneyline_2,
            moneyline_bets: moneyline_bets_2,
            moneyline_handled: null,
          });

          matches[match.match_id] = match;
        } catch (err) {
          //console.log(match);
        }
      });

      // Logs match array to the console
      console.dir(matches);

      return matches;
    } catch (err) {
      console.error(err);
    }
  }

  function insertDatabase(game, match, match_data) {
    const current_time = moment()
      .tz('America/New_York')
      .format('YYYY-MM-DDTHH:mm:ss');

    let spread_data = {};
    let total_data = {};
    let moneyline_data = {};

    try {
      spread_data = JSON.parse(match_data.spread_data);
      total_data = JSON.parse(match_data.total_data);
      moneyline_data = JSON.parse(match_data.moneyline_data);
    } catch (error) {
      //console.log(match);
    }

    const sql = `INSERT INTO dbo.BettingSplits(MatchId, Sport, TeamCode, TeamName, TeamLogo, GameTime, Spread, SpreadBets, SpreadHandled, Total, TotalBets, TotalHandled, Moneyline, MoneylineBets, MoneylineHandled, Source, CreatedAt) VALUES (
      '${match.match_id}',
      '${game.name}',
      '${match_data.code}',
      '${match_data.name.replace("'", '')}',
      '${match_data.logo}',
      '${match.timing}',
      '${spread_data.spread === '-' ? 0 : spread_data.spread || 0}',
      '${spread_data.spread_bets === '-' ? 0 : spread_data.spread_bets || 0}',
      '${
        spread_data.spread_handled === '-' ? 0 : spread_data.spread_handled || 0
      }',
      '${total_data.total === '-' ? 0 : spread_data.total || 0}',
      '${total_data.total_bets === '-' ? 0 : spread_data.total_bets || 0}',
      '${
        total_data.total_handled === '-' ? 0 : spread_data.total_handled || 0
      }',
      '${moneyline_data.moneyline === '-' ? 0 : spread_data.moneyline || 0}',
      '${
        moneyline_data.moneyline_bets === '-'
          ? 0
          : spread_data.moneyline_bets || 0
      }',
      '${
        moneyline_data.moneyline_handled === '-'
          ? 0
          : spread_data.moneyline_handled || 0
      }',
      'YahooSports',
      '${current_time}')`;

    executeSQL(sql, (err, data) => {
      if (err) {
        console.log(sql);
        console.error(err);
        return;
      }
      console.log('Added to the database - ' + match.match_id);
    });
  }

  function updateDatabase(game, match, match_data) {
    const current_time = moment()
      .tz('America/New_York')
      .format('YYYY-MM-DDTHH:mm:ss');

    let spread_data = {};
    let total_data = {};
    let moneyline_data = {};

    try {
      spread_data = JSON.parse(match_data.spread_data);
      total_data = JSON.parse(match_data.total_data);
      moneyline_data = JSON.parse(match_data.moneyline_data);
    } catch (error) {
      //console.log(match);
    }

    const sql = `UPDATE dbo.BettingSplits SET 
      UpdatedAt = '${current_time}',
      Spread = '${spread_data.spread === '-' ? 0 : spread_data.spread || 0}',
      SpreadBets = '${
        spread_data.spread_bets === '-' ? 0 : spread_data.spread_bets || 0
      }',
      SpreadHandled = '${
        spread_data.spread_handled === '-' ? 0 : spread_data.spread_handled || 0
      }',
      Total = '${total_data.total === '-' ? 0 : spread_data.total || 0}',
      TotalBets = '${
        total_data.total_bets === '-' ? 0 : spread_data.total_bets || 0
      }',
      TotalHandled = '${
        total_data.total_handled === '-' ? 0 : spread_data.total_handled || 0
      }',
      Moneyline = '${
        moneyline_data.moneyline === '-' ? 0 : spread_data.moneyline || 0
      }',
      MoneylineBets = '${
        moneyline_data.moneyline_bets === '-'
          ? 0
          : spread_data.moneyline_bets || 0
      }',
      MoneylineHandled = '${
        moneyline_data.moneyline_handled === '-'
          ? 0
          : spread_data.moneyline_handled || 0
      }' WHERE MatchId='${match.match_id}' AND TeamCode ='${
      match_data.code
    }' AND Sport='${game.name}' AND Source = 'YahooSports'`;

    executeSQL(sql, (err, data) => {
      if (err) {
        console.log(sql);
        console.error(err);
        return;
      }
      console.log('Updated to the database - ' + match.match_id);
    });
  }

  function fetchData() {
    const all_matches = [];
    var itemsProcessed = 0;
    GamesData.forEach(async (game, index, array) => {
      const matches = await scrapeData(game.url, game.name);
      for (const [match_id, match] of Object.entries(matches)) {
        all_matches.push({ ...match, game: game });
      }
      itemsProcessed++;
      if (itemsProcessed === array.length) {
        processData(
          all_matches,
          0,
          all_matches.length > 15 ? 15 : all_matches.length
        );
      }
    });
  }

  function processData(matches, index_start, index_end) {
    for (let i = index_start; i < index_end; i++) {
      (function (i) {
        var match = matches[i];
        var game = matches[i].game;
        const sql_1 = `SELECT * FROM BettingSplits WHERE MatchId = '${match.match_id}' AND TeamCode = '${match.team1.code}' AND Sport='${game.name}' AND Source = 'YahooSports'`;
        executeSQL(sql_1, (err, { rowCount, rows }) => {
          if (err) console.error(err);
          if (rowCount) {
            // Record already exists in the database
            updateDatabase(game, match, match.team1);
          } else {
            //Record does not exists
            insertDatabase(game, match, match.team1);
          }
        });

        const sql_2 = `SELECT * FROM BettingSplits WHERE MatchId = '${match.match_id}' AND TeamCode = '${match.team2.code}' AND Sport='${game.name}' AND Source = 'YahooSports'`;
        executeSQL(sql_2, (err, { rowCount, rows }) => {
          if (err) console.error(err);
          if (rowCount) {
            // Record already exists in the database
            updateDatabase(game, match, match.team2);
          } else {
            //Record does not exists
            insertDatabase(game, match, match.team2);
          }
        });

        if (i === index_end - 1) {
          if (i === matches.length - 1) {
            return;
          }
          var new_index_start = index_start + 15;
          new_index_start =
            new_index_start < matches.length
              ? new_index_start
              : matches.length % 15;
          setTimeout(() => {
            processData(
              matches,
              new_index_start,
              matches.length > new_index_start + 15
                ? new_index_start + 15
                : matches.length
            );
          }, 5000);
        }
      })(i);
    }
  }

  fetchData();
}

module.exports = { yahoo_scraper };