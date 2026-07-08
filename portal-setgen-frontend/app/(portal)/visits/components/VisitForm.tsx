"use client"

import { useState, useEffect, useRef } from 'react';
import { clientsApi } from '@/lib/api/clients';
import { usersApi } from '@/lib/api/users';
import { equipmentApi } from '@/lib/api/equipment';
import { failureCategoriesApi } from '@/lib/api/failure-categories';
import { visitTaskTypesApi } from '@/lib/api/visit-task-types';
import { checklistTemplatesApi } from '@/lib/api/checklist-templates';
import { 
  User, 
  MapPin, 
  HardHat, 
  Save, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  FileText, 
  Image as ImageIcon,
  Trash2,
  Search,
  Check,
  Calendar,
  Building2,
  FileSearch,
  Paperclip,
  Settings2,
  MoreVertical
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { VisitType, VisitPriority, UserRole, TechnicalVisit, FailureCategory, VisitTaskType, ChecklistTemplate, EquipmentType } from '@/types';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { StepRail, type WizardStep } from "@/components/ui/step-wizard";

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: "Gerador",
  [EquipmentType.SUBSTATION]: "Subestação",
  [EquipmentType.OTHER]: "Outro",
};

const emptyNewEquipment = {
  type: EquipmentType.GENERATOR as EquipmentType,
  brand: '',
  model: '',
  serialNumber: '',
  powerRating: '',
  installLocation: '',
};

interface VisitFormProps {
  initialData?: Partial<TechnicalVisit>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  title: string;
  submitLabel: string;
}

interface AttachmentEntry {
  file: File;
  legend: string;
  id: string;
}

export function VisitForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  title,
  submitLabel
}: VisitFormProps) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [failureCategories, setFailureCategories] = useState<FailureCategory[]>([]);
  const [taskTypes, setTaskTypes] = useState<VisitTaskType[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  const [isEquipmentDropdownOpen, setIsEquipmentDropdownOpen] = useState(false);
  const [isNewEquipmentOpen, setIsNewEquipmentOpen] = useState(false);
  const [newEquipment, setNewEquipment] = useState(emptyNewEquipment);
  const [creatingEquipment, setCreatingEquipment] = useState(false);

  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || '',
    technicianId: initialData?.technicianId || '',
    equipmentIds: initialData?.equipment ? [initialData.equipment.id] : [] as string[],
    failureCategoryId: initialData?.failureCategoryId || '',
    taskTypeId: initialData?.taskTypeId || '',
    priority: initialData?.priority || VisitPriority.MEDIUM,
    checklistTemplateId: initialData?.checklistTemplateId || '',
    externalCode: initialData?.externalCode || '',
    actualValue: initialData?.actualValue?.toString() || '',
    responsibleIds: initialData?.responsibleIds || [] as string[],
    visitDate: initialData?.visitDate ? new Date(initialData.visitDate).toISOString().slice(0, 16) : '',
    scheduledEnd: initialData?.scheduledEnd ? new Date(initialData.scheduledEnd).toISOString().slice(0, 16) : '',
    visitType: initialData?.visitType || VisitType.TECHNICAL,
    location: initialData?.location || '',
    description: initialData?.description || '',
    userReport: initialData?.userReport || '',
    notes: initialData?.notes || '',
  });

  const [attachments, setAttachments] = useState<AttachmentEntry[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const equipmentDropdownRef = useRef<HTMLDivElement>(null);

  const loadClients = async () => {
    try {
      const data = await clientsApi.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadTechnicians = async () => {
    try {
      const allUsers = await usersApi.getAll();
      const techs = allUsers.filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN || u.role === UserRole.MANAGER);
      setTechnicians(techs);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const loadEquipments = async (clientId: string) => {
    if (!clientId) {
      setEquipments([]);
      return;
    }
    try {
      const data = await equipmentApi.getAll({ clientId });
      setEquipments(data);
    } catch (error) {
      console.error('Error loading equipments:', error);
    }
  };

  useEffect(() => {
    loadClients();
    loadTechnicians();
    failureCategoriesApi.getAll(true).then(setFailureCategories).catch(() => setFailureCategories([]));
    visitTaskTypesApi.getAll(true).then(setTaskTypes).catch(() => setTaskTypes([]));
    checklistTemplatesApi.getAll(undefined, true).then(setChecklistTemplates).catch(() => setChecklistTemplates([]));
    if (formData.clientId) {
      loadEquipments(formData.clientId);
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTechDropdownOpen(false);
      }
      if (equipmentDropdownRef.current && !equipmentDropdownRef.current.contains(event.target as Node)) {
        setIsEquipmentDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    let newLocation = formData.location;

    if (client && client.address) {
      const addr = client.address;
      newLocation = `${addr.street}, ${addr.number}${addr.complement ? ` - ${addr.complement}` : ''}, ${addr.neighborhood}, ${addr.city}/${addr.state} - CEP: ${addr.cep}`;
    }

    setFormData({ ...formData, clientId, location: newLocation, equipmentIds: [], failureCategoryId: '' });
    loadEquipments(clientId);
  };

  const handleTechnicianToggle = (techId: string) => {
    setFormData(prev => {
      const isSelected = prev.responsibleIds.includes(techId);
      if (isSelected) {
        return {
          ...prev,
          responsibleIds: prev.responsibleIds.filter(id => id !== techId)
        };
      } else {
        return {
          ...prev,
          responsibleIds: [...prev.responsibleIds, techId]
        };
      }
    });
  };

  const handleEquipmentToggle = (equipmentId: string) => {
    setFormData(prev => {
      const isSelected = prev.equipmentIds.includes(equipmentId);
      return {
        ...prev,
        equipmentIds: isSelected
          ? prev.equipmentIds.filter(id => id !== equipmentId)
          : [...prev.equipmentIds, equipmentId],
      };
    });
  };

  const handleCreateEquipment = async () => {
    if (!formData.clientId) return;
    setCreatingEquipment(true);
    try {
      const created = await equipmentApi.create({ ...newEquipment, clientId: formData.clientId });
      setEquipments((prev) => [...prev, created]);
      setFormData((prev) => ({ ...prev, equipmentIds: [...prev.equipmentIds, created.id] }));
      setNewEquipment(emptyNewEquipment);
      setIsNewEquipmentOpen(false);
    } catch (error) {
      console.error('Error creating equipment:', error);
      alert('Erro ao cadastrar equipamento');
    } finally {
      setCreatingEquipment(false);
    }
  };

  const handleTaskTypeChange = (taskTypeId: string) => {
    const taskType = taskTypes.find(t => t.id === taskTypeId);
    setFormData(prev => ({
      ...prev,
      taskTypeId,
      // Herda o questionário padrão do tipo escolhido, se houver e o usuário
      // ainda não tiver escolhido um manualmente.
      checklistTemplateId: !prev.checklistTemplateId && taskType?.defaultChecklistTemplateId
        ? taskType.defaultChecklistTemplateId
        : prev.checklistTemplateId,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        legend: '',
        id: Math.random().toString(36).substr(2, 9)
      }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const updateLegend = (id: string, legend: string) => {
    setAttachments(prev => prev.map(a => a.id === id ? { ...a, legend } : a));
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 3) {
      nextStep();
      return;
    }
    
    const data = new FormData();
    data.append('clientId', formData.clientId);
    data.append('visitDate', formData.visitDate ? new Date(formData.visitDate).toISOString() : '');
    data.append('scheduledStart', formData.visitDate ? new Date(formData.visitDate).toISOString() : '');
    if (formData.scheduledEnd) {
      data.append('scheduledEnd', new Date(formData.scheduledEnd).toISOString());
    }
    data.append('visitType', formData.visitType);
    data.append('location', formData.location);
    data.append('description', formData.description);
    data.append('userReport', formData.userReport);
    data.append('notes', formData.notes);
    data.append('priority', formData.priority);

    if (formData.technicianId) {
      data.append('technicianId', formData.technicianId);
    }

    formData.equipmentIds.forEach(id => {
      data.append('equipmentIds', id);
    });

    if (formData.failureCategoryId) {
      data.append('failureCategoryId', formData.failureCategoryId);
    }

    if (formData.taskTypeId) {
      data.append('taskTypeId', formData.taskTypeId);
    }

    if (formData.checklistTemplateId) {
      data.append('checklistTemplateId', formData.checklistTemplateId);
    }

    if (formData.externalCode) {
      data.append('externalCode', formData.externalCode);
    }

    if (formData.actualValue) {
      data.append('actualValue', formData.actualValue);
    }

    formData.responsibleIds.forEach(id => {
      data.append('responsibleIds', id);
    });

    attachments.forEach(att => {
      data.append('files', att.file);
      data.append('legends', att.legend);
    });

    onSubmit(data);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const steps = [
    { id: 1, label: 'Participantes', icon: User },
    { id: 2, label: 'Detalhes', icon: FileSearch },
    { id: 3, label: 'Anexos', icon: Paperclip },
  ];
  const stepDefs: WizardStep[] = steps.map((s) => ({ key: String(s.id), label: s.label }));
  const selectStep = (key: string) => {
    const target = Number(key);
    // Só permite voltar pra etapa já concluída — não pula validação pulando pra frente.
    if (target <= step) setStep(target);
  };

  const filteredTechs = technicians.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTechs = technicians.filter(t => formData.responsibleIds.includes(t.id));

  return (
    <div className="bg-slate-50 flex flex-col rounded-xl border border-slate-200 shadow-sm relative w-full mx-auto">
      {/* Header / Stepper Horizontal */}
      <div className="bg-card border-b border-slate-200 p-6 rounded-t-xl z-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-md">
              <Settings2 className="w-5 h-5" />
            </div>
            {title}
          </h1>
          <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </div>

        {/* Stepper */}
        <StepRail steps={stepDefs} activeKey={String(step)} onSelect={selectStep} />
      </div>

      {/* Main Content Area */}
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="p-6 md:p-8 space-y-6">
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6">
              {/* Card 1: Dados Principais */}
              <div className="bg-card rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3 border-slate-100">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Dados do Cliente e Visita
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</Label>
                    <select
                      required
                      value={formData.clientId}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-card focus:border-slate-900 outline-none transition-colors"
                    >
                      <option value="">Selecione um cliente...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.companyName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Visita</Label>
                    <select
                      required
                      value={formData.visitType}
                      onChange={(e) => setFormData({ ...formData, visitType: e.target.value as VisitType })}
                      className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-card focus:border-slate-900 outline-none transition-colors"
                    >
                      <option value={VisitType.TECHNICAL}>Técnica</option>
                      <option value={VisitType.COMMERCIAL}>Comercial</option>
                      <option value={VisitType.MAINTENANCE}>Manutenção</option>
                    </select>
                  </div>
                </div>

                {formData.clientId && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2" ref={equipmentDropdownRef}>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipamentos (opcional)</Label>
                        <button
                          type="button"
                          onClick={() => setIsNewEquipmentOpen(true)}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Novo
                        </button>
                      </div>
                      <div className="relative">
                        <div
                          className={cn(
                            "min-h-[2.75rem] w-full rounded-md border border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-2 cursor-pointer transition-all focus-within:bg-card focus-within:border-slate-900",
                            isEquipmentDropdownOpen && "border-slate-900 bg-card ring-1 ring-slate-900/10"
                          )}
                          onClick={() => setIsEquipmentDropdownOpen(true)}
                        >
                          {formData.equipmentIds.length > 0 ? (
                            formData.equipmentIds.map(id => {
                              const eq = equipments.find(e => e.id === id);
                              if (!eq) return null;
                              return (
                                <Badge
                                  key={id}
                                  variant="secondary"
                                  className="bg-slate-900 text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                                >
                                  {eq.brand} {eq.model}
                                  <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleEquipmentToggle(id); }} />
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-sm text-slate-400 px-2 flex items-center gap-2">
                              <Search className="w-4 h-4" /> Selecionar equipamentos...
                            </span>
                          )}
                        </div>

                        {isEquipmentDropdownOpen && (
                          <div className="absolute top-full left-0 w-full mt-2 z-50 bg-card border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                            <div className="overflow-y-auto p-1.5 space-y-1">
                              {equipments.length === 0 ? (
                                <p className="p-4 text-center text-sm text-slate-500">Nenhum equipamento cadastrado para este cliente.</p>
                              ) : (
                                equipments.map(eq => (
                                  <button
                                    key={eq.id}
                                    type="button"
                                    className={cn(
                                      "w-full flex items-center justify-between p-2.5 rounded-md text-sm font-semibold transition-colors",
                                      formData.equipmentIds.includes(eq.id) ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50 text-slate-600"
                                    )}
                                    onClick={() => handleEquipmentToggle(eq.id)}
                                  >
                                    {eq.brand} {eq.model} {eq.serialNumber ? `(SN: ${eq.serialNumber})` : ''}
                                    {formData.equipmentIds.includes(eq.id) && <Check className="w-4 h-4 text-slate-900" />}
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {formData.equipmentIds.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Categoria da Falha</Label>
                        <select
                          value={formData.failureCategoryId}
                          onChange={(e) => setFormData({ ...formData, failureCategoryId: e.target.value })}
                          className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-card focus:border-slate-900 outline-none transition-colors"
                        >
                          <option value="">Não identificada</option>
                          {failureCategories.map(fc => (
                            <option key={fc.id} value={fc.id}>{fc.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo de Tarefa</Label>
                    <select
                      value={formData.taskTypeId}
                      onChange={(e) => handleTaskTypeChange(e.target.value)}
                      className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-card focus:border-slate-900 outline-none transition-colors"
                    >
                      <option value="">Não definido</option>
                      {taskTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prioridade</Label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as VisitPriority })}
                      className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-card focus:border-slate-900 outline-none transition-colors"
                    >
                      <option value={VisitPriority.LOW}>Baixa</option>
                      <option value={VisitPriority.MEDIUM}>Média</option>
                      <option value={VisitPriority.HIGH}>Alta</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questionário Padrão</Label>
                    <select
                      value={formData.checklistTemplateId}
                      onChange={(e) => setFormData({ ...formData, checklistTemplateId: e.target.value })}
                      className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-card focus:border-slate-900 outline-none transition-colors"
                    >
                      <option value="">Nenhum</option>
                      {checklistTemplates.map(ct => (
                        <option key={ct.id} value={ct.id}>{ct.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código Externo (opcional)</Label>
                    <Input
                      value={formData.externalCode}
                      onChange={(e) => setFormData({ ...formData, externalCode: e.target.value })}
                      placeholder="Ex: código da tarefa em outro sistema"
                      className="h-11 border-slate-200 font-semibold text-sm bg-slate-50 focus:bg-card transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor da Tarefa (opcional)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.actualValue}
                      onChange={(e) => setFormData({ ...formData, actualValue: e.target.value })}
                      placeholder="0,00"
                      className="h-11 border-slate-200 font-semibold text-sm bg-slate-50 focus:bg-card transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Agendamento e Equipe */}
              <div className="bg-card rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3 border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Agendamento e Equipe
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Início</Label>
                    <Input
                      type="datetime-local"
                      required
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="h-11 border-slate-200 font-semibold text-sm bg-slate-50 focus:bg-card transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fim (duração informada)</Label>
                    <Input
                      type="datetime-local"
                      value={formData.scheduledEnd}
                      onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                      className="h-11 border-slate-200 font-semibold text-sm bg-slate-50 focus:bg-card transition-colors"
                    />
                  </div>

                  <div className="space-y-2" ref={dropdownRef}>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipe Responsável</Label>
                    <div className="relative">
                      <div 
                        className={cn(
                          "min-h-[2.75rem] w-full rounded-md border border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-2 cursor-pointer transition-all focus-within:bg-card focus-within:border-slate-900",
                          isTechDropdownOpen && "border-slate-900 bg-card ring-1 ring-slate-900/10"
                        )}
                        onClick={() => setIsTechDropdownOpen(true)}
                      >
                        {selectedTechs.length > 0 ? (
                          selectedTechs.map(tech => (
                            <Badge 
                              key={tech.id} 
                              variant="secondary"
                              className="bg-slate-900 text-white px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800"
                            >
                              {tech.name}
                              <X className="w-3 h-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleTechnicianToggle(tech.id); }} />
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400 px-2 flex items-center gap-2">
                            <Search className="w-4 h-4" /> Buscar técnicos...
                          </span>
                        )}
                      </div>

                      {isTechDropdownOpen && (
                        <div className="absolute top-full left-0 w-full mt-2 z-50 bg-card border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                             <div className="relative">
                               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                               <Input 
                                 placeholder="Filtrar por nome..." 
                                 value={searchTerm}
                                 onChange={(e) => setSearchTerm(e.target.value)}
                                 onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                 className="h-9 pl-9 text-sm border-slate-200 focus:border-slate-900 bg-card"
                               />
                             </div>
                          </div>
                          <div className="overflow-y-auto p-1.5 space-y-1">
                            {filteredTechs.length === 0 ? (
                              <p className="p-4 text-center text-sm text-slate-500">Nenhum técnico encontrado.</p>
                            ) : (
                              filteredTechs.map(tech => (
                                <button
                                  key={tech.id}
                                  type="button"
                                  className={cn(
                                    "w-full flex items-center justify-between p-2.5 rounded-md text-sm font-semibold transition-colors",
                                    formData.responsibleIds.includes(tech.id) ? "bg-slate-100 text-slate-900" : "hover:bg-slate-50 text-slate-600"
                                  )}
                                  onClick={() => handleTechnicianToggle(tech.id)}
                                >
                                  {tech.name}
                                  {formData.responsibleIds.includes(tech.id) && <Check className="w-4 h-4 text-slate-900" />}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6">
              <div className="bg-card rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3 border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  Localização
                </h2>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Endereço Completo</Label>
                  <textarea
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 font-semibold text-sm focus:bg-card focus:border-slate-900 outline-none transition-all resize-none"
                    placeholder="Av. Exemplo, 123 - Bairro, Cidade/UF"
                  />
                </div>
              </div>

              <div className="bg-card rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3 border-slate-100">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Detalhamento
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Relato do Cliente</Label>
                    <textarea
                      required
                      value={formData.userReport}
                      onChange={(e) => setFormData({ ...formData, userReport: e.target.value })}
                      rows={6}
                      placeholder="Descreva o problema ou solicitação relatada pelo cliente..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:bg-card focus:border-slate-900 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descrição Técnica</Label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      placeholder="Descreva as atividades que serão realizadas durante a visita..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:bg-card focus:border-slate-900 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6">
              <div className="bg-card rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3 border-slate-100">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  Evidências e Anexos
                </h2>
                
                <div 
                  className="w-full border-dashed border-2 border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-900 hover:border-slate-400 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={(e) => {
                    const input = document.getElementById('file-upload');
                    if (e.target !== input) {
                      input?.click();
                    }
                  }}
                >
                  <div className="bg-card p-4 rounded-full shadow-sm border border-slate-100 mb-2">
                    <Plus className="w-6 h-6 text-slate-900" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-600">Clique para anexar arquivos</span>
                  <span className="text-xs font-medium text-slate-400">Suporta imagens, PDFs e documentos</span>
                  <input id="file-upload" type="file" multiple onChange={handleFileChange} onClick={(e) => e.stopPropagation()} className="hidden" />
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {attachments.map((att) => (
                      <div key={att.id} className="border border-slate-200 rounded-lg p-3 bg-card shadow-sm flex items-center gap-3 group transition-all hover:shadow-md">
                        <div className="bg-slate-100 p-2.5 rounded-md">
                          <ImageIcon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                        </div>
                        <Input
                          value={att.legend}
                          onChange={(e) => updateLegend(att.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                          placeholder="Adicionar legenda..."
                          className="h-9 text-sm border-none bg-transparent font-medium flex-1 px-1 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <button type="button" onClick={() => removeAttachment(att.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sticky Actions Footer */}
        <div className="sticky bottom-0 bg-card border-t border-slate-200 p-5 px-6 md:px-8 flex items-center justify-between rounded-b-xl shadow-[0_-10px_30px_-10px_rgb(0,0,0,0.05)] z-20">
          <div className="flex gap-3">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); prevStep(); }} className="h-11 text-sm font-bold px-6 border-slate-200 hover:bg-slate-50 hover:text-slate-900">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {step < 3 ? (
              <Button
                type="button"
                onClick={(e) => { e.preventDefault(); nextStep(); }}
                disabled={step === 1 && (!formData.clientId || formData.responsibleIds.length === 0 || !formData.visitDate)}
                className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-md shadow-md shadow-blue-200 transition-all hover:shadow-lg disabled:opacity-50"
              >
                Próximo Passo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="h-11 px-8 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-sm rounded-md shadow-md shadow-blue-200 transition-all hover:shadow-lg disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 border-2 border-white/20 border-t-white rounded-full w-4 h-4" />
                    Agendando...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="w-4 h-4 mr-2" />
                    {submitLabel}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>

      <Dialog open={isNewEquipmentOpen} onOpenChange={setIsNewEquipmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Equipamento</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={newEquipment.type}
                onValueChange={(v) => setNewEquipment((prev) => ({ ...prev, type: v as EquipmentType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EquipmentType).map((t) => (
                    <SelectItem key={t} value={t}>{EQUIPMENT_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Marca</Label>
              <Input
                value={newEquipment.brand}
                onChange={(e) => setNewEquipment((prev) => ({ ...prev, brand: e.target.value }))}
                placeholder="Ex: Stemac"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Modelo</Label>
              <Input
                value={newEquipment.model}
                onChange={(e) => setNewEquipment((prev) => ({ ...prev, model: e.target.value }))}
                placeholder="Ex: GS200"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Nº de série</Label>
              <Input
                value={newEquipment.serialNumber}
                onChange={(e) => setNewEquipment((prev) => ({ ...prev, serialNumber: e.target.value }))}
                placeholder="Ex: SN-12345"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Potência</Label>
              <Input
                value={newEquipment.powerRating}
                onChange={(e) => setNewEquipment((prev) => ({ ...prev, powerRating: e.target.value }))}
                placeholder="Ex: 200 kVA"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Local de instalação</Label>
              <Input
                value={newEquipment.installLocation}
                onChange={(e) => setNewEquipment((prev) => ({ ...prev, installLocation: e.target.value }))}
                placeholder="Ex: Casa de máquinas - térreo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsNewEquipmentOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleCreateEquipment} disabled={creatingEquipment}>
              {creatingEquipment ? 'Salvando...' : 'Salvar Equipamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 