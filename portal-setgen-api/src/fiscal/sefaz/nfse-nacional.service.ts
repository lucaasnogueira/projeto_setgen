import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface RetornoNfse {
  id:        string | null;
  numero:    string | null;
  protocolo: string | null;
  status:    'AUTORIZADA' | 'REJEITADA' | 'PROCESSANDO';
  codigo:    string;
  mensagem:  string;
}

/**
 * Integração com o Ambiente de Dados Nacional (ADN) da RFB para NFS-e.
 * API REST – Documentação: https://www.nfse.gov.br/EmissorNacional/
 *
 * Sandbox: https://sandbox.nfse.gov.br/v1
 * Produção: https://api.nfse.gov.br/v1
 */
const BASE_URLS = {
  PRODUCAO:    'https://api.nfse.gov.br/v1',
  HOMOLOGACAO: 'https://sandbox.nfse.gov.br/v1',
};

@Injectable()
export class NfseNacionalService {
  private readonly logger = new Logger(NfseNacionalService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Transmite a NFS-e ao ADN da RFB.
   * O XML deve estar assinado com o certificado A1 do emitente.
   */
  async transmitirNfse(
    xmlAssinado: string,
    ambiente: 'PRODUCAO' | 'HOMOLOGACAO' = 'HOMOLOGACAO',
    accessToken?: string,
  ): Promise<RetornoNfse> {
    const baseUrl = BASE_URLS[ambiente];
    this.logger.log(`Transmitindo NFS-e → ${baseUrl}/nfse`);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/xml; charset=utf-8',
        'Accept':       'application/json',
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const response = await firstValueFrom(
        this.httpService.post(`${baseUrl}/nfse`, xmlAssinado, {
          headers,
          timeout: 30000,
        }),
      );

      const data = response.data;
      return {
        id:        data?.id        ?? null,
        numero:    data?.numero    ?? null,
        protocolo: data?.protocolo ?? null,
        status:    'AUTORIZADA',
        codigo:    '100',
        mensagem:  data?.mensagem  ?? 'NFS-e autorizada com sucesso',
      };
    } catch (err) {
      const respBody = err?.response?.data;
      this.logger.error('Erro ao transmitir NFS-e ao ADN', JSON.stringify(respBody));

      // Tenta extrair mensagens de erro estruturadas (padrão ADN/RFB)
      let msg = 'Erro desconhecido';
      if (respBody) {
        if (respBody.erros && Array.isArray(respBody.erros) && respBody.erros.length > 0) {
          msg = respBody.erros.map((e: any) => `${e.codigo || 'ERR'}: ${e.descricao || e.mensagem}`).join(' | ');
        } else if (respBody.alertas && Array.isArray(respBody.alertas) && respBody.alertas.length > 0) {
          msg = respBody.alertas.map((a: any) => `${a.codigo || 'WRN'}: ${a.descricao || a.mensagem}`).join(' | ');
        } else {
          msg = respBody.mensagem || respBody.message || err?.message || 'Erro de comunicação';
        }
      } else {
        msg = err?.message || 'Falha de conexão com ADN';
      }

      return {
        id:        null,
        numero:    null,
        protocolo: null,
        status:    'REJEITADA',
        codigo:    err?.response?.status?.toString() ?? '500',
        mensagem:  msg,
      };
    }
  }

  /**
   * Consulta uma NFS-e pelo ID retornado na transmissão.
   */
  async consultarNfse(
    id: string,
    ambiente: 'PRODUCAO' | 'HOMOLOGACAO' = 'HOMOLOGACAO',
    accessToken?: string,
  ): Promise<RetornoNfse> {
    const baseUrl = BASE_URLS[ambiente];
    this.logger.log(`Consultando NFS-e ${id} → ${baseUrl}/nfse/${id}`);

    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/nfse/${id}`, { headers, timeout: 15000 }),
      );

      const data = response.data;
      const statusMap: Record<string, RetornoNfse['status']> = {
        AUTORIZADA:   'AUTORIZADA',
        REJEITADA:    'REJEITADA',
        PROCESSANDO:  'PROCESSANDO',
      };

      return {
        id:        data?.id        ?? id,
        numero:    data?.numero    ?? null,
        protocolo: data?.protocolo ?? null,
        status:    statusMap[data?.status] ?? 'PROCESSANDO',
        codigo:    '100',
        mensagem:  data?.mensagem  ?? '',
      };
    } catch (err) {
      this.logger.error('Erro ao consultar NFS-e no ADN', err?.message);
      return { id, numero: null, protocolo: null, status: 'REJEITADA', codigo: '500', mensagem: err?.message };
    }
  }

  /**
   * Cancela uma NFS-e no ADN.
   */
  async cancelarNfse(
    id: string,
    motivo: string,
    ambiente: 'PRODUCAO' | 'HOMOLOGACAO' = 'HOMOLOGACAO',
    accessToken?: string,
  ): Promise<{ sucesso: boolean; mensagem: string }> {
    const baseUrl = BASE_URLS[ambiente];
    this.logger.log(`Cancelando NFS-e ${id}`);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept:         'application/json',
      };
      if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

      await firstValueFrom(
        this.httpService.delete(`${baseUrl}/nfse/${id}`, {
          headers,
          data:    { motivo },
          timeout: 15000,
        }),
      );

      return { sucesso: true, mensagem: 'NFS-e cancelada com sucesso' };
    } catch (err) {
      return { sucesso: false, mensagem: err?.response?.data?.mensagem ?? err?.message };
    }
  }
}
