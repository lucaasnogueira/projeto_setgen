"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usersApi } from "@/lib/api/users";
import {
  User,
  X,
  Upload,
  MapPin,
  Shield,
  Bell,
  Monitor,
  Paperclip,
  CheckCircle,
  FileText,
  Trash2,
} from "lucide-react";
import { formatDateBR } from "@/lib/date";

interface CollaboratorFormModalProps {
  collaboratorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const DEFAULT_PERMISSIONS = {
  // Tarefas
  tasksCreate: true,
  tasksAllTypes: true,
  tasksExecute: true,
  tasksEdit: true,
  tasksDelete: false,
  tasksRemoveSignature: false,
  tasksPause: true,
  tasksReschedule: true,
  tasksUseGalleryPhotos: true,
  tasksEditAfterCheckout: false,
  tasksManualCheckoutPending: false,
  tasksManualCheckinPendingOther: false,
  tasksReportWithoutCheckin: false,
  tasksManualCheckinOutsideSchedule: false,
  tasksAddQuestionnaire: true,
  tasksRemoveQuestionnaire: false,
  tasksRemoveEquipmentQuestionnaire: false,
  // Colaboradores
  collabChangeBasePoint: false,
  collabManageClients: true,
  collabAccessProductsQuotes: true,
  collabEditClientAddress: true,
  collabChangeQuoteStatus: false,
  collabViewClientContact: true,
  collabViewSendDigitalOSReport: true,
  collabManageFinancialCategories: false,
  collabEnableDisplacementOption: true,
  collabViewValuesProductsServicesCosts: true,
  collabMoveCompanyStock: false,
  collabManageKeywords: false,
  // Projetos
  projectsCreate: false,
  projectsEdit: false,
  projectsView: true,
  projectsDelete: false,
  // Equipamentos
  equipmentsView: true,
  equipmentsCreate: false,
  equipmentsEdit: false,
  equipmentsDelete: false,
  // Auvo Desk
  deskDeleteTicketNotes: false,
};

export function CollaboratorFormModal({
  collaboratorId,
  open,
  onOpenChange,
  onSaved,
}: CollaboratorFormModalProps) {
  const [activeTab, setActiveTab] = useState("detalhes");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Painel Lateral
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [auvochatActive, setAuvochatActive] = useState(false);
  const [monitoringInterval, setMonitoringInterval] = useState([3]);
  const [basePointAddress, setBasePointAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Aba Detalhes
  const [userRole, setUserRole] = useState("TECHNICIAN");
  const [checkinType, setCheckinType] = useState("MANUAL");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hourlyRate, setHourlyRate] = useState<number | string>("");
  const [kmRate, setKmRate] = useState<number | string>("");
  const [language, setLanguage] = useState("pt-BR");
  const [workShift, setWorkShift] = useState("ALWAYS_ACTIVE");

  // Aba Configurações RBAC
  const [permissions, setPermissions] = useState<Record<string, boolean>>(DEFAULT_PERMISSIONS);

  // Aba Notificações
  const [notifyWeb, setNotifyWeb] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);

  // Aba Interface
  const [defaultScreen, setDefaultScreen] = useState("CALENDAR");

  // Aba Anexos
  const [attachments, setAttachments] = useState<any[]>([]);
  const [newAttachmentName, setNewAttachmentName] = useState("");

  useEffect(() => {
    if (open) {
      if (collaboratorId) {
        loadCollaborator(collaboratorId);
      } else {
        resetForm();
      }
    }
  }, [open, collaboratorId]);

  const resetForm = () => {
    setName("");
    setLogin("");
    setRoleTitle("");
    setPhone("");
    setEmail("");
    setAuvochatActive(false);
    setMonitoringInterval([3]);
    setBasePointAddress("");
    setAvatarUrl("");
    setUserRole("TECHNICIAN");
    setCheckinType("MANUAL");
    setPassword("");
    setConfirmPassword("");
    setHourlyRate("");
    setKmRate("");
    setLanguage("pt-BR");
    setWorkShift("ALWAYS_ACTIVE");
    setPermissions(DEFAULT_PERMISSIONS);
    setNotifyWeb(true);
    setNotifyEmail(true);
    setDefaultScreen("CALENDAR");
    setAttachments([]);
  };

  const loadCollaborator = async (id: string) => {
    setLoading(true);
    try {
      const user = await usersApi.getById(id);
      setName(user.name || "");
      setEmail(user.email || "");
      setUserRole(user.role || "TECHNICIAN");
      setLogin((user as any).login || user.email?.split("@")[0] || "");
      setRoleTitle((user as any).roleTitle || "");
      setPhone((user as any).phone || "");
      setAvatarUrl((user as any).avatarUrl || "");
      setAuvochatActive(!!(user as any).auvochatActive);
      setMonitoringInterval([(user as any).monitoringIntervalMinutes || 3]);
      setBasePointAddress((user as any).basePointAddress || "");
      setHourlyRate((user as any).hourlyRate || "");
      setKmRate((user as any).kmRate || "");
      setCheckinType((user as any).checkinType || "MANUAL");
      setLanguage((user as any).language || "pt-BR");
      setWorkShift((user as any).workShift || "ALWAYS_ACTIVE");
      setDefaultScreen((user as any).defaultScreen || "CALENDAR");

      // Permissoes
      const permData = await usersApi.getPermissions(id).catch(() => null);
      if (permData) {
        setPermissions((prev) => ({ ...prev, ...permData }));
      }

      // Anexos
      const attData = await usersApi.getAttachments(id).catch(() => []);
      setAttachments(attData || []);
    } catch (e) {
      console.error("Erro ao carregar colaborador:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("O nome é obrigatório.");
      return;
    }
    if (!collaboratorId && !password) {
      alert("A senha é obrigatória para novo colaborador.");
      return;
    }
    if (password && password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      let savedUser: any;
      if (collaboratorId) {
        savedUser = await usersApi.update(collaboratorId, {
          name,
          email: email || `${login.toLowerCase()}@empresa.com`,
          role: userRole as any,
        });
      } else {
        savedUser = await usersApi.create({
          name,
          email: email || `${login.toLowerCase()}@empresa.com`,
          role: userRole as any,
          password,
        });
      }

      const uid = savedUser.id;

      // Atualizar perfil operacional
      await usersApi.updateOperational(uid, {
        login: login || name.toLowerCase().replace(/\s+/g, "."),
        roleTitle,
        phone,
        auvochatActive,
        monitoringIntervalMinutes: monitoringInterval[0],
        basePointAddress,
        checkinType,
        hourlyRate: hourlyRate !== "" ? Number(hourlyRate) : undefined,
        kmRate: kmRate !== "" ? Number(kmRate) : undefined,
        language,
        workShift,
        defaultScreen,
        notifyWeb,
        notifyEmail,
        avatarUrl,
      });

      // Atualizar permissoes RBAC
      await usersApi.updatePermissions(uid, permissions);

      alert("Colaborador salvo com sucesso!");
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao salvar colaborador.");
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddAttachment = async () => {
    if (!newAttachmentName.trim()) return;
    if (!collaboratorId) {
      alert("Salve o colaborador antes de adicionar anexos.");
      return;
    }
    try {
      const att = await usersApi.addAttachment(collaboratorId, {
        fileName: newAttachmentName,
        fileUrl: `https://fake-storage.com/${encodeURIComponent(newAttachmentName)}`,
      });
      setAttachments((prev) => [att, ...prev]);
      setNewAttachmentName("");
    } catch (e: any) {
      alert("Erro ao anexar arquivo.");
    }
  };

  const handleDeleteAttachment = async (id: string) => {
    if (!collaboratorId) return;
    try {
      await usersApi.deleteAttachment(collaboratorId, id);
      setAttachments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      alert("Erro ao remover anexo.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {collaboratorId ? `Editar Colaborador: ${name}` : "Novo Colaborador"}
              </DialogTitle>
              <DialogDescription>
                Painel unificado de perfil operacional, RBAC granular, ponto base e jornada.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x">
            {/* PAINEL FIXO LATERAL (4 COLUNAS) */}
            <div className="md:col-span-4 p-5 space-y-4 bg-muted/20">
              <div className="flex flex-col items-center gap-2">
                <div className="relative group w-24 h-24 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center overflow-hidden bg-background">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Cole a URL da foto do colaborador:", avatarUrl);
                      if (url !== null) setAvatarUrl(url);
                    }}
                    className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px]"
                  >
                    <Upload className="w-4 h-4 mb-1" />
                    Alterar
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">Avatar / Foto</span>
              </div>

              {/* Nome */}
              <div>
                <Label className="text-xs font-semibold">Nome *</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="Nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs pr-7 rounded-lg"
                  />
                  {name && (
                    <button
                      type="button"
                      onClick={() => setName("")}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Login */}
              <div>
                <Label className="text-xs font-semibold">Login *</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="ex: lucas.silva"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    className="h-8 text-xs pr-7 rounded-lg"
                  />
                  {login && (
                    <button
                      type="button"
                      onClick={() => setLogin("")}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cargo */}
              <div>
                <Label className="text-xs font-semibold">Cargo</Label>
                <div className="relative mt-1">
                  <Input
                    placeholder="ex: Técnico de Campo Sênior"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="h-8 text-xs pr-7 rounded-lg"
                  />
                  {roleTitle && (
                    <button
                      type="button"
                      onClick={() => setRoleTitle("")}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Contato & E-mail */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Contato</Label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-8 text-xs rounded-lg mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">E-mail</Label>
                  <Input
                    placeholder="email@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-8 text-xs rounded-lg mt-1"
                  />
                </div>
              </div>

              {/* Switch Auvochat */}
              <div className="flex items-center justify-between p-3 border rounded-xl bg-card">
                <div>
                  <span className="text-xs font-bold text-foreground block">Módulos - Auvochat</span>
                  <span className="text-[10px] text-muted-foreground">Comunicação direta em tempo real</span>
                </div>
                <Switch checked={auvochatActive} onCheckedChange={setAuvochatActive} />
              </div>

              {/* Frequência de Monitoramento */}
              <div className="p-3 border rounded-xl bg-card space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground">Frequência de Monitoramento</span>
                  <span className="text-primary font-mono font-bold">{monitoringInterval[0]} min</span>
                </div>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={monitoringInterval}
                  onValueChange={setMonitoringInterval}
                  className="py-1"
                />
                <span className="text-[10px] text-muted-foreground block">Intervalo de captura de GPS em rota</span>
              </div>

              {/* Ponto Base Operacional */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Ponto Base (Partida Operacional)
                </Label>
                <Input
                  placeholder="Endereço de partida do técnico"
                  value={basePointAddress}
                  onChange={(e) => setBasePointAddress(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Usado como referência inicial para apuração de KM rodado.
                </span>
              </div>
            </div>

            {/* ABAS DE CONTEÚDO (8 COLUNAS) */}
            <div className="md:col-span-8 p-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 p-1 bg-muted/60 rounded-xl mb-4">
                  <TabsTrigger value="detalhes" className="text-xs font-semibold rounded-lg">
                    Detalhes
                  </TabsTrigger>
                  <TabsTrigger value="configuracoes" className="text-xs font-semibold rounded-lg">
                    RBAC / Permissões
                  </TabsTrigger>
                  <TabsTrigger value="notificacoes" className="text-xs font-semibold rounded-lg">
                    Notificações
                  </TabsTrigger>
                  <TabsTrigger value="interface" className="text-xs font-semibold rounded-lg">
                    Interface
                  </TabsTrigger>
                  <TabsTrigger value="anexos" className="text-xs font-semibold rounded-lg">
                    Anexos
                  </TabsTrigger>
                </TabsList>

                {/* ABA 1: DETALHES */}
                <TabsContent value="detalhes" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Tipo de usuário *</Label>
                      <Select value={userRole} onValueChange={setUserRole}>
                        <SelectTrigger className="h-9 text-xs rounded-lg mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                          <SelectItem value="MANAGER">Gestor</SelectItem>
                          <SelectItem value="TECHNICIAN">Técnico de Campo</SelectItem>
                          <SelectItem value="ADMINISTRATIVE">Administrativo / Compras</SelectItem>
                          <SelectItem value="WAREHOUSE">Almoxarife</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Tipo de check-in *</Label>
                      <Select value={checkinType} onValueChange={setCheckinType}>
                        <SelectTrigger className="h-9 text-xs rounded-lg mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANUAL">Manual</SelectItem>
                          <SelectItem value="GPS_AUTOMATIC">Automático por GPS</SelectItem>
                          <SelectItem value="QRCODE">QR Code no Equipamento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Senha {collaboratorId ? "(deixe em branco para manter)" : "*"}</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-9 text-xs rounded-lg mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Confirmar Senha</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="h-9 text-xs rounded-lg mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <Label className="text-xs font-semibold">Valor por hora trabalhada (R$)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="h-9 text-xs rounded-lg mt-1"
                      />
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Base de custo para a visão interna da OS
                      </span>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Valor por KM rodado (R$)</Label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={kmRate}
                        onChange={(e) => setKmRate(e.target.value)}
                        className="h-9 text-xs rounded-lg mt-1"
                      />
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        Reembolso/custo de deslocamento por quilômetro
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                      <Label className="text-xs font-semibold">Língua</Label>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="h-9 text-xs rounded-lg mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pt-BR">Português (BR)</SelectItem>
                          <SelectItem value="en-US">English (US)</SelectItem>
                          <SelectItem value="es-ES">Español</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold">Jornada de Trabalho</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="workShift"
                            checked={workShift === "ALWAYS_ACTIVE"}
                            onChange={() => setWorkShift("ALWAYS_ACTIVE")}
                          />
                          Sempre Ativo
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="radio"
                            name="workShift"
                            checked={workShift === "CUSTOM"}
                            onChange={() => setWorkShift("CUSTOM")}
                          />
                          Jornada Personalizada
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 2: RBAC / PERMISSÕES */}
                <TabsContent value="configuracoes" className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
                  {/* Seção Tarefas */}
                  <div className="border rounded-xl p-4 bg-card space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-primary" /> Permissões de Tarefas (Field Service)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        ["tasksCreate", "Criar tarefas"],
                        ["tasksAllTypes", "Todos os tipos de tarefa"],
                        ["tasksExecute", "Executar tarefas"],
                        ["tasksEdit", "Editar tarefas"],
                        ["tasksDelete", "Excluir tarefas"],
                        ["tasksRemoveSignature", "Remover assinatura coletada"],
                        ["tasksPause", "Pausar tarefas"],
                        ["tasksReschedule", "Reagendar tarefas"],
                        ["tasksUseGalleryPhotos", "Utilizar fotos da galeria"],
                        ["tasksEditAfterCheckout", "Editar tarefas após check-out"],
                        ["tasksManualCheckoutPending", "Check-out manual com pendências"],
                        ["tasksManualCheckinPendingOther", "Check-in manual com pendência em outra tarefa"],
                        ["tasksReportWithoutCheckin", "Preencher relatório sem check-in"],
                        ["tasksManualCheckinOutsideSchedule", "Check-in manual fora do agendado"],
                        ["tasksAddQuestionnaire", "Adicionar questionário"],
                        ["tasksRemoveQuestionnaire", "Remover questionário"],
                        ["tasksRemoveEquipmentQuestionnaire", "Remover equipamento do questionário"],
                      ].map(([k, label]) => (
                        <label key={k} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                          <span className="text-text-secondary">{label}</span>
                          <Switch
                            checked={!!permissions[k]}
                            onCheckedChange={() => togglePermission(k)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Seção Colaboradores */}
                  <div className="border rounded-xl p-4 bg-card space-y-3">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Shield className="h-3.5 w-3.5 text-primary" /> Colaboradores e Clientes
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        ["collabChangeBasePoint", "Alterar ponto base"],
                        ["collabManageClients", "Cadastrar / editar clientes"],
                        ["collabAccessProductsQuotes", "Acessar produtos e orçamentos"],
                        ["collabEditClientAddress", "Editar endereço de cliente"],
                        ["collabChangeQuoteStatus", "Alterar status de orçamento"],
                        ["collabViewClientContact", "Visualizar e-mail e telefone de clientes"],
                        ["collabViewSendDigitalOSReport", "Visualizar e enviar OS Digital e Relatório"],
                        ["collabManageFinancialCategories", "Gerenciar categorias financeiras"],
                        ["collabEnableDisplacementOption", "Habilitar início de deslocamento na tarefa"],
                        ["collabViewValuesProductsServicesCosts", "Visualizar valores de produtos e serviços"],
                        ["collabMoveCompanyStock", "Movimentar estoque da empresa"],
                        ["collabManageKeywords", "Gerenciar palavras-chave"],
                      ].map(([k, label]) => (
                        <label key={k} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/40 cursor-pointer">
                          <span className="text-text-secondary">{label}</span>
                          <Switch
                            checked={!!permissions[k]}
                            onCheckedChange={() => togglePermission(k)}
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Seções Projetos, Equipamentos e Desk */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="border rounded-xl p-3 bg-card space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Projetos</h4>
                      <div className="space-y-1.5 text-xs">
                        {[
                          ["projectsCreate", "Cadastrar"],
                          ["projectsEdit", "Editar"],
                          ["projectsView", "Visualizar"],
                          ["projectsDelete", "Excluir"],
                        ].map(([k, label]) => (
                          <label key={k} className="flex items-center justify-between py-1 cursor-pointer">
                            <span className="text-text-secondary">{label}</span>
                            <Switch checked={!!permissions[k]} onCheckedChange={() => togglePermission(k)} />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-xl p-3 bg-card space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Equipamentos</h4>
                      <div className="space-y-1.5 text-xs">
                        {[
                          ["equipmentsView", "Visualizar"],
                          ["equipmentsCreate", "Cadastrar"],
                          ["equipmentsEdit", "Editar"],
                          ["equipmentsDelete", "Excluir"],
                        ].map(([k, label]) => (
                          <label key={k} className="flex items-center justify-between py-1 cursor-pointer">
                            <span className="text-text-secondary">{label}</span>
                            <Switch checked={!!permissions[k]} onCheckedChange={() => togglePermission(k)} />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="border rounded-xl p-3 bg-card space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Auvo Desk</h4>
                      <div className="space-y-1.5 text-xs">
                        {[["deskDeleteTicketNotes", "Excluir notas do ticket"]].map(([k, label]) => (
                          <label key={k} className="flex items-center justify-between py-1 cursor-pointer">
                            <span className="text-text-secondary">{label}</span>
                            <Switch checked={!!permissions[k]} onCheckedChange={() => togglePermission(k)} />
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 3: NOTIFICAÇÕES */}
                <TabsContent value="notificacoes" className="space-y-4">
                  <div className="border rounded-xl p-4 bg-card space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
                      <Bell className="h-4 w-4 text-primary" /> Eventos & Canais de Alerta
                    </div>
                    <div className="p-3 border rounded-xl space-y-3">
                      <span className="font-semibold text-xs block text-foreground">Alteração de status de aprovação</span>
                      <div className="flex items-center gap-6">
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={notifyWeb} onCheckedChange={setNotifyWeb} />
                          Notificação Web / App
                        </label>
                        <label className="flex items-center gap-2 text-xs cursor-pointer">
                          <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                          Notificação por E-mail
                        </label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 4: INTERFACE */}
                <TabsContent value="interface" className="space-y-4">
                  <div className="border rounded-xl p-4 bg-card space-y-3">
                    <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
                      <Monitor className="h-4 w-4 text-primary" /> Tela de Entrada Padrão
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Escolha qual visualização o colaborador verá logo ao fazer login no sistema.
                    </p>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <label
                        className={`p-4 border rounded-xl flex items-center gap-3 cursor-pointer transition ${
                          defaultScreen === "CALENDAR"
                            ? "border-primary bg-primary/5 font-semibold text-primary"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="defaultScreen"
                          checked={defaultScreen === "CALENDAR"}
                          onChange={() => setDefaultScreen("CALENDAR")}
                        />
                        <div className="text-xs">
                          <span className="block font-bold">Agenda de Atividades</span>
                          <span className="text-muted-foreground text-[11px]">Visão diária e semanal de tarefas</span>
                        </div>
                      </label>

                      <label
                        className={`p-4 border rounded-xl flex items-center gap-3 cursor-pointer transition ${
                          defaultScreen === "TASK_REPORT"
                            ? "border-primary bg-primary/5 font-semibold text-primary"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name="defaultScreen"
                          checked={defaultScreen === "TASK_REPORT"}
                          onChange={() => setDefaultScreen("TASK_REPORT")}
                        />
                        <div className="text-xs">
                          <span className="block font-bold">Relatório de Tarefas</span>
                          <span className="text-muted-foreground text-[11px]">Listagem detalhada das execuções</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </TabsContent>

                {/* ABA 5: ANEXOS */}
                <TabsContent value="anexos" className="space-y-4">
                  <div className="border rounded-xl p-4 bg-card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
                        <Paperclip className="h-4 w-4 text-primary" /> Documentos e Contratos Anexados
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Nome do arquivo / documento"
                          value={newAttachmentName}
                          onChange={(e) => setNewAttachmentName(e.target.value)}
                          className="h-8 text-xs w-48 rounded-lg"
                        />
                        <Button
                          size="sm"
                          type="button"
                          onClick={handleAddAttachment}
                          className="h-8 text-xs rounded-lg gap-1.5"
                        >
                          <Upload className="h-3.5 w-3.5" /> Anexar
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-xl overflow-hidden mt-3">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 border-b">
                          <tr>
                            <th className="py-2.5 px-4 text-left font-semibold">Arquivo</th>
                            <th className="py-2.5 px-4 text-center font-semibold">Data de Inclusão</th>
                            <th className="py-2.5 px-4 text-right font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {attachments.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="py-6 text-center text-muted-foreground italic">
                                Nenhum arquivo anexado a este colaborador.
                              </td>
                            </tr>
                          ) : (
                            attachments.map((att) => (
                              <tr key={att.id}>
                                <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <span>{att.fileName}</span>
                                </td>
                                <td className="py-2.5 px-4 text-center text-muted-foreground">
                                  {formatDateBR(att.createdAt)}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAttachment(att.id)}
                                    className="p-1 text-muted-foreground hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        <DialogFooter className="p-4 border-t bg-muted/10 flex justify-between items-center sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl text-xs gap-1.5 bg-primary hover:bg-primary/90"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            {saving ? "Salvando..." : "Salvar Colaborador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

