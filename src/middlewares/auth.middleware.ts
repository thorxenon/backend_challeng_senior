import { HttpException, Injectable, NestMiddleware } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { NextFunction, Request, Response } from "express";

@Injectable()
export class AuthMiddleware implements NestMiddleware{
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService
    ){}

    use(req: Request, res: Response, next: NextFunction){
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if(!token) throw new HttpException('Unauthorized', 401);

        try{
            const payload = this.jwtService.verify(token, { secret: this.configService.get('JWT_SECRET') });
            req['user'] = payload;
            next();
        }catch(errr){
            throw new HttpException('Unauthorized', 401);
        }
    }
}