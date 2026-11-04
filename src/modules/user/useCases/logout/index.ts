import { LogoutController } from "./LogoutController.js";

const isCrossDomain = process.env.NODE_ENV === 'production' || process.env.USING_TUNNEL === 'true';

const logoutController: LogoutController = new LogoutController(isCrossDomain);

export { logoutController }