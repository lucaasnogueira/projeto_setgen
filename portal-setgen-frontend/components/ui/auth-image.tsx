"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api/client';

interface AuthImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** Caminho relativo servido por /uploads/*, ex: "uploads/products/foo.jpg" (rota protegida por JwtAuthGuard). */
  src: string;
}

// A rota /uploads/* exige Authorization: Bearer <token>, que uma tag <img> comum
// nunca envia. Busca o arquivo autenticado via axios e renderiza como blob URL.
export function AuthImage({ src, ...imgProps }: AuthImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let currentUrl: string | null = null;
    let cancelled = false;
    setFailed(false);

    api.get(`/${src}`, { responseType: 'blob' }).then((res) => {
      if (cancelled) return;
      currentUrl = URL.createObjectURL(res.data);
      setObjectUrl(currentUrl);
    }).catch((error) => {
      if (cancelled) return;
      console.error(`Falha ao carregar ${src}:`, error.response?.status, error.response?.data || error.message);
      setFailed(true);
    });

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [src]);

  if (failed) {
    return (
      <div
        className={imgProps.className}
        title="Falha ao carregar imagem"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', color: '#9ca3af', fontSize: 11 }}
      >
        erro
      </div>
    );
  }

  if (!objectUrl) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={objectUrl} {...imgProps} />;
}
