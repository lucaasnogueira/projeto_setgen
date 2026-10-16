"use client";

import { useState, useEffect, useRef } from 'react';
import { clientsApi } from '@/lib/api/clients';
import { usersApi } from '@/lib/api/users';
import {
  Building2,
  Calendar,
  MapPin,
  User,
  Zap,
  HardHat,
  Clock,
  Check,
  Search,
  FileText,
  AlertTriangle,
  ClipboardCheck,
  ArrowRight,
  Save,
  X,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TechnicalVisit, UserRole, VisitPriority, VisitType, ChecklistTemplate } from '@/types';
import { cn } from "@/lib/utils";
import { checklistTemplatesApi } from "@/lib/api/checklist-templates";
import { convertTemplateFieldsToChecklistItems } from "@/lib/checklist-template-sheet";
import { DEFAULT_GENERATOR_CHECKLIST, GeneratorChecklistItem } from "@/lib/checklist-generator-data";

interface VisitFormProps {
  initialData?: Partial<TechnicalVisit>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  title: string;
  submitLabel: string;
}

export function VisitForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  title,
  submitLabel,
}: VisitFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<ChecklistTemplate[]>([]);
  const [techSearch, setTechSearch] = useState('');
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const techDropdownRef = useRef<HTMLDivElement>(null);

  // Estados do agendamento
  const [clientId, setClientId] = useState(initialData?.clientId || '');
  const [visitNumber, setVisitNumber] = useState(initialData?.visitNumber || '');
  const [technicianId, setTechnicianId] = useState(initialData?.technicianId || '');
  const [responsibleIds, setResponsibleIds] = useState<string[]>(initialData?.responsibleIds || []);
  const [visitDate, setVisitDate] = useState(
    initialData?.visitDate
      ? new Date(initialData.visitDate).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [visitType, setVisitType] = useState<VisitType>(initialData?.visitType || VisitType.TECHNICAL);
  const [priority, setPriority] = useState<VisitPriority>(initialData?.priority || VisitPriority.MEDIUM);
  const [location, setLocation] = useState(initialData?.location || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [userReport, setUserReport] = useState(initialData?.userReport || '');
  const [serviceCategory, setServiceCategory] = useState<string>(
    initialData?.serviceCategory || 'MAINTENANCE'
  );

  // Checklist modelo vinculado
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('GERADOR_OFFICIAL');
  const [checklistItems, setChecklistItems] = useState<GeneratorChecklistItem[]>(() => {
    if (Array.isArray(initialData?.technicalData?.checklistItems) && initialData!.technicalData.checklistItems.length > 0) {
      return initialData!.technicalData.checklistItems;
    }
    return DEFAULT_GENERATOR_CHECKLIST;
  });

  // Carregar dados de apoio
  useEffect(() => {
    clientsApi.getAll().then(setClients).catch(console.error);
    usersApi.getSelectable().then((users) => {
      const techs = users.filter((u) => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN || u.role === UserRole.MANAGER);
      setTechnicians(techs);
    }).catch(console.error);
    checklistTemplatesApi.getAll().then((templates) => {
      setAvailableTemplates(templates.filter((t) => t.active));
    }).catch(console.error);

    const handleClickOutside = (e: MouseEvent) => {
      if (techDropdownRef.current && !techDropdownRef.current.contains(e.target as Node)) {
        setIsTechDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ao mudar cliente, preencher automaticamente endereço
  const handleClientSelect = (id: string) => {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    if (client && client.address) {
      const addr = client.address;
      setLocation(`${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood}, ${addr.city}/${addr.state} - CEP: ${addr.cep}`);
    }
  };

  const handleTechToggle = (id: string) => {
    setResponsibleIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId === 'GERADOR_OFFICIAL') {
      setChecklistItems(DEFAULT_GENERATOR_CHECKLIST);
    } else {
      const tmpl = availableTemplates.find((t) => t.id === templateId);
      if (tmpl && Array.isArray(tmpl.fields)) {
        const converted = convertTemplateFieldsToChecklistItems(tmpl.fields);
        setChecklistItems(converted);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      alert('Selecione um cliente para a visita');
      return;
    }
    if (!description.trim()) {
      alert('Informe o objetivo técnico da visita');
      return;
    }

    const data = new FormData();
    data.append('clientId', clientId);
    data.append('visitDate', new Date(visitDate).toISOString());
    data.append('visitType', visitType);
    data.append('location', location);
    data.append('description', description);
    data.append('userReport', userReport);
    data.append('priority', priority);
    data.append('serviceCategory', serviceCategory);
    if (visitNumber) data.append('visitNumber', visitNumber);
    if (technicianId) data.append('technicianId', technicianId);

    responsibleIds.forEach((id) => data.append('responsibleIds', id));

    // Preserva dados técnicos e anexa os itens do checklist modelo
    const currentTechData = initialData?.technicalData || {};
    data.append('technicalData', JSON.stringify({
      ...currentTechData,
      checklistItems,
    }));

    if (initialData?.conclusionData) {
      data.append('conclusionData', JSON.stringify(initialData.conclusionData));
    }

    onSubmit(data);
  };

  const selectedClient = clients.find((c) => c.id === clientId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-4xl mx-auto pb-8">
      {/* Barra Superior / Header de Agendamento */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/80 shadow-2xs">
        <div>
          <h2 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#E2661D]" />
            {title}
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Agende a visita técnica no escritório. O checklist e relatório serão preenchidos pelo técnico em campo.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="text-xs font-semibold gap-1.5 rounded-lg h-9 px-3"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#E2661D] hover:bg-[#c95716] text-white font-semibold text-xs gap-1.5 rounded-lg h-9 px-4 shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" />
            {loading ? 'Salvando...' : submitLabel}
          </Button>
        </div>
      </div>

      {/* BLOCO 1: CLIENTE E LOCALIZAÇÃO */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
          <Building2 className="h-3.5 w-3.5 text-[#E2661D]" />
          1. Identificação do Cliente & Local de Atendimento
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Cliente *</Label>
            <select
              required
              value={clientId}
              onChange={(e) => handleClientSelect(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E2661D]"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName} {c.cnpjCpf ? `(${c.cnpjCpf})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Número da Visita (Opcional)</Label>
            <Input
              placeholder="Ex: VT-2026-001"
              value={visitNumber}
              onChange={(e) => setVisitNumber(e.target.value)}
              className="h-9 text-xs bg-white border-gray-200 rounded-lg"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Endereço do Atendimento / Instalação *</Label>
          <div className="relative">
            <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              required
              placeholder="Rua, número, bairro, cidade/UF e pontos de referência..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-8 h-9 text-xs bg-white border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* BLOCO 2: AGENDAMENTO E EQUIPE */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
          <Clock className="h-3.5 w-3.5 text-[#E2661D]" />
          2. Agendamento & Equipe Técnica
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Data e Hora Prevista *</Label>
            <Input
              required
              type="datetime-local"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="h-9 text-xs bg-white border-gray-200 rounded-lg font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Técnico Responsável</Label>
            <select
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E2661D]"
            >
              <option value="">A definir / Qualquer técnico</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Prioridade</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as VisitPriority)}
              className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E2661D]"
            >
              <option value={VisitPriority.LOW}>Baixa</option>
              <option value={VisitPriority.MEDIUM}>Média / Normal</option>
              <option value={VisitPriority.HIGH}>Alta / Urgente</option>
            </select>
          </div>
        </div>

        {/* Equipe técnica de apoio */}
        {technicians.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-gray-700">
              Equipe de Apoio / Acompanhantes ({responsibleIds.length} selecionados)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {technicians.map((t) => {
                const isSelected = responsibleIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleTechToggle(t.id)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all border",
                      isSelected
                        ? "bg-orange-50 border-orange-300 text-orange-900 shadow-2xs"
                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* BLOCO 3: ESCOPO E MOTIVO DO CHAMADO */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-2">
          <Zap className="h-3.5 w-3.5 text-[#E2661D]" />
          3. Escopo & Motivo da Solicitação
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Categoria do Serviço</Label>
            <select
              value={serviceCategory}
              onChange={(e) => setServiceCategory(e.target.value)}
              className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E2661D]"
            >
              <option value="MAINTENANCE">⚡ Grupo Gerador (Vistoria / Pré-dimensionamento)</option>
              <option value="ELECTRICAL">🔌 Elétrica (Instalação / Subestação / QGF)</option>
              <option value="CIVIL">🏗️ Obra Civil (Base / Acústica / Adequação)</option>
              <option value="OTHER">🛠️ Outros Serviços de Engenharia</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Tipo de Visita</Label>
            <select
              value={visitType}
              onChange={(e) => setVisitType(e.target.value as VisitType)}
              className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E2661D]"
            >
              <option value={VisitType.TECHNICAL}>Vistoria Técnica</option>
              <option value={VisitType.MAINTENANCE}>Manutenção / Geradores</option>
              <option value={VisitType.COMMERCIAL}>Visita Comercial / Orçamento</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Relato do Solicitante / Cliente</Label>
          <Textarea
            rows={2}
            placeholder="O que o cliente informou ao solicitar a visita técnica..."
            value={userReport}
            onChange={(e) => setUserReport(e.target.value)}
            className="text-xs bg-white border-gray-200 rounded-lg resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700">Objetivo Técnico da Visita *</Label>
          <Textarea
            required
            rows={2}
            placeholder="Atividades e escopo técnico que o técnico irá verificar em campo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-xs bg-white border-gray-200 rounded-lg resize-none font-medium"
          />
        </div>
      </div>

      {/* BLOCO 4: CHECKLIST VINCULADO PARA EXECUÇÃO EM CAMPO */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center gap-2">
            <ClipboardCheck className="h-3.5 w-3.5 text-[#E2661D]" />
            4. Modelo de Checklist para o Técnico em Campo
          </h3>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
            {checklistItems.length} itens configurados
          </span>
        </div>

        <p className="text-[11px] text-gray-500">
          Selecione qual checklist o técnico irá preencher pelo celular/tablet ou pela planilha Excel quando estiver no local do cliente:
        </p>

        <select
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full h-9 px-3 text-xs bg-white border border-gray-200 rounded-lg font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#E2661D]"
        >
          <option value="GERADOR_OFFICIAL">
            ⚡ Grupo Gerador — Vistoria Técnica Completa (114 itens oficiais em 11 seções)
          </option>
          {availableTemplates.map((t) => (
            <option key={t.id} value={t.id}>
              📋 {t.name} ({Array.isArray(t.fields) ? t.fields.length : 0} itens personalizados)
            </option>
          ))}
        </select>
      </div>

      {/* BOTÕES DE FINALIZAÇÃO */}
      <div className="flex items-center justify-end gap-2.5 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="h-9 px-4 text-xs font-semibold rounded-lg"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="h-9 px-5 bg-[#E2661D] hover:bg-[#c95716] text-white font-semibold text-xs rounded-lg shadow-2xs"
        >
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}