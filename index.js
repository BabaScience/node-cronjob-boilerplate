require('dotenv').config();
const cron = require('node-cron');
const { sampleJob, anotherJob, checkServers } = require('./app/cronJob');


// Schedule tasks
cron.schedule('*/5 * * * *', sampleJob);  // Every 5 minutes
cron.schedule('*/15 * * * * *', checkServers);  // Every 15 seconds
cron.schedule('0 0 * * *', anotherJob);  // Every midnight

console.log("Cron jobs scheduled");

// Graceful shutdown
process.on('SIGINT', () => {
    console.log("Shutting down cron jobs");
    process.exit();
});
