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

  getLabels: () => {
    let errorMessage = '';
    let request = new Request(
      "SELECT * from Settings where PropKey IN ('About', 'Disclaimer')",
      (err) => {
        if (err) {
          errorMessage = err.message;
        }
      }
    );

    return new Promise((resolve, reject) => {
      var jsonArray = [];
      request.on('row', function (columns) {
        var rowObject = {};
        columns.forEach(function (column) {
          rowObject[column.metadata.colName] =
            column.value == null ? 'NULL' : column.value;
        });
        jsonArray.push(rowObject);
      });
      request.on('error', (error) => reject(error.message));
      request.on('requestCompleted', () =>
        errorMessage == '' ? resolve(jsonArray) : reject(errorMessage)
      );

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  updateLabels: (labelKey, labelValue) => {
    let errorMessage = '';
    let request = new Request(
      "Update Settings SET PropValue = '" +
        labelValue +
        "' where PropKey = '" +
        labelKey +
        "'",
      (err) => {
        if (err) {
          errorMessage = err.message;
        }
      }
    );

    return new Promise((resolve, reject) => {
      request.on('error', (error) => reject(error.message));
      request.on('requestCompleted', () =>
        errorMessage == '' ? resolve('Success') : reject(errorMessage)
      );

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
        "' and IsActive = 1",
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
          data['authtoken'] = getToken('user', passcode, 'user');
          data['passcodeValid'] = true;
        } else {
          data['passcodeValid'] = false;
        }
      });
      request.on('error', (error) => reject(error.message));
      request.on('requestCompleted', () =>
        errorMessage == '' ? resolve(data) : reject(errorMessage)
      );

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  subscribe: (name, email) => {
    let errorMessage = '';
    let request = new Request(
      "INSERT INTO Users(Name, Email) VALUES('" + name + "','" + email + "')",
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

  login: (username, password) => {
    return new Promise((resolve, reject) => {
      if (
        username == process.env.ADMIN_USERNAME &&
        password == process.env.ADMIN_PASSWORD
      ) {
        let obj = {};
        obj['authtoken'] = util.getToken(username, password, 'admin');
        resolve(obj);
      } else {
        reject('Invalid Credentials');
      }
    });
  },

  addBanner: (bannerImage, orientation, link, page) => {
    let errorMessage = '';
    let request = new Request(
      "INSERT INTO Banner(Image, Orientation, Link, Page) VALUES('" +
        bannerImage +
        "', '" +
        orientation +
        "', '" +
        link +
        "', '" +
        page +
        "')",
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
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  addPasscode: (passcode) => {
    let errorMessage = '';
    let request = new Request(
      "INSERT INTO Passcode(Passcode, IsActive) VALUES('" +
        passcode +
        "', '1')",
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
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  removeBanner: (bannerId) => {
    let errorMessage = '';
    let request = new Request(
      'DELETE FROM Banner where ID = ' + bannerId,
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
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  getAllBanners: () => {
    let errorMessage = '';
    let request = new Request(
      'Select Id, Image, Orientation, Link, Page FROM Banner where Status=1',
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
        if (resultantObject.hasOwnProperty(columns[2].value)) {
          jsonArray = resultantObject[columns[2].value];
        }
        jsonArray.push(rowObject);
        resultantObject[columns[2].value] = jsonArray;
      });

      request.on('error', (error) => {
        reject(error.message);
      });
      request.on('requestCompleted', () => {
        errorMessage == '' ? resolve(resultantObject) : reject(errorMessage);
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  getBanners: (page) => {
    let errorMessage = '';
    let request = new Request(
      "with t1 as (SELECT TOP 4 ID, IMAGE, ORIENTATION, Link, Page FROM dbo.Banner where ORIENTATION = 'Vertical' AND Status=1 AND Page = '" +
        page +
        "' ORDER BY NEWID()), t2 as (SELECT TOP 2 Id, IMAGE, ORIENTATION, Link, Page FROM dbo.Banner where ORIENTATION = 'Horizontal' AND Status=1 AND Page = '" +
        page +
        "' ORDER BY NEWID()) select * from t1 UNION select * from t2",
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
        if (resultantObject.hasOwnProperty(columns[2].value)) {
          jsonArray = resultantObject[columns[2].value];
        }
        jsonArray.push(rowObject);
        resultantObject[columns[2].value] = jsonArray;
      });

      request.on('error', (error) => {
        reject(error.message);
      });
      request.on('requestCompleted', () => {
        errorMessage == '' ? resolve(resultantObject) : reject(errorMessage);
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  getPasscodes: () => {
    let errorMessage = '';
    let request = new Request(
      'Select Id, Passcode FROM Passcode where IsActive=1',
      (err) => {
        if (err) {
          errorMessage = err.message;
        }
      }
    );

    return new Promise((resolve, reject) => {
      var jsonArray = [];
      request.on('row', function (columns) {
        var rowObject = {};
        columns.forEach(function (column) {
          rowObject[column.metadata.colName] =
            column.value == null ? 'NULL' : column.value;
        });
        jsonArray.push(rowObject);
      });

      request.on('error', (error) => {
        reject(error.message);
      });
      request.on('requestCompleted', () => {
        errorMessage == '' ? resolve(jsonArray) : reject(errorMessage);
      });

      connect()
        .then((conn) => {
          conn.execSql(request);
        })
        .catch((err) => reject(err));
    });
  },

  removePasscode: (passcodeId) => {
    let errorMessage = '';
    let request = new Request(
      'DELETE FROM Passcode where ID = ' + passcodeId,
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
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  getSubscribers: () => {
    let errorMessage = '';
    let request = new Request('Select * FROM Users', (err) => {
      if (err) {
        errorMessage = err.message;
      }
    });

    return new Promise((resolve, reject) => {
      var jsonArray = [];
      request.on('row', function (columns) {
        var rowObject = {};
        columns.forEach(function (column) {
          rowObject[column.metadata.colName] =
            column.value == null ? 'NULL' : column.value;
        });
        jsonArray.push(rowObject);
      });

      request.on('error', (error) => {
        reject(error.message);
      });
      request.on('requestCompleted', () => {
        errorMessage == '' ? resolve(jsonArray) : reject(errorMessage);
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  removeSubscribers: (subscriberId) => {
    let errorMessage = '';
    let request = new Request(
      'DELETE FROM Users where ID = ' + subscriberId,
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
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },

  getLatestPasscode: () => {
    let errorMessage = '';
    let request = new Request(
      "select Passcode from Passcode where Id = (select MAX(Id) from Passcode where IsActive = '1')",
      (err) => {
        if (err) {
          errorMessage = err.message;
        }
      }
    );

    return new Promise((resolve, reject) => {
      var value = '';
      request.on('row', function (columns) {
        value = columns[0].value;
      });

      request.on('error', (error) => {
        reject(error.message);
      });
      request.on('requestCompleted', () => {
        errorMessage == '' ? resolve(value) : reject(errorMessage);
        return;
      });

      connect()
        .then((conn) => conn.execSql(request))
        .catch((err) => reject(err));
    });
  },
};
