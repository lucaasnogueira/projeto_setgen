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
import { ExpenseCategoriesService } from './expense-categories.service';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, ExpenseCategoryType, ExpenseGroup } from '@prisma/client';

@ApiTags('Expense Categories')
@ApiBearerAuth()
@Controller('expense-categories')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Criar categoria de despesa' })
  create(@Body() dto: CreateExpenseCategoryDto) {
    return this.expenseCategoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorias de despesa' })
  @ApiQuery({ name: 'type', required: false, enum: ExpenseCategoryType })
  @ApiQuery({ name: 'group', required: false, enum: ExpenseGroup })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(
    @Query('type') type?: ExpenseCategoryType,
    @Query('group') group?: ExpenseGroup,
    @Query('active') active?: string,
  ) {
    const filter = active === undefined ? undefined : active === 'true';
    return this.expenseCategoriesService.findAll(type, group, filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar categoria de despesa por ID' })
  findOne(@Param('id') id: string) {
    return this.expenseCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  @ApiOperation({ summary: 'Atualizar categoria de despesa' })
  update(@Param('id') id: string, @Body() dto: UpdateExpenseCategoryDto) {
    return this.expenseCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Remover ou desativar categoria de despesa' })
  remove(@Param('id') id: string) {
    return this.expenseCategoriesService.remove(id);
  }
}
