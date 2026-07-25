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
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequiredPermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../access-control/permissions.constants';

@Controller('expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @RequiredPermissions(PERMISSIONS.EXPENSES_CREATE)
  async create(@Body() createExpenseDto: CreateExpenseDto, @Request() req) {
    return this.expensesService.create(createExpenseDto, req.user.id);
  }

  @Get('bank-accounts')
  @RequiredPermissions(PERMISSIONS.EXPENSES_VIEW)
  getBankAccounts() {
    return this.expensesService.getBankAccounts();
  }

  @Get()
  @RequiredPermissions(PERMISSIONS.EXPENSES_VIEW)
  findAll(@Query() filters: FilterExpenseDto) {
    return this.expensesService.findAll(filters);
  }

  @Get('dashboard')
  @RequiredPermissions(PERMISSIONS.EXPENSES_VIEW)
  getDashboard(@Query('year') year: string, @Query('month') month: string) {
    return this.expensesService.getDashboardData(
      Number(year) || new Date().getFullYear(),
      Number(month) || new Date().getMonth() + 1,
    );
  }

  @Get(':id')
  @RequiredPermissions(PERMISSIONS.EXPENSES_VIEW)
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @RequiredPermissions(PERMISSIONS.EXPENSES_EDIT)
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Post(':id/approve')
  @RequiredPermissions(PERMISSIONS.EXPENSES_APPROVE)
  approve(
    @Param('id') id: string,
    @Body('comments') comments: string,
    @Request() req,
  ) {
    return this.expensesService.approve(id, req.user.id, comments);
  }

  @Post(':id/reject')
  @RequiredPermissions(PERMISSIONS.EXPENSES_APPROVE)
  reject(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    return this.expensesService.reject(id, req.user.id, reason);
  }

  @Post(':id/pay')
  @RequiredPermissions(PERMISSIONS.EXPENSES_APPROVE)
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
  @RequiredPermissions(PERMISSIONS.EXPENSES_DELETE)
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
