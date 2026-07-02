"use client";

import { useEffect, useState } from "react";
import { Users, Tag, Bookmark, Plus, Loader2, Ban, CheckCircle2 } from "lucide-react";
import { teamsApi } from "@/lib/api/teams";
import { clientTaxonomiesApi } from "@/lib/api/client-taxonomies";
import { Team, ClientTaxonomy, ClientTaxonomyKind } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

function TeamsPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => teamsApi.getAll().then(setTeams).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await teamsApi.create({ name: name.trim() });
      setName("");
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || "Erro ao criar equipe");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (team: Team) => {
    await teamsApi.update(team.id, { active: !team.active });
    load();
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-orange-600" /> Equipes</CardTitle>
        <CardDescription>Usadas como "equipe responsável" no cadastro de clientes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Nome da equipe" value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={create} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        ) : (
          <div className="space-y-2">
            {teams.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{t.name}</span>
                  <Badge variant={t.active ? "default" : "secondary"}>{t.active ? "Ativa" : "Inativa"}</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(t)}>
                  {t.active ? <Ban className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </Button>
              </div>
            ))}
            {teams.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma equipe cadastrada.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaxonomyPanel({ kind, label, icon }: { kind: ClientTaxonomyKind; label: string; icon: React.ReactNode }) {
  const [items, setItems] = useState<ClientTaxonomy[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => clientTaxonomiesApi.getAll(kind).then(setItems).finally(() => setLoading(false));

  useEffect(() => { load(); }, [kind]);

  const create = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await clientTaxonomiesApi.create({ kind, name: name.trim() });
      setName("");
      await load();
    } catch (error: any) {
      alert(error.response?.data?.message || `Erro ao criar ${label.toLowerCase()}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: ClientTaxonomy) => {
    await clientTaxonomiesApi.update(item.id, { active: !item.active });
    load();
  };

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{icon} {label}</CardTitle>
        <CardDescription>Usado no cadastro de clientes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder={`Nome do ${label.toLowerCase()}`} value={name} onChange={(e) => setName(e.target.value)} />
          <Button onClick={create} disabled={saving || !name.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-orange-600" />
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl border">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.name}</span>
                  <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleActive(item)}>
                  {item.active ? <Ban className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-600" />}
                </Button>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-muted-foreground">Nada cadastrado ainda.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ClientLookupsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Equipes, Grupos e Segmentos"
        subtitle="Listas usadas no cadastro de clientes"
      />

      <Tabs defaultValue="teams">
        <TabsList>
          <TabsTrigger value="teams">Equipes</TabsTrigger>
          <TabsTrigger value="groups">Grupos de Clientes</TabsTrigger>
          <TabsTrigger value="segments">Segmentos</TabsTrigger>
        </TabsList>
        <TabsContent value="teams" className="pt-4">
          <TeamsPanel />
        </TabsContent>
        <TabsContent value="groups" className="pt-4">
          <TaxonomyPanel kind={ClientTaxonomyKind.GROUP} label="Grupo" icon={<Tag className="h-5 w-5 text-orange-600" />} />
        </TabsContent>
        <TabsContent value="segments" className="pt-4">
          <TaxonomyPanel kind={ClientTaxonomyKind.SEGMENT} label="Segmento" icon={<Bookmark className="h-5 w-5 text-orange-600" />} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
