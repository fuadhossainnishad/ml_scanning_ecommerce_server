import nodemailer from 'nodemailer';
import config from '../config';

export const transporter = nodemailer.createTransport({
  host: config.smtp_host,
  port: Number(config.smtp_port),
  secure: false,
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
  // tls: {
  //   ciphers: 'SSLv3',
  // },
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer connection error:', error);
  } else {
    console.log('Nodemailer is ready to send emails 🚀');
  }
});
