"use client";

import React from "react";
import SavePatientForm from "@/library/BaseForms/SavePatientForm";

/**
 * Captura del expediente.
 *
 * Antes esta ruta era `textTranscriber`: el médico pegaba texto libre, un modelo
 * de lenguaje le daba formato y sólo entonces aparecía el formulario. En Temis la
 * captura es directa — `SavePatientForm` es la única entrada de texto.
 */
const ClinicalRecordPage: React.FC = () => (
  <div className="ClinicalRecordPage">
    <div className="WordArea">
      <SavePatientForm />
    </div>
  </div>
);

export default ClinicalRecordPage;
