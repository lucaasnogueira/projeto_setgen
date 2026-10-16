"use client";

import React from "react";
import { PurchaseOrder } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { formatDateBR } from "@/lib/date";
import { Award } from "lucide-react";

interface PurchaseOrderDocumentSheetProps {
  order: PurchaseOrder;
}

export function PurchaseOrderDocumentSheet({ order }: PurchaseOrderDocumentSheetProps) {
  const items = Array.isArray(order.items) ? order.items : [];
  const totalAmount =
    order.totalAmount ||
    order.value ||
    items.reduce(
      (acc, it) => acc + (Number(it.quantity || 1) * Number(it.unitPrice || 0)),
      0
    );

  return (
    <div
      id="printable-report"
      className="w-full bg-white text-gray-900 shadow-xl rounded-xl p-6 sm:p-10 space-y-5 text-xs sm:text-sm font-sans border border-gray-200 print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:max-w-none print:min-h-0 print:space-y-0"
      style={{ minHeight: "297mm" }}
    >
      {/* =============================================================== */}
      {/* CABEÇALHO OFICIAL SETGEN (IDÊNTICO A DOCUMENTS)                 */}
      {/* =============================================================== */}
      <div className="border-b-2 border-slate-900 pb-5 space-y-3">
        <div className="flex items-start justify-between gap-4">
          {/* Lado Esquerdo: Logo Oficial e Razão Social Real */}
          <div className="flex items-center gap-4">
            <img
              src="/images/setgen-logo.png"
              alt="SETGEN - Serviços Técnicos em Geradores de Energia & Serviços"
              className="h-12 sm:h-14 w-auto object-contain shrink-0"
            />
            <div>
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-950 leading-tight uppercase">
                SETGEN & SERVIÇOS
              </h1>
              <p className="text-[11px] font-bold text-gray-700 tracking-wide mt-0.5">
                R G VIEIRA BENTES
              </p>
              <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                CNPJ: 10.744.400/0001-65 · Manaus / AM · setgen.com.br
              </p>
            </div>
          </div>

          {/* Lado Direito: Caixa do Documento e Identificação Oficial */}
          <div className="text-right shrink-0 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900 text-white font-mono text-xs font-black shadow-2xs">
              <Award className="w-3.5 h-3.5 text-[#E2661D]" />
              <span>{order.orderNumber}</span>
            </div>
            <div className="text-[10px] text-gray-500 font-bold">
              SGQ-SUP-01 · Rev. 02
            </div>
            <div className="text-[11px] font-bold text-gray-800">
              Emissão: {formatDateBR(order.issueDate)}
            </div>
            {order.destination && (
              <div className="text-[10px] font-mono font-bold text-[#E2661D]">
                VINCULADO: {order.destination}
              </div>
            )}
          </div>
        </div>

        {/* Subfaixa de Homologação Integrada */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-medium">
          <span className="font-bold text-gray-700 uppercase tracking-wide">
            AUTORIZAÇÃO DE RETIRADA DE MATERIAIS & PEÇAS
          </span>
          <span className="font-mono text-gray-400">
            Padrão Normativo ABNT / NBR / NR
          </span>
        </div>
      </div>

      {/* =============================================================== */}
      {/* TÍTULO PRINCIPAL FORMAL DO DOCUMENTO                            */}
      {/* =============================================================== */}
      <div className="border-b-2 border-slate-900 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            SUPRIMENTOS & COMPRAS · RETIRADA DE MATERIAIS
          </div>
          <h2 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-950">
            AUTORIZAÇÃO DE RETIRADA / ORDEM DE COMPRA
          </h2>
          <p className="text-xs text-gray-700 font-semibold mt-0.5">
            Loja / Fornecedor: {order.supplierName} · Portador: {order.carrierName}
          </p>
        </div>
        <div className="text-right sm:shrink-0 text-xs font-mono">
          <div className="font-bold text-slate-900 text-sm">
            DOC Nº {order.orderNumber}
          </div>
          <div className="text-gray-500 font-medium text-[11px]">
            Previsão: {order.pickupDate ? formatDateBR(order.pickupDate) : "Imediata"}
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 1. IDENTIFICAÇÃO DO FORNECEDOR E RETIRADA                       */}
      {/* =============================================================== */}
      <div className="space-y-2">
        <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
          1. IDENTIFICAÇÃO DO FORNECEDOR E RETIRADA
        </div>

        <table className="w-full text-xs border border-gray-300">
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                Fornecedor / Loja:
              </td>
              <td className="w-2/6 p-2 font-bold text-gray-900 border-r border-gray-200">
                {order.supplierName}
              </td>
              <td className="w-1/6 p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                Local da Loja:
              </td>
              <td className="w-2/6 p-2 text-gray-900">
                {order.supplierAddress || "Balcão / Loja física"}
              </td>
            </tr>
            <tr>
              <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                Portador Autorizado:
              </td>
              <td className="p-2 font-bold text-gray-900 border-r border-gray-200">
                {order.carrierName} {order.carrierDoc ? `(Doc: ${order.carrierDoc})` : ""}
              </td>
              <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                Aplicação / Destino:
              </td>
              <td className="p-2 font-mono font-bold text-[#E2661D]">
                {order.destination || "Uso Geral da Operação"}
              </td>
            </tr>
            <tr>
              <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                Condição de Pagamento:
              </td>
              <td className="p-2 text-gray-900 border-r border-gray-200">
                {order.paymentMethod || "Boleto Faturado Setgen"}
              </td>
              <td className="p-2 bg-gray-50 font-semibold text-gray-700 border-r border-gray-200">
                Veículo / Placa:
              </td>
              <td className="p-2 text-gray-900">
                {order.carrierVehicle || "Não informado"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* =============================================================== */}
      {/* 2. MATERIAIS E PEÇAS A RETIRAR                                  */}
      {/* =============================================================== */}
      <div className="space-y-2">
        <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
          2. MATERIAIS E PEÇAS A RETIRAR ({items.length})
        </div>

        <table className="w-full text-xs text-left border border-gray-300">
          <thead className="bg-slate-900 text-white font-bold text-[11px]">
            <tr>
              <th className="p-2.5 w-12 text-center border-r border-slate-700">ITEM</th>
              <th className="p-2.5 border-r border-slate-700">DESCRIÇÃO TÉCNICA DO MATERIAL / PEÇA</th>
              <th className="p-2.5 font-mono border-r border-slate-700 w-28">CÓDIGO / REF</th>
              <th className="p-2.5 text-center border-r border-slate-700 w-16">QTD</th>
              <th className="p-2.5 text-center border-r border-slate-700 w-16">UNID</th>
              <th className="p-2.5 text-right border-r border-slate-700 w-28">UNITÁRIO (R$)</th>
              <th className="p-2.5 text-right w-28">SUBTOTAL (R$)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-400 italic">
                  Nenhum item discriminado previamente.
                </td>
              </tr>
            ) : (
              items.map((it, idx) => {
                const qty = Number(it.quantity || 1);
                const price = Number(it.unitPrice || 0);
                const sub = it.total ? Number(it.total) : qty * price;

                return (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2.5 text-center font-bold text-gray-500 border-r border-gray-200">
                      {String(idx + 1).padStart(2, "0")}
                    </td>
                    <td className="p-2.5 font-bold text-gray-900 border-r border-gray-200">
                      {it.description}
                    </td>
                    <td className="p-2.5 font-mono text-gray-600 border-r border-gray-200">
                      {it.code || "—"}
                    </td>
                    <td className="p-2.5 text-center text-gray-900 font-bold border-r border-gray-200">
                      {qty}
                    </td>
                    <td className="p-2.5 text-center text-gray-600 border-r border-gray-200 uppercase">
                      {it.unit || "UN"}
                    </td>
                    <td className="p-2.5 text-right font-mono text-gray-700 border-r border-gray-200">
                      {price > 0 ? formatCurrency(price) : "—"}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                      {sub > 0 ? formatCurrency(sub) : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {totalAmount > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td
                  colSpan={5}
                  className="p-2.5 text-right uppercase tracking-wider text-gray-700 border-r border-gray-200"
                >
                  VALOR TOTAL AUTORIZADO:
                </td>
                <td
                  colSpan={2}
                  className="p-2.5 text-right text-sm font-mono text-gray-950 font-black"
                >
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* =============================================================== */}
      {/* 3. VERIFICAÇÕES E TESTES NA RETIRADA                            */}
      {/* =============================================================== */}
      <div className="space-y-2">
        <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
          3. VERIFICAÇÕES E CONDIÇÕES NA RETIRADA
        </div>

        <div className="border border-gray-300 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            "Material conferido fisicamente quanto a modelo, código e quantidades",
            "Apresentação de documento oficial de identidade com foto pelo portador",
            "Emissão de Nota Fiscal em nome de SETGEN & SERVIÇOS (CNPJ 10.744.400/0001-65)",
            "Envio do arquivo XML e DANFE para fiscal@setgen.com.br",
            "Atesto e assinatura do portador no canhoto / via da loja",
            "Mercadorias acondicionadas com segurança para transporte",
          ].map((v, i) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <span className="w-3.5 h-3.5 border border-slate-900 bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                ✓
              </span>
              <span className="text-gray-800 text-[11px] font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* =============================================================== */}
      {/* 4. INSTRUÇÕES PARA A LOJA & OBSERVAÇÕES                         */}
      {/* =============================================================== */}
      <div className="space-y-1 text-xs">
        <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
          4. INSTRUÇÕES PARA A LOJA & OBSERVAÇÕES
        </div>
        <p className="p-2.5 border border-gray-300 text-gray-800 leading-relaxed">
          {order.notes ||
            "Mercadoria autorizada pela Diretoria de Compras da Setgen. Entregar apenas para o portador identificado acima mediante apresentação de documento com foto."}
        </p>
      </div>

      {/* =============================================================== */}
      {/* 5. DECLARAÇÃO DE RETIRADA E CONFERÊNCIA                         */}
      {/* =============================================================== */}
      <div className="space-y-2 text-xs">
        <div className="border-b border-gray-800 pb-1 text-xs font-bold text-gray-900 uppercase">
          5. DECLARAÇÃO DE RETIRADA E CONFERÊNCIA
        </div>
        <div className="border border-gray-300 p-3 space-y-1.5">
          <p className="text-gray-800 leading-relaxed">
            O portador e a loja declaram que os materiais e peças especificados nesta ordem foram conferidos, atendem às especificações técnicas solicitadas pela SETGEN & SERVIÇOS e foram entregues em perfeito estado de conservação.
          </p>
          <div className="text-right text-xs text-gray-500 font-medium">
            Manaus/AM, {formatDateBR(order.issueDate)}.
          </div>
        </div>
      </div>

      {/* =============================================================== */}
      {/* 6. BLOCO DE ASSINATURAS OFICIAIS (IDÊNTICO A DOCUMENTS)          */}
      {/* =============================================================== */}
      <div className="pt-8 border-t-2 border-slate-900 space-y-6 print:pt-6 break-inside-avoid">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
          {/* Lado Esquerdo: Responsável Técnico / Compras (SETGEN) */}
          <div className="flex flex-col items-center justify-end space-y-2">
            <div className="h-16 w-full flex items-center justify-center" />
            <div className="w-64 border-t border-gray-900" />
            <div className="space-y-0.5 text-xs text-gray-800">
              <p className="font-bold text-gray-900">Rogério Guilherme Vieira Bentes</p>
              <p className="text-[11px] text-gray-500">
                Diretoria de Compras & Operações · SETGEN & SERVIÇOS
              </p>
              <p className="text-[10px] font-mono text-gray-500">
                CNPJ: 10.744.400/0001-65
              </p>
            </div>
          </div>

          {/* Lado Direito: Portador Autorizado */}
          <div className="flex flex-col items-center justify-end space-y-2">
            <div className="h-16 w-full flex items-center justify-center" />
            <div className="w-64 border-t border-gray-900" />
            <div className="space-y-0.5 text-xs text-gray-800">
              <p className="font-bold text-gray-900">{order.carrierName}</p>
              <p className="text-[11px] text-gray-500">
                Portador Autorizado (Retirada de Material)
              </p>
              {order.carrierDoc && (
                <p className="text-[10px] font-mono text-gray-500">
                  Doc: {order.carrierDoc}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Datação e Comarca Simples e Direta */}
        <div className="text-center text-[11px] text-gray-500 pt-2">
          Manaus / AM, {formatDateBR(order.issueDate)}
        </div>
      </div>
    </div>
  );
}
