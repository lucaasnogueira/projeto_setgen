"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api/auth";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 px-5 py-3 rounded-xl shadow-xl text-xs font-semibold text-white ${
      type === "error" ? "bg-red-600" : "bg-emerald-600"
    } z-50 animate-in fade-in slide-in-from-top-2 duration-200`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast("Preencha o e-mail e a senha", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      const token = response.accessToken || response.access_token;
      const user = response.user;

      if (!token) {
        throw new Error("Token de autenticação não retornado pelo servidor.");
      }

      setAuth(user, token);
      showToast(`Bem-vindo, ${user.name}!`);

      setTimeout(() => {
        // Redireciona diretamente para o Hub de Módulos
        router.push("/modules");
      }, 150);
    } catch (error: any) {
      showToast(
        error.response?.data?.message || "E-mail ou senha inválidos. Tente novamente.",
        "error"
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Entrar na sua conta
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Informe seu usuário (nome.sobrenome) ou e-mail corporativo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Usuário / E-mail */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
            Usuário ou E-mail Corporativo
          </Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="text"
              placeholder="lucas.silva ou lucas@setgen.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="h-10 pl-10 text-xs rounded-lg border-gray-200 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              autoFocus
              required
            />
          </div>
        </div>

        {/* Campo Senha */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-gray-700">
              Senha de Acesso
            </Label>
            <button
              type="button"
              tabIndex={-1}
              onClick={() => showToast("Solicitação de redefinição enviada ao administrador.", "success")}
              className="text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:underline"
            >
              Esqueceu a senha?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-10 pl-10 pr-10 text-xs rounded-lg border-gray-200 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
              title={showPassword ? "Ocultar senha" : "Ver senha"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Opção Lembrar meu acesso */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
            />
            <span>Lembrar meu acesso</span>
          </label>
        </div>

        {/* Botão Entrar */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Autenticando...</span>
            </>
          ) : (
            <>
              <span>Entrar no Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Selo de Segurança */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        <span>Acesso protegido por autenticação segura e criptografia TLS</span>
      </div>
    </div>
  );
}
