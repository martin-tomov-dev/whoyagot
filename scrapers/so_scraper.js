/***************
 *
 * SCORE & ODDS SCRAPER v1.0
 * author: Aditya @Clarte
 *
 ****************/

function so_scraper(config) {
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
      url: 'https://www.scoresandodds.com/nfl/consensus-picks',
      name: 'NFL',
    },
    {
      url: 'https://www.scoresandodds.com/nba/consensus-picks',
      name: 'NBA',
    },
    {
      url: 'https://www.scoresandodds.com/ncaaf/consensus-picks',
      name: 'NCAAF',
    },
    {
      url: 'https://www.scoresandodds.com/ncaab/consensus-picks',
      name: 'NCAAB',
    },
    {
      url: 'https://www.scoresandodds.com/nhl/consensus-picks',
      name: 'NHL',
    },
    {
      url: 'https://www.scoresandodds.com/mlb/consensus-picks',
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
      const listItems = $('.trend-card');
      // Stores data for all matches
      const matches = [];
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
        match.team1.name = $(el)
          .children()
          .first()
          .children()
          .first()
          .find('[class="team-name"]')
          .text()
          .trim();

        match.team1.code = $(el)
          .children()
          .first()
          .children()
          .first()
          .find('[class="team-flag"]')
          .attr('data-abbr')
          .trim();

        match.team1.logo =
          'https://rical-images.s3.amazonaws.com/team-logos/' +
          category.toLowerCase() +
          '/' +
          match.team1.code +
          '.png';

        match.team2.name = $(el)
          .children()
          .first()
          .children()
          .last()
          .find('[class="team-name"]')
          .text()
          .trim();

        match.team2.code = $(el)
          .children()
          .first()
          .children()
          .last()
          .find('[class="team-flag"]')
          .attr('data-abbr')
          .trim();

        match.team2.logo =
          'https://rical-images.s3.amazonaws.com/team-logos/' +
          category.toLowerCase() +
          '/' +
          match.team2.code +
          '.png';

        let match_time = $(el)
          .children()
          .first()
          .find('[class="event-info"] > a > span')
          .attr('data-value');

        const inputMoment = moment.utc(match_time);
        const estMoment = inputMoment.tz('America/New_York');
        const so_est = estMoment.format('YYYY-MM-DDTHH:mm:ss');
        let unixTimestamp = Date.parse(so_est) / 1000;
        match.timing = so_est;

        match.match_id =
          category +
          '_' +
          match.team1.code +
          '_' +
          match.team2.code +
          '_' +
          unixTimestamp;

        if ($(el).hasClass('consensus-table-spread--0')) {
          match.team1.spread_data = JSON.stringify({
            spread:
              $(el)
                .find('.trend-graph-sides')
                .children()
                .first()
                .text()
                .replace(/[^0-9.-]/g, '') || null,
            spread_bets:
              $(el)
                .find('.trend-graph-percentage')
                .first()
                .children()
                .first()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
            spread_handled:
              $(el)
                .find('.trend-graph-percentage')
                .last()
                .children()
                .first()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
          });
          match.team2.spread_data = JSON.stringify({
            spread:
              $(el)
                .find('[class="trend-graph-sides"]')
                .children()
                .last()
                .text()
                .replace(/[^0-9.-]/g, '') || null,
            spread_bets:
              $(el)
                .find('.trend-graph-percentage')
                .first()
                .children()
                .last()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
            spread_handled:
              $(el)
                .find('.trend-graph-percentage')
                .last()
                .children()
                .last()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
          });
        } else if ($(el).hasClass('consensus-table-total--0')) {
          match.team1.total_data = JSON.stringify({
            total:
              $(el)
                .find('[class="trend-graph-sides"]')
                .children()
                .first()
                .text()
                .replace(/[^0-9.-]/g, '') || null,
            total_bets:
              $(el)
                .find('.trend-graph-percentage')
                .first()
                .children()
                .first()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
            total_handled:
              $(el)
                .find('.trend-graph-percentage')
                .last()
                .children()
                .first()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
          });
          match.team2.total_data = JSON.stringify({
            total:
              $(el)
                .find('[class="trend-graph-sides"]')
                .children()
                .last()
                .text()
                .replace(/[^0-9.-]/g, '') || null,
            total_bets:
              $(el)
                .find('.trend-graph-percentage')
                .first()
                .children()
                .last()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
            total_handled:
              $(el)
                .find('.trend-graph-percentage')
                .last()
                .children()
                .last()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
          });
        } else if ($(el).hasClass('consensus-table-moneyline--0')) {
          match.team1.moneyline_data = JSON.stringify({
            moneyline:
              $(el)
                .find('.data-moneyline')
                .first()
                .text()
                .replace(/[^0-9.-]/g, '') || null,
            moneyline_bets:
              $(el)
                .find('.trend-graph-percentage')
                .first()
                .children()
                .first()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
            moneyline_handled:
              $(el)
                .find('.trend-graph-percentage')
                .last()
                .children()
                .first()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
          });
          match.team2.moneyline_data = JSON.stringify({
            moneyline:
              $(el)
                .find('.data-moneyline')
                .last()
                .text()
                .replace(/[^0-9.-]/g, '') || null,
            moneyline_bets:
              $(el)
                .find('.trend-graph-percentage')
                .first()
                .children()
                .last()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
            moneyline_handled:
              $(el)
                .find('.trend-graph-percentage')
                .last()
                .children()
                .last()
                .css('width')
                .replace(/[^0-9.-]/g, '') || null,
          });
        }

        if (matches[match.match_id]) {
          if ($(el).hasClass('consensus-table-spread--0')) {
            matches[match.match_id].team1.spread_data = match.team1.spread_data;
            matches[match.match_id].team2.spread_data = match.team2.spread_data;
          } else if ($(el).hasClass('consensus-table-total--0')) {
            matches[match.match_id].team1.total_data = match.team1.total_data;
            matches[match.match_id].team2.total_data = match.team2.total_data;
          } else if ($(el).hasClass('consensus-table-moneyline--0')) {
            matches[match.match_id].team1.moneyline_data =
              match.team1.moneyline_data;
            matches[match.match_id].team2.moneyline_data =
              match.team2.moneyline_data;
          }
        } else {
          // Populate matches array with match data
          matches[match.match_id] = match;
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

    let spread_data = match_data.spread_data
      ? JSON.parse(match_data.spread_data)
      : {};
    let total_data = match_data.total_data
      ? JSON.parse(match_data.total_data)
      : {};
    let moneyline_data = match_data.moneyline_data
      ? JSON.parse(match_data.moneyline_data)
      : {};

    const sql = `INSERT INTO dbo.BettingSplits(MatchId, Sport, TeamCode, TeamName, TeamLogo, GameTime, Spread, SpreadBets, SpreadHandled, Total, TotalBets, TotalHandled, Moneyline, MoneylineBets, MoneylineHandled, Source, CreatedAt) VALUES (
      '${match.match_id}',
      '${game.name}',
      '${match_data.code}',
      '${match_data.name.replace("'", '')}',
      '${match_data.logo}',
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
      'Scores&Odds',
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
      UpdatedAt = '${current_time}',
      Spread = '${spread_data.spread || 0}',
      SpreadBets = '${spread_data.spread_bets || 0}',
      SpreadHandled = '${spread_data.spread_handled || 0}',
      Total = '${total_data.total || 0}',
      TotalBets = '${total_data.total_bets || 0}',
      TotalHandled = '${total_data.total_handled || 0}',
      Moneyline = '${moneyline_data.moneyline || 0}',
      MoneylineBets = '${moneyline_data.moneyline_bets || 0}',
      MoneylineHandled = '${
        moneyline_data.moneyline_handled || 0
      }' WHERE MatchId='${match.match_id}' AND TeamCode ='${
      match_data.code
    }' AND Sport='${game.name}' AND Source = 'Scores&Odds'`;

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
        const sql_1 = `SELECT * FROM BettingSplits WHERE MatchId = '${match.match_id}' AND TeamCode = '${match.team1.code}' AND Sport='${game.name}' AND Source = 'Scores&Odds'`;
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

        const sql_2 = `SELECT * FROM BettingSplits WHERE MatchId = '${match.match_id}' AND TeamCode = '${match.team2.code}' AND Sport='${game.name}' AND Source = 'Scores&Odds'`;
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

module.exports = { so_scraper };