import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { UpdateInvoiceStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, InvoiceStatus } from '@prisma/client';

@ApiTags('Invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Criar nova Nota Fiscal (com upload de XML e PDF)' })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'xml', maxCount: 1 },
        { name: 'pdf', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/invoices',
          filename: (req, file, callback) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const prefix = file.fieldname === 'xml' ? 'nf-xml' : 'nf-pdf';
            callback(null, `${prefix}-${uniqueSuffix}${ext}`);
          },
        }),
        fileFilter: (req, file, callback) => {
          if (file.fieldname === 'xml' && !file.originalname.match(/\.xml$/)) {
            return callback(
              new BadRequestException('Arquivo XML deve ter extensão .xml'),
              false,
            );
          }
          if (file.fieldname === 'pdf' && !file.originalname.match(/\.pdf$/)) {
            return callback(
              new BadRequestException('Arquivo PDF deve ter extensão .pdf'),
              false,
            );
          }
          callback(null, true);
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
        },
      },
    ),
  )
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createInvoiceDto: CreateInvoiceDto,
    @UploadedFiles()
    files: {
      xml?: Express.Multer.File[];
      pdf?: Express.Multer.File[];
    },
    @Request() req,
  ) {
    const fileUrls = {
      xml: files?.xml?.[0]?.path,
      pdf: files?.pdf?.[0]?.path,
    };

    return this.invoicesService.create(createInvoiceDto, fileUrls, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Notas Fiscais' })
  @ApiQuery({ name: 'serviceOrderId', required: false })
  @ApiQuery({ name: 'purchaseOrderId', required: false })
  @ApiQuery({ name: 'status', enum: InvoiceStatus, required: false })
  findAll(
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('purchaseOrderId') purchaseOrderId?: string,
    @Query('status') status?: InvoiceStatus,
  ) {
    return this.invoicesService.findAll({
      serviceOrderId,
      purchaseOrderId,
      status,
    });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Obter estatísticas das Notas Fiscais' })
  getStatistics() {
    return this.invoicesService.getStatistics();
  }

  @Get('overdue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Listar Notas Fiscais vencidas' })
  getOverdueInvoices() {
    return this.invoicesService.getOverdueInvoices();
  }

  @Get('due-soon')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Listar Notas Fiscais próximas do vencimento' })
  @ApiQuery({ name: 'days', required: false, example: 7 })
  getDueSoon(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days) : 7;
    return this.invoicesService.getDueSoon(daysAhead);
  }

  @Post('check-overdue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Verificar e marcar NFs vencidas' })
  checkOverdueInvoices() {
    return this.invoicesService.checkOverdueInvoices();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar Nota Fiscal por ID' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar Nota Fiscal' })
  update(
    @Param('id') id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
    @Request() req,
  ) {
    return this.invoicesService.update(
      id,
      updateInvoiceDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar status da Nota Fiscal' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateStatus(id, updateStatusDto);
  }

  @Post(':id/mark-as-paid')
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Marcar Nota Fiscal como paga' })
  markAsPaid(@Param('id') id: string) {
    return this.invoicesService.markAsPaid(id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Cancelar Nota Fiscal' })
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar Nota Fiscal (apenas ADMIN)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.role);
  }
}
