import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '0', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
export const SMTP_FROM = process.env.SMTP_FROM || '';
export const CONTACT_TO = process.env.CONTACT_TO || '';
const SMTP_SECURE = (process.env.SMTP_SECURE || '').toLowerCase() === 'true';

const canSendEmail = Boolean(SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && SMTP_FROM);
export const mailer = canSendEmail
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE || SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    })
  : null;

export const sendMail = async ({ to, subject, html, replyTo, attachments }) => {
  if (!mailer) {
    console.log('Mailer is not configured. Logging email details:');
    console.log({ to, subject, replyTo, attachmentsCount: attachments?.length || 0 });
    return { success: true, emailSent: false, loggedToConsole: true };
  }

  const mailOptions = {
    from: SMTP_FROM,
    to,
    subject,
    html
  };

  if (replyTo) mailOptions.replyTo = replyTo;
  if (attachments) mailOptions.attachments = attachments;

  const info = await mailer.sendMail(mailOptions);
  return { success: true, emailSent: true, messageId: info.messageId };
};
