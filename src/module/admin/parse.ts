// middleware/parseData.ts
import { Request, Response, NextFunction } from "express";

export const parseData = (req: Request, res: Response, next: NextFunction) => {
    if (req.body?.data && typeof req.body.data === "string") {
        try {
            req.body.data = JSON.parse(req.body.data);
            console.log(req.body.data);
            
        } catch (err) {
            return res.status(400).json({ message: "Invalid JSON in data field" });
        }
    }
    next();
};
