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

  useEffect(() => {
    let currentUrl: string | null = null;
    let cancelled = false;

    api.get(`/${src}`, { responseType: 'blob' }).then((res) => {
      if (cancelled) return;
      currentUrl = URL.createObjectURL(res.data);
      setObjectUrl(currentUrl);
    }).catch(() => {});

    return () => {
      cancelled = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [src]);

  if (!objectUrl) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={objectUrl} {...imgProps} />;
}
