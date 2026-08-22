import { pdf, PDFViewer } from "@react-pdf/renderer";
import React, { useEffect, useMemo, useState } from "react";
import CheckListCC from "./CheckList-CC";
import PrescriptionPDF from "@/library/PDFlayouts/PrescriptionPDF";
import OrderPDF from "@/library/PDFlayouts/OrderPDF";

interface PdfViewerCC {
  orderProps?: OrdersProps;
  prescriptionProps?: PrescriptionProps;
  options?: PDFViewerOptions;
  pdfBlob?: Blob;
  colorSchema?: colorSchemas;
}

interface PDFViewerOptions {
  itemsList: string[];
  dxList: string[];
}

const PdfViewerCC: React.FC<PdfViewerCC> = ({
  options,
  colorSchema,
  prescriptionProps,
  orderProps,
  pdfBlob,
}) => {
  const [pdfOptions, setPdfOptions] = useState<PDFViewerOptions>(
    options ?? { itemsList: [], dxList: [] },
  );
  const [pdfUrl, setPdfUrl] = useState<string>();

  useEffect(() => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pdfBlob]);
  const drugsFiltered = useMemo(():
    | DrugValues[]
    | MedicationProps[]
    | undefined => {
    if (prescriptionProps) {
      if (prescriptionProps.drugs.type === "processed") {
        return prescriptionProps.drugs.values.filter((drug) => {
          return pdfOptions.itemsList.includes(drug.name);
        });
      } else {
        return prescriptionProps.drugs.values.filter((drug) => {
          return pdfOptions.itemsList.includes(`${drug.drugPresentation}`);
        });
      }
    }
  }, [pdfOptions.itemsList]);

  const ordersFiltered = useMemo((): Order[] | undefined => {
    if (orderProps) {
      return orderProps.orders.ordersArray.filter((ord) => {
        return pdfOptions.itemsList.includes(`${ord.request}`);
      });
    }
  }, [pdfOptions.itemsList]);

  const dxsFiltered = useMemo((): Array<PatientDiagnosisProps> | undefined => {
    if ((options?.dxList.length ?? 0) > 0) {
      const PatientData = prescriptionProps
        ? prescriptionProps?.patientData
        : orderProps?.patientData;

      return PatientData?.records?.[0]?.Diagnosis?.filter((dx) =>
        pdfOptions.dxList.includes(dx.Name),
      );
    } else return [];
  }, [pdfOptions.dxList]);

  return (
    <div className="PdfViewerCC">
      {options && (
        <div className="PdfOptions">
          <CheckListCC
            colorSchema={colorSchema}
            title={"Medicamentos"}
            items={options.itemsList}
            allChecked
            onChange={(item) => {
              const itemName = item.split(" ~ ")[0].trim();

              if (item.includes("unchecked")) {
                setPdfOptions((prev) => ({
                  ...prev,
                  itemsList: prev.itemsList.filter((i) => i !== itemName),
                }));
              } else {
                setPdfOptions((prev) => ({
                  ...prev,
                  itemsList: [...prev.itemsList, itemName],
                }));
              }
            }}
          />
          <CheckListCC
            colorSchema={colorSchema}
            title={"Diagnósticos"}
            items={options.dxList}
            allChecked
            onChange={(item) => {
              const itemName = item.split(" ~ ")[0].trim();

              if (item.includes("unchecked")) {
                setPdfOptions((prev) => ({
                  ...prev,
                  dxList: prev.dxList.filter((i) => i !== itemName),
                }));
              } else {
                setPdfOptions((prev) => ({
                  ...prev,
                  dxList: [...prev.dxList, itemName],
                }));
              }
            }}
          />
        </div>
      )}
      <div className="PdfContainer">
        {pdfBlob ? (
          pdfUrl ? (
            <iframe
              className="InsurancePdfFrame"
              src={pdfUrl}
              title="Vista previa del informe médico"
            />
          ) : (
            <div className="InsurancePdfLoading">Preparando vista previa…</div>
          )
        ) : (
          <PDFViewer className="GenericCCPDF">
            <>
              {prescriptionProps && drugsFiltered && dxsFiltered ? (
                <PrescriptionPDF
                  {...prescriptionProps}
                  // @ts-ignore
                  drugs={{ ...prescriptionProps.drugs, values: drugsFiltered }}
                  patientData={{
                    ...prescriptionProps.patientData,
                    records: [
                      {
                        ...prescriptionProps.patientData.records[0],
                        Diagnosis: dxsFiltered,
                      },
                    ],
                  }}
                  qr={""}
                />
              ) : null}
              {orderProps && ordersFiltered && dxsFiltered ? (
                <OrderPDF
                  {...orderProps}
                  orders={{ ...orderProps.orders, ordersArray: ordersFiltered }}
                  patientData={{
                    ...orderProps.patientData,
                    records: [
                      {
                        ...orderProps.patientData.records[0],
                        Diagnosis: dxsFiltered,
                      },
                    ],
                  }}
                  qr={""}
                />
              ) : null}
            </>
          </PDFViewer>
        )}
      </div>
    </div>
  );
};

export default PdfViewerCC;
