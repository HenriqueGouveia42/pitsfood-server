import { Decimal } from "decimal.js";
import { SubscriptionPlan } from "../entities/store.js";
import { PLAN_LIMITS } from "../../../config/plans.config.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SubscriptionCalculator {
    
    //dia fixo de vencimento: 28
    private static readonly FIXED_DUE_DAY = 28;

    //usamos 30 dias como base comercial para cálculo de diária
    //Convertido para Decimal para garantir precisão na divisão
    private static readonly COMMERCIAL_MONTH_DAYS = new Decimal(30);

    public static calculateProRata(plan: SubscriptionPlan): { amount_in_cents: number, days_charged: number } {

        const now = new Date();
        const currentDay: number = now.getDate();
        
        //o preço do plano do mes é proporcional aos dias que serão utilizados nesse mes especifico
        const planConfig = PLAN_LIMITS[plan];
        
        if (!planConfig.price_in_cents) throw new AppError("Erro. Plano sem preco.", 409, "PLAN_WITHOUT_PRICE");
        //objeto da classe Decimal para evitar float math do JS
        const fullPriceInCents: Decimal = new Decimal(planConfig.price_in_cents);
        
        //preço por dia com precisão decimal
        const pricePerDayInCents: Decimal = fullPriceInCents.dividedBy(this.COMMERCIAL_MONTH_DAYS);

        let daysToCharge = 0;

        if (currentDay < this.FIXED_DUE_DAY) {

            daysToCharge = this.FIXED_DUE_DAY - currentDay;
        } else {
            
            //se passou do dia 28, cobramos o proporcional até o dia 28 do PRÓXIMO mês.
            
            //getDate() retorna number, operações com datas aqui são seguras pois são inteiros
            const daysInCurrentMonth: number = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const remainingDaysInThisMonth: number = daysInCurrentMonth - currentDay;
            daysToCharge = remainingDaysInThisMonth + this.FIXED_DUE_DAY;
        }

        const daysToChargeDecimal: Decimal = new Decimal(daysToCharge);
        const proRataAmountDecimal: Decimal = daysToChargeDecimal.times(pricePerDayInCents);

        //evita centavos quebrados
        //ceil() do Decimal.js é mais seguro que Math.ceil() para casos de borda
        const proRataAmount: number = proRataAmountDecimal.ceil().toNumber(); //arredonda para cima, em centavos, isso tira a impresao .ceil()

        return {
            amount_in_cents: proRataAmount,
            days_charged: daysToCharge
        };
    }
}