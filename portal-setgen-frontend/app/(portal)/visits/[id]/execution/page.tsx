"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { visitsApi } from '@/lib/api/visits';
import { TechnicalVisit } from '@/types';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Wrench,
  Camera,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  FileSpreadsheet,
  Save,
  ArrowLeft,
  Upload,
  Printer,
} from 'lucide-react';
import { GeneratorChecklistEditor } from '@/components/visits/GeneratorChecklistEditor';
import { GeneratorChecklistItem, DEFAULT_GENERATOR_CHECKLIST } from '@/lib/checklist-generator-data';
import { SignaturePadModal } from '@/components/common/SignaturePadModal';
import Link from 'next/link';

function autoPopulateVisitData(rawItems: GeneratorChecklistItem[], visitData: TechnicalVisit): GeneratorChecklistItem[] {
  const client = visitData.client;
  const address = client?.address;
  const addressStr = address
    ? `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}`
    : visitData.location || '';
  const cityUf = address?.city ? `${address.city}/${address.state || 'AM'}` : 'Manaus/AM';

  const visitCode = visitData.visitNumber || visitData.externalCode || `VT-${visitData.id.slice(0, 8).toUpperCase()}`;
  const visitDateFormatted = visitData.visitDate ? visitData.visitDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const techName = visitData.technician?.name || (visitData as any).assignedTo?.name || 'Equipe Setgen';

  return rawItems.map((item) => {
    // 1. Visita Nº (Sempre automático do sistema)
    if (item.id === 1) return { ...item, answer: visitCode };
    // 2. Data da visita (Automático do agendamento)
    if (item.id === 2) return { ...item, answer: visitDateFormatted };
    // 3. Cliente (Automático do cadastro)
    if (item.id === 3) return { ...item, answer: client?.companyName || item.answer };
    // 5. CNPJ / CPF (Automático do cadastro)
    if (item.id === 5) return { ...item, answer: client?.cnpjCpf || item.answer };
    // 6. Contato responsável
    if (item.id === 6 && (!item.answer || item.answer.trim() === '')) {
      return { ...item, answer: client?.tradeName || client?.companyName || item.answer };
    }
    // 8. Telefone
    if (item.id === 8 && (!item.answer || item.answer.trim() === '')) {
      return { ...item, answer: client?.phone || item.answer };
    }
    // 9. E-mail
    if (item.id === 9 && (!item.answer || item.answer.trim() === '')) {
      return { ...item, answer: client?.email || item.answer };
    }
    // 10. Endereço da instalação
    if (item.id === 10 && (!item.answer || item.answer.trim() === '')) {
      return { ...item, answer: addressStr || item.answer };
    }
    // 11. Cidade/UF
    if (item.id === 11 && (!item.answer || item.answer.trim() === '')) {
      return { ...item, answer: cityUf || item.answer };
    }
    // 13. Técnico responsável
    if (item.id === 13) return { ...item, answer: techName };

    return item;
  });
}

export default function VisitExecutionPage() {
  const params = useParams();
  const router = useRouter();
  const visitId = params.id as string;

  const [visit, setVisit] = useState<TechnicalVisit | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'fotos' | 'conclusao'>('checklist');

  // Checklist
  const [checklistItems, setChecklistItems] = useState<GeneratorChecklistItem[]>(DEFAULT_GENERATOR_CHECKLIST);

  // Conclusão
  const [result, setResult] = useState<string>('VIABLE');
  const [diagnosisSummary, setDiagnosisSummary] = useState<string>('');
  const [nextSteps, setNextSteps] = useState<string[]>(['Elaborar orçamento executivo']);

  // Assinaturas
  const [technicianSignature, setTechnicianSignature] = useState<string>('');
  const [clientSignature, setClientSignature] = useState<string>('');
  const [clientSignerName, setClientSignerName] = useState<string>('');
  const [clientSignerDocument, setClientSignerDocument] = useState<string>('');
  const [clientSignatureRefused, setClientSignatureRefused] = useState<boolean>(false);
  const [clientRefusalReason, setClientRefusalReason] = useState<string>('');

  // Modais de assinatura
  const [techSigOpen, setTechSigOpen] = useState(false);
  const [clientSigOpen, setClientSigOpen] = useState(false);

  // Novas fotos
  const [newFiles, setNewFiles] = useState<{ file: File; legend: string; id: string }[]>([]);

  useEffect(() => {
    if (visitId) {
      visitsApi.getOne(visitId)
        .then((data) => {
          setVisit(data);

          const baseItems = Array.isArray(data.technicalData?.checklistItems) && data.technicalData.checklistItems.length > 0
            ? data.technicalData.checklistItems
            : DEFAULT_GENERATOR_CHECKLIST;

          // Auto-popula dados óbvios do sistema e do cliente
          const populated = autoPopulateVisitData(baseItems, data);
          setChecklistItems(populated);

          if (data.conclusionData?.result) setResult(data.conclusionData.result);
          if (data.conclusionData?.diagnosisSummary) setDiagnosisSummary(data.conclusionData.diagnosisSummary);
          if (Array.isArray(data.conclusionData?.nextSteps)) setNextSteps(data.conclusionData.nextSteps);

          if (data.technicianSignature) setTechnicianSignature(data.technicianSignature);
          if (data.clientSignature) setClientSignature(data.clientSignature);
          if (data.clientSignerName || data.client?.companyName) {
            setClientSignerName(data.clientSignerName || data.client?.companyName || '');
          }
          if (data.clientSignerDocument) setClientSignerDocument(data.clientSignerDocument);
          if (data.clientSignatureRefused) setClientSignatureRefused(Boolean(data.clientSignatureRefused));
          if (data.clientRefusalReason) setClientRefusalReason(data.clientRefusalReason);
        })
        .catch(() => {
          alert('Erro ao carregar visita técnica');
          router.push(`/visits/${visitId}`);
        })
        .finally(() => setPageLoading(false));
    }
  }, [visitId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files).map((f) => ({
        file: f,
        legend: '',
        id: Math.random().toString(36).substring(2, 9),
      }));
      setNewFiles((prev) => [...prev, ...added]);
    }
  };

  const removeNewFile = (id: string) => {
    setNewFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFileLegend = (id: string, legend: string) => {
    setNewFiles((prev) => prev.map((f) => (f.id === id ? { ...f, legend } : f)));
  };

  const handleSaveReport = async (finalizeVisit: boolean = false) => {
    if (!visit) return;
    setSaving(true);
    try {
      const updatedTechData = {
        ...(visit.technicalData || {}),
        checklistItems,
      };

      const updatedConclusion = {
        ...(visit.conclusionData || {}),
        result,
        diagnosisSummary,
        nextSteps,
      };

      // 1. Atualiza dados estruturados técnicos, conclusão, assinaturas e status
      await visitsApi.update(visit.id, {
        technicalData: updatedTechData,
        conclusionData: updatedConclusion,
        technicianSignature: technicianSignature || undefined,
        clientSignature: clientSignature || undefined,
        clientSignerName: clientSignerName || undefined,
        clientSignerDocument: clientSignerDocument || undefined,
        clientSignatureRefused,
        clientRefusalReason: clientRefusalReason || undefined,
        ...(finalizeVisit ? { status: 'COMPLETED' as any } : {}),
      });

      // 2. Se houver fotos adicionais, faz o upload como anexos
      if (newFiles.length > 0) {
        const fileFormData = new FormData();
        newFiles.forEach((item) => {
          fileFormData.append('files', item.file);
          fileFormData.append('legends', item.legend || 'Evidência Fotográfica');
        });
        await visitsApi.addAttachments(visit.id, fileFormData);
      }

      if (finalizeVisit) {
        alert('Visita finalizada com sucesso! A geração de orçamento comercial está liberada.');
        router.push(`/visits/${visit.id}`);
      } else {
        alert('Relatório Técnico salvo com sucesso!');
        router.push(`/visits/${visit.id}/report`);
      }
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || 'Erro ao salvar relatório técnico');
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E2661D]" />
        <p className="text-xs text-gray-500 font-medium">Carregando dados de campo da visita...</p>
      </div>
    );
  }

  if (!visit) return null;

  const visitCode = visit.visitNumber || visit.externalCode || `VT-${visit.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-6 pb-20">
      {/* Barra de Navegação e Ações Superior (Fixa no topo) */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link href={`/visits/${visit.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="text-gray-700 hover:text-gray-900 border-gray-200 h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para Visita
            </Button>
          </Link>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E2661D]" />
              Preenchimento do Relatório Técnico
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              {visitCode} • {visit.client?.companyName || 'Cliente'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Link href={`/visits/${visit.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 text-xs h-9 px-3 rounded-lg"
            >
              Cancelar
            </Button>
          </Link>
          <Link href={`/visits/${visit.id}/report`}>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold h-9 px-3.5 rounded-lg gap-1.5 shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-[#E2661D]" />
              Visualizar PDF
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => handleSaveReport(false)}
            className="border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold h-9 px-3.5 rounded-lg gap-1.5 shadow-2xs"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>

          <Button
            size="sm"
            disabled={saving}
            onClick={() => handleSaveReport(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-lg gap-1.5 shadow-2xs transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? 'Finalizando...' : 'Salvar e Finalizar Visita'}
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal das Abas */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <TabsList className="bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="checklist" className="text-xs font-semibold gap-1.5">
              <FileSpreadsheet className="h-3.5 w-3.5 text-[#E2661D]" />
              1. Checklist & Medições ({checklistItems.length})
            </TabsTrigger>
            <TabsTrigger value="fotos" className="text-xs font-semibold gap-1.5">
              <Camera className="h-3.5 w-3.5" />
              2. Fotos e Evidências ({newFiles.length + (visit.attachmentsData?.length || 0)})
            </TabsTrigger>
            <TabsTrigger value="conclusao" className="text-xs font-semibold gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              3. Parecer Técnico & Assinaturas
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: CHECKLIST */}
          <TabsContent value="checklist" className="mt-5">
            <GeneratorChecklistEditor
              items={checklistItems}
              onChange={(updated) => {
                setChecklistItems(updated);
                const resItem = updated.find((i) => i.id === 108)?.answer;
                const pendencias = updated.find((i) => i.id === 109)?.answer;
                if (resItem) {
                  if (resItem.includes('adequações')) setResult('VIABLE_WITH_ADAPTATIONS');
                  else if (resItem.includes('Inviável')) setResult('UNVIABLE');
                  else setResult('VIABLE');
                }
                if (pendencias && !diagnosisSummary) {
                  setDiagnosisSummary(pendencias);
                }
              }}
              visitCode={visit.visitNumber || visit.id}
            />
          </TabsContent>

          {/* ABA 2: FOTOS E EVIDÊNCIAS */}
          <TabsContent value="fotos" className="mt-5 space-y-5">
            <div className="bg-gray-50/70 p-6 rounded-xl border-2 border-dashed border-gray-300 text-center space-y-3">
              <Camera className="h-10 w-10 text-gray-400 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Adicionar Evidências Fotográficas do Atendimento
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fotos do quadro elétrico, local da base, grupo gerador, pontos de acesso e anomalias
                </p>
              </div>

              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E2661D] hover:bg-[#c95716] text-white font-semibold text-xs cursor-pointer shadow-2xs transition-all">
                <Upload className="h-3.5 w-3.5" />
                Selecionar Fotos do Aparelho / Câmera
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Lista de Fotos Novas */}
            {newFiles.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Fotos prontas para envio ({newFiles.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {newFiles.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs flex flex-col justify-between"
                    >
                      <div className="aspect-video bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(item.file)}
                          alt="Foto"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewFile(item.id)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full shadow hover:bg-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="p-2.5">
                        <Input
                          placeholder="Legenda da foto (Ex: Placa do Transformador)"
                          value={item.legend}
                          onChange={(e) => updateFileLegend(item.id, e.target.value)}
                          className="h-8 text-xs rounded-lg border-gray-200"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ABA 3: PARECER E ASSINATURAS */}
          <TabsContent value="conclusao" className="mt-5 space-y-6">
            {/* Avaliação de Viabilidade */}
            <div className="bg-gray-50/70 p-5 rounded-xl border border-gray-200 space-y-3">
              <Label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Parecer Técnico de Viabilidade
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setResult('VIABLE')}
                  className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all ${
                    result === 'VIABLE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Viável (Apto para Instalação)
                </button>

                <button
                  type="button"
                  onClick={() => setResult('VIABLE_WITH_ADAPTATIONS')}
                  className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all ${
                    result === 'VIABLE_WITH_ADAPTATIONS'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Viável com Adequações
                </button>

                <button
                  type="button"
                  onClick={() => setResult('UNVIABLE')}
                  className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all ${
                    result === 'UNVIABLE'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <XCircle className="h-4 w-4 text-rose-600" />
                  Inviável Técnica / Estrutural
                </button>
              </div>
            </div>

            {/* Diagnóstico Resumido */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-700">
                Diagnóstico Técnico e Observações Finais do Engenheiro / Técnico
              </Label>
              <Textarea
                rows={4}
                placeholder="Resumo do relatório técnico, observações para elaboração da proposta comercial e pendências..."
                value={diagnosisSummary}
                onChange={(e) => setDiagnosisSummary(e.target.value)}
                className="text-xs bg-white border-gray-200 rounded-xl"
              />
            </div>

            {/* Assinaturas Digitais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Assinatura Técnico */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 text-center space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Assinatura do Técnico Responsável
                </span>

                <div className="h-28 bg-white border border-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
                  {technicianSignature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={technicianSignature}
                      alt="Assinatura Técnico"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 italic">Pendente de assinatura</span>
                  )}
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setTechSigOpen(true)}
                  className="w-full text-xs font-bold gap-1.5 border-gray-200"
                >
                  <PenTool className="h-3.5 w-3.5 text-[#E2661D]" />
                  {technicianSignature ? 'Alterar Assinatura' : 'Coletar Assinatura'}
                </Button>
              </div>

              {/* Assinatura Cliente */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200 text-center space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Assinatura do Cliente / Recebedor
                </span>

                <div className="h-28 bg-white border border-gray-300 rounded-xl flex items-center justify-center overflow-hidden">
                  {clientSignatureRefused ? (
                    <span className="text-xs text-rose-600 font-bold p-2">
                      Assinatura dispensada / preposto ausente
                    </span>
                  ) : clientSignature ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={clientSignature}
                      alt="Assinatura Cliente"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 italic">Pendente de assinatura</span>
                  )}
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setClientSigOpen(true)}
                    className="w-full text-xs font-bold gap-1.5 border-gray-200"
                  >
                    <PenTool className="h-3.5 w-3.5 text-[#E2661D]" />
                    {clientSignature ? 'Alterar Assinatura' : 'Coletar Assinatura'}
                  </Button>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <Input
                      placeholder="Nome de quem assinou"
                      value={clientSignerName}
                      onChange={(e) => setClientSignerName(e.target.value)}
                      className="h-7 text-xs bg-white rounded-lg border-gray-200"
                    />
                    <Input
                      placeholder="CPF / RG"
                      value={clientSignerDocument}
                      onChange={(e) => setClientSignerDocument(e.target.value)}
                      className="h-7 text-xs bg-white rounded-lg border-gray-200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Barra de Ações Inferior de Finalização */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
        <p className="text-xs text-gray-500">
          Certifique-se de salvar o rascunho periodicamente ou finalize para liberar a emissão do relatório e proposta técnica.
        </p>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link href={`/visits/${visit.id}`}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 text-xs h-9 px-3 rounded-lg"
            >
              Cancelar
            </Button>
          </Link>
          <Link href={`/visits/${visit.id}/report`}>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold h-9 px-3.5 rounded-lg gap-1.5 shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-[#E2661D]" />
              Visualizar PDF
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            disabled={saving}
            onClick={() => handleSaveReport(false)}
            className="border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold h-9 px-3.5 rounded-lg gap-1.5 shadow-2xs"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Rascunho'}
          </Button>

          <Button
            size="sm"
            disabled={saving}
            onClick={() => handleSaveReport(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 rounded-lg gap-1.5 shadow-2xs transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            {saving ? 'Finalizando...' : 'Salvar e Finalizar Visita'}
          </Button>
        </div>
      </div>

      {/* Modais de Assinatura */}
      <SignaturePadModal
        open={techSigOpen}
        onClose={() => setTechSigOpen(false)}
        onSave={(dataUrl) => {
          setTechnicianSignature(dataUrl);
          setTechSigOpen(false);
        }}
        title="Assinatura do Técnico Setgen"
      />

      <SignaturePadModal
        open={clientSigOpen}
        onClose={() => setClientSigOpen(false)}
        onSave={(dataUrl) => {
          setClientSignature(dataUrl);
          setClientSigOpen(false);
        }}
        title="Assinatura do Cliente / Acompanhante"
      />
    </div>
  );
}
