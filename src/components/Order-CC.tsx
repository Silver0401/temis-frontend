import { MongoDbIdDateRetriever } from "@/scripts/Generator";
import React, { useEffect, useMemo, useState } from "react";
import ButtonCC from "./Button-CC";
import { useGlobalContext } from "@/e2e/globalContext";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import QRCode from "qrcode";
import OrderPDF from "@/library/PDFlayouts/OrderPDF";
import { toast } from "sonner";

const OrderCC: React.FC<OrdersProps> = (props) => {
  const { orders } = props;
  const { setGlobalModal } = useGlobalContext();
  const [qrCode, setQrCode] = useState<string>("");
  const datePrescribed = useMemo(() => {
    return MongoDbIdDateRetriever(orders._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const printPDF = async () => {
    const blob = await pdf(<OrderPDF {...props} qr={qrCode} />).toBlob();
    const url = URL.createObjectURL(blob);

    const newWindow = window.open(url);
    if (newWindow) {
      newWindow.onload = () => {
        newWindow.print();
      };
    }
  };

  const viewPDF = () => {
    setGlobalModal({
      Settings: {
        identifier: "PrescriptionPDF",
        size: "extra large",
        animation: "popUp",
      },
      Component: (
        <PDFViewer className="GenericPDFViewerContainer">
          <OrderPDF {...props} qr={qrCode} />
        </PDFViewer>
      ),
    });
  };

  const sharePDF = () => {
    navigator.clipboard.writeText(
      `${process.env.NEXT_PUBLIC_NOT_FRONTEND_URL}/shared/Orders/${orders._id}`,
    );
    toast.success("Link a la solicitud copiada al Portapapeles");
  };

  useEffect(() => {
    let isMounted = true;

    async function generateQRCode(value: string) {
      return await QRCode.toDataURL(value, {
        margin: 1,
        width: 200,
      });
    }

    async function loadQR() {
      const dataUrl = await generateQRCode("https://cronos.clinica");
      if (isMounted) {
        setQrCode(dataUrl);
      }
    }

    loadQR();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="OrderCC">
      <h1 className="title">{"Sx"}</h1>
      <p className="date">{datePrescribed}</p>
      <div className="orderContainer">
        {orders.ordersArray
          ? orders.ordersArray.map((order) => {
              return (
                <div
                  className="orderLine"
                  key={`${order.observations} ${order.request}`}
                >
                  <p>{order.request}</p>
                </div>
              );
            })
          : null}
      </div>
      <div className="buttonContainer">
        {/* {orders.recordId && (
          <ButtonCC
            icon={
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
            }
            type={"Slim"}
            style={"White"}
          />
        )} */}
        {/* <ButtonCC
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z"
                clipRule="evenodd"
              />
            </svg>
          }
          type={"Slim"}
          style={"White"}
          onClick={sharePDF}
        /> */}
        <ButtonCC
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.99c-.426.053-.851.11-1.274.174-1.454.218-2.476 1.483-2.476 2.917v6.294a3 3 0 0 0 3 3h.27l-.155 1.705A1.875 1.875 0 0 0 7.232 22.5h9.536a1.875 1.875 0 0 0 1.867-2.045l-.155-1.705h.27a3 3 0 0 0 3-3V9.456c0-1.434-1.022-2.7-2.476-2.917A48.716 48.716 0 0 0 18 6.366V3.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM16.5 6.205v-2.83A.375.375 0 0 0 16.125 3h-8.25a.375.375 0 0 0-.375.375v2.83a49.353 49.353 0 0 1 9 0Zm-.217 8.265c.178.018.317.16.333.337l.526 5.784a.375.375 0 0 1-.374.409H7.232a.375.375 0 0 1-.374-.409l.526-5.784a.373.373 0 0 1 .333-.337 41.741 41.741 0 0 1 8.566 0Zm.967-3.97a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H18a.75.75 0 0 1-.75-.75V10.5ZM15 9.75a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V10.5a.75.75 0 0 0-.75-.75H15Z"
                clipRule="evenodd"
              />
            </svg>
          }
          type="Phantom"
          onClick={printPDF}
        />
        <ButtonCC
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path
                fillRule="evenodd"
                d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                clipRule="evenodd"
              />
            </svg>
          }
          type="Phantom"
          onClick={viewPDF}
        />
      </div>
    </div>
  );
};

export default OrderCC;
