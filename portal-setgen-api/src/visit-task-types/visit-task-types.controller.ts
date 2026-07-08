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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VisitTaskTypesService } from './visit-task-types.service';
import { CreateVisitTaskTypeDto } from './dto/create-visit-task-type.dto';
import { UpdateVisitTaskTypeDto } from './dto/update-visit-task-type.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Visit Task Types')
@ApiBearerAuth()
@Controller('visit-task-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VisitTaskTypesController {
  constructor(private readonly visitTaskTypesService: VisitTaskTypesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar tipo de tarefa de visita' })
  create(@Body() dto: CreateVisitTaskTypeDto) {
    return this.visitTaskTypesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de tarefa de visita' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('active') active?: string) {
    return this.visitTaskTypesService.findAll(
      active === undefined ? undefined : active === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar tipo de tarefa por ID' })
  findOne(@Param('id') id: string) {
    return this.visitTaskTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar tipo de tarefa' })
  update(@Param('id') id: string, @Body() dto: UpdateVisitTaskTypeDto) {
    return this.visitTaskTypesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover tipo de tarefa' })
  remove(@Param('id') id: string) {
    return this.visitTaskTypesService.remove(id);
  }
}
