import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('MAIL_FROM') || 'noreply@thangaveltextile.in';
  }

  async sendOtp(to: string, otp: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Your password reset OTP',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2>Password Reset OTP</h2>
          <p>Use the code below to reset your password. It expires in <strong>10 minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;padding:20px 0">${otp}</div>
          <p style="color:#888;font-size:13px">If you did not request a password reset, ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send OTP email to ${to}: ${JSON.stringify(error)}`);
      throw new Error('Failed to send OTP email');
    }
  }
}
