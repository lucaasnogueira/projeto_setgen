import { Injectable } from '@nestjs/common';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * NfeChaveService
 *
 * Gera a Chave de Acesso da NF-e com 44 dígitos conforme
 * Nota Técnica 2011.005 (Padrão de Formação da Chave de Acesso da NF-e):
 *
 *   cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + série(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)
 *   Total = 44 dígitos
 *
 * O dígito verificador (cDV) é calculado pelo algoritmo módulo 11
 * com pesos 2 a 9 repetidos da direita para a esquerda.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class NfeChaveService {
  private static readonly COD_UF: Record<string, string> = {
    AC: '12', AL: '27', AP: '16', AM: '13', BA: '29',
    CE: '23', DF: '53', ES: '32', GO: '52', MA: '21',
    MT: '51', MS: '50', MG: '31', PA: '15', PB: '25',
    PR: '41', PE: '26', PI: '22', RJ: '33', RN: '24',
    RS: '43', RO: '11', RR: '14', SC: '42', SP: '35',
    SE: '28', TO: '17',
  };

  /**
   * Gera a chave de acesso completa de 44 dígitos para a NF-e.
   *
   * @param uf         – sigla do estado do emitente (ex: 'AM')
   * @param cnpjEmit   – CNPJ do emitente (apenas dígitos, 14 chars)
   * @param serie      – série da NF-e (3 dígitos, ex: '001')
   * @param numero     – número da NF-e (9 dígitos)
   * @param tpEmis     – tipo de emissão ('1'=normal, '6'=contingência FS-DA, etc.)
   * @param dataEmissao – data de emissão (Date object)
   */
  gerar(
    uf: string,
    cnpjEmit: string,
    serie: string,
    numero: string,
    tpEmis: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '9' = '1',
    dataEmissao: Date = new Date(),
  ): string {
    const cUF  = NfeChaveService.COD_UF[uf.toUpperCase()] ?? '13'; // default AM
    const aamm = this.formatAAMM(dataEmissao);
    const cnpj = cnpjEmit.replace(/\D/g, '').padEnd(14, '0').slice(0, 14);
    const mod  = '55';                                  // Modelo 55 = NF-e
    const ser  = serie.replace(/\D/g, '').padStart(3, '0').slice(0, 3);
    const nNF  = numero.replace(/\D/g, '').padStart(9, '0').slice(0, 9);
    const cNF  = this.gerarCNF();                       // 8 dígitos aleatórios

    // Chave sem cDV (43 dígitos)
    const base43 = `${cUF}${aamm}${cnpj}${mod}${ser}${nNF}${tpEmis}${cNF}`;

    if (base43.length !== 43) {
      throw new Error(
        `Chave base inválida: esperado 43 dígitos, gerado ${base43.length} — "${base43}"`,
      );
    }

    const cDV = this.calcularCDV(base43);
    return `${base43}${cDV}`;
  }

  /**
   * Calcula o dígito verificador pelo algoritmo Módulo 11.
   * Especificação: NT 2011.005 SEFAZ — pesos 2 a 9, repetindo da direita.
   * Resultado: se resto < 2 → cDV = 0, senão cDV = 11 - resto.
   */
  calcularCDV(chave43: string): string {
    const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
    let soma = 0;

    for (let i = chave43.length - 1, p = 0; i >= 0; i--, p++) {
      soma += Number(chave43[i]) * pesos[p % pesos.length];
    }

    const resto = soma % 11;
    return String(resto < 2 ? 0 : 11 - resto);
  }

  /**
   * Monta o campo AAMM (Ano-Mês de emissão, 4 dígitos).
   * Exemplo: new Date('2026-02-23') → '2602'
   */
  private formatAAMM(data: Date): string {
    const ano = String(data.getFullYear()).slice(2); // 2 últimos dígitos
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    return `${ano}${mes}`;
  }

  /**
   * Gera o cNF: 8 dígitos aleatórios (código numérico da NF-e).
   * ATENÇÃO: em produção, persistir o cNF junto com o número da nota
   * para evitar duplicidade e garantir rastreabilidade.
   */
  private gerarCNF(): string {
    return String(Math.floor(Math.random() * 90_000_000) + 10_000_000);
  }

  /**
   * Monta o atributo Id usado na assinatura XMLDSIG.
   * Formato: "NFe" + chave44
   */
  gerarId(chave44: string): string {
    return `NFe${chave44}`;
  }

  /**
   * Valida se uma chave de acesso existente é íntegra (dígito verificador correto).
   */
  validar(chave44: string): boolean {
    if (!/^\d{44}$/.test(chave44)) return false;
    const cDVCalculado = this.calcularCDV(chave44.slice(0, 43));
    return cDVCalculado === chave44[43];
  }
}
