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
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateASODto } from './dto/create-aso.dto';
import { CreateEmployeeDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';
import { EmployeeStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

const EMPLOYEE_UPLOAD_MAX_SIZE = 10 * 1024 * 1024;

function employeeUploadStorage(folder: 'asos' | 'documents', prefix: string) {
  return diskStorage({
    destination: (_req, _file, callback) => {
      const destination = join(process.cwd(), 'uploads', 'employees', folder);
      mkdirSync(destination, { recursive: true });
      callback(null, destination);
    },
    filename: (_req, file, callback) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      callback(null, `${prefix}-${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
    },
  });
}

function employeeDocumentFileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const extension = extname(file.originalname).toLowerCase();
  const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png']);
  const allowedMimeTypes = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
  ]);

  if (!allowedExtensions.has(extension) || !allowedMimeTypes.has(file.mimetype)) {
    callback(new BadRequestException('Envie um arquivo PDF, JPG, JPEG ou PNG.'), false);
    return;
  }

  callback(null, true);
}

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @RequiredPermissions(PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Criar novo funcionário' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
  @RequiredPermissions(PERMISSIONS.RH_VIEW, PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Listar todos os funcionários' })
  @ApiQuery({ name: 'status', enum: EmployeeStatus, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query() pagination?: PaginationQueryDto,
  ) {
    return this.employeesService.findAll(status, pagination);
  }

  @Get('asos/expiring')
  @RequiredPermissions(PERMISSIONS.RH_VIEW, PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Listar ASOs próximos do vencimento' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getExpiringASOs(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days) : 30;
    return this.employeesService.getExpiringASOs(daysAhead);
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.RH_VIEW, PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Buscar funcionário por ID' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Atualizar funcionário' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @RequiredPermissions(PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Desativar funcionário' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  // --- ASO Endpoints ---

  @Post(':id/asos')
  @RequiredPermissions(PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Adicionar ASO ao funcionário (com upload)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: employeeUploadStorage('asos', 'aso'),
      fileFilter: employeeDocumentFileFilter,
      limits: { fileSize: EMPLOYEE_UPLOAD_MAX_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  createASO(
    @Param('id') id: string,
    @Body() createASODto: CreateASODto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('O documento do ASO é obrigatório.');
    }

    return this.employeesService.createASO(
      { ...createASODto, employeeId: id },
      file.path,
    );
  }

  @Get(':id/asos')
  @RequiredPermissions(PERMISSIONS.RH_VIEW, PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Listar ASOs de um funcionário' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findASOs(
    @Param('id') id: string,
    @Query() pagination?: PaginationQueryDto,
  ) {
    return this.employeesService.findASOsByEmployee(id, pagination);
  }

  @Delete('asos/:asoId')
  @RequiredPermissions(PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Remover ASO' })
  removeASO(@Param('asoId') asoId: string) {
    return this.employeesService.removeASO(asoId);
  }

  // --- Document Endpoints ---

  @Post(':id/documents')
  @RequiredPermissions(PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Adicionar documento ao funcionário (com upload)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: employeeUploadStorage('documents', 'doc'),
      fileFilter: employeeDocumentFileFilter,
      limits: { fileSize: EMPLOYEE_UPLOAD_MAX_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  createDocument(
    @Param('id') id: string,
    @Body() createDocumentDto: CreateEmployeeDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Arquivo do documento é obrigatório');
    }
    return this.employeesService.createDocument(
      { ...createDocumentDto, employeeId: id },
      file.path,
    );
  }

  @Get(':id/documents')
  @RequiredPermissions(PERMISSIONS.RH_VIEW, PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Listar documentos de um funcionário' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findDocuments(
    @Param('id') id: string,
    @Query() pagination?: PaginationQueryDto,
  ) {
    return this.employeesService.findDocumentsByEmployee(id, pagination);
  }

  @Delete('documents/:docId')
  @RequiredPermissions(PERMISSIONS.RH_MANAGE)
  @ApiOperation({ summary: 'Remover documento' })
  removeDocument(@Param('docId') docId: string) {
    return this.employeesService.removeDocument(docId);
  }
}
