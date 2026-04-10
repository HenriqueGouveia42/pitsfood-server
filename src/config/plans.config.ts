import { SubscriptionPlan } from "../modules/store/entities/store.js";
import { UserRole } from "../modules/user/entities/user.js";

interface PlanConfig {
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

    [SubscriptionPlan.BASIC]: {
        id: "basic_plan",
        title: "Plano Basic",
        description: "Ideal para food trucks, quiosques e comedorias em geral.",
        price_in_cents: 19900,
        currency: "BRL",
        limits: {
            max_physical_bills: 40,
            max_users: {
                [UserRole.GESTOR]: 1,
                [UserRole.CAIXA]: 1,
                [UserRole.VENDEDOR]: 4
            }
        }
    },

    [SubscriptionPlan.EXTENDED]: {
        id: "extended_plan",
        title: "Plano Extended",
        description: "Para restaurantes, bares e comedorias em crescimento.",
        price_in_cents: 24900,
        currency: "BRL",
        limits: {
            max_physical_bills: 80,
            max_users: {
                [UserRole.GESTOR]: 2,
                [UserRole.CAIXA]: 2,
                [UserRole.VENDEDOR]: 10
            }
        }
    },

    [SubscriptionPlan.PREMIUM]: {
        id: "premium_plan",
        title: "Plano Premium",
        description: "Potência total para operações robustas",
        price_in_cents: 39900,
        currency: "BRL",
        limits: {
            max_physical_bills: 200,
            max_users: {
                [UserRole.GESTOR]: 5,
                [UserRole.CAIXA]: 5,
                [UserRole.VENDEDOR]: 30
            }
        }
    },

    [SubscriptionPlan.PERSONALIZED]: {
        id: "personalized_plan",
        title: "Plano Personalized",
        description: "Um plano personalizado para o seu negócio. Entre em contato.",
        price_in_cents: null,
        currency: "BRL",
        limits: {
            max_physical_bills: 0,
            max_users: {
                [UserRole.GESTOR]: 0,
                [UserRole.CAIXA]: 0,
                [UserRole.VENDEDOR]: 0
            }
        }
    }
};