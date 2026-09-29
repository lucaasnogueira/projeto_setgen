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
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.TECHNICIAN)
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

  // --- MultiCRUD por Abas ---
  @Post(':id/item-products')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Incluir produto no orçamento' })
  addItemProduct(
    @Param('id') id: string,
    @Body() dto: { productId: string; quantity: number; unitPrice: number; discountAmount?: number },
  ) {
    return this.quotesService.addItemProduct(id, dto);
  }

  @Delete(':id/item-products/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover produto do orçamento' })
  removeItemProduct(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.quotesService.removeItemProduct(id, itemId);
  }

  @Post(':id/item-services')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Incluir serviço no orçamento' })
  addItemService(
    @Param('id') id: string,
    @Body()
    dto: {
      serviceId: string;
      quantity: number;
      unitPrice: number;
      discountAmount?: number;
      customObservation?: string;
    },
  ) {
    return this.quotesService.addItemService(id, dto);
  }

  @Delete(':id/item-services/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover serviço do orçamento' })
  removeItemService(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.quotesService.removeItemService(id, itemId);
  }

  @Post(':id/additional-costs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Incluir custo adicional no orçamento' })
  addAdditionalCost(
    @Param('id') id: string,
    @Body() dto: { description: string; amount: number },
  ) {
    return this.quotesService.addAdditionalCost(id, dto);
  }

  @Delete(':id/additional-costs/:costId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover custo adicional do orçamento' })
  removeAdditionalCost(@Param('id') id: string, @Param('costId') costId: string) {
    return this.quotesService.removeAdditionalCost(id, costId);
  }

  @Post(':id/tasks')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Associar tarefa ao orçamento' })
  addTask(
    @Param('id') id: string,
    @Body()
    dto: {
      taskCode?: string;
      taskType: string;
      executionDate: Date;
      assignedCollaboratorId?: string;
    },
  ) {
    return this.quotesService.addTask(id, dto);
  }

  @Delete(':id/tasks/:taskId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Desvincular tarefa do orçamento' })
  removeTask(@Param('id') id: string, @Param('taskId') taskId: string) {
    return this.quotesService.removeTask(id, taskId);
  }

  @Post(':id/attachments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Incluir anexo no orçamento' })
  addAttachment(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: { fileName: string; fileUrl: string; showToClient?: boolean },
  ) {
    return this.quotesService.addAttachment(id, req.user.id, dto);
  }

  @Delete(':id/attachments/:attachmentId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover anexo do orçamento' })
  removeAttachment(@Param('id') id: string, @Param('attachmentId') attachmentId: string) {
    return this.quotesService.removeAttachment(id, attachmentId);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Aprovar orçamento e instanciar automaticamente a Ordem de Serviço de execução',
  })
  approveQuote(@Param('id') id: string, @Request() req) {
    return this.quotesService.approveAndCreateWorkOrder(id, req.user.id);
  }
}
