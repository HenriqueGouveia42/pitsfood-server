
export interface IStagedUserSendEmail{
    sendVerificationCodeToEmail(email: string, verificationCode: string): Promise<void>
}