import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { MailService } from './mail.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.users.verifyPassword(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.users.touchLogin(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async me(userId: string) {
    const u = await this.users.findById(userId);
    return { id: u.id, email: u.email, name: u.name, role: u.role };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.users.findByEmail(dto.email);
    // Always return success to avoid email enumeration
    if (!user || !user.active) return { message: 'If that email exists, an OTP has been sent.' };

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiry = new Date(Date.now() + OTP_TTL_MS);

    await this.users.saveOtp(user.id, hashedOtp, expiry);
    await this.mail.sendOtp(user.email, otp);

    return { message: 'If that email exists, an OTP has been sent.' };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (user.resetOtpExpiry < new Date()) {
      await this.users.clearOtp(user.id);
      throw new BadRequestException('OTP has expired');
    }
    const match = await bcrypt.compare(dto.otp, user.resetOtp);
    if (!match) throw new BadRequestException('Invalid OTP');

    const resetToken = await this.jwt.signAsync(
      { sub: user.id, purpose: 'reset' },
      {
        secret: this.config.get<string>('JWT_SECRET') || 'dev-only-secret',
        expiresIn: '15m',
      },
    );
    await this.users.clearOtp(user.id);
    return { resetToken };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: { sub: string; purpose: string };
    try {
      payload = await this.jwt.verifyAsync(dto.resetToken, {
        secret: this.config.get<string>('JWT_SECRET') || 'dev-only-secret',
      });
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (payload.purpose !== 'reset') {
      throw new BadRequestException('Invalid reset token');
    }
    await this.users.updatePassword(payload.sub, dto.newPassword);
    return { message: 'Password updated successfully' };
  }
}
