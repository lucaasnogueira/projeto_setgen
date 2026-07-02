import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { existsSync, statSync } from 'fs';
import { normalize, resolve, sep } from 'path';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

const UPLOADS_ROOT = resolve(process.cwd(), 'uploads');

/**
 * Antes servido via ServeStaticModule (Express estático, sem passar pelos
 * guards do Nest) — qualquer um com a URL acessava arquivos sem autenticação
 * (laudos médicos, documentos de RH, comprovantes financeiros, etc).
 * Agora exige um usuário autenticado válido para baixar qualquer arquivo.
 */
@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  @Get('*')
  getFile(@Req() req: Request, @Res() res: Response) {
    const requestedPath = req.params[0];

    if (!requestedPath) {
      throw new BadRequestException('Caminho de arquivo não informado');
    }

    // Impede path traversal (ex: ../../.env) resolvendo o caminho absoluto
    // e garantindo que ele permaneça dentro de UPLOADS_ROOT.
    const safeRelative = normalize(requestedPath).replace(
      /^(\.\.(\/|\\|$))+/,
      '',
    );
    const absolutePath = resolve(UPLOADS_ROOT, safeRelative);

    if (
      absolutePath !== UPLOADS_ROOT &&
      !absolutePath.startsWith(UPLOADS_ROOT + sep)
    ) {
      throw new BadRequestException('Caminho inválido');
    }

    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    return res.sendFile(absolutePath);
  }
}
