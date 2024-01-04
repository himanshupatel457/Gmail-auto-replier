const express = require('express');      // Web application framework
const dotenv = require('dotenv');       // Environment variable loading
const schedule = require('node-schedule'); // Job scheduling
const { getUnreadEmails, getOrCreateLabelId } = require('./controllers/gmailControllers'); // Gmail interaction



dotenv.config({
    path: "./secret/keys.env" // Location of the file containing sensitive keys
})


const app = express();
// app.use(express.json()); // Parse incoming JSON data

const labelName = process.env.LABELNAME;

const createdLabel = async ()=>{
    await getOrCreateLabelId(labelName);
}
createdLabel();

// - Executes getUnreadEmails function every 10 seconds
schedule.scheduleJob('*/10 * * * * *', getUnreadEmails);



module.exports = app;