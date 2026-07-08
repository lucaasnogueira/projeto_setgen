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
import { FailureCategoriesService } from './failure-categories.service';
import { CreateFailureCategoryDto } from './dto/create-failure-category.dto';
import { UpdateFailureCategoryDto } from './dto/update-failure-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Failure Categories')
@ApiBearerAuth()
@Controller('failure-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FailureCategoriesController {
  constructor(private readonly failureCategoriesService: FailureCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Criar categoria de falha' })
  create(@Body() dto: CreateFailureCategoryDto) {
    return this.failureCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias de falha' })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@Query('active') active?: string) {
    return this.failureCategoriesService.findAll(
      active === undefined ? undefined : active === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria de falha por ID' })
  findOne(@Param('id') id: string) {
    return this.failureCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Atualizar categoria de falha' })
  update(@Param('id') id: string, @Body() dto: UpdateFailureCategoryDto) {
    return this.failureCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Remover categoria de falha' })
  remove(@Param('id') id: string) {
    return this.failureCategoriesService.remove(id);
  }
}
