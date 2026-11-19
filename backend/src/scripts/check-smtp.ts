/**
 * Kiểm tra cấu hình gửi email OTP (Gmail SMTP).
 *
 *   npm run check:smtp                      -> chỉ kiểm tra kết nối + đăng nhập
 *   npm run check:smtp -- ban@gmail.com     -> gửi thêm 1 email OTP thử tới địa chỉ này
 */
import { mailerService } from '../shared/mail/mailer.service';

async function main() {
  const testRecipient = process.argv[2];
  const config = mailerService.getSmtpConfig();

  console.log('🔍 Kiểm tra cấu hình SMTP gửi OTP');
  console.log(`   Host     : ${config.host}`);
  console.log(`   Port     : ${config.port} (tự thử ${config.port === 465 ? 587 : 465} nếu bị chặn)`);
  console.log(`   Tài khoản: ${config.user}`);
  console.log(`   Mật khẩu : ${config.pass ? `đã cấu hình (${config.pass.length} ký tự)` : 'CHƯA CẤU HÌNH'}\n`);

  const check = await mailerService.verifyConnection();
  if (!check.ok) {
    console.error(`❌ Đăng nhập SMTP thất bại [${check.errorCode}]`);
    console.error(`   ${check.errorReason}`);
    process.exit(1);
  }
  console.log(`✅ Kết nối & đăng nhập Gmail SMTP thành công qua cổng ${check.port}.`);

  if (testRecipient) {
    const result = await mailerService.sendOtpEmail(testRecipient, '123456', 300);
    if (!result.sentViaSmtp) {
      console.error(`❌ Gửi email thử thất bại [${result.errorCode}]: ${result.errorReason}`);
      process.exit(1);
    }
    console.log(`✅ Đã gửi email thử tới ${testRecipient}. Nếu không thấy trong Hộp thư đến, hãy kiểm tra thư mục Spam.`);
  }
}

main().catch((err) => {
  console.error('❌ Lỗi không mong muốn:', err);
  process.exit(1);
});

