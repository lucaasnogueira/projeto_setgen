import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { FiscalService } from './fiscal.service';
import { OsDataDto } from './dto/os-data.dto';
import { FiscalFilterDto } from './dto/fiscal-filter.dto';

@ApiTags('Fiscal (NF-e / NFS-e)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  /**
   * Recebe os dados de uma OS fechada e realiza a emissão DUAL:
   *  - NF-e Modelo 55 para itens de peças/mercadorias
   *  - NFS-e Nacional para itens de serviços
   * Aplica motor 2026 (IBS/CBS por fora) + impostos legados (ISS/ICMS/PIS/COFINS) + ZFM.
   */
  @Post('emitir')
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir NF-e + NFS-e (dual 2026)',
    description:
      'Recebe OS fechada. Calcula IBS/CBS 2026 + impostos legados, gera XMLs, assina, transmite à SEFAZ-AM / ADN NFS-e e retorna splitPayment.',
  })
  @ApiResponse({ status: 201, description: 'Notas emitidas / em processamento' })
  @ApiResponse({ status: 400, description: 'Payload inválido' })
  emitir(@Body() osData: OsDataDto) {
    return this.fiscalService.emitirNotaDual(osData);
  }

  /**
   * Lista todas as notas fiscais com suporte a filtros (status, tipo, cliente, data, OS).
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Listar notas fiscais com filtros' })
  listar(@Query() filters: FiscalFilterDto) {
    return this.fiscalService.listarNotas(filters);
  }

  @Get('os/:serviceOrderId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Notas de uma OS específica (Legado)' })
  listarPorOs(@Param('serviceOrderId') serviceOrderId: string) {
    return this.fiscalService.listarNotas({ serviceOrderId });
  }

  /**
   * Consulta uma nota fiscal pelo ID interno, retornando impostos e eventos.
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Consultar nota fiscal por ID' })
  consultar(@Param('id') id: string) {
    return this.fiscalService.consultarNota(id);
  }

  /**
   * Cancela uma nota fiscal já autorizada (apenas NF-e).
   */
  @Post(':id/cancelar')
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar nota fiscal autorizada' })
  cancelar(
    @Param('id') id: string,
    @Body('justificativa') justificativa: string,
  ) {
    return this.fiscalService.cancelarNota(id, justificativa);
  }
}
