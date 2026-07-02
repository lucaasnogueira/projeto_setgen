"use client"

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { clientsApi } from '@/lib/api/clients';
import { Client, UserRole } from '@/types';
import { useAuthStore } from '@/store/auth';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Info,
  CheckCircle,
  FileText,
  User,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DetailHeader } from "@/components/layout/DetailHeader";
import Link from 'next/link';

export default function ClientDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadClient();
    }
  }, [params.id]);

  const loadClient = async () => {
    try {
      const data = await clientsApi.getOne(params.id as string);
      setClient(data);
    } catch (error) {
      console.error('Error loading client:', error);
      alert('Erro ao carregar detalhes do cliente');
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;

    try {
      await clientsApi.delete(params.id as string);
      alert('Cliente excluído com sucesso!');
      router.push('/clients');
    } catch (error) {
      alert('Erro ao excluir cliente');
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

  if (!client) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      <DetailHeader
        icon={Building2}
        title={client.companyName}
        subtitle={<><FileText className="h-3.5 w-3.5" />{client.cnpjCpf} {client.tradeName && `• ${client.tradeName}`}</>}
        onBack={() => router.back()}
        backLabel="Voltar para lista"
        actions={
          <>
            <Link href={`/clients/${client.id}/edit`}>
              <Button variant="outline" className="rounded-[9px] font-bold gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="rounded-[9px] font-bold gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </Button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações de Contato */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Users className="h-5 w-5 text-orange-600" />
                Contato e Identificação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">E-mail</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{client.email}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Telefone</h4>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">{client.phone}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</h4>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                    {client.status || 'Ativo'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">CNPJ / CPF</h4>
                  <p className="font-medium text-gray-700">{client.cnpjCpf}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <MapPin className="h-5 w-5 text-orange-600" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Logradouro</h4>
                  <p className="text-gray-700 font-medium">
                    {client.address?.street}, {client.address?.number}
                  </p>
                  {client.address?.complement && (
                    <p className="text-sm text-gray-500 italic mt-1">{client.address.complement}</p>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Bairro</h4>
                  <p className="text-gray-700 font-medium">{client.address?.neighborhood}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cidade / Estado</h4>
                  <p className="text-gray-700 font-medium">{client.address?.city} - {client.address?.state}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">CEP</h4>
                  <p className="text-gray-700 font-medium">{client.address?.cep}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="flex items-center gap-2 text-gray-800 text-lg">
                <Info className="h-5 w-5 text-orange-600" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                {client.notes || 'Sem observações cadastradas para este cliente.'}
              </p>

              {(client.group || client.segment || client.responsibleTeam || client.responsibleUser) && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {client.group && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700">
                      {client.group.name}
                    </span>
                  )}
                  {client.segment && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                      {client.segment.name}
                    </span>
                  )}
                  {client.responsibleTeam && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700">
                      Equipe: {client.responsibleTeam.name}
                    </span>
                  )}
                  {client.responsibleUser && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                      Resp.: {client.responsibleUser.name}
                    </span>
                  )}
                </div>
              )}

              {client.externalCode && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Código externo</p>
                  <p className="text-sm font-bold text-gray-700">{client.externalCode}</p>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Cliente desde</p>
                <p className="text-sm font-bold text-gray-700">
                  {new Date(client.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
