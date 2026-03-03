import cron from "node-cron";
import { processOverdueSubscriptionsUseCase } from "../../../modules/store/useCases/ProcessOverdueSubscriptions/index.js";

export function startCronJobs() {
    console.log("[CRON] Serviço de agendamentos inicializado.");

    // carrasco das Assinaturas
    // regra: Roda no minuto 58, hora 23 (11 PM), dia 28 de todos os meses.

    cron.schedule("58 23 28 * *", async () => {
        
        console.log("[CRON] Acordando a rotina de verificação de inadimplentes...");
        
        try {
            await processOverdueSubscriptionsUseCase.execute();
        } catch (error) {
            console.error("[CRON] ERRO CRÍTICO ao processar assinaturas vencidas:", error);
        }

    }, {
        timezone: "America/Sao_Paulo"
    });

    // Aqui você vai adicionar o próximo CRON (o que gera a fatura no dia 20) futuramente
}