const cron = require('node-cron');


function logMessage() {
 console.log('Cron job executed at:', new Date().toLocaleString());
}
// Schedule the cron job
cron.schedule('*/2 * * * *', () => {
    logMessage();
    console.log('running a task every two minutes');
});


