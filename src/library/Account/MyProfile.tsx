"use client";

import React, { useState } from "react";
import ModalCC from "@/components/Modal-CC";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Verify_Login } from "@/e2e/server/Queries";
import FancyLoader from "../Generics/Loaders/FancyLoader";
import NotFound from "../Generics/NotFound";
import { useGlobalContext } from "@/e2e/globalContext";

const getInitials = (name: string) =>
  name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const ProfileSection: React.FC = () => {
  const client = useQueryClient();
  const { getAccessToken, registerLog } = useGlobalContext();
  const { isLoading, data } = useQuery(Verify_Login(getAccessToken()));
  const [logoutOpen, setLogoutOpen] = useState(false);

  const LogOut = () => {
    registerLog({
      resourceType: `/authentication`,
      action: "user_logged_out",
      timestamp: new Date().toISOString(),
      status: "success",
      sessionRef: `${getAccessToken().accessToken?.slice(0, 5)}`,
    });
    client.invalidateQueries({ queryKey: ["Verify_Login"] });
    window.localStorage.removeItem("notAccessToken");
    window.sessionStorage.removeItem("notAccessToken");
    window.localStorage.removeItem("jwtExpired");
    window.location.reload();
  };

  if (isLoading) return <FancyLoader />;
  if (!data?.data || getAccessToken().accessToken === undefined)
    return <NotFound type="unauthorized" />;

  const user: UserBasedSchema = data.data.user;
  const initials = getInitials(user.name);
  const isVerified = user.UID?.validity === "valid";
  const hasWorkplace = Boolean(
    user.institute?.Name || user.institute?.HospitalOrClinic,
  );

  return (
    <section className="ProfileSection">
      <header className="ProfileHeading">
        <div className="ProfileHeadingCopy">
          <p className="ProfileEyebrow">Cuenta profesional</p>
          <h1>Mi perfil</h1>
          <p className="ProfileHeadingSub">
            Consulta tu información profesional, credenciales e identidad
            verificada.
          </p>
        </div>
        <div className="ProfileHeadingActions">
          <span className="ProfileUniqueIdentifier">{`ID: ${user._id}`}</span>
        </div>
      </header>

      <div className="ProfileLayout">
        <aside className="ProfileLeftPanel">
          <div className="ProfileCover" data-initials={initials} />

          <div className="ProfileIdentityBody">
            <div className="ProfileAvatar">
              {isVerified && user.UID?.faceImg ? (
                <img src={user.UID.faceImg} alt="Foto de perfil" />
              ) : (
                initials
              )}
              {isVerified && (
                <span
                  className="ProfileVerifiedMark"
                  title="Identidad verificada"
                >
                  ✓
                </span>
              )}
            </div>

            <h2 className="ProfileName">{user.name}</h2>

            {user.professionType && (
              <span className="ProfileProfessionBadge">
                {user.professionType}
              </span>
            )}

            {hasWorkplace && (
              <p className="ProfileInstitute">
                {user.institute?.Name && <strong>{user.institute.Name}</strong>}
                {user.institute?.HospitalOrClinic}
              </p>
            )}

            {user.clues && (
              <p className="ProfileClues">{`CLUES: ${user.clues}`}</p>
            )}

            <div className="ProfileStats">
              <div className="ProfileStat">
                <strong>{user.patientsList?.length ?? 0}</strong>
                <span>Pacientes</span>
              </div>
              <div className="ProfileStat">
                <strong>{user.groups?.length ?? 0}</strong>
                <span>Grupos</span>
              </div>
            </div>

            <button
              className="ProfileLogout"
              type="button"
              onClick={() => setLogoutOpen(true)}
            >
              Cerrar mi sesión
            </button>
          </div>
        </aside>

        <div className="ProfileContentStack">
          <section className="ProfileCard">
            <div className="ProfileCardHead">
              <h2 className="ProfileCardTitle">Información personal</h2>
              <span className="ProfileCardNumber">01</span>
            </div>
            <div className="ProfileFieldGrid">
              <div className="ProfileField">
                <label>Correo</label>
                <p title={user.email || "—"}>{user.email || "—"}</p>
              </div>
              <div className="ProfileField">
                <label>Sexo</label>
                <p>{user.personalInfo?.sex || "—"}</p>
              </div>
              <div className="ProfileField">
                <label>Fecha de nacimiento</label>
                <p>{formatDate(user.personalInfo?.birthDate)}</p>
              </div>
              <div className="ProfileField">
                <label>CURP</label>
                <p className="ProfileFieldMono">
                  {user.personalInfo?.curp || "—"}
                </p>
              </div>
            </div>
          </section>

          <section className="ProfileCard">
            <div className="ProfileCardHead">
              <h2 className="ProfileCardTitle">Cédulas médicas</h2>
              <span className="ProfileCardNumber">02</span>
            </div>
            {user.medicalLicenses?.length > 0 ? (
              <div className="ProfileLicenseList">
                {user.medicalLicenses.map((lic) => (
                  <article key={lic.id} className="ProfileLicenseItem">
                    <div className="ProfileLicenseId">{lic.id}</div>
                    <div className="ProfileLicenseDetails">
                      <strong>{lic.profession}</strong>
                      <span>{lic.institution}</span>
                    </div>
                    <span className="ProfileLicenseYear">
                      {lic.registrationYear}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="ProfileEmptyState">Sin cédulas registradas</p>
            )}
          </section>

          <div className="ProfileLowerGrid">
            {hasWorkplace && (
              <section className="ProfileCard">
                <div className="ProfileCardHead">
                  <h2 className="ProfileCardTitle">Lugar de trabajo</h2>
                  <span className="ProfileCardNumber">03</span>
                </div>
                <div className="ProfileWorkplace">
                  {user.institute?.Name && (
                    <div className="ProfileWorkRow">
                      <span>Institución</span>
                      <strong>{user.institute.Name}</strong>
                    </div>
                  )}
                  {user.institute?.HospitalOrClinic && (
                    <div className="ProfileWorkRow">
                      <span>Hospital / Clínica</span>
                      <strong>{user.institute.HospitalOrClinic}</strong>
                    </div>
                  )}
                </div>
              </section>
            )}

            {user.UID?.type && (
              <section className="ProfileCard">
                <div className="ProfileCardHead">
                  <h2 className="ProfileCardTitle">
                    Verificación de identidad
                  </h2>
                  <span
                    className="ProfileValidityBadge"
                    data-valid={isVerified ? "true" : "false"}
                  >
                    {isVerified ? "✓ Verificado" : "Pendiente"}
                  </span>
                </div>
                <div className="ProfileVerificationBody">
                  <div className="ProfileVerificationData">
                    <div className="ProfileVerificationRow">
                      <span>Tipo de ID</span>
                      <strong>{user.UID.type || "—"}</strong>
                    </div>
                    <div className="ProfileVerificationRow">
                      <span>Modelo</span>
                      <strong>{user.UID.model || "—"}</strong>
                    </div>
                    <div className="ProfileVerificationRow">
                      <span>Estado</span>
                      <strong>{user.UID.validity || "Pendiente"}</strong>
                    </div>
                  </div>
                  <div className="ProfileIdPhoto">
                    {user.UID.faceImg ? (
                      <img src={user.UID.faceImg} alt="Foto de identificación" />
                    ) : (
                      initials
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      <ModalCC
        size="small"
        identifier="logoutModal"
        animation="popUp"
        useStates={{ state: logoutOpen, setState: setLogoutOpen }}
      >
        <div className="ProfileLogoutModal">
          <h2>¿Cerrar tu sesión?</h2>
          <p>Tendrás que volver a ingresar tus credenciales para acceder.</p>
          <div className="ProfileLogoutModalActions">
            <button
              className="ProfileModalBtn"
              type="button"
              onClick={() => setLogoutOpen(false)}
            >
              Cancelar
            </button>
            <button className="ProfileLogout" type="button" onClick={LogOut}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </ModalCC>
    </section>
  );
};

export default ProfileSection;
