"use client"

import { useState } from "react";
import { IMaskInput } from "react-imask";
import { Search, Building2, FileText, Phone, Mail, MapPin, Save, X } from "lucide-react";
import { fetchCep } from "@/lib/api/cep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Client } from "@/types";

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
  const [formData, setFormData] = useState({
    cnpjCpf: initialData?.cnpjCpf || "",
    name: initialData?.companyName || initialData?.name || "",
    tradeName: initialData?.tradeName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address?.street || initialData?.address || "",
    city: initialData?.address?.city || initialData?.city || "",
    state: initialData?.address?.state || initialData?.state || "",
    zipCode: initialData?.address?.cep || initialData?.zipCode || "",
  });

  const [lookupLoading, setLookupLoading] = useState(false);

  const handleCNPJLookup = async () => {
    const cnpjClean = formData.cnpjCpf.replace(/\D/g, "");
    if (cnpjClean.length !== 14) {
      alert("Informe um CNPJ válido para consulta");
      return;
    }

    setLookupLoading(true);
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjClean}`,
      );

      if (!response.ok) {
        alert("CNPJ não encontrado");
        return;
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        name: data.razao_social || "",
        tradeName: data.nome_fantasia || "",
        address: data.logradouro
          ? `${data.logradouro}, ${data.numero || "S/N"}`
          : "",
        city: data.municipio || "",
        state: data.uf || "",
        zipCode: data.cep || "",
        phone: data.ddd_telefone_1 || "",
        email: data.email || "",
      }));
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
        setFormData((prev) => ({
          ...prev,
          address: addressData.logradouro,
          city: addressData.localidade,
          state: addressData.uf,
          zipCode: cep,
        }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cnpjCpf: formData.cnpjCpf.replace(/\D/g, ""),
      companyName: formData.name,
      tradeName: formData.tradeName || undefined,
      phone: formData.phone,
      email: formData.email,
      address: {
        cep: formData.zipCode,
        street: formData.address,
        number: "S/N",
        neighborhood: "Não informado",
        city: formData.city,
        state: formData.state,
      },
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card de Identificação */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <FileText className="h-5 w-5 text-orange-600" />
            Identificação
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">CPF / CNPJ <span className="text-red-500">*</span></Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
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
                  value={formData.cnpjCpf}
                  onAccept={(value: string) => setFormData({ ...formData, cnpjCpf: value })}
                  className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Button 
                type="button" 
                variant="outline"
                onClick={handleCNPJLookup} 
                disabled={lookupLoading || loading}
                className="h-11 px-6 border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl flex items-center gap-2"
              >
                <Search className="h-4 w-4" />
                {lookupLoading ? "Consultando..." : "Consultar CNPJ"}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Razão Social <span className="text-red-500">*</span></Label>
              <Input
                required
                placeholder="Razão Social completa"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 rounded-xl focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Nome Fantasia</Label>
              <Input
                placeholder="Nome comercial"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                className="h-11 rounded-xl focus:ring-orange-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Contato */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Phone className="h-5 w-5 text-orange-600" />
            Contato
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">E-mail <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  required
                  placeholder="email@empresa.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-11 pl-10 rounded-xl focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Telefone <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <IMaskInput
                  mask="(00) 00000-0000"
                  placeholder="(00) 00000-0000"
                  value={formData.phone}
                  onAccept={(value: string) => setFormData({ ...formData, phone: value })}
                  className="w-full flex h-11 rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Localização */}
      <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <MapPin className="h-5 w-5 text-orange-600" />
            Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-700 font-semibold">Endereço <span className="text-red-500">*</span></Label>
            <Input
              required
              placeholder="Rua, Número, Bairro"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="h-11 rounded-xl focus:ring-orange-500"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Cidade <span className="text-red-500">*</span></Label>
              <Input
                required
                placeholder="Cidade"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="h-11 rounded-xl focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">Estado <span className="text-red-500">*</span></Label>
              <Input
                required
                placeholder="UF"
                maxLength={2}
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                className="h-11 rounded-xl focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700 font-semibold">CEP <span className="text-red-500">*</span></Label>
              <IMaskInput
                mask="00000-000"
                placeholder="00000-000"
                value={formData.zipCode}
                onAccept={(value: string) => {
                  setFormData({ ...formData, zipCode: value });
                  handleCepLookup(value);
                }}
                className="w-full flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 h-12 rounded-2xl border-2 hover:bg-gray-50 flex items-center justify-center gap-2 font-bold text-gray-600 transition-all active:scale-95"
        >
          <X className="h-5 w-5" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-2xl shadow-lg shadow-orange-200 flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50"
        >
          <Save className="h-5 w-5" />
          {loading ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
