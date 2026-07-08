import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaterialRequestsService } from './material-requests.service';
import { UpdateMaterialRequestDto } from './dto/update-material-request.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';
import { MaterialRequestStatus } from '@prisma/client';

@ApiTags('Material Requests')
@Controller('material-requests')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MaterialRequestsController {
  constructor(private readonly materialRequestsService: MaterialRequestsService) {}

  @Get()
  @RequiredPermissions(PERMISSIONS.MATERIAL_REQUESTS_VIEW, PERMISSIONS.MATERIAL_REQUESTS_MANAGE)
  @ApiOperation({ summary: 'Listar solicitações de material (mesa do almoxarife)' })
  @ApiQuery({ name: 'status', enum: MaterialRequestStatus, required: false })
  findAll(@Query('status') status?: MaterialRequestStatus) {
    return this.materialRequestsService.findAll(status);
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.MATERIAL_REQUESTS_VIEW, PERMISSIONS.MATERIAL_REQUESTS_MANAGE)
  @ApiOperation({ summary: 'Buscar solicitação de material por ID' })
  findOne(@Param('id') id: string) {
    return this.materialRequestsService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.MATERIAL_REQUESTS_MANAGE)
  @ApiOperation({ summary: 'Atualizar prioridade/data prevista' })
  update(@Param('id') id: string, @Body() dto: UpdateMaterialRequestDto) {
    return this.materialRequestsService.update(id, dto);
  }

  @Post(':id/separate')
  @RequiredPermissions(PERMISSIONS.MATERIAL_REQUESTS_MANAGE)
  @ApiOperation({ summary: 'Separar materiais disponíveis em estoque (gera compra para o que faltar)' })
  separate(@Param('id') id: string, @Request() req) {
    return this.materialRequestsService.separate(id, req.user.id);
  }

  @Post(':id/release')
  @RequiredPermissions(PERMISSIONS.MATERIAL_REQUESTS_MANAGE)
  @ApiOperation({ summary: 'Liberar materiais separados para a execução da OS' })
  release(@Param('id') id: string, @Request() req) {
    return this.materialRequestsService.release(id, req.user.id);
  }
}
