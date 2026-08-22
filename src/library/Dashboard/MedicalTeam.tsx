"use client";

import { useEffect, useState } from "react";

import IconsCC from "@/assets/icons/IconsCC";
import ButtonCC from "@/components/Button-CC";
import FormCC from "@/components/Form-CC";
import ModalCC from "@/components/Modal-CC";
import { useGlobalContext } from "@/e2e/globalContext";
import { Get_User_Patients } from "@/e2e/server/FeathersAPI";
import ActionButton from "@/library/Generics/ActionButton";

// Enfermería es el único rol que un médico puede dar de alta (medical-team).
type TeamRole = "enfermeria";
type TeamStatus = "active" | "suspended" | "revoked";
type TeamMember = {
  _id: string;
  name: string;
  email: string;
  role: TeamRole;
  tutorId: string;
  status: TeamStatus;
  assignedPatientIds: string[];
};

const roleLabels: Record<TeamRole, string> = {
  enfermeria: "Enfermería",
};

const patientName = (patient: Patient) =>
  [
    patient.personalInfo.names,
    patient.personalInfo.middleName,
    patient.personalInfo.lastName,
  ]
    .filter(Boolean)
    .join(" ");

export default function MedicalTeam() {
  const { feathersFetchCC } = useGlobalContext();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editing, setEditing] = useState<TeamMember>();
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assigning, setAssigning] = useState<TeamMember>();
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [patientSearch, setPatientSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    const [teamResponse, patientsResponse] = await Promise.all([
      feathersFetchCC<TeamMember[]>({
        service: "medical-team",
        method: "get",
        data: "mine",
        logId: "medical_team_listed",
        nonLoggable: true,
      }),
      Get_User_Patients().then((request) =>
        feathersFetchCC<{ patientsList: Patient[] }>(request),
      ),
    ]);
    if (teamResponse.type === "success") setMembers(teamResponse.data);
    if (patientsResponse.type === "success")
      setPatients(patientsResponse.data.patientsList);
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(undefined);
    setMemberModalOpen(true);
  };

  const openEdit = (member: TeamMember) => {
    setEditing(member);
    setMemberModalOpen(true);
  };

  const openAssignments = (member: TeamMember) => {
    setAssigning(member);
    setAssignedIds(new Set(member.assignedPatientIds));
    setPatientSearch("");
    setAssignmentModalOpen(true);
  };

  const submit = async (formData: FormData) => {
    const password = String(formData.get("password") ?? "");
    setLoading(true);
    const response = await feathersFetchCC<TeamMember>({
      service: "medical-team",
      method: editing ? "patch" : "create",
      ...(editing ? { resourceId: editing._id } : {}),
      data: {
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        role: "enfermeria" as TeamRole,
        ...(password ? { password } : {}),
      },
      logId: editing
        ? "medical_team_member_updated"
        : "medical_team_member_created",
      successToast: editing ? "Integrante actualizado" : "Integrante agregado",
    });
    setLoading(false);
    if (response.type === "success") {
      setMemberModalOpen(false);
      await loadData();
    }
  };

  const patchMember = async (
    member: TeamMember,
    data: object,
    successToast: string,
  ) => {
    const response = await feathersFetchCC<TeamMember>({
      service: "medical-team",
      method: "patch",
      resourceId: member._id,
      data,
      logId: "medical_team_access_updated",
      successToast,
    });
    if (response.type === "success") await loadData();
  };

  const revoke = async (member: TeamMember) => {
    if (
      !window.confirm(
        `¿Revocar el acceso de ${member.name}? La autoría clínica se conservará.`,
      )
    )
      return;
    const response = await feathersFetchCC<TeamMember>({
      service: "medical-team",
      method: "remove",
      data: member._id,
      logId: "medical_team_member_revoked",
      successToast: "Acceso revocado",
    });
    if (response.type === "success") await loadData();
  };

  const saveAssignments = async () => {
    if (!assigning) return;
    setLoading(true);
    await patchMember(
      assigning,
      { assignedPatientIds: [...assignedIds] },
      "Pacientes asignados",
    );
    setLoading(false);
    setAssignmentModalOpen(false);
  };

  const filteredMembers = members;
  const normalizedSearch = patientSearch.trim().toLocaleLowerCase("es-MX");
  const filteredPatients = patients.filter((patient) =>
    patientName(patient).toLocaleLowerCase("es-MX").includes(normalizedSearch),
  );
  const activeMembers = members.filter(
    (member) => member.status === "active",
  ).length;
  const assignedTotal = new Set(
    members.flatMap((member) => member.assignedPatientIds),
  ).size;

  return (
    <section className="MedicalTeamContainer">
      <header className="medical-team-head">
        <div>
          <p>Colaboración clínica</p>
          <h1>Mi Equipo</h1>
          <span>
            Administra accesos y pacientes asignados bajo tu responsabilidad.
          </span>
        </div>
        <ButtonCC
          text="Agregar integrante"
          icon={IconsCC.AddPerson}
          onClick={openCreate}
        />
      </header>

      <div className="medical-team-metrics" aria-label="Resumen del equipo">
        <article>
          <span>Total del equipo</span>
          <strong>{members.length}</strong>
        </article>
        <article data-tone="active">
          <span>Miembros activos</span>
          <strong>{activeMembers}</strong>
        </article>
        <article data-tone="roles">
          <span>Pacientes asignados</span>
          <strong>{assignedTotal}</strong>
        </article>
      </div>

      <div className="medical-team-grid" aria-live="polite">
        {filteredMembers.map((member) => (
          <article
            className="medical-team-member"
            data-status={member.status}
            key={member._id}
          >
            <div className="medical-team-member-main">
              <div className="medical-team-avatar" aria-hidden="true">
                {member.name
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div>
                <h2>{member.name}</h2>
                <p>{member.email}</p>
              </div>
              <span className="medical-team-status">
                {member.status === "active" ? "Activo" : "Suspendido"}
              </span>
            </div>
            <div className="medical-team-member-meta">
              <span data-role={member.role}>{roleLabels[member.role]}</span>
              <span>
                {member.assignedPatientIds.length} pacientes asignados
              </span>
            </div>
            <div className="medical-team-actions">
              <ActionButton
                size="compact"
                onClick={() => openAssignments(member)}
              >
                Asignar pacientes
              </ActionButton>
              <ActionButton size="compact" onClick={() => openEdit(member)}>
                Editar
              </ActionButton>
              <ActionButton
                size="compact"
                onClick={() =>
                  void patchMember(
                    member,
                    {
                      status:
                        member.status === "active" ? "suspended" : "active",
                    },
                    member.status === "active"
                      ? "Acceso suspendido"
                      : "Acceso reactivado",
                  )
                }
              >
                {member.status === "active" ? "Suspender" : "Reactivar"}
              </ActionButton>
              <ActionButton
                variant="danger"
                size="compact"
                onClick={() => void revoke(member)}
              >
                Revocar
              </ActionButton>
            </div>
          </article>
        ))}
        {!filteredMembers.length && (
          <div className="medical-team-empty">
            <strong>Sin integrantes en esta vista</strong>
            <p>Agrega una cuenta o cambia el filtro seleccionado.</p>
          </div>
        )}
      </div>

      <ModalCC
        size="medium"
        identifier="MedicalTeamForm"
        animation="popUp"
        useStates={{ state: memberModalOpen, setState: setMemberModalOpen }}
      >
        <FormCC
          key={`${editing?._id ?? "new"}-${memberModalOpen}`}
          identifier="MedicalTeamForm"
          // Mismo esquema que el modal de carpetas: sin esto el título y las
          // etiquetas se pintan con la paleta clara sobre el fondo del modal.
          colorSchema="night"
          title={editing ? "Editar integrante" : "Nuevo integrante"}
          subtitle="El tutor se asigna automáticamente y no puede cambiarse desde esta cuenta."
          buttonLoading={loading}
          submitButtonStyles={{
            text: editing ? "Guardar cambios" : "Crear cuenta",
          }}
          onSubmit={(formData) => void submit(formData)}
          inputList={[
            {
              type: "text",
              identifier: "name",
              label: "Nombre",
              required: true,
              initialValue: editing?.name,
              disableSessionSave: true,
            },
            {
              type: "email",
              identifier: "email",
              label: "Correo",
              required: true,
              initialValue: editing?.email,
              disableSessionSave: true,
            },
            {
              type: "password",
              identifier: "password",
              label: editing ? "Nueva contraseña (opcional)" : "Contraseña",
              required: !editing,
              showPasswordStrength: true,
              autoComplete: "new-password",
              disableSessionSave: true,
            },
          ]}
        />
      </ModalCC>

      <ModalCC
        size="medium"
        identifier="MedicalTeamAssignments"
        animation="popUp"
        useStates={{
          state: assignmentModalOpen,
          setState: setAssignmentModalOpen,
        }}
      >
        <section className="medical-team-assignment-modal">
          <p>Acceso clínico mínimo</p>
          <h2>Pacientes de {assigning?.name}</h2>
          <span>
            Solo los pacientes seleccionados estarán disponibles para esta
            cuenta.
          </span>
          <label htmlFor="medical-team-patient-search">Buscar paciente</label>
          <input
            id="medical-team-patient-search"
            type="search"
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.target.value)}
          />
          <div className="medical-team-patient-list">
            {filteredPatients.map((patient) => (
              <label key={patient._id}>
                <input
                  type="checkbox"
                  checked={assignedIds.has(patient._id)}
                  onChange={(event) => {
                    const next = new Set(assignedIds);
                    event.target.checked
                      ? next.add(patient._id)
                      : next.delete(patient._id);
                    setAssignedIds(next);
                  }}
                />
                <span>
                  <strong>{patientName(patient)}</strong>
                  <small>Expediente {patient.LUID}</small>
                </span>
              </label>
            ))}
          </div>
          <div className="medical-team-assignment-actions">
            <ActionButton onClick={() => setAssignmentModalOpen(false)}>
              Cancelar
            </ActionButton>
            <ActionButton
              variant="primary"
              disabled={loading}
              onClick={() => void saveAssignments()}
            >
              Guardar asignaciones
            </ActionButton>
          </div>
        </section>
      </ModalCC>
    </section>
  );
}
