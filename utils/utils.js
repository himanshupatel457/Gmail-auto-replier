const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const dotenv = require('dotenv');
dotenv.config({
    path: "./secret/keys.env"
})



const getClient = () => {
    // Create an OAuth2Client instance:
    const oauth2Client = new OAuth2Client(
        process.env.GOOGLE_CLIENT_ID, // Client ID from Google Cloud console
        process.env.GOOGLE_CLIENT_SECRET, // Client secret from Google Cloud console
        process.env.REDIRECT_URI // Redirect URI for authentication
    );
    // Set refresh token for authentication:
    oauth2Client.setCredentials({
        refresh_token: process.env.REFRESH_TOKEN // Refresh token obtained during authorization
    });
    // Return the configured client:
    return oauth2Client;
}


// already prepared a default content
const getEmailContent = (fromHeader) => {
    const emailContent =
        `<html>` +
        `<head>` +
        `<style>` +
        `body {` +
        `  font-family: Arial, sans-serif;` +
        `  color: #333;` +
        `  margin: 0;` +
        `  padding: 20px;` +
        `  background-color: #1c1b1b;` +
        `}` +
        `h1 {` +
        `  font-size: 24px;` +
        `  margin-bottom: 10px;` +
        `}` +
        `p {` +
        `  font-size: 16px;` +
        `  line-height: 1.5;` +
        `  margin-bottom: 20px;` +
        `}` +
        `.highlight {` +
        `  font-weight: bold;` +
        `  color: #a39f9e;` +
        `}` +
        `</style>` +
        `</head>` +
        `<body>` +
        `<h1>Hi there! </h1>` +
        `<p>Thank you for reaching out! I appreciate you taking the time to connect.</p>` +
        `<p><span class="highlight">Unfortunately, I'm currently unavailable as I'm enjoying a well-deserved vacation. ️</span></p>` +
        `<p>But don't worry, I'll be back in action soon! I'll be sure to get back to you as soon as I return.</p>` +
        `<p>In the meantime, if your request is urgent, please feel free to contact my assistant at <a href="mailto:assistant@example.com">assistant@example.com</a>.</p>` +
        `<p>Thanks for your understanding, and I look forward to connecting with you soon!</p>` +
        `<p>Best regards,</p>` +
        `<p>Himanshu Patel</p>` +
        `</body>` +
        `</html>`;

    return emailContent;
};



module.exports = { getClient, getEmailContent }
