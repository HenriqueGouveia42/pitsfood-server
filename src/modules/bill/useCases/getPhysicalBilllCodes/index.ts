import { GetPhysicalBIllCodesController } from "./GetPhysicalBIllCodesController.js";
import { GetPhysicalBIllCodesUseCase } from "./GetPhysicalBIllCodesUseCase.js";
import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";
import { RedisCacheProvider } from "../../../../shared/infra/providers/implementations/cacheProvider/RedisCacheProvider.js";

const billRepository: PrismaBillRepository = new PrismaBillRepository();
const redisProvider: RedisCacheProvider = new RedisCacheProvider();

const getPhysicalBIllCodesUseCase: GetPhysicalBIllCodesUseCase = new GetPhysicalBIllCodesUseCase(billRepository, redisProvider);
const getPhysicalBIllCodesController: GetPhysicalBIllCodesController = new GetPhysicalBIllCodesController(getPhysicalBIllCodesUseCase);

export { getPhysicalBIllCodesController }