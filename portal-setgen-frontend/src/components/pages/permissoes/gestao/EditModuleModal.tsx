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
import { Switch } from "@/components/ui/switch";
import { AppModule } from "@/types/module";
import modulesService from "@/services/modules/modules.service";
import { toast } from "sonner";
import { Layers, Save } from "lucide-react";

interface EditModuleModalProps {
  module: AppModule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditModuleModal({ module, open, onOpenChange, onSuccess }: EditModuleModalProps) {
  const [name, setName] = useState("");
  const [route, setRoute] = useState("");
  const [icon, setIcon] = useState("Layers");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && module) {
      setName(module.name || "");
      setRoute(module.route || "");
      setIcon(module.icon || "Layers");
      setDescription(module.description || "");
      setActive(module.active !== false);
    }
  }, [open, module]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!module) return;

    setSaving(true);
    try {
      await modulesService.update(module.id, {
        name,
        route,
        icon,
        description,
        active,
      });
      toast.success("Módulo atualizado com sucesso!");
      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar módulo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Configuração Técnica do Módulo
              </DialogTitle>
              <DialogDescription className="text-xs">
                Ajuste a rota, ícone e parâmetros de navegação no portal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2 text-xs">
          <div>
            <Label className="text-xs font-semibold">Nome do Módulo</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-8 text-xs rounded-lg"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Rota no Next.js (URL)</Label>
            <Input
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="mt-1 h-8 text-xs rounded-lg font-mono"
              placeholder="/exemplo"
              required
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Ícone (Lucide Icon Name)</Label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="mt-1 h-8 text-xs rounded-lg font-mono"
              placeholder="Layers, Package, Users..."
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Descrição do Módulo</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 h-8 text-xs rounded-lg"
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
            <div>
              <span className="font-semibold block text-foreground">Módulo Habilitado</span>
              <span className="text-[10px] text-muted-foreground">Exibir no catálogo do sistema</span>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>

          <DialogFooter className="pt-2 border-t flex sm:justify-between items-center">
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
              <Save className="w-3.5 h-3.5" />
              {saving ? "Salvando..." : "Salvar Módulo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditModuleModal;

