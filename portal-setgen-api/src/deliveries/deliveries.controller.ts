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
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DeliveriesService } from './deliveries.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Deliveries')
@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Registrar entrega e aceite (com evidências e assinatura)',
  })
  @UseInterceptors(
    FilesInterceptor('evidences', 20, {
      storage: diskStorage({
        destination: './uploads/deliveries',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `evidence-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|mp4|mov)$/)) {
          callback(null, false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por arquivo
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createDeliveryDto: CreateDeliveryDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    const evidences = files ? files.map((file) => file.path) : [];
    // Assinatura será adicionada separadamente via endpoint dedicado
    return this.deliveriesService.create(
      createDeliveryDto,
      evidences,
      undefined,
      req.user.id,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as entregas' })
  @ApiQuery({ name: 'serviceOrderId', required: false })
  @ApiQuery({ name: 'deliveredById', required: false })
  findAll(
    @Query('serviceOrderId') serviceOrderId?: string,
    @Query('deliveredById') deliveredById?: string,
  ) {
    return this.deliveriesService.findAll({ serviceOrderId, deliveredById });
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obter estatísticas de entregas' })
  getStatistics() {
    return this.deliveriesService.getStatistics();
  }

  @Get('service-order/:serviceOrderId')
  @ApiOperation({ summary: 'Buscar entrega por Ordem de Serviço' })
  findByServiceOrder(@Param('serviceOrderId') serviceOrderId: string) {
    return this.deliveriesService.findByServiceOrder(serviceOrderId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar entrega por ID' })
  findOne(@Param('id') id: string) {
    return this.deliveriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Atualizar entrega' })
  update(
    @Param('id') id: string,
    @Body() updateDeliveryDto: UpdateDeliveryDto,
    @Request() req,
  ) {
    return this.deliveriesService.update(
      id,
      updateDeliveryDto,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/evidences')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Adicionar evidências (fotos/vídeos) à entrega' })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './uploads/deliveries',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `additional-evidence-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  addEvidences(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const evidences = files.map((file) => file.path);
    return this.deliveriesService.addEvidences(id, evidences);
  }

  @Post(':id/signature')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Adicionar assinatura digital de aceite' })
  @UseInterceptors(
    FileInterceptor('signature', {
      storage: diskStorage({
        destination: './uploads/deliveries',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `signature-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          callback(null, false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  addSignature(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.deliveriesService.addSignature(id, file.path);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar entrega (apenas ADMIN)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.deliveriesService.remove(id, req.user.role);
  }
}
