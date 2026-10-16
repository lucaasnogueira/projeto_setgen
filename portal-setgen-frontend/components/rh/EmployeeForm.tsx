"use client"

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  DollarSign,
  AlertCircle,
  FileBadge,
  Map
} from 'lucide-react';
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StepRail, StepFooter, type WizardStep } from "@/components/ui/step-wizard";
import { toDateInputValue } from '@/lib/date';

type StepKey = "personal" | "contact" | "labor" | "financial" | "org" | "status";
const stepDefs: WizardStep[] = [
  { key: "personal", label: "Pessoal" },
  { key: "contact", label: "Contato" },
  { key: "labor", label: "Trabalhista" },
  { key: "financial", label: "Financeiro" },
  { key: "org", label: "Estrutura" },
  { key: "status", label: "Status" },
];

const ERROR_STEP_MAP: Record<string, StepKey> = {
  name: "personal", socialName: "personal", cpf: "personal", rg: "personal", birthDate: "personal",
  gender: "personal", civilStatus: "personal", nationality: "personal", birthPlace: "personal", pcdType: "personal",
  personalEmail: "contact", corporateEmail: "contact", mobilePhone: "contact", landlinePhone: "contact", address: "contact",
  ctps: "labor", pisPasep: "labor", voterId: "labor", militaryCertificate: "labor", admissionDate: "labor",
  contractType: "labor", workHours: "labor", position: "labor", department: "labor", costCenterId: "labor",
  baseSalary: "labor", salaryType: "labor", workRegime: "labor",
  bank: "financial", agency: "financial", account: "financial", accountType: "financial", pixKey: "financial", irDependents: "financial",
  registration: "org", managerId: "org", team: "org", branch: "org", businessUnit: "org", hierarchicalLevel: "org",
  status: "status", terminationReason: "status", terminationDate: "status", login: "status",
};

const employeeSchema = z.object({
  // Pessoal
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  socialName: z.string().optional(),
  cpf: z.string().min(11, "CPF inválido"),
  rg: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.nativeEnum(Gender),
  civilStatus: z.nativeEnum(CivilStatus),
  nationality: z.string().optional(),
  birthPlace: z.string().optional(),
  isPcd: z.boolean(),
  pcdType: z.string().optional(),

  // Contato
  personalEmail: z.string().email("E-mail pessoal inválido").optional().or(z.literal('')),
  corporateEmail: z.string().email("E-mail corporativo inválido").optional().or(z.literal('')),
  mobilePhone: z.string().min(10, "Celular inválido").optional().or(z.literal('')),
  landlinePhone: z.string().optional(),
  address: z.object({
    cep: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    complement: z.string().optional(),
    neighborhood: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  }),

  // Trabalhista
  ctps: z.string().optional(),
  pisPasep: z.string().optional(),
  voterId: z.string().optional(),
  militaryCertificate: z.string().optional(),
  admissionDate: z.string().min(1, "Data de admissão é obrigatória"),
  contractType: z.nativeEnum(ContractType),
  workHours: z.string().optional(),
  position: z.string().min(2, "Cargo é obrigatório"),
  department: z.string().optional(),
  costCenterId: z.string().optional(),
  baseSalary: z.number(),
  salaryType: z.nativeEnum(SalaryType),
  workRegime: z.nativeEnum(WorkRegime),

  // Financeiro
  bank: z.string().optional(),
  agency: z.string().optional(),
  account: z.string().optional(),
  accountType: z.nativeEnum(AccountType),
  pixKey: z.string().optional(),
  irDependents: z.number(),

  // Estrutura
  registration: z.string().optional(),
  managerId: z.string().optional(),
  team: z.string().optional(),
  branch: z.string().optional(),
  businessUnit: z.string().optional(),
  hierarchicalLevel: z.nativeEnum(HierarchicalLevel),

  // Status
  status: z.nativeEnum(EmployeeStatus),
  terminationReason: z.string().optional(),
  terminationDate: z.string().optional(),
  
  // Acesso
  login: z.string().optional(),
}).passthrough();

type EmployeeFormValues = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function EmployeeForm({ initialData, onSubmit, onCancel, loading }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: initialData?.name || '',
      socialName: initialData?.socialName || '',
      cpf: initialData?.cpf || '',
      rg: initialData?.rg || '',
      birthDate: toDateInputValue(initialData?.birthDate),
      gender: initialData?.gender || Gender.PREFER_NOT_TO_SAY,
      civilStatus: initialData?.civilStatus || CivilStatus.SINGLE,
      nationality: initialData?.nationality || 'Brasileira',
      birthPlace: initialData?.birthPlace || '',
      isPcd: !!initialData?.isPcd,
      pcdType: initialData?.pcdType || '',
      personalEmail: initialData?.personalEmail || '',
      corporateEmail: initialData?.corporateEmail || '',
      mobilePhone: initialData?.mobilePhone || '',
      landlinePhone: initialData?.landlinePhone || '',
      address: {
        cep: initialData?.address?.cep || '',
        street: initialData?.address?.street || '',
        number: initialData?.address?.number || '',
        complement: initialData?.address?.complement || '',
        neighborhood: initialData?.address?.neighborhood || '',
        city: initialData?.address?.city || '',
        state: initialData?.address?.state || '',
      },
      ctps: initialData?.ctps || '',
      pisPasep: initialData?.pisPasep || '',
      voterId: initialData?.voterId || '',
      militaryCertificate: initialData?.militaryCertificate || '',
      admissionDate: toDateInputValue(initialData?.admissionDate),
      contractType: initialData?.contractType || ContractType.CLT,
      workHours: initialData?.workHours || '',
      position: initialData?.position || '',
      department: initialData?.department || '',
      costCenterId: initialData?.costCenterId || '',
      baseSalary: Number(initialData?.baseSalary || 0),
      salaryType: initialData?.salaryType || SalaryType.MONTHLY,
      workRegime: initialData?.workRegime || WorkRegime.PRESENTIAL,
      bank: initialData?.bank || '',
      agency: initialData?.agency || '',
      account: initialData?.account || '',
      accountType: initialData?.accountType || AccountType.CHECKING,
      pixKey: initialData?.pixKey || '',
      irDependents: Number(initialData?.irDependents || 0),
      registration: initialData?.registration || '',
      managerId: initialData?.managerId || '',
      team: initialData?.team || '',
      branch: initialData?.branch || '',
      businessUnit: initialData?.businessUnit || '',
      hierarchicalLevel: initialData?.hierarchicalLevel || HierarchicalLevel.JUNIOR,
      status: initialData?.status || EmployeeStatus.ACTIVE,
      terminationReason: initialData?.terminationReason || '',
      terminationDate: toDateInputValue(initialData?.terminationDate),
      login: initialData?.login || '',
    }
  });

  const { register, handleSubmit, setValue, control, watch, formState: { errors } } = form;
  const isPcd = watch("isPcd");
  const currentStatus = watch("status");

  const [activeStep, setActiveStep] = useState<StepKey>("personal");

  useEffect(() => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey && ERROR_STEP_MAP[firstErrorKey]) setActiveStep(ERROR_STEP_MAP[firstErrorKey]);
  }, [errors]);

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const addressData = await fetchCep(cleanCep);
      if (addressData) {
        setValue('address.street', addressData.logradouro);
        setValue('address.neighborhood', addressData.bairro);
        setValue('address.city', addressData.localidade);
        setValue('address.state', addressData.uf);
      }
    }
  };

  const onFormSubmit = async (data: EmployeeFormValues) => {
    // Campos string opcionais viram "" no form; o backend valida formato
    // (e-mail, data) mesmo em @IsOptional() quando a chave vem como "" em
    // vez de ausente — precisa virar undefined pra ser omitido do payload.
    const sanitized: Record<string, any> = { ...data };
    for (const [key, value] of Object.entries(sanitized)) {
      if (value === '') sanitized[key] = undefined;
    }
    if (sanitized.address) {
      const address = { ...sanitized.address };
      for (const [key, value] of Object.entries(address)) {
        if (value === '') address[key] = undefined;
      }
      sanitized.address = address;
    }
    if (data.status !== EmployeeStatus.TERMINATED) {
      sanitized.terminationReason = undefined;
      sanitized.terminationDate = undefined;
    }
    await onSubmit(sanitized);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-4">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      {/* 1. Dados Pessoais */}
      <div className={cn("space-y-4", activeStep !== "personal" && "hidden")}>
          <Card className="border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-gray-900">
                <User className="h-3.5 w-3.5 text-[#E2661D]" />
                Dados Pessoais
              </CardTitle>
              <CardDescription className="text-[11px] text-gray-500">Informações básicas e civis do colaborador</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label className="font-semibold text-xs text-gray-700">Nome Completo *</Label>
                  <Input {...register("name")} placeholder="Ex: João da Silva" className="h-9 rounded-lg text-xs border-gray-200" />
                  {errors.name && <p className="text-[11px] font-bold text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Nome Social</Label>
                  <Input {...register("socialName")} placeholder="Opcional" className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">CPF *</Label>
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        mask="000.000.000-00"
                        value={field.value}
                        onAccept={field.onChange}
                        className="w-full flex h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs focus:ring-1 focus:ring-[#E2661D] focus:border-[#E2661D] outline-none"
                        placeholder="000.000.000-00"
                      />
                    )}
                  />
                  {errors.cpf && <p className="text-[11px] font-bold text-red-500">{errors.cpf.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">RG</Label>
                  <Input {...register("rg")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Data de Nascimento</Label>
                  <Input type="date" {...register("birthDate")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Gênero</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Gender.MALE}>Masculino</SelectItem>
                          <SelectItem value={Gender.FEMALE}>Feminino</SelectItem>
                          <SelectItem value={Gender.OTHER}>Outro</SelectItem>
                          <SelectItem value={Gender.PREFER_NOT_TO_SAY}>Não dizer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Estado Civil</Label>
                  <Controller
                    name="civilStatus"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CivilStatus.SINGLE}>Solteiro(a)</SelectItem>
                          <SelectItem value={CivilStatus.MARRIED}>Casado(a)</SelectItem>
                          <SelectItem value={CivilStatus.DIVORCED}>Divorciado(a)</SelectItem>
                          <SelectItem value={CivilStatus.WIDOWED}>Viúvo(a)</SelectItem>
                          <SelectItem value={CivilStatus.STABLE_UNION}>União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Nacionalidade</Label>
                  <Input {...register("nationality")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPcd" {...register("isPcd")} className="h-4 w-4 rounded border-gray-300 text-[#E2661D] focus:ring-[#E2661D]" />
                  <Label htmlFor="isPcd" className="font-semibold text-xs text-gray-700 cursor-pointer">Colaborador PCD?</Label>
                </div>
                {isPcd && <Input {...register("pcdType")} placeholder="Descreva a deficiência..." className="flex-1 h-9 bg-white rounded-lg text-xs border-gray-200" />}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 2. Contato */}
      <div className={cn("space-y-4", activeStep !== "contact" && "hidden")}>
          <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#E2661D]" />
                Canais de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">E-mail Pessoal</Label>
                  <Input {...register("personalEmail")} placeholder="exemplo@email.com" className="h-9 rounded-lg text-xs border-gray-200" />
                  {errors.personalEmail && <p className="text-[11px] font-semibold text-red-500">{errors.personalEmail.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">E-mail Corporativo</Label>
                  <Input {...register("corporateEmail")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Celular</Label>
                  <Controller
                    name="mobilePhone"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        mask="(00) 00000-0000"
                        value={field.value}
                        onAccept={field.onChange}
                        className="w-full flex h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D]/20 transition-all"
                        placeholder="(00) 00000-0000"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                 <Label className="font-bold text-xs sm:text-sm text-gray-900 mb-3 flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#E2661D]"/> Endereço Residencial</Label>
                 <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="font-semibold text-xs text-gray-700">CEP</Label>
                      <Controller
                        name="address.cep"
                        control={control}
                        render={({ field }) => (
                          <IMaskInput
                            mask="00000-000"
                            value={field.value}
                            onAccept={(val) => { field.onChange(val); handleCepLookup(val); }}
                            className="w-full h-9 rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D]/20 transition-all"
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-4 space-y-1.5">
                      <Label className="font-semibold text-xs text-gray-700">Logradouro</Label>
                      <Input {...register("address.street")} className="h-9 rounded-lg text-xs border-gray-200" />
                    </div>
                    <div className="md:col-span-1 space-y-1.5">
                      <Label className="font-semibold text-xs text-gray-700">Nº</Label>
                      <Input {...register("address.number")} className="h-9 rounded-lg text-xs border-gray-200" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="font-semibold text-xs text-gray-700">Bairro</Label>
                      <Input {...register("address.neighborhood")} className="h-9 rounded-lg text-xs border-gray-200" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="font-semibold text-xs text-gray-700">Cidade</Label>
                      <Input {...register("address.city")} className="h-9 rounded-lg text-xs border-gray-200" />
                    </div>
                    <div className="md:col-span-1 space-y-1.5">
                      <Label className="font-semibold text-xs text-gray-700">UF</Label>
                      <Input {...register("address.state")} maxLength={2} className="h-9 rounded-lg text-xs border-gray-200 uppercase" />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 3. Dados Trabalhistas */}
      <div className={cn("space-y-4", activeStep !== "labor" && "hidden")}>
          <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5 text-[#E2661D]" />
                Vínculo e Cargo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid md:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Cargo *</Label>
                  <Input {...register("position")} className="h-9 rounded-lg text-xs border-gray-200" />
                  {errors.position && <p className="text-[11px] font-semibold text-red-500">{errors.position.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Departamento</Label>
                  <Input {...register("department")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Data de Admissão *</Label>
                  <Input type="date" {...register("admissionDate")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-3.5 border-t border-gray-100 pt-3.5">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">CTPS</Label>
                  <Input {...register("ctps")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">PIS/PASEP</Label>
                  <Input {...register("pisPasep")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Tít. Eleitor</Label>
                  <Input {...register("voterId")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Reservista</Label>
                  <Input {...register("militaryCertificate")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3.5 pt-1">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Contrato</Label>
                  <Controller
                    name="contractType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ContractType.CLT}>CLT</SelectItem>
                          <SelectItem value={ContractType.PJ}>PJ</SelectItem>
                          <SelectItem value={ContractType.INTERN}>Estágio</SelectItem>
                          <SelectItem value={ContractType.TEMPORARY}>Temporário</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Regime</Label>
                  <Controller
                    name="workRegime"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={WorkRegime.PRESENTIAL}>Presencial</SelectItem>
                          <SelectItem value={WorkRegime.HYBRID}>Híbrido</SelectItem>
                          <SelectItem value={WorkRegime.REMOTE}>Remoto</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Salário Base</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Controller
                      name="baseSalary"
                      control={control}
                      render={({ field }) => (
                        <IMaskInput
                          mask="R$ num"
                          blocks={{ num: { mask: Number, thousandsSeparator: '.', padFractionalZeros: true, radix: ',', mapToRadix: ['.'] } }}
                          unmask={true}
                          value={field.value.toString()}
                          onAccept={(_, mask: any) => field.onChange(parseFloat(mask.unmaskedValue) || 0)}
                          className="flex h-9 w-full rounded-lg border border-gray-200 bg-white pl-8 py-1.5 text-xs outline-none focus:border-[#E2661D] focus:ring-1 focus:ring-[#E2661D]/20 transition-all"
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 4. Financeiro */}
      <div className={cn("space-y-4", activeStep !== "financial" && "hidden")}>
           <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5 text-[#E2661D]" />
                Dados Bancários
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
              <div className="grid md:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Banco</Label>
                  <Input {...register("bank")} className="h-9 rounded-lg text-xs border-gray-200" placeholder="Ex: Santander" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Agência</Label>
                  <Input {...register("agency")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Conta</Label>
                  <Input {...register("account")} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Tipo de Conta</Label>
                  <Controller
                    name="accountType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AccountType.CHECKING}>Corrente</SelectItem>
                          <SelectItem value={AccountType.SAVINGS}>Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Chave PIX</Label>
                  <Input {...register("pixKey")} className="h-9 rounded-lg text-xs border-gray-200" placeholder="E-mail, CPF, etc." />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-semibold text-xs text-gray-700">Dep. Imposto Renda</Label>
                  <Input type="number" {...register("irDependents", { valueAsNumber: true })} className="h-9 rounded-lg text-xs border-gray-200" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 5. Estrutura */}
      <div className={cn("space-y-4", activeStep !== "org" && "hidden")}>
          <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-[#E2661D]" />
                Hierarquia e Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
               <div className="grid md:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs text-gray-700">Matrícula</Label>
                    <Input {...register("registration")} className="h-9 rounded-lg text-xs border-gray-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs text-gray-700">Equipe / Time</Label>
                    <Input {...register("team")} className="h-9 rounded-lg text-xs border-gray-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs text-gray-700">Unidade de Negócio</Label>
                    <Input {...register("businessUnit")} className="h-9 rounded-lg text-xs border-gray-200" />
                  </div>
               </div>
               <div className="grid md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs text-gray-700">Filial</Label>
                    <Input {...register("branch")} className="h-9 rounded-lg text-xs border-gray-200" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs text-gray-700">Nível Hierárquico</Label>
                    <Controller
                      name="hierarchicalLevel"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={HierarchicalLevel.AUXILIAR}>Auxiliar</SelectItem>
                            <SelectItem value={HierarchicalLevel.ASSISTENTE}>Assistente</SelectItem>
                            <SelectItem value={HierarchicalLevel.TRAINEE}>Estagiário/Trainee</SelectItem>
                            <SelectItem value={HierarchicalLevel.JUNIOR}>Júnior</SelectItem>
                            <SelectItem value={HierarchicalLevel.MID}>Pleno</SelectItem>
                            <SelectItem value={HierarchicalLevel.SENIOR}>Sênior</SelectItem>
                            <SelectItem value={HierarchicalLevel.LEAD}>Líder</SelectItem>
                            <SelectItem value={HierarchicalLevel.MANAGER}>Gerente</SelectItem>
                            <SelectItem value={HierarchicalLevel.DIRECTOR}>Diretor</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
               </div>
            </CardContent>
          </Card>
      </div>

      {/* 6. Status */}
      <div className={cn("space-y-4", activeStep !== "status" && "hidden")}>
          <Card className="rounded-xl border border-gray-200/80 shadow-2xs bg-white overflow-hidden">
            <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
              <CardTitle className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-[#E2661D]" />
                Situação e Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 space-y-4">
               <div className="grid md:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs text-gray-700">Status Atual</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-9 rounded-lg text-xs border-gray-200"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={EmployeeStatus.ACTIVE}>Ativo</SelectItem>
                            <SelectItem value={EmployeeStatus.AWAY}>Afastado</SelectItem>
                            <SelectItem value={EmployeeStatus.VACATION}>Férias</SelectItem>
                            <SelectItem value={EmployeeStatus.TERMINATED}>Desligado</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold text-xs text-gray-700">Login de Acesso</Label>
                    <Input {...register("login")} className="h-9 rounded-lg text-xs border-gray-200" placeholder="Username do sistema" />
                  </div>
               </div>

               {currentStatus === EmployeeStatus.TERMINATED && (
                 <div className="p-4 bg-red-50/60 rounded-xl border border-red-100 space-y-3 animate-in slide-in-from-top-2">
                   <Label className="font-bold text-xs sm:text-sm text-red-700 flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Dados de Desligamento</Label>
                   <div className="grid md:grid-cols-2 gap-3.5">
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-xs text-gray-700">Data</Label>
                        <Input type="date" {...register("terminationDate")} className="h-9 rounded-lg text-xs border-red-200 bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-semibold text-xs text-gray-700">Motivo</Label>
                        <Input {...register("terminationReason")} className="h-9 rounded-lg text-xs border-red-200 bg-white" placeholder="Ex: Pedido de demissão" />
                      </div>
                   </div>
                 </div>
               )}
            </CardContent>
          </Card>
      </div>

      <StepFooter
        steps={stepDefs}
        activeKey={activeStep}
        onNext={(k) => setActiveStep(k as StepKey)}
        onCancel={onCancel}
        loading={!!loading}
        submitLabel="Salvar Colaborador"
      />
    </form>
  );
}
