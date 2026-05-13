import { CheckPaymentStatusUseCase } from "./CheckPaymentStatusUseCase.js";
import { CheckPaymentStatusController } from "./CheckPaymentStatusController.js";

// Importando o repositório correto (Cuidado com o caminho relativo)
import { PrismaSubscriptionInvoiceRepository } from "../../repositories/implementations/prisma/subscriptionInvoice.repository.prisma.js";

// Instância do Repositório
const invoiceRepository = new PrismaSubscriptionInvoiceRepository();

// Injeção de Dependência
const checkPaymentStatusUseCase = new CheckPaymentStatusUseCase(invoiceRepository);

const checkPaymentStatusController = new CheckPaymentStatusController(checkPaymentStatusUseCase);

export { checkPaymentStatusController };