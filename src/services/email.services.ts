import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  transporter: Transporter;
  constructor(private readonly ConfigService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.ConfigService.getOrThrow<string>('USER_EMAIL'),
        pass: this.ConfigService.getOrThrow<string>('APP_PASSWORD'),
      },
    });
  }
  async sendEmail({
    to,
    subject,
    text,
  }:{
    to: string,
    subject: string,
    text: string
  }){
    return this.transporter.sendMail({to, subject, text: String(text)})
  }
}
