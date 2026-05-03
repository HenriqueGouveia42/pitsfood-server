import dns from 'node:dns/promises';
import type { IEmailValidationProvider } from '../interface/IEmailValidationProvider.js';

export class DnsEmailValidationProvider implements IEmailValidationProvider {
    async hasValidDomain(email: string): Promise<boolean> {
        const domain = email.split('@')[1];
        
        if (!domain) {
            return false;
        }

        try {
            const mxRecords = await dns.resolveMx(domain);
            return mxRecords && mxRecords.length > 0;
        } catch (error) {
            return false;
        }
    }
}