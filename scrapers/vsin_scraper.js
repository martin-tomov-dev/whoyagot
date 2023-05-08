/***************
 *
 * VSiN SCRAPER v1.0
 * author: Aditya @Clarte
 *
 ****************/

function vsin_scraper(config) {
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
      url: 'https://www.vsin.com/matchups/nfl',
      name: 'NFL',
    },
    {
      url: 'https://www.vsin.com/matchups/nba',
      name: 'NBA',
    },
    {
      url: 'https://www.vsin.com/matchups/ncaafb',
      name: 'NCAAF',
    },
    {
      url: 'https://www.vsin.com/matchups/ncaambb',
      name: 'NCAAB',
    },
    {
      url: 'https://www.vsin.com/matchups/nhl',
      name: 'NHL',
    },
    {
      url: 'https://www.vsin.com/matchups/mlb',
      name: 'MLB',
    },
  ];

  // Async function which scrapes the data
  async function scrapeData(url, category) {
    try {
      // Fetch HTML of the page we want to scrape
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.emulateTimezone('America/New_York');
      await page.goto(url);
      const html = await page.content();
      browser.close();

      // Load HTML we fetched in the previous line
      const $ = cheerio.load(html);
      // Select all the list items in plainlist class
      const listItems = $('.matchups .matchups-tbl-wrpr');

      // Stores data for all matches
      const matches = [];
      // Use .each method to loop through the li we selected
      listItems.each((idx, el) => {
        // Object holding data for each match
        const match = {
          match_id: '',
          category: category,
          isLive: false,
          team1: {
            code: '',
            name: '',
            score: null,
            spread_data: '',
            total_data: '',
            moneyline_data: '',
          },
          team2: {
            code: '',
            name: '',
            score: null,
            spread_data: '',
            total_data: '',
            moneyline_data: '',
          },
          timing: '',
        };
        // Select the text content of a and span elements
        // Store the textcontent in the above object
        match.team1.name = $(el)
          .find(
            'table:nth-child(1) > thead > tr > th:nth-child(1) > a > span:nth-child(1)'
          )
          .text()
          .trim();

        match.team2.name = $(el)
          .find(
            'table:nth-child(1) > thead > tr > th:nth-child(1) > a > span:nth-child(2)'
          )
          .text()
          .trim();

        match.team1.code = $(el)
          .find(
            'table:nth-child(1) > tbody > tr:nth-child(1) > td > div > div.team-1 > span.abr'
          )
          .text()
          .trim()
          .replace(/#\d+ |\d+/g, '');

        match.team2.code = $(el)
          .find(
            'table:nth-child(1) > tbody > tr:nth-child(1) > td > div > div.team-2 > span.abr'
          )
          .text()
          .trim()
          .replace(/#\d+ |\d+/g, '');

        var score = $(el)
          .find(
            'table:nth-child(1) > tbody > tr:nth-child(1) > td > div > div.event-info > div.result'
          )
          .text()
          .split('@');

        if (score.length === 1) {
          score = $(el)
            .find(
              'table:nth-child(1) > tbody > tr:nth-child(1) > td > div > div.event-info > div.result'
            )
            .text()
            .split('(N)');
        }

        match.team1.score = score[0] ? score[0] : null;
        match.team2.score = score[1] ? score[1] : null;

        let match_time = $(el)
          .find(
            'table:nth-child(1) > tbody > tr:nth-child(1) > td > div > div.event-info > div.time > span'
          )
          .attr('date');
        let unixTimestamp;
        if (!match_time) {
          match.isLive = true;
          match_time = $(el)
            .find('table:nth-child(1) > thead > tr > th:nth-child(2) > span')
            .text();

          const inputMoment = moment(match_time, 'dddd, MMM DD');
          const vsin_est = inputMoment.format('YYYY-MM-DDTHH:mm:ss');
          unixTimestamp = inputMoment.unix();
          match.timing = vsin_est;
        } else {
          const inputMoment = moment.utc(match_time);
          const estMoment = inputMoment.tz('America/New_York');
          const vsin_est = estMoment.format('YYYY-MM-DDTHH:mm:ss');
          unixTimestamp = Date.parse(vsin_est) / 1000;
          match.timing = vsin_est;
        }

        match.match_id =
          category +
          '_' +
          match.team1.code +
          '_' +
          match.team2.code +
          '_' +
          unixTimestamp;

        var spread_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(2)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(2)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var spread_bets_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(4)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(4)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var spread_handled_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(3)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(3)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var spread_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(2)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(2)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var spread_bets_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(4)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(4)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var spread_handled_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(3)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(3)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        match.team1.spread_data = JSON.stringify({
          spread: spread_1,
          spread_bets: spread_bets_1,
          spread_handled: spread_handled_1,
        });

        match.team2.spread_data = JSON.stringify({
          spread: spread_2,
          spread_bets: spread_bets_2,
          spread_handled: spread_handled_2,
        });

        var total_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(8)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(8)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var total_bets_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(10)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(10)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var total_handled_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(9)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(9)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var total_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(8)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(8)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var total_bets_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(10)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(10)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var total_handled_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(9)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(9)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        match.team1.total_data = JSON.stringify({
          total: total_1,
          total_bets: total_bets_1,
          total_handled: total_handled_1,
        });

        match.team2.total_data = JSON.stringify({
          total: total_2,
          total_bets: total_bets_2,
          total_handled: total_handled_2,
        });

        var moneyline_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(5)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(5)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var moneyline_bets_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(7)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(7)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var moneyline_handled_1 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(6)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(1) > td:nth-child(6)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var moneyline_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(5)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(5)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var moneyline_bets_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(7)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(7)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        var moneyline_handled_2 = $(el)
          .find(
            '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(6)'
          )
          .text()
          ? $(el)
              .find(
                '.resp-tbl-4-wrpr > table > tbody > tr:nth-child(2) > td:nth-child(6)'
              )
              .text()
              .replace(/[^0-9.-]/g, '')
          : null;

        match.team1.moneyline_data = JSON.stringify({
          moneyline: moneyline_1,
          moneyline_bets: moneyline_bets_1,
          moneyline_handled: moneyline_handled_1,
        });

        match.team2.moneyline_data = JSON.stringify({
          moneyline: moneyline_2,
          moneyline_bets: moneyline_bets_2,
          moneyline_handled: moneyline_handled_2,
        });

        matches[match.match_id] = match;
      });
      // Logs match array to the console
      console.dir(matches);

      return matches;
    } catch (err) {
      console.error(err);
    }
  }

  function insertDatabase(game, match, match_data, against_code) {
    let spread_data = match_data.spread_data
      ? JSON.parse(match_data.spread_data)
      : {};
    let total_data = match_data.total_data
      ? JSON.parse(match_data.total_data)
      : {};
    let moneyline_data = match_data.moneyline_data
      ? JSON.parse(match_data.moneyline_data)
      : {};

    const sql = `INSERT INTO dbo.BettingSplits(MatchId, Sport, TeamCode, TeamName, AgainstCode, GameTime, Spread, SpreadBets, SpreadHandled, Total, TotalBets, TotalHandled, Moneyline, MoneylineBets, MoneylineHandled, Score, Source) VALUES (
      '${match.match_id}',
      '${game.name}',
      '${match_data.code}',
      '${match_data.name.replace("'", '')}',
      '${against_code}',
      '${match.timing}',
      '${spread_data.spread || 0}',
      '${spread_data.spread_bets || 0}',
      '${spread_data.spread_handled || 0}',
      '${total_data.total || 0}',
      '${total_data.total_bets || 0}',
      '${total_data.total_handled || 0}',
      '${moneyline_data.moneyline || 0}',
      '${moneyline_data.moneyline_bets || 0}',
      '${moneyline_data.moneyline_handled || 0}',
      ${match_data.score || 0},
      'VSiN')`;

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
    let spread_data = match_data.spread_data
      ? JSON.parse(match_data.spread_data)
      : {};
    let total_data = match_data.total_data
      ? JSON.parse(match_data.total_data)
      : {};
    let moneyline_data = match_data.moneyline_data
      ? JSON.parse(match_data.moneyline_data)
      : {};

    const sql = `UPDATE dbo.BettingSplits SET 
      Spread = '${spread_data.spread || 0}',
      SpreadBets = '${spread_data.spread_bets || 0}',
      SpreadHandled = '${spread_data.spread_handled || 0}',
      Total = '${total_data.total || 0}',
      TotalBets = '${total_data.total_bets || 0}',
      TotalHandled = '${total_data.total_handled || 0}',
      Moneyline = '${moneyline_data.moneyline || 0}',
      MoneylineBets = '${moneyline_data.moneyline_bets || 0}',
      MoneylineHandled = '${moneyline_data.moneyline_handled || 0}',
      Score = ${match_data.score || 0} WHERE MatchId='${
      match.match_id
    }' AND TeamCode ='${match_data.code}' AND Source = 'VSiN'`;

    executeSQL(sql, (err, data) => {
      if (err) {
        console.log(sql);
        console.error(err);
        return;
      }
      console.log('Updated to the database - ' + match.match_id);
    });
  }

  function updateLiveDatabase(game, match, match_data, against_code) {
    let spread_data = match_data.spread_data
      ? JSON.parse(match_data.spread_data)
      : {};
    let total_data = match_data.total_data
      ? JSON.parse(match_data.total_data)
      : {};
    let moneyline_data = match_data.moneyline_data
      ? JSON.parse(match_data.moneyline_data)
      : {};

    let matchDate = match.timing.split('T')[0];

    const sql = `UPDATE dbo.BettingSplits SET 
      Spread = '${spread_data.spread || 0}',
      SpreadBets = '${spread_data.spread_bets || 0}',
      SpreadHandled = '${spread_data.spread_handled || 0}',
      Total = '${total_data.total || 0}',
      TotalBets = '${total_data.total_bets || 0}',
      TotalHandled = '${total_data.total_handled || 0}',
      Moneyline = '${moneyline_data.moneyline || 0}',
      MoneylineBets = '${moneyline_data.moneyline_bets || 0}',
      MoneylineHandled = '${moneyline_data.moneyline_handled || 0}',
      Score = ${
        match_data.score || 0
      } WHERE CAST(Gametime AS DATE) = '${matchDate}' AND TeamCode ='${
      match_data.code
    }' AND Source = 'VSiN'`;

    executeSQL(sql, (err, data) => {
      if (err) {
        console.log(sql);
        console.error(err);
        return;
      }
      console.log('Updated to the database (Live) - ' + match.match_id, data);
    });
  }

  function fetchData() {
    const all_matches = [];
    var itemsProcessed = 0;
    GamesData.forEach(async (game, index, array) => {
      const matches_returned = await scrapeData(game.url, game.name);
      for (const [match_id, match] of Object.entries(matches_returned)) {
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

        if (match.isLive) {
          updateLiveDatabase(game, match, match.team1, match.team2.code);
        } else {
          const sql_1 = `SELECT * FROM BettingSplits WHERE MatchId = '${match.match_id}' AND TeamCode = '${match.team1.code}' AND Source = 'VSiN'`;
          executeSQL(sql_1, (err, { rowCount, rows }) => {
            if (err) console.error(err);
            if (rowCount) {
              // Record already exists in the database
              updateDatabase(game, match, match.team1);
            } else {
              //Record does not exists
              insertDatabase(game, match, match.team1, match.team2.code);
            }
          });
        }

        if (match.isLive) {
          updateLiveDatabase(game, match, match.team2, match.team1.code);
        } else {
          const sql_2 = `SELECT * FROM BettingSplits WHERE MatchId = '${match.match_id}' AND TeamCode = '${match.team2.code}' AND Source = 'VSiN'`;
          executeSQL(sql_2, (err, { rowCount, rows }) => {
            if (err) console.error(err);
            if (rowCount) {
              // Record already exists in the database
              updateDatabase(game, match, match.team2);
            } else {
              //Record does not exists
              insertDatabase(game, match, match.team2, match.team1.code);
            }
          });
        }

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

module.exports = { vsin_scraper };
