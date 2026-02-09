import { PLAN_LIMITS } from "../../../../config/plans.config.js";

export class GetPlansUseCase{

    constructor(){}

    public async execute(){
        return PLAN_LIMITS
    }
}
