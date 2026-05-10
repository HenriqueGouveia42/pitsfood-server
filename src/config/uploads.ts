import multer from "multer";
import type { FileFilterCallback } from "multer"
import type { Request } from "express";
import { AppError } from "../shared/errors/AppError.js";

export const uploadConfig = {
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // limite de 2MB
    },
    fileFilter: (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp"
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            // O cast para 'any' aqui é um macete necessário porque a tipagem 
            // original do callback do Multer espera um Error padrão do Node
            callback(new AppError("Formato de arquivo inválido. Use apenas PNG, JPG ou WEBP.", 400, "INVALID_FILE_TYPE") as any, false);
        }
    },
};