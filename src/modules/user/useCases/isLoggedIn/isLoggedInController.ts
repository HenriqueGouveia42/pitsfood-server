import type { Request, Response } from "express";

export class IsLoggedInController {

    constructor(){}

    handle = async(req: Request, res: Response): Promise<Response> =>{

        const { id, role } = req.user;

        return res.status(200).json({
            isAuthenticated: true,
            user: {
                id: id,
                role: role
            }
        })

    }
}