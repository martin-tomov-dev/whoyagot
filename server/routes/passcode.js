var express = require('express');
var router = express.Router();
const Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
const connect = require('../db/index');

router.get('/', function (req, res, next) {
    let errorMessage = '';
    let request = new Request(
        "SELECT * FROM Passcode ORDER BY id desc",
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
                res.render('passcode', { data: '' });
            } else {
                res.render('passcode', { data: resultantObject });
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
    res.render('passcode/add', {
        passcode: '',
    })
})

router.post('/add', function (req, res, next) {

    let passcode = req.body.passcode;
    let errors = false;

    if (passcode.length === 0) {
        errors = true;
        req.flash('error', "Please enter passcode");
        res.render('passcode/add', {
            passcode
        })
    }

    // if no error
    if (!errors) {
        let errorMessage = '';
        let request = new Request(
            `INSERT INTO Passcode (Passcode, IsActive) VALUES (@passcode, @isactive)`,
            (err, rowCount) => {
                if (err) {
                    errorMessage = err.message;
                    console.log('err>>', err);
                }
            }
        );
        request.addParameter('passcode', TYPES.NVarChar, passcode);
        request.addParameter('isactive', TYPES.NVarChar, 'True');

        return new Promise((resolve, reject) => {
            request.on('error', (error) => reject(error.message));
            request.on('requestCompleted', () => {
                if (errorMessage) {
                    req.flash('error', errorMessage)
                    res.render('passcode/add', {
                        passcode
                    })
                } else {
                    req.flash('success', 'Passcode successfully added');
                    res.redirect('/passcode');
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

router.get('/edit/(:id)', function (req, res, next) {
    let id = req.params.id;
    let errorMessage = '';
    let request = new Request(
        "SELECT * FROM Passcode WHERE id = @id",
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
                res.redirect('/passcode')
            }
            if (rows.length < 1) {
                req.flash('error', 'Passcode not found with id = ' + id)
                res.redirect('/passcode')
            } else {
                res.render('passcode/edit', {
                    title: 'Edit Passcode',
                    id: rows[0].Id,
                    passcode: rows[0].Passcode,
                    status: rows[0].IsActive,
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

router.post('/update/:id', function (req, res, next) {
    let id = req.params.id;
    let status = req.body.status;
    let passcode = req.body.passcode;
    let errors = false;

    if (passcode.length === 0) {
        errors = true;
        req.flash('error', "Please enter passcode");
        res.render('passcode/edit', {
            id: req.params.id,
            passcode: passcode,
            status: status,
        })
    }

    // if no error
    if (!errors) {
        let errorMessage = '';
        let request = new Request(
            `UPDATE Passcode SET Passcode = @passcode, IsActive = @isactive WHERE id = @id`,
            (err, rowCount) => {
                if (err) {
                    errorMessage = err.message;
                    console.log('err>>', err);
                }
            }
        );
        request.addParameter('passcode', TYPES.NVarChar, passcode);
        request.addParameter('isactive', TYPES.NVarChar, status);
        request.addParameter('id', TYPES.Int, id);

        return new Promise((resolve, reject) => {
            request.on('error', (error) => reject(error.message));
            request.on('requestCompleted', () => {
                if (errorMessage) {
                    req.flash('error', errorMessage)
                    res.render('passcode/edit', {
                        id, passcode, status
                    })
                } else {
                    req.flash('success', 'Passcode successfully updated');
                    res.redirect('/passcode');
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

router.get('/delete/(:id)', function (req, res, next) {
    let id = req.params.id;

    let errorMessage = '';
    let request = new Request(
        `DELETE FROM Passcode WHERE id = @id`,
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
                res.redirect('/passcode')
            } else {
                req.flash('success', 'Passcode successfully deleted! ID = ' + id)
                res.redirect('/passcode')
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