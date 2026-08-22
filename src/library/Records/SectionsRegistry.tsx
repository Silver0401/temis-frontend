// Components
import HistoryVersions from "@/library/Records/Sections/HistoryVersions";
import GabinetImgs from "@/library/Records/Sections/GabinetImgs";
import Laboratories from "@/library/Records/Sections/Laboratories";
import DrugsAndSupplements from "@/library/Records/Sections/DrugsAndSupplements";
import Somatometrias from "@/library/Records/Sections/Somatometrias";
import RequestStudies from "@/library/Records/Sections/RequestStudies";
import NutritionalIntervention from "@/library/Records/Sections/NutritionalIntervention";
import PrescriptionCC from "@/components/Prescription-CC";
import IconsCC from "@/assets/icons/IconsCC";
import Consents from "@/library/Records/Sections/Consents";

export const ClinicalHistorySections: CHSectionsIdexed &
  Record<"Consents", CHSectionProps> = {
  CCH: {
    CHAbbreviation: "HCC",
    CHSubtitle: "Historia Clinica Completa",
    DocTitle: "Nota de Evolución",
    DocSubtitle: "Crea una nueva nota de evolución",
    Icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path
          fillRule="evenodd"
          d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0 0 16.5 9h-1.875a1.875 1.875 0 0 1-1.875-1.875V5.25A3.75 3.75 0 0 0 9 1.5H5.625ZM7.5 15a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 0 1.5h-7.5A.75.75 0 0 1 7.5 15Zm.75 2.25a.75.75 0 0 0 0 1.5H12a.75.75 0 0 0 0-1.5H8.25Z"
          clipRule="evenodd"
        />
        <path d="M12.971 1.816A5.23 5.23 0 0 1 14.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 0 1 3.434 1.279 9.768 9.768 0 0 0-6.963-6.963Z" />
      </svg>
    ),
    Component: HistoryVersions,
    acceptedFormats: {
      text: { description: "Texto escrito de manera manual" },
    },
    SectionType: ["AddDocument", "ClinicalHistory"],
  },
  Imgs: {
    CHAbbreviation: "Imgs",
    CHSubtitle: "Estudios de Gabinete e Imágenes",
    DocTitle: "Resultados de Imágen",
    DocSubtitle: "Guarda imágenes, junto con sus reportes",
    Icon: IconsCC.CameraPlus,
    Component: GabinetImgs,
    acceptedFormats: {
      image: {
        description:
          "Foto o imagen del estudio; Puedes apuntar observaciones o reportes del estudio de imagen.",
      },
    },
    SectionType: ["AddDocument", "ClinicalHistory"],
  },
  Labs: {
    CHAbbreviation: "Labs",
    CHSubtitle: "Estudios de Laboratorios",
    DocTitle: "Resultados de Labs",
    DocSubtitle: "Guarda Resultados de Laboratorio",
    Icon: IconsCC.LabTubes,
    Component: Laboratories,
    acceptedFormats: {
      text: {
        description: "Escribe manualmente los resultados de laboratorio",
      },
    },
    SectionType: ["AddDocument", "ClinicalHistory"],
  },
  Somas: {
    CHAbbreviation: "Somas",
    CHSubtitle: "Somatometrías y Signos Vitales",
    DocTitle: "Somatometrías",
    DocSubtitle: "Guarda Signos Vitales y Somatométricos",
    Icon: IconsCC.VitalSigns,
    Component: Somatometrias,
    acceptedFormats: {
      text: {
        description: "Escribe manualmente los resultados de laboratorio",
      },
    },
    SectionType: ["AddDocument", "ClinicalHistory"],
  },
  Request: {
    CHAbbreviation: "Ords",
    CHSubtitle: "Solicitudes de Estudio",
    DocTitle: "Solicitud de Estudios",
    DocSubtitle: "Crea una nueva solicitud para labs o imágenes",
    Icon: IconsCC.Request,
    Component: RequestStudies,
    acceptedFormats: {
      text: {
        description: "Escribe manualmente los medicamentos de la receta",
      },
    },
    SectionType: ["AddDocument", "ClinicalHistory"],
  },
  Drugs: {
    CHAbbreviation: "Drugs",
    CHSubtitle: "Fármacos y Suplementos",
    DocTitle: "Prescripción",
    DocSubtitle: "Crea una receta para tu paciente",
    Icon: IconsCC.DrugPills,
    Component: DrugsAndSupplements,
    acceptedFormats: {
      text: {
        description: "Escribe manualmente los medicamentos de la receta",
      },
    },
    SectionType: ["AddDocument", "ClinicalHistory"],
  },
  TMN: {
    CHAbbreviation: "TMN",
    CHSubtitle: "Tratamiento Médico Nutricional",
    DocTitle: "-",
    DocSubtitle: "-",
    Icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
      </svg>
    ),
    Component: NutritionalIntervention,
    acceptedFormats: {
      text: {
        description: "Escribe manualmente los medicamentos de la receta",
      },
    },
    SectionType: [],
  },
  Consents: {
    CHAbbreviation: "CI",
    CHSubtitle: "Consentimientos informados",
    DocTitle: "Consentimiento informado",
    DocSubtitle: "Consulta las firmas y evidencias del paciente",
    Icon: IconsCC.Check,
    Component: Consents,
    acceptedFormats: {},
    SectionType: ["ClinicalHistory"],
  },
};
