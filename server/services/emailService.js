const nodemailer = require('nodemailer');

/**
 * Send an email notification.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject line
 * @param {string} html - HTML email body content
 * @param {string} [attachmentPath] - Path to file to attach
 * @returns {Promise<boolean>} - True if sent, false otherwise
 */
const sendEmail = async (to, subject, html, attachmentPath = null) => {
  try {
    let transporter;

    // Check if real credentials are mock or configured
    if (
      process.env.SMTP_USER === 'ethereal_username' ||
      !process.env.SMTP_USER
    ) {
      // Create a test account automatically via Ethereal if possible
      // Or just create a dummy transporter that prints to console
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'm2d47zszskk7uofv@ethereal.email', // pre-created default testing user
          pass: 'tXhX7XgT8hph4w2N9G'
        }
      });
    } else {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@smartpay.io',
      to,
      subject,
      html
    };

    if (attachmentPath) {
      const fileName = attachmentPath.split(/[/\\]/).pop();
      mailOptions.attachments = [
        {
          filename: fileName,
          path: attachmentPath
        }
      ];
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    
    // If it's ethereal email, print URL to view email online
    const testUrl = nodemailer.getTestMessageUrl(info);
    if (testUrl) {
      console.log(`Preview URL: ${testUrl}`);
    }
    
    return true;
  } catch (error) {
    console.error(`Email dispatch error: ${error.message}`);
    return false;
  }
};

module.exports = { sendEmail };
