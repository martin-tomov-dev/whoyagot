require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const multer = require('multer');
const app = express();
const emailvalidator = require('email-validator');
const service = require('./service.js');
const util = require('./util.js');
const sendEmail = require('./email.js');

const cron = require('node-cron');
const so_scraper = require('../scrapers/so_scraper');
const vsin_scraper = require('../scrapers/vsin_scraper');
const yahoo_scraper = require('../scrapers/yahoo_scraper');

app.use(express.static('assets'));
app.use('/images', express.static('images'));

// Have Node serve the files for our built React app
app.use(express.static(path.resolve(__dirname, '../client/build')));

app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'default-src': ["'self'", 'data:', "'unsafe-inline'", "'unsafe-eval'"],
      'img-src': ["'self'", 'https: data:'],
      'script-src': [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        'www.google-analytics.com',
      ],
    },
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

const PORT = process.env.PORT || 3001;
const DIR = './assets/images/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = util.makeid(10) + file.originalname;
    cb(null, fileName);
  },
});

app.get('/api/getAggregatedData', (req, res) => {
  let sport = req.query.sport;
  if (sport == null || sport == '') res.status(400).send('Invalid Sport');
  service.getAggregatedData(sport).then(
    (data) => {
      res.status(200).send(util.getResponse(data, true));
    },
    (err) => {
      res.status(500).send(util.getResponse(err, false));
    }
  ).catch((err) => res.status(403).send(util.getResponse(err, false)));

  // util
  //   //.verifyToken(req, res, false)
  //   .then((response) => {
  //     service.getAggregatedData(sport).then(
  //       (data) => {
  //         res.status(200).send(util.getResponse(data, true));
  //       },
  //       (err) => {
  //         res.status(500).send(util.getResponse(err, false));
  //       }
  //     );
  //   })
  //   .catch((err) => res.status(403).send(util.getResponse(err, false)));
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  // res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});

// Create connection to database
const config = {
  server: process.env.DATABASE_SERVER,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
    },
  },
  options: {
    database: process.env.DATABASE_NAME,
    encrypt: true,
  },
};

// Set cron job for the scrapers
cron.schedule('0 */20 * * * *', () => {
  const scheduler_mins = new Date().getMinutes();
  if (scheduler_mins < 20) {
    vsin_scraper.vsin_scraper(config);
  } else if (scheduler_mins < 40) {
    yahoo_scraper.yahoo_scraper(config);
  } else {
    so_scraper.so_scraper(config);
  }
});
