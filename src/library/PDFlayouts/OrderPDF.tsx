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
import {
  AgeFromBirthdate,
  CurrentDate,
  MongoDbIdDateRetriever,
} from "@/scripts/Generator";

Font.register({
  family: "Poppins",
  fonts: [{ src: "/Fonts/Poppins-Regular.ttf", fontWeight: "bold" }],
});
Font.register({
  family: "Audiowide",
  fonts: [{ src: "/Fonts/Audiowide-Regular.ttf", fontWeight: "normal" }],
});

// Create styles
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

  patientText: {
    paddingBottom: 10,
    paddingtop: 10,
    fontSize: 11,
  },

  /* ----------- BODY ----------- */
  section: {
    marginBottom: 15,
  },

  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 15,
    fontSize: 30,
    fontFamily: "Audiowide",
  },

  drugItem: {
    marginBottom: 10,
    marginTop: 10,
  },

  /* ----------- FOOTER ----------- */
  footer: {
    marginTop: 40,
    alignItems: "flex-end",
  },
  watermark: {
    position: "absolute",
    marginTop: 40,
    width: "100%",
    height: 450,
    alignItems: "flex-end",
    marginLeft: 80,
  },
  qr: {
    position: "absolute",
    marginTop: 400,
    width: "100%",
    height: 500,
    alignItems: "flex-end",
    marginLeft: 80,
  },
  signatureLine: {
    width: 180,
    borderTopWidth: 1,
    borderTopColor: "#000",
    marginTop: 40,
    textAlign: "center",
    paddingTop: 5,
  },
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

// Create Document Component
const OrderPDF: React.FC<OrdersPropsWithQr> = ({
  orders,
  patientData,
  userData,
  qr,
}) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ----------- Headers ----------- */}
        <View style={styles.header}>
          {/* Izquierda: Logo */}
          <View style={styles.leftColumn}>
            <PdfImage src={CronosLogoB64} style={styles.logo} />
            <Text style={styles.brandText}>CRONOS</Text>
          </View>

          {/* Centro: Datos del doctor */}
          <View style={styles.middleColumn}>
            <Text
              style={[styles.doctorName, styles.poppins]}
            >{`Dr. ${userData?.name}`}</Text>
            <Text
              style={[styles.doctorInfo, styles.poppins]}
            >{`${userData?.email}`}</Text>
            {userData?.medicalLicenses && (
              <Text style={[styles.doctorInfo, styles.poppins]}>
                Cédula: {`${userData?.medicalLicenses[0].id}`}
              </Text>
            )}
            {userData.institute && (
              <Text style={[styles.doctorInfo, styles.poppins]}>
                {`${userData.institute.Name}`}
              </Text>
            )}
          </View>

          {/* Derecha: Datos generales */}
          <View style={styles.rightColumn}>
            <Text style={[styles.dateText, styles.poppins]}>
              Fecha:{" "}
              {patientData.LUID === "synthesized-temporal-patient"
                ? CurrentDate()
                : `${MongoDbIdDateRetriever(orders._id)}`}
            </Text>
          </View>
        </View>

        {/* ----------- Pacient Data ----------- */}
        <View style={styles.section}>
          <Text style={[styles.patientText, styles.poppins]}>
            {`Paciente: ${patientData.personalInfo.names} ${patientData.personalInfo.middleName} ${patientData.personalInfo.lastName}`}
          </Text>
          <Text style={[styles.patientText, styles.poppins]}>
            {`Edad: ${AgeFromBirthdate(
              patientData.personalInfo.birthDate,
            )} Años`}
          </Text>
        </View>

        {/* ----------- Meds Mapped ----------- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sx</Text>
          {orders.ordersArray.map((order, index) => {
            return (
              <View key={index}>
                <Text
                  style={[styles.drugItem, styles.poppins]}
                >{`• ${order.request}`}</Text>
                <Text style={[styles.drugItem, styles.poppins]}>
                  {`Indicaciones: ${order.observations}`}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ----------- Firma Médico ----------- */}
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

export default OrderPDF;
