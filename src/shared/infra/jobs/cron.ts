import cron from "node-cron";
import { processOverdueSubscriptionsUseCase } from "../../../modules/store/useCases/subscriptions/processOverdueSubscriptions/index.js";

// Objetivo: Gerar faturas para quem vence daqui a 5 dias exatos.

export function startCronJobs() {

    console.log("[CRON] Serviço de agendamentos inicializado.");
    // 2. O Carrasco: Roda todo dia às 23:58
    // Objetivo: Bloquear quem venceu HOJE e não pagou.
    cron.schedule("58 23 * * *", async () => {
        console.log("[CRON 23:58] Acordando a rotina de verificação de inadimplentes...");
        try {
            await processOverdueSubscriptionsUseCase.execute();
        } catch (error) {
            console.error("[CRON] ERRO CRÍTICO ao processar assinaturas vencidas:", error);
        }
    }, { timezone: "America/Sao_Paulo" });
}