import { SubscriptionPlan, UserRole } from "../generated/prisma/enums.js";

export const PLAN_LIMITS = {
    [SubscriptionPlan.BASIC]:{
        title: "Plano Basic",
        description: "Ideal para food trucks, quiosques e comedorias em geral.",
        price_in_cents: 6900,
        currency: "BRL",
        
        limits: {
            max_physical_bills: 30,
            max_users: {
                [UserRole.GESTOR]: 1,
                [UserRole.CAIXA]: 1,
                [UserRole.VENDEDOR]: 2
            }
        }
    },

    [SubscriptionPlan.EXTENDED]: {
        title: "Plano Extended",
        description: "Para restaurantes, bares e comedorias em geral em crescimento.",
        price_in_cents: 20000,
        currency: "BRL",
        
        limits:{
            max_physical_bills: 80,
            max_users: {
                [UserRole.GESTOR]: 2,
                [UserRole.CAIXA]: 2,
                [UserRole.VENDEDOR]: 6
            }
        }  
    },

    [SubscriptionPlan.PREMIUM]: {
        title: "Plano Premium",
        description: "Potência total para para operações de qualquer tamanaho. Comandas e funcionarios ilimitados",
        price_in_cents: 30000,
        currency: "BRL",

        limits:{
            max_physical_bills: 9999,
            max_users: {
                [UserRole.GESTOR]: 9999,
                [UserRole.CAIXA]: 9999,
                [UserRole.VENDEDOR]: 999
            }
        }
    }
}