import FooterSection from "@/library/Nav/FooterSection";
import RevealObserver from "@/library/Nav/RevealObserver";

export const metadata = {
  title: "Aviso de Privacidad · Temis",
  description:
    "Aviso de privacidad y tratamiento de datos personales de Temis.",
};

const PRIVACY_NOTICE = `AVISO DE PRIVACIDAD INTEGRAL

[NOMBRE DEL RESPONSABLE O CONSULTORIO], con domicilio en [DOMICILIO COMPLETO], es responsable del tratamiento y protección de sus datos personales conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y demás disposiciones aplicables. Para cualquier asunto relacionado con privacidad puede comunicarse al correo [CORREO DE PRIVACIDAD] o al teléfono [TELÉFONO].

DATOS PERSONALES QUE SE RECABAN

Para identificarle, contactarle y prestarle servicios de atención médica podremos recabar datos de identificación y contacto; información demográfica; datos de familiares, tutores o contactos de emergencia; antecedentes personales y heredofamiliares; signos vitales; diagnósticos; tratamientos; prescripciones; resultados de laboratorio y gabinete; imágenes clínicas; notas médicas; información sobre discapacidad, embarazo, salud sexual y reproductiva, salud mental, consumo de sustancias y cualquier otro dato necesario para integrar y conservar su expediente clínico. También podremos tratar datos administrativos, fiscales, de aseguramiento y pago cuando resulten necesarios.

Los datos relativos a su estado de salud, características biométricas y demás información íntima son datos personales sensibles. Serán tratados bajo medidas administrativas, técnicas y físicas orientadas a preservar su confidencialidad, integridad, disponibilidad y acceso restringido.

FINALIDADES PRIMARIAS

Sus datos serán utilizados para: verificar su identidad; abrir, integrar, actualizar, conservar y consultar su expediente clínico; valorar su estado de salud; emitir diagnósticos y planes de manejo; prestar atención presencial o a distancia; solicitar y analizar estudios; emitir recetas, constancias, referencias e interconsultas; dar seguimiento clínico; contactar a la persona que usted designe ante una urgencia; coordinar la atención con otros profesionales o establecimientos cuando sea necesario; atender obligaciones sanitarias, de expediente clínico, facturación, auditoría, seguridad y conservación; y ejercer o defender derechos derivados de la relación médico-paciente.

Estas finalidades son necesarias para la prestación segura del servicio médico. Si usted no proporciona la información clínica indispensable, el responsable podrá encontrarse imposibilitado para valorar adecuadamente su caso o prestar determinados servicios.

FINALIDADES SECUNDARIAS

Con su autorización separada, sus datos de contacto podrán emplearse para recordatorios preventivos, encuestas de calidad, información sobre nuevos servicios o comunicaciones educativas. Usted puede oponerse a estas finalidades en cualquier momento mediante los datos de contacto señalados, sin que ello afecte la atención médica necesaria.

TRANSFERENCIAS Y ENCARGADOS

La información podrá comunicarse, en la medida necesaria y con deber de confidencialidad, a profesionales de la salud que participen en su atención; laboratorios, gabinetes, hospitales, farmacias, servicios de urgencias, aseguradoras o administradores de beneficios que usted indique; proveedores tecnológicos que actúen por cuenta del responsable; autoridades competentes cuando exista mandato fundado; y terceros cuando la transferencia esté prevista o permitida por la legislación aplicable. Cuando una transferencia requiera consentimiento, se solicitará antes de realizarla.

No se venderán sus datos personales ni se utilizarán para finalidades incompatibles con la relación clínica. Los proveedores que almacenen o procesen información deberán sujetarse a instrucciones, confidencialidad y medidas de seguridad acordes con el riesgo.

DERECHOS ARCO, REVOCACIÓN Y LIMITACIÓN

Usted o su representante legal puede solicitar acceso a sus datos; rectificación cuando sean inexactos o incompletos; cancelación cuando proceda; u oposición a un tratamiento específico. También puede revocar el consentimiento o limitar el uso y divulgación de sus datos. La solicitud deberá enviarse a [CORREO DE PRIVACIDAD] e incluir nombre del titular, medio para recibir respuesta, documentos que acrediten identidad o representación, descripción clara de la petición y, en su caso, documentos que faciliten la localización o corrección de la información.

La revocación y cancelación no tienen efectos retroactivos y pueden resultar improcedentes respecto de información que deba conservarse por obligaciones sanitarias, contractuales, de responsabilidad profesional o defensa jurídica. La respuesta se emitirá dentro de los plazos previstos por la legislación aplicable.

CONSERVACIÓN, SEGURIDAD E INCIDENTES

El expediente y los datos asociados se conservarán durante los plazos legales y por el tiempo razonablemente necesario para la continuidad asistencial y la atención de responsabilidades. El responsable aplicará controles de acceso, registros de actividad, respaldos y medidas de protección proporcionales al riesgo. Ningún sistema elimina por completo la posibilidad de un incidente; si ocurre uno que afecte significativamente sus derechos, se realizarán las notificaciones y acciones exigidas por la ley.

MEDIOS DIGITALES Y ATENCIÓN A DISTANCIA

Cuando se utilicen portales, correo, mensajería o videocomunicación, se procurarán canales autorizados y medidas razonables de seguridad. Usted debe proteger sus dispositivos, contraseñas y enlaces de acceso, evitar compartirlos y avisar de inmediato si sospecha un uso no autorizado.

CAMBIOS AL AVISO

Este aviso puede modificarse por cambios legales, operativos o de los servicios. La versión vigente estará disponible en [SITIO WEB O DOMICILIO DEL CONSULTORIO], indicando la fecha de actualización. Los cambios que requieran un nuevo consentimiento serán informados por un medio apropiado.

CONSENTIMIENTO

Declaro que tuve acceso a este aviso, pude formular preguntas y conozco las finalidades y medios para ejercer mis derechos. Cuando la legislación lo requiera, autorizo expresamente el tratamiento de mis datos personales sensibles para las finalidades médicas descritas.`;

export default function PrivacidadPage() {
  return (
    <>
      <RevealObserver />
      <main className="lp-institutional lp-legal">
        <div className="lp-wrap">
          <div className="lp-inst-hero lp-rv">
            <p className="lp-section-tag">Legal</p>
            <h1 className="lp-inst-title">Aviso de Privacidad</h1>
            <p className="lp-inst-sub">
              Versión 1.0.0 · Última actualización: julio 2026
            </p>
          </div>

          <div className="lp-legal-body lp-rv lp-rv-d1">
            {PRIVACY_NOTICE.split("\n\n").map((paragraph, index) =>
              paragraph === paragraph.toUpperCase() ? (
                <h2 key={`${index}-${paragraph}`}>{paragraph}</h2>
              ) : (
                <p
                  className="lp-inst-body"
                  key={`${index}-${paragraph.slice(0, 24)}`}
                >
                  {paragraph}
                </p>
              ),
            )}
          </div>
        </div>
      </main>
      <FooterSection />
    </>
  );
}
