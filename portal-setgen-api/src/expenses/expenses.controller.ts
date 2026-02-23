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
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { FilterExpenseDto } from './dto/filter-expense.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('expenses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ADMINISTRATIVE,
    UserRole.TECHNICIAN,
  )
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    try {
      console.log('📝 Creating expense with data:', JSON.stringify(createExpenseDto, null, 2));
      console.log('👤 User ID:', req.user.id);
      return await this.expensesService.create(createExpenseDto, req.user.id);
    } catch (error) {
      console.error('❌ Error creating expense:', error);
      console.error('📋 Request body:', JSON.stringify(createExpenseDto, null, 2));
      throw error;
    }
  }

  @Get('bank-accounts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  getBankAccounts() {
    return this.expensesService.getBankAccounts();
  }

  @Get()
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ADMINISTRATIVE,
    UserRole.TECHNICIAN,
  )
  findAll(@Query() filters: FilterExpenseDto) {
    return this.expensesService.findAll(filters);
  }

  @Get('dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  getDashboard(@Query('year') year: string, @Query('month') month: string) {
    return this.expensesService.getDashboardData(
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ADMINISTRATIVE,
    UserRole.TECHNICIAN,
  )
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ADMINISTRATIVE)
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  approve(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @Request() req,
  ) {
    return this.expensesService.approve(id, req.user.id, comments);
  }

  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.expensesService.reject(id, req.user.id, reason);
  }

  @Post(':id/pay')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  markAsPaid(
    @Param('id') id: string,
    @Body('paymentDate') paymentDate: string,
    @Body('paidAmount') paidAmount?: number,
  ) {
    return this.expensesService.markAsPaid(
      id,
      new Date(paymentDate),
      paidAmount,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
