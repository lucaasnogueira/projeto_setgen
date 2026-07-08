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
  { ssr: false, loading: () => <div className="h-72 rounded-2xl bg-muted animate-pulse" /> },
);

const clientSchema = z.object({
  cnpjCpf: z.string().min(11, "Mínimo 11 caracteres").max(18, "Máximo 18 caracteres"),
  companyName: z.string().min(3, "Razão Social deve ter no mínimo 3 caracteres"),
  tradeName: z.string().optional(),
  externalCode: z.string().optional(),
  email: z.string().email("E-mail inválido"),
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
    usersApi.getAll().then(setUsers);
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
      notes: initialData?.notes || "",
      internalNotes: initialData?.internalNotes || "",
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
      alert("Informe um CNPJ válido para consulta");
      return;
    }

    setLookupLoading(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`);

      if (!response.ok) {
        alert("CNPJ não encontrado");
        return;
      }

      const data = await response.json();

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
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      <StepRail steps={stepDefs} activeKey={activeStep} onSelect={(k) => setActiveStep(k as StepKey)} />

      {/* Identificação Principal */}
      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden", activeStep !== "dados" && "hidden")}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-orange-600" />
            Dados Cadastrais
          </CardTitle>
          <CardDescription>Informações legais e comerciais do cliente</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-sm">CPF / CNPJ *</Label>
            <div className="flex gap-3">
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
                      className="w-full flex h-12 rounded-2xl border border-input bg-background px-4 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    />
                  )}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCNPJLookup}
                disabled={lookupLoading || loading}
                className="h-12 px-6 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-2xl flex items-center gap-2 font-bold transition-all active:scale-95"
              >
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {lookupLoading ? "Consultando..." : "Consultar CNPJ"}
              </Button>
            </div>
            {errors.cnpjCpf && <p className="text-xs font-bold text-red-500 mt-1">{errors.cnpjCpf.message}</p>}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Razão Social *</Label>
              <Input
                placeholder="Razão Social completa"
                className="h-12 rounded-2xl focus:ring-orange-500/20 focus:border-orange-500"
                {...register("companyName")}
              />
              {errors.companyName && <p className="text-xs font-bold text-red-500">{errors.companyName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Nome Fantasia</Label>
              <Input
                placeholder="Nome comercial"
                className="h-12 rounded-2xl focus:ring-orange-500/20 focus:border-orange-500"
                {...register("tradeName")}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Código Externo</Label>
              <Input
                placeholder="ID de integração"
                className="h-12 rounded-2xl focus:ring-orange-500/20 focus:border-orange-500"
                {...register("externalCode")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border p-4">
            <div>
              <Label className="font-bold text-sm">Status do Cliente</Label>
              <p className="text-xs text-muted-foreground">Ativo, inativo ou inadimplente</p>
            </div>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-48 h-11 rounded-xl">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ClientStatus.ACTIVE}>Ativo</SelectItem>
                    <SelectItem value={ClientStatus.INACTIVE}>Inativo</SelectItem>
                    <SelectItem value={ClientStatus.DEFAULTER}>Inadimplente</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <div className={cn("grid md:grid-cols-1 lg:grid-cols-3 gap-6", activeStep !== "contato" && "hidden")}>
        {/* Contato */}
        <Card className="lg:col-span-1 border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-orange-600" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="font-bold text-sm">E-mail Comercial *</Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-orange-600 transition-colors" />
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  className="h-11 pl-10 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="text-xs font-bold text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Telefone Principal *</Label>
              <div className="relative group">
                <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-orange-600 transition-colors" />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <IMaskInput
                      mask="(00) 00000-0000"
                      placeholder="(00) 00000-0000"
                      value={field.value}
                      onAccept={field.onChange}
                      className="w-full flex h-11 rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                    />
                  )}
                />
              </div>
              {errors.phone && <p className="text-xs font-bold text-red-500">{errors.phone.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Endereço + Cobrança */}
        <Card className="lg:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-orange-600" />
              Endereço e Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="address">
              <TabsList>
                <TabsTrigger value="address">Endereço do Cliente</TabsTrigger>
                <TabsTrigger value="billing">Dados de Cobrança</TabsTrigger>
              </TabsList>

              <TabsContent value="address" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1 space-y-2">
                    <Label className="font-bold text-sm">CEP *</Label>
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
                          className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                        />
                      )}
                    />
                    {errors.address?.cep && <p className="text-xs font-bold text-red-500">{errors.address.cep.message}</p>}
                  </div>
                  <div className="md:col-span-3 space-y-2">
                    <Label className="font-bold text-sm">Logradouro / Rua *</Label>
                    <Input
                      placeholder="Rua, Avenida..."
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                      {...register("address.street")}
                    />
                    {errors.address?.street && <p className="text-xs font-bold text-red-500">{errors.address.street.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-2">
                    <Label className="font-bold text-sm">Número *</Label>
                    <Input
                      placeholder="Ex: 123 ou S/N"
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                      {...register("address.number")}
                    />
                    {errors.address?.number && <p className="text-xs font-bold text-red-500">{errors.address.number.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Bairro *</Label>
                    <Input
                      placeholder="Nome do Bairro"
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                      {...register("address.neighborhood")}
                    />
                    {errors.address?.neighborhood && <p className="text-xs font-bold text-red-500">{errors.address.neighborhood.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Complemento</Label>
                    <Input
                      placeholder="Ex: Sala 2 / Bloco A"
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                      {...register("address.complement")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 space-y-2">
                    <Label className="font-bold text-sm">Cidade *</Label>
                    <Input
                      placeholder="Cidade"
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                      {...register("address.city")}
                    />
                    {errors.address?.city && <p className="text-xs font-bold text-red-500">{errors.address.city.message}</p>}
                  </div>
                  <div className="md:col-span-1 space-y-2">
                    <Label className="font-bold text-sm">UF *</Label>
                    <Input
                      placeholder="UF"
                      maxLength={2}
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500 uppercase"
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

              <TabsContent value="billing" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Contribuinte do ICMS</Label>
                    <Controller
                      name="icmsTaxpayerType"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="h-11 rounded-xl">
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={IcmsTaxpayerType.CONTRIBUINTE}>Contribuinte de ICMS</SelectItem>
                            <SelectItem value={IcmsTaxpayerType.ISENTO}>Isento</SelectItem>
                            <SelectItem value={IcmsTaxpayerType.NAO_CONTRIBUINTE}>Não Contribuinte</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">E-mail de Cobrança</Label>
                    <Input
                      type="email"
                      placeholder="financeiro@empresa.com"
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                      {...register("billingEmail")}
                    />
                    {errors.billingEmail && <p className="text-xs font-bold text-red-500">{errors.billingEmail.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Inscrição Estadual</Label>
                    <Input
                      placeholder="Adicione"
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                      {...register("stateRegistration")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-sm">Inscrição Municipal</Label>
                    <Input
                      placeholder="Adicione"
                      className="h-11 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
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
      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden", activeStep !== "detalhes" && "hidden")}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5 text-orange-600" />
            Detalhes do Cliente
          </CardTitle>
          <CardDescription>Responsáveis, agrupamento e contatos adicionais</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="font-bold text-sm">Responsável no Local (falar com)</Label>
            <div className="relative group">
              <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground group-focus-within:text-orange-600 transition-colors" />
              <Input
                placeholder="Nome do contato in loco"
                className="h-11 pl-10 rounded-xl focus:ring-orange-500/20 focus:border-orange-500"
                {...register("onSiteContact")}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Colaborador Responsável</Label>
              <Controller
                name="responsibleUserId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhum</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Equipe Responsável</Label>
              <Controller
                name="responsibleTeamId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhuma</SelectItem>
                      {teams.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Grupo de Clientes</Label>
              <Controller
                name="groupId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhum</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-sm">Segmento</Label>
              <Controller
                name="segmentId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value || NONE}>
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Selecione um segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Nenhum</SelectItem>
                      {segments.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-sm">Telefone Corporativo</Label>
              {corporatePhones.map((phone, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={phone}
                    onChange={(e) => updateListItem(corporatePhones, setCorporatePhones, i, e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="h-11 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl shrink-0"
                    onClick={() => setCorporatePhones(corporatePhones.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => setCorporatePhones([...corporatePhones, ""])}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-sm">E-mail Corporativo</Label>
              {corporateEmails.map((email, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => updateListItem(corporateEmails, setCorporateEmails, i, e.target.value)}
                    placeholder="contato@empresa.com"
                    className="h-11 rounded-xl"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl shrink-0"
                    onClick={() => setCorporateEmails(corporateEmails.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={() => setCorporateEmails([...corporateEmails, ""])}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações e Anotações */}
      <Card className={cn("border-none shadow-xl rounded-3xl overflow-hidden", activeStep !== "observacoes" && "hidden")}>
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="flex items-center gap-2 text-xl">
            <StickyNote className="h-5 w-5 text-orange-600" />
            Observações e Anotações
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="font-bold text-sm">Observação</Label>
            <textarea
              placeholder="Visível para a equipe"
              rows={4}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
              {...register("notes")}
            />
          </div>
          <div className="space-y-2">
            <Label className="font-bold text-sm flex items-center gap-1">
              Observação Interna
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </Label>
            <textarea
              placeholder="Não visível ao cliente"
              rows={4}
              className="w-full rounded-2xl border border-input bg-background px-4 py-3 text-sm shadow-sm transition-all focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none"
              {...register("internalNotes")}
            />
          </div>
        </CardContent>
      </Card>

      <StepFooter
        steps={stepDefs}
        activeKey={activeStep}
        onNext={(k) => setActiveStep(k as StepKey)}
        onCancel={onCancel}
        loading={loading}
        submitLabel={submitLabel}
      />
    </form>
  );
}
