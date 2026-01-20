import { BillCodeExistsController } from "./BillCodeExistsController.js"
import { BillCodeExistsUseCase } from "./BillCodeExistsUseCase.js"
import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";

const billRep: PrismaBillRepository = new PrismaBillRepository();

const billCodeExistsUseCase: BillCodeExistsUseCase = new BillCodeExistsUseCase(billRep);
const billCodeExistsController: BillCodeExistsController = new BillCodeExistsController(billCodeExistsUseCase);

export { billCodeExistsController }