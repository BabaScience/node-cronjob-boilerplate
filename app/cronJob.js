// app/cronJob.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const nodemailer = require('nodemailer');

// Read email configuration from environment variables
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
  EMAIL_TO,
} = process.env;

// Create a transporter object
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT == 465, // true for port 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Object to track the last email sent time for each server
let lastEmailSentTime = {}; // Key: server name, Value: timestamp in milliseconds

const sampleJob = () => {
  console.log("Running scheduled job");
  // Your logic here
};

const anotherJob = () => {
  console.log("Running another scheduled job");
  // Another task logic
};

const checkServers = async () => {
  console.log("Checking server statuses");

  // Load servers from JSON file
  const jsonPath = path.join(__dirname, 'servers.json');
  const data = fs.readFileSync(jsonPath, 'utf8');
  const servers = JSON.parse(data);

  // Current time
  const currentTime = Date.now();

  // Check each server
  for (const server of servers) {
    const { name, url } = server;
    try {
      const response = await axios.get(url, { timeout: 5000 });
      if (response.status === 200) {
        console.log(`${name} is up. URL: ${url}`);
        // Reset last email sent time if server is up
        lastEmailSentTime[name] = null;
      } else {
        console.warn(`${name} returned status code ${response.status}. URL: ${url}`);
        await maybeSendEmailAlert(name, url, `Status code: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to reach ${name}. URL: ${url}. Error: ${error.message}`);
      await maybeSendEmailAlert(name, url, error.message);
    }
  }
};

const maybeSendEmailAlert = async (serverName, serverUrl, errorDetails) => {
  const currentTime = Date.now();
  const lastSentTime = lastEmailSentTime[serverName];

  // Check if at least 30 minutes have passed since the last email
  if (lastSentTime && (currentTime - lastSentTime) < 30 * 60 * 1000) {
    console.log(`Email already sent for ${serverName} less than 30 minutes ago.`);
    return;
  }

  // Send the email
  await sendEmailAlert(serverName, serverUrl, errorDetails);

  // Update the last email sent time
  lastEmailSentTime[serverName] = currentTime;
};

const sendEmailAlert = async (serverName, serverUrl, errorDetails) => {
  // Construct email message
  const mailOptions = {
    from: EMAIL_FROM,
    to: EMAIL_TO,
    subject: `ALERT⛑: ${serverName} is down!💣`,
    text: `The server "${serverName}" at ${serverUrl} is down.\n\nError Details: ${errorDetails}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Alert email sent for ${serverName}: ${info.messageId}`);
  } catch (err) {
    console.error(`Failed to send alert email for ${serverName}: ${err.message}`);
  }
};

module.exports = {
  sampleJob,
  anotherJob,
  checkServers,
};
