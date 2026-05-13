import cron from "node-cron";
import { processOverdueSubscriptionsUseCase } from "../../../modules/store/useCases/ProcessOverdueSubscriptions/index.js";
import { generateRenewalInvoicesUseCase } from "../../../modules/store/useCases/GenerateRenewalInvoices/index.js";

export function startCronJobs() {
    console.log("[CRON] Serviço de agendamentos inicializado.");

    // 1. O Mensageiro: Roda todo dia às 06:00 da manhã
    // Objetivo: Gerar faturas para quem vence daqui a 5 dias exatos.
    cron.schedule("0 6 * * *", async () => {
        console.log("[CRON 06:00] Iniciando geração de faturas de renovação (5 dias antes)...");
        try {
            await generateRenewalInvoicesUseCase.execute();
        } catch (error) {
            console.error("[CRON] ERRO CRÍTICO ao gerar faturas de renovação:", error);
        }
    }, { timezone: "America/Sao_Paulo" });

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