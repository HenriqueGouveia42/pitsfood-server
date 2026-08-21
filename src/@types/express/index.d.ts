import { UserRole } from "../../modules/user/entities/user.js";

/*
  Extensão do namespace global do Express
  Permite adicionar tipos aos dados injetados no objeto de requisição (req) pelos
  middlewares de autenticação, permitindo que os controllers acessem esses dados

  Extension of the global Express namespace
  Allows to add type to the injected data into the request object (req) by
  the authentications middlewares, what allows the controllers to access these data
*/
declare global {
  namespace Express {
    export interface Request {
      user?: {
        id: string;
        role: UserRole;
        store_id: string | null | undefined;
        must_change_password: boolean;
        is_paying_user: boolean,
        token_version: number,
        authorized_devices_ids?: string[]
      };
      preAuthUserId?: string
    }
  }
}