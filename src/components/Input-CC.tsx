"use client";

import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import { AnimatePresence, motion } from "motion/react";
import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import ButtonCC from "./Button-CC";
import {
  base64ToFile,
  FiletoBase64,
  validateInputFieldAll,
} from "@/scripts/Generator";
import QRImgUpload from "@/library/GlobalModalComps/QRImgUpload";
import IconsCC from "@/assets/icons/IconsCC";

const getPasswordStrength = (
  password: string,
): { level: 1 | 2 | 3; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { level: 1, label: "Débil", color: "#ee9e9e" };
  if (score <= 3) return { level: 2, label: "Regular", color: "#f4eb6a" };
  return { level: 3, label: "Fuerte", color: "#88e28a" };
};

const InputCC: React.FC<InputCCprops> = ({
  label,
  icon,
  type,
  disabled,
  styles,
  identifier,
  loading,
  fakeHide,
  id,
  placeholder,
  debouncer,
  options,
  colorSchema,
  iconCustoms,
  initialValue,
  currentValue,
  nonWritable,
  readOnly,
  fileTypes,
  dataList,
  onClick,
  children,
  onChange,
  onScroll,
  autoComplete,
  disableSessionSave,
  limitFileQuantity,
  showPasswordStrength,
  phoneUploadFile,
  showPhoneQr,
  direction,
  checkBoxLink,
  suggestion,
  validations,
  iconTooltip,
}) => {
  const { setGlobalModal } = useGlobalContext();
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputData, setInputData] = useState<string>(
    type === "select" ? "default" : "",
  );
  const [inputFiles, setInputFiles] = useState<Array<FileCCProps>>([]);
  const [inputFocused, setInputFocused] = useState<boolean>(false);
  const [passwordVisible, setPasswordVisible] = useState<boolean>(false);
  const [checked, setChecked] = useState<boolean>(false);
  const [validationState, setValidationState] = useState<"idle" | "valid" | "error">("idle");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasBlurred, setHasBlurred] = useState<boolean>(false);
  const iconsObject: InputCCTypesIndex = {
    file:
      fileTypes === "images" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path
            fillRule="evenodd"
            d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path
            fillRule="evenodd"
            d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
            clipRule="evenodd"
          />
        </svg>
      ),
    text: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
      </svg>
    ),
    textarea: IconsCC.Document,
    date: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path d="M12.75 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM7.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM8.25 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM9.75 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM10.5 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM12.75 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM14.25 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 17.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 15.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM15 12.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM16.5 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" />
        <path
          fillRule="evenodd"
          d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    select: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
        />
      </svg>
    ),
    number: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path
          fillRule="evenodd"
          d="M6.32 1.827a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V19.5a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V4.757c0-1.47 1.073-2.756 2.57-2.93ZM7.5 11.25a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm.75 1.5a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H8.25Zm-.75 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75v-.008Zm.75 1.5a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V18a.75.75 0 0 0-.75-.75H8.25Zm1.748-6a.75.75 0 0 1 .75-.75h.007a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.007a.75.75 0 0 1-.75-.75v-.008Zm.75 1.5a.75.75 0 0 0-.75.75v.008c0 .414.335.75.75.75h.007a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75h-.007Zm-.75 3a.75.75 0 0 1 .75-.75h.007a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.007a.75.75 0 0 1-.75-.75v-.008Zm.75 1.5a.75.75 0 0 0-.75.75v.008c0 .414.335.75.75.75h.007a.75.75 0 0 0 .75-.75V18a.75.75 0 0 0-.75-.75h-.007Zm1.754-6a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm.75 1.5a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75h-.008Zm-.75 3a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm.75 1.5a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V18a.75.75 0 0 0-.75-.75h-.008Zm1.748-6a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75h-.008a.75.75 0 0 1-.75-.75v-.008Zm.75 1.5a.75.75 0 0 0-.75.75v.008c0 .414.336.75.75.75h.008a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75h-.008Zm-8.25-6A.75.75 0 0 1 8.25 6h7.5a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-7.5a.75.75 0 0 1-.75-.75v-.75Zm9 9a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0v-2.25Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    email: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="size-6"
      >
        <path
          fillRule="evenodd"
          d="M17.834 6.166a8.25 8.25 0 1 0 0 11.668.75.75 0 0 1 1.06 1.06c-3.807 3.808-9.98 3.808-13.788 0-3.808-3.807-3.808-9.98 0-13.788 3.807-3.808 9.98-3.808 13.788 0A9.722 9.722 0 0 1 21.75 12c0 .975-.296 1.887-.809 2.571-.514.685-1.28 1.179-2.191 1.179-.904 0-1.666-.487-2.18-1.164a5.25 5.25 0 1 1-.82-6.26V8.25a.75.75 0 0 1 1.5 0V12c0 .682.208 1.27.509 1.671.3.401.659.579.991.579.332 0 .69-.178.991-.579.3-.4.509-.99.509-1.671a8.222 8.222 0 0 0-2.416-5.834ZM15.75 12a3.75 3.75 0 1 0-7.5 0 3.75 3.75 0 0 0 7.5 0Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    password: passwordVisible ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="closedLock"
      >
        <path d="M18 1.5c2.9 0 5.25 2.35 5.25 5.25v3.75a.75.75 0 0 1-1.5 0V6.75a3.75 3.75 0 1 0-7.5 0v3a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H3.75a3 3 0 0 1-3-3v-6.75a3 3 0 0 1 3-3h9v-3c0-2.9 2.35-5.25 5.25-5.25Z" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="openLock"
      >
        <path
          fillRule="evenodd"
          d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
          clipRule="evenodd"
        />
      </svg>
    ),
    checkbox: null,
    checkBoxLink: null,
    custom: null,
  };

  const filterFiles = async (files: File[]): Promise<FileCCProps[]> => {
    const goodFiles: File[] = [];
    const badFiles: File[] = [];

    if (type === "file" && files) {
      Object.values(files).map((file) => {
        if (fileTypes === "images") {
          if (
            file.type.includes("jpeg") ||
            file.type.includes("jpg") ||
            file.type.includes("png")
          ) {
            goodFiles.push(file);
          } else {
            badFiles.push(file);
          }
        } else if (fileTypes === "documents") {
          if (file.type.includes("pdf")) {
            goodFiles.push(file);
          } else {
            badFiles.push(file);
          }
        } else {
          badFiles.push(file);
        }
      });
    }

    // Convert valid files to Base64 and wait for completion BEFORE using the array

    const limit = limitFileQuantity ? limitFileQuantity : 1;

    if (goodFiles.length > limit) {
      toast.warning(
        limitFileQuantity
          ? `Solo puedes subir ${limitFileQuantity} máximo.`
          : "Solo puedes subir un archivo a la vez",
      );
      goodFiles.splice(limit);
    }

    if (badFiles.length > 0) {
      toast.error(
        `Solo puedes subir ${
          fileTypes === "documents"
            ? "archivos de extension .pdf"
            : "imágenes con extension .jpg o .png"
        }. Quitamos los archivos no validos`,
      );
    }

    return await Promise.all(
      goodFiles.map(async (file, index) => {
        return {
          base64File: await FiletoBase64(file),
          name: file.name,
        };
      }),
    );
  };

  // If there is an Initial Value put it on the Input
  useEffect(() => {
    if (initialValue) {
      setInputData(type === "date" ? displayToIsoDate(initialValue) : initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Retrieve the value from sessionStorage to don't lose data
  useEffect(() => {
    if (!disableSessionSave) {
      const savedValue = window.sessionStorage.getItem(`${identifier}`);
      if (savedValue) {
        const parsedValue = JSON.parse(savedValue);
        if (parsedValue.length > 1)
          setInputData(
            type === "date" ? displayToIsoDate(parsedValue) : parsedValue,
          );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    currentValue &&
      setInputData(
        type === "date" ? displayToIsoDate(currentValue) : currentValue,
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  // Every time Input Data is Changed:
  //
  // 1) Save it to the Session Storage to don't lose data
  // 2) Use a debouncer function for api calls optimization
  useEffect(() => {
    if (type === "text" && debouncer) {
      const handler = setTimeout(() => {
        onChange && onChange(inputData);
      }, 750);

      return () => {
        clearTimeout(handler);
      };
    } else if (type === "checkbox" || type === "checkBoxLink") {
      setChecked(inputData === "checked" ? true : false);
    }

    if (!disableSessionSave) {
      if (
        type === "textarea" &&
        inputData.length > 0 &&
        inputData !== initialValue
      ) {
        window.sessionStorage.setItem(
          `${identifier}`,
          JSON.stringify(inputData),
        );
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputData]);

  //  Every time A file is Uploaded Add it to the Input Ref DOM files
  useEffect(() => {
    if (inputFiles.length > 0) {
      const dataTransfer = new DataTransfer();

      inputFiles.map((file) => {
        const fileFromBase64 = base64ToFile(file.base64File, file.name);
        dataTransfer.items.add(fileFromBase64);

        if (inputRef.current) {
          inputRef.current.files = dataTransfer.files;
        }
      });

      onChange && onChange(inputFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputFiles]);

  useEffect(() => {
    if (phoneUploadFile) {
      setInputFiles([...inputFiles, phoneUploadFile]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneUploadFile]);

  const passwordStrength =
    showPasswordStrength && type === "password" && inputData.length > 0
      ? getPasswordStrength(inputData)
      : null;

  const showSuggestion =
    !!suggestion &&
    type !== "checkbox" &&
    type !== "checkBoxLink" &&
    type !== "custom" &&
    type !== "file";

  const handleSuggestionClick = () => {
    setInputData(suggestion!);
    onChange && onChange(suggestion!);
  };

  // The native <input type="date"> works internally in ISO (YYYY-MM-DD), but
  // the whole app uses DD/MM/AAAA. InputCC converts at its boundaries: it keeps
  // ISO for the native control and emits/stores DD/MM/AAAA everywhere else.
  const isoToDisplayDate = (iso: string): string => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  };
  const displayToIsoDate = (ddmm: string): string => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmm);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : ddmm;
  };

  // Date bounds (YYYY-MM-DD) derived from validations so the native picker
  // itself blocks out-of-range dates (e.g. notFuture -> no future dates).
  const toDateInputValue = (yearsAgo?: number): string => {
    const d = new Date();
    if (yearsAgo !== undefined) d.setFullYear(d.getFullYear() - yearsAgo);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const dateMax =
    type === "date" && validations?.notFuture ? toDateInputValue() : undefined;
  const dateMin =
    type === "date" && validations?.maxAgeYears !== undefined
      ? toDateInputValue(validations.maxAgeYears)
      : undefined;

  // Tooltip shown on hover over the icon. Lines come from `iconTooltip` or,
  // for the error icon, from the failed validations.
  const renderIconTooltip = (lines?: string[]) =>
    lines && lines.length > 0 ? (
      <div className="InputCC-IconTooltip" role="tooltip">
        {lines.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>
    ) : null;

  return type === "custom" ? (
    <div
      className={`InputCC-Container InputCC-Custom ${
        fakeHide ? "fakeHideInputCC" : ""
      }`}
    >
      {children}
    </div>
  ) : (
    <div
      key={`${type}-${label}`}
      id={
        (inputData.length >= 1 || inputFocused) &&
        type !== "checkbox" &&
        type !== "checkBoxLink" &&
        direction !== "horizontal"
          ? `${colorSchema ? `InputCC-Selected-${colorSchema}` : "InputCC-Selected"}`
          : ""
      }
      data-direction={direction}
      data-validation={validations && hasBlurred ? validationState : undefined}
      className={`${
        type === "checkbox" || type === "checkBoxLink"
          ? "InputCC-Checkbox"
          : "InputCC-Container"
      } ${
        colorSchema ? `InputCC-Schema-${colorSchema}` : ""
      } ${identifier} ${fakeHide ? "fakeHideInputCC" : ""}`}
      onClick={() => {
        if ((type === "checkbox" || type === "checkBoxLink") && !disabled) {
          setInputData(checked ? "unchecked" : "checked");
          onChange && onChange(checked ? "unchecked" : "checked");
          setChecked(!checked);
        }
      }}
      style={{
        ...styles?.container,
        minHeight:
          type === "file" ? "200px" : type === "textarea" ? "150px" : undefined,
        backgroundColor:
          type === "checkbox" || type === "checkBoxLink"
            ? "transparent"
            : undefined,
      }}
    >
      {/* ------------------------ Input Selected to Render -------------------------- */}
      {type === "textarea" ? (
        <textarea
          name={identifier}
          className="InputCC InputCC-Textarea"
          readOnly={readOnly}
          style={styles?.input}
          id={id}
          value={currentValue ? currentValue : inputData}
          placeholder={placeholder}
          onChange={(e) => {
            if (e.currentTarget) {
              if (currentValue) {
                onChange && onChange(e.currentTarget.value);
              } else {
                setInputData(e.currentTarget.value);
                onChange && onChange(e.currentTarget.value);
              }
            }
          }}
          onScroll={onScroll && onScroll}
        ></textarea>
      ) : type === "select" ? (
        <>
          <select
            name={identifier}
            className={`InputCC ${disabled ? " InputCCTypedisabled" : ` InputCCSelect`}`}
            onChange={(e: any) => {
              if (e === "default") {
                toast.error("Selecciona una opción válida");
              } else {
                setInputData(e.currentTarget.value);
                onChange && onChange(e.currentTarget.value);
              }
            }}
            value={inputData}
            disabled={disabled ? disabled : false}
          >
            <option value={"default"}>{`${
              placeholder ? placeholder : "Selecciona"
            }`}</option>
            {options?.map((option, index) => {
              return (
                <option key={`${option}${index}`} value={option}>
                  {option}
                </option>
              );
            })}
          </select>
        </>
      ) : (
        <>
          <input
            onChange={async (e) => {
              if (type === "file") {
                // @ts-ignore
                const modFiles = Object.values(e.target.files).map(
                  (file) => file,
                );
                const filesFiltered = await filterFiles(modFiles);
                setInputFiles(filesFiltered);
                // e.target.files && filterFiles(e);
              } else if (type === "text") {
                const newVal = e.currentTarget.value;
                setInputData(newVal);
                if (!debouncer) {
                  onChange && onChange(e.target.value);
                }
                if (validations && hasBlurred) {
                  const errs = validateInputFieldAll(newVal, validations);
                  setValidationErrors(errs);
                  setValidationState(
                    newVal.trim() === ""
                      ? "idle"
                      : errs.length > 0
                        ? "error"
                        : "valid",
                  );
                }
              } else if (type === "date") {
                // Native control holds ISO; emit/store DD/MM/AAAA.
                const iso = e.currentTarget.value;
                setInputData(iso);
                const display = isoToDisplayDate(iso);
                onChange && onChange(display);
                if (validations && hasBlurred) {
                  const errs = validateInputFieldAll(display, validations);
                  setValidationErrors(errs);
                  setValidationState(
                    display.trim() === ""
                      ? "idle"
                      : errs.length > 0
                        ? "error"
                        : "valid",
                  );
                }
              } else if (
                type !== "checkbox" &&
                type !== "checkBoxLink" &&
                !nonWritable
              ) {
                setInputData(e.currentTarget.value);
                onChange && onChange(e.currentTarget.value);
              }
            }}
            list={dataList && `inputcc-datalist-${dataList[0]}`}
            readOnly={readOnly}
            ref={inputRef}
            value={type !== "file" ? inputData : undefined}
            multiple={type === "file" && true}
            onFocus={() => setInputFocused(true)}
            onBlur={() => {
              setInputFocused(false);
              if (validations) {
                setHasBlurred(true);
                const valueToValidate =
                  type === "date" ? isoToDisplayDate(inputData) : inputData;
                const errs = validateInputFieldAll(valueToValidate, validations);
                setValidationErrors(errs);
                setValidationState(
                  valueToValidate.trim() === ""
                    ? "idle"
                    : errs.length > 0
                      ? "error"
                      : "valid",
                );
              }
            }}
            onDrop={async (e) => {
              if (type === "file") {
                // @ts-ignore
                const filesFiltered = await filterFiles(e.target.files);
                setInputFiles(filesFiltered);
              }
            }}
            className={`InputCC InputCCType${disabled ? "disabled" : type}`}
            data-testid={`input-${identifier}`}
            disabled={disabled ? disabled : false}
            checked={
              type === "checkbox" || type === "checkBoxLink"
                ? checked
                : undefined
            }
            onClick={() => {
              onClick && onClick();
            }}
            autoComplete={autoComplete}
            name={type === "date" ? undefined : identifier}
            type={
              type === "password"
                ? passwordVisible
                  ? "text"
                  : "password"
                : type === "checkBoxLink"
                  ? "checkbox"
                  : type
            }
            placeholder={placeholder}
            max={dateMax}
            min={dateMin}
            style={{
              ...styles?.input,
            }}
            id={identifier}
          />
          {/* For dates the visible control holds ISO; this mirror carries the
              canonical DD/MM/AAAA value into FormData under the real name. */}
          {type === "date" ? (
            <input
              type="hidden"
              name={identifier}
              value={isoToDisplayDate(inputData)}
              readOnly
            />
          ) : null}
          {dataList ? (
            <datalist id={`inputcc-datalist-${dataList[0]}`}>
              {dataList.map((item) => {
                return <option key={item} value={item}></option>;
              })}
            </datalist>
          ) : null}
        </>
      )}

      {/* ------------------------ Placholder Hider -------------------------- */}

      {!placeholder && type !== "textarea" && direction !== "horizontal" ? (
        <span className="placeholderHider" />
      ) : null}

      {/* ------------------------ label of Input -------------------------- */}

      {label && type !== "textarea" ? (
        <label
          style={{
            backgroundColor:
              type === "checkbox" || type === "checkBoxLink"
                ? "transparent"
                : undefined,
          }}
        >
          {label}
          {type === "checkBoxLink" && checkBoxLink ? (
            <span
              className="InputCC-CheckboxLink-Text"
              onClick={(e) => {
                e.stopPropagation();
                window.open(checkBoxLink.url, "_blank");
              }}
            >
              {checkBoxLink.text}
            </span>
          ) : null}
        </label>
      ) : null}

      {/* ------------------------ Files Display -------------------------- */}
      {type === "file" ? (
        <div
          className="filesContainer"
          style={{
            opacity: inputFiles && inputFiles?.length > 0 ? 1 : undefined,
            pointerEvents:
              inputFiles && inputFiles?.length > 0 ? "auto" : "none",
          }}
        >
          {inputFiles && inputFiles.length > 0 ? (
            <div className="innerFilesContainer">
              {inputFiles.map((file, index) => {
                return (
                  <div
                    className="fileDiv"
                    key={file.name}
                    style={{
                      marginRight:
                        index + 1 === inputFiles.length &&
                        inputFiles.length >= 4
                          ? "70px"
                          : undefined,
                    }}
                  >
                    <div
                      className="xButton"
                      onClick={() =>
                        setInputFiles((prevFiles) => {
                          const newList = [...prevFiles];
                          newList.splice(index, 1);
                          return newList;
                        })
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="size-6"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p>{file.name}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="defaultContainer">
              <p>
                {showPhoneQr
                  ? "Sube tus Imágenes. Haz click en el QR para subir fotos con el teléfono."
                  : `Haz click o Arrastra tus ${
                      fileTypes === "images" ? "Imágenes" : "Archivos"
                    } Aquí`}
              </p>
            </div>
          )}
        </div>
      ) : null}

      {fileTypes === "images" && showPhoneQr && (
        <ButtonCC
          classname="inputQrCodeButton"
          type="Solid"
          onClick={() =>
            setGlobalModal({
              Component: <QRImgUpload />,
              Settings: {
                size: "medium",
                identifier: "globalModalPhoneQRImage",
                animation: "popUp",
              },
            })
          }
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M3 4.875C3 3.839 3.84 3 4.875 3h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 9.375v-4.5ZM4.875 4.5a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875.375c0-1.036.84-1.875 1.875-1.875h4.5C20.16 3 21 3.84 21 4.875v4.5c0 1.036-.84 1.875-1.875 1.875h-4.5a1.875 1.875 0 0 1-1.875-1.875v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5ZM6 6.75A.75.75 0 0 1 6.75 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75A.75.75 0 0 1 6 7.5v-.75Zm9.75 0A.75.75 0 0 1 16.5 6h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM3 14.625c0-1.036.84-1.875 1.875-1.875h4.5c1.036 0 1.875.84 1.875 1.875v4.5c0 1.035-.84 1.875-1.875 1.875h-4.5A1.875 1.875 0 0 1 3 19.125v-4.5Zm1.875-.375a.375.375 0 0 0-.375.375v4.5c0 .207.168.375.375.375h4.5a.375.375 0 0 0 .375-.375v-4.5a.375.375 0 0 0-.375-.375h-4.5Zm7.875-.75a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75ZM6 16.5a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm9.75 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm-3 3a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Zm6 0a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75v-.75Z"
                clipRule="evenodd"
              />
            </svg>
          }
        />
      )}

      {/* ------------------------ Icon of Input -------------------------- */}
      {direction !== "horizontal" && (
        <AnimatePresence>
          {iconCustoms?.icon ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className={"InputCC-Icon"}
              onClick={() => {
                iconCustoms.onClick && iconCustoms.onClick();
                setInputData("");
              }}
            >
              {iconCustoms.icon}
              {renderIconTooltip(iconTooltip)}
            </motion.div>
          ) : iconsObject[type] ? (
            disabled ? (
              <motion.div
                key={"DisabledIcon"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={`InputCC-Icon InputCCIconTypedisabled`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
              </motion.div>
            ) : icon || loading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={"InputCC-Icon"}
              >
                {loading ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="loadingInputIcon"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 0 0-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 0 0-2.282.819l-.922 1.597a1.875 1.875 0 0 0 .432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 0 0 0 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 0 0-.432 2.385l.922 1.597a1.875 1.875 0 0 0 2.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 0 0 2.28-.819l.923-1.597a1.875 1.875 0 0 0-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 0 0 0-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 0 0-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 0 0-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 0 0-1.85-1.567h-1.843ZM12 15.75a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  icon
                )}
              </motion.div>
            ) : validations &&
              hasBlurred &&
              validationState === "error" &&
              type !== "password" &&
              type !== "select" &&
              type !== "textarea" ? (
              <motion.div
                key={"ErrorIcon"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={`InputCC-Icon`}
                style={
                  type === "file"
                    ? { position: "absolute", top: "10px", right: "10px" }
                    : undefined
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="ErrorCross"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25C6.615 2.25 2.25 6.615 2.25 12s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                    clipRule="evenodd"
                  />
                </svg>
                {renderIconTooltip(
                  validationErrors.length > 0 ? validationErrors : iconTooltip,
                )}
              </motion.div>
            ) : inputData.length > 0 &&
              type !== "password" &&
              type !== "select" &&
              type !== "textarea" ? (
              <motion.div
                key={"CheckIcon"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={`InputCC-Icon`}
                style={
                  type === "file"
                    ? { position: "absolute", top: "10px", right: "10px" }
                    : undefined
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="CorrectCheck"
                >
                  <path
                    fillRule="evenodd"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                    clipRule="evenodd"
                  />
                </svg>
                {renderIconTooltip(iconTooltip)}
              </motion.div>
            ) : (
              <motion.div
                key={"DynamicIcons"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className={`InputCC-Icon InputCCIconType${type}`}
                onClick={() => {
                  if (type === "password") {
                    passwordVisible
                      ? setPasswordVisible(false)
                      : setPasswordVisible(true);
                  }

                  if (type === "textarea") {
                    navigator.clipboard.writeText(inputData);
                    toast.success("Texto copiado al Portapapeles");
                  }
                }}
                style={
                  type === "textarea" || type === "file"
                    ? { position: "absolute", top: "10px", right: "10px" }
                    : undefined
                }
              >
                {iconsObject[type]}
                {renderIconTooltip(iconTooltip)}
              </motion.div>
            )
          ) : null}
        </AnimatePresence>
      )}
      {/* )} */}
      {passwordStrength && (
        <div
          className="InputCC-PasswordStrength"
          data-level={passwordStrength.level}
        >
          {([1, 2, 3] as const).map((seg) => (
            <div
              key={seg}
              className="InputCC-PasswordStrength-Dot"
              data-active={seg <= passwordStrength.level}
            />
          ))}
          <div className="InputCC-PasswordStrength-Divider" />
          <p className="InputCC-PasswordStrength-Label">
            {passwordStrength.label}
          </p>
        </div>
      )}
      {showSuggestion && (
        <div className="InputCC-Suggestion" onClick={handleSuggestionClick}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
              clipRule="evenodd"
            />
          </svg>
          <span>{suggestion}</span>
        </div>
      )}
    </div>
  );
};

export default InputCC;
