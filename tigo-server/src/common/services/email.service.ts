import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: +this.configService.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendActivationEmail(email: string, token: string, name: string) {
    const activationUrl = `${this.configService.get('BACKEND_URL')}/auth/activate?token=${token}`;

    const mailOptions = {
      from: this.configService.get('SMTP_USER'),
      to: email,
      subject: 'Activate Your Tigo-Booking Account',
      html: `
        <h1>Welcome to Tigo-Booking, ${name}!</h1>
        <p>Please click the link below to activate your account:</p>
        <a href="${activationUrl}">Activate Account</a>
        <p>This link will expire in 24 hours.</p>
      `,
    };

    await this.transporter.sendMail(mailOptions);
  }
} 