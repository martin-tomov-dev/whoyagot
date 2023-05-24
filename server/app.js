require('dotenv').config();
require('./db/index');
const express = require('express');
const bodyParser = require('body-parser');
const flash = require('express-flash');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const multer = require('multer');
const app = express();

const service = require('./service.js');
const util = require('./util.js');

const usersRouter = require('./routes/users');
const loginRouter = require('./routes/login');
const passcodeRouter = require('./routes/passcode');
// var dataRouter = require('./routes/data');
const cron = require('node-cron');
const so_scraper = require('../scrapers/so_scraper');
const vsin_scraper = require('../scrapers/vsin_scraper');
const yahoo_scraper = require('../scrapers/yahoo_scraper');

app.use(express.static('assets'));
app.use('/images', express.static('images'));

// Have Node serve the files for our built React app
// app.use(express.static(path.resolve(__dirname, '../client/build')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
  cookie: { maxAge: 3600000 },
  store: new session.MemoryStore,
  saveUninitialized: true,
  resave: 'true',
  secret: 'secret'
}))

app.use(flash());

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

const isAuthenticated = (req, res, next) => {
  if (req.session.token) {
    console.log('token>>', req.session.token);
    // User is authenticated, call next() to proceed to the next middleware
    return next();
  }

  // User is not authenticated, redirect to login page
  res.redirect('/');
};

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use('/', loginRouter);

app.use('/users', isAuthenticated, usersRouter);
app.use('/passcode', isAuthenticated, passcodeRouter);
// app.use('/data', dataRouter);
// app.use('/howtouse', dataRouter);

const PORT = process.env.PORT; // || 3001;
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
});

app.post('/api/subscribe', (req, res) => {
  service.subscribe(req.body).then(
    (data) => {
      res.status(200).send({ message: 'success' });
    },
    (err) => {
      res.status(500).send({ message: 'Duplicated Userinfo!', passcode: 'ABCD' });
    }
  ).catch((err) => res.status(403).send(util.getResponse(err, false)));
});

app.get('/api/passcodeLogin', (req, res) => {
  let passcode = req.query.passcode;
  service.passcodeLogin(passcode).then(
    (data) => {
      res.status(200).send({ data });
    },
    (err) => {
      res.status(500).send({ message: 'Wrong Passcode!' });
    }
  ).catch((err) => res.status(403).send(util.getResponse(err, false)));
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
  if (scheduler_mins >= 0 && scheduler_mins < 20) {
    yahoo_scraper.yahoo_scraper(config);
  } else if (scheduler_mins >= 20 && scheduler_mins < 40) {
    vsin_scraper.vsin_scraper(config);
  } else if (scheduler_mins >= 40 && scheduler_mins < 60) {
    so_scraper.so_scraper(config);
  }
});