"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { equipmentApi } from '@/lib/api/equipment';
import { Equipment, EquipmentType, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { Zap, Box, Edit, Trash2, Building2, Calendar, MapPin, Hash, ClipboardList } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompactDetailHeader } from "@/components/layout/CompactDetailHeader";
import { FieldBlock } from "@/components/ui/field-block";
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.GENERATOR]: "Gerador",
  [EquipmentType.SUBSTATION]: "Subestação",
  [EquipmentType.OTHER]: "Outro",
};

export default function EquipmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadEquipment();
    }
  }, [params.id]);

  const loadEquipment = async () => {
    try {
      const data = await equipmentApi.getOne(params.id as string);
      setEquipment(data);
    } catch (error) {
      console.error('Error loading equipment:', error);
      alert('Erro ao carregar detalhes do equipamento');
      router.push('/equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento?')) return;

    try {
      await equipmentApi.delete(params.id as string);
      alert('Equipamento excluído com sucesso!');
      router.push('/equipment');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao excluir equipamento');
    }
  };

  const canDelete = user?.role === UserRole.ADMIN || user?.role === UserRole.MANAGER;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!equipment) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      <CompactDetailHeader
        icon={equipment.type === EquipmentType.GENERATOR ? Zap : Box}
        title={`${equipment.brand || 'Sem marca'} ${equipment.model || ''}`.trim()}
        meta={<>{EQUIPMENT_TYPE_LABELS[equipment.type]} {equipment.serialNumber && `· SN: ${equipment.serialNumber}`}</>}
        backLabel="Voltar para lista"
        onBack={() => router.back()}
        actions={
          <>
            <Link href={`/equipment/${equipment.id}/edit`}>
              <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            {canDelete && (
              <Button variant="destructive" onClick={handleDelete} className="rounded-[9px] font-bold gap-2">
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </>
        }
      />

      <Tabs defaultValue="detalhes">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="visitas">Visitas Técnicas</TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes" className="mt-4 space-y-4">
          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Cliente
            </div>
            <Link href={`/clients/${equipment.clientId}`} className="text-[14px] font-bold text-primary hover:underline">
              {equipment.client?.companyName || equipment.clientId}
            </Link>
          </Card>

          <Card className="p-6">
            <div className="text-[13.5px] font-bold text-foreground mb-4">Especificações</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FieldBlock label="Potência" value={equipment.powerRating} />
              <FieldBlock
                label={<span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Local de instalação</span>}
                value={equipment.installLocation}
              />
              <FieldBlock
                label={<span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Data de compra</span>}
                value={equipment.purchaseDate ? formatDate(equipment.purchaseDate) : undefined}
              />
              <FieldBlock
                label={<span className="flex items-center gap-1"><Hash className="h-3 w-3" /> Nº de série</span>}
                value={equipment.serialNumber}
              />
            </div>
          </Card>

          {equipment.notes && (
            <Card className="p-6">
              <div className="text-[13.5px] font-bold text-foreground mb-3">Observações</div>
              <p className="text-[13px] text-text-secondary leading-relaxed">{equipment.notes}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="visitas" className="mt-4">
          <Card className="overflow-hidden">
            {!equipment.technicalVisits || equipment.technicalVisits.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="h-9 w-9 text-border mx-auto mb-3" />
                <p className="text-[13.5px] text-text-secondary">Nenhuma visita registrada para este equipamento ainda.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {equipment.technicalVisits.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-[13px] px-6 py-3">
                    <span className="font-medium text-foreground">{formatDate(v.visitDate)}</span>
                    <div className="flex items-center gap-2">
                      {v.chargeable && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-status-amber-bg text-status-amber-fg">Cobrável</span>
                      )}
                      <span className="text-text-muted">{v.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
