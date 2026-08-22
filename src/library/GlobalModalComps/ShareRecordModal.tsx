"use client";

import React from "react";
import { toast } from "sonner";
import ButtonCC from "@/components/Button-CC";

interface ShareRecordModalProps {
  url: string;
  password: string;
}

// Muestra al médico emisor la URL del link y la contraseña generada para que las
// comparta manualmente. La contraseña solo se ve aquí (en el backend va hasheada).
const ShareRecordModal: React.FC<ShareRecordModalProps> = ({
  url,
  password,
}) => {
  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copiada`);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <div className="ShareRecordModal">
      <h2>Compartir expediente</h2>
      <p>
        Comparte manualmente estos dos datos con el médico. El link caduca en 48
        horas y la contraseña no se vuelve a mostrar.
      </p>

      <label>Link</label>
      <div className="ShareRecordModal-row">
        <input readOnly value={url} onFocus={(e) => e.target.select()} />
        <ButtonCC text="Copiar" onClick={() => copy(url, "URL")} />
      </div>

      <label>Contraseña</label>
      <div className="ShareRecordModal-row">
        <input readOnly value={password} onFocus={(e) => e.target.select()} />
        <ButtonCC
          text="Copiar"
          onClick={() => copy(password, "Contraseña")}
        />
      </div>
    </div>
  );
};

export default ShareRecordModal;
