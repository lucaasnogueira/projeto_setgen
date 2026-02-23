import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateASODto } from './dto/create-aso.dto';
import { CreateEmployeeDocumentDto } from './dto/create-document.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const existingCpf = await this.prisma.employee.findUnique({
      where: { cpf: createEmployeeDto.cpf },
    });

    if (existingCpf) {
      throw new ConflictException('CPF já cadastrado');
    }

    if (createEmployeeDto.personalEmail) {
      const existingPersonal = await this.prisma.employee.findUnique({
        where: { personalEmail: createEmployeeDto.personalEmail },
      });
      if (existingPersonal) {
        throw new ConflictException('E-mail pessoal já cadastrado');
      }
    }

    if (createEmployeeDto.corporateEmail) {
      const existingCorporate = await this.prisma.employee.findUnique({
        where: { corporateEmail: createEmployeeDto.corporateEmail },
      });
      if (existingCorporate) {
        throw new ConflictException('E-mail corporativo já cadastrado');
      }
    }

    if (createEmployeeDto.registration) {
      const existingRegistration = await this.prisma.employee.findUnique({
        where: { registration: createEmployeeDto.registration },
      });
      if (existingRegistration) {
        throw new ConflictException('Matrícula já cadastrada');
      }
    }

    const { birthDate, admissionDate, ...rest } = createEmployeeDto;

    return this.prisma.employee.create({
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : null,
        admissionDate: admissionDate ? new Date(admissionDate) : null,
      },
    });
  }

  async findAll(status?: string, pagination?: PaginationQueryDto) {
    const { page = 1, limit = 20 } = pagination || {};
    const where = status ? { status: status as any } : {};

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          asos: {
            orderBy: { expiryDate: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        asos: {
          orderBy: { examDate: 'desc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          }
        },
        subordinates: {
          select: {
            id: true,
            name: true,
            position: true,
          }
        },
        movements: {
          orderBy: { date: 'desc' },
        }
      },
    });

    if (!employee) {
      throw new NotFoundException('Funcionário não encontrado');
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    await this.findOne(id);

    const { birthDate, admissionDate, ...rest } = updateEmployeeDto;

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        admissionDate: admissionDate ? new Date(admissionDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' },
    });
  }

  async createASO(createASODto: CreateASODto, fileUrl?: string) {
    const { employeeId, examDate, expiryDate, ...rest } = createASODto;

    // Se expiryDate não for fornecida, calcula 1 ano após examDate
    const calculatedExpiry = expiryDate
      ? new Date(expiryDate)
      : new Date(new Date(examDate).setFullYear(new Date(examDate).getFullYear() + 1));

    return this.prisma.aSO.create({
      data: {
        ...rest,
        examDate: new Date(examDate),
        expiryDate: calculatedExpiry,
        fileUrl,
        employee: { connect: { id: employeeId } },
      },
    });
  }

  async findASOsByEmployee(employeeId: string, pagination?: PaginationQueryDto) {
    const { page = 1, limit = 20 } = pagination || {};
    const where = { employeeId };

    const [asos, total] = await Promise.all([
      this.prisma.aSO.findMany({
        where,
        orderBy: { examDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aSO.count({ where }),
    ]);

    return {
      data: asos,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createDocument(createDocumentDto: CreateEmployeeDocumentDto, fileUrl: string) {
    const { employeeId, ...rest } = createDocumentDto;

    return this.prisma.employeeDocument.create({
      data: {
        ...rest,
        fileUrl,
        employee: { connect: { id: employeeId } },
      },
    });
  }

  async findDocumentsByEmployee(employeeId: string, pagination?: PaginationQueryDto) {
    const { page = 1, limit = 20 } = pagination || {};
    const where = { employeeId };

    const [documents, total] = await Promise.all([
      this.prisma.employeeDocument.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.employeeDocument.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExpiringASOs(daysAhead: number = 30) {
    const today = new Date();
    const limitDate = new Date();
    limitDate.setDate(today.getDate() + daysAhead);

    return this.prisma.aSO.findMany({
      where: {
        expiryDate: {
          gte: today,
          lte: limitDate,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  async removeASO(id: string) {
    return this.prisma.aSO.delete({
      where: { id },
    });
  }

  async removeDocument(id: string) {
    return this.prisma.employeeDocument.delete({
      where: { id },
    });
  }
}
