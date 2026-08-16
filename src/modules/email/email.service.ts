import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendClient: Resend | null;
  private readonly fromAddress: string;

  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('email.resendApiKey');

    this.resendClient = apiKey ? new Resend(apiKey) : null;
    this.fromAddress = this.configService.get<string>(
      'email.fromAddress',
      'Zemlo <no-reply@zemlo.shop>',
    );
  }

  async sendPasswordResetEmail(params: {
    to: string;
    resetUrl: string;
    expiresInMinutes: number;
  }): Promise<void> {
    if (!this.resendClient) {
      this.logger.warn(
        `RESEND_API_KEY is not configured — skipping password reset email to ${params.to}. Reset URL: ${params.resetUrl}`,
      );
      return;
    }

    const expiryText =
      params.expiresInMinutes % 60 === 0
        ? `${params.expiresInMinutes / 60} hour${params.expiresInMinutes === 60 ? '' : 's'}`
        : `${params.expiresInMinutes} minutes`;

    try {
      await this.resendClient.emails.send({
        from: this.fromAddress,
        to: params.to,
        subject: 'Reset your Zemlo password',
        html: `
          <p>We received a request to reset your Zemlo password.</p>
          <p><a href="${params.resetUrl}">Click here to reset your password</a></p>
          <p>This link expires in ${expiryText}. If you didn't request this, you can safely ignore this email.</p>
        `,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${params.to}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
