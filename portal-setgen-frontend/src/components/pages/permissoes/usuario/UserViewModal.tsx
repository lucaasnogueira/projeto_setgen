"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user";
import { formatDateBR } from "@/lib/date";
import { User as UserIcon, Mail, Building, Briefcase, Calendar, Shield, Key } from "lucide-react";
import Link from "next/link";

interface UserViewModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserViewModal({ user, open, onOpenChange }: UserViewModalProps) {
  if (!user) return null;

  const isAD = user.authProvider === "AD";
  const isActive = user.isActive !== false && user.active !== false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg border">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">{user.name}</DialogTitle>
              <DialogDescription className="text-xs">{user.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs border-y my-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" /> Perfil / Role
              </span>
              <div className="font-semibold text-foreground">{user.role}</div>
            </div>

            <div className="p-3 rounded-xl bg-muted/30 border space-y-1">
              <span className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" /> Provedor
              </span>
              <div>
                <Badge variant={isAD ? "default" : "outline"} className="text-[10px]">
                  {isAD ? "Active Directory" : "Local"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Cargo / Posição:
              </span>
              <span className="font-medium text-foreground">{user.position || user.roleTitle || "—"}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-muted-foreground" /> Empresa / Unidade:
              </span>
              <span className="font-medium text-foreground">{user.company?.name || "Matriz Setgen"}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" /> Cadastrado em:
              </span>
              <span className="font-medium text-foreground">{user.createdAt ? formatDateBR(user.createdAt) : "—"}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
              <span className="text-muted-foreground">Status da Conta:</span>
              <Badge variant={isActive ? "default" : "destructive"} className="text-[10px]">
                {isActive ? "Ativo" : "Bloqueado"}
              </Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center">
          <Link href={`/permissoes/gestao?userId=${user.id}`}>
            <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1.5">
              <Key className="w-3.5 h-3.5" /> Gerenciar Permissões
            </Button>
          </Link>
          <Button size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserViewModal;

