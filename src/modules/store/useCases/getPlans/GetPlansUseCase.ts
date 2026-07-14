import { PLAN_LIMITS } from "../../../../config/plans.config.js";
import type { PlanConfig } from "../../../../config/plans.config.js";
import { SubscriptionPlan } from "../../entities/store.enums.js";

export class GetPlansUseCase{

    constructor(){}

    public async execute(): Promise<Record<SubscriptionPlan, PlanConfig>>{

        const plan_limits: Record<SubscriptionPlan, PlanConfig> = PLAN_LIMITS;

        return plan_limits
    }
}
