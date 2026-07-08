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
  Request,
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
import { EmitirNotaMercadoriaDto } from './dto/emitir-nota.dto';
import { FiscalFilterDto } from './dto/fiscal-filter.dto';

@ApiTags('Fiscal (NF-e Mercadoria)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fiscal')
export class FiscalController {
  constructor(private readonly fiscalService: FiscalService) {}

  /**
   * Emite uma NF-e (Modelo 55) de mercadoria a partir de um cliente e uma
   * lista de produtos do estoque, opcionalmente vinculada a uma OS.
   * Aplica motor 2026 (IBS/CBS por fora) + impostos legados (ICMS/PIS/COFINS) + ZFM.
   */
  @Post('emitir')
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir NF-e de mercadoria',
    description:
      'Recebe cliente + itens do estoque. Calcula IBS/CBS 2026 + impostos legados, gera XML, assina, transmite à SEFAZ-AM, baixa estoque e retorna splitPayment.',
  })
  @ApiResponse({ status: 201, description: 'Nota emitida / em processamento' })
  @ApiResponse({ status: 400, description: 'Payload inválido ou estoque insuficiente' })
  emitir(@Body() dto: EmitirNotaMercadoriaDto, @Request() req) {
    return this.fiscalService.emitirNotaMercadoria(dto, req.user.id);
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
