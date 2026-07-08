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
      birthDate: initialData?.birthDate ? new Date(initialData.birthDate).toISOString().split('T')[0] : '',
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
      admissionDate: initialData?.admissionDate ? new Date(initialData.admissionDate).toISOString().split('T')[0] : '',
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
      terminationDate: initialData?.terminationDate ? new Date(initialData.terminationDate).toISOString().split('T')[0] : '',
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
    <form onSubmit={handleSubmit(onFormSubmit as any)} className="space-y-8">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      {/* 1. Dados Pessoais */}
      <div className={cn("space-y-6", activeStep !== "personal" && "hidden")}>
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-600" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Informações básicas e civis do colaborador</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2 lg:col-span-2">
                  <Label className="font-bold text-sm">Nome Completo *</Label>
                  <Input {...register("name")} placeholder="Ex: João da Silva" className="h-12 rounded-2xl" />
                  {errors.name && <p className="text-xs font-bold text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Nome Social</Label>
                  <Input {...register("socialName")} placeholder="Opcional" className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">CPF *</Label>
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        mask="000.000.000-00"
                        value={field.value}
                        onAccept={field.onChange}
                        className="w-full flex h-12 rounded-2xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        placeholder="000.000.000-00"
                      />
                    )}
                  />
                  {errors.cpf && <p className="text-xs font-bold text-red-500">{errors.cpf.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">RG</Label>
                  <Input {...register("rg")} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Data de Nascimento</Label>
                  <Input type="date" {...register("birthDate")} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Gênero</Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
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
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Estado Civil</Label>
                  <Controller
                    name="civilStatus"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
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
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Nacionalidade</Label>
                  <Input {...register("nationality")} className="h-12 rounded-2xl" />
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 border-dashed">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isPcd" {...register("isPcd")} className="h-5 w-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500" />
                  <Label htmlFor="isPcd" className="font-bold text-sm cursor-pointer">Colaborador PCD?</Label>
                </div>
                {isPcd && <Input {...register("pcdType")} placeholder="Descreva a deficiência..." className="flex-1 h-11 bg-card rounded-xl" />}
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 2. Contato */}
      <div className={cn("space-y-6", activeStep !== "contact" && "hidden")}>
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-600" />
                Canais de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">E-mail Pessoal</Label>
                  <Input {...register("personalEmail")} placeholder="exemplo@email.com" className="h-12 rounded-2xl" />
                  {errors.personalEmail && <p className="text-xs font-bold text-red-500">{errors.personalEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">E-mail Corporativo</Label>
                  <Input {...register("corporateEmail")} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Celular</Label>
                  <Controller
                    name="mobilePhone"
                    control={control}
                    render={({ field }) => (
                      <IMaskInput
                        mask="(00) 00000-0000"
                        value={field.value}
                        onAccept={field.onChange}
                        className="w-full flex h-12 rounded-2xl border border-input bg-background px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        placeholder="(00) 00000-0000"
                      />
                    )}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-dashed">
                 <Label className="font-bold text-lg mb-4 block flex items-center gap-2"><MapPin className="h-5 w-5 text-indigo-600"/> Endereço Residencial</Label>
                 <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">CEP</Label>
                      <Controller
                        name="address.cep"
                        control={control}
                        render={({ field }) => (
                          <IMaskInput
                            mask="00000-000"
                            value={field.value}
                            onAccept={(val) => { field.onChange(val); handleCepLookup(val); }}
                            className="w-full h-11 rounded-xl border border-input px-3"
                          />
                        )}
                      />
                    </div>
                    <div className="md:col-span-4 space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">Logradouro</Label>
                      <Input {...register("address.street")} className="h-11 rounded-xl" />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">Nº</Label>
                      <Input {...register("address.number")} className="h-11 rounded-xl" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">Bairro</Label>
                      <Input {...register("address.neighborhood")} className="h-11 rounded-xl" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">Cidade</Label>
                      <Input {...register("address.city")} className="h-11 rounded-xl" />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <Label className="font-bold text-xs uppercase text-muted-foreground">UF</Label>
                      <Input {...register("address.state")} maxLength={2} className="h-11 rounded-xl uppercase" />
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 3. Dados Trabalhistas */}
      <div className={cn("space-y-6", activeStep !== "labor" && "hidden")}>
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />
                Vínculo e Cargo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Cargo *</Label>
                  <Input {...register("position")} className="h-12 rounded-2xl" />
                  {errors.position && <p className="text-xs font-bold text-red-500">{errors.position.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Departamento</Label>
                  <Input {...register("department")} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Data de Admissão *</Label>
                  <Input type="date" {...register("admissionDate")} className="h-12 rounded-2xl" />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-6 border-t border-dashed pt-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">CTPS</Label>
                  <Input {...register("ctps")} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">PIS/PASEP</Label>
                  <Input {...register("pisPasep")} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">Tít. Eleitor</Label>
                  <Input {...register("voterId")} className="h-11 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">Reservista</Label>
                  <Input {...register("militaryCertificate")} className="h-11 rounded-xl" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Contrato</Label>
                  <Controller
                    name="contractType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
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
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Regime</Label>
                  <Controller
                    name="workRegime"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={WorkRegime.PRESENTIAL}>Presencial</SelectItem>
                          <SelectItem value={WorkRegime.HYBRID}>Híbrido</SelectItem>
                          <SelectItem value={WorkRegime.REMOTE}>Remoto</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Salário Base</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
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
                          className="flex h-12 w-full rounded-2xl border border-input pl-10 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
      <div className={cn("space-y-6", activeStep !== "financial" && "hidden")}>
           <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Dados Bancários
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Banco</Label>
                  <Input {...register("bank")} className="h-12 rounded-2xl" placeholder="Ex: Santander" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Agência</Label>
                  <Input {...register("agency")} className="h-12 rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Conta</Label>
                  <Input {...register("account")} className="h-12 rounded-2xl" />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Tipo de Conta</Label>
                  <Controller
                    name="accountType"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={AccountType.CHECKING}>Corrente</SelectItem>
                          <SelectItem value={AccountType.SAVINGS}>Poupança</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Chave PIX</Label>
                  <Input {...register("pixKey")} className="h-12 rounded-2xl" placeholder="E-mail, CPF, etc." />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-sm">Dep. Imposto Renda</Label>
                  <Input type="number" {...register("irDependents", { valueAsNumber: true })} className="h-12 rounded-2xl" />
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* 5. Estrutura */}
      <div className={cn("space-y-6", activeStep !== "org" && "hidden")}>
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                Hierarquia e Unidade
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Matrícula</Label>
                    <Input {...register("registration")} className="h-12 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Equipe / Time</Label>
                    <Input {...register("team")} className="h-12 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Unidade de Negócio</Label>
                    <Input {...register("businessUnit")} className="h-12 rounded-2xl" />
                  </div>
               </div>
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Filial</Label>
                    <Input {...register("branch")} className="h-12 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Nível Hierárquico</Label>
                    <Controller
                      name="hierarchicalLevel"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
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
      <div className={cn("space-y-6", activeStep !== "status" && "hidden")}>
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-card/70 backdrop-blur-md">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-xl flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                Situação e Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Status Atual</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="h-12 rounded-2xl"><SelectValue /></SelectTrigger>
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
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Login de Acesso</Label>
                    <Input {...register("login")} className="h-12 rounded-2xl" placeholder="Username do sistema" />
                  </div>
               </div>

               {currentStatus === EmployeeStatus.TERMINATED && (
                 <div className="p-6 bg-red-50/50 rounded-3xl border border-red-100 space-y-4 animate-in slide-in-from-top-2">
                   <Label className="font-bold text-lg text-red-700 flex items-center gap-2"><AlertCircle className="h-5 w-5"/> Dados de Desligamento</Label>
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Data</Label>
                        <Input type="date" {...register("terminationDate")} className="h-12 rounded-2xl border-red-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-sm">Motivo</Label>
                        <Input {...register("terminationReason")} className="h-12 rounded-2xl border-red-200" placeholder="Ex: Pedido de demissão" />
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
