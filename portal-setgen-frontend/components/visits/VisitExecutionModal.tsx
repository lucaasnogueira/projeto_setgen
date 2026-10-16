"use client";

import React, { useState, useEffect } from 'react';
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
  Plus,
  Trash2,
  FileSpreadsheet,
  Save,
  X,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { TechnicalVisit } from '@/types';
import { GeneratorChecklistEditor } from './GeneratorChecklistEditor';
import { GeneratorChecklistItem, DEFAULT_GENERATOR_CHECKLIST } from '@/lib/checklist-generator-data';
import { SignaturePadModal } from '@/components/common/SignaturePadModal';
import { visitsApi } from '@/lib/api/visits';

interface VisitExecutionModalProps {
  open: boolean;
  onClose: () => void;
  visit: TechnicalVisit;
  onSuccess: () => void;
}

export function VisitExecutionModal({
  open,
  onClose,
  visit,
  onSuccess,
}: VisitExecutionModalProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'fotos' | 'conclusao'>('checklist');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Checklist
  const [checklistItems, setChecklistItems] = useState<GeneratorChecklistItem[]>(() => {
    if (Array.isArray(visit.technicalData?.checklistItems) && visit.technicalData.checklistItems.length > 0) {
      return visit.technicalData.checklistItems;
    }
    return DEFAULT_GENERATOR_CHECKLIST;
  });

  // Conclusão
  const [result, setResult] = useState<string>(visit.conclusionData?.result || 'VIABLE');
  const [diagnosisSummary, setDiagnosisSummary] = useState<string>(visit.conclusionData?.diagnosisSummary || '');
  const [nextSteps, setNextSteps] = useState<string[]>(
    Array.isArray(visit.conclusionData?.nextSteps) ? visit.conclusionData.nextSteps : ['Elaborar orçamento executivo']
  );

  // Assinaturas
  const [technicianSignature, setTechnicianSignature] = useState<string>(visit.technicianSignature || '');
  const [clientSignature, setClientSignature] = useState<string>(visit.clientSignature || '');
  const [clientSignerName, setClientSignerName] = useState<string>(
    visit.clientSignerName || visit.client?.companyName || ''
  );
  const [clientSignerDocument, setClientSignerDocument] = useState<string>(visit.clientSignerDocument || '');
  const [clientSignatureRefused, setClientSignatureRefused] = useState<boolean>(
    Boolean(visit.clientSignatureRefused)
  );
  const [clientRefusalReason, setClientRefusalReason] = useState<string>(visit.clientRefusalReason || '');

  // Modais de assinatura
  const [techSigOpen, setTechSigOpen] = useState(false);
  const [clientSigOpen, setClientSigOpen] = useState(false);

  // Novas fotos
  const [newFiles, setNewFiles] = useState<{ file: File; legend: string; id: string }[]>([]);

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

  const toggleNextStep = (stepText: string) => {
    if (nextSteps.includes(stepText)) {
      setNextSteps(nextSteps.filter((s) => s !== stepText));
    } else {
      setNextSteps([...nextSteps, stepText]);
    }
  };

  const handleSaveReport = async () => {
    setLoading(true);
    try {
      const formData = new FormData();

      // Montar objeto de dados técnicos preservando o que já existia
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

      formData.append('technicalData', JSON.stringify(updatedTechData));
      formData.append('conclusionData', JSON.stringify(updatedConclusion));

      // Assinaturas
      if (technicianSignature) formData.append('technicianSignature', technicianSignature);
      if (clientSignature) formData.append('clientSignature', clientSignature);
      if (clientSignerName) formData.append('clientSignerName', clientSignerName);
      if (clientSignerDocument) formData.append('clientSignerDocument', clientSignerDocument);
      formData.append('clientSignatureRefused', String(clientSignatureRefused));
      if (clientRefusalReason) formData.append('clientRefusalReason', clientRefusalReason);

      // Fotos
      newFiles.forEach((item) => {
        formData.append('files', item.file);
        formData.append('legends', item.legend || 'Evidência Fotográfica');
      });

      // Atualizar visita
      await visitsApi.update(visit.id, formData);
      alert('Relatório Técnico salvo com sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || err?.message || 'Erro ao salvar relatório técnico');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100 text-slate-900 w-screen h-screen overflow-hidden animate-in fade-in-0 duration-150">
      {/* Cabeçalho da Tela Cheia de Execução */}
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white shadow-md z-20">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 h-8 px-2.5 rounded-lg text-xs gap-1.5"
            title="Voltar / Fechar (Esc)"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#E2661D] text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-none text-white">
                Execução de Campo & Relatório Técnico
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {visit.client?.companyName || 'Cliente'} • {visit.visitNumber || `VT-${visit.id.slice(0, 8)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-white/10 text-xs h-8 px-3 rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={handleSaveReport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4 rounded-lg gap-1.5 shadow-sm shadow-emerald-600/30 transition-all"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? 'Salvando...' : 'Salvar Relatório Técnico'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-white/10 h-8 w-8 p-0 rounded-lg ml-1"
            title="Fechar (Esc)"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Conteúdo da Execução Técnica em Tela Cheia */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="max-w-6xl mx-auto space-y-4">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="checklist" className="text-xs font-bold gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                1. Checklist & Medições ({checklistItems.length})
              </TabsTrigger>
              <TabsTrigger value="fotos" className="text-xs font-bold gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                2. Fotos e Evidências ({newFiles.length + (visit.attachmentsData?.length || 0)})
              </TabsTrigger>
              <TabsTrigger value="conclusao" className="text-xs font-bold gap-1.5">
                <PenTool className="h-3.5 w-3.5" />
                3. Parecer & Assinaturas
              </TabsTrigger>
            </TabsList>

            {/* ABA 1: CHECKLIST */}
            <TabsContent value="checklist" className="mt-4">
              <GeneratorChecklistEditor
                items={checklistItems}
                onChange={(updated) => {
                  setChecklistItems(updated);
                  // Sincroniza resultado automático se o item 108 tiver preenchido
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
            <TabsContent value="fotos" className="mt-4 space-y-4">
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-dashed border-gray-300 text-center space-y-2">
                <Camera className="h-8 w-8 text-slate-400 mx-auto" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Adicionar Evidências Fotográficas do Atendimento
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fotos do quadro elétrico, local da base, grupo gerador, pontos de acesso e anomalias
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs cursor-pointer shadow-md shadow-orange-500/20 transition-all">
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
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Fotos para upload nesta vistoria ({newFiles.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {newFiles.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
                      >
                        <div className="aspect-video bg-slate-100 relative overflow-hidden flex items-center justify-center">
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
                            placeholder="Legenda da foto (Ex: Placa de identificação)"
                            value={item.legend}
                            onChange={(e) => updateFileLegend(item.id, e.target.value)}
                            className="h-7 text-xs rounded-lg"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* ABA 3: PARECER E ASSINATURAS */}
            <TabsContent value="conclusao" className="mt-4 space-y-4">
              {/* Avaliação de Viabilidade */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-gray-200 space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Parecer Técnico de Viabilidade
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setResult('VIABLE')}
                    className={`p-3 rounded-xl border text-left font-bold text-xs flex items-center gap-2.5 transition-all ${
                      result === 'VIABLE'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
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
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <XCircle className="h-4 w-4 text-rose-600" />
                    Inviável Técnica / Estrutural
                  </button>
                </div>
              </div>

              {/* Diagnóstico Resumido */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">
                  Diagnóstico Técnico e Observações Finais do Engenheiro / Técnico
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Resumo do relatório técnico, observações para elaboração da proposta comercial e pendências..."
                  value={diagnosisSummary}
                  onChange={(e) => setDiagnosisSummary(e.target.value)}
                  className="text-xs bg-white border-gray-200 rounded-lg"
                />
              </div>

              {/* Assinaturas Digitais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Assinatura Técnico */}
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-gray-200 text-center space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Assinatura do Técnico Responsável
                  </span>

                  <div className="h-28 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {technicianSignature ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={technicianSignature}
                        alt="Assinatura Técnico"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">Pendente de assinatura</span>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setTechSigOpen(true)}
                    className="w-full text-xs font-semibold h-8 rounded-lg gap-1.5"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    {technicianSignature ? 'Alterar Assinatura' : 'Coletar Assinatura'}
                  </Button>
                </div>

                {/* Assinatura Cliente */}
                <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-gray-200 text-center space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Assinatura do Cliente / Recebedor
                  </span>

                  <div className="h-28 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
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
                      <span className="text-xs text-slate-400 italic">Pendente de assinatura</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={clientSignatureRefused}
                      onClick={() => setClientSigOpen(true)}
                      className="flex-1 text-xs font-bold gap-1.5"
                    >
                      <PenTool className="h-3.5 w-3.5" />
                      {clientSignature ? 'Alterar' : 'Coletar'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={clientSignatureRefused ? 'destructive' : 'ghost'}
                      onClick={() => setClientSignatureRefused(!clientSignatureRefused)}
                      className="text-xs font-bold"
                    >
                      {clientSignatureRefused ? 'Dispensada' : 'Dispensar'}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

      </main>

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

