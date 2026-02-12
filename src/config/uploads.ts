import multer from "multer";
import path from "path";
import { AppError } from "../shared/errors/AppError.js";

export const uploadConfig = {

    storage: multer.memoryStorage(),

    limits: {
        fileSize: 2 * 1024 * 1024, //limite de 2MB (suficiente para logo)
    },

    //filtro de tipo de arquivo
    fileFilter: (req: any, file: any, callback: any) => {
        const allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png"
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
            callback(null, true);
        } else {
            //o usuário tenta subir um .pdf ou .exe, barramos aqui
            callback(new AppError("Formato de arquivo inválido. Use apenas PNG ou JPG.", 400, "INVALID_FILE_TYPE"));
        }
    },
};