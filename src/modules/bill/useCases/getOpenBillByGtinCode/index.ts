import { GetOpenBillByGtinCodeUseCase } from "./getOpenBillByGtinCodeUseCase.js";
import { GetOpenBillByGtinCodeController } from "./getOpenBillByGtinCodeController.js";
import { PrismaBillRepository } from "../../repositories/implementations/prisma/bill.repository.prisma.js";

const billRepository: PrismaBillRepository  = new PrismaBillRepository();

const getOpenBillByGtinCodeUseCase: GetOpenBillByGtinCodeUseCase = new GetOpenBillByGtinCodeUseCase(billRepository)

const getOpenBillByGtinCodeController: GetOpenBillByGtinCodeController = new GetOpenBillByGtinCodeController(getOpenBillByGtinCodeUseCase);

export { getOpenBillByGtinCodeController }