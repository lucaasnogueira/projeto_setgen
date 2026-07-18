"use client"

import { useState } from 'react';
import { ART, ServiceOrderStatus } from '@/types';
import { artApi } from '@/lib/api/art';
import { ShieldCheck, FileDown, HardHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { openAuthedFile } from '@/lib/utils/auth-file';

const ART_ELIGIBLE_STATUSES: ServiceOrderStatus[] = [
  ServiceOrderStatus.APPROVED,
  ServiceOrderStatus.SENT_TO_CLIENT,
  ServiceOrderStatus.AWAITING_RESPONSE,
  ServiceOrderStatus.IN_PROGRESS,
  ServiceOrderStatus.AWAITING_MATERIALS,
  ServiceOrderStatus.COMPLETED,
];

interface ArtCardProps {
  serviceOrderId: string;
  serviceOrderStatus: ServiceOrderStatus;
  art?: ART;
  onIssued: (art: ART) => void;
}

export function ArtCard({ serviceOrderId, serviceOrderStatus, art, onIssued }: ArtCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    number: '',
    engineerName: '',
    creaNumber: '',
    issueDate: new Date().toISOString().slice(0, 10),
  });
  const [file, setFile] = useState<File | undefined>();

  const eligible = ART_ELIGIBLE_STATUSES.includes(serviceOrderStatus);

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
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            ART
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Número</p>
            <p className="text-sm font-bold text-foreground">{art.number}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Responsável Técnico</p>
            <p className="text-sm text-foreground">{art.engineerName} — CREA {art.creaNumber}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Emissão</p>
            <p className="text-sm text-foreground">{new Date(art.issueDate).toLocaleDateString('pt-BR')}</p>
          </div>
          {art.fileUrl && (
            <button
              type="button"
              onClick={() => openAuthedFile(art.fileUrl!)}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline pt-2"
            >
              <FileDown className="h-4 w-4" />
              Ver documento
            </button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!eligible) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30 border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardHat className="h-5 w-5 text-amber-600" />
          ART
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {!showForm ? (
          <>
            <p className="text-sm text-muted-foreground">Esta OS ainda não possui ART emitida.</p>
            <Button onClick={() => setShowForm(true)} className="w-full rounded-[9px] font-bold">
              Emitir ART
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Número da ART</Label>
              <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="ART-2026-000123" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsável Técnico</Label>
              <Input value={form.engineerName} onChange={(e) => setForm({ ...form, engineerName: e.target.value })} placeholder="Eng. João Silva" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CREA</Label>
              <Input value={form.creaNumber} onChange={(e) => setForm({ ...form, creaNumber: e.target.value })} placeholder="SP-1234567890" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Data de emissão</Label>
              <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Arquivo (opcional)</Label>
              <input type="file" onChange={(e) => setFile(e.target.files?.[0])} className="text-xs" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-[9px] font-bold" onClick={() => setShowForm(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="flex-1 rounded-[9px] font-bold" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Emitindo...' : 'Emitir'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
