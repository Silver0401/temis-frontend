import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image as PdfImage,
  Font,
} from "@react-pdf/renderer";
import CronosLogoB64 from "@/assets/base64/CronosLogo";
import { formatAfiliaciones } from "@/scripts/afiliaciones";
import { AgeFromBirthdate, MongoDbIdDateRetriever } from "@/scripts/Generator";

Font.register({
  family: "Poppins",
  fonts: [{ src: "/Fonts/Poppins-Regular.ttf", fontWeight: "bold" }],
});
Font.register({
  family: "Audiowide",
  fonts: [{ src: "/Fonts/Audiowide-Regular.ttf", fontWeight: "normal" }],
});

const entryTypeLabels: { [key: string]: string } = {
  ClinicalHistoryInit: "Historia Clínica Inicial",
  EvolutionNote: "Nota de Evolución",
  AdmissionNote: "Nota de Ingreso",
  DischargNote: "Nota de Egreso",
  PreoperativeNote: "Nota Preoperatoria",
  PostoperativeNote: "Nota Postoperatoria",
  EmergencyNote: "Nota de Urgencias",
};

const sexLabel: { [key: string]: string } = {
  Masc: "Masculino",
  Fem: "Femenino",
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 45,
    fontSize: 11,
    fontFamily: "Helvetica",
  },

  /* ----------- HEADER ----------- */
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 20,
    marginBottom: 15,
  },
  poppins: {
    fontFamily: "Poppins",
  },
  leftColumn: {
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  brandText: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Audiowide",
  },
  middleColumn: {
    width: "50%",
    paddingLeft: 10,
    justifyContent: "center",
  },
  rightColumn: {
    width: "30%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  doctorName: {
    fontSize: 12,
    fontWeight: "bold",
  },
  doctorInfo: {
    marginTop: 2,
  },
  dateText: {
    fontSize: 10,
  },

  /* ----------- DOCUMENT TITLE ----------- */
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 12,
    marginTop: 8,
    fontSize: 24,
    fontFamily: "Audiowide",
  },

  /* ----------- SECTIONS ----------- */
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 8,
    color: "#555",
    marginBottom: 6,
    textTransform: "uppercase",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingBottom: 3,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: "35%",
    fontSize: 10,
    color: "#444",
  },
  infoValue: {
    width: "65%",
    fontSize: 10,
  },
  textBody: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  dxItem: {
    marginBottom: 5,
  },
  dxRisk: {
    fontSize: 9,
    color: "#555",
    marginLeft: 12,
    marginBottom: 2,
  },

  /* ----------- FOOTER ----------- */
  footer: {
    marginTop: 30,
    alignItems: "flex-end",
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 30,
    textAlign: "center",
    paddingTop: 5,
  },

  /* ----------- WATERMARK ----------- */
  watermark: {
    position: "absolute",
    marginTop: 40,
    width: "100%",
    height: 450,
    alignItems: "flex-end",
    marginLeft: 80,
  },

  /* ----------- CONFIDENTIALITY LABEL ----------- */
  confidential: {
    position: "absolute",
    bottom: 5,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 7,
    color: "#888",
  },
});

const ClinicalNotePDF: React.FC<ClinicalNoteProps> = ({
  record,
  patientData,
  userData,
}) => {
  const entryLabel = entryTypeLabels[record.Entry.type] ?? record.Entry.type;
  const isClinicalHistory =
    record.Entry.type === "ClinicalHistoryInit";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ----------- Header ----------- */}
        <View style={styles.header}>
          <View style={styles.leftColumn}>
            <PdfImage src={CronosLogoB64} style={styles.logo} />
            <Text style={styles.brandText}>CRONOS</Text>
          </View>

          <View style={styles.middleColumn}>
            <Text
              style={[styles.doctorName, styles.poppins]}
            >{`Dr. ${userData?.name}`}</Text>
            <Text
              style={[styles.doctorInfo, styles.poppins]}
            >{`${userData?.email}`}</Text>
            {userData?.medicalLicenses && (
              <Text style={[styles.doctorInfo, styles.poppins]}>
                {`Cédula Profesional: ${userData.medicalLicenses[0].id}`}
              </Text>
            )}
            {userData.institute && (
              <Text style={[styles.doctorInfo, styles.poppins]}>
                {`${userData.institute.Name}`}
              </Text>
            )}
          </View>

          <View style={styles.rightColumn}>
            <Text style={[styles.dateText, styles.poppins]}>
              {`Fecha: ${MongoDbIdDateRetriever(record._id)}`}
            </Text>
            <Text style={[styles.dateText, styles.poppins, { marginTop: 4 }]}>
              {`Área: ${record.ServiceArea}`}
            </Text>
          </View>
        </View>

        {/* ----------- Document Title ----------- */}
        <Text style={styles.sectionTitle}>{entryLabel}</Text>

        {/* ----------- Patient Identification ----------- */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeader, styles.poppins]}>
            Datos de Identificación del Paciente
          </Text>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.poppins]}>
              Nombre completo:
            </Text>
            <Text style={[styles.infoValue, styles.poppins]}>
              {`${patientData.personalInfo.names} ${patientData.personalInfo.middleName} ${patientData.personalInfo.lastName}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.poppins]}>CURP:</Text>
            <Text style={[styles.infoValue, styles.poppins]}>
              {patientData.personalInfo.curp}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.poppins]}>
              Fecha de nacimiento:
            </Text>
            <Text style={[styles.infoValue, styles.poppins]}>
              {patientData.personalInfo.birthDate}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.poppins]}>Edad:</Text>
            <Text style={[styles.infoValue, styles.poppins]}>
              {`${AgeFromBirthdate(patientData.personalInfo.birthDate)} años`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.poppins]}>Sexo:</Text>
            <Text style={[styles.infoValue, styles.poppins]}>
              {sexLabel[patientData.personalInfo.sex] ??
                patientData.personalInfo.sex}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, styles.poppins]}>
              Derechohabiencia:
            </Text>
            <Text style={[styles.infoValue, styles.poppins]}>
              {formatAfiliaciones(patientData.personalInfo.derechohabiencia)}
            </Text>
          </View>

          {patientData.personalInfo.birthPlace && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, styles.poppins]}>
                Lugar de nacimiento:
              </Text>
              <Text style={[styles.infoValue, styles.poppins]}>
                {patientData.personalInfo.birthPlace}
              </Text>
            </View>
          )}

          {patientData.personalInfo.domicile && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, styles.poppins]}>Domicilio:</Text>
              <Text style={[styles.infoValue, styles.poppins]}>
                {patientData.personalInfo.domicile}
              </Text>
            </View>
          )}
        </View>

        {/* ----------- Diagnoses ----------- */}
        {record.Diagnosis && record.Diagnosis.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, styles.poppins]}>
              Diagnósticos
            </Text>
            {record.Diagnosis.map((dx, index) => (
              <View key={index} style={styles.dxItem}>
                <Text style={[styles.textBody, styles.poppins]}>
                  {`• ${dx.Name}${dx.CIE ? ` [${dx.CIE}]` : ""}`}
                </Text>
                <Text style={[styles.dxRisk, styles.poppins]}>
                  {dx.Confirmed ? "Confirmado" : "Presuntivo"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ----------- Clinical History (Historia Clínica) ----------- */}
        {isClinicalHistory && record.ClinicalHistory && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, styles.poppins]}>
              Historia Clínica
            </Text>
            <Text style={[styles.textBody, styles.poppins]}>
              {record.ClinicalHistory}
            </Text>
          </View>
        )}

        {/* ----------- Entry Text ----------- */}
        {record.Entry.text && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, styles.poppins]}>
              {isClinicalHistory ? "Resumen / Notas" : entryLabel}
            </Text>
            <Text style={[styles.textBody, styles.poppins]}>
              {record.Entry.text}
            </Text>
          </View>
        )}

        {/* ----------- Doctor Signature ----------- */}
        <View style={styles.footer}>
          <View style={styles.signatureLine}>
            <Text style={styles.poppins}>Firma del médico</Text>
          </View>
        </View>

        {/* ----------- Watermark Logo ----------- */}
        <View style={styles.watermark}>
          <PdfImage
            src={CronosLogoB64}
            style={{ width: 450, height: 450, opacity: 0.1 }}
          />
        </View>

        {/* ----------- Confidentiality Label ----------- */}
        <Text style={[styles.confidential, styles.poppins]} fixed>
          DOCUMENTO CONFIDENCIAL — Informacion medica protegida por la
          NOM-024-SSA3-2010. Uso exclusivo del personal clinico autorizado.
          Prohibida su reproduccion o divulgacion no autorizada. Temis(R)
        </Text>
      </Page>
    </Document>
  );
};

export default ClinicalNotePDF;
