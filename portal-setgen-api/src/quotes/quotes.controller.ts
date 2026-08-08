import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { UpdateQuoteStatusDto } from './dto/update-quote-status.dto';
import { CreateQuoteLineDto } from './dto/create-quote-line.dto';
import { UpdateQuoteLineDto } from './dto/update-quote-line.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, QuoteStatus, ServiceOrderType } from '@prisma/client';

@ApiTags('Quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Criar novo orçamento' })
  create(@Body() dto: CreateQuoteDto, @Request() req) {
    return this.quotesService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os orçamentos' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', enum: QuoteStatus, required: false })
  @ApiQuery({ name: 'type', enum: ServiceOrderType, required: false })
  @ApiQuery({ name: 'createdById', required: false })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('status') status?: QuoteStatus,
    @Query('type') type?: ServiceOrderType,
    @Query('createdById') createdById?: string,
  ) {
    return this.quotesService.findAll({ clientId, status, type, createdById });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obter estatísticas dos orçamentos' })
  getStatistics() {
    return this.quotesService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar orçamento por ID' })
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar orçamento' })
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto, @Request() req) {
    return this.quotesService.update(id, dto, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar status do orçamento (aprovar/rejeitar/enviar/aceitar)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQuoteStatusDto, @Request() req) {
    return this.quotesService.updateStatus(id, dto, req.user.id, req.user.role);
  }

  @Post(':id/lines')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar linha ao orçamento (serviço/material/hora técnica/deslocamento)' })
  addQuoteLine(@Param('id') id: string, @Body() dto: CreateQuoteLineDto) {
    return this.quotesService.addQuoteLine(id, dto);
  }

  @Patch(':id/lines/:lineId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar linha do orçamento' })
  updateQuoteLine(
    @Param('id') id: string,
    @Param('lineId') lineId: string,
    @Body() dto: UpdateQuoteLineDto,
  ) {
    return this.quotesService.updateQuoteLine(id, lineId, dto);
  }

  @Delete(':id/lines/:lineId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover linha do orçamento' })
  removeQuoteLine(@Param('id') id: string, @Param('lineId') lineId: string) {
    return this.quotesService.removeQuoteLine(id, lineId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar orçamento (apenas ADMIN, só se não tiver gerado OS)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.quotesService.remove(id, req.user.role);
  }

  @Get(':id/audit-log')
  @ApiOperation({ summary: 'Histórico de alterações do orçamento (audit log)' })
  getAuditLog(@Param('id') id: string) {
    return this.quotesService.getAuditLog(id);
  }
}
