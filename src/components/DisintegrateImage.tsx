"use client";

import React, { useEffect, useRef } from "react";

/**
 * Imagen que se deshace en partículas al pasar el cursor.
 *
 * En reposo se pinta la imagen completa con un solo `drawImage`, así que se ve
 * exactamente igual de nítida que un `<img>`. La rejilla de celdas sólo entra
 * en juego donde el cursor ya pasó: se recorta el hueco que dejó cada celda
 * (queda transparente y se ve el fondo de la página) y se vuelve a pintar la
 * celda en su posición desplazada.
 *
 * De ahí salen las dos propiedades que importan: **nunca se pixelea la parte
 * quieta** de la imagen, y el costo por cuadro es proporcional al número de
 * celdas revueltas, no al total. Por eso las celdas pueden ser chicas.
 *
 * El rastro aparece solo porque las celdas tardan en regresar; no se guarda
 * ninguna traza aparte.
 */
interface Props {
  src: string;
  /** Lado de cada partícula en píxeles de CSS. Más chico = grano más fino. */
  cellSize?: number;
  /** Radio de influencia del cursor, en píxeles de CSS. */
  radius?: number;
  className?: string;
}

interface Cell {
  /** Posición de reposo. */
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  /** Quieta y en su sitio: se salta en el bucle y no se dibuja. */
  sleeping: boolean;
}

export default function DisintegrateImage({
  src,
  cellSize = 4,
  radius = 95,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // `alpha: true` es lo que permite que el hueco de cada celda quede
    // transparente en vez de negro.
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let cells: Cell[] = [];
    let cols = 0;
    let raf = 0;
    let running = false;
    let disposed = false;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pointer = { x: -9999, y: -9999, active: false };

    const image = new Image();
    image.crossOrigin = "anonymous";

    /** Recorta la imagen al contenedor con el mismo criterio que `object-fit: cover`. */
    const coverRect = (iw: number, ih: number) => {
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      return { dx: (w - dw) / 2, dy: (h - dh) / 2, dw, dh };
    };

    const drawImageFull = () => {
      if (!image.complete || !image.naturalWidth) return;
      const { dx, dy, dw, dh } = coverRect(
        image.naturalWidth,
        image.naturalHeight,
      );
      ctx.drawImage(image, dx, dy, dw, dh);
    };

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      if (w === 0 || h === 0) return;

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.clearRect(0, 0, w, h);
      drawImageFull();
      if (reduced) return;

      // Se lee el lienzo ya dibujado en vez de la imagen original: así el
      // muestreo hereda el recorte "cover" y no hay que replicarlo a mano.
      let data: Uint8ClampedArray;
      try {
        data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      } catch {
        cells = []; // Lienzo contaminado: se queda estática.
        return;
      }

      cols = Math.ceil(w / cellSize);
      const rows = Math.ceil(h / cellSize);
      const next: Cell[] = new Array(cols * rows);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * cellSize;
          const y = r * cellSize;
          // Se muestrea el centro de la celda: con degradados, la esquina
          // arrastra el color de la vecina.
          const sx = Math.min(
            canvas.width - 1,
            Math.round((x + cellSize / 2) * dpr),
          );
          const sy = Math.min(
            canvas.height - 1,
            Math.round((y + cellSize / 2) * dpr),
          );
          const i = (sy * canvas.width + sx) * 4;
          next[r * cols + c] = {
            ox: x,
            oy: y,
            x,
            y,
            vx: 0,
            vy: 0,
            color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`,
            sleeping: true,
          };
        }
      }
      cells = next;
    };

    const frame = () => {
      if (disposed) return;

      const r2 = radius * radius;
      const awake: Cell[] = [];

      for (const c of cells) {
        let inRange = false;
        if (pointer.active) {
          const dx = c.x - pointer.x;
          const dy = c.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < r2 && d2 > 0.01) {
            inRange = true;
            const d = Math.sqrt(d2);
            // El empuje cae con la distancia: así el borde del radio no deja
            // un corte visible.
            const push = ((radius - d) / radius) * 5;
            c.vx += (dx / d) * push;
            c.vy += (dy / d) * push;
            c.sleeping = false;
          }
        }
        // Las celdas dormidas y fuera de alcance no cuestan nada.
        if (c.sleeping && !inRange) continue;

        // Resorte de regreso al origen, con fricción para que no oscile.
        c.vx = (c.vx + (c.ox - c.x) * 0.05) * 0.87;
        c.vy = (c.vy + (c.oy - c.y) * 0.05) * 0.87;
        c.x += c.vx;
        c.y += c.vy;

        const off = Math.abs(c.x - c.ox) + Math.abs(c.y - c.oy);
        if (off < 0.35 && Math.abs(c.vx) + Math.abs(c.vy) < 0.35) {
          // Se ancla para que no quede temblando medio píxel fuera de sitio.
          c.x = c.ox;
          c.y = c.oy;
          c.vx = 0;
          c.vy = 0;
          c.sleeping = true;
        } else {
          awake.push(c);
        }
      }

      ctx.clearRect(0, 0, w, h);
      drawImageFull();

      // Primero todos los huecos y después todas las partículas: si se hiciera
      // celda por celda, un hueco borraría la partícula ya pintada del vecino.
      // `destination-out` recorta a transparente en vez de pintar de negro.
      if (awake.length) {
        ctx.globalCompositeOperation = "destination-out";
        for (const c of awake) {
          ctx.fillRect(c.ox, c.oy, cellSize, cellSize);
        }
        ctx.globalCompositeOperation = "source-over";

        for (const c of awake) {
          // Cuanto más lejos de su sitio, más se desvanece: eso es lo que lee
          // el ojo como "se dispersa" y no como "se movió".
          const off = Math.hypot(c.x - c.ox, c.y - c.oy);
          ctx.globalAlpha = Math.max(0.15, 1 - off / (radius * 0.9));
          ctx.fillStyle = c.color;
          ctx.fillRect(c.x, c.y, cellSize + 0.6, cellSize + 0.6);
        }
        ctx.globalAlpha = 1;
      }

      if (awake.length === 0 && !pointer.active) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const wake = () => {
      if (running || reduced || cells.length === 0) return;
      running = true;
      raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
      wake();
    };

    const onLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
      wake();
    };

    image.onload = () => build();
    image.src = src;

    // El contenedor cambia de tamaño con el layout de dos columnas, no sólo
    // con la ventana; por eso ResizeObserver y no un listener de resize.
    let resizeTimer: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(raf);
        running = false;
        build();
      }, 150);
    });
    ro.observe(canvas);

    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointercancel", onLeave);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      ro.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("pointercancel", onLeave);
      cells = [];
    };
  }, [src, cellSize, radius]);

  return <canvas ref={canvasRef} className={className} aria-hidden />;
}
