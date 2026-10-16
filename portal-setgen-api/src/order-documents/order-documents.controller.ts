import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OrderDocumentsService } from './order-documents.service';
import { CreateOrderDocumentDto } from './dto/create-order-document.dto';
import { UpdateOrderDocumentDto } from './dto/update-order-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DocumentType, DocumentStatus } from '@prisma/client';

@ApiTags('Documentos de Ordem de Serviço e SGQ')
@Controller('order-documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderDocumentsController {
  constructor(private readonly documentsService: OrderDocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo documento técnico/SGQ vinculado a uma OS' })
  create(@Body() dto: CreateOrderDocumentDto, @Request() req: any) {
    return this.documentsService.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os documentos com filtros' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'serviceOrderId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: DocumentType })
  @ApiQuery({ name: 'status', required: false, enum: DocumentStatus })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('type') type?: DocumentType,
    @Query('status') status?: DocumentStatus,
    @Query('search') search?: string,
  ) {
    return this.documentsService.findAll({
      clientId,
      serviceOrderId,
      type,
      status,
      search,
    });
  }

  @Get('order/:serviceOrderId')
  @ApiOperation({ summary: 'Listar documentos de uma Ordem de Serviço específica' })
  findByOrder(@Param('serviceOrderId') serviceOrderId: string) {
    return this.documentsService.findByOrder(serviceOrderId);
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Listar todos os documentos (dossiê) de um Cliente específico' })
  findByClient(@Param('clientId') clientId: string) {
    return this.documentsService.findByClient(clientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter detalhes de um documento por ID' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados ou status de um documento' })
  update(@Param('id') id: string, @Body() dto: UpdateOrderDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir um documento' })
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}

