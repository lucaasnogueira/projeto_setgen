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
import { extname } from 'path';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateASODto } from './dto/create-aso.dto';
import { CreateEmployeeDocumentDto } from './dto/create-document.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, EmployeeStatus } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('Employees')
@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar novo funcionário' })
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @Get()
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
  @ApiOperation({ summary: 'Listar ASOs próximos do vencimento' })
  @ApiQuery({ name: 'days', required: false, example: 30 })
  getExpiringASOs(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days) : 30;
    return this.employeesService.getExpiringASOs(daysAhead);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar funcionário por ID' })
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar funcionário' })
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Desativar funcionário' })
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  // --- ASO Endpoints ---

  @Post(':id/asos')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar ASO ao funcionário (com upload)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/employees/asos',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `aso-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|jpg|jpeg|png)$/)) {
          return callback(new BadRequestException('Apenas arquivos PDF ou imagens são permitidos'), false);
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  createASO(
    @Param('id') id: string,
    @Body() createASODto: CreateASODto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.employeesService.createASO(createASODto, file?.path);
  }

  @Get(':id/asos')
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
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remover ASO' })
  removeASO(@Param('asoId') asoId: string) {
    return this.employeesService.removeASO(asoId);
  }

  // --- Document Endpoints ---

  @Post(':id/documents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Adicionar documento ao funcionário (com upload)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/employees/documents',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `doc-${uniqueSuffix}${ext}`);
        },
      }),
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
    return this.employeesService.createDocument(createDocumentDto, file.path);
  }

  @Get(':id/documents')
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
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remover documento' })
  removeDocument(@Param('docId') docId: string) {
    return this.employeesService.removeDocument(docId);
  }
}
