"use client"

import { useState } from 'react';
import { ART } from '@/types';
import { artApi } from '@/lib/api/art';
import { ShieldCheck, FileDown, HardHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { openAuthedFile } from '@/lib/utils/auth-file';
import { formatDateBR } from '@/lib/date';

interface ArtCardProps {
  serviceOrderId: string;
  art?: ART;
  onIssued: (art: ART) => void;
}

// Toda ServiceOrder já nasce de um orçamento aceito — a ART pode ser emitida
// assim que a OS existe, sem checagem de status (ver ArtService no backend).
export function ArtCard({ serviceOrderId, art, onIssued }: ArtCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    number: '',
    engineerName: '',
    creaNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
  });
  const [file, setFile] = useState<File | undefined>();

  const handleSubmit = async () => {
    if (!form.number || !form.engineerName || !form.creaNumber) {
      alert('Preencha número, responsável técnico e CREA');
      return;
    }
    setSaving(true);
    try {
      const created = await artApi.create({
        serviceOrderId,
        number: form.number,
        engineerName: form.engineerName,
        creaNumber: form.creaNumber,
        issueDate: new Date(form.issueDate).toISOString(),
        file,
      });
      onIssued(created);
      setShowForm(false);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao emitir ART');
    } finally {
      setSaving(false);
    }
  };

  if (art) {
    return (
      <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            ART
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 sm:p-4 space-y-2.5">
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Número</p>
            <p className="text-xs font-bold text-gray-900">{art.number}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Responsável Técnico</p>
            <p className="text-xs text-gray-700">{art.engineerName} — CREA {art.creaNumber}</p>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Emissão</p>
            <p className="text-xs text-gray-700">{formatDateBR(art.issueDate)}</p>
          </div>
          {art.fileUrl && (
            <button
              type="button"
              onClick={() => openAuthedFile(art.fileUrl!)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E2661D] hover:underline pt-1"
            >
              <FileDown className="h-3.5 w-3.5" />
              Ver documento
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
      <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
        <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
          <HardHat className="h-4 w-4 text-amber-600" />
          ART
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3.5 sm:p-4 space-y-3">
        {!showForm ? (
          <>
            <p className="text-xs text-gray-500">Esta OS ainda não possui ART emitida.</p>
            <Button onClick={() => setShowForm(true)} className="w-full h-9 rounded-lg font-semibold text-xs bg-gray-900 hover:bg-black text-white shadow-2xs">
              Emitir ART
            </Button>
          </>
        ) : (
          <div className="space-y-2.5">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Número da ART</Label>
              <Input className="h-9 text-xs rounded-lg border-gray-200" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="ART-2026-000123" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Responsável Técnico</Label>
              <Input className="h-9 text-xs rounded-lg border-gray-200" value={form.engineerName} onChange={(e) => setForm({ ...form, engineerName: e.target.value })} placeholder="Eng. João Silva" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">CREA</Label>
              <Input className="h-9 text-xs rounded-lg border-gray-200" value={form.creaNumber} onChange={(e) => setForm({ ...form, creaNumber: e.target.value })} placeholder="SP-1234567890" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Data de emissão</Label>
              <Input className="h-9 text-xs rounded-lg border-gray-200" type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Arquivo (opcional)</Label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0])} className="text-xs text-gray-600 block w-full" />
            </div>
            <div className="flex gap-2 pt-1.5">
              <Button variant="outline" className="flex-1 h-9 rounded-lg font-semibold text-xs border-gray-200" onClick={() => setShowForm(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="flex-1 h-9 rounded-lg font-semibold text-xs bg-gray-900 hover:bg-black text-white shadow-2xs" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Emitindo...' : 'Emitir'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
