import { Router } from "express";
import type { RequestHandler } from "express";
import { TenantGates } from "./TenantSecurityGates.js"
import type { SecurityLevel } from "./TenantSecurityGates.js"
import { authorizeRoles } from "./middlewares/authorizeRolesMiddleware.js";
import { validateSchema } from "./middlewares/validateSchemaMiddleware.js";
import { UserRole } from "../../../modules/user/entities/user.js";
import type { ZodType } from "zod";

// Contrato estrito do que uma rota precisa ter
interface RouteConfig {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete'; // Obrigatoróio: O TS vai reclamar se não passar isso
    path: string; // Obrigatoróio: O TS vai reclamar se não passar isso
    security: SecurityLevel; // Obrigatoróio: O TS vai reclamar se não passar isso
    roles: UserRole[] | 'PUBLIC'; // Opcionaldo: Força a pensar em quem pode acessar
    schema?: ZodType<any, any, any>; // Opcional: Validação de corpo/query
    middlewares?: RequestHandler[]; // Opcional: Middlewares extras (ex: multer)
    handler: RequestHandler; // Controller
}

export class SecureRouteBuilder {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public build(config: RouteConfig): void {
        const securityMiddlewares = TenantGates[config.security];
        const roleMiddleware = config.roles === 'PUBLIC' ? [] : [authorizeRoles(config.roles)];
        const schemaMiddleware = config.schema ? [validateSchema(config.schema)] : [];
        const extraMiddlewares = config.middlewares || [];

        // Monta a rota no Express na ordem exata (Segurança -> Roles -> Schema -> Extras -> Controller)
        this.router[config.method](
            config.path,
            ...securityMiddlewares,
            ...roleMiddleware,
            ...schemaMiddleware,
            ...extraMiddlewares,
            config.handler
        );
    }

    public getRouter(): Router {
        return this.router;
    }
}