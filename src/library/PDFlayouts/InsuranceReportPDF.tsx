import {
  Document,
  Font,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import CronosLogoB64 from "@/assets/base64/CronosLogo";

export interface InsuranceReport {
  identificacion: {
    nombreCompleto: string;
    edad: string;
    sexo: string;
    fechaNacimiento: string;
    curp?: string;
  };
  padecimientoActual: string;
  antecedentesRelevantes: string;
  resumenEvolucion: string;
  diagnosticos: Array<{
    cie: string;
    nombre: string;
    fechaInicio?: string;
  }>;
  tratamientoActual: string;
  pronostico: string;
  medicoTratante: {
    nombre: string;
    cedula?: string;
    especialidad?: string;
  };
}

Font.register({
  family: "Poppins",
  fonts: [{ src: "/Fonts/Poppins-Regular.ttf", fontWeight: "normal" }],
});
Font.register({
  family: "Audiowide",
  fonts: [{ src: "/Fonts/Audiowide-Regular.ttf", fontWeight: "normal" }],
});

const styles = StyleSheet.create({
  page: {
    padding: 32,
    paddingBottom: 48,
    fontFamily: "Poppins",
    fontSize: 10,
    color: "#20222a",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#20222a",
    paddingBottom: 14,
    marginBottom: 18,
  },
  logo: { width: 42, height: 42, marginRight: 12 },
  brand: { fontFamily: "Audiowide", fontSize: 12 },
  doctor: { flexGrow: 1, textAlign: "right" },
  doctorName: { fontSize: 12, marginBottom: 2 },
  doctorDetail: { fontSize: 9, color: "#555b68" },
  title: {
    fontFamily: "Audiowide",
    fontSize: 22,
    marginBottom: 16,
  },
  section: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#606674",
    borderBottomWidth: 0.5,
    borderBottomColor: "#c7cad1",
    paddingBottom: 3,
    marginBottom: 6,
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: "34%", color: "#555b68" },
  value: { width: "66%" },
  paragraph: { lineHeight: 1.45 },
  diagnosis: { marginBottom: 4, lineHeight: 1.4 },
  signature: {
    width: 220,
    alignSelf: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#20222a",
    textAlign: "center",
    marginTop: 42,
    paddingTop: 5,
  },
  confidential: {
    position: "absolute",
    bottom: 8,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 7,
    color: "#787d88",
  },
});

const TextSection = ({ title, value }: { title: string; value: string }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.paragraph}>{value}</Text>
  </View>
);

const InsuranceReportPDF = ({ report }: { report: InsuranceReport }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <PdfImage src={CronosLogoB64} style={styles.logo} />
        <Text style={styles.brand}>CRONOS</Text>
        <View style={styles.doctor}>
          <Text style={styles.doctorName}>{report.medicoTratante.nombre}</Text>
          <Text style={styles.doctorDetail}>
            {report.medicoTratante.especialidad || ""}
          </Text>
          <Text style={styles.doctorDetail}>
            {report.medicoTratante.cedula
              ? `Cédula profesional: ${report.medicoTratante.cedula}`
              : ""}
          </Text>
        </View>
      </View>

      <Text style={styles.title}>Informe Médico</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identificación del paciente</Text>
        {[
          ["Nombre completo", report.identificacion.nombreCompleto],
          ["Edad", report.identificacion.edad],
          ["Sexo", report.identificacion.sexo],
          ["Fecha de nacimiento", report.identificacion.fechaNacimiento],
          ["CURP", report.identificacion.curp || ""],
        ].map(([label, value]) => (
          <View style={styles.row} key={label}>
            <Text style={styles.label}>{label}:</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>

      <TextSection
        title="Padecimiento actual"
        value={report.padecimientoActual}
      />
      <TextSection
        title="Antecedentes relevantes"
        value={report.antecedentesRelevantes}
      />
      <TextSection
        title="Resumen de evolución"
        value={report.resumenEvolucion}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Diagnósticos</Text>
        {report.diagnosticos.map((diagnosis, index) => (
          <Text style={styles.diagnosis} key={`${diagnosis.cie}-${index}`}>
            {`${diagnosis.nombre}${diagnosis.cie ? ` — ${diagnosis.cie}` : ""}${
              diagnosis.fechaInicio ? ` — Inicio: ${diagnosis.fechaInicio}` : ""
            }`}
          </Text>
        ))}
      </View>

      <TextSection
        title="Tratamiento actual"
        value={report.tratamientoActual}
      />
      <TextSection title="Pronóstico" value={report.pronostico} />

      <View style={styles.signature}>
        <Text>Firma del médico tratante</Text>
        <Text>{report.medicoTratante.nombre}</Text>
      </View>

      <Text style={styles.confidential} fixed>
        DOCUMENTO CONFIDENCIAL — Información médica para revisión y trámite de
        aseguradora. Temis®
      </Text>
    </Page>
  </Document>
);

export default InsuranceReportPDF;
