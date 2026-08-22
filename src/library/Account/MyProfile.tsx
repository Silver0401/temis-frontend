import React from "react";
import ButtonCC from "@/components/Button-CC";
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
  const isVerified = user.UID?.validity === "valid";

  return (
    <section className="ProfileSection">
      <div className="ProfileLeftPanel">
        <div className="ProfileAvatar">
          {isVerified && user.UID?.faceImg ? (
            <img src={user.UID.faceImg} alt="Foto de perfil" />
          ) : (
            <span>{getInitials(user.name)}</span>
          )}
        </div>

        <h2 className="ProfileName">{user.name}</h2>
        <p className="ProfileUniqueIdentifier">{`ID: ${user._id}`}</p>

        {user.professionType && (
          <span className="ProfileProfessionBadge">{user.professionType}</span>
        )}

        {user.clues && (
          <p className="ProfileClues">
            <strong>CLUES:</strong> {user.clues}
          </p>
        )}

        {(user.institute?.Name || user.institute?.HospitalOrClinic) && (
          <p className="ProfileInstitute">
            {user.institute.Name}
            {user.institute.HospitalOrClinic && (
              <span>{user.institute.HospitalOrClinic}</span>
            )}
          </p>
        )}

        <div className="ProfileDivider" />

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

        <div className="ProfileLogoutContainer">
          <ButtonCC
            type="Phantom" size="lg"
            text="Cerrar mi Sesión"
            onClick={LogOut}
          />
        </div>
      </div>

      <div className="ProfileRightPanel">
        <div className="ProfileCard">
          <h3 className="ProfileCardTitle">Información Personal</h3>
          <div className="ProfileCardGrid">
            <div className="ProfileField">
              <label>Correo</label>
              <p>{user.email || "—"}</p>
            </div>
            <div className="ProfileField">
              <label>Sexo</label>
              <p>{user.personalInfo?.sex || "—"}</p>
            </div>
            <div className="ProfileField">
              <label>Fecha de Nacimiento</label>
              <p>{formatDate(user.personalInfo?.birthDate)}</p>
            </div>
            <div className="ProfileField">
              <label>CURP</label>
              <p className="ProfileFieldMono">
                {user.personalInfo?.curp || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="ProfileCard">
          <h3 className="ProfileCardTitle">Cédulas Médicas</h3>
          {user.medicalLicenses?.length > 0 ? (
            <div className="ProfileLicenseList">
              {user.medicalLicenses.map((lic) => (
                <div key={lic.id} className="ProfileLicenseItem">
                  <div className="ProfileLicenseId">{lic.id}</div>
                  <div className="ProfileLicenseDetails">
                    <span>{lic.profession}</span>
                    <span>{lic.institution}</span>
                  </div>
                  <div className="ProfileLicenseYear">
                    {lic.registrationYear}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="ProfileEmptyState">Sin cédulas registradas</p>
          )}
        </div>

        {(user.institute?.Name || user.institute?.HospitalOrClinic) && (
          <div className="ProfileCard">
            <h3 className="ProfileCardTitle">Lugar de Trabajo</h3>
            <div className="ProfileCardGrid">
              {user.institute?.Name && (
                <div className="ProfileField">
                  <label>Institución</label>
                  <p>{user.institute.Name}</p>
                </div>
              )}
              {user.institute?.HospitalOrClinic && (
                <div className="ProfileField">
                  <label>Hospital / Clínica</label>
                  <p>{user.institute.HospitalOrClinic}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {user.UID?.type && (
          <div className="ProfileCard">
            <h3 className="ProfileCardTitle">Verificación de Identidad</h3>
            <div className="ProfileIdVerification">
              <div className="ProfileIdInfo">
                <div className="ProfileCardGrid">
                  <div className="ProfileField">
                    <label>Tipo de ID</label>
                    <p>{user.UID.type || "—"}</p>
                  </div>
                  <div className="ProfileField">
                    <label>Modelo</label>
                    <p>{user.UID.model || "—"}</p>
                  </div>
                  <div className="ProfileField">
                    <label>Estado</label>
                    <span
                      className="ProfileValidityBadge"
                      data-valid={isVerified ? "true" : "false"}
                    >
                      {isVerified
                        ? "Verificado"
                        : user.UID.validity || "Pendiente"}
                    </span>
                  </div>
                </div>
              </div>
              {user.UID.faceImg && (
                <div className="ProfileIdPhoto">
                  <img src={user.UID.faceImg} alt="Foto de identificación" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProfileSection;
