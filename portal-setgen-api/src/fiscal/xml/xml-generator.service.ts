import { Injectable, Logger } from '@nestjs/common';
import { create } from 'xmlbuilder2';
import { OsDataDto } from '../dto/os-data.dto';
import { ResultadoCalculo } from '../engines/tax-engine.service';
import { NfeChaveService } from './nfe-chave.service';

@Injectable()
export class XmlGeneratorService {
  private readonly logger = new Logger(XmlGeneratorService.name);

  constructor(private readonly nfeChave: NfeChaveService) {}

  /**
   * Gera o XML da NF-e (Modelo 55) para itens de peças/mercadorias.
   * Suporta preenchimento simultâneo dos grupos de impostos legados e 2026
   * conforme layout de transição (NT 2026.001 – versão schema 4.10+).
   */
  /**
   * Gera o XML da NF-e (Modelo 55) para itens de peças/mercadorias.
   * Retorna { xml, chaveAcesso } para que o FiscalService possa
   * persistir a chave antes da assinatura.
   */
  gerarNfe(
    osData: OsDataDto,
    calculo: ResultadoCalculo,
    numero: string,
    serie = '001',
  ): { xml: string; chaveAcesso: string } {
    this.logger.log(`Gerando XML NF-e nº ${numero}`);

    const dataEmissao = new Date();
    // Subtrai 5 minutos para evitar problemas de sincronia de relógio com a SEFAZ
    dataEmissao.setMinutes(dataEmissao.getMinutes() - 5);
    // Manaus é UTC-4, então diminuímos 4 horas do UTC real
    const tzOffset = -4; // horas
    const dataManaus = new Date(dataEmissao.getTime() + (tzOffset * 60 * 60 * 1000));
    // Formato AAAA-MM-DDThh:mm:ss-04:00 prescrito pelo manual
    const agora = dataManaus.toISOString().slice(0, 19) + '-04:00';
    const cnpjEmit   = osData.emitenteCnpj.replace(/\D/g, '');

    // ── Chave de Acesso (44 dígitos + cDV Módulo 11) ─────────────────────────
    const chaveAcesso = this.nfeChave.gerar('AM', cnpjEmit, serie, numero, '1', dataEmissao);
    const cNF = chaveAcesso.slice(35, 43); // posições 35–42 = cNF
    const cDV = chaveAcesso[43];           // último dígito = cDV
    const nfeId = this.nfeChave.gerarId(chaveAcesso); // "NFe" + chave44

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('NFe', { xmlns: 'http://www.portalfiscal.inf.br/nfe' });

    // ── infNFe (Id obrigatório para assinatura XMLDSIG) ──────────────────────
    const infNFe = root.ele('infNFe', { versao: '4.00', Id: nfeId });

    // ── ide ─────────────────────────────────────────────────────────────────
    const ide = infNFe.ele('ide');
    ide.ele('cUF').txt('13'); // 13 = AM
    ide.ele('cNF').txt(cNF);
    ide.ele('natOp').txt('VENDA DE MERCADORIAS');
    ide.ele('mod').txt('55');
    ide.ele('serie').txt(parseInt(serie, 10).toString());
    ide.ele('nNF').txt(parseInt(numero, 10).toString());
    ide.ele('dhEmi').txt(agora);
    ide.ele('tpNF').txt('1');   // 1=saída
    ide.ele('idDest').txt('1'); // 1=Operação interna (AM)
    ide.ele('cMunFG').txt('1302603'); // Manaus
    ide.ele('tpImp').txt('1');  // DANFE normal retrato
    ide.ele('tpEmis').txt('1'); // Emissão normal
    ide.ele('cDV').txt(cDV);   // ← dígito verificador correto (Módulo 11)
    ide.ele('tpAmb').txt(osData.ambiente === 'PRODUCAO' ? '1' : '2');
    ide.ele('finNFe').txt('1'); // NF-e normal
    ide.ele('indFinal').txt('1'); // 1 = Consumidor Final (Obrigatório se indIEDest = 9)
    ide.ele('indPres').txt('1'); // Operação presencial
    ide.ele('indIntermed').txt('0'); // Operação sem intermediador
    ide.ele('procEmi').txt('0');    // Emissão com aplicativo do contribuinte
    ide.ele('verProc').txt('1.0');

    // ── emit ─────────────────────────────────────────────────────────────────
    const emit = infNFe.ele('emit');
    emit.ele('CNPJ').txt(cnpjEmit);
    emit.ele('xNome').txt('SETGEN - SERVICOS DE GERADORES LTDA');
    emit.ele('xFant').txt('SETGEN');
    const endEmit = emit.ele('enderEmit');
    endEmit.ele('xLgr').txt('RUA ACARA');
    endEmit.ele('nro').txt('12');
    endEmit.ele('xBairro').txt('TARUMA');
    endEmit.ele('cMun').txt('1302603');
    endEmit.ele('xMun').txt('MANAUS');
    endEmit.ele('UF').txt('AM');
    endEmit.ele('CEP').txt('69041050');
    endEmit.ele('cPais').txt('1058');
    endEmit.ele('xPais').txt('Brasil');
    endEmit.ele('fone').txt('9230000000');
    emit.ele('IE').txt('042125530'); 
    emit.ele('CRT').txt('1');

    // ── dest ─────────────────────────────────────────────────────────────────
    const dest = infNFe.ele('dest');
    const cnpjDest = osData.clientCnpj.replace(/\D/g, '');
    if (cnpjDest.length === 11) {
      dest.ele('CPF').txt(cnpjDest);
    } else {
      dest.ele('CNPJ').txt(cnpjDest);
    }
    dest.ele('xNome').txt('CLIENTE DESTINATARIO');
    
    // Endereço do Destinatário (Adicionado para evitar Rejeição 726)
    const endDest = dest.ele('enderDest');
    endDest.ele('xLgr').txt('Rua do Cliente');
    endDest.ele('nro').txt('123');
    endDest.ele('xBairro').txt('Centro');
    endDest.ele('cMun').txt('1302603');
    endDest.ele('xMun').txt('Manaus');
    endDest.ele('UF').txt('AM');
    endDest.ele('CEP').txt('69000000');
    endDest.ele('cPais').txt('1058');
    endDest.ele('xPais').txt('Brasil');
    endDest.ele('fone').txt('09200000000');

    dest.ele('indIEDest').txt('9'); // 9=Não Contribuinte, que pode ou não possuir IE

    // ── Produtos e Serviços / detalhamentos ──────────────────────────────────
    let nItem = 1;

    // 1. Peças/Mercadorias
    calculo.itensPecas.forEach((peca) => {
      const det = infNFe.ele('det', { nItem: String(nItem++) });
      const prod = det.ele('prod');

      prod.ele('cProd').txt(String(nItem - 1).padStart(6, '0'));
      prod.ele('cEAN').txt('SEM GTIN');
      prod.ele('xProd').txt(peca.descricao.slice(0, 120));
      prod.ele('NCM').txt(peca.ncm.replace(/\./g, ''));
      prod.ele('CFOP').txt('5102'); // Venda de mercadoria
      prod.ele('uCom').txt('UN');
      prod.ele('qCom').txt(String(peca.quantidade));
      prod.ele('vUnCom').txt(peca.valorUnitario.toFixed(10));
      prod.ele('vProd').txt(peca.valorTotal.toFixed(2));
      prod.ele('cEANTrib').txt('SEM GTIN');
      prod.ele('uTrib').txt('UN');
      prod.ele('qTrib').txt(String(peca.quantidade));
      prod.ele('vUnTrib').txt(peca.valorUnitario.toFixed(10));
      prod.ele('indTot').txt('1');

      // ── imposto ─────────────────────────────────────────────────────────────
      const imp = det.ele('imposto');

      // ICMS
      const icmsGrp = imp.ele('ICMS');
      if (peca.fabricadoNaZfm) {
        const icms40 = icmsGrp.ele('ICMS40');
        icms40.ele('orig').txt('3');
        icms40.ele('CST').txt('40');
      } else {
        const icms00 = icmsGrp.ele('ICMS00');
        icms00.ele('orig').txt('0');
        icms00.ele('CST').txt('00');
        icms00.ele('modBC').txt('3');
        icms00.ele('vBC').txt(peca.valorTotal.toFixed(2));
        icms00.ele('pICMS').txt(peca.icmsAliquota.toFixed(2));
        icms00.ele('vICMS').txt(peca.valorIcms.toFixed(2));
      }

      // PIS
      const pisGrp = imp.ele('PIS');
      const pisAliq = pisGrp.ele('PISAliq');
      pisAliq.ele('CST').txt('01');
      pisAliq.ele('vBC').txt(peca.valorTotal.toFixed(2));
      pisAliq.ele('pPIS').txt(peca.pisAliquota.toFixed(2));
      pisAliq.ele('vPIS').txt(peca.valorPis.toFixed(2));

      // COFINS
      const cofinsGrp = imp.ele('COFINS');
      const cofinsAliq = cofinsGrp.ele('COFINSAliq');
      cofinsAliq.ele('CST').txt('01');
      cofinsAliq.ele('vBC').txt(peca.valorTotal.toFixed(2));
      cofinsAliq.ele('pCOFINS').txt(peca.cofinsAliquota.toFixed(2));
      cofinsAliq.ele('vCOFINS').txt(peca.valorCofins.toFixed(2));

      // IBSCBS (Reforma Tributária 2026 - NT 2025.002)
      const ibscbs = imp.ele('IBSCBS');
      // Apenas adiciona gTribRegular se a operação NÃO for Tributação Integral (000/000001)
      const cstIbscbs = '000';
      const cClassTrib = '000001';
      ibscbs.ele('CST').txt(cstIbscbs);
      ibscbs.ele('cClassTrib').txt(cClassTrib);
      
      const gIbscbs = ibscbs.ele('gIBSCBS');
      gIbscbs.ele('vBC').txt(peca.valorTotal.toFixed(2));
      
      const gIbsUf = gIbscbs.ele('gIBSUF');
      gIbsUf.ele('pIBSUF').txt(calculo.aliquotaIbs.toFixed(2));
      gIbsUf.ele('vIBSUF').txt(peca.valorIbs.toFixed(2));
      
      const gIbsMun = gIbscbs.ele('gIBSMun');
      gIbsMun.ele('pIBSMun').txt('0.00');
      gIbsMun.ele('vIBSMun').txt('0.00');
      
      gIbscbs.ele('vIBS').txt(peca.valorIbs.toFixed(2));
      
      const gCbs = gIbscbs.ele('gCBS');
      gCbs.ele('pCBS').txt(calculo.aliquotaCbs.toFixed(2));
      gCbs.ele('vCBS').txt(peca.valorCbs.toFixed(2));

      if (cstIbscbs !== '000') {
        const gTribRegular = gIbscbs.ele('gTribRegular');
        gTribRegular.ele('CSTReg').txt('000');
        gTribRegular.ele('cClassTribReg').txt('000001');
        gTribRegular.ele('pAliqEfetRegIBSUF').txt(calculo.aliquotaIbs.toFixed(2));
        gTribRegular.ele('vTribRegIBSUF').txt(peca.valorIbs.toFixed(2));
        gTribRegular.ele('pAliqEfetRegIBSMun').txt('0.00');
        gTribRegular.ele('vTribRegIBSMun').txt('0.00');
        gTribRegular.ele('pAliqEfetRegCBS').txt(calculo.aliquotaCbs.toFixed(2));
        gTribRegular.ele('vTribRegCBS').txt(peca.valorCbs.toFixed(2));
      }
      
      if (peca.fabricadoNaZfm && peca.creditoPresumidoZfm > 0) {
        ibscbs.ele('gCredPresIBSZFM').ele('vCredPresumidoIBSZFM').txt(peca.creditoPresumidoZfm.toFixed(4));
      }
    });

    // 2. Serviços (Nota Conjugada)
    calculo.itensServico.forEach((serv, idx) => {
      const det = infNFe.ele('det', { nItem: String(nItem++) });
      const prod = det.ele('prod');

      prod.ele('cProd').txt(`SERV${String(idx + 1).padStart(4, '0')}`);
      prod.ele('cEAN').txt('SEM GTIN');
      prod.ele('xProd').txt(serv.descricao.slice(0, 120));
      prod.ele('NCM').txt('00'); // NCM 00 para serviços em NF-e conjugada
      prod.ele('CFOP').txt('5933'); // Prestação de serviço tributado pelo ISSQN
      prod.ele('uCom').txt('UN');
      prod.ele('qCom').txt(String(serv.quantidade));
      prod.ele('vUnCom').txt(serv.valorUnitario.toFixed(10));
      prod.ele('vProd').txt(serv.valorTotal.toFixed(2));
      prod.ele('cEANTrib').txt('SEM GTIN');
      prod.ele('uTrib').txt('UN');
      prod.ele('qTrib').txt(String(serv.quantidade));
      prod.ele('vUnTrib').txt(serv.valorUnitario.toFixed(10));
      prod.ele('indTot').txt('1');

      const imp = det.ele('imposto');
      
      // ISSQN
      const issqn = imp.ele('ISSQN');
      issqn.ele('vBC').txt(serv.valorTotal.toFixed(2));
      issqn.ele('vAliq').txt(serv.issAliquota.toFixed(2));
      issqn.ele('vISSQN').txt(serv.valorIss.toFixed(2));
      issqn.ele('cMunFG').txt('1302603');
      let codigoServico = osData.itensServico[idx]?.codigoServico || '14.01';
      if (!codigoServico.includes('.')) {
        codigoServico = `${codigoServico.slice(0, 2)}.${codigoServico.slice(2)}`;
      }
      issqn.ele('cListServ').txt(codigoServico);
      // vDeducao, vOutro, vDescIncond, vDescCond, vISSRet são TDec_1302Opc (não permitem 0.00)
      issqn.ele('indISS').txt('1'); // 1=Exigível
      issqn.ele('indIncentivo').txt('2'); // 2=Não
      
      // PIS (Operação sem incidência para serviço em nota conjugada se houver retenção específica)
      const pisGrp = imp.ele('PIS');
      const pisAliq = pisGrp.ele('PISAliq');
      pisAliq.ele('CST').txt('01');
      pisAliq.ele('vBC').txt(serv.valorTotal.toFixed(2));
      pisAliq.ele('pPIS').txt('0.65');
      pisAliq.ele('vPIS').txt((serv.valorTotal * 0.0065).toFixed(2));

      // COFINS
      const cofinsGrp = imp.ele('COFINS');
      const cofinsAliq = cofinsGrp.ele('COFINSAliq');
      cofinsAliq.ele('CST').txt('01');
      cofinsAliq.ele('vBC').txt(serv.valorTotal.toFixed(2));
      cofinsAliq.ele('pCOFINS').txt('3.00');
      cofinsAliq.ele('vCOFINS').txt((serv.valorTotal * 0.03).toFixed(2));

      // IBS / CBS (Reforma Tributária - NT 2025.002)
      const ibscbs = imp.ele('IBSCBS');
      const cstIbscbs = '000';
      const cClassTrib = '000001';
      ibscbs.ele('CST').txt(cstIbscbs);
      ibscbs.ele('cClassTrib').txt(cClassTrib);

      const gIbscbs = ibscbs.ele('gIBSCBS');
      gIbscbs.ele('vBC').txt(serv.valorTotal.toFixed(2));

      const gIbsUf = gIbscbs.ele('gIBSUF');
      gIbsUf.ele('pIBSUF').txt(calculo.aliquotaIbs.toFixed(2));
      gIbsUf.ele('vIBSUF').txt(serv.valorIbs.toFixed(2));

      const gIbsMun = gIbscbs.ele('gIBSMun');
      gIbsMun.ele('pIBSMun').txt('0.00');
      gIbsMun.ele('vIBSMun').txt('0.00');

      gIbscbs.ele('vIBS').txt(serv.valorIbs.toFixed(2));

      const gCbs = gIbscbs.ele('gCBS');
      gCbs.ele('pCBS').txt(calculo.aliquotaCbs.toFixed(2));
      gCbs.ele('vCBS').txt(serv.valorCbs.toFixed(2));

      if (cstIbscbs !== '000') {
        const gTribRegular = gIbscbs.ele('gTribRegular');
        gTribRegular.ele('CSTReg').txt('000');
        gTribRegular.ele('cClassTribReg').txt('000001');
        gTribRegular.ele('pAliqEfetRegIBSUF').txt(calculo.aliquotaIbs.toFixed(2));
        gTribRegular.ele('vTribRegIBSUF').txt(serv.valorIbs.toFixed(2));
        gTribRegular.ele('pAliqEfetRegIBSMun').txt('0.00');
        gTribRegular.ele('vTribRegIBSMun').txt('0.00');
        gTribRegular.ele('pAliqEfetRegCBS').txt(calculo.aliquotaCbs.toFixed(2));
        gTribRegular.ele('vTribRegCBS').txt(serv.valorCbs.toFixed(2));
      }
    });

    // ── total ─────────────────────────────────────────────────────────────────
    const total = infNFe.ele('total');
    const icmsTot = total.ele('ICMSTot');
    icmsTot.ele('vBC').txt(calculo.totalPecas.toFixed(2));
    icmsTot.ele('vICMS').txt(calculo.totalIcms.toFixed(2));
    icmsTot.ele('vICMSDeson').txt('0.00');
    icmsTot.ele('vFCP').txt('0.00');
    icmsTot.ele('vBCST').txt('0.00');
    icmsTot.ele('vST').txt('0.00');
    icmsTot.ele('vFCPST').txt('0.00');
    icmsTot.ele('vFCPSTRet').txt('0.00');
    icmsTot.ele('vProd').txt(calculo.totalPecas.toFixed(2));
    icmsTot.ele('vFrete').txt('0.00');
    icmsTot.ele('vSeg').txt('0.00');
    icmsTot.ele('vDesc').txt('0.00');
    icmsTot.ele('vII').txt('0.00');
    icmsTot.ele('vIPI').txt('0.00');
    icmsTot.ele('vIPIDevol').txt('0.00');
    icmsTot.ele('vPIS').txt(calculo.totalPis.toFixed(2));
    icmsTot.ele('vCOFINS').txt(calculo.totalCofins.toFixed(2));
    icmsTot.ele('vOutro').txt('0.00');
    icmsTot.ele('vNF').txt(calculo.valorBruto.toFixed(2));

    // Totais de ISSQN (Conjugada)
    if (calculo.totalServicos > 0) {
      const issTot = total.ele('ISSQNtot');
      issTot.ele('vServ').txt(calculo.totalServicos.toFixed(2));
      issTot.ele('vBC').txt(calculo.totalServicos.toFixed(2));
      issTot.ele('vISS').txt(calculo.totalIss.toFixed(2));
      issTot.ele('dCompet').txt(new Date().toISOString().slice(0, 10));
      issTot.ele('cRegTrib').txt('1'); // 1=Microempresa Municipal
    }

    // IBS/CBS totais (Reforma Tributária)
    const ibsCbsTot = total.ele('IBSCBSTot');
    ibsCbsTot.ele('vBCIBSCBS').txt(calculo.valorBruto.toFixed(2));
    
    // IBS Total Group
    const gIbs = ibsCbsTot.ele('gIBS');
    
    const gIbsUf = gIbs.ele('gIBSUF');
    gIbsUf.ele('vDif').txt('0.00');
    gIbsUf.ele('vDevTrib').txt('0.00');
    gIbsUf.ele('vIBSUF').txt(calculo.totalIbs.toFixed(2));
    
    const gIbsMun = gIbs.ele('gIBSMun');
    gIbsMun.ele('vDif').txt('0.00');
    gIbsMun.ele('vDevTrib').txt('0.00');
    gIbsMun.ele('vIBSMun').txt('0.00');

    gIbs.ele('vIBS').txt(calculo.totalIbs.toFixed(2));
    gIbs.ele('vCredPres').txt('0.00');
    gIbs.ele('vCredPresCondSus').txt('0.00');
    
    // CBS Total Group
    const gCbs = ibsCbsTot.ele('gCBS');
    gCbs.ele('vDif').txt('0.00');
    gCbs.ele('vDevTrib').txt('0.00');
    gCbs.ele('vCBS').txt(calculo.totalCbs.toFixed(2));
    gCbs.ele('vCredPres').txt('0.00');
    gCbs.ele('vCredPresCondSus').txt('0.00');

    // Grupos Monofásico e Estorno (Obrigatórios no Schema Geral de Totais se validados estritamente no Homolog)
    const gMono = ibsCbsTot.ele('gMono');
    gMono.ele('vIBSMono').txt('0.00');
    gMono.ele('vCBSMono').txt('0.00');
    gMono.ele('vIBSMonoReten').txt('0.00');
    gMono.ele('vCBSMonoReten').txt('0.00');
    gMono.ele('vIBSMonoRet').txt('0.00');
    gMono.ele('vCBSMonoRet').txt('0.00');

    const gEstornoCred = ibsCbsTot.ele('gEstornoCred');
    gEstornoCred.ele('vIBSEstCred').txt('0.00');
    gEstornoCred.ele('vCBSEstCred').txt('0.00');

    // ── transp ────────────────────────────────────────────────────────────────
    const transp = infNFe.ele('transp');
    transp.ele('modFrete').txt('9'); // Sem frete

    // ── pag ──────────────────────────────────────────────────────────────────
    const pag = infNFe.ele('pag');
    const detPag = pag.ele('detPag');
    detPag.ele('tPag').txt('01'); // Dinheiro
    detPag.ele('vPag').txt(calculo.valorBruto.toFixed(2));

    // ── infRespTec ───────────────────────────────────────────────────────────
    const infRespTec = infNFe.ele('infRespTec');
    infRespTec.ele('CNPJ').txt('10744400000165'); // CNPJ da software house
    infRespTec.ele('xContato').txt('Setgen TI');
    infRespTec.ele('email').txt('ti@setgen.com.br');
    infRespTec.ele('fone').txt('09200000000');

    this.logger.log('XML NF-e gerado com sucesso');
    return { xml: root.end({ prettyPrint: false }), chaveAcesso };
  }

  /**
   * Gera o XML da NFS-e Nacional (padrão ABRASF / ADN da RFB) para serviços.
   * Baseado no schema NFSE Nacional versão 1.0 (Resolução CGSN 777/2021).
   */
  gerarNfse(osData: OsDataDto, calculo: ResultadoCalculo, numero: string): string {
    this.logger.log(`Gerando XML NFS-e nº ${numero}`);

    const agora = new Date().toISOString();

    const root = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('CompNfse', {
        xmlns: 'http://www.sped.fazenda.gov.br/nfse',
        versao: '1.00',
      });

    const nfse = root.ele('Nfse');
    const infNfse = nfse.ele('infNfse', { Id: `NFSE${numero}` });

    infNfse.ele('nNFSe').txt(numero.padStart(15, '0'));
    infNfse.ele('cLocEmi').txt('1302603'); // Manaus-AM
    infNfse.ele('tpAmb').txt(osData.ambiente === 'PRODUCAO' ? '1' : '2');
    infNfse.ele('dhEmi').txt(agora);
    infNfse.ele('verAplic').txt('SETGEN-v1.0');

    // Valores do serviço
    const vls = infNfse.ele('Valores');
    vls.ele('vServico').txt(calculo.totalServicos.toFixed(2));
    vls.ele('vDescCondicionado').txt('0.00');
    vls.ele('vDescIncondicionado').txt('0.00');
    // ISS legado
    vls.ele('vISS').txt(calculo.totalIss.toFixed(2));
    // IBS/CBS 2026 por fora
    vls.ele('vCBS').txt(calculo.totalCbs.toFixed(2));
    vls.ele('vIBS').txt(calculo.totalIbs.toFixed(2));
    vls.ele('vLiq').txt(calculo.totalServicos.toFixed(2));

    // Prestador
    const prest = infNfse.ele('Prestador');
    prest.ele('CNPJ').txt(osData.emitenteCnpj.replace(/\D/g, ''));
    prest.ele('cMun').txt('1302603');

    // Tomador
    const tom = infNfse.ele('Tomador');
    const idTom = tom.ele('IdentifTomador');
    const cpfCnpjTom = idTom.ele('CpfCnpj');
    cpfCnpjTom.ele('CNPJ').txt(osData.clientCnpj.replace(/\D/g, ''));

    // Serviços — estrutura correta: cada campo é filho direto de `serv`
    const listServ = infNfse.ele('ListaServicos');
    osData.itensServico.forEach((item, idx) => {
      const serv    = listServ.ele('Servicos');
      const servico = serv.ele('Servico');
      servico.ele('cServTOM').txt(item.codigoServico ?? '14.01');
      servico.ele('xDescServ').txt(item.descricao.slice(0, 2000));
      serv.ele('Qtde').txt(String(item.quantidade));
      serv.ele('vUnitServ').txt(item.valorUnitario.toFixed(2));
      serv.ele('vDesc').txt('0.00');
      serv.ele('vServ').txt(calculo.itensServico[idx].valorTotal.toFixed(2));
      // IBS/CBS 2026 por item de serviço
      const trib    = serv.ele('trib');
      const tribNac = trib.ele('tribNac');
      tribNac.ele('pCBS').txt(calculo.aliquotaCbs.toFixed(2));
      tribNac.ele('vCBS').txt(calculo.itensServico[idx].valorCbs.toFixed(2));
      tribNac.ele('pIBS').txt(calculo.aliquotaIbs.toFixed(2));
      tribNac.ele('vIBS').txt(calculo.itensServico[idx].valorIbs.toFixed(2));
      // ISS legado
      const tribMun = trib.ele('tribMun');
      tribMun.ele('tribISSQN').txt('1'); // 1=exigível
      tribMun.ele('pAliqAplic').txt(calculo.itensServico[idx].issAliquota.toFixed(2));
      tribMun.ele('vISSQN').txt(calculo.itensServico[idx].valorIss.toFixed(2));
    });

    this.logger.log('XML NFS-e gerado com sucesso');
    return root.end({ prettyPrint: false });
  }
}
