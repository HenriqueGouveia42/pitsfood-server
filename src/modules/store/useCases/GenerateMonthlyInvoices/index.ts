import { GenerateMonthlyInvoicesUseCase } from "./GenerateMonthlyInvoicesUseCase.js";

import { PrismaStoreRepository } from "../../repositories/implementations/prisma/store.repository.prisma.js";
import { PrismaUserRepository } from "../../../user/repositories/implementations/prisma/user.repository.prisma.js";
import {  }

const generateMonthlyInvoicesUseCase: GenerateMonthlyInvoicesUseCase = new GenerateMonthlyInvoicesUseCase();