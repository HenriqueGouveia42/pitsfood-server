import { UserRole } from "../../modules/user/entities/user.js";

//quando adicionamos 'import' ou 'export' no topo de um arquivo de deefinicao
//de tipos '.d.ts', ele deixa de ser um arquivo GLOBAL e vira um MODULO

//Isso quebra tudo. Significa que para podermos usar 'imports' aqui, precisamos dizer explicitamente ao 
//TS que queremos alterar o escopo global
declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        role: UserRole;
        store_id: string;
        must_change_password: boolean;
        is_paying_user: true,
        token_version: number
      };
      preAuthUserId?: string
    }
  }
}