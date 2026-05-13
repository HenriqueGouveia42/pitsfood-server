import { GetPaginatedSalesController } from "./GetPaginatedSalesController.js";
import { GetPaginatedSalesUsecase } from "./GetPaginatedSalesUsecase.js";
import { PrismaSaleRepository } from "../../repositories/implementations/prisma/sale.repository.prisma.js";

const saleRepository: PrismaSaleRepository = new PrismaSaleRepository();
const getPaginatedSalesUsecase: GetPaginatedSalesUsecase = new GetPaginatedSalesUsecase(saleRepository);
const getPaginatedSalesController: GetPaginatedSalesController = new GetPaginatedSalesController(getPaginatedSalesUsecase);

export { getPaginatedSalesController }