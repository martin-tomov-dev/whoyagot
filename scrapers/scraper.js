require('dotenv').config();
const so_scraper = require('./so_scraper');
const vsin_scraper = require('./vsin_scraper');
const yahoo_scraper = require('./yahoo_scraper');

// Create connection to database
const config = {
  server: 'sports-p-01.database.windows.net',
  authentication: {
    type: 'default',
    options: {
      userName: 'SportsProjAdmin',
      password: '3d5eca2cd481!',
    },
  },
  options: {
    database: 'sports-pdb-01',
    encrypt: true,
  },
};

function runScraper(scraper_id) {
  switch (scraper_id) {
    case 1:
      so_scraper.so_scraper(config);
      break;
    case 2:
      vsin_scraper.vsin_scraper(config);
      break;
    case 3:
      yahoo_scraper.yahoo_scraper(config);
      break;
    default:
      console.log('Not a valid scraper ID');
      break;
  }
}

// function to run the specific scraper
/*
1 - Scores and Odds Scraper
2 - VSiN Scraper
3 - Yahoo Scraper
*/

runScraper(3);
