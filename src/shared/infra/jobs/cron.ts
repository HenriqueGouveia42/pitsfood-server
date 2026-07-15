import cron from "node-cron";
import { processOverdueSubscriptionsUseCase } from "../../../modules/store/useCases/subscriptions/processOverdueSubscriptions/index.js";

export function startCronJobs() {

    console.log("[CRON] Serviço de agendamentos inicializado.");
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