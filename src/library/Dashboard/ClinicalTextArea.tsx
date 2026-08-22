import React, { useEffect, useRef, useState } from "react";
import ButtonCC from "@/components/Button-CC";
import InputCC from "@/components/Input-CC";
import { UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import LoaderCC from "@/components/Loader-CC";

interface ClinicalTextAreaProps {
  identifier: string;
  loading?: boolean;
  /** Indica que hay un guardado en curso disparado desde el formulario padre. */
  saving?: boolean;
  mutation?: UseMutationResult<
    GenericFeathersApiResponse<unknown>,
    Error,
    string,
    unknown
  >;
  onChange?: (text: string) => void;
  highlights?: string[];
  disableSessionSave?: boolean;
  currentValue?: string;
  uneditable?: boolean;
  submitButton?: {
    text?: string;
    icon?: React.ReactElement;
  };
  /** Contenido que va entre el área de texto y el botón de guardar. */
  belowText?: React.ReactNode;
}

const ClinicalTextArea: React.FC<ClinicalTextAreaProps> = ({
  mutation,
  onChange,
  identifier,
  highlights,
  uneditable,
  loading,
  saving,
  currentValue,
  submitButton,
  belowText,
  disableSessionSave,
}) => {
  const prevValue = useRef<string>(currentValue ? currentValue : "");
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const highlightAreaRef = useRef<HTMLDivElement | null>(null);

  const [forceRemountKey, setForceRemountKey] = useState(0);

  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // Not Allow to Erase Ficha de Identificación Variables
  // const formatedValue = useMemo((): string => {
  //   const PROTECTED_TITLE = "| Ficha de Identificación |";

  //   if (currentValue) {
  //     if (!currentValue.includes(PROTECTED_TITLE)) {
  //       return currentValue;
  //     }
  //     // setFormatedClinicalHistory((prev) => {
  //     //  Split the Text in Lines
  //     const changedLines = currentValue.split("\n");
  //     const prevLines = prevValue.current.split("\n");
  //     let lineChangedIndex = 0;

  //     // Find Out the Line where the Change was Made
  //     for (let i = 0; i < changedLines.length; i++) {
  //       if (changedLines[i] !== prevLines[i]) {
  //         lineChangedIndex = i;
  //         break;
  //       }
  //     }

  //     // Get the Line Modified prev and current
  //     const prevLine = prevLines[lineChangedIndex];
  //     const changedLine = changedLines[lineChangedIndex];
  //     let LineChangedAPrefix = false;

  //     // Detect if the User is Trying to Change a Protected Prefix
  //     DefaultFichaDeIdentificacionValues.map((prefix) => {
  //       if (
  //         prevLine &&
  //         changedLine &&
  //         prevLine.includes(prefix) &&
  //         !changedLine.includes(prefix)
  //       ) {
  //         LineChangedAPrefix = true;
  //       }
  //     });

  //     // If so, stop the change, else allow the change
  //     if (LineChangedAPrefix) {
  //       setForceRemountKey((k) => k + 1);
  //       prevValue.current = prevLines.join("\n");
  //       return prevLines.join("\n");
  //     } else {
  //       prevValue.current = changedLines.join("\n");
  //       return changedLines.join("\n");
  //     }
  //   } else {
  //     return "";
  //   }
  //   // });

  //   // return currentValue
  // }, [currentValue]);

  // If Highlights Declared, Highligh them
  useEffect(() => {
    if (highlights && currentValue && highlightAreaRef.current) {
      const escapedTerms = highlights.map((term) =>
        term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      );

      const regex = new RegExp(`(${escapedTerms.join("|")})`, "gi");

      const escapedValue = currentValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      const highlighted = escapedValue
        .replace(/\n$/g, "\n\n")
        .replace(regex, "<mark>$1</mark>");

      highlightAreaRef.current.innerHTML = highlighted;
    }
  }, [currentValue, highlights]);

  // Background Automatic Scroll to Origin
  useEffect(() => {
    backdropRef.current?.scrollTo({
      top: scrollPosition,
    });
  }, [scrollPosition]);

  useEffect(() => {
    if (forceRemountKey)
      toast.error(
        "No puedes eliminar las variables de la Ficha de Identificación",
      );
  }, [forceRemountKey]);

  return (
    <div className="ClinicalTextArea" id={identifier}>
      <div className="LeftContainer">
        <div className="TextBgContainer">
          <div className="Backdrop" ref={backdropRef}>
            <div
              className="Highlights"
              ref={highlightAreaRef}
            >{`${currentValue}`}</div>
          </div>
          <InputCC
            key={forceRemountKey}
            type="textarea"
            identifier={`${identifier}`}
            id="AiWordSheetTextArea"
            disableSessionSave={disableSessionSave}
            onScroll={(e) => {
              setScrollPosition(e.currentTarget.scrollTop);
            }}
            styles={{
              container: {
                width: "100%",
                height: "100%",
              },
              input: {
                backgroundColor: "transparent",
              },
            }}
            currentValue={currentValue}
            readOnly={uneditable}
            onChange={(text) => {
              if (!uneditable) {
                onChange && onChange(text);
              }
            }}
          />

          {(mutation && mutation.isPending) || saving || loading ? (
            <div className="loadingCont">
              <LoaderCC />
            </div>
          ) : null}
        </div>
        {belowText ? <div className="BelowTextSlot">{belowText}</div> : null}

        {mutation && (
          <ButtonCC
            type="Phantom" size="lg"
            classname="SavePatientButton"
            loading={mutation.isPending || loading}
            text={submitButton?.text ? submitButton?.text : "Guardar Paciente"}
            width="block"
            icon={
              submitButton?.icon ? (
                submitButton.icon
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.5 3.75a6 6 0 0 0-5.98 6.496A5.25 5.25 0 0 0 6.75 20.25H18a4.5 4.5 0 0 0 2.206-8.423 3.75 3.75 0 0 0-4.133-4.303A6.001 6.001 0 0 0 10.5 3.75Zm2.03 5.47a.75.75 0 0 0-1.06 0l-3 3a.75.75 0 1 0 1.06 1.06l1.72-1.72v4.94a.75.75 0 0 0 1.5 0v-4.94l1.72 1.72a.75.75 0 1 0 1.06-1.06l-3-3Z"
                    clipRule="evenodd"
                  />
                </svg>
              )
            }
            onClick={() => {
              currentValue && mutation.mutate(currentValue);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ClinicalTextArea;
