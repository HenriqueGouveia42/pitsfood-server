import type { Decimal } from "decimal.js"

export type AffiliateProps = {
    readonly id: string,
    readonly name: string,
    readonly email: string,
    readonly cpf_cnpj: string,
    readonly pix_key: string,
    readonly referral_code: string,
    readonly commission_rate: Decimal,
    readonly active: boolean,
    readonly created_at: string,
    readonly updated_at: string,
}



export class Affiliate{

    private constructor(private readonly props: AffiliateProps){}

    /*public static buildAffiliate(
        name: string,
        email: string,
        cpf_cnpj: string,
        pix_key: string,
    ): Affiliate{

        const referral_code: string = "name"

        return new Affiliate({
            id: crypto.randomUUID().toString(),
            name,
            email,
            cpf_cnpj,
            pix_key,
            referral_code

        })
    }
    */

}