"use client"

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IMaskInput } from "react-imask";
import {
  Search, FileText, Phone, Mail, MapPin, X, Loader2, Info,
  UserRound, Users, StickyNote, Plus,
} from "lucide-react";
import { fetchCep } from "@/lib/api/cep";
import { geocodeAddress } from "@/lib/api/geocode";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/lib/api/users";
import { teamsApi } from "@/lib/api/teams";
import { clientTaxonomiesApi } from "@/lib/api/client-taxonomies";
import { Client, ClientStatus, ClientTaxonomyKind, IcmsTaxpayerType, Team, ClientTaxonomy } from "@/types";
import { cn } from "@/lib/utils";
import { StepRail, StepFooter, type WizardStep } from "@/components/ui/step-wizard";

const ClientLocationMap = dynamic(
  () => import("./ClientLocationMap").then((m) => m.ClientLocationMap),
  { ssr: false, loading: () => <div className="h-72 rounded-xl bg-muted animate-pulse" /> },
);

const clientSchema = z.object({
  cnpjCpf: z.string().min(11, "Mínimo 11 caracteres").max(18, "Máximo 18 caracteres"),
  companyName: z.string().min(3, "Razão Social deve ter no mínimo 3 caracteres"),
  tradeName: z.string().optional(),
  externalCode: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  phone: z.string().min(10, "Telefone inválido"),
  status: z.nativeEnum(ClientStatus).optional(),
  onSiteContact: z.string().optional(),
  responsibleUserId: z.string().optional(),
  responsibleTeamId: z.string().optional(),
  groupId: z.string().optional(),
  segmentId: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  icmsTaxpayerType: z.nativeEnum(IcmsTaxpayerType).optional(),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  billingEmail: z.string().email("E-mail de cobrança inválido").optional().or(z.literal("")),
  address: z.object({
    cep: z.string().min(8, "CEP inválido"),
    street: z.string().min(3, "Rua obrigatória"),
    number: z.string().min(1, "Nº obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(2, "Bairro obrigatório"),
    city: z.string().min(2, "Cidade obrigatória"),
    state: z.string().length(2, "UF deve ter 2 caracteres"),
  }),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const NONE = "__none__";

interface ClientFormProps {
  initialData?: Partial<Client> | any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}

export function ClientForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  submitLabel
}: ClientFormProps) {
  const [lookupLoading, setLookupLoading] = useState(false);
  const [corporatePhones, setCorporatePhones] = useState<string[]>(initialData?.corporatePhones ?? []);
  const [corporateEmails, setCorporateEmails] = useState<string[]>(initialData?.corporateEmails ?? []);
  const [latitude, setLatitude] = useState<number | undefined>(initialData?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initialData?.longitude);
  const manualLocationRef = useRef(false);

  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<ClientTaxonomy[]>([]);
  const [segments, setSegments] = useState<ClientTaxonomy[]>([]);

  useEffect(() => {
    usersApi.getSelectable().then(setUsers).catch(() => setUsers([]));
    teamsApi.getAll(true).then(setTeams).catch(() => setTeams([]));
    clientTaxonomiesApi.getAll(ClientTaxonomyKind.GROUP, true).then(setGroups).catch(() => setGroups([]));
    clientTaxonomiesApi.getAll(ClientTaxonomyKind.SEGMENT, true).then(setSegments).catch(() => setSegments([]));
  }, []);

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      cnpjCpf: initialData?.cnpjCpf || "",
      companyName: initialData?.companyName || initialData?.name || "",
      tradeName: initialData?.tradeName || "",
      externalCode: initialData?.externalCode || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      status: initialData?.status || ClientStatus.ACTIVE,
      onSiteContact: initialData?.onSiteContact || "",
      responsibleUserId: initialData?.responsibleUserId || "",
      responsibleTeamId: initialData?.responsibleTeamId || "",
      groupId: initialData?.groupId || "",
      segmentId: initialData?.segmentId || "",
      notes: initialData?.notes || (initialData as any)?.nãotes || "",
      internalNotes: initialData?.internalNotes || (initialData as any)?.internalNãotes || "",
      icmsTaxpayerType: initialData?.icmsTaxpayerType || undefined,
      stateRegistration: initialData?.stateRegistration || "",
      municipalRegistration: initialData?.municipalRegistration || "",
      billingEmail: initialData?.billingEmail || "",
      address: {
        cep: initialData?.address?.cep || initialData?.zipCode || "",
        street: initialData?.address?.street || "",
        number: initialData?.address?.number || "",
        complement: initialData?.address?.complement || "",
        neighborhood: initialData?.address?.neighborhood || "",
        city: initialData?.address?.city || "",
        state: initialData?.address?.state || "",
      }
    }
  });

  const { register, handleSubmit, setValue, control, formState: { errors } } = form;

  type StepKey = "dados" | "contato" | "detalhes" | "observacoes";
  const [activeStep, setActiveStep] = useState<StepKey>("dados");
  const stepDefs: WizardStep[] = [
    { key: "dados", label: "Dados" },
    { key: "contato", label: "Contato e Endereço" },
    { key: "detalhes", label: "Detalhes" },
    { key: "observacoes", label: "Observações" },
  ];

  useEffect(() => {
    // Campos com validação vivem em "dados" (cnpjCpf/companyName) e "contato" (email/phone/address) —
    // sem isso o usuário fica preso numa etapa sem ver por que o submit falhou.
    if (errors.cnpjCpf || errors.companyName) { setActiveStep("dados"); return; }
    if (errors.email || errors.phone || errors.address) { setActiveStep("contato"); return; }
  }, [errors]);

  const handleCNPJLookup = async () => {
    const cnpjClean = form.getValues("cnpjCpf").replace(/\D/g, "");
    if (cnpjClean.length !== 14) {
      alert("Informe um CNPJ válido com 14 dígitos para consulta");
      return;
    }

    setLookupLoading(true);
    try {
      let data: any = null;

      // 1ª Tentativa: BrasilAPI
      try {
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);
        if (response.ok) {
          data = await response.json();
        }
      } catch (e) {
        console.warn("BrasilAPI falhou, tentando fallback...", e);
      }

      // 2ª Tentativa: CNPJ.ws
      if (!data) {
        try {
          const resWs = await fetch(`https://publica.cnpj.ws/cnpj/${cnpjClean}`);
          if (resWs.ok) {
            const wsData = await resWs.json();
            const est = wsData.estabelecimento;
            data = {
              razao_social: wsData.razao_social,
              nome_fantasia: est?.nome_fantasia || wsData.razao_social,
              logradouro: est?.tipo_logradouro ? `${est.tipo_logradouro} ${est.logradouro}` : est?.logradouro,
              numero: est?.numero,
              complemento: est?.complemento,
              bairro: est?.bairro,
              municipio: est?.cidade?.nome,
              uf: est?.estado?.sigla,
              cep: est?.cep,
              ddd_telefone_1: est?.ddd1 && est?.telefone1 ? `${est.ddd1}${est.telefone1}` : "",
              email: est?.email,
            };
          }
        } catch (e) {
          console.warn("CNPJ.ws falhou...", e);
        }
      }

      if (data) {
        setValue("companyName", data.razao_social || "");
        setValue("tradeName", data.nome_fantasia || "");
        setValue("address.street", data.logradouro || "");
        setValue("address.number", data.numero || "");
        setValue("address.complement", data.complemento || "");
        setValue("address.neighborhood", data.bairro || "");
        setValue("address.city", data.municipio || "");
        setValue("address.state", data.uf || "");
        setValue("address.cep", data.cep || "");
        setValue("phone", data.ddd_telefone_1 || "");
        setValue("email", data.email || "");
      } else {
        alert("CNPJ não localizado na base pública da Receita Federal. Você pode preencher os campos manualmente.");
      }
    } catch {
      alert("Erro ao consultar CNPJ. Preencha manualmente.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      const addressData = await fetchCep(cleanCep);
      if (addressData) {
        setValue("address.street", addressData.logradouro);
        setValue("address.city", addressData.localidade);
        setValue("address.state", addressData.uf);
        setValue("address.neighborhood", addressData.bairro);
      }
    }
  };

  const addrStreet = form.watch("address.street");
  const addrNumber = form.watch("address.number");
  const addrNeighborhood = form.watch("address.neighborhood");
  const addrCity = form.watch("address.city");
  const addrState = form.watch("address.state");

  useEffect(() => {
    if (manualLocationRef.current) return;
    if (!addrStreet || !addrNumber || !addrCity || !addrState) return;

    const timer = setTimeout(async () => {
      const query = `${addrStreet}, ${addrNumber} - ${addrNeighborhood || ""}, ${addrCity} - ${addrState}, Brasil`;
      const result = await geocodeAddress(query);
      if (result) {
        setLatitude(result.lat);
        setLongitude(result.lon);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [addrStreet, addrNumber, addrNeighborhood, addrCity, addrState]);

  const updateListItem = (
    list: string[],
    setList: (v: string[]) => void,
    index: number,
    value: string,
  ) => {
    const next = [...list];
    next[index] = value;
    setList(next);
  };

  const onFormSubmit = (data: ClientFormValues) => {
    const cleanId = (v?: string) => (v && v !== NONE ? v : undefined);

    const payload = {
      ...data,
      cnpjCpf: data.cnpjCpf.replace(/\D/g, ""),
      tradeName: (data.tradeName && data.tradeName.trim()) ? data.tradeName.trim() : undefined,
      externalCode: (data.externalCode && data.externalCode.trim()) ? data.externalCode.trim() : undefined,
      onSiteContact: (data.onSiteContact && data.onSiteContact.trim()) ? data.onSiteContact.trim() : undefined,
      notes: (data.notes && data.notes.trim()) ? data.notes.trim() : undefined,
      internalNotes: (data.internalNotes && data.internalNotes.trim()) ? data.internalNotes.trim() : undefined,
      stateRegistration: (data.stateRegistration && data.stateRegistration.trim()) ? data.stateRegistration.trim() : undefined,
      municipalRegistration: (data.municipalRegistration && data.municipalRegistration.trim()) ? data.municipalRegistration.trim() : undefined,
      email: (data.email && data.email.trim()) ? data.email.trim() : undefined,
      billingEmail: data.billingEmail || undefined,
      responsibleUserId: cleanId(data.responsibleUserId),
      responsibleTeamId: cleanId(data.responsibleTeamId),
      groupId: cleanId(data.groupId),
      segmentId: cleanId(data.segmentId),
      corporatePhones: corporatePhones.filter((v) => v.trim().length > 0),
      corporateEmails: corporateEmails.filter((v) => v.trim().length > 0),
      latitude,
      longitude,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-5">
      {/* Topo do Formulário com Protocolo e Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {initialData?.externalCode || initialData?.id ? `CLI-${initialData.id.slice(0, 6).toUpperCase()}` : 'CLI-NOVO'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              {initialData ? (initialData.status === ClientStatus.ACTIVE ? 'Ativo' : 'Cadastro Existente') : 'Novo Cadastro'}
            </span>
          </div>
          <h3 className="text-base font-bold text-gray-900">
            {initialData ? `Edição: ${initialData.companyName}` : 'Cadastro de Cliente & Usina Industrial'}
          </h3>
          <p className="text-xs text-gray-400">
            Cadastre a empresa tomadora e os parâmetros técnicos da planta onde os geradores operarão
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="h-8 px-3 text-xs rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="h-8 px-4 text-xs rounded-lg bg-gray-900 hover:bg-black text-white font-medium shadow-2xs"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            {submitLabel}
          </Button>
        </div>
      </div>

      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      {/* Identificação Principal */}
      {/* Dados Principais */}
      <Card className={cn("border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white", activeStep !== "dados" && "hidden")}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <FileText className="h-3.5 w-3.5 text-[#E2661D]" />
            1. Dados Cadastrais & Jurídicos
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">Informações legais e comerciais do cliente</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <Label className="font-semibold text-xs text-gray-700">CPF / CNPJ *</Label>
            <div className="flex gap-2.5">
              <div className="relative flex-1">
                <Controller
                  name="cnpjCpf"
                  control={control}
                  render={({ field }) => (
                    <IMaskInput
                      mask={[
                        { mask: "000.000.000-00", maxLength: 11 },
                        { mask: "00.000.000/0000-00" },
                      ]}
                      dispatch={(appended, dynamicMasked) => {
                        const value = (dynamicMasked.value + appended).replace(/\D/g, "");
                        return dynamicMasked.compiledMasks.find((m) =>
                          value.length > 11 ? m.mask === "00.000.000/0000-00" : m.mask === "000.000.000-00",
                        );
                      }}
                      placeholder="00.000.000/0000-00"
                      value={field.value}
                      onAccept={field.onChange}
                      className="w-full flex h-9 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-2xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
                    />
                  )}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCNPJLookup}
                disabled={lookupLoading || loading}
                className="h-9 px-4 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-2xs"
              >
                {lookupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                {lookupLoading ? "Consultando..." : "Consultar CNPJ"}
              </Button>
            </div>
            {errors.cnpjCpf && <p className="text-xs font-bold text-red-500 mt-1">{errors.cnpjCpf.message}</p>}
          </div>

          <div className="grid md:grid-cols-3 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Razão Social *</Label>
              <Input
                placeholder="Razão Social completa"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                {...register("companyName")}
              />
              {errors.companyName && <p className="text-xs font-bold text-red-500">{errors.companyName.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Nome Fantasia</Label>
              <Input
                placeholder="Nome comercial"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                {...register("tradeName")}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Código Externo</Label>
              <Input
                placeholder="ID de integração"
                className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                {...register("externalCode")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-3 bg-gray-50/40">
            <div>
              <Label className="font-semibold text-xs text-gray-700">Status do Cliente</Label>
              <p className="text-[11px] text-gray-400">Ativo, inativo ou inadimplente</p>
            </div>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-40 h-9 rounded-lg text-xs bg-white border-gray-200">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClientStatus.ACTIVE} className="text-xs">Ativo</SelectItem>
                    <SelectItem value={ClientStatus.INACTIVE} className="text-xs">Inativo</SelectItem>
                    <SelectItem value={ClientStatus.DEFAULTER} className="text-xs">Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <div className={cn("grid md:grid-cols-1 lg:grid-cols-3 gap-3.5", activeStep !== "contato" && "hidden")}>
        {/* Contato */}
        <Card className="lg:col-span-1 border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
              <Phone className="h-3.5 w-3.5 text-[#E2661D]" />
              2. Contato Comercial
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">E-mail Comercial <span className="text-gray-400 font-normal text-[11px]">(Opcional)</span></Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#E2661D] transition-colors" />
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  className="h-9 pl-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs font-bold text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Telefone Principal *</Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#E2661D] transition-colors" />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <IMaskInput
                      mask="(00) 00000-0000"
                      placeholder="(00) 00000-0000"
                      value={field.value}
                      onAccept={field.onChange}
                      className="w-full flex h-9 rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-1.5 text-xs shadow-2xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
                    />
                  )}
                />
              </div>
              {errors.phone && <p className="text-xs font-bold text-red-500">{errors.phone.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Endereço + Cobrança */}
        <Card className="lg:col-span-2 border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white">
          <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
            <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
              <MapPin className="h-3.5 w-3.5 text-[#E2661D]" />
              Endereço e Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5">
            <Tabs defaultValue="address">
              <TabsList className="h-8">
                <TabsTrigger value="address" className="text-xs h-7 px-3">Endereço do Cliente</TabsTrigger>
                <TabsTrigger value="billing" className="text-xs h-7 px-3">Dados de Cobrança</TabsTrigger>
              </TabsList>

              <TabsContent value="address" className="space-y-3.5 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div className="md:col-span-1 space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">CEP *</Label>
                    <Controller
                      name="address.cep"
                      control={control}
                      render={({ field }) => (
                        <IMaskInput
                          mask="00000-000"
                          placeholder="00000-000"
                          value={field.value}
                          onAccept={(value: string) => {
                            field.onChange(value);
                            handleCepLookup(value);
                          }}
                          className="w-full flex h-9 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs shadow-2xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none"
                        />
                      )}
                    />
                    {errors.address?.cep && <p className="text-xs font-bold text-red-500">{errors.address.cep.message}</p>}
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Logradouro / Rua *</Label>
                    <Input
                      placeholder="Rua, Avenida..."
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("address.street")}
                    />
                    {errors.address?.street && <p className="text-xs font-bold text-red-500">{errors.address.street.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                   <div className="space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Número *</Label>
                    <Input
                      placeholder="Ex: 123 ou S/N"
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("address.number")}
                    />
                    {errors.address?.number && <p className="text-xs font-bold text-red-500">{errors.address.number.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Bairro *</Label>
                    <Input
                      placeholder="Nome do Bairro"
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("address.neighborhood")}
                    />
                    {errors.address?.neighborhood && <p className="text-xs font-bold text-red-500">{errors.address.neighborhood.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Complemento</Label>
                    <Input
                      placeholder="Ex: Sala 2 / Bloco A"
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("address.complement")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                  <div className="md:col-span-3 space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Cidade *</Label>
                    <Input
                      placeholder="Cidade"
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("address.city")}
                    />
                    {errors.address?.city && <p className="text-xs font-bold text-red-500">{errors.address.city.message}</p>}
                  </div>
                  <div className="md:col-span-1 space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">UF *</Label>
                    <Input
                      placeholder="UF"
                      maxLength={2}
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D] uppercase"
                      {...register("address.state")}
                    />
                    {errors.address?.state && <p className="text-xs font-bold text-red-500">{errors.address.state.message}</p>}
                  </div>
                </div>

                <ClientLocationMap
                  latitude={latitude}
                  longitude={longitude}
                  onChange={(lat, lng) => {
                    manualLocationRef.current = true;
                    setLatitude(lat);
                    setLongitude(lng);
                  }}
                />
              </TabsContent>

              <TabsContent value="billing" className="space-y-3.5 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Contribuinte do ICMS</Label>
                    <Controller
                      name="icmsTaxpayerType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={IcmsTaxpayerType.CONTRIBUINTE} className="text-xs">Contribuinte de ICMS</SelectItem>
                            <SelectItem value={IcmsTaxpayerType.ISENTO} className="text-xs">Isento</SelectItem>
                            <SelectItem value={IcmsTaxpayerType.NAO_CONTRIBUINTE} className="text-xs">Não Contribuinte</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">E-mail de Cobrança</Label>
                    <Input
                      type="email"
                      placeholder="financeiro@empresa.com"
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("billingEmail")}
                    />
                    {errors.billingEmail && <p className="text-xs font-bold text-red-500">{errors.billingEmail.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Inscrição Estadual</Label>
                    <Input
                      placeholder="Adicione"
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("stateRegistration")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-semibold text-xs text-gray-700">Inscrição Municipal</Label>
                    <Input
                      placeholder="Adicione"
                      className="h-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                      {...register("municipalRegistration")}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Detalhes do Cliente */}
      <Card className={cn("border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white", activeStep !== "detalhes" && "hidden")}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <Users className="h-3.5 w-3.5 text-[#E2661D]" />
            3. Equipe Responsável & Parâmetros da Planta
          </CardTitle>
          <CardDescription className="text-xs text-gray-400">Responsáveis, agrupamento e contatos de emergência / usina</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="font-semibold text-xs text-gray-700">Contato no Local do Cliente (Falar com)</Label>
              <span className="text-[10.5px] text-gray-400">Pessoa que atende a equipe técnica na usina/gerador</span>
            </div>
            <div className="relative group">
              <UserRound className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 group-focus-within:text-[#E2661D] transition-colors" />
              <Input
                placeholder="Nome do contato in loco"
                className="h-9 pl-9 rounded-lg text-xs border-gray-200 focus:ring-[#E2661D]/20 focus:border-[#E2661D]"
                {...register("onSiteContact")}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Colaborador Responsável (Setgen)</Label>
              <Controller
                name="responsibleUserId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">Nenhum</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id} className="text-xs">{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Equipe Responsável (Setgen)</Label>
              <Controller
                name="responsibleTeamId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">Nenhuma</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Grupo de Clientes</Label>
              <Controller
                name="groupId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">Nenhum</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id} className="text-xs">{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Segmento</Label>
              <Controller
                name="segmentId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-9 rounded-lg text-xs bg-white border-gray-200">
                      <SelectValue placeholder="Selecione um segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">Nenhum</SelectItem>
                      {segments.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">Telefone Corporativo</Label>
              {corporatePhones.map((phone, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => updateListItem(corporatePhones, setCorporatePhones, i, e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="h-9 rounded-lg text-xs border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg shrink-0 border-gray-200 text-gray-500 hover:text-red-600"
                    onClick={() => setCorporatePhones(corporatePhones.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-lg text-xs font-semibold text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => setCorporatePhones([...corporatePhones, ""])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>

            <div className="space-y-1">
              <Label className="font-semibold text-xs text-gray-700">E-mail Corporativo</Label>
              {corporateEmails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateListItem(corporateEmails, setCorporateEmails, i, e.target.value)}
                    placeholder="contato@empresa.com"
                    className="h-9 rounded-lg text-xs border-gray-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg shrink-0 border-gray-200 text-gray-500 hover:text-red-600"
                    onClick={() => setCorporateEmails(corporateEmails.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-lg text-xs font-semibold text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => setCorporateEmails([...corporateEmails, ""])}
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações e Anotações */}
      <Card className={cn("border border-gray-200/80 shadow-2xs rounded-xl overflow-hidden bg-white", activeStep !== "observacoes" && "hidden")}>
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900">
            <StickyNote className="h-3.5 w-3.5 text-[#E2661D]" />
            4. Observações & Especificações Técnicas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-5 grid md:grid-cols-2 gap-3.5">
          <div className="space-y-1">
            <Label className="font-semibold text-xs text-gray-700">Observação</Label>
            <textarea
              placeholder="Visível para a equipe"
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs shadow-2xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none resize-none"
              {...register("notes")}
            />
          </div>
          <div className="space-y-1">
            <Label className="font-semibold text-xs text-gray-700 flex items-center gap-1">
              Observação Interna
              <Info className="h-3 w-3 text-gray-400" />
            </Label>
            <textarea
              placeholder="Não visível ao cliente"
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs shadow-2xs transition-all focus:ring-2 focus:ring-[#E2661D]/20 focus:border-[#E2661D] outline-none resize-none"
              {...register("internalNotes")}
            />
          </div>
        </CardContent>
      </Card>

      <StepFooter
        steps={stepDefs}
        activeKey={activeStep}
        onNext={async (nextKey) => {
          let isValid = false;
          if (activeStep === "dados") {
            const emailVal = form.getValues("email");
            isValid = emailVal && emailVal.trim().length > 0
              ? await form.trigger(["cnpjCpf", "companyName", "email", "phone"])
              : await form.trigger(["cnpjCpf", "companyName", "phone"]);
          } else if (activeStep === "contato") {
            isValid = await form.trigger(["address.cep", "address.street", "address.neighborhood", "address.city", "address.state", "address.number"]);
          } else {
            isValid = true;
          }
          if (isValid) {
            setActiveStep(nextKey as StepKey);
          }
        }}
        onCancel={onCancel}
        loading={loading}
        submitLabel={submitLabel}
      />
    </form>
  );
}
