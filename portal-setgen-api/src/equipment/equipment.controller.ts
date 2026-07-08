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
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';
import { EquipmentType } from '@prisma/client';

@ApiTags('Equipment')
@Controller('equipment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @RequiredPermissions(PERMISSIONS.EQUIPMENT_MANAGE)
  @ApiOperation({ summary: 'Cadastrar novo equipamento' })
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @RequiredPermissions(PERMISSIONS.EQUIPMENT_VIEW, PERMISSIONS.EQUIPMENT_MANAGE)
  @ApiOperation({ summary: 'Listar equipamentos' })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'type', enum: EquipmentType, required: false })
  findAll(
    @Query('clientId') clientId?: string,
    @Query('type') type?: EquipmentType,
  ) {
    return this.equipmentService.findAll({ clientId, type });
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.EQUIPMENT_VIEW, PERMISSIONS.EQUIPMENT_MANAGE)
  @ApiOperation({ summary: 'Buscar equipamento por ID' })
  findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.EQUIPMENT_MANAGE)
  @ApiOperation({ summary: 'Atualizar equipamento' })
  update(
    @Param('id') id: string,
    @Body() updateEquipmentDto: UpdateEquipmentDto,
  ) {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @RequiredPermissions(PERMISSIONS.EQUIPMENT_MANAGE)
  @ApiOperation({ summary: 'Remover equipamento' })
  remove(@Param('id') id: string) {
    return this.equipmentService.remove(id);
  }
}
