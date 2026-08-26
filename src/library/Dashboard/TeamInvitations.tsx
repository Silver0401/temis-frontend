"use client";

import { useEffect, useState } from "react";

import { useGlobalContext } from "@/e2e/globalContext";
import ActionButton from "@/library/Generics/ActionButton";

// Lo que ve la enfermera en "Mi Equipo": las solicitudes de médicos que quieren
// sumarla. El vínculo NO existe hasta que ella acepta — un enganche unilateral
// le daría a cualquiera que conozca su correo acceso a su cuenta.
type TeamInvite = {
  tutorId: string;
  tutorName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("es-MX", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

export default function TeamInvitations() {
  const { feathersFetchCC } = useGlobalContext();
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [loading, setLoading] = useState(false);

  const loadInvites = async () => {
    const response = await feathersFetchCC<TeamInvite[]>({
      service: "medical-team",
      method: "get",
      // `get` no tiene recurso propio: el id es la palabra clave que el
      // servicio usa para devolver las invitaciones de quien consulta.
      data: "invitations",
      logId: "medical_team_invitations_listed",
      nonLoggable: true,
    });
    if (response.type === "success") setInvites(response.data);
  };

  useEffect(() => {
    void loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const respond = async (
    invite: TeamInvite,
    inviteResponse: "accepted" | "rejected",
  ) => {
    setLoading(true);
    const response = await feathersFetchCC({
      service: "medical-team",
      method: "patch",
      resourceId: invite.tutorId,
      data: { inviteResponse },
      logId: "medical_team_invite_answered",
      successToast:
        inviteResponse === "accepted"
          ? `Ya formas parte del equipo de ${invite.tutorName}`
          : "Invitación rechazada",
    });
    setLoading(false);
    if (response.type === "success") await loadInvites();
  };

  return (
    <section className="MedicalTeamContainer">
      <header className="medical-team-head">
        <div>
          <p>Colaboración clínica</p>
          <h1>Mi Equipo</h1>
          <span>
            Médicos que te invitaron a su equipo. Solo verás a sus pacientes
            después de aceptar.
          </span>
        </div>
      </header>

      <div className="medical-team-grid" aria-live="polite">
        {invites.map((invite) => (
          <article className="medical-team-member" key={invite.tutorId}>
            <div className="medical-team-member-main">
              <div className="medical-team-avatar" aria-hidden="true">
                {invite.tutorName.charAt(0).toLocaleUpperCase("es-MX")}
              </div>
              <div>
                <strong>{invite.tutorName}</strong>
                <small>Te invitó el {formatDate(invite.createdAt)}</small>
              </div>
            </div>
            <div className="medical-team-actions">
              <ActionButton
                disabled={loading}
                onClick={() => void respond(invite, "rejected")}
              >
                Rechazar
              </ActionButton>
              <ActionButton
                variant="primary"
                disabled={loading}
                onClick={() => void respond(invite, "accepted")}
              >
                Aceptar
              </ActionButton>
            </div>
          </article>
        ))}
        {!invites.length && (
          <div className="medical-team-empty">
            <strong>No tienes invitaciones pendientes</strong>
            <p>Cuando un médico te invite a su equipo, aparecerá aquí.</p>
          </div>
        )}
      </div>
    </section>
  );
}
