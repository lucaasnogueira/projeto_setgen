import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

import { UsersService } from '../../users/users.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'default-secret-key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário não encontrado ou inativo');
    }

    const permissions = Array.from(
      new Set([
        ...(user.roleRef?.permissions?.map((p: any) => p.permission.name) || []),
        ...(user.permissions?.map((p: any) => p.permission.name) || []),
      ]),
    );

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      login: user.login,
      role: user.role,
      roleId: user.roleId,
      roleName: user.roleRef?.name || user.role,
      roleRef: user.roleRef ? { id: user.roleRef.id, name: user.roleRef.name } : null,
      permissions,
    };
  }
}
