const Request = require('tedious').Request;
const { getToken } = require('./util');
const util = require('./util');
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

module.exports = {
  getAggregatedData: (sport) => {
    let date = new Date();
    date.setDate(date.getDate() - 1);
    date = util.formatDate(date);
    let errorMessage = '';
    let request = new Request(
      "SELECT * FROM BettingSplits where GameTime >= '" +
        date +
        "' AND Sport='" +
        sport +
        "' ORDER BY GameTime DESC",
      (err) => {
        if (err) {
          errorMessage = err.message;
        }
      }
    );

    return new Promise((resolve, reject) => {
      resultantObject = {};
      request.on('row', function (columns) {
        var rowObject = {};
        var jsonArray = [];
        columns.forEach(function (column) {
          rowObject[column.metadata.colName] =
            column.value == null ? 'NULL' : column.value;
        });
        if (resultantObject.hasOwnProperty(columns[1].value)) {
          jsonArray = resultantObject[columns[1].value];
        }
        jsonArray.push(rowObject);
        resultantObject[columns[1].value] = jsonArray;
      });
      request.on('error', (error) => reject(error.message));
      request.on('requestCompleted', () => {
        errorMessage == ''
          ? resolve(util.getFormattedData(resultantObject))
          : reject(errorMessage);
        return;
      });

      connect()
        .then((conn) => {
          conn.execSql(request);
        })
        .catch((err) => reject(err));
    });
  },
};
