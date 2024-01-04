const { google } = require('googleapis');
const { getClient, getEmailContent } = require('../utils/utils');
const gmail = google.gmail('v1');


const getUnreadEmails = async () => {
    try {
        const auth = await getClient();
        const gmail = google.gmail({ version: 'v1', auth });
        const today = new Date();
        // Calculate previous date
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);

        // Format date as YYYY/MM/DD
        const yesterdayString = yesterday.toISOString().split('T')[0];
        // Retrieve threads directly and using query to fetch specific mails/threads
        const threads = await gmail.users.threads.list({
            userId: 'me',
            q: `is:unread after:${yesterdayString} category:primary -label:fwd -category:promotions -category:social -category:updates`, // Adjust date as needed
        });

        const newThreads = [];
        for (const thread of threads.data.threads) {
            const firstMessage = await gmail.users.threads.get({
                userId: 'me',
                id: thread.id,
            });

            if (firstMessage.data.messages[0].payload.headers.find(header => header.name === 'From').value !== 'me') {
                newThreads.push(thread);
            }
        }

        console.log('New threads:', newThreads); // to show new mails if found
        processThreads(newThreads);
    } catch (error) {
        console.error('Error retrieving unread emails:', error.message);
    }
};




const processThreads = async (threads) => {
    try {
        // Build email content with proper headers and encoding
        const auth = await getClient();
        const gmail = google.gmail({ version: 'v1', auth });

        //get the label name user wants
        const labelName = process.env.LABELNAME;
        const labelId = await getOrCreateLabelId(labelName); // preapre label if not and get labelId

        for (const thread of threads) {
            const firstMessage = await gmail.users.threads.get({
                userId: 'me',
                id: thread.id,
            });
            // console.log(firstMessage.data.messages)
            //Here we are checkiing if replied mail is my own or not
            if (
                firstMessage.data.messages[0].labelIds.includes(labelId) &&
                !firstMessage.data.messages.some(message =>
                    message.payload.headers.find(header => header.name === 'From').value === 'me'
                )
            ) {
                // Unmark as unread only, don't proceed with reply logic
                await gmail.users.threads.modify({
                    userId: 'me',
                    id: thread.id,
                    requestBody: {
                        removeLabelIds: ['UNREAD'],
                    },
                });
            } else {
                // Check if it's a first-time thread (no prior emails from me)
                if (!firstMessage.data.messages.some(message =>
                    message.payload.headers.find(header => header.name === 'From').value === 'me'
                )) {
                    // Get sender information
                    const fromHeader = firstMessage.data.messages[0].payload.headers.find(header => header.name === 'From');

                    // Construct reply email
                    const emailContent = getEmailContent(fromHeader);
                    const subject = process.env.SUBJECT; // desired subject
                    const message = gmailCompose(subject, fromHeader.value, emailContent);

                    // Mark the thread as read
                    await gmail.users.threads.modify({
                        userId: 'me',
                        id: thread.id,
                        requestBody: {
                            removeLabelIds: ['UNREAD'],
                        },
                    });

                    // Send the reply
                    const result = await gmail.users.messages.send({
                        userId: 'me',
                        threadId: thread.id,
                        requestBody: {
                            raw: message,
                            labelIds: ['SENT'],
                        },
                    });

                    const sentMessageId = result.data.id; // Retrieve the ID of the sent message

                    // Immediately apply the desired labels using users.messages.modify
                    await gmail.users.messages.modify({
                        userId: 'me',
                        id: sentMessageId,
                        requestBody: {
                            addLabelIds: [labelId, 'CATEGORY_PERSONAL']
                        }
                    });
                }
            }
        }
        } catch (error) {
            console.error('Error processing threads:', error.message);
        }
    };


    const gmailCompose = (mailSubject, emailRecipient, mailBody) => {
        // Build email content with proper headers and encoding
        const emailContent = `MIME-Version: 1.0\r\n` +
            `Content-Type: text/html; charset="UTF-8"\r\n` +
            `From: itbase.tv@gmail.com\r\n` +
            `To: ${emailRecipient}\r\n` +
            `Subject: ${mailSubject}\r\n\r\n` +
            `${mailBody}`;

        // Base64 encode the email content
        const base64EncodedEmailString = Buffer.from(emailContent).toString('base64');

        // Return the raw email data for use with the Gmail API
        return base64EncodedEmailString;
    }


    const getOrCreateLabelId = async (labelName) => {
        try {
            // Authentication and Gmail API setup
            const gmail = google.gmail({ version: 'v1', auth: getClient() }); // separate function for authentication

            // Fetch existing labels
            const response = await gmail.users.labels.list({ userId: 'me' });
            const labels = response.data.labels;

            // Check if the label already exists
            const existingLabel = labels.find((label) => label.name === labelName);


            if (existingLabel) {
                return existingLabel.id; // Returns the ID of the existing label
            } else {
                // Create the label if it doesn't exist
                const createResponse = await gmail.users.labels.create({
                    userId: 'me',
                    requestBody: {
                        name: labelName,
                    },
                });
                const createdLabel = createResponse.data;
                return createdLabel.id; // Return the ID of the newly created label
            }


        } catch (error) {
            console.error('Error fetching or creating label:', error);
            throw error;
        }
    }



    //export the controller to schedule
    module.exports = {
        getUnreadEmails,
        getOrCreateLabelId
    }
