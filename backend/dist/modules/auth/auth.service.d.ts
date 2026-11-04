import { GoogleAuthInput } from './auth.dto';
interface ClientInfo {
    ip?: string;
    userAgent?: string;
}
export declare class AuthService {
    private readonly OTP_TTL_SECONDS;
    private readonly LOCKOUT_TTL_SECONDS;
    private readonly MAX_OTP_ATTEMPTS;
    /**
     * UC01: Gửi mã OTP xác thực email
     */
    sendEmailOtp(email: string): Promise<{
        message: string;
        expiresIn: number;
        devOtp?: string;
    }>;
    /**
     * UC01: Xác thực mã OTP và đăng nhập / đăng ký
     */
    verifyEmailOtp(email: string, otp: string, clientInfo: ClientInfo): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
    /**
     * UC01: Tích hợp Đăng nhập bằng Google OAuth2
     */
    loginWithGoogle(dto: GoogleAuthInput, clientInfo: ClientInfo): Promise<{
        user: any;
        accessToken: string;
        refreshToken: string;
        isNewUser: boolean;
    }>;
    /**
     * Cơ chế Refresh Token Rotation (RTR) với Thu hồi toàn bộ session family khi phát hiện token cũ bị dùng lại (Token Reuse Detection)
     */
    rotateRefreshToken(oldRefreshToken: string, clientInfo: ClientInfo): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * Đăng xuất phiên hiện tại
     */
    logout(userId: number, sessionId?: number, refreshToken?: string): Promise<void>;
    /**
     * Danh sách phiên đăng nhập theo thiết bị của người dùng
     */
    listUserSessions(userId: number, currentSessionId?: number): Promise<any[]>;
    /**
     * Thu hồi phiên đăng nhập theo thiết bị / sessionId cụ thể
     */
    revokeSession(userId: number, targetSessionId: number): Promise<void>;
    /**
     * Thu hồi tất cả các phiên khác ngoại trừ phiên hiện tại
     */
    revokeOtherSessions(userId: number, currentSessionId: number): Promise<{
        revokedCount: number;
    }>;
    /**
     * Helper phát hành phiên mới và token
     */
    private createSession;
}
export declare const authService: AuthService;
export {};
