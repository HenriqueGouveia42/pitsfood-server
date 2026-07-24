import { GetPendingDevicesUseCase } from "./GetPendingDevicesUseCase.js";

import { RedisCacheProvider } from "../../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";
import { GetPendingDevicesController } from "./GetPendingDevicesController.js";

const cacheProvider: RedisCacheProvider = new RedisCacheProvider();

const getPendingDevicesUseCase: GetPendingDevicesUseCase = new GetPendingDevicesUseCase(
    cacheProvider
);

const getPendingDevicesController: GetPendingDevicesController = new GetPendingDevicesController(
    getPendingDevicesUseCase
);

export { getPendingDevicesController }