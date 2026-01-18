require('dotenv').config();
const mongoose = require('mongoose');
const SentEmail = require('./models/SentEmail');

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/erp-evaluation');
        const failedEmails = await SentEmail.find({ status: 'failed' }).sort({ sentAt: -1 }).limit(5);
        console.log('--- Last 5 Failed Emails ---');
        failedEmails.forEach(email => {
            console.log(`To: ${email.recipientId} | Subject: ${email.subject} | Error: ${email.error}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debug();
