"use client"

import { useState } from 'react';
import { 
  Employee, 
  EmployeeStatus, 
  Gender, 
  CivilStatus, 
  ContractType, 
  SalaryType, 
  WorkRegime, 
  AccountType, 
  HierarchicalLevel 
} from '@/types';
import { IMaskInput } from "react-imask";
import { fetchCep } from '@/lib/api/cep';
import { 
  Save, 
  X, 
  User, 
  FileText, 
  Briefcase, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Building, 
  ShieldCheck,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function EmployeeForm({ initialData, onSubmit, onCancel, loading }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    // 📌 1. Dados Pessoais
    name: initialData?.name || '',
    socialName: initialData?.socialName || '',
    cpf: initialData?.cpf || '',
    rg: initialData?.rg || '',
    birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
    gender: initialData?.gender || Gender.PREFER_NOT_TO_SAY,
    civilStatus: initialData?.civilStatus || CivilStatus.SINGLE,
    nationality: initialData?.nationality || 'Brasileira',
    birthPlace: initialData?.birthPlace || '',
    isPcd: initialData?.isPcd || false,
    pcdType: initialData?.pcdType || '',

    // 📌 2. Contato
    personalEmail: initialData?.personalEmail || '',
    corporateEmail: initialData?.corporateEmail || '',
    mobilePhone: initialData?.mobilePhone || '',
    landlinePhone: initialData?.landlinePhone || '',
    address: initialData?.address || {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    },

    // 📌 3. Dados Trabalhistas
    ctps: initialData?.ctps || '',
    pisPasep: initialData?.pisPasep || '',
    voterId: initialData?.voterId || '',
    militaryCertificate: initialData?.militaryCertificate || '',
    admissionDate: initialData?.admissionDate ? new Date(initialData.admissionDate).toISOString().split('T')[0] : '',
    contractType: initialData?.contractType || ContractType.CLT,
    workHours: initialData?.workHours || '',
    position: initialData?.position || '',
    department: initialData?.department || '',
    costCenterId: initialData?.costCenterId || '',
    baseSalary: initialData?.baseSalary || 0,
    salaryType: initialData?.salaryType || SalaryType.MONTHLY,
    workRegime: initialData?.workRegime || WorkRegime.PRESENTIAL,

    // 📌 4. Dados Financeiros
    bank: initialData?.bank || '',
    agency: initialData?.agency || '',
    account: initialData?.account || '',
    accountType: initialData?.accountType || AccountType.CHECKING,
    pixKey: initialData?.pixKey || '',
    irDependents: initialData?.irDependents || 0,
    benefitsPlan: initialData?.benefitsPlan || [],

    // 📌 5. Estrutura Organizacional
    registration: initialData?.registration || '',
    managerId: initialData?.managerId || '',
    team: initialData?.team || '',
    branch: initialData?.branch || '',
    businessUnit: initialData?.businessUnit || '',
    hierarchicalLevel: initialData?.hierarchicalLevel || HierarchicalLevel.JUNIOR,

    // 📌 6. Status do Colaborador
    status: initialData?.status || EmployeeStatus.ACTIVE,
    terminationReason: initialData?.terminationReason || '',
    terminationDate: initialData?.terminationDate ? new Date(initialData.terminationDate).toISOString().split('T')[0] : '',

    // 📌 7. Dados de Acesso ao Sistema
    userId: initialData?.userId || '',
    login: initialData?.login || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const addressData = await fetchCep(cleanCep);
      if (addressData) {
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address,
            cep: cep, // maintain mask if possible or just use the clean one
            street: addressData.logradouro,
            neighborhood: addressData.bairro,
            city: addressData.localidade,
            state: addressData.uf
          }
        }));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Tabs defaultValue="personal" className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-500 w-full lg:w-auto">
            <TabsTrigger 
              value="personal" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              Pessoal
            </TabsTrigger>
            <TabsTrigger 
              value="contact"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              Contato
            </TabsTrigger>
            <TabsTrigger 
              value="labor"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              Trabalhista
            </TabsTrigger>
            <TabsTrigger 
              value="financial"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              Financeiro
            </TabsTrigger>
            <TabsTrigger 
              value="org"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              Estrutura
            </TabsTrigger>
            <TabsTrigger 
              value="status"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              Status
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Dados Pessoais */}
        <TabsContent value="personal" className="space-y-6 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-gray-700" />
                Informações Básicas
              </CardTitle>
              <CardDescription>Principais dados de identificação do colaborador</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <Label className="text-sm font-semibold">Nome Completo *</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="Ex: João da Silva"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nome Social</Label>
                  <Input
                    value={formData.socialName}
                    onChange={(e) => setFormData({ ...formData, socialName: e.target.value })}
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="Como o colaborador prefere ser chamado"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">CPF *</Label>
                  <IMaskInput
                    mask="000.000.000-00"
                    required
                    value={formData.cpf}
                    onAccept={(value: string) => setFormData({ ...formData, cpf: value })}
                    className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">RG</Label>
                  <Input
                    value={formData.rg}
                    onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Gênero</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value: Gender) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-xl">
                      <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Feminino</SelectItem>
                      <SelectItem value={Gender.OTHER}>Outro</SelectItem>
                      <SelectItem value={Gender.PREFER_NOT_TO_SAY}>Prefiro não dizer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Estado Civil</Label>
                  <Select
                    value={formData.civilStatus}
                    onValueChange={(value: CivilStatus) => setFormData({ ...formData, civilStatus: value })}
                  >
                    <SelectTrigger className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-xl">
                      <SelectItem value={CivilStatus.SINGLE}>Solteiro(a)</SelectItem>
                      <SelectItem value={CivilStatus.MARRIED}>Casado(a)</SelectItem>
                      <SelectItem value={CivilStatus.DIVORCED}>Divorciado(a)</SelectItem>
                      <SelectItem value={CivilStatus.WIDOWED}>Viúvo(a)</SelectItem>
                      <SelectItem value={CivilStatus.STABLE_UNION}>União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Nacionalidade</Label>
                  <Input
                    value={formData.nationality}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="Ex: Brasileira"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed border-2 border-gray-100 bg-gray-50/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                <div className="flex items-center space-x-3 h-11">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="isPcd"
                      className="w-5 h-5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 transition-all cursor-pointer"
                      checked={formData.isPcd}
                      onChange={(e) => setFormData({ ...formData, isPcd: e.target.checked })}
                    />
                  </div>
                  <Label htmlFor="isPcd" className="text-sm font-semibold cursor-pointer select-none">O colaborador possui deficiência (PCD)?</Label>
                </div>
                {formData.isPcd && (
                  <div className="space-y-2 lg:col-span-2 animate-fade-in">
                    <Label className="text-sm font-semibold">Tipo de Deficiência</Label>
                    <Input
                      value={formData.pcdType}
                      onChange={(e) => setFormData({ ...formData, pcdType: e.target.value })}
                      className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="Descreva a deficiência"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Contato */}
        <TabsContent value="contact" className="space-y-6 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-700" />
                Canais de Comunicação
              </CardTitle>
              <CardDescription>E-mails e telefones para contato</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">E-mail Pessoal</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      type="email"
                      value={formData.personalEmail}
                      onChange={(e) => setFormData({ ...formData, personalEmail: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="exemplo@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">E-mail Corporativo</Label>
                  <div className="relative group">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      type="email"
                      value={formData.corporateEmail}
                      onChange={(e) => setFormData({ ...formData, corporateEmail: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="colaborador@setgen.com.br"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Celular</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      value={formData.mobilePhone}
                      onChange={(e) => setFormData({ ...formData, mobilePhone: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Telefone Fixo</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      value={formData.landlinePhone}
                      onChange={(e) => setFormData({ ...formData, landlinePhone: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-700" />
                Endereço Residencial
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold">CEP</Label>
                  <IMaskInput 
                    mask="00000-000"
                    value={formData.address.cep} 
                    onAccept={(value: string) => {
                      handleAddressChange('cep', value);
                      handleCepLookup(value);
                    }} 
                    className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                    placeholder="00000-000"
                  />
                </div>
                <div className="md:col-span-4 lg:col-span-4 space-y-2">
                  <Label className="text-sm font-semibold">Logradouro (Rua/Avenida)</Label>
                  <Input 
                    value={formData.address.street} 
                    onChange={(e) => handleAddressChange('street', e.target.value)} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="Nome da rua ou avenida"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-sm font-semibold">Número</Label>
                  <Input 
                    value={formData.address.number} 
                    onChange={(e) => handleAddressChange('number', e.target.value)} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="Ex: 123"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-semibold">Complemento</Label>
                  <Input 
                    value={formData.address.complement} 
                    onChange={(e) => handleAddressChange('complement', e.target.value)} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="Apto, Bloco, etc."
                  />
                </div>
                <div className="space-y-2 md:col-span-3 lg:col-span-3">
                  <Label className="text-sm font-semibold">Bairro</Label>
                  <Input 
                    value={formData.address.neighborhood} 
                    onChange={(e) => handleAddressChange('neighborhood', e.target.value)} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-3 lg:col-span-3">
                  <Label className="text-sm font-semibold">Cidade</Label>
                  <Input 
                    value={formData.address.city} 
                    onChange={(e) => handleAddressChange('city', e.target.value)} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-sm font-semibold">Estado (UF)</Label>
                  <Input 
                    value={formData.address.state} 
                    onChange={(e) => handleAddressChange('state', e.target.value)} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="Ex: SP"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Dados Trabalhistas */}
        <TabsContent value="labor" className="space-y-6 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-gray-700" />
                Vínculo Empregatício
              </CardTitle>
              <CardDescription>Dados sobre o cargo e regime de contratação</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Cargo</Label>
                  <div className="relative group">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="Ex: Analista de Sistemas"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Setor / Departamento</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="Ex: TI"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Data de Admissão</Label>
                  <Input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tipo de Contrato</Label>
                  <Select
                    value={formData.contractType}
                    onValueChange={(value: ContractType) => setFormData({ ...formData, contractType: value })}
                  >
                    <SelectTrigger className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-xl">
                      <SelectItem value={ContractType.CLT}>CLT</SelectItem>
                      <SelectItem value={ContractType.PJ}>PJ</SelectItem>
                      <SelectItem value={ContractType.INTERN}>Estagiário</SelectItem>
                      <SelectItem value={ContractType.TEMPORARY}>Temporário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Regime de Trabalho</Label>
                  <Select
                    value={formData.workRegime}
                    onValueChange={(value: WorkRegime) => setFormData({ ...formData, workRegime: value })}
                  >
                    <SelectTrigger className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-xl">
                      <SelectItem value={WorkRegime.PRESENTIAL}>Presencial</SelectItem>
                      <SelectItem value={WorkRegime.HYBRID}>Híbrido</SelectItem>
                      <SelectItem value={WorkRegime.REMOTE}>Remoto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Jornada de Trabalho</Label>
                  <div className="relative group">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      placeholder="Ex: 44h semanais"
                      value={formData.workHours}
                      onChange={(e) => setFormData({ ...formData, workHours: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-700" />
                Documentação do Trabalho
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Salário Base</Label>
                  <div className="relative group">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <IMaskInput
                      mask="R$ num"
                      blocks={{
                        num: {
                          mask: Number,
                          thousandsSeparator: '.',
                          padFractionalZeros: true,
                          radix: ',',
                          mapToRadix: ['.'],
                        }
                      }}
                      unmask={true}
                      value={formData.baseSalary?.toString()}
                      onAccept={(value: string, mask: any) => setFormData({ ...formData, baseSalary: parseFloat(mask.unmaskedValue) || 0 })}
                      className="flex h-11 w-full rounded-md border border-gray-200 bg-white pl-10 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">CTPS</Label>
                  <Input 
                    value={formData.ctps} 
                    onChange={(e) => setFormData({ ...formData, ctps: e.target.value })} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">PIS/PASEP</Label>
                  <Input 
                    value={formData.pisPasep} 
                    onChange={(e) => setFormData({ ...formData, pisPasep: e.target.value })} 
                    className="h-11 border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Dados Financeiros */}
        <TabsContent value="financial" className="space-y-6 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-gray-700" />
                Dados Bancários
              </CardTitle>
              <CardDescription>Informações para pagamento de proventos</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Banco</Label>
                  <div className="relative group">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      value={formData.bank}
                      onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="Ex: Santander"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Agência</Label>
                  <Input 
                    value={formData.agency} 
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })} 
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Conta</Label>
                  <Input 
                    value={formData.account} 
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })} 
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="00000-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Tipo de Conta</Label>
                  <Select
                    value={formData.accountType}
                    onValueChange={(value: AccountType) => setFormData({ ...formData, accountType: value })}
                  >
                    <SelectTrigger className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-xl">
                      <SelectItem value={AccountType.CHECKING}>Corrente</SelectItem>
                      <SelectItem value={AccountType.SAVINGS}>Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Chave PIX</Label>
                  <Input 
                    value={formData.pixKey} 
                    onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })} 
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                    placeholder="E-mail, CPF, Celular ou Aleatória"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Dependentes IR</Label>
                  <Input
                    type="number"
                    value={formData.irDependents}
                    onChange={(e) => setFormData({ ...formData, irDependents: parseInt(e.target.value) })}
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Estrutura Organizacional */}
        <TabsContent value="org" className="space-y-6 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-gray-700" />
                Hierarquia e Localização
              </CardTitle>
              <CardDescription>Onde o colaborador se encaixa na organização</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Matrícula / Registro</Label>
                  <Input 
                    value={formData.registration} 
                    onChange={(e) => setFormData({ ...formData, registration: e.target.value })} 
                    className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Equipe / Time</Label>
                  <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                    <Input
                      value={formData.team}
                      onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                      className="pl-10 h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      placeholder="Nome da equipe"
                    />
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. Status e Acesso */}
        <TabsContent value="status" className="space-y-6 outline-none">
          <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-700" />
                Situação Cadastral
              </CardTitle>
              <CardDescription>Status atual do colaborador no sistema</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Status do Colaborador</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: EmployeeStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 shadow-xl">
                      <SelectItem value={EmployeeStatus.ACTIVE}>Ativo</SelectItem>
                      <SelectItem value={EmployeeStatus.AWAY}>Afastado</SelectItem>
                      <SelectItem value={EmployeeStatus.VACATION}>Férias</SelectItem>
                      <SelectItem value={EmployeeStatus.TERMINATED}>Desligado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.status === EmployeeStatus.TERMINATED && (
                  <>
                    <div className="space-y-2 animate-fade-in">
                      <Label className="text-sm font-semibold">Data de Desligamento</Label>
                      <Input
                        type="date"
                        value={formData.terminationDate}
                        onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                        className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2 animate-fade-in">
                      <Label className="text-sm font-semibold">Motivo do Desligamento</Label>
                      <Input
                        value={formData.terminationReason}
                        onChange={(e) => setFormData({ ...formData, terminationReason: e.target.value })}
                        className="h-11 bg-white border-gray-200 focus:border-gray-900 focus:ring-gray-900 transition-all shadow-sm"
                        placeholder="Descreva brevemente o motivo"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-100">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-all font-medium rounded-xl"
          disabled={loading}
        >
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 bg-gray-900 hover:bg-black text-white transition-all font-semibold rounded-xl shadow-md hover:shadow-lg active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Salvando...
            </div>
          ) : (
            <div className="flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Salvar Funcionário
            </div>
          )}
        </Button>
      </div>
    </form>
  );
}
