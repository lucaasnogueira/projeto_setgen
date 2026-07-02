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
import { ChecklistTemplatesService } from './checklist-templates.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { UpdateChecklistTemplateDto } from './dto/update-checklist-template.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ServiceOrderType } from '@prisma/client';

@ApiTags('Checklist Templates')
@ApiBearerAuth()
@Controller('checklist-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChecklistTemplatesController {
  constructor(
    private readonly checklistTemplatesService: ChecklistTemplatesService,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar template de checklist' })
  create(@Body() dto: CreateChecklistTemplateDto) {
    return this.checklistTemplatesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar templates de checklist' })
  @ApiQuery({ name: 'serviceOrderType', required: false, enum: ServiceOrderType })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(
    @Query('serviceOrderType') serviceOrderType?: ServiceOrderType,
    @Query('active') active?: string,
  ) {
    const filter = active === undefined ? undefined : active === 'true';
    return this.checklistTemplatesService.findAll(serviceOrderType, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  findOne(@Param('id') id: string) {
    return this.checklistTemplatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar template de checklist' })
  update(@Param('id') id: string, @Body() dto: UpdateChecklistTemplateDto) {
    return this.checklistTemplatesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover template de checklist' })
  remove(@Param('id') id: string) {
    return this.checklistTemplatesService.remove(id);
  }
}
