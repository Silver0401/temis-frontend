import React from "react";

interface MiniPatientProps {
  PatientInfo: Patient | undefined;
}

/**
 * Temis: sin modelo 3D (Cronos original usaba ModelCC + HumanModel aquí).
 * Se reemplaza por una tarjeta de texto con nombre + diagnósticos. Ver DECISIONS.md.
 */
const MiniPatient: React.FC<MiniPatientProps> = ({ PatientInfo }) => {
  return (
    <div className="miniPatient">
      <div className="miniDiagnosis">
        <h4>{"Dx"}</h4>
        {PatientInfo?.records?.[0]?.Diagnosis?.map((dx) => {
          return (
            <p key={dx.id}>
              {dx.Name}
            </p>
          );
        })}
      </div>

      <div className="miniPatientModelCont">
        <p className="nameContainer">
          {PatientInfo
            ? `${PatientInfo?.personalInfo.names} ${PatientInfo?.personalInfo.middleName} ${PatientInfo?.personalInfo.lastName}`
            : ""}
        </p>
        <div className="miniPatientModel miniPatientModelText">
          {PatientInfo ? (
            <span className="mono">{`ID: ${PatientInfo._id}`}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MiniPatient;
