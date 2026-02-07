"use client"

import { useState, useEffect } from 'react';
import { visitsApi } from '@/lib/api/visits';
import { clientsApi } from '@/lib/api/clients';
import { usersApi } from '@/lib/api/users';
import { User, Info, Clock, MapPin, HardHat, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VisitType, UserRole, TechnicalVisit } from '@/types';

interface VisitFormProps {
  initialData?: Partial<TechnicalVisit>;
  onSubmit: (data: any) => Promise<void>;
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
  submitLabel
}: VisitFormProps) {
  const [clients, setClients] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    clientId: initialData?.clientId || '',
    technicianId: initialData?.technicianId || '',
    visitDate: initialData?.visitDate ? new Date(initialData.visitDate).toISOString().slice(0, 16) : '',
    visitType: initialData?.visitType || VisitType.TECHNICAL,
    location: initialData?.location || '',
    description: initialData?.description || '',
    notes: initialData?.notes || '',
  });

  useEffect(() => {
    loadClients();
    loadTechnicians();
  }, []);

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
      const techs = allUsers.filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.ADMIN);
      setTechnicians(techs);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      visitDate: formData.visitDate ? new Date(formData.visitDate).toISOString() : '',
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cliente e Técnico */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <User className="h-5 w-5 text-purple-600" />
            Participantes e Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Cliente <span className="text-red-500">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full flex h-11 rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Técnico Responsável <span className="text-red-500">*</span></Label>
              <div className="relative">
                <HardHat className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  required
                  value={formData.technicianId}
                  onChange={(e) => setFormData({ ...formData, technicianId: e.target.value })}
                  className="w-full flex h-11 rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                >
                  <option value="">Selecione um técnico</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Tipo de Visita <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Info className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  required
                  value={formData.visitType}
                  onChange={(e) => setFormData({ ...formData, visitType: e.target.value as VisitType })}
                  className="w-full flex h-11 rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
                >
                  <option value={VisitType.TECHNICAL}>Técnica</option>
                  <option value={VisitType.COMMERCIAL}>Comercial</option>
                  <option value={VisitType.MAINTENANCE}>Manutenção</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Data e Hora <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="datetime-local"
                  required
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  className="h-11 pl-10 rounded-xl focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Local/Endereço <span className="text-red-500">*</span></Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Endereço onde será realizada a visita"
                className="h-11 pl-10 rounded-xl focus:ring-purple-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Visita */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Info className="h-5 w-5 text-purple-600" />
            Objetivo e Descrição
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Descrição do Objetivo <span className="text-red-500">*</span></Label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              placeholder="Descreva detalhadamente o que será realizado na visita..."
              className="w-full flex min-h-[100px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Observações</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Informações adicionais importantes..."
              className="w-full flex min-h-[80px] rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl border-2 hover:bg-gray-50 flex items-center justify-center gap-2 font-bold text-gray-600 transition-all active:scale-95"
        >
          <X className="h-5 w-5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? 'Salvando...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
