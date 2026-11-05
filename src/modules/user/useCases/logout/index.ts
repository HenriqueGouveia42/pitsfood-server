import { LogoutController } from "./LogoutController.js";
import type { IController } from "../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express";
import { expressRouteAdapter } from "../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const isCrossDomain = process.env.NODE_ENV === 'production' || process.env.USING_TUNNEL === 'true';

const ILogoutController: IController = new LogoutController(isCrossDomain);

const logoutController: RequestHandler = expressRouteAdapter(ILogoutController)

export { logoutController }