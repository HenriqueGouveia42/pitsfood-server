import { SubscriptionPlan } from "../modules/store/entities/store.js";
import { UserRole } from "../modules/user/entities/user.js";

export const PLAN_LIMITS = {

    [SubscriptionPlan.NONE]:{
        tile: "Sem Plano",
        description: "Loja Criada mas nao ativada",
        price_in_cents: 0,
        currency: "BRL",
        limits: {
            max_physical_bills: 0,
            max_users: {
                [UserRole.GESTOR]: 1, //permite que o gestor dono exista
                [UserRole.CAIXA]: 0,
                [UserRole.VENDEDOR]: 0
            }
        }
    },

    [SubscriptionPlan.BASIC]:{
        title: "Plano Basic",
        description: "Ideal para food trucks, quiosques e comedorias em geral.",
        price_in_cents: 10000,
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
        description: "Potência total para para operações de qualquer tamanaho.",
        price_in_cents: 30000,
        currency: "BRL",

        limits:{
            max_physical_bills: 500,
            max_users: {
                [UserRole.GESTOR]: 40,
                [UserRole.CAIXA]: 40,
                [UserRole.VENDEDOR]: 40
            }
        }
    }
}