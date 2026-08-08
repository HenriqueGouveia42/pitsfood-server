import type { Request, Response } from "express";
import { redisSubscriber } from "../../../../shared/infra/redis/index.js"; // Ajuste o caminho
import { AppError } from "../../../../shared/errors/AppError.js";
import { SSE_HEARTBEAT_INTERVAL_IN_MS } from "../../../../config/system_data.js";

// dicionário em memória para guardar as conexões ativas.

// chave: 'store_id'
// valor: Array de objetos 'Response' do Express
const activeConnections = new Map<string, Response[]>();

redisSubscriber.pSubscribe('comandas:loja:*', (message: string, channel: string) => {
    
    // channel virá como "comandas:loja:id-da-loja-aqui"
    const prefixSplit: string[] = channel.split(':');
    const store_id: string | undefined = prefixSplit[prefixSplit.length - 1]; // pega o último pedaço

    if (!store_id) throw new AppError("'store_id' nao encontrado");

    const connections = activeConnections.get(store_id);

    // se houver caixas abertos desta loja, faz o broadcast da mensagem
    if (connections && connections.length > 0) {

        connections.forEach(res => {
            // SSE exige o prefixo "data: " e terminar com duas quebras de linha "\n\n"
            res.write(`data: ${message}\n\n`);
        });
    }
});

export class SSEController {
    
    public handle(req: Request, res: Response): void {
        
        const store_id = req.user?.store_id;

        if (!store_id) {
            res.status(401).json({ error: "Acesso negado. Loja não identificada." });
            return;
        }

        // configuração dos cabeçalhos para manter a conexão aberta (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Previne Nginx e outros proxies de colocarem o ping em buffer
        res.setHeader('X-Accel-Buffering', 'no')

        // cadastra o cliente no "balcão" do redis
        if (!activeConnections.has(store_id)) {
            activeConnections.set(store_id, []);
        }

        activeConnections.get(store_id)!.push(res);

        // envia um evento inicial apenas para confirmar que a conexão foi estabelecida
        res.write(`data: ${JSON.stringify({ event: "CONNECTED", message: "Conectado ao canal de atualizações em tempo real." })}\n\n`);

        const heartBeat = setInterval(() => {
            res.write(`: ping\n\n`);
        }, SSE_HEARTBEAT_INTERVAL_IN_MS)

        // tratamento de Desconexão (O cliente fechou a aba ou a internet caiu)
        req.on('close', () => {

            // limpa o timer dessa conexão específica para evitar vazamento de memória e processamento
            clearInterval(heartBeat);

            const connections = activeConnections.get(store_id);

            if (connections) {

                // filtra removendo o 'res' atual que acabou de desconectar
                const updatedConnections = connections.filter(conn => conn !== res);
                
                if (updatedConnections.length === 0) {

                    // se não sobrou ninguém da loja, remove a chave do Map para liberar memória RAM
                    activeConnections.delete(store_id);
                } else {
                    activeConnections.set(store_id, updatedConnections);
                }
            }
        });
    }
}

// exportamos uma instância única - singleton - para ser usada nas rotas
export const sseController = new SSEController();