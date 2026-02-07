"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check localStorage directly to avoid Zustand hydration issues
    const token = localStorage.getItem('token');
    const authStorage = localStorage.getItem('auth-storage');
    
    if (token || authStorage) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login');
    }
    
    setIsChecking(false);
  }, [router]);

  if (!isChecking) {
    return null; // Prevent flash
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando...</p>
      </div>
    </div>
  );
}
