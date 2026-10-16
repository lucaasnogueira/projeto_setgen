"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check, PenTool } from 'lucide-react';

interface SignaturePadModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
  signerName?: string;
}

export function SignaturePadModal({
  open,
  onClose,
  onSave,
  title = "Coletar Assinatura Digital",
  signerName,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
        setHasDrawn(false);
      }, 100);
    }
  }, [open]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-w-[95vw] rounded-xl p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-slate-900">
            <PenTool className="w-4 h-4 text-orange-500" />
            {title}
          </DialogTitle>
          {signerName && (
            <p className="text-xs text-slate-500 font-medium">
              Signatário: <strong className="text-slate-800">{signerName}</strong>
            </p>
          )}
        </DialogHeader>

        <div className="space-y-2 mt-2">
          <div className="relative border-2 border-dashed border-slate-300 rounded-lg bg-slate-50 overflow-hidden touch-none select-none">
            <canvas
              ref={canvasRef}
              className="w-full h-44 cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="absolute bottom-2 left-4 right-4 border-b border-slate-300/60 pointer-events-none" />
            <span className="absolute bottom-3 left-4 text-[10px] text-slate-400 uppercase font-bold tracking-wider pointer-events-none">
              Assine dentro desta área
            </span>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between items-center sm:justify-between gap-2 mt-3 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearCanvas}
            className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-3 rounded-lg text-xs font-semibold text-slate-500"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!hasDrawn}
              onClick={handleSave}
              className="h-8 px-3 rounded-lg bg-[#E2661D] hover:bg-[#c95716] text-white font-bold text-xs gap-1.5 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              Confirmar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

