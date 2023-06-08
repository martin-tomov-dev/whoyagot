var Connection = require('tedious').Connection;

var dbConfig = {
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
var connection = new Connection(dbConfig);
connectionActive = false;

function connect() {
    return new Promise(function (resolve, reject) {
        if (connectionActive) {
            resolve(connection);
            return;
        }
        connection.connect(
            () => {
                connectionActive = true;
                resolve(connection);
                return;
            },
            (err) => {
                reject(err);
            }
        );
    });
}

connection.on('error', (err) => {
    console.log('error in connection ' + err);
    connectionActive = false;
});


module.exports = connect;