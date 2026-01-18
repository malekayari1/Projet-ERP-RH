const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
    },
    tls: {
        rejectUnauthorized: false
    }
});

/**
 * Send an email using SMTP
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const info = await transporter.sendMail({
            from: `"ERP Automatique" <${process.env.SMTP_EMAIL}>`,
            to,
            subject,
            text,
            html: html || text,
        });
        console.log("✅ Email envoyé: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("❌ Erreur lors de l'envoi de l'email:", error);
        throw error;
    }
};

module.exports = sendEmail;
