const nodemailer = require("nodemailer");
require("dotenv").config({ path: "./.env" });

async function verifyEmail() {
    console.log("Checking Email Configuration...");
    console.log(`SMTP_HOST: ${process.env.SMTP_HOST}`);
    console.log(`SMTP_PORT: ${process.env.SMTP_PORT}`);
    console.log(`SMTP_EMAIL: ${process.env.SMTP_EMAIL}`);
    // Do not log password

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
        console.error("❌ Missing SMTP_EMAIL or SMTP_PASSWORD in .env");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // Assuming gmail based on previous context
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log("Attempting to verify transporter connection...");
        await transporter.verify();
        console.log("✅ Transporter verification successful!");

        console.log("Attempting to send test email...");
        await transporter.sendMail({
            from: process.env.SMTP_EMAIL,
            to: process.env.SMTP_EMAIL, // Send to self
            subject: "Test Email from ERP Debugger",
            text: "If you receive this, email sending is working."
        });
        console.log("✅ Test email sent successfully!");
    } catch (error) {
        console.error("❌ Email Sending Failed:");
        console.error(error.message);
        if (error.code === 'EAUTH') {
            console.error("👉 CAUSE: Authentication failed. Please check your SMTP_EMAIL and SMTP_PASSWORD.");
            console.error("   Note: For Gmail, you often need an 'App Password', not your login password.");
        }
    }
}

verifyEmail();
