import { GetPendingDevicesUseCase } from "./GetPendingDevicesUseCase.js";
import { RedisCacheProvider } from "../../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { GetPendingDevicesController } from "./GetPendingDevicesController.js";
import type { IController } from "../../../../../shared/infra/http/protocols.js";
import type { RequestHandler } from "express";
import { expressRouteAdapter } from "../../../../../shared/infra/http/adapters/expressRouteAdapter.js";

const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const getPendingDevicesUseCase: GetPendingDevicesUseCase = new GetPendingDevicesUseCase(
    cacheProvider
);

const IGetPendingDevicesController: IController = new GetPendingDevicesController(
    getPendingDevicesUseCase
);

const getPendingDevicesController: RequestHandler = expressRouteAdapter(IGetPendingDevicesController)

export { getPendingDevicesController }