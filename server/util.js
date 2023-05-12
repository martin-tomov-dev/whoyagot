const jwt = require('jsonwebtoken');

combineTeamObject = (teamObject) => {
  resultObject = [];
  for (const [teamName, teamArr] of Object.entries(teamObject)) {
    team_1 = {};
    teamArr.forEach((team) => {
      team_1['MatchId'] = getProperty(team_1, team, 'MatchId');
      team_1['Sport'] = getProperty(team_1, team, 'Sport');
      team_1['TeamCode'] = getProperty(team_1, team, 'TeamCode');
      team_1['TeamName'] = getProperty(team_1, team, 'TeamName');
      team_1['GameTime'] = getProperty(team_1, team, 'GameTime');
      team_1['TeamLogo'] = getProperty(team_1, team, 'TeamLogo');
      team_1['Spread'] = getAverage(team_1, team, 'Spread');
      team_1['SpreadBets'] = getAverage(team_1, team, 'SpreadBets');
      team_1['SpreadHandled'] = getAverage(team_1, team, 'SpreadHandled');
      team_1['Total'] = getAverage(team_1, team, 'Total');
      team_1['TotalBets'] = getAverage(team_1, team, 'TotalBets');
      team_1['TotalHandled'] = getAverage(team_1, team, 'TotalHandled');
      team_1['Moneyline'] = getAverage(team_1, team, 'Moneyline');
      team_1['MoneylineBets'] = getAverage(team_1, team, 'MoneylineBets');
      team_1['MoneylineHandled'] = getAverage(team_1, team, 'MoneylineHandled');
      team_1['Score'] = getAverage(team_1, team, 'Score');
    });
    resultObject.push(team_1);
  }
  return resultObject;
};

getProperty = (team_1, team_2, key) => {
  if (team_1[key] != 'NULL' && team_1[key] != null && team_1[key] != '') {
    return team_1[key];
  }
  if (team_2[key] != 'NULL' && team_2[key] != null && team_2[key] != '') {
    return team_2[key];
  }
};

getAverage = (team_1, team_2, key) => {
  count = 0;
  val1 = 0;
  val2 = 0;
  if (team_1.hasOwnProperty(key) && team_1[key] != 0) {
    count++;
    val1 = parseFloat(team_1[key]);
  }
  if (team_2[key] != 0 && team_2[key] != 'NULL') {
    count++;
    val2 = parseFloat(team_2[key]);
  }
  return count != 0 ? (val1 + val2) / count : 0;
};

roundByHalf = (obj) => {
  obj.forEach((matchIdObj) => {
    Object.keys(matchIdObj).forEach((teamKey) => {
      matchIdObj[teamKey].forEach((teamObj) => {
        if (teamObj.hasOwnProperty('Spread')) {
          teamObj['Spread'] = roundByHalfUtil(teamObj['Spread']);
        }
        if (teamObj.hasOwnProperty('Total')) {
          teamObj['Total'] = roundByHalfUtil(teamObj['Total']);
        }
      });
    });
  });
  return obj;
};

roundByHalfUtil = (num) => {
  let sign = 1;
  if (num < 0) {
    sign = -1;
  }
  let absVal = Math.abs(num);
  if (absVal % 1 > 0 && absVal % 1 < 0.5) {
    absVal = Math.floor(absVal) + 0.5;
  } else if (absVal % 1 > 0.5) {
    absVal = Math.ceil(absVal);
  }
  return sign * absVal;
};

module.exports = {
  getFormattedData: (resultantObject) => {
    let response = [];
    for (const [matchId, matchArr] of Object.entries(resultantObject)) {
      jsonObject = {};
      teamWiseObject = {};
      matchArr.forEach((value) => {
        jsonArr = [];
        if (teamWiseObject.hasOwnProperty(value.TeamCode)) {
          jsonArr = teamWiseObject[value.TeamCode];
        }
        jsonArr.push(value);
        teamWiseObject[value.TeamCode] = jsonArr;
      });
      console.log('team wise object ', teamWiseObject);
      jsonObject[matchId] = combineTeamObject(teamWiseObject);
      response.push(jsonObject);
    }
    return roundByHalf(response);
  },

  makeid: (length) => {
    let result = '';
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  },

  getResponse: (data, status) => {
    let response = {};
    response['status'] = status;
    if (status) {
      if (data != 'Success') response['data'] = data;
    } else {
      response['error'] = data;
    }
    return response;
  },

  formatDate: (date) => {
    var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  },
};
