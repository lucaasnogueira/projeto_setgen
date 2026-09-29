import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  password: string;
  active: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmailOrLogin(email);

    if (!user || !user.active) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Usuário ou senha inválidos');
    }

    const userWithPerms = await this.usersService.findMe(user.id);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      roleName: user.roleRef?.name,
      roleId: user.roleId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        login: user.login,
        role: user.role,
        roleId: user.roleId,
        roleName: user.roleRef?.name,
        roleRef: user.roleRef ? { id: user.roleRef.id, name: user.roleRef.name } : null,
        permissions: userWithPerms.permissions || [],
      },
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    return this.usersService.changeOwnPassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
