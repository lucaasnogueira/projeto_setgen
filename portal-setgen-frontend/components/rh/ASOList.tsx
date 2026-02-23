"use client"

import {
  useEffect,
  useState
} from 'react';
import { employeeApi } from '@/lib/api/employees';
import { ASO, ASOType } from '@/types';
import { 
  ShieldCheck, 
  Calendar, 
  Plus, 
  FileText, 
  Trash2, 
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pagination } from '../ui/pagination';
import { PaginatedResponse } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ASOListProps {
  employeeId: string;
  initialAsos: ASO[];
  onSuccess?: () => void;
}

export function ASOList({ employeeId, initialAsos, onSuccess }: ASOListProps) {
  const [asos, setAsos] = useState<ASO[]>(initialAsos);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<{ totalPages: number } | null>(null);

  const loadAsos = async (page: number) => {
    setLoading(true);
    try {
      const response = await employeeApi.getAsos(employeeId, page, 5); // 5 per page
      setAsos(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Erro ao carregar ASOs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage === 1 && asos === initialAsos) {
      // If first page and initial data matches, we might skip first load 
      // but let's just use the effect to handle all page changes
    }
    loadAsos(currentPage);
  }, [employeeId, currentPage]);

  // Handle updates from parent or successful additions
  useEffect(() => {
    if (currentPage === 1) {
      setAsos(initialAsos);
    }
  }, [initialAsos]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: ASOType.PERIODIC,
    examDate: '',
    expiryDate: '',
    result: 'APTO',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAddAso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('type', formData.type);
    data.append('examDate', formData.examDate);
    data.append('employeeId', employeeId);
    if (formData.expiryDate) data.append('expiryDate', formData.expiryDate);
    if (formData.result) data.append('result', formData.result);
    if (selectedFile) data.append('file', selectedFile);

    try {
      await employeeApi.addAso(employeeId, data);
      setIsModalOpen(false);
      
      // Notify parent to refresh data
      if (onSuccess) onSuccess();
      
      setFormData({ type: ASOType.PERIODIC, examDate: '', expiryDate: '', result: 'APTO' });
      setSelectedFile(null);
    } catch (error) {
      alert('Erro ao adicionar ASO');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este registro de ASO?')) return;
    try {
      await employeeApi.deleteAso(id);
      if (onSuccess) {
        onSuccess();
      } else {
        loadAsos(currentPage);
      }
    } catch (error) {
      alert('Erro ao excluir ASO');
    }
  };

  const getAsoStatus = (aso: ASO) => {
    const today = new Date();
    const expiry = new Date(aso.expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    if (today > expiry) return { label: 'Vencido', color: 'text-red-600 bg-red-50', icon: AlertCircle };
    if (thirtyDaysFromNow > expiry) return { label: 'Próximo do Vencimento', color: 'text-amber-600 bg-amber-50', icon: Clock };
    return { label: 'Regular', color: 'text-green-600 bg-green-50', icon: CheckCircle2 };
  };

  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gray-400" />
          Histórico de ASO
        </CardTitle>
        <Button onClick={() => setIsModalOpen(true)} className="bg-gray-700 hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Novo ASO
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left font-semibold">Tipo</th>
                <th className="px-6 py-4 text-left font-semibold">Data Exame</th>
                <th className="px-6 py-4 text-left font-semibold">Vencimento</th>
                <th className="px-6 py-4 text-left font-semibold">Resultado</th>
                <th className="px-6 py-4 text-left font-semibold">Status</th>
                <th className="px-6 py-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {asos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">
                    Nenhum registro de ASO encontrado
                  </td>
                </tr>
              ) : (
                asos.map((aso) => {
                  const status = getAsoStatus(aso);
                  const StatusIcon = status.icon;
                  return (
                    <tr key={aso.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 font-medium text-gray-700">{aso.type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(aso.examDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                        {format(new Date(aso.expiryDate), 'dd/MM/yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={aso.result === 'APTO' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'}>
                          {aso.result || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold flex items-center gap-1 w-fit ${status.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {aso.fileUrl && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${aso.fileUrl}`, '_blank')}
                              className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(aso.id)} 
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="border-t border-gray-100 bg-white">
            <Pagination
              currentPage={currentPage}
              totalPages={meta.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </CardContent>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Novo ASO</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddAso} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de ASO</Label>
              <Select
                value={formData.type}
                onValueChange={(value: ASOType) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ASOType.ADMISSIONAL}>Admissional</SelectItem>
                  <SelectItem value={ASOType.PERIODIC}>Periódico</SelectItem>
                  <SelectItem value={ASOType.RETURN_TO_WORK}>Retorno ao Trabalho</SelectItem>
                  <SelectItem value={ASOType.CHANGE_OF_FUNCTION}>Mudança de Função</SelectItem>
                  <SelectItem value={ASOType.DISMISSAL}>Demissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Exame</Label>
                <Input 
                  type="date" 
                  required
                  value={formData.examDate}
                  onChange={(e) => {
                    const examDate = e.target.value;
                    const date = new Date(examDate);
                    if (!isNaN(date.getTime())) {
                      const expiryDate = new Date(date);
                      expiryDate.setFullYear(date.getFullYear() + 1);
                      setFormData({
                        ...formData,
                        examDate,
                        expiryDate: expiryDate.toISOString().split('T')[0]
                      });
                    } else {
                      setFormData({ ...formData, examDate });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Vencimento</Label>
                <Input 
                  type="date" 
                  value={formData.expiryDate}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select
                value={formData.result}
                onValueChange={(value) => setFormData({ ...formData, result: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APTO">APTO</SelectItem>
                  <SelectItem value="INAPTO">INAPTO</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Documento (PDF ou Imagem)</Label>
              <Input 
                type="file" 
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".pdf,image/*"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gray-700" disabled={loading || !formData.examDate}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar ASO'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
