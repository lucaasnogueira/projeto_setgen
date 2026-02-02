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
  UseInterceptors,
  UploadedFiles,
  Request,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Visits')
@Controller('visits')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Criar nova visita técnica' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/visits',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `visit-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|doc|docx)$/)) {
          return callback(
            new Error('Apenas imagens e documentos são permitidos'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createVisitDto: CreateVisitDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const attachments = files ? files.map((file) => file.path) : [];
    return this.visitsService.create(createVisitDto, attachments);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as visitas técnicas' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'technicianId', required: false })
  @ApiQuery({ name: 'visitType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('technicianId') technicianId?: string,
    @Query('visitType') visitType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.visitsService.findAll({
      clientId,
      technicianId,
      visitType,
      startDate,
      endDate,
    });
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Buscar visitas de um cliente específico' })
  findByClient(@Param('clientId') clientId: string) {
    return this.visitsService.findByClient(clientId);
  }

  @Get('technician/:technicianId')
  @ApiOperation({ summary: 'Buscar visitas de um técnico específico' })
  findByTechnician(@Param('technicianId') technicianId: string) {
    return this.visitsService.findByTechnician(technicianId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar visita técnica por ID' })
  findOne(@Param('id') id: string) {
    return this.visitsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Atualizar visita técnica' })
  update(
    @Param('id') id: string,
    @Body() updateVisitDto: UpdateVisitDto,
    @Request() req,
  ) {
    return this.visitsService.update(
      id,
      updateVisitDto,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/attachments')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Adicionar anexos a uma visita' })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads/visits',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `visit-attachment-${uniqueSuffix}${ext}`);
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
    return this.visitsService.addAttachments(id, attachments);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deletar visita técnica (apenas ADMIN)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.visitsService.remove(id, req.user.id, req.user.role);
  }
}
