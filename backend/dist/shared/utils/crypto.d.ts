export interface TokenPayload {
    userId: number;
    email: string;
    role: string;
    sessionId?: number;
    familyId?: string;
}
export declare function generateOtp(): string;
export declare function hashString(value: string): string;
export declare function signAccessToken(payload: TokenPayload): string;
export declare function signRefreshToken(payload: TokenPayload): string;
export declare function verifyAccessToken(token: string): TokenPayload;
export declare function verifyRefreshToken(token: string): TokenPayload;
