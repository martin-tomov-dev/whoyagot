const Request = require('tedious').Request;
const { getToken } = require('./util');
const util = require('./util');
const connect = require('./db/index');

module.exports = {
  getAggregatedData: (sport) => {
    let date = new Date();
    date.setDate(date.getDate() - 3);
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

  subscribe: ({ name, email, state, user_type = 'Customer' }) => {
    let errorMessage = '';
    let request = new Request(
      "INSERT INTO Users(Name, Email, State, UserType) VALUES('" + name + "','" + email + "', '" + state + "', '" + user_type + "')",
      (err) => {
        if (err) {
          errorMessage = err.message;
        }
      }
    );

    return new Promise((resolve, reject) => {
      request.on('error', (error) => {
        reject(error.message);
      });
      request.on('requestCompleted', () => {
        errorMessage == '' ? resolve('Success') : reject(errorMessage);
        return;
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },
  passcodeLogin: (passcode) => {
    let errorMessage = '';
    let request = new Request(
      "SELECT Count(1) FROM Passcode where Passcode = '" +
        passcode +
        "' and IsActive = 'True'",
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
          // data['authtoken'] = getToken('user', passcode, 'user');
          data['passcodeValid'] = true;
        } else {
          data['passcodeValid'] = false;
        }
      });
      request.on('error', (error) => reject(error.message));
      request.on('requestCompleted', () =>{
        errorMessage == '' ? resolve(data) : reject(errorMessage)
      }
      );

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

};
