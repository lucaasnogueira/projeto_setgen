"use client"

import { useState, useEffect, useRef } from 'react';
import { clientsApi } from '@/lib/api/clients';
import { usersApi } from '@/lib/api/users';
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
import { VisitType, UserRole, TechnicalVisit } from '@/types';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
  const [searchTerm, setSearchTerm] = useState('');
  const [isTechDropdownOpen, setIsTechDropdownOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || '',
    technicianId: initialData?.technicianId || '',
    responsibleIds: initialData?.responsibleIds || [] as string[],
    visitDate: initialData?.visitDate ? new Date(initialData.visitDate).toISOString().slice(0, 16) : '',
    visitType: initialData?.visitType || VisitType.TECHNICAL,
    location: initialData?.location || '',
    description: initialData?.description || '',
    userReport: initialData?.userReport || '',
    notes: initialData?.notes || '',
  });

  const [attachments, setAttachments] = useState<AttachmentEntry[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    loadClients();
    loadTechnicians();

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTechDropdownOpen(false);
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

    setFormData({ ...formData, clientId, location: newLocation });
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
    data.append('visitType', formData.visitType);
    data.append('location', formData.location);
    data.append('description', formData.description);
    data.append('userReport', formData.userReport);
    data.append('notes', formData.notes);
    
    if (formData.technicianId) {
      data.append('technicianId', formData.technicianId);
    }

    formData.responsibleIds.forEach(id => {
      data.append('responsibleIds[]', id);
    });

    attachments.forEach(att => {
      data.append('files', att.file);
      data.append('legends[]', att.legend);
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

  const filteredTechs = technicians.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedTechs = technicians.filter(t => formData.responsibleIds.includes(t.id));

  return (
    <div className="bg-slate-50 flex flex-col rounded-xl border border-slate-200 shadow-sm relative w-full mx-auto">
      {/* Header / Stepper Horizontal */}
      <div className="bg-white border-b border-slate-200 p-6 rounded-t-xl z-10">
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
        <div className="relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0 rounded-full" />
          <div 
            className="absolute top-1/2 left-0 h-1 bg-slate-900 -translate-y-1/2 z-0 transition-all duration-500 rounded-full"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          />
          <nav className="relative z-10 flex justify-between">
            {steps.map((s) => {
              const isCompleted = step > s.id;
              const isCurrent = step === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => isCompleted && setStep(s.id)}
                  className={cn(
                    "flex flex-col items-center gap-3 transition-all px-2 bg-white",
                    isCompleted || isCurrent ? "text-slate-900" : "text-slate-400 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all bg-white",
                    isCompleted ? "border-slate-900 bg-slate-900 text-white shadow-md" : isCurrent ? "border-slate-900 text-slate-900 shadow-md" : "border-slate-100 text-slate-300"
                  )}>
                    {isCompleted ? <Check className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-bold hidden sm:block tracking-tight">{s.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <form onSubmit={handleSubmit} className="flex flex-col">
        <div className="p-6 md:p-8 space-y-6">
          {step === 1 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6">
              {/* Card 1: Dados Principais */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
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
                      className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 outline-none transition-colors"
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
                      className="w-full h-11 px-3 rounded-md border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:bg-white focus:border-slate-900 outline-none transition-colors"
                    >
                      <option value={VisitType.TECHNICAL}>Técnica</option>
                      <option value={VisitType.COMMERCIAL}>Comercial</option>
                      <option value={VisitType.MAINTENANCE}>Manutenção</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Card 2: Agendamento e Equipe */}
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2 mb-4 border-b pb-3 border-slate-100">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  Agendamento e Equipe
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data e Hora</Label>
                    <Input
                      type="datetime-local"
                      required
                      value={formData.visitDate}
                      onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                      className="h-11 border-slate-200 font-semibold text-sm bg-slate-50 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-2" ref={dropdownRef}>
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Equipe Responsável</Label>
                    <div className="relative">
                      <div 
                        className={cn(
                          "min-h-[2.75rem] w-full rounded-md border border-slate-200 bg-slate-50 p-2 flex flex-wrap gap-2 cursor-pointer transition-all focus-within:bg-white focus-within:border-slate-900",
                          isTechDropdownOpen && "border-slate-900 bg-white ring-1 ring-slate-900/10"
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
                        <div className="absolute top-full left-0 w-full mt-2 z-50 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-hidden flex flex-col">
                          <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                             <div className="relative">
                               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                               <Input 
                                 placeholder="Filtrar por nome..." 
                                 value={searchTerm}
                                 onChange={(e) => setSearchTerm(e.target.value)}
                                 onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                                 className="h-9 pl-9 text-sm border-slate-200 focus:border-slate-900 bg-white"
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
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
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
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 font-semibold text-sm focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
                    placeholder="Av. Exemplo, 123 - Bairro, Cidade/UF"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
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
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
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
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm font-medium focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
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
                  <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-2">
                    <Plus className="w-6 h-6 text-slate-900" />
                  </div>
                  <span className="text-sm font-bold uppercase tracking-wider text-slate-600">Clique para anexar arquivos</span>
                  <span className="text-xs font-medium text-slate-400">Suporta imagens, PDFs e documentos</span>
                  <input id="file-upload" type="file" multiple onChange={handleFileChange} onClick={(e) => e.stopPropagation()} className="hidden" />
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {attachments.map((att) => (
                      <div key={att.id} className="border border-slate-200 rounded-lg p-3 bg-white shadow-sm flex items-center gap-3 group transition-all hover:shadow-md">
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
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-5 px-6 md:px-8 flex items-center justify-between rounded-b-xl shadow-[0_-10px_30px_-10px_rgb(0,0,0,0.05)] z-20">
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
                className="h-11 px-8 bg-slate-900 text-white font-bold text-sm rounded-md shadow-md hover:bg-slate-800 transition-all hover:shadow-lg disabled:opacity-50"
              >
                Próximo Passo
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={loading}
                className="h-11 px-8 bg-green-600 text-white font-bold text-sm rounded-md shadow-md hover:bg-green-700 transition-all hover:shadow-lg disabled:opacity-50"
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
    </div>
  );
}
 