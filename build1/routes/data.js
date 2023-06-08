var express = require('express');
var router = express.Router();

// display user page
router.get('/', function (req, res, next) {
    res.render('data', { data: [] });
});

module.exports = router;