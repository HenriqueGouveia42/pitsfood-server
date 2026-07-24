export interface IEmailValidationProvider {
    hasValidDomain(email: string): Promise<boolean>;
}