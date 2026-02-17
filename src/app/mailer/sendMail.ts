import { MailOptions } from 'nodemailer/lib/json-transport';
import config from '../config';
import { transporter } from './mailer.config';

export const sendMail = async (
  to: string,
  from: string,
  html: string,
): Promise<void> => {
  const mailOptions = {
    from: config.smtp_user,
    to,
    html,
  };

  try {
    await sendMailWithRetryLogic(mailOptions);
  } catch (error) {
    console.error('Error sending email: ', error);
  }
};

const sendMailWithRetryLogic = async (
  mailOptions: MailOptions,
  retries: number = 3,
  delay: number = 1000,
) => {
  let attempts = 0;

  while (attempts < retries) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email has sent: ${info.messageId}`);
      return;
    } catch (error) {
      attempts++;
      if (attempts >= retries) {
        throw new Error(`Failed to send email after ${retries} attempts`);
      }
      console.error(
        `Attempt ${attempts} failed. Retrying in ${delay}ms...`,
        error,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};
