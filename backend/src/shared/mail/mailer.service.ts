import net from 'net';
import tls from 'tls';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';
import { env, cleanEnvValue } from '../../config/env';

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

export interface MailSendResult {
  sentViaSmtp: boolean;
  senderEmail: string;
  messageId: string;
  /** Mã lỗi ngắn gọn (vd: SMTP_AUTH_FAILED, SMTP_NETWORK_BLOCKED) khi gửi thất bại */
  errorCode?: string;
  /** Giải thích nguyên nhân bằng tiếng Việt và cách khắc phục */
  errorReason?: string;
}

export interface SmtpCheckResult {
  ok: boolean;
  host: string;
  port?: number;
  user: string;
  errorCode?: string;
  errorReason?: string;
}

interface MailContent {
  from: string;
  to: string;
  subject: string;
  messageId: string;
  base64Html: string;
}

class SmtpError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly smtpCode?: number
  ) {
    super(message);
  }
}

/** Các lỗi mạng: thử lại bằng cổng còn lại (465 <-> 587) */
const NETWORK_ERROR_CODES = new Set([
  'SMTP_TIMEOUT',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'EHOSTUNREACH',
  'ENETUNREACH',
  'EPIPE',
]);

/** Lỗi chứng chỉ TLS: thường do phần mềm diệt virus chặn và quét email */
const TLS_CERT_ERROR_CODES = new Set([
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);

const SMTP_TIMEOUT_MS = 12000;

export class MailerService {
  private readonly SYSTEM_SENDER_NAME = 'ChinaEasy';
  private readonly SYSTEM_SENDER_EMAIL = 'hieuhoanghuu436@gmail.com';

  /**
   * Đọc cấu hình SMTP mới nhất. Bỏ qua giá trị rỗng / giá trị mẫu của .env.example
   * để không ghi đè cấu hình hợp lệ.
   */
  getSmtpConfig(): SmtpConfig {
    // Đọc lại .env mới nhất phòng trường hợp file .env vừa được cập nhật mà chưa restart server
    dotenv.config({ override: true });

    const user = cleanEnvValue(process.env.SMTP_USER) || env.SMTP_USER || this.SYSTEM_SENDER_EMAIL;
    const pass = (cleanEnvValue(process.env.SMTP_PASS) || env.SMTP_PASS || '').replace(/\s+/g, '');
    const host = cleanEnvValue(process.env.SMTP_HOST) || env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(cleanEnvValue(process.env.SMTP_PORT) || String(env.SMTP_PORT || 465), 10);

    return { host, port, user, pass };
  }

  /**
   * Gửi email xác thực OTP từ tài khoản hệ thống vào hòm thư Gmail thật của người dùng.
   * Tự động thử cổng 465 (SSL) rồi 587 (STARTTLS) nếu mạng chặn một trong hai cổng.
   */
  async sendOtpEmail(toEmail: string, otp: string, ttlSeconds: number = 300): Promise<MailSendResult> {
    const config = this.getSmtpConfig();

    const minutes = Math.floor(ttlSeconds / 60);
    const messageId = `<otp-${randomUUID()}@gmail.com>`;
    const subjectText = `[ChinaEasy] Mã xác thực OTP của bạn là ${otp}`;
    const encodedSubject = `=?UTF-8?B?${Buffer.from(subjectText, 'utf-8').toString('base64')}?=`;

    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:20px;background-color:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:28px;border:1px solid #e5e7eb;border-radius:16px;background-color:#ffffff;">
    <h2 style="color:#dc2626;margin:0 0 12px 0;font-size:20px;">🀄 ChinaEasy - Xác Thực Tài Khoản</h2>
    <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 16px 0;">
      Xin chào <strong>${toEmail}</strong>,<br/>
      Mã xác thực OTP (6 chữ số) để kích hoạt / đăng nhập tài khoản học tiếng Trung <strong>ChinaEasy</strong> của bạn là:
    </p>
    <div style="text-align:center;margin:20px 0;padding:18px;background-color:#fef2f2;border-radius:12px;border:1px dashed #f87171;">
      <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#b91c1c;">${otp}</span>
    </div>
    <p style="color:#4b5563;font-size:13px;line-height:1.6;margin:0;">
      • Mã xác thực này có hiệu lực trong vòng <strong>${minutes} phút (${ttlSeconds} giây)</strong>.<br/>
      • Tuyệt đối không chia sẻ mã này cho bất kỳ ai. Nhập sai quá 5 lần sẽ tạm khóa tài khoản 15 phút.
    </p>
  </div>
</body>
</html>`;

    const base64Html =
      Buffer.from(htmlBody, 'utf-8')
        .toString('base64')
        .match(/.{1,76}/g)
        ?.join('\r\n') || '';

    const mail: MailContent = {
      from: `${this.SYSTEM_SENDER_NAME} <${config.user}>`,
      to: toEmail,
      subject: encodedSubject,
      messageId,
      base64Html,
    };

    const outcome = await this.runWithPortFallback(config, mail);

    if (outcome.ok) {
      console.log(
        `✅ [GMAIL SMTP DELIVERED] Đã gửi email OTP từ ${config.user} (cổng ${outcome.port}) tới hộp thư thật: ${toEmail}`
      );
      return { sentViaSmtp: true, senderEmail: config.user, messageId };
    }

    console.error(`❌ [GMAIL SMTP ERROR] Không thể gửi tới ${toEmail}: ${outcome.rawMessage}`);
    console.error(`   👉 Nguyên nhân: ${outcome.errorReason}`);
    return {
      sentViaSmtp: false,
      senderEmail: config.user,
      messageId,
      errorCode: outcome.errorCode,
      errorReason: outcome.errorReason,
    };
  }

  /**
   * Kiểm tra kết nối + đăng nhập SMTP (không gửi thư). Dùng cho lệnh `npm run check:smtp`.
   */
  async verifyConnection(): Promise<SmtpCheckResult> {
    const config = this.getSmtpConfig();
    const outcome = await this.runWithPortFallback(config);
    return {
      ok: outcome.ok,
      host: config.host,
      port: outcome.port,
      user: config.user,
      errorCode: outcome.errorCode,
      errorReason: outcome.errorReason,
    };
  }

  async getLatestEmailForAddress(_email: string): Promise<any> {
    return null;
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private async runWithPortFallback(
    config: SmtpConfig,
    mail?: MailContent
  ): Promise<{ ok: boolean; port?: number; errorCode?: string; errorReason?: string; rawMessage?: string }> {
    const alternatePort = config.port === 465 ? 587 : 465;
    const ports = config.host === 'smtp.gmail.com' ? [config.port, alternatePort] : [config.port];

    if (!config.pass) {
      return {
        ok: false,
        errorCode: 'SMTP_NOT_CONFIGURED',
        errorReason:
          'Chưa cấu hình SMTP_PASS (App Password Gmail 16 ký tự) trong backend/.env. Xem hướng dẫn trong README.',
        rawMessage: 'SMTP_PASS is empty',
      };
    }

    let lastError: any;
    for (const port of ports) {
      try {
        await this.runSmtpSession({ ...config, port }, port === 465, mail);
        return { ok: true, port };
      } catch (err: any) {
        lastError = err;
        const isNetworkError = NETWORK_ERROR_CODES.has(err?.code);
        if (isNetworkError && port !== ports[ports.length - 1]) {
          console.warn(`⚠️  [SMTP] Cổng ${port} không kết nối được (${err.code}), thử lại bằng cổng ${alternatePort}...`);
          continue;
        }
        break;
      }
    }

    const { code, reason } = this.describeSmtpError(lastError);
    return { ok: false, errorCode: code, errorReason: reason, rawMessage: lastError?.message };
  }

  private describeSmtpError(err: any): { code: string; reason: string } {
    const smtpCode: number | undefined = err?.smtpCode;
    const errCode: string | undefined = err?.code;

    if (smtpCode === 535) {
      return {
        code: 'SMTP_AUTH_FAILED',
        reason:
          'Gmail từ chối đăng nhập (SMTP 535). SMTP_USER/SMTP_PASS sai, SMTP_PASS phải là App Password 16 ký tự (không phải mật khẩu Gmail), hoặc App Password đã bị thu hồi.',
      };
    }
    if (smtpCode === 534) {
      return {
        code: 'SMTP_LOGIN_BLOCKED',
        reason:
          'Google chặn đăng nhập từ thiết bị/mạng lạ (SMTP 534). Chủ tài khoản gửi cần mở Gmail trên trình duyệt để xác nhận hoạt động đăng nhập, hoặc dùng App Password Gmail của chính máy này.',
      };
    }
    if (smtpCode) {
      return { code: 'SMTP_REJECTED', reason: `Máy chủ Gmail từ chối gửi thư: ${err.message}` };
    }
    if (errCode === 'ENOTFOUND' || errCode === 'EAI_AGAIN') {
      return {
        code: 'SMTP_NO_INTERNET',
        reason: 'Không phân giải được địa chỉ smtp.gmail.com. Máy đang mất Internet hoặc DNS bị chặn.',
      };
    }
    if (errCode && NETWORK_ERROR_CODES.has(errCode)) {
      return {
        code: 'SMTP_NETWORK_BLOCKED',
        reason:
          'Không kết nối được tới smtp.gmail.com qua cổng 465 và 587. Mạng hiện tại (wifi trường/công ty, tường lửa) đang chặn gửi mail; hãy thử mạng khác (vd: phát 4G).',
      };
    }
    if (errCode && TLS_CERT_ERROR_CODES.has(errCode)) {
      return {
        code: 'SMTP_TLS_INTERCEPTED',
        reason:
          'Chứng chỉ TLS không hợp lệ. Thường do phần mềm diệt virus (Avast, Kaspersky, ESET...) chặn quét email; hãy tắt tính năng quét Email/SSL của phần mềm đó rồi thử lại.',
      };
    }
    return { code: 'SMTP_UNKNOWN_ERROR', reason: `Lỗi gửi mail không xác định: ${err?.message || err}` };
  }

  /**
   * Phiên SMTP tối giản: SSL trực tiếp (465) hoặc STARTTLS (587).
   * Nếu không truyền `mail` thì chỉ kiểm tra đăng nhập rồi QUIT.
   */
  private runSmtpSession(config: SmtpConfig, secure: boolean, mail?: MailContent): Promise<void> {
    return new Promise((resolve, reject) => {
      let settled = false;
      let upgraded = secure;
      let state = 'greeting';
      let buffer = '';
      let socket: net.Socket;

      const finish = (err?: Error) => {
        if (settled) return;
        settled = true;
        try {
          socket.end();
        } catch {
          /* ignore */
        }
        err ? reject(err) : resolve();
      };

      const send = (cmd: string) => socket.write(cmd + '\r\n');

      const attach = (s: net.Socket) => {
        s.setTimeout(SMTP_TIMEOUT_MS);
        s.on('data', onData);
        s.on('timeout', () => {
          s.destroy();
          finish(new SmtpError('SMTP connection timed out', 'SMTP_TIMEOUT'));
        });
        s.on('error', (err: any) => finish(new SmtpError(err.message, err.code || 'SMTP_SOCKET_ERROR')));
      };

      const onData = (chunk: Buffer) => {
        buffer += chunk.toString('utf-8');
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line || settled) continue;
          // Chờ dòng cuối cùng của phản hồi nhiều dòng (ký tự thứ 4 là dấu cách)
          if (line.length >= 4 && line[3] === '-') continue;

          const code = parseInt(line.slice(0, 3), 10);
          if (code >= 400) {
            return finish(new SmtpError(`SMTP ${code}: ${line}`, 'SMTP_REJECTED', code));
          }

          switch (state) {
            case 'greeting':
              if (code === 220) {
                state = 'ehlo';
                send('EHLO chinaeasy.vn');
              }
              break;
            case 'ehlo':
              if (code === 250) {
                if (!upgraded) {
                  state = 'starttls';
                  send('STARTTLS');
                } else {
                  state = 'auth';
                  send('AUTH LOGIN');
                }
              }
              break;
            case 'starttls':
              if (code === 220) {
                const plain = socket;
                plain.removeAllListeners('data');
                plain.removeAllListeners('timeout');
                plain.removeAllListeners('error');
                plain.setTimeout(0);
                socket = tls.connect({ socket: plain, servername: config.host }, () => {
                  upgraded = true;
                  state = 'ehlo';
                  send('EHLO chinaeasy.vn');
                });
                attach(socket);
              }
              break;
            case 'auth':
              if (code === 334) {
                state = 'auth_user';
                send(Buffer.from(config.user, 'utf-8').toString('base64'));
              }
              break;
            case 'auth_user':
              if (code === 334) {
                state = 'auth_pass';
                send(Buffer.from(config.pass, 'utf-8').toString('base64'));
              }
              break;
            case 'auth_pass':
              if (code === 235) {
                if (!mail) {
                  send('QUIT');
                  return finish();
                }
                state = 'mail_from';
                send(`MAIL FROM:<${config.user}>`);
              }
              break;
            case 'mail_from':
              if (code === 250 && mail) {
                state = 'rcpt';
                send(`RCPT TO:<${mail.to}>`);
              }
              break;
            case 'rcpt':
              if ((code === 250 || code === 251) && mail) {
                state = 'data';
                send('DATA');
              }
              break;
            case 'data':
              if (code === 354 && mail) {
                state = 'body';
                send(
                  [
                    `Date: ${new Date().toUTCString()}`,
                    `Message-ID: ${mail.messageId}`,
                    `From: ${mail.from}`,
                    `To: <${mail.to}>`,
                    `Subject: ${mail.subject}`,
                    'MIME-Version: 1.0',
                    'Content-Type: text/html; charset=UTF-8',
                    'Content-Transfer-Encoding: base64',
                    '',
                    mail.base64Html,
                    '.',
                  ].join('\r\n')
                );
              }
              break;
            case 'body':
              if (code === 250) {
                send('QUIT');
                return finish();
              }
              break;
          }
        }
      };

      socket = secure
        ? tls.connect({ host: config.host, port: config.port, servername: config.host })
        : net.connect({ host: config.host, port: config.port });
      attach(socket);
    });
  }
}

export const mailerService = new MailerService();
