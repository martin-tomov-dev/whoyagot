var express = require('express');
var router = express.Router();
const Request = require('tedious').Request;
const connect = require('../db/index');
var TYPES = require('tedious').TYPES;

// display user page
router.get('/', function (req, res, next) {
    let errorMessage = '';
    let request = new Request(
        "SELECT * FROM Users ORDER BY id desc",
        (err) => {
            if (err) {
                errorMessage = err.message;
            }
        }
    );
    return new Promise((resolve, reject) => {
        resultantObject = [];
        request.on('row', function (columns) {
            var rowObject = {};
            columns.forEach(function (column) {
                rowObject[column.metadata.colName] =
                    column.value == null ? 'NULL' : column.value;
            });
            resultantObject.push(rowObject);
        });
        request.on('error', (error) => reject(error.message));
        request.on('requestCompleted', () => {
            if (errorMessage) {
                req.flash('error', errorMessage);
                res.render('users', { data: '' });
            } else {
                res.render('users', { data: resultantObject });
            }
            return;
        });

        connect()
            .then((conn) => {
                conn.execSql(request);
            })
            .catch((err) => reject(err));
    });
});

// display add user page
router.get('/add', function (req, res, next) {
    res.render('users/add', {
        name: '',
        email: '',
        state: '',
        user_type: ''
    })
})

// add a new user
router.post('/add', function (req, res, next) {

    let name = req.body.name;
    let email = req.body.email;
    let state = req.body.state;
    let user_type = req.body.user_type;
    let errors = false;

    if (name.length === 0 || email.length === 0 || state.length === 0) {
        errors = true;

        req.flash('error', "Please enter name and email and state");
        res.render('users/add', {
            name, email, state, user_type
        })
    }

    // if no error
    if (!errors) {
        let errorMessage = '';
        let request = new Request(
            `INSERT INTO Users (Name, Email, State, UserType) VALUES (@name, @email, @state, @usertype);`,
            (err, rowCount) => {
                if (err) {
                    errorMessage = err.message;
                    console.log('err>>', err);
                }
            }
        );
        request.addParameter('name', TYPES.NVarChar, name);
        request.addParameter('email', TYPES.NVarChar, email);
        request.addParameter('state', TYPES.NVarChar, state);
        request.addParameter('usertype', TYPES.NVarChar, user_type);

        return new Promise((resolve, reject) => {
            request.on('error', (error) => reject(error.message));
            request.on('requestCompleted', () => {
                if (errorMessage) {
                    req.flash('error', errorMessage)

                    res.render('users/add', {
                        name, email, state, user_type
                    })
                } else {
                    req.flash('success', 'User successfully added');
                    res.redirect('/users');
                }
                return;
            });
            connect()
                .then((conn) => {
                    conn.execSql(request);
                })
                .catch((err) => reject(err));
        });
    }
})

// display edit user page
router.get('/edit/(:id)', function (req, res, next) {
    let id = req.params.id;
    let errorMessage = '';
    let request = new Request(
        "SELECT * FROM users WHERE id = @id",
        (err) => {
            if (err) {
                errorMessage = err.message;
            }
        }
    );
    request.addParameter('id', TYPES.Int, id);

    return new Promise((resolve, reject) => {
        var rows = [];
        request.on('row', function (columns) {
            var rowObject = {};
            columns.forEach(function (column) {
                rowObject[column.metadata.colName] =
                    column.value == null ? 'NULL' : column.value;
            });
            rows.push(rowObject);
        });
        request.on('error', (error) => reject(error.message));
        request.on('requestCompleted', () => {
            if (errorMessage) {
                req.flash('error', errorMessage)
                res.redirect('/users')
            }
            if (rows.length < 1) {
                req.flash('error', 'User not found with id = ' + id)
                res.redirect('/users')
            } else {
                res.render('users/edit', {
                    title: 'Edit User',
                    id: rows[0].Id,
                    name: rows[0].Name,
                    email: rows[0].Email,
                    state: rows[0].State,
                    user_type: rows[0].UserType
                })
            }
            return;
        });

        connect()
            .then((conn) => {
                conn.execSql(request);
            })
            .catch((err) => reject(err));
    });
})

// update user data
router.post('/update/:id', function (req, res, next) {

    let id = req.params.id;
    let name = req.body.name;
    let email = req.body.email;
    let state = req.body.state;
    let user_type = req.body.user_type;
    let errors = false;

    if (name.length === 0 || email.length === 0 || state.length === 0 || user_type.length === 0) {
        errors = true;

        req.flash('error', "Please enter name and email and state");
        res.render('users/edit', {
            id, name, email, state, user_type
        })
    }

    // if no error
    if (!errors) {
        let errorMessage = '';
        let request = new Request(
            `UPDATE Users SET Name = @name, Email = @email, State = @state, UserType = @usertype WHERE id = @id`,
            (err, rowCount) => {
                if (err) {
                    errorMessage = err.message;
                    console.log('err>>', err);
                }
            }
        );
        request.addParameter('name', TYPES.NVarChar, name);
        request.addParameter('email', TYPES.NVarChar, email);
        request.addParameter('state', TYPES.NVarChar, state);
        request.addParameter('usertype', TYPES.NVarChar, user_type);
        request.addParameter('id', TYPES.Int, id);

        return new Promise((resolve, reject) => {
            request.on('error', (error) => reject(error.message));
            request.on('requestCompleted', () => {
                if (errorMessage) {
                    req.flash('error', errorMessage)
                    res.render('users/edit', {
                        id, name, email, state, user_type
                    })
                } else {
                    req.flash('success', 'User successfully updated');
                    res.redirect('/users');
                }
                return;
            });
            connect()
                .then((conn) => {
                    conn.execSql(request);
                })
                .catch((err) => reject(err));
        });
    }
})

// delete user
router.get('/delete/(:id)', function (req, res, next) {
    let id = req.params.id;

    let errorMessage = '';
    let request = new Request(
        `DELETE FROM users WHERE id = @id`,
        (err, rowCount) => {
            if (err) {
                errorMessage = err.message;
                console.log('err>>', err);
            }
        }
    );
    request.addParameter('id', TYPES.Int, id);

    return new Promise((resolve, reject) => {
        request.on('error', (error) => reject(error.message));
        request.on('requestCompleted', () => {
            if (errorMessage) {
                req.flash('error', errorMessage)
                res.redirect('/users')
            } else {
                req.flash('success', 'User successfully deleted! ID = ' + id)
                res.redirect('/users')
            }
            return;
        });
        connect()
            .then((conn) => {
                conn.execSql(request);
            })
            .catch((err) => reject(err));
    });
})

module.exports = router;