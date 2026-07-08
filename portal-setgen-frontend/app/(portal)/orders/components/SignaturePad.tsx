"use client"

import { useRef, useState } from "react";
import { Eraser, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSave: (blob: Blob) => void;
}

export function SignaturePad({ onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1f2937";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const confirm = () => {
    canvasRef.current!.toBlob((blob) => {
      if (blob) onSave(blob);
    }, "image/png");
  };

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        style={{ touchAction: "none" }}
        className="border rounded-2xl bg-card w-full max-w-[400px] h-[200px] cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1" onClick={clear}>
          <Eraser className="h-3.5 w-3.5" /> Limpar
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-xl gap-1 bg-orange-600 hover:bg-orange-700"
          onClick={confirm}
          disabled={!hasDrawn}
        >
          <Check className="h-3.5 w-3.5" /> Confirmar assinatura
        </Button>
      </div>
    </div>
  );
}
