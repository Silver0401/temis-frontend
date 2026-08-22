"use client";

import React, { useEffect, useRef, useState } from "react";

interface SignaturePadCCProps {
  onConfirm: (signatureImage: string) => void;
  disabled?: boolean;
}

const SignaturePadCC: React.FC<SignaturePadCCProps> = ({
  onConfirm,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      context?.scale(ratio, ratio);
      setHasInk(false);
    };

    sizeCanvas();
    const observer = new ResizeObserver(sizeCanvas);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = event.currentTarget;
    canvas.setPointerCapture(event.pointerId);
    const context = canvas.getContext("2d");
    if (!context) return;
    const start = point(event);
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineWidth = 2.5;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = getComputedStyle(canvas).color;
    drawingRef.current = true;
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const next = point(event);
    context.lineTo(next.x, next.y);
    context.stroke();
    setHasInk(true);
  };

  const stopDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    drawingRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const exportSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || !hasInk) return;

    // Compone tinta negra sobre fondo blanco para que la evidencia sea legible
    // en pantalla y PDF, independientemente del tema usado al firmar.
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let index = 0; index < image.data.length; index += 4) {
      const composite = 255 - image.data[index + 3];
      image.data[index] = composite;
      image.data[index + 1] = composite;
      image.data[index + 2] = composite;
      image.data[index + 3] = 255;
    }
    const exported = document.createElement("canvas");
    exported.width = canvas.width;
    exported.height = canvas.height;
    exported.getContext("2d")?.putImageData(image, 0, 0);
    onConfirm(exported.toDataURL("image/png"));
  };

  return (
    <div className="SignaturePadCC">
      <div className="signatureCanvasFrame">
        <canvas
          ref={canvasRef}
          aria-label="Área para dibujar la firma"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
        />
        <span>Firma dentro del recuadro</span>
      </div>
      <div className="signatureActions">
        <button
          type="button"
          onClick={resetCanvas}
          disabled={!hasInk || disabled}
        >
          Limpiar
        </button>
        <button
          type="button"
          className="signatureConfirm"
          onClick={exportSignature}
          disabled={!hasInk || disabled}
        >
          Confirmar firma
        </button>
      </div>
    </div>
  );
};

export default SignaturePadCC;
