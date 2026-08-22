import React from "react";

/**
 * Ajustes de la cuenta.
 *
 * Aquí vivía el editor de "formatos base": dos plantillas de texto que el médico
 * personalizaba y que alimentaban la síntesis por IA de historias clínicas y
 * notas de evolución. Con la síntesis fuera, las plantillas no tenían consumidor.
 *
 * El modal se conserva porque es el lugar natural para la configuración de
 * COFEPRIS (consulta externa, detecciones) de la siguiente fase.
 */
const Configuration = () => (
  <div className="ConfigurationContainer">
    <div className="textContainer">
      <h3>{"Ajustes"}</h3>
      <p>{"Todavía no hay ajustes configurables para tu cuenta."}</p>
    </div>
  </div>
);

export default Configuration;
