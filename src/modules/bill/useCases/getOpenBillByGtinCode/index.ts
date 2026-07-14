import { GetOpenBillByGtinCodeUseCase } from "./GetOpenBillByGtinCodeUseCase.js";
import { GetOpenBillByGtinCodeController } from "./GetOpenBillByGtinCodeController.js";
import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";

const billRepository: PrismaBillRepository  = new PrismaBillRepository();

const getOpenBillByGtinCodeUseCase: GetOpenBillByGtinCodeUseCase = new GetOpenBillByGtinCodeUseCase(billRepository)

const getOpenBillByGtinCodeController: GetOpenBillByGtinCodeController = new GetOpenBillByGtinCodeController(getOpenBillByGtinCodeUseCase);

export { getOpenBillByGtinCodeController }