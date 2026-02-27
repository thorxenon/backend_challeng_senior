import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { RoleHasPermission } from "src/auth/entities/roleHasPermission.entity";
import { PERMISSION_KEY } from "src/decorators/permission.decorator";
import { Repository } from "typeorm";

@Injectable()
export class PermissionGuard implements CanActivate{
    constructor(
        @InjectRepository(RoleHasPermission)
        private readonly roleHasPermissionRepository: Repository<RoleHasPermission>,
        private reflector: Reflector
    ){}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        try{
            const requiredPermission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
                context.getHandler(),
                context.getClass(),
            ]);

            if(!requiredPermission) return true;

            const { user } = context.switchToHttp().getRequest();
            if(!user || !user.role) throw new ForbiddenException('Access Denied');
            
           const hasPermission = await this.roleHasPermissionRepository.findOne({
                where: {
                    role:{
                        id: user.role
                    }, 
                    permission: { 
                        name: requiredPermission 
                    }
                }
            });

            if(!hasPermission) throw new ForbiddenException('Access Denied');

            return true;
        }catch(err){
            console.error('PermissionGuard Error:', err);
            throw new ForbiddenException('Access Denied');
        }
    }
}