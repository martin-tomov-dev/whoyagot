const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

async function sendEmail(username, passcode, email) {
  const mailjet = require('node-mailjet').apiConnect(
    process.env.PUBLIC_KEY,
    process.env.PRIVATE_KEY
  );
  const __dirname = path.resolve();
  const filePath = path.join(__dirname, 'server\\emailTemplate.html');
  const source = fs.readFileSync(filePath, 'utf-8').toString();
  const template = handlebars.compile(source);
  const replacements = {
    dynamicUsername: username,
    dynamicPasscode: passcode,
  };
  const htmlToSend = template(replacements);

  const request = mailjet.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: {
          Email: process.env.EMAIL_FROM,
          Name: process.env.APP_NAME,
        },
        To: [
          {
            Email: email,
            Name: username,
          },
        ],
        Subject: 'Welcome to WYG!!',
        HTMLPart: htmlToSend,
      },
    ],
  });
  request
    .then((result) => {
      console.log('result ', JSON.stringify(result.body));
    })
    .catch((err) => {
      console.log(err.statusCode);
    });
}

module.exports = sendEmail;
