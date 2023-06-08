var express = require('express');
var router = express.Router();
const Request = require('tedious').Request;
const connect = require('../db/index');

// display user page
router.get('/', function (req, res, next) {
    res.redirect('login');
});

router.get('/login', function (req, res, next) {
    res.render('login', { data: [] });
});

router.post('/login', function (req, res, next) {
    const email = req.body.email
    const password = req.body.password
    const remember = req.body.remember
    let errorMessage = '';
    let request = new Request(
        "SELECT Count(1) FROM Users where Email = '" + email +
        "' and UserType = 'Admin' and Password = '" + password + "'",
        (err) => {
            if (err) {
                errorMessage = err.message;
            }
        }
    );

    return new Promise((resolve, reject) => {
        data = {};
        request.on('row', function (columns) {
            count = columns[0].value;
            if (count > 0) {
                req.session.token = btoa('' + email + password);
                data['authentication'] = true;
            } else {
                data['authentication'] = false;
            }
        });
        request.on('error', (error) => reject(error.message));
        request.on('requestCompleted', () => {
            if (errorMessage) {
                req.flash('error', errorMessage)
                res.render('login', {
                    email, password, remember
                })
            } else if(data['authentication']) {
                res.redirect('/users');
            } else {
                req.flash('error', 'Wrong Email and Password!')
                res.render('login', {
                    email, password, remember
                })
            }
            return;
        }
        );

        connect()
            .then((conn) => conn.execSql(request))
            .catch((err) => reject(err));
    });
})

module.exports = router;