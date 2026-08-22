"use client";

import React, {
  CSSProperties,
  useContext,
  useState,
  useRef,
  FormHTMLAttributes,
  useMemo,
  useEffect,
} from "react";
import ButtonCC from "./Button-CC";
import { toast } from "sonner";
import InputCC from "./Input-CC";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import { FiletoBase64, validateInputField } from "@/scripts/Generator";

// In Case I need to make this Component Better
// https://stackoverflow.com/questions/69904658/passing-props-to-a-functional-component-that-was-also-passed-as-a-param

interface SuccessProps {
  formData: FormData;
  ApiResponse: any;
}

interface loadToastProps {
  text: string;
  duration: number;
}

type stepSectionsIndexed = {
  [key in number]: { minRange: number; maxRange: number };
};

interface FormCCProps {
  title: string;
  subtitle: string | React.ReactElement;
  identifier: string;
  inputList: Array<InputCCprops>;
  onSubmit?: (formData: FormData) => void;
  onFeathersApiAction?: (data: FormData) => Promise<feathersApiProps>;
  onAxiosApiAction?: (data: FormData) => Promise<axiosApiProps>;
  onSuccess?: (props: SuccessProps) => void;
  colorSchema?: colorSchemas;
  loadingToasts?: Array<loadToastProps>;
  buttonLoading?: boolean;
  steps?: number;
  submitButtonStyles?: {
    text?: string;
    icon?: React.ReactElement;
  };
  onChange?: (e: React.ChangeEvent<HTMLFormElement>) => void;
  preloadedData?: Array<{ key: string; value: string }>;
  titlesStyle?: {
    title?: CSSProperties;
    subtitle?: CSSProperties;
  };
  inputGroups?: Array<InputGroupCC>;
}

const FormCC: React.FC<FormCCProps> = ({
  title,
  steps,
  subtitle,
  inputList,
  identifier,
  colorSchema,
  onSubmit,
  onFeathersApiAction,
  onAxiosApiAction,
  submitButtonStyles,
  onSuccess,
  preloadedData,
  loadingToasts,
  buttonLoading,
  titlesStyle,
  onChange,
  inputGroups,
}) => {
  const FunctionalComponent = InputCC;
  const { feathersFetchCC, axiosFetchCC } = useGlobalContext();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const sectionedSteps = useMemo((): stepSectionsIndexed => {
    if (steps) {
      const finalList: stepSectionsIndexed = {};

      const groupSteps = new Set(
        inputGroups?.filter((g) => g.step !== undefined).map((g) => g.step!) ?? []
      );

      const availableSteps: number[] = [];
      for (let i = 1; i <= steps; i++) {
        if (!groupSteps.has(i)) availableSteps.push(i);
      }

      const itemsPerSection =
        availableSteps.length > 0
          ? Math.ceil(inputList.length / availableSteps.length)
          : 0;

      availableSteps.forEach((stepNum, idx) => {
        finalList[stepNum] = {
          minRange: itemsPerSection * idx,
          maxRange: itemsPerSection * (idx + 1),
        };
      });

      return finalList;
    } else {
      return [];
    }
    // Depende de steps y del largo de la lista: el formulario del router recibe
    // sus inputs DESPUÉS del montaje, y con deps vacías todos quedaban ocultos.
  }, [steps, inputList.length, inputGroups]);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  const ResetFormData = () => {
    inputList.map((inputData) => {
      window.sessionStorage.removeItem(inputData.identifier);
    });

    formRef.current?.reset();
  };

  const FormValidation = (e: FormData): "No Errors" | "With Errors" => {
    const errorsList: Array<string> = [];

    const allInputs = [
      ...inputList,
      ...(inputGroups?.flatMap((g) => g.inputs) ?? []),
    ];

    allInputs.map((input) => {
      const inputValue = e.get(input.identifier) as string;

      if (input.type === "file") {
        // @ts-ignore
        if (inputValue.name === "") {
          errorsList.push(`Tienes que subir un archivo`);
        }
      }

      if (input.type === "email") {
        if (!inputValue.includes("@")) {
          errorsList.push("Tu correo necesita tener un @ para ser válido");
        }
      } else if (
        (input.type === "checkbox" || input.type === "checkBoxLink") &&
        input.required
      ) {
        const InputSet = e.get(input.identifier);
        if (InputSet !== "checked") {
          const linkText = input.checkBoxLink?.text;
          errorsList.push(
            linkText
              ? `Debes aceptar: ${linkText}`
              : `El campo "${input.label}" es requerido`,
          );
        }
      } else if (input.required) {
        const InputSet = e.get(input.identifier) as string;
        if (
          InputSet === undefined ||
          InputSet.length < 1 ||
          (input.type === "select" && InputSet === "default")
        ) {
          errorsList.push(`El campo "${input.label}" esta vacío`);
        }
      }

      if (input.validations && (input.type === "text" || input.type === "number")) {
        const rawValue = (e.get(input.identifier) as string) ?? "";
        const validationError = validateInputField(rawValue, input.validations);
        if (validationError) {
          errorsList.push(
            input.label ? `"${input.label}": ${validationError}` : validationError,
          );
        }
      }
    });

    errorsList.forEach((error) => {
      toast.error("Error en Formulario", {
        description: error,
      });
    });

    // -------------- Testing Logs --------------

    // // @ts-ignore
    // for (const value of e.values()) {
    //   console.log(value);
    // }
    // // @ts-ignore
    // for (const key of e.keys()) {
    //   console.log(key);
    // }

    if (errorsList.length === 0) {
      return "No Errors";
    } else {
      return "With Errors";
    }
  };

  const ActivateFormApiRequest = async (formData: FormData) => {
    if (FormValidation(formData) === "No Errors") {
      // Initial Form Loaders
      const timeoutList: any[] = [];
      const loaderToast = toast.loading("Cargando...");
      setFormLoading(true);

      loadingToasts?.map((toastData, index) => {
        timeoutList.push(
          setTimeout(
            () => {
              toast(`${toastData.text}...`, {
                id: loaderToast,
              });
            },
            index === 0 ? 2000 : loadingToasts[index - 1].duration,
          ),
        );
      });

      // Api Request through Fetch Function
      if (onFeathersApiAction) {
        const FeathersRequest = await onFeathersApiAction(formData);
        const FeathersResponse = await feathersFetchCC(FeathersRequest);

        // Remove Initial Loading Toast / Toasts
        timeoutList.map((timeout) => {
          clearTimeout(timeout);
        });
        toast.dismiss(loaderToast);
        setFormLoading(false);

        if (FeathersResponse.type === "success") {
          onSuccess &&
            onSuccess({
              formData,
              ApiResponse: FeathersResponse.data,
            });
          ResetFormData();
        }
      }
      if (onAxiosApiAction) {
        const AxiosRequest = await onAxiosApiAction(formData);
        const AxiosResponse = await axiosFetchCC(AxiosRequest);

        // Remove Initial Loading Toast / Toasts
        timeoutList.map((timeout) => {
          clearTimeout(timeout);
        });
        toast.dismiss(loaderToast);
        setFormLoading(false);

        if (AxiosResponse.type === "success") {
          onSuccess &&
            onSuccess({
              formData,
              ApiResponse: AxiosResponse,
            });
          ResetFormData();
        }
      }
    }
  };

  const HandelStepChange = (type: "add" | "subtract") => {
    if (type === "add") {
      if (currentStep === steps) {
        setCurrentStep(steps!);
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      if (currentStep === 1) {
        setCurrentStep(1);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  const SubmitForm = async (formData: FormData) => {
    if (FormValidation(formData) === "No Errors" && onSubmit) {
      onSubmit(formData);
    }
  };

  return (
    <form
      ref={formRef}
      onChange={onChange}
      action={async (formData) => {
        let index = 0;
        for (const [key, value] of formData.entries()) {
          if (
            value instanceof File &&
            (value.type.startsWith("image/") || value.type.includes("/pdf"))
          ) {
            const base64 = await FiletoBase64(value);
            formData.delete(`${index}${key}`); // remove original File
            formData.append(`${index}${key}`, base64); // add Base64 string instead
            index++;
          }
        }

        if (onFeathersApiAction || onAxiosApiAction) {
          preloadedData &&
            preloadedData.map((preDat) => {
              formData.append(preDat.key, preDat.value);
            });
          ActivateFormApiRequest(formData);
        }
        if (onSubmit) {
          SubmitForm(formData);
        }
      }}
      className={`FormCC ${colorSchema ? `FormCC-CSchema-${colorSchema}` : ""}`}
      name={`FormCC-${identifier}`}
      key={`FormCC-${identifier}`}
      id={identifier}
      noValidate
    >
      <h4 className="TitleForm" style={titlesStyle?.title}>
        {title}
      </h4>
      {typeof subtitle === "string" ? (
        <p className="PCC-Form" style={titlesStyle?.subtitle}>
          {subtitle}
        </p>
      ) : (
        subtitle
      )}
      {inputGroups?.map((group, groupIndex) => (
        <div
          key={`FormCC-Group-${groupIndex}`}
          className={`FormCC-InputGroup ${
            steps && group.step !== undefined && group.step !== currentStep
              ? "fakeHideInputCC"
              : ""
          }`}
          data-orientation={group.orientation ?? "vertical"}
        >
          {group.groupLabel && (
            <p className="FormCC-GroupLabel">{group.groupLabel}</p>
          )}
          {group.inputs.map((groupInput) => (
            <FunctionalComponent
              key={`${groupInput.identifier}`}
              {...groupInput}
              colorSchema={colorSchema}
              direction={
                groupInput.direction ??
                (group.orientation === "horizontal" ? "horizontal" : undefined)
              }
            />
          ))}
        </div>
      ))}
      {inputList.map((InputCCprops, index) => (
        <FunctionalComponent
          key={`${InputCCprops.identifier}`}
          {...InputCCprops}
          colorSchema={colorSchema}
          fakeHide={
            steps
              ? sectionedSteps[currentStep] === undefined
                ? true
                : index < sectionedSteps[currentStep].minRange ||
                  index >= sectionedSteps[currentStep].maxRange
              : false
          }
        />
      ))}
      {onSubmit || onFeathersApiAction || onAxiosApiAction || onSuccess ? (
        <>
          {steps && currentStep !== steps ? (
            <div className="nextPrevButtCont">
              {currentStep !== 1 ? (
                <ButtonCC
                  type="Phantom"
                  text={"Regresar"}
                  key={"SubtractButton"}
                  width="block"
                  onClick={() => HandelStepChange("subtract")}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.03 3.97a.75.75 0 0 1 0 1.06l-6.22 6.22H21a.75.75 0 0 1 0 1.5H4.81l6.22 6.22a.75.75 0 1 1-1.06 1.06l-7.5-7.5a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 0 1 1.06 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              ) : null}
              <ButtonCC
                type="Solid"
                width="block"
                key={"AddButton"}
                text={"Continuar"}
                onClick={() => HandelStepChange("add")}
                icon={
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                }
              />
            </div>
          ) : (
            <div className="nextPrevButtCont">
              {steps ? (
                <ButtonCC
                  type="Solid" size="lg"
                  key={"SubtractMiniButton"}
                  width="block"
                  styles={{ width: "70px", marginRight: "10px" }}
                  onClick={() => HandelStepChange("subtract")}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.28 7.72a.75.75 0 0 1 0 1.06l-2.47 2.47H21a.75.75 0 0 1 0 1.5H4.81l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 0 1 1.06 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  }
                />
              ) : null}
              <ButtonCC
                key={"SubmitButton"}
                submit
                type="Gradient"
                loading={formLoading || buttonLoading}
                text={
                  submitButtonStyles?.text ? submitButtonStyles?.text : "Enviar"
                }
                width="block"
                icon={
                  submitButtonStyles?.icon ? (
                    submitButtonStyles?.icon
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  )
                }
              />
            </div>
          )}
        </>
      ) : null}
    </form>
  );
};

export default FormCC;
