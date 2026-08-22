import FormCC from "@/components/Form-CC";
import InputCC from "@/components/Input-CC";
import React, { useEffect, useState } from "react";

const NutritionalIntervention = () => {
  const [GEB, setGEB] = useState<number>(0);
  const [GET, setGET] = useState<number>(0);
  const [weightToUse, setWeightToUse] = useState<string>("");
  const [GEBFormula, setGEBFormula] = useState<string>("");
  const [physAct, setPhysact] = useState<number>(0);

  useEffect(() => {
    // Fórmula Para Miffilin
    if (GEBFormula === "Mifflin") {
      // setGEB((9.99 * ))
    }
  }, [weightToUse, GEBFormula, physAct]);

  return (
    <section className="NutritionalIntervention" id="GraphsSectionContainer">
      <div className="SomasNutriFormContainer">
        <FormCC
          title={""}
          subtitle={"Datos Generales"}
          identifier={"NutritionalInterventionSomasForm"}
          onChange={() => {}}
          inputList={[
            {
              type: "number",
              label: "Peso",
              identifier: "Weight",
            },
            {
              type: "number",
              label: "Estatura",
              identifier: "Height",
            },
            {
              type: "number",
              label: "IMC",
              identifier: "IMC",
            },
            {
              type: "number",
              label: "MME",
              identifier: "MME",
            },
            {
              type: "number",
              label: "% Grasa",
              identifier: "LipidsPercentage",
            },
          ]}
        />
      </div>
      <div className="MainNutriSection">
        <h2>{"Intervención Nutricional"}</h2>

        <div className="InputsContainer">
          <InputCC
            type={"select"}
            identifier={"selectInterventionType"}
            label="Peso a Usar"
            options={["Peso Actual", "Peso Ideal", "Peso Ajustado"]}
            onChange={(value) => {
              setWeightToUse(value);
            }}
          />

          <InputCC
            type={"select"}
            identifier={"selectInterventionType"}
            label="Fórmula GEB"
            options={["", "Harris Benedict", "Schofield", "OMS"]}
            onChange={(value) => {
              setGEBFormula(value);
            }}
          />

          <InputCC
            type={"number"}
            identifier={"activityNumber"}
            label="Actividad Física"
            onChange={(value) => {
              setPhysact(value);
            }}
          />
        </div>

        <div className="rest">
          <div className="nutriContainer">
            <h3>{"Gasto Energético Basal"}</h3>
            <p>{`${124312341234} kcal`}</p>
          </div>
          <div className="MifflinnutriContainer">
            <h3>{"Gasto Energético Total"}</h3>
            <p>{`${124312341234} kcal`}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NutritionalIntervention;
