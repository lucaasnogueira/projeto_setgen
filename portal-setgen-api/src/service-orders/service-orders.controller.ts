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
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ServiceOrderStatus } from '@prisma/client';

@ApiTags('Service Orders')
@Controller('service-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Gerar Ordem de Serviço a partir de um orçamento aceito (ACCEPTED)' })
  create(@Body() dto: CreateServiceOrderDto, @Request() req) {
    return this.serviceOrdersService.createFromQuote(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Ordens de Serviço' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', enum: ServiceOrderStatus, required: false })
  @ApiQuery({ name: 'createdById', required: false })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('status') status?: ServiceOrderStatus,
    @Query('createdById') createdById?: string,
  ) {
    return this.serviceOrdersService.findAll({ clientId, status, createdById });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obter estatísticas das OS' })
  getStatistics() {
    return this.serviceOrdersService.getStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar OS por ID' })
  findOne(@Param('id') id: string) {
    return this.serviceOrdersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar Ordem de Serviço' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceOrderDto,
    @Request() req,
  ) {
    return this.serviceOrdersService.update(id, dto, req.user.id, req.user.role);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar status da OS (materiais/execução/conclusão)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @Request() req) {
    return this.serviceOrdersService.updateStatus(id, dto, req.user.id, req.user.role);
  }

  @Patch(':id/payment-status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Dar baixa manual de recebimento da OS (controle interno, até integração Conta Azul)' })
  updatePaymentStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.serviceOrdersService.updatePaymentStatus(id, dto.paymentStatus);
  }

  @Patch(':id/progress/:progress')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Atualizar progresso da OS (0-100)' })
  updateProgress(
    @Param('id') id: string,
    @Param('progress', ParseIntPipe) progress: number,
    @Request() req,
  ) {
    return this.serviceOrdersService.updateProgress(
      id,
      progress,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/attachments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Adicionar anexos à OS' })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './uploads/service-orders',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `os-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  addAttachments(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[]) {
    const attachments = files.map((file) => file.path);
    return this.serviceOrdersService.addAttachments(id, attachments);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar OS (apenas ADMIN)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.serviceOrdersService.remove(id, req.user.role);
  }

  @Post(':id/visits/:visitId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Vincular visita técnica adicional à OS' })
  linkVisit(@Param('id') id: string, @Param('visitId') visitId: string) {
    return this.serviceOrdersService.linkVisit(id, visitId);
  }

  @Delete(':id/visits/:visitId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Desvincular visita técnica da OS' })
  unlinkVisit(@Param('id') id: string, @Param('visitId') visitId: string) {
    return this.serviceOrdersService.unlinkVisit(id, visitId);
  }

  @Get(':id/audit-log')
  @ApiOperation({ summary: 'Histórico de alterações da OS (audit log)' })
  getAuditLog(@Param('id') id: string) {
    return this.serviceOrdersService.getAuditLog(id);
  }

  @Get(':id/client-view')
  @ApiOperation({ summary: 'Visão do Cliente (OS Digital externa e escopo acordado)' })
  getClientView(@Param('id') id: string) {
    return this.serviceOrdersService.getClientView(id);
  }

  @Post(':id/client-signature')
  @ApiOperation({ summary: 'Coleta de assinatura digital do cliente na OS' })
  collectSignature(
    @Param('id') id: string,
    @Body()
    dto: {
      signerName: string;
      signerDocument: string;
      signatureImageUrl: string;
      ipAddress?: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    return this.serviceOrdersService.collectClientSignature(id, dto);
  }

  @Get(':id/internal-view')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Visão Interna da OS (apuração de horas, KM, custos e rentabilidade)' })
  getInternalView(@Param('id') id: string) {
    return this.serviceOrdersService.getInternalView(id);
  }

  @Post(':id/expenses')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Lançar despesa operacional direta da OS (alimentação, pedágio, combustível)' })
  addExpense(
    @Param('id') id: string,
    @Body() dto: { description: string; amount: number; categoryName?: string },
    @Request() req,
  ) {
    return this.serviceOrdersService.addExpenseToOrder(id, req.user.id, dto);
  }

  @Post(':id/start-displacement')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Registrar início de deslocamento operacional' })
  startDisplacement(
    @Param('id') id: string,
    @Request() req,
    @Body() data: { latitude?: number; longitude?: number; odometerKm?: number; notes?: string },
  ) {
    return this.serviceOrdersService.startDisplacement(id, req.user.id, data);
  }

  @Post(':id/checkin')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Registrar check-in operacional na OS' })
  checkin(
    @Param('id') id: string,
    @Request() req,
    @Body() data: { latitude?: number; longitude?: number; notes?: string },
  ) {
    return this.serviceOrdersService.checkin(id, req.user.id, data);
  }

  @Post(':id/checkout')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Registrar check-out operacional e baixa de estoque' })
  checkout(
    @Param('id') id: string,
    @Request() req,
    @Body()
    data: {
      latitude?: number;
      longitude?: number;
      odometerKm?: number;
      notes?: string;
      totalKmTraveled?: number;
    },
  ) {
    return this.serviceOrdersService.checkout(id, req.user.id, data);
  }

  @Patch(':id/km')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar quilometragem rodada da OS' })
  updateKm(@Param('id') id: string, @Body() body: { km: number }) {
    return this.serviceOrdersService.updateKm(id, Number(body.km));
  }

  @Patch(':id/hours')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar horas trabalhadas da OS' })
  updateWorkedHours(@Param('id') id: string, @Body() body: { hours: number }) {
    return this.serviceOrdersService.updateWorkedHours(id, Number(body.hours));
  }

  // --- MULTI-CRUD: DESPESAS DE CAMPO ---
  @Patch(':id/expenses/:expenseId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar despesa operacional da OS' })
  updateExpense(
    @Param('id') id: string,
    @Param('expenseId') expenseId: string,
    @Body() dto: { description?: string; amount?: number; categoryName?: string },
  ) {
    return this.serviceOrdersService.updateExpense(id, expenseId, dto);
  }

  @Delete(':id/expenses/:expenseId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Excluir despesa operacional da OS' })
  deleteExpense(@Param('id') id: string, @Param('expenseId') expenseId: string) {
    return this.serviceOrdersService.deleteExpense(id, expenseId);
  }

  // --- MULTI-CRUD: PEÇAS & MATERIAIS (CMV) ---
  @Post(':id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar produto/material à OS' })
  addItem(
    @Param('id') id: string,
    @Body() dto: { productId: string; quantity: number; unitPrice: number },
  ) {
    return this.serviceOrdersService.addItemToOrder(id, dto);
  }

  @Patch(':id/items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar produto/material da OS' })
  updateItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() dto: { quantity?: number; unitPrice?: number },
  ) {
    return this.serviceOrdersService.updateOrderItem(id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover produto/material da OS' })
  deleteItem(@Param('id') id: string, @Param('itemId') itemId: string) {
    return this.serviceOrdersService.deleteOrderItem(id, itemId);
  }

  // --- MULTI-CRUD: SERVIÇOS TÉCNICOS ---
  @Post(':id/services')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar serviço técnico à OS' })
  addService(
    @Param('id') id: string,
    @Body() dto: { serviceId: string; quantity: number; unitPrice: number; scopeObservation?: string },
  ) {
    return this.serviceOrdersService.addServiceToOrder(id, dto);
  }

  @Patch(':id/services/:serviceId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar serviço técnico da OS' })
  updateService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @Body() dto: { quantity?: number; unitPrice?: number; scopeObservation?: string },
  ) {
    return this.serviceOrdersService.updateOrderService(id, serviceId, dto);
  }

  @Delete(':id/services/:serviceId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover serviço técnico da OS' })
  deleteService(@Param('id') id: string, @Param('serviceId') serviceId: string) {
    return this.serviceOrdersService.deleteOrderService(id, serviceId);
  }

  // --- MULTI-CRUD: MÃO DE OBRA & DESLOCAMENTO (LOGS DETALHADOS) ---
  @Post(':id/labor-logs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar registro de mão de obra técnica na OS' })
  addLaborLog(
    @Param('id') id: string,
    @Body() dto: { userId: string; hours: number; hourlyRate: number; description: string },
    @Request() req,
  ) {
    return this.serviceOrdersService.addLaborLog(id, req.user.id, dto);
  }

  @Delete(':id/execution-logs/:logId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Remover log operacional (mão de obra ou deslocamento) da OS' })
  deleteExecutionLog(@Param('id') id: string, @Param('logId') logId: string) {
    return this.serviceOrdersService.deleteExecutionLog(id, logId);
  }

  @Post(':id/displacement-logs')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar trecho de deslocamento/frota na OS' })
  addDisplacementLog(
    @Param('id') id: string,
    @Body() dto: { route: string; km: number; kmRate: number; notes?: string },
    @Request() req,
  ) {
    return this.serviceOrdersService.addDisplacementLog(id, req.user.id, dto);
  }
}
