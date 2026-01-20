import { FindAllOpenBillsUseCase } from "./FindAllOpenBillsUseCase.js";
import { FindAllOpenBillsController } from "./FindAllOpenBillsController.js";
import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";

const prismaBillRepository: PrismaBillRepository = new PrismaBillRepository();
const findAllOpenBillsUseCase: FindAllOpenBillsUseCase = new FindAllOpenBillsUseCase(prismaBillRepository);
const findAllOpenBillsController: FindAllOpenBillsController = new FindAllOpenBillsController(findAllOpenBillsUseCase)

export { findAllOpenBillsController }