import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
    refreshToken: process.env.OAUTH_REFRESH_TOKEN,
  },
});

interface EmailData {
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail({ subject, text, html }: EmailData) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.NOTIFICATION_EMAIL || process.env.EMAIL_USER,
    subject,
    text,
    html,
  };

  try {
    return await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Failed to send email. ', err);
    throw err;
  }
}
