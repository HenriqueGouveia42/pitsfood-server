import type { Request, Response, NextFunction } from "express";
import * as z from "zod"
import { ZodError, type ZodObject } from "zod";

export const validateSchema = (schema: ZodObject) =>
(req: Request, res: Response, next: NextFunction) =>{

    try{
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });

        next();

    }catch(error){

        if (error instanceof ZodError){
            return res.status(400).json(error)
        }

        return res.status(400).json({message: "Invalid Request"})
    }
}