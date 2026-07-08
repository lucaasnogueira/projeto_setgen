import { Injectable } from '@nestjs/common';

// ─── Alíquotas fixas 2026 (período de teste – LC 214/2024 art. 430) ──────────
const CBS_ALIQUOTA = 0.9;   // %
const IBS_ALIQUOTA = 0.1;   // %

// ─── Alíquotas legado (regime cumulativo – Simples / Lucro Presumido) ─────────
const PIS_ALIQUOTA     = 0.65; // %
const COFINS_ALIQUOTA  = 3.0;  // %
const ICMS_PADRAO      = 12.0; // % (padrão AM → AM; ZFM pode ser isento)

// ─── CNPJ raiz habilitados na ZFM (exemplo – em produção viria de tabela/BD) ──
// Na prática, consultar a SUFRAMA via API ou manter cache atualizado.
const CNPJ_RAIZ_ZFM_HABILITADOS = new Set([
  '10834008', // exemplo: CNPJ raiz da própria empresa (primeiros 8 dígitos)
]);

// ─── Item de entrada ──────────────────────────────────────────────────────────

export interface ItemCalculoInput {
  ncm: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  fabricadoNaZfm?: boolean;
}

// ─── Interfaces de resultado ──────────────────────────────────────────────────

export interface CalculoItemMercadoria {
  ncm: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  fabricadoNaZfm: boolean;
  // Legado
  icmsAliquota: number;
  valorIcms: number;
  pisAliquota: number;
  valorPis: number;
  cofinsAliquota: number;
  valorCofins: number;
  // Novo 2026
  valorCbs: number;
  valorIbs: number;
  creditoPresumidoZfm: number;
}

export interface ResultadoCalculo {
  // ─── Totais brutos ────────────────────────────────────────
  valorBruto: number; // base de cálculo "por fora"

  // ─── Regime Legado ────────────────────────────────────────
  totalIcms: number;
  totalPis: number;
  totalCofins: number;
  totalImpostoLegado: number;

  // ─── Reforma 2026 ─────────────────────────────────────────
  aliquotaCbs: number;
  totalCbs: number;
  aliquotaIbs: number;
  totalIbs: number;
  totalImposto2026: number;

  // ─── ZFM ──────────────────────────────────────────────────
  beneficioZfmAtivo: boolean;
  creditoPresumidoZfmTotal: number;

  // ─── Split Payment ────────────────────────────────────────
  splitPayment: {
    valorRetido: number;   // IBS + CBS retidos pelo banco
    aliquotaTotal: number; // 1% (período teste)
    descricao: string;
  };

  // ─── Detalhes por item ────────────────────────────────────
  itens: CalculoItemMercadoria[];
}

@Injectable()
export class TaxEngineService {
  /**
   * Ponto de entrada principal.
   * Realiza o cálculo DUAL: legado (ICMS/PIS/COFINS) + novo 2026 (IBS/CBS).
   * O cálculo é sempre "por fora": o imposto NÃO compõe a base de cálculo.
   */
  calcular(itensInput: ItemCalculoInput[], emitenteCnpj: string): ResultadoCalculo {
    const emitenteCnpjRaiz = emitenteCnpj.replace(/\D/g, '').slice(0, 8);
    const emitenteZfm      = this.validarCreditoPresumidoZfm(emitenteCnpjRaiz);

    const itens = itensInput.map((item) => this.calcularItem(item, emitenteZfm));

    // ─── Totais brutos ─────────────────────────────────────
    const valorBruto = itens.reduce((s, i) => s + i.valorTotal, 0);

    // ─── Totais legado ─────────────────────────────────────
    const totalIcms   = itens.reduce((s, i) => s + i.valorIcms, 0);
    const totalPis    = itens.reduce((s, i) => s + i.valorPis, 0);
    const totalCofins = itens.reduce((s, i) => s + i.valorCofins, 0);
    const totalImpostoLegado = totalIcms + totalPis + totalCofins;

    // ─── Totais 2026 (por fora) ─────────────────────────────
    const totalCbs = this.round(valorBruto * (CBS_ALIQUOTA / 100));
    const totalIbs = this.round(valorBruto * (IBS_ALIQUOTA / 100));
    const totalImposto2026 = totalCbs + totalIbs;

    // ─── ZFM – crédito presumido ────────────────────────────
    const creditoPresumidoZfmTotal = itens.reduce(
      (s, i) => s + i.creditoPresumidoZfm,
      0,
    );
    const beneficioZfmAtivo = itens.some((i) => i.fabricadoNaZfm);

    // ─── Split Payment ──────────────────────────────────────
    const splitPayment = {
      valorRetido:   this.round(totalImposto2026),
      aliquotaTotal: CBS_ALIQUOTA + IBS_ALIQUOTA, // 1%
      descricao:
        `CBS (${CBS_ALIQUOTA}%) + IBS (${IBS_ALIQUOTA}%) = ${CBS_ALIQUOTA + IBS_ALIQUOTA}% retidos pelo banco na liquidação`,
    };

    return {
      valorBruto:      this.round(valorBruto),
      totalIcms:       this.round(totalIcms),
      totalPis:        this.round(totalPis),
      totalCofins:     this.round(totalCofins),
      totalImpostoLegado: this.round(totalImpostoLegado),
      aliquotaCbs:         CBS_ALIQUOTA,
      totalCbs:            totalCbs,
      aliquotaIbs:         IBS_ALIQUOTA,
      totalIbs:            totalIbs,
      totalImposto2026:    this.round(totalImposto2026),
      beneficioZfmAtivo,
      creditoPresumidoZfmTotal: this.round(creditoPresumidoZfmTotal),
      splitPayment,
      itens,
    };
  }

  // ─── Cálculo por item de mercadoria ───────────────────────────────────────

  private calcularItem(item: ItemCalculoInput, emitenteZfm: boolean): CalculoItemMercadoria {
    const valorTotal = this.round(item.quantidade * item.valorUnitario);
    const naZfm      = item.fabricadoNaZfm === true;

    // ICMS: ZFM → isento (Decreto Lei 288/67 + RICMS-AM)
    const icmsAliquota = naZfm ? 0 : ICMS_PADRAO;
    const valorIcms    = this.round(valorTotal * (icmsAliquota / 100));

    // PIS / COFINS legado (cumulativo)
    const pisAliquota    = PIS_ALIQUOTA;
    const valorPis       = this.round(valorTotal * (pisAliquota / 100));
    const cofinsAliquota = COFINS_ALIQUOTA;
    const valorCofins    = this.round(valorTotal * (cofinsAliquota / 100));

    // CBS/IBS 2026: por fora
    const valorCbs = this.round(valorTotal * (CBS_ALIQUOTA / 100));
    const valorIbs = this.round(valorTotal * (IBS_ALIQUOTA / 100));

    /**
     * Crédito Presumido ZFM (LC 214/2024, art. 430 e ss. – período teste):
     * Empresas habilitadas em Manaus mantêm crédito equivalente ao IBS+CBS
     * sobre os produtos fabricados na ZFM.
     * Fórmula: creditoPresumido = (IBS + CBS) do item, desde que fabricado na ZFM
     *          E o emitente seja habilitado pela SUFRAMA.
     */
    const creditoPresumidoZfm =
      naZfm && emitenteZfm
        ? this.round(valorCbs + valorIbs)
        : 0;

    return {
      ncm:           item.ncm,
      descricao:     item.descricao,
      quantidade:    item.quantidade,
      valorUnitario: item.valorUnitario,
      valorTotal,
      fabricadoNaZfm: naZfm,
      icmsAliquota,
      valorIcms,
      pisAliquota,
      valorPis,
      cofinsAliquota,
      valorCofins,
      valorCbs,
      valorIbs,
      creditoPresumidoZfm,
    };
  }

  /**
   * Valida se o CNPJ raiz do emitente está habilitado na Zona Franca de Manaus.
   *
   * Em produção: substituir este método por uma chamada à API da SUFRAMA
   * (https://www.suframa.gov.br/novo/web_services) ou consulta a tabela interna
   * atualizada periodicamente.
   *
   * @param cnpjRaiz – Primeiros 8 dígitos do CNPJ (ex: "10834008")
   */
  validarCreditoPresumidoZfm(cnpjRaiz: string): boolean {
    return CNPJ_RAIZ_ZFM_HABILITADOS.has(cnpjRaiz);
  }

  private round(value: number): number {
    return Math.round(value * 10000) / 10000; // 4 casas decimais
  }
}
