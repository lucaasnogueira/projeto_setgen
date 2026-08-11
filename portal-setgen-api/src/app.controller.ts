import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import type { HealthStatus } from './app.service';

// Rota raiz pública, sem guard: serve de healthcheck para a plataforma de
// deploy (Railway/Render pingam a aplicação para saber se ela subiu).
// Não expõe nada além do próprio "estou de pé".
@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Healthcheck da API' })
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
