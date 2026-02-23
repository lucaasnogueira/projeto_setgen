"use client"

import { useState, useEffect } from 'react';
import { employeeApi } from '@/lib/api/employees';
import { EmployeeDocument, PaginatedResponse } from '@/types';
import { Pagination } from '../ui/pagination';
import { 
  FileBox, 
  Plus, 
  FileText, 
  Trash2, 
  Download,
  Loader2,
  FileCheck
} from 'lucide-react';
import { DOCUMENT_CATEGORIES } from '@/constants/documentTypes';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  SelectGroup,
  SelectLabel,
  SelectSeparator
} from "@/components/ui/select";

interface DocumentListProps {
  employeeId: string;
  initialDocuments: EmployeeDocument[];
  onSuccess?: () => void;
}

export function DocumentList({ employeeId, initialDocuments, onSuccess }: DocumentListProps) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>(initialDocuments);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<EmployeeDocument>['meta'] | null>(null);

  const loadDocuments = async (page: number) => {
    setLoading(true);
    try {
      const response = await employeeApi.getDocuments(employeeId, page, 5); // 5 per page
      setDocuments(response.data);
      setMeta(response.meta);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments(currentPage);
  }, [employeeId, currentPage]);

  // Sync state when initialDocuments prop changes (e.g. after parent re-fetch)
  useEffect(() => {
    if (currentPage === 1) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);

    const data = new FormData();
    data.append('name', formData.name);
    data.append('employeeId', employeeId);
    if (formData.type) data.append('type', formData.type);
    data.append('file', selectedFile);

    try {
      await employeeApi.addDocument(employeeId, data);
      setIsModalOpen(false);
      if (onSuccess) {
        onSuccess();
      } else {
        const response = await employeeApi.getDocuments(employeeId, currentPage, 5);
        setDocuments(response.data);
        setMeta(response.meta);
      }
      setFormData({ name: '', type: '' });
      setSelectedFile(null);
    } catch (error) {
      alert('Erro ao adicionar documento');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Excluir este documento?')) return;
    try {
      await employeeApi.deleteDocument(id);
      if (onSuccess) {
        onSuccess();
      } else {
        loadDocuments(currentPage);
      }
    } catch (error) {
      alert('Erro ao excluir documento');
    }
  };

  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 flex flex-row items-center justify-between">
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <FileBox className="h-5 w-5 text-gray-400" />
          Documentação do Funcionário
        </CardTitle>
        <Button onClick={() => setIsModalOpen(true)} className="bg-gray-700 hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400 italic">
              Nenhum documento cadastrado
            </div>
          ) : (
            documents.map((doc) => (
              <div 
                key={doc.id}
                className="group p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <FileCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800 truncate max-w-[150px]">{doc.name}</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{doc.type || 'Documento'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}/${doc.fileUrl}`, '_blank')}
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDelete(doc.id)}
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
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
            <DialogTitle>Novo Documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDocument} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Documento <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.name} 
                onValueChange={(value) => {
                  if (value === 'DOCUMENTO_PERSONALIZADO') {
                    setFormData({
                      ...formData, 
                      name: '', 
                      type: 'Personalizado'
                    });
                  } else {
                    // Find category for the selected item
                    const category = DOCUMENT_CATEGORIES.find(cat => cat.items.includes(value));
                    setFormData({
                      ...formData, 
                      name: value,
                      type: category?.label || ''
                    });
                  }
                }}
                required
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecione o documento" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {DOCUMENT_CATEGORIES.map((category) => (
                    <SelectGroup key={category.label}>
                      <SelectLabel className="text-orange-600 font-bold">{category.label}</SelectLabel>
                      {category.items.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Outros</SelectLabel>
                    <SelectItem value="DOCUMENTO_PERSONALIZADO">Outro documento...</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'Personalizado' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Label>Descreva o Documento <span className="text-red-500">*</span></Label>
                <Input 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: Certificado de Workshop"
                  autoFocus
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Tipo/Categoria (automático)</Label>
              <Input 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                placeholder="Categoria do documento"
                disabled={formData.name !== 'DOCUMENT_PERSONALIZADO'}
              />
            </div>

            <div className="space-y-2">
              <Label>Arquivo <span className="text-red-500">*</span></Label>
              <Input 
                type="file" 
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-gray-700" disabled={loading || !selectedFile || !formData.name}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fazer Upload'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
