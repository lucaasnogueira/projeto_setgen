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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ServiceOrderStatus, ServiceOrderType } from '@prisma/client';

@ApiTags('Service Orders')
@Controller('service-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN,
    UserRole.ADMINISTRATIVE,
  )
  @ApiOperation({ summary: 'Criar nova Ordem de Serviço' })
  create(@Body() createServiceOrderDto: CreateServiceOrderDto, @Request() req) {
    return this.serviceOrdersService.create(createServiceOrderDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as Ordens de Serviço' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'status', enum: ServiceOrderStatus, required: false })
  @ApiQuery({ name: 'type', enum: ServiceOrderType, required: false })
  @ApiQuery({ name: 'createdById', required: false })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('status') status?: ServiceOrderStatus,
    @Query('type') type?: ServiceOrderType,
    @Query('createdById') createdById?: string,
  ) {
    return this.serviceOrdersService.findAll({
      clientId,
      status,
      type,
      createdById,
    });
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
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TECHNICIAN,
    UserRole.ADMINISTRATIVE,
  )
  @ApiOperation({ summary: 'Atualizar Ordem de Serviço' })
  update(
    @Param('id') id: string,
    @Body() updateServiceOrderDto: UpdateServiceOrderDto,
    @Request() req,
  ) {
    return this.serviceOrdersService.update(
      id,
      updateServiceOrderDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar status da OS (aprovar/rejeitar)' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.serviceOrdersService.updateStatus(
      id,
      updateStatusDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/progress/:progress')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Atualizar progresso da OS (0-100)' })
  updateProgress(@Param('id') id: string, @Param('progress') progress: string) {
    return this.serviceOrdersService.updateProgress(id, parseInt(progress));
  }

  @Post(':id/attachments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Adicionar anexos à OS' })
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: diskStorage({
        destination: './uploads/service-orders',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `os-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  @ApiConsumes('multipart/form-data')
  addAttachments(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const attachments = files.map((file) => file.path);
    return this.serviceOrdersService.addAttachments(id, attachments);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar OS (apenas ADMIN)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.serviceOrdersService.remove(id, req.user.role);
  }
}
