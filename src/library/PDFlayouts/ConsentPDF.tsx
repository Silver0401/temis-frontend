import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import CronosLogoB64 from "@/assets/base64/CronosLogo";

export interface ConsentRecord {
  _id?: string;
  token: string;
  templateId: string;
  title: string;
  body: string;
  docVersion: string;
  docHash: string;
  doctorName: string;
  patientId?: string;
  patientName?: string;
  status: "pending" | "signed";
  createdAt: number;
  expiresAt: number;
  signatureMode?: "canvas" | "acceptance";
  signatureImage?: string;
  signerName?: string;
  signedAt?: number;
  signerIp?: string;
  userAgent?: string;
}

interface ConsentPDFProps {
  consent: ConsentRecord;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingHorizontal: 40,
    paddingBottom: 54,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#161616",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#bbbbbb",
    paddingBottom: 14,
    marginBottom: 20,
  },
  logo: { width: 38, height: 38, marginRight: 12 },
  brand: { fontSize: 14, fontWeight: "bold", letterSpacing: 1.2 },
  title: {
    fontSize: 19,
    lineHeight: 1.25,
    fontWeight: "bold",
    marginBottom: 14,
  },
  metadata: {
    padding: 10,
    backgroundColor: "#f1f5f8",
    marginBottom: 18,
  },
  metadataRow: { flexDirection: "row", marginBottom: 4 },
  metadataLabel: { width: 92, color: "#555555" },
  metadataValue: { flex: 1 },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.55,
    marginBottom: 10,
    textAlign: "justify",
  },
  heading: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#174f70",
    marginTop: 8,
    marginBottom: 6,
  },
  evidence: {
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#888888",
  },
  evidenceTitle: { fontSize: 13, fontWeight: "bold", marginBottom: 10 },
  signature: {
    width: 220,
    height: 90,
    objectFit: "contain",
    marginVertical: 10,
  },
  acceptance: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: "#f1f5f8",
    lineHeight: 1.45,
  },
  hash: { marginTop: 12, fontFamily: "Courier", fontSize: 7, color: "#555555" },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#777777",
    fontSize: 7,
  },
});

const formatDate = (timestamp?: number) =>
  timestamp
    ? new Intl.DateTimeFormat("es-MX", {
        dateStyle: "long",
        timeStyle: "medium",
      }).format(new Date(timestamp))
    : "Sin fecha";

const ConsentPDF: React.FC<ConsentPDFProps> = ({ consent }) => (
  <Document title={consent.title} author="Temis">
    <Page size="A4" style={styles.page}>
      <View style={styles.header} fixed>
        <PdfImage src={CronosLogoB64} style={styles.logo} />
        <Text style={styles.brand}>CRONOS MD</Text>
      </View>

      <Text style={styles.title}>{consent.title}</Text>
      <View style={styles.metadata}>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Profesional:</Text>
          <Text style={styles.metadataValue}>{consent.doctorName}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Paciente:</Text>
          <Text style={styles.metadataValue}>
            {consent.patientName || "No especificado"}
          </Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Versión:</Text>
          <Text style={styles.metadataValue}>{consent.docVersion}</Text>
        </View>
      </View>

      {consent.body.split("\n\n").map((paragraph, index) => (
        <Text
          key={`${index}-${paragraph.slice(0, 18)}`}
          style={
            paragraph === paragraph.toUpperCase()
              ? styles.heading
              : styles.paragraph
          }
        >
          {paragraph}
        </Text>
      ))}

      <View style={styles.evidence} wrap={false}>
        <Text style={styles.evidenceTitle}>Evidencia de aceptación</Text>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Firmante:</Text>
          <Text style={styles.metadataValue}>
            {consent.signerName || "No registrado"}
          </Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Fecha y hora:</Text>
          <Text style={styles.metadataValue}>
            {formatDate(consent.signedAt)}
          </Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Modalidad:</Text>
          <Text style={styles.metadataValue}>
            {consent.signatureMode === "canvas"
              ? "Firma manuscrita digitalizada"
              : "Aceptación expresa"}
          </Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Dirección IP:</Text>
          <Text style={styles.metadataValue}>
            {consent.signerIp || "No disponible"}
          </Text>
        </View>

        {consent.signatureImage ? (
          <PdfImage src={consent.signatureImage} style={styles.signature} />
        ) : (
          <Text style={styles.acceptance}>
            La persona identificada por el nombre anterior manifestó su
            aceptación expresa del documento mediante el enlace individual de un
            solo uso.
          </Text>
        )}
        <Text style={styles.hash}>{`SHA-256: ${consent.docHash}`}</Text>
      </View>

      <Text style={styles.footer} fixed>
        Documento clínico confidencial · La integridad del texto se identifica
        mediante su hash SHA-256.
      </Text>
    </Page>
  </Document>
);

export default ConsentPDF;
