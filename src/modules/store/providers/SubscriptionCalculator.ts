import { SubscriptionPlan } from "../entities/store.js";
import { PLAN_LIMITS } from "../../../config/plans.config.js";
import { AppError } from "../../../shared/errors/AppError.js";

export class SubscriptionCalculator {
    
    /**
     * Retorna o valor cheio do plano e a data alvo para expiração/renovação (1 mês à frente).
     * Utilizado tanto na primeira assinatura quanto na geração de faturas de renovação.
     */
    public calculateInvoice(plan: SubscriptionPlan, baseDate: Date): { amount_in_cents: number, target_date: Date } {
        
        const planConfig = PLAN_LIMITS[plan];
        
        if (!planConfig.price_in_cents) {
            throw new AppError("Erro de integridade: Plano sem preço configurado.", 409, "PLAN_WITHOUT_PRICE");
        }

        // calcula exatamente 1 mês à frente a partir da data base informada.
        // o tempo é cravado às 23:59:59 para garantir o final do dia.

        //isso é necessario para proteger contra bugs dos meses que nao tem dias 29, 30 ou 31, por exemplo:
        // supunhetamos um usuario assinando dia 31 de janeiro de 2026
        // o contrutor do new Date abaixo ia receber isso:

        /*
        
            const targetDate: Date = new Date(
                2026,
                0 + 1,
                31
            )

            como o dia 31 de FEVEREIRO nao existe, targetDate tranborda da 03 de marco, ou seja,
            
            o cliente pagou 31 de janeiro de vai poder usar até 03 de marco, ganhando 01 mes DE GRAÇA!!

            por essa razao precisamos garantir que targetDay nunca seja maior que 28 antes de passar para o contrutor
            new Date()
        
        */

        let targetDay: number = baseDate.getDate();
        if(targetDay > 28){
            targetDay = 28
        }

        //o proprio construtor de date ja resolve os casos de borda como dezembro de um ano para janeiro do proximo ano
        const targetDate: Date = new Date(
            baseDate.getFullYear(), 
            baseDate.getMonth() + 1, 
            targetDay, //mesmo dia do mes
            23, 59, 59
        );

        // Retorna o valor limpo, sem necessidade de decimais ou divisões.
        return {
            amount_in_cents: planConfig.price_in_cents,
            target_date: targetDate
        };
    }
}