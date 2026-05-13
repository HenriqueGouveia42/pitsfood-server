import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { IStorageProvider } from "../models/IStorageProvider.js";
import { AppError } from "../../../errors/AppError.js";

export class S3StorageProvider implements IStorageProvider {
    private client: S3Client;

    constructor() {
        //capturar as variaveis do .env
        const endpoint = process.env.AWS_BUCKET_ENDPOINT;
        const accessKeyId = process.env.S3_ACCESS_KEY_ID;
        const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

        //validar se elas existem - failfast
        if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error("CRITICAL: Faltam variáveis de ambiente do R2/S3 (ENDPOINT, ACCESS_KEY_ID ou SECRET_ACCESS_KEY).");
        
        this.client = new S3Client({
            region: "auto",
            endpoint: endpoint, 
            credentials: {
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey,
            },
        });
    }

    public async save(file: string, content: Buffer, contentType: string): Promise<string> {
        try {
            await this.client.send(
                new PutObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME, 
                    Key: file,       
                    Body: content,   
                    ContentType: contentType, 
                })
            );

            const publicUrl = `${process.env.STORAGE_PUBLIC_URL}/${file}`;
            return publicUrl;

        } catch (error) {
            console.error("[StorageProvider] Erro ao salvar arquivo:", error);
            throw new AppError("Falha ao salvar a imagem no armazenamento externo.", 500, "STORAGE_UPLOAD_ERROR");
        }
    }

    public async delete(file: string): Promise<void> {
        try {
            await this.client.send(
                new DeleteObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: file,
                })
            );
        } catch (error) {
            console.error(`[StorageProvider] Erro ao deletar arquivo ${file}:`, error);
        }
    }
}