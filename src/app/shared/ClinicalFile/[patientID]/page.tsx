"use client";

// Página retirada: era el enlace del bug del QR (compartía un expediente por
// patientId a pelo). Con el aislamiento por CLUES ya no entrega datos cross-CLUES.
// El nuevo flujo seguro vive en /shared/record/[token] (link + contraseña).
// Se deja un aviso en la misma ruta para no romper enlaces viejos.
export default function ClinicalFileRetired() {
  return (
    <section className="SharedSection" id="GeneralSection">
      <div className="needToLogIn">
        <h1>{"Este enlace ya no está disponible"}</h1>
        <p>
          {
            "La forma de compartir expedientes cambió por seguridad. Pide al médico que te genere un nuevo enlace con contraseña."
          }
        </p>
      </div>
    </section>
  );
}
