/*
    Objeto de configuração dos planos das lojas

    Configuration object to plans of stores
*/

import { SubscriptionPlan } from "../modules/store/entities/store.enums.js";
import { UserRole } from "../modules/user/entities/user.js";

export interface PlanConfig {
    id: string;
    title: string;
    description: string;
    price_in_cents: number | null;
    currency: string;
    limits: {
        max_physical_bills: number;
        max_users: {
            [key in UserRole]?: number;
        }
    }
}

export const PLAN_LIMITS: Record<SubscriptionPlan, PlanConfig> = {

    [SubscriptionPlan.NONE]: {
        id: "none_plan",
        title: "Sem Plano", 
        description: "Loja criada mas não ativada",
        price_in_cents: 0,
        currency: "BRL",
        limits: {
            max_physical_bills: 0,
            max_users: {
                [UserRole.GESTOR]: 1,
                [UserRole.CAIXA]: 0,
                [UserRole.VENDEDOR]: 0
            }
        }
    },

    [SubscriptionPlan.EMPREENDEDOR]: {
        id: "basic_plan",
        title: "Plano Empreendedor",
        description: "Ideal para o Empreendedor Solo! Food trucks, quiosques e comedorias em geral.",
        price_in_cents: 5900,
        currency: "BRL",
        limits: {
            max_physical_bills: 20,
            max_users: {
                [UserRole.GESTOR]: 1,
                [UserRole.CAIXA]: 0,
                [UserRole.VENDEDOR]: 0
            }
        }
    },

    [SubscriptionPlan.EXTENDED]: {
        id: "extended_plan",
        title: "Plano Extended",
        description: "Ideal para o Empreendedor que está crescendo! Para restaurantes, bares e comedorias em crescimento.",
        price_in_cents: 9900,
        currency: "BRL",
        limits: {
            max_physical_bills: 40,
            max_users: {
                [UserRole.GESTOR]: 1,
                [UserRole.CAIXA]: 1,
                [UserRole.VENDEDOR]: 5
            }
        }
    },

    [SubscriptionPlan.PREMIUM]: {
        id: "premium_plan",
        title: "Plano Premium",
        description: "Ideal para o Empreendedor que já tem uma operação consolidada.",
        price_in_cents: 19900,
        currency: "BRL",
        limits: {
            max_physical_bills: 100,
            max_users: {
                [UserRole.GESTOR]: 3,
                [UserRole.CAIXA]: 5,
                [UserRole.VENDEDOR]: 30
            }
        }
    },

};