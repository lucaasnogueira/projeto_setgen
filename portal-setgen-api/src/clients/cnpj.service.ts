import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AxiosError } from 'axios';

export interface CnpjData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  ddd_telefone_1?: string;
  email?: string;
}

interface BrasilApiError {
  message?: string;
}

@Injectable()
export class CnpjService {
  private readonly apiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get<string>(
      'CNPJ_API_URL',
      'https://brasilapi.com.br/api/cnpj/v1',
    );
  }

  validateCnpj(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');

    if (cleanCnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleanCnpj)) return false;

    let sum = 0;
    let pos = 5;
    for (let i = 0; i < 12; i++) {
      sum += Number(cleanCnpj.charAt(i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number(cleanCnpj.charAt(12))) return false;

    sum = 0;
    pos = 6;
    for (let i = 0; i < 13; i++) {
      sum += Number(cleanCnpj.charAt(i)) * pos--;
      if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== Number(cleanCnpj.charAt(13))) return false;

    return true;
  }

  async fetchCnpjData(cnpj: string): Promise<CnpjData> {
    const cleanCnpj = cnpj.replace(/[^\d]/g, '');

    if (!this.validateCnpj(cleanCnpj)) {
      throw new BadRequestException('CNPJ inválido');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<CnpjData>(`${this.apiUrl}/${cleanCnpj}`).pipe(
          catchError((error: AxiosError<BrasilApiError>) => {
            console.error('BrasilAPI error:', error.response?.data);

            if (error.response?.status === 404) {
              throw new BadRequestException('CNPJ não encontrado');
            }

            throw new BadRequestException(
              error.response?.data?.message ??
                'Erro ao consultar CNPJ. Tente novamente.',
            );
          }),
        ),
      );

      return response.data;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        'Erro ao consultar CNPJ. Serviço indisponível.',
      );
    }
  }

  formatCnpjData(data: CnpjData) {
    return {
      cnpjCpf: data.cnpj,
      companyName: data.razao_social,
      tradeName: data.nome_fantasia || data.razao_social,
      address: {
        cep: data.cep,
        street: data.logradouro,
        number: data.numero,
        complement: data.complemento || '',
        neighborhood: data.bairro,
        city: data.municipio,
        state: data.uf,
      },
      phone: data.ddd_telefone_1 || '',
      email: data.email || '',
      contacts: [],
    };
  }
}
