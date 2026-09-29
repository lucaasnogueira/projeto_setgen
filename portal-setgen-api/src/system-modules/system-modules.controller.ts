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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemModulesService } from './system-modules.service';
import { CreateSystemModuleDto } from './dto/create-system-module.dto';
import { UpdateSystemModuleDto } from './dto/update-system-module.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Configurador - Gestão de Módulos')
@Controller('system-modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SystemModulesController {
  constructor(private readonly modulesService: SystemModulesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE, UserRole.TECHNICIAN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Listar todos os macro-módulos do sistema' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean })
  findAll(@Query('onlyActive') onlyActive?: string) {
    const filterActive = onlyActive === 'true' || onlyActive === '1';
    return this.modulesService.findAll(filterActive);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Obter detalhes de um módulo específico' })
  findOne(@Param('id') id: string) {
    return this.modulesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cadastrar novo módulo (Apenas ADMIN)' })
  create(@Body() dto: CreateSystemModuleDto) {
    return this.modulesService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualizar módulo existente (Apenas ADMIN)' })
  update(@Param('id') id: string, @Body() dto: UpdateSystemModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Alternar status ativo/inativo do módulo' })
  toggleStatus(@Param('id') id: string) {
    return this.modulesService.toggleStatus(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir módulo (Apenas ADMIN)' })
  remove(@Param('id') id: string) {
    return this.modulesService.remove(id);
  }
}
