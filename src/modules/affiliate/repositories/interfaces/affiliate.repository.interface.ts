import { Affiliate } from "../../entities/affiliate.js";

export interface IAffiliateRepository{
    getAffiliateById(id: string): Promise<Affiliate | null>
}