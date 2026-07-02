"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api/auth';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg text-white ${
      type === 'error' ? 'bg-red-500' : 'bg-green-500'
    } z-50 animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Preencha e-mail e senha', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      const token = response.accessToken || response.access_token;
      const user = response.user;

      if (!token) {
        throw new Error('Token não retornado pelo backend');
      }

      setAuth(user, token);
      showToast(`Bem-vindo, ${user.name}!`);

      setTimeout(() => {
        router.push('/dashboard');
      }, 200);

    } catch (error: any) {
      showToast(error.response?.data?.message || 'E-mail ou senha inválidos', 'error');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-[26px] font-extrabold text-foreground mb-2">Bem-vindo de volta</h2>
      <p className="text-sm text-text-secondary mb-8">Entre com suas credenciais para acessar o portal.</p>

      <form onSubmit={handleSubmit} className="space-y-[18px]">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[13px] font-semibold text-foreground">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu.email@setgen.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="h-11 rounded-[10px]"
            autoFocus
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[13px] font-semibold text-foreground">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="h-11 pr-10 rounded-[10px]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            tabIndex={-1}
            onClick={() => showToast('Funcionalidade em desenvolvimento', 'success')}
            className="text-[13px] font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            Esqueci minha senha
          </button>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] bg-primary hover:bg-primary/90 text-white font-bold rounded-[10px] shadow-[0_8px_20px_rgba(226,102,29,0.25)]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>
    </div>
  );
}
