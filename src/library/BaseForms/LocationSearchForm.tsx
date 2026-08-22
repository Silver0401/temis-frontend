"use client";

import React, { useMemo } from "react";
import FormCC from "@/components/Form-CC";
import PaisesSearchCC from "@/components/SearchInputs/PaisesSearch-CC";
import EntFedSearchCC from "@/components/SearchInputs/EntFedSearch-CC";
import MunicipiosSearchCC from "@/components/SearchInputs/MunicipiosSearch-CC";
import LocalidadesSearchCC from "@/components/SearchInputs/LocalidadesSearch-CC";

export interface LocationSearchFormValues {
  pais?: string;
  entFed?: string;
  municipio?: string;
  localidad?: string;
}

interface LocationSearchFormProps {
  onSubmit: (data: LocationSearchFormValues) => void;
  initialValues?: LocationSearchFormValues;
  colorSchema?: colorSchemas;
  buttonLoading?: boolean;
  title?: string;
  subtitle?: string;
}

const LocationSearchForm: React.FC<LocationSearchFormProps> = ({
  onSubmit,
  initialValues,
  colorSchema,
  buttonLoading,
  title = "Ubicación",
  subtitle = "Selecciona la ubicación paso a paso",
}) => {
  const inputList = useMemo((): InputCCprops[] => [
    {
      type: "custom",
      identifier: "PaisSearch",
      children: (
        <PaisesSearchCC
          identifier="PaisSearch"
          currentValue={initialValues?.pais}
          onSelect={() => {}}
        />
      ),
    },
    {
      type: "custom",
      identifier: "EntFedSearch",
      children: (
        <EntFedSearchCC
          identifier="EntFedSearch"
          currentValue={initialValues?.entFed}
          onSelect={() => {}}
        />
      ),
    },
    {
      type: "custom",
      identifier: "MunicipioSearch",
      children: (
        <MunicipiosSearchCC
          identifier="MunicipioSearch"
          currentValue={initialValues?.municipio}
          onSelect={() => {}}
        />
      ),
    },
    {
      type: "custom",
      identifier: "LocalidadSearch",
      children: (
        <LocalidadesSearchCC
          identifier="LocalidadSearch"
          currentValue={initialValues?.localidad}
          onSelect={() => {}}
        />
      ),
    },
  ], [initialValues]);

  return (
    <div className="LocationSearchForm">
      <FormCC
        title={title}
        subtitle={subtitle}
        identifier="LocationSearchForm"
        inputList={inputList}
        steps={4}
        colorSchema={colorSchema}
        buttonLoading={buttonLoading}
        submitButtonStyles={{ text: "Guardar Ubicación" }}
        onSubmit={(formData) => {
          onSubmit({
            pais: (formData.get("PaisSearch") as string) || undefined,
            entFed: (formData.get("EntFedSearch") as string) || undefined,
            municipio: (formData.get("MunicipioSearch") as string) || undefined,
            localidad: (formData.get("LocalidadSearch") as string) || undefined,
          });
        }}
      />
    </div>
  );
};

export default LocationSearchForm;
