import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';

import { User, UserDocument } from './schemas/user.schema';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  async findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(input: {
    email: string;
    password: string;
    name: string;
    role?: Role;
  }) {
    const passwordHash = await bcrypt.hash(input.password, 10);
    return this.userModel.create({
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: input.role || Role.USER,
    });
  }

  async verifyPassword(plain: string, hash: string) {
    return bcrypt.compare(plain, hash);
  }

  async touchLogin(id: string) {
    await this.userModel.updateOne({ _id: id }, { lastLoginAt: new Date() });
  }

  async saveOtp(id: string, hashedOtp: string, expiry: Date) {
    await this.userModel.updateOne(
      { _id: id },
      { resetOtp: hashedOtp, resetOtpExpiry: expiry },
    );
  }

  async clearOtp(id: string) {
    await this.userModel.updateOne(
      { _id: id },
      { $unset: { resetOtp: '', resetOtpExpiry: '' } },
    );
  }

  async updatePassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userModel.updateOne({ _id: id }, { passwordHash });
  }

  async updateProfile(
    id: string,
    data: { name?: string; email?: string },
  ) {
    const update: Partial<{ name: string; email: string }> = {};
    if (data.name) update.name = data.name.trim();
    if (data.email) update.email = data.email.toLowerCase().trim();
    const user = await this.userModel.findByIdAndUpdate(id, update, { new: true });
    if (!user) throw new NotFoundException('User not found');
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  /**
   * On first boot, if no admin exists, create one using ADMIN_* env vars.
   * Safe to call on every restart — idempotent.
   */
  async ensureInitialAdmin(): Promise<void> {
    const adminCount = await this.userModel.countDocuments({ role: Role.ADMIN });
    if (adminCount > 0) return;

    const email = this.config.get<string>('ADMIN_EMAIL');
    const password = this.config.get<string>('ADMIN_PASSWORD');
    const name = this.config.get<string>('ADMIN_NAME') || 'Admin';

    if (!email || !password) {
      this.logger.warn(
        'No admin exists and ADMIN_EMAIL/ADMIN_PASSWORD are not set — skip auto-create.',
      );
      return;
    }

    await this.create({ email, password, name, role: Role.ADMIN });
    this.logger.log(`✅  Initial admin created: ${email}`);
  }
}
