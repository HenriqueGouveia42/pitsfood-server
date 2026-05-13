import dns from 'node:dns/promises';
import type { IEmailValidationProvider } from '../interface/IEmailValidationProvider.js';

export class DnsEmailValidationProvider implements IEmailValidationProvider {
    async hasValidDomain(email: string): Promise<boolean> {
        // 1. Limpa espaços e garante que a string não tem sujeira invisível
        console.log(email)
        const cleanEmail = email.trim(); 
        const domain = cleanEmail.split('@')[1];
        
        if (!domain) {
            return false;
        }

        try {
            const mxRecords = await dns.resolveMx(domain);
            return mxRecords && mxRecords.length > 0;
        } catch (error) {
            // 2. Loga o erro para você entender o motivo exato da falha
            console.error(`Falha ao resolver DNS para o domínio "${domain}":`, error);
            return false;
        }
    }
}