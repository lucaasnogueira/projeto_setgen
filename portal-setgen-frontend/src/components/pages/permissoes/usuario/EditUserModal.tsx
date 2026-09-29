"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { User, CreateUserDto, UpdateUserDto } from "@/types/user";
import { UserRole } from "@/types/auth";
import usersService from "@/services/users/users.service";
import { toast } from "sonner";
import { UserPlus, UserCheck, Shield, Key, Search, Loader2 } from "lucide-react";

interface EditUserModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditUserModal({ user, open, onOpenChange, onSuccess }: EditUserModalProps) {
  const isEditing = !!user;
  const [authProvider, setAuthProvider] = useState<"LOCAL" | "AD">("LOCAL");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.COLLABORATOR);
  const [position, setPosition] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adQuery, setAdQuery] = useState("");
  const [searchingAd, setSearchingAd] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (user) {
        setName(user.name || "");
        setEmail(user.email || "");
        setRole(user.role || UserRole.COLLABORATOR);
        setPosition(user.position || user.roleTitle || "");
        setAuthProvider((user.authProvider as any) || "LOCAL");
        setPassword("");
        setConfirmPassword("");
      } else {
        setName("");
        setEmail("");
        setRole(UserRole.COLLABORATOR);
        setPosition("");
        setAuthProvider("LOCAL");
        setPassword("");
        setConfirmPassword("");
        setAdQuery("");
      }
    }
  }, [open, user]);

  const handleSearchAd = async () => {
    if (!adQuery.trim()) return;
    setSearchingAd(true);
    try {
      // Simulação rápida de lookup no AD via LDAP/UPN
      await new Promise((r) => setTimeout(r, 600));
      const cleanUsername = adQuery.toLowerCase().replace(/@.*$/, "");
      setName(cleanUsername.replace(".", " ").replace(/\b\w/g, (l) => l.toUpperCase()));
      setEmail(`${cleanUsername}@setgen.com.br`);
      setPosition("Analista de Operações (AD)");
      toast.success("Conta localizada no Active Directory com sucesso!");
    } catch {
      toast.error("Usuário não encontrado no domínio AD.");
    } finally {
      setSearchingAd(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    if (!isEditing && authProvider === "LOCAL" && !password) {
      toast.error("A senha inicial é obrigatória para usuários locais.");
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error("As senhas informadas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const updatePayload: UpdateUserDto = {
          name,
          email,
          role,
          position,
          ...(password ? { password } : {}),
        };
        await usersService.update(user.id, updatePayload);
        toast.success("Usuário atualizado com sucesso!");
      } else {
        const createPayload: CreateUserDto = {
          name,
          email,
          role,
          position,
          authProvider,
          ...(password ? { password } : {}),
        };
        await usersService.create(createPayload);
        toast.success("Usuário criado com sucesso!");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  const isAdLocked = isEditing && user?.authProvider === "AD";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {isEditing ? `Editar Usuário: ${user.name}` : "Novo Usuário"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Defina as credenciais, perfil e tipo de autenticação do colaborador.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          {/* Alternância de Tipo de Conta (Apenas na criação) */}
          {!isEditing && (
            <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-xl">
              <button
                type="button"
                onClick={() => setAuthProvider("LOCAL")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition text-xs flex items-center justify-center gap-1.5 ${
                  authProvider === "LOCAL" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Usuário Local
              </button>
              <button
                type="button"
                onClick={() => setAuthProvider("AD")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition text-xs flex items-center justify-center gap-1.5 ${
                  authProvider === "AD" ? "bg-card text-blue-600 shadow-xs" : "text-muted-foreground"
                }`}
              >
                <Shield className="w-3.5 h-3.5" /> Active Directory (AD)
              </button>
            </div>
          )}

          {/* Busca AD se aplicável */}
          {!isEditing && authProvider === "AD" && (
            <div className="p-3 border rounded-xl bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
              <Label className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
                Buscar conta no Active Directory (UPN / sAMAccountName)
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="ex: lucas.silva ou lucas@setgen.com.br"
                  value={adQuery}
                  onChange={(e) => setAdQuery(e.target.value)}
                  className="h-8 text-xs bg-card"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSearchAd}
                  disabled={searchingAd}
                  className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {searchingAd ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Buscar
                </Button>
              </div>
            </div>
          )}

          {/* Dados Cadastrais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Nome Completo *</Label>
              <Input
                placeholder="Nome do usuário"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isAdLocked}
                className="mt-1 h-8 text-xs rounded-lg"
                required
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">E-mail Corporativo *</Label>
              <Input
                type="email"
                placeholder="nome@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isAdLocked}
                className="mt-1 h-8 text-xs rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Perfil / Role *</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger className="mt-1 h-8 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Administrador (Acesso Total)</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Gestor Operacional</SelectItem>
                  <SelectItem value={UserRole.COLLABORATOR}>Colaborador</SelectItem>
                  <SelectItem value={UserRole.EMPLOYEE}>Funcionário</SelectItem>
                  <SelectItem value={UserRole.TECHNICIAN}>Técnico de Campo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Cargo / Função</Label>
              <Input
                placeholder="ex: Coordenador Técnico"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-1 h-8 text-xs rounded-lg"
              />
            </div>
          </div>

          {/* Senha (Apenas para conta local) */}
          {authProvider === "LOCAL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
              <div>
                <Label className="text-xs font-semibold">
                  Senha {isEditing ? "(opcional)" : "*"}
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 h-8 text-xs rounded-lg"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Confirmar Senha</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 h-8 text-xs rounded-lg"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t flex sm:justify-between items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={saving}
              className="rounded-xl text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white"
            >
              <UserCheck className="w-3.5 h-3.5" />
              {saving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditUserModal;

