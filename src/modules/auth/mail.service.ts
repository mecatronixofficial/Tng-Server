import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly contactTo: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
    this.from = this.config.get<string>('MAIL_FROM') || 'noreply@thangaveltextile.in';
    this.contactTo =
      this.config.get<string>('CONTACT_EMAIL') ||
      this.config.get<string>('ADMIN_EMAIL') ||
      'info@thangaveltextile.in';
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

  async sendOrderEnquiry(input: {
    customerName: string;
    phone: string;
    email?: string;
    productName?: string;
    productSlug?: string;
    color?: string;
    size?: string;
    quantity?: number;
    message: string;
    source?: string;
  }): Promise<void> {
    const safe = (value?: string | number) =>
      String(value ?? '-')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const rows = [
      ['Name', input.customerName],
      ['Phone', input.phone],
      ['Email', input.email],
      ['Product', input.productName],
      ['Product Slug', input.productSlug],
      ['Color', input.color],
      ['Size', input.size],
      ['Quantity', input.quantity || 1],
      ['Source', input.source || 'contact_form'],
    ];

    const { error } = await this.resend.emails.send({
      from: this.from,
      to: this.contactTo,
      replyTo: input.email || undefined,
      subject: `New enquiry from ${input.customerName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#171717">
          <h2 style="margin:0 0 16px;color:#7f1d1d">New website enquiry</h2>
          <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="width:140px;padding:10px;border:1px solid #fee2e2;background:#fff1f2;font-weight:700">${safe(label)}</td>
                    <td style="padding:10px;border:1px solid #fee2e2">${safe(value)}</td>
                  </tr>
                `,
              )
              .join('')}
          </table>
          <div style="padding:14px;border:1px solid #fee2e2;background:#fffafa">
            <div style="font-weight:700;margin-bottom:8px">Requirement</div>
            <div style="white-space:pre-line;line-height:1.6">${safe(input.message)}</div>
          </div>
        </div>
      `,
    });

    if (error) {
      this.logger.error(`Failed to send enquiry email: ${JSON.stringify(error)}`);
      throw new Error('Failed to send enquiry email');
    }
  }
}
