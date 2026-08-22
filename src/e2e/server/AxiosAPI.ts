"use client";

export const User_Login = async (
  loginFormData: FormData,
): Promise<axiosApiProps> => {
  return new Promise((resolve) => {
    resolve({
      method: "post",
      route: "/authentication",
      requestType: "internal",
      logId: "user_logged_in",
      logs: false,
      data: {
        strategy: "local",
        email: loginFormData.get("logMail")?.toString().toLowerCase(),
        password: loginFormData.get("logPass"),
      },
      successToast: "Inicio de Sesión Exitoso",
      errorToast:
        "Error iniciando sesión, revisa tus datos e intenta nuevamente",
    });
  });
};

export const User_Logout = async (userId: string): Promise<axiosApiProps> => {
  return new Promise((resolve) => {
    resolve({
      method: "delete",
      route: "/authentication",
      requestType: "internal",
      logId: "user_logged_out",
      logs: true,
      successToast: "Sesión Cerrada",
      errorToast: "Error cerrando tu sesión",
    });
  });
};

export const Search_Drug_By_Name = async (
  drugName: string,
): Promise<axiosApiProps> => {
  return new Promise((resolve) => {
    resolve({
      method: "get",
      requestType: "external",
      logId: "user_searched_a_drug_by_name",
      route: `https://rxnav.nlm.nih.gov/REST/drugs.json?name=${drugName.trim()}&search=2`,
      logs: false,
      errorToast: "Error buscando el medicamento",
    });
  });
};

export const Search_Drug_By_Rxcui = async (
  rxcui: string,
): Promise<axiosApiProps> => {
  return new Promise((resolve) => {
    resolve({
      method: "get",
      requestType: "external",
      logId: "user_searched_a_drug_by_rxcui",
      route: `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui.trim()}/properties`,
      logs: false,
      errorToast: "Error buscando el medicamento",
    });
  });
};

export const Upload_File = (
  photoProps: UploadPhotoProps,
): Promise<axiosApiProps> => {
  return new Promise((resolve) =>
    resolve({
      method: "post",
      route: "uploads",
      requestType: "internal",
      logs: false,
      logId: "user_uploaded_a_file",
      errorToast: "Error subiendo archivo",
      successToast: `${
        photoProps.Type === "file"
          ? "Archivo procesado exitosamente"
          : "Imágen procesada exitosamente"
      }`,
      data: {
        FileList: photoProps.FileList,
        Type: photoProps.Type,
        Action: photoProps.Action,
        Description: photoProps.Description,
      },
    }),
  );
};

export const Save_Gabinet_Img = async (
  formData: FormData,
): Promise<axiosApiProps> => {
  return new Promise((resolve) => {
    resolve({
      method: "post",
      route: "imgs",
      requestType: "internal",
      logs: false,
      patientId: formData.get("patientId") as string,
      logId: "user_saved_a_gabinet_img",
      successToast: "Imágen agregada al expediente",
      errorToast: "Error subiendo imágen",
      data: {
        Name: formData.get("gabinetName") as string,
        Type: formData.get("gabinetSelect") as GabinetImgs,
        DateOfStudy: formData.get("gabinetDate") as string,
        Interpretation: formData.get("gabinetInterpretation") as string,
        Image: formData.get("0imgInputForGabinet") as string,
        patientId: formData.get("patientId") as string,
        diagnosisId: (formData.get("imagesDxId") as string)
          .split("|")[1]
          .trim(),
      },
    });
  });
};

export const Save_Gabinet_Img2 = async ({
  Name,
  Type,
  DateOfStudy,
  Interpretation,
  Image,
  patientId,
  diagnosisId,
  recordId,
}: GabinetImgPropsRequest): Promise<axiosApiProps> => {
  return new Promise((resolve) => {
    resolve({
      method: "post",
      route: "imgs",
      requestType: "internal",
      logs: false,
      patientId,
      logId: "user_saved_a_gabinet_img2",
      successToast: "Imágen agregada al expediente",
      errorToast: "Error subiendo imágen",
      data: {
        Name,
        Type,
        DateOfStudy,
        Interpretation,
        Image,
        patientId,
        diagnosisId,
        recordId,
      },
    });
  });
};

