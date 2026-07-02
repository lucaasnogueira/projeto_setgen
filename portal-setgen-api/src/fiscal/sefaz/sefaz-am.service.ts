import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';
import * as forge from 'node-forge';
import { parseStringPromise } from 'xml2js';

interface RetornoSefaz {
  protocolo:  string | null;
  cStat:      string;
  xMotivo:    string;
  nRec:       string | null;   // número do recibo (lote assíncrono)
  xmlRetorno: string;
  autorizada: boolean;
}

/**
 * Endpoints SEFAZ-AM (Amazonas) — NF-e layout 4.00
 * https://www.sefaz.am.gov.br/nfe
 */
const ENDPOINTS = {
  PRODUCAO: {
    autorizacao:    'https://nfe.sefaz.am.gov.br/services2/services/NfeAutorizacao4',
    retAutorizacao: 'https://nfe.sefaz.am.gov.br/services2/services/NfeRetAutorizacao4',
    evento:         'https://nfe.sefaz.am.gov.br/services2/services/RecepcaoEvento4',
    consulta:       'https://nfe.sefaz.am.gov.br/services2/services/NfeConsulta4',
  },
  HOMOLOGACAO: {
    autorizacao:    'https://homnfe.sefaz.am.gov.br/services2/services/NfeAutorizacao4',
    retAutorizacao: 'https://homnfe.sefaz.am.gov.br/services2/services/NfeRetAutorizacao4',
    evento:         'https://homnfe.sefaz.am.gov.br/services2/services/RecepcaoEvento4',
    consulta:       'https://homnfe.sefaz.am.gov.br/services2/services/NfeConsulta4',
  },
};

// SEFAZ-AM requer sincronismo no lote (indSinc=1) → normalmente retorna direto.
// Mas prevemos polling caso retorne status 103 (processamento assíncrono).
const POLL_INTERVAL_MS  = 3_000;
const POLL_MAX_ATTEMPTS = 5;

@Injectable()
export class SefazAmService {
  private readonly logger = new Logger(SefazAmService.name);

  constructor(private readonly httpService: HttpService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Autorização de NF-e
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Transmite um lote com uma NF-e assinada para a SEFAZ-AM.
   *
   * Com mTLS (certificado A1 no httpsAgent) + parser XML robusto (xml2js).
   * Trata automaticamente lotes assíncronos (cStat 103) via polling.
   */
  async transmitirNfe(
    xmlAssinado:  string,
    ambiente:     'PRODUCAO' | 'HOMOLOGACAO' = 'HOMOLOGACAO',
    numero:       string,
    serie:        string,
    pfxBase64?:   string,
    pfxPassword?: string,
  ): Promise<RetornoSefaz> {
    const endpoint = ENDPOINTS[ambiente].autorizacao;
    this.logger.log(`Transmitindo NF-e nº ${numero} → ${endpoint}`);

    let httpsAgent: https.Agent;
    try {
      httpsAgent = this.resolveHttpsAgent(ambiente, pfxBase64, pfxPassword);
    } catch (err) {
      return this.erroRetorno(err.message);
    }

    const soapEnv = this.buildEnvioLote(xmlAssinado, numero, ambiente);

    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, soapEnv, {
          headers: this.soapHeaders('NFeAutorizacao4', 'nfeAutorizacaoLote'),
          httpsAgent,
          timeout: 30_000,
        }),
      );

      const retorno = await this.parseSoapRetorno(response.data);

      // cStat 103 = lote recebido, processamento assíncrono → polling
      if (retorno.cStat === '103' && retorno.nRec) {
        this.logger.log(`Lote assíncrono (103), recibo: ${retorno.nRec}. Iniciando polling...`);
        return await this.aguardarProcessamento(retorno.nRec, ambiente, httpsAgent);
      }

      return retorno;
    } catch (err) {
      this.logger.error('Erro ao transmitir NF-e para SEFAZ-AM', err?.message);
      if (err?.response?.data) {
        this.logger.error('Resposta da SEFAZ (corpo):', err.response.data);
      }
      
      let msg = err?.message || 'Erro desconhecido';
      let cStat = 'ERR';

      if (msg.includes('bad certificate')) {
        msg = 'Certificado Digital Rejeitado (bad certificate). Verifique se o certificado PFX é válido, se a senha está correta e se ele está autorizado para o ambiente de Homologação.';
        cStat = '999'; // Usamos 999 para indicar erro técnico tratável
      } else if (msg.includes('EPROTO') || msg.includes('SSL')) {
        msg = `Erro de Camada SSL/TLS: ${msg}. Verifique a conexão segura com a SEFAZ.`;
      }

      return this.erroRetorno(msg, cStat);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Cancelamento
  // ──────────────────────────────────────────────────────────────────────────

  async cancelarNfe(
    chaveAcesso:  string,
    protocolo:    string,
    justificativa: string,
    ambiente:     'PRODUCAO' | 'HOMOLOGACAO' = 'HOMOLOGACAO',
    pfxBase64?:   string,
    pfxPassword?: string,
  ): Promise<RetornoSefaz> {
    if (justificativa.length < 15) {
      return this.erroRetorno('Justificativa deve ter no mínimo 15 caracteres');
    }

    const endpoint = ENDPOINTS[ambiente].evento;
    let httpsAgent: https.Agent;
    try {
      httpsAgent = this.resolveHttpsAgent(ambiente, pfxBase64, pfxPassword);
    } catch (err) {
      return this.erroRetorno(err.message);
    }

    const agora    = new Date().toISOString().slice(0, 19) + '-04:00';
    const cnpjNota = chaveAcesso.slice(6, 20);
    const idEvento = `ID110111${chaveAcesso}01`;

    const xmlEvento = `<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <idLote>1</idLote>
  <evento versao="1.00">
    <infEvento Id="${idEvento}">
      <cOrgao>13</cOrgao>
      <tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb>
      <CNPJ>${cnpjNota}</CNPJ>
      <chNFe>${chaveAcesso}</chNFe>
      <dhEvento>${agora}</dhEvento>
      <tpEvento>110111</tpEvento>
      <nSeqEvento>1</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>Cancelamento</descEvento>
        <nProt>${protocolo}</nProt>
        <xJust>${this.escapeXml(justificativa)}</xJust>
      </detEvento>
    </infEvento>
  </evento>
</envEvento>`;

    const xmlNfeLimpio = xmlEvento.replace(/^<\?xml.*?\?>/i, '').trim();
    const soapEnv = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4">${xmlNfeLimpio}</nfeDadosMsg></soap12:Body></soap12:Envelope>`;

    this.logger.log(`Cancelando NF-e ${chaveAcesso.slice(0, 10)}...`);

    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, soapEnv, {
          headers:    this.soapHeaders('NFeRecepcaoEvento4', 'nfeRecepcaoEvento'),
          httpsAgent,
          timeout:    30_000,
        }),
      );
      return await this.parseSoapRetorno(response.data);
    } catch (err) {
      this.logger.error('Erro ao cancelar NF-e na SEFAZ-AM', err?.message);
      return this.erroRetorno(err?.message);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Consulta de protocolo
  // ──────────────────────────────────────────────────────────────────────────

  async consultarProtocolo(
    chaveAcesso:  string,
    ambiente:     'PRODUCAO' | 'HOMOLOGACAO' = 'HOMOLOGACAO',
    pfxBase64?:   string,
    pfxPassword?: string,
  ): Promise<RetornoSefaz> {
    const endpoint = ENDPOINTS[ambiente].consulta;
    let httpsAgent: https.Agent;
    try {
      httpsAgent = this.resolveHttpsAgent(ambiente, pfxBase64, pfxPassword);
    } catch (err) {
      return this.erroRetorno(err.message);
    }

    const soapEnv = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsulta4"><consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb><xServ>CONSULTAR</xServ><chNFe>${chaveAcesso}</chNFe></consSitNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(endpoint, soapEnv, {
          headers:    this.soapHeaders('NFeConsulta4', 'nfeConsultaNF'),
          httpsAgent,
          timeout:    15_000,
        }),
      );
      return await this.parseSoapRetorno(response.data);
    } catch (err) {
      return this.erroRetorno(err?.message);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Polling para lote assíncrono (cStat 103)
  // ──────────────────────────────────────────────────────────────────────────

  private async aguardarProcessamento(
    nRec:       string,
    ambiente:   'PRODUCAO' | 'HOMOLOGACAO',
    httpsAgent: https.Agent,
  ): Promise<RetornoSefaz> {
    const endpoint = ENDPOINTS[ambiente].retAutorizacao;

    for (let i = 1; i <= POLL_MAX_ATTEMPTS; i++) {
      await this.sleep(POLL_INTERVAL_MS);
      this.logger.log(`Polling recibo ${nRec} — tentativa ${i}/${POLL_MAX_ATTEMPTS}`);

      const soapEnv = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4"><consReciNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${ambiente === 'PRODUCAO' ? '1' : '2'}</tpAmb><nRec>${nRec}</nRec></consReciNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;

      try {
        const response = await firstValueFrom(
          this.httpService.post(endpoint, soapEnv, {
            headers:    this.soapHeaders('NFeRetAutorizacao4', 'nfeRetAutorizacaoLote'),
            httpsAgent,
            timeout:    15_000,
          }),
        );
        const retorno = await this.parseSoapRetorno(response.data);

        // 104 = lote processado; qualquer outro status final sai do loop
        if (retorno.cStat !== '103') return retorno;
      } catch (err) {
        this.logger.warn(`Erro no polling tentativa ${i}: ${err?.message}`);
      }
    }

    return this.erroRetorno(`Timeout: SEFAZ-AM não processou o lote após ${POLL_MAX_ATTEMPTS} tentativas`);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // mTLS — Agent HTTPS com certificado cliente A1
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Resolve o https.Agent a usar para uma chamada à SEFAZ.
   *
   * Regra de segurança: só desabilita a validação do certificado do servidor
   * (rejectUnauthorized: false) em HOMOLOGACAO sem certificado configurado —
   * nunca em PRODUCAO. Se faltar certificado em PRODUCAO, falha fechado
   * (lança erro) em vez de degradar a segurança da conexão silenciosamente.
   */
  private resolveHttpsAgent(
    ambiente: 'PRODUCAO' | 'HOMOLOGACAO',
    pfxBase64?: string,
    pfxPassword?: string,
  ): https.Agent {
    if (pfxBase64 && pfxPassword) {
      return this.buildMtlsAgent(pfxBase64, pfxPassword);
    }

    if (ambiente === 'PRODUCAO') {
      throw new Error(
        'Certificado digital (.pfx) obrigatório para emissão em ambiente de PRODUÇÃO. Configure CERT_PFX_PATH e CERT_PFX_PASSWORD.',
      );
    }

    this.logger.warn(
      'Sem certificado configurado — usando agente HTTPS sem validação de certificado do servidor (permitido apenas em HOMOLOGACAO).',
    );
    return new https.Agent({ rejectUnauthorized: false });
  }

  /**
   * Constrói um https.Agent com o certificado A1 (.pfx) configurado
   * para mutual TLS, como exige a SEFAZ em produção. Valida o certificado
   * do servidor normalmente (rejectUnauthorized: true) — não deve ser
   * enfraquecido, já que aqui já temos um certificado cliente real.
   */
  private buildMtlsAgent(pfxBase64: string, pfxPassword: string): https.Agent {
    const pfxDer = forge.util.decode64(pfxBase64);
    const pfxAsn1 = forge.asn1.fromDer(pfxDer);
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, pfxPassword);

    // Extrai par de chaves e certificado
    const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag });

    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0];
    const certBag = certBags[forge.pki.oids.certBag]?.[0];

    if (!keyBag?.key || !certBag?.cert) {
      throw new Error('Não foi possível extrair chave ou certificado do PFX');
    }

    const keyPem = forge.pki.privateKeyToPem(keyBag.key);
    const certPem = forge.pki.certificateToPem(certBag.cert);

    return new https.Agent({
      key: keyPem,
      cert: certPem,
      // Algumas SEFAZ exigem a cadeia completa (CA). Se necessário, extrair outros certBags.
      rejectUnauthorized: true,
    });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Parser SOAP robusto com xml2js
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Converte o XML de retorno SEFAZ em objeto estruturado.
   * Usa xml2js para garantir parsing correto de qualquer variação de namespace.
   */
  private async parseSoapRetorno(xmlRetorno: string): Promise<RetornoSefaz> {
    try {
      const parsed = await parseStringPromise(xmlRetorno, {
        explicitArray: false,
        ignoreAttrs:   false,
        tagNameProcessors: [(name: string) => name.replace(/^[^:]+:/, '')], // remove namespaces
      });

      // Navega pela estrutura do envelope SOAP
      const body       = parsed?.Envelope?.Body ?? parsed?.['soap:Envelope']?.['soap:Body'] ?? {};
      const retEnvio   = this.deepFind(body, 'retEnviNFe') ?? this.deepFind(body, 'retConsReciNFe');
      const infRec     = this.deepFind(body, 'infRec');
      const protNFe    = this.deepFind(body, 'protNFe');
      const infProt    = protNFe?.infProt ?? this.deepFind(body, 'infProt');

      const cStat   = infProt?.cStat ?? retEnvio?.cStat ?? '999';
      const xMotivo = infProt?.xMotivo ?? retEnvio?.xMotivo ?? 'Resposta não reconhecida';
      const nProt   = infProt?.nProt ?? null;
      const nRec    = infRec?.nRec ?? retEnvio?.infRec?.nRec ?? null;

      return {
        cStat:      String(cStat),
        xMotivo:    String(xMotivo),
        protocolo:  nProt ? String(nProt) : null,
        nRec:       nRec  ? String(nRec)  : null,
        xmlRetorno,
        autorizada: String(cStat) === '100',
      };
    } catch (err) {
      this.logger.error('Falha ao fazer parse do retorno SEFAZ-AM', err?.message);
      // Fallback: extração via regex simples
      return this.parseSoapFallback(xmlRetorno);
    }
  }

  /** Fallback com regex caso o xml2js falhe (XML mal-formado da SEFAZ) */
  private parseSoapFallback(xml: string): RetornoSefaz {
    const cStat    = xml.match(/<cStat>(\d+)<\/cStat>/)?.[1] ?? '999';
    const xMotivo  = xml.match(/<xMotivo>([^<]+)<\/xMotivo>/)?.[1] ?? 'Erro desconhecido';
    const protocolo = xml.match(/<nProt>([^<]+)<\/nProt>/)?.[1] ?? null;
    const nRec     = xml.match(/<nRec>([^<]+)<\/nRec>/)?.[1] ?? null;
    return { cStat, xMotivo, protocolo, nRec, xmlRetorno: xml, autorizada: cStat === '100' };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────────────────────────────────

  private buildEnvioLote(xmlNfe: string, numero: string, ambiente: 'PRODUCAO' | 'HOMOLOGACAO'): string {
    const idLote = Date.now().toString().slice(-15);
    const xmlNfeLimpio = xmlNfe.replace(/^<\?xml.*?\?>/i, '').trim();
    return `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4"><enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${idLote}</idLote><indSinc>1</indSinc>${xmlNfeLimpio}</enviNFe></nfeDadosMsg></soap12:Body></soap12:Envelope>`;
  }

  private soapHeaders(service: string, action: string): Record<string, string> {
    return {
      'Content-Type': `application/soap+xml; charset=utf-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/${service}/${action}"`,
    };
  }

  private erroRetorno(mensagem: string, cStat = 'ERR'): RetornoSefaz {
    return { cStat, xMotivo: mensagem, protocolo: null, nRec: null, xmlRetorno: '', autorizada: false };
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;')
      .replace(/"/g,  '&quot;')
      .replace(/'/g,  '&apos;');
  }

  /** Busca recursiva em objeto aninhado por uma chave (ignora namespaces) */
  private deepFind(obj: object, key: string): any {
    if (!obj || typeof obj !== 'object') return undefined;
    for (const k of Object.keys(obj)) {
      const cleanKey = k.replace(/^[^:]+:/, '');
      if (cleanKey === key) return obj[k];
      const found = this.deepFind(obj[k], key);
      if (found !== undefined) return found;
    }
    return undefined;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
