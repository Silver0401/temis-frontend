"use client";

import ButtonCC from "@/components/Button-CC";
import InputCC from "@/components/Input-CC";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Add_Patient_To_Group,
  Create_Group,
  Delete_Entire_Group,
  Get_Group_Patients,
  Get_Patients_For_GIIS,
  Get_User_Groups,
  Get_User_Patients,
  Remove_Patient_From_Group,
  Search_One_Patient,
} from "@/e2e/server/FeathersAPI";
import {
  IsFirstDateWithTimeMoreRecentThanSecondDate,
  MongoDbIdDateAndTimeRetriever,
} from "@/scripts/Generator";
import { AnimatePresence } from "motion/react";
import ModalCC from "@/components/Modal-CC";
import ActionCC from "@/components/Action-CC";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import FormCC from "@/components/Form-CC";
import { Verify_Login } from "@/e2e/server/Queries";
import PatientLineDisplay from "@/library/Dashboard/PatientLineDisplay";
import { useMediaQuery } from "react-responsive";
import { toast } from "sonner";
import { DashboardContext } from "@/e2e/dashboardContext";
import LoaderCC from "@/components/Loader-CC";
import IconsCC from "@/assets/icons/IconsCC";

const getInitials = (name?: string) =>
  (name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "Dr";

const MyPatients = () => {
  const queryClient = useQueryClient();
  const { feathersFetchCC, getAccessToken, setGlobalModal } =
    useGlobalContext();
  const { goToDashboardPage, setShowPatient, showPatient, chRef } =
    useContext(DashboardContext);

  const isMobile = useMediaQuery({ query: "(max-width: 500px)" });

  const { isLoading: userLoading, data: userData } = useQuery(
    Verify_Login(getAccessToken()),
  );

  const [searchedPatients, setSearchedPatients] = useState<Patient[]>([]);

  const { isPending, isRefetching, data, refetch } = useQuery({
    queryFn: async () => {
      const req = await Get_User_Patients();
      return feathersFetchCC<{ patientsList: Patient[] }>(req);
    },
    queryKey: ["fetching_user_patients"],
  });

  const search_one_patient_mutation = useMutation({
    mutationFn: async (fullName: string) => {
      const req = await Search_One_Patient(fullName);
      return feathersFetchCC<{ patientsList: Patient[] }>(req);
    },
    onSuccess(data) {
      if (data.type === "success") {
        setSearchedPatients(data.data.patientsList);
      } else {
        toast.error(
          "No se enc<ontraron pacientes. Puedes intentar con nombreos y apellidos",
        );
      }
    },
  });

  const {
    isPending: groupsPending,
    isRefetching: refetchingGroups,
    data: groupsData,
    refetch: refetchGroups,
  } = useQuery({
    queryFn: async () => {
      const req = await Get_User_Groups(`${userData?.data.user._id}`);
      return feathersFetchCC<Group[]>(req);
    },
    queryKey: ["fetching_user_groups"],
  });

  const [searchType, setSearchType] = useState<"global" | "local">("local");

  const [patientIdToAdd, setPatientIdToAdd] = useState<Patient | undefined>(
    undefined,
  );
  const [folderToDelete, setFolderToDelete] = useState<string | undefined>(
    undefined,
  );

  const [formsLoading, setFormsLoading] = useState<boolean>(false);

  const [patientSearch, setPatientSearched] = useState<string | undefined>(
    undefined,
  );
  const [newGroupModalOpen, setNewGroupModalOpen] = useState<boolean>(false);

  const [folderSelected, setSelectedFolder] = useState<string | undefined>(
    undefined,
  );

  const { isPending: folderLoading, data: folderData } = useQuery({
    queryFn: async ({ queryKey }) => {
      const groupId = queryKey[1];
      if (groupId !== "undefined") {
        const req = await Get_Group_Patients(groupId ? groupId : "");
        return feathersFetchCC<Group>(req);
      }
    },
    refetchOnWindowFocus: false,
    enabled: folderSelected ? true : false,
    queryKey: [`fetching_group_patients`, `${folderSelected}`],
  });

  const filteredPatients = useMemo((): Array<PatientWithGroup> => {
    // Una carpeta recién creada llega sin `patients`, no con `patients` vacío:
    // la cadena directa reventaba con "Cannot read properties of undefined
    // (reading 'patientsList')" en cuanto se abría una carpeta con 0 pacientes.
    const patientList: PatientWithGroup[] = (folderSelected
      ? folderData?.data?.patients?.patientsList
      : data?.data?.patientsList) ?? [];

    // El grupo puede haberse borrado en otra pestaña y seguir seleccionado aquí,
    // así que el nombre se busca sin asumir que el filtro encuentra algo.
    const grupoActivo = folderSelected
      ? userData?.data?.user?.groups?.find((gp) => gp.id === folderSelected)
      : undefined;

    // Add To Patient Group
    const patientListWithGroup = patientList.map((px) => {
      return {
        ...px,
        group: {
          id: folderSelected ? folderSelected : undefined,
          name: grupoActivo?.name,
        },
      };
    });

    // Sort by Date
    patientListWithGroup.sort((patientA, patientB) => {
      const patientACreatedAt = MongoDbIdDateAndTimeRetriever(patientA._id);
      const patientBCreatedAt = MongoDbIdDateAndTimeRetriever(patientB._id);

      if (
        IsFirstDateWithTimeMoreRecentThanSecondDate(
          patientACreatedAt,
          patientBCreatedAt,
        )
      ) {
        return -1;
      } else if (
        !IsFirstDateWithTimeMoreRecentThanSecondDate(
          patientBCreatedAt,
          patientACreatedAt,
        )
      ) {
        return 1;
      } else {
        return 0;
      }
    });

    // If there is a text input in the search bar sort by...
    if (patientSearch) {
      const loweredPatientSearch = patientSearch.toLowerCase();
      // Sort by Name
      patientListWithGroup.sort((patientA, patientB) => {
        const patientAfullName =
          `${patientA.personalInfo.names} ${patientA.personalInfo.middleName} ${patientA.personalInfo.lastName}`.toLowerCase();
        const patientBfullName =
          `${patientB.personalInfo.names} ${patientB.personalInfo.middleName} ${patientB.personalInfo.lastName}`.toLowerCase();

        if (
          patientAfullName.includes(loweredPatientSearch) &&
          !patientBfullName.includes(loweredPatientSearch)
        ) {
          return -1;
        } else if (
          !patientAfullName.includes(loweredPatientSearch) &&
          patientBfullName.includes(loweredPatientSearch)
        ) {
          return 1;
        } else {
          return 0;
        }
      });

      // Sorty by Diagnostic
      // patientListWithGroup?.sort((patientA, patientB) => {
      //   const patientADiagnosis = patientA.diagnosis
      //     .map((dx) => dx.Name)
      //     .join(" ");
      //   const patientBDiagnosis = patientB.diagnosis
      //     .map((dx) => dx.Name)
      //     .join(" ");

      //   if (
      //     patientADiagnosis.includes(patientSearch) &&
      //     !patientBDiagnosis.includes(patientSearch)
      //   ) {
      //     return -1;
      //   } else if (
      //     !patientADiagnosis.includes(patientSearch) &&
      //     patientBDiagnosis.includes(patientSearch)
      //   ) {
      //     return 1;
      //   } else {
      //     return 0;
      //   }
      // });
    }

    return patientListWithGroup;

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, patientSearch, folderData]);

  const add_patient_to_group_mutation = useMutation({
    mutationFn: async (groupName: string) => {
      const groupId = userData?.data.user.groups.filter(
        (group) => group.name === groupName,
      )[0].id;
      if (groupId) {
        const req = await Add_Patient_To_Group(
          groupId.toString(),
          `${patientIdToAdd?._id}`,
          groupName,
          `${patientIdToAdd?.personalInfo.names} ${patientIdToAdd?.personalInfo.middleName}`,
        );
        return await feathersFetchCC(req);
      }
    },
    onSuccess: (_data, groupName) => {
      setFormsLoading(false);
      setNewGroupModalOpen(false);

      const groupId = userData?.data.user.groups.filter(
        (group) => group.name === groupName,
      )[0].id;

      if (groupId) {
        queryClient.refetchQueries({
          queryKey: ["fetching_group_patients", `${groupId}`],
        });
      }
    },
    mutationKey: ["add_patient_to_group_mutation"],
  });

  const remove_patient_from_group_mutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (folderSelected) {
        const req = await Remove_Patient_From_Group(folderSelected, patientId);
        return await feathersFetchCC(req);
      }
    },
    onSuccess: (_data) => {
      queryClient.refetchQueries({
        queryKey: ["fetching_group_patients", `${folderSelected}`],
      });
    },
    mutationKey: ["remove_patient_from_group_mutation"],
  });

  const delete_folder_mutation = useMutation({
    mutationFn: async (groupId: string) => {
      setFormsLoading(true);
      const req = await Delete_Entire_Group(groupId);
      return await feathersFetchCC(req);
    },
    onSuccess: (_data) => {
      setFormsLoading(false);
      setNewGroupModalOpen(false);
      refetchGroups();
      setFolderToDelete(undefined);
      setSelectedFolder(undefined);
    },
    mutationKey: ["delete_entire_group_mutation"],
  });

  const OpenFilterModal = () => {
    setGlobalModal({
      Component: (
        <div className="formModalMargin">
          <FormCC
            title={"Filtrar por Fechas"}
            colorSchema="night"
            subtitle={"Selecciona la fecha inicial y "}
            identifier={"FilterByDatesForm"}
            inputList={[
              {
                type: "date",
                identifier: "Date1",
                required: true,
                label: "Fecha Inicial",
              },
              {
                type: "date",
                identifier: "Date2",
                label: "Fecha Final",
                required: true,
              },
            ]}
            // onFeathersApiAction={}
          />
        </div>
      ),
      Settings: {
        size: "medium",
        identifier: "FilterPatientsModal",
        animation: "popUp",
      },
    });
  };

  const openFilterAndSearchDGIISModal = () => {
    setGlobalModal({
      Settings: {
        size: "medium",
        animation: "popUp",
        identifier: "FilterAndSearchDGIISModal",
      },
      Component: (
        <div className="formModalMargin">
          <FormCC
            title={"Reporte GIIS"}
            subtitle={"Filtra las fechas de las que quieres generar el reporte"}
            identifier={"GIISReportForm"}
            colorSchema="night"
            onFeathersApiAction={Get_Patients_For_GIIS}
            inputList={[
              {
                type: "date",
                identifier: "initialDate",
                label: "Fecha Inicial",
              },
              {
                type: "date",
                identifier: "finalDate",
                label: "Fecha Final",
              },
            ]}
          />
        </div>
      ),
    });
  };

  // On refetch, if a Patients file was previously opened, Open it again.
  useEffect(() => {
    if (!isRefetching) {
      setShowPatient((prevPatientData) => {
        if (prevPatientData) {
          const newPatient = data?.data.patientsList.filter(
            (patientData) => patientData._id === prevPatientData?._id,
          )[0];
          return newPatient;
        } else {
          return prevPatientData;
        }
      });
    } else {
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefetching, data]);

  useEffect(() => {
    if (searchType === "global" && patientSearch && patientSearch.length > 0) {
      search_one_patient_mutation.mutate(patientSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchType, patientSearch]);

  return (
    <section className="MyPatientsContainer">
      <div className="dashTopNav">
        <div className="docChip">
          <div className="docAvatar">
            {userData?.data.user.UID?.faceImg &&
            userData?.data.user.UID?.validity === "valid" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userData.data.user.UID.faceImg} alt="Doctor" />
            ) : (
              getInitials(userData?.data.user.name)
            )}
          </div>
          <div className="docMeta">
            <span className="docName">
              {userData?.data.user.name || "Doctor"}
            </span>
            <span className="docCedula">
              {userData?.data.user.medicalLicenses?.[0]?.id
                ? `Cédula ${userData.data.user.medicalLicenses[0].id}`
                : "Cédula —"}
            </span>
          </div>
        </div>

        <div className="searchInputsContainer">
          <ButtonCC
            type="Phantom"
            onClick={() =>
              setSearchType(searchType === "local" ? "global" : "local")
            }
            classname="searchGlobalButton"
            icon={
              searchType === "global" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM8.547 4.505a8.25 8.25 0 1 0 11.672 8.214l-.46-.46a2.252 2.252 0 0 1-.422-.586l-1.08-2.16a.414.414 0 0 0-.663-.107.827.827 0 0 1-.812.21l-1.273-.363a.89.89 0 0 0-.738 1.595l.587.39c.59.395.674 1.23.172 1.732l-.2.2c-.211.212-.33.498-.33.796v.41c0 .409-.11.809-.32 1.158l-1.315 2.191a2.11 2.11 0 0 1-1.81 1.025 1.055 1.055 0 0 1-1.055-1.055v-1.172c0-.92-.56-1.747-1.414-2.089l-.654-.261a2.25 2.25 0 0 1-1.384-2.46l.007-.042a2.25 2.25 0 0 1 .29-.787l.09-.15a2.25 2.25 0 0 1 2.37-1.048l1.178.236a1.125 1.125 0 0 0 1.302-.795l.208-.73a1.125 1.125 0 0 0-.578-1.315l-.665-.332-.091.091a2.25 2.25 0 0 1-1.591.659h-.18c-.249 0-.487.1-.662.274a.931.931 0 0 1-1.458-1.137l1.279-2.132Z"
                    clip-rule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-6"
                >
                  <path d="M21.721 12.752a9.711 9.711 0 0 0-.945-5.003 12.754 12.754 0 0 1-4.339 2.708 18.991 18.991 0 0 1-.214 4.772 17.165 17.165 0 0 0 5.498-2.477ZM14.634 15.55a17.324 17.324 0 0 0 .332-4.647c-.952.227-1.945.347-2.966.347-1.021 0-2.014-.12-2.966-.347a17.515 17.515 0 0 0 .332 4.647 17.385 17.385 0 0 0 5.268 0ZM9.772 17.119a18.963 18.963 0 0 0 4.456 0A17.182 17.182 0 0 1 12 21.724a17.18 17.18 0 0 1-2.228-4.605ZM7.777 15.23a18.87 18.87 0 0 1-.214-4.774 12.753 12.753 0 0 1-4.34-2.708 9.711 9.711 0 0 0-.944 5.004 17.165 17.165 0 0 0 5.498 2.477ZM21.356 14.752a9.765 9.765 0 0 1-7.478 6.817 18.64 18.64 0 0 0 1.988-4.718 18.627 18.627 0 0 0 5.49-2.098ZM2.644 14.752c1.682.971 3.53 1.688 5.49 2.099a18.64 18.64 0 0 0 1.988 4.718 9.765 9.765 0 0 1-7.478-6.816ZM13.878 2.43a9.755 9.755 0 0 1 6.116 3.986 11.267 11.267 0 0 1-3.746 2.504 18.63 18.63 0 0 0-2.37-6.49ZM12 2.276a17.152 17.152 0 0 1 2.805 7.121c-.897.23-1.837.353-2.805.353-.968 0-1.908-.122-2.805-.353A17.151 17.151 0 0 1 12 2.276ZM10.122 2.43a18.629 18.629 0 0 0-2.37 6.49 11.266 11.266 0 0 1-3.746-2.504 9.754 9.754 0 0 1 6.116-3.985Z" />
                </svg>
              )
            }
          />
          <InputCC
            type="text"
            identifier="SearchPatientsBar"
            debouncer={searchType === "global" ? true : false}
            onChange={(text) => {
              // if (searchType === "global" && text.length > 0) {
              //   search_one_patient_mutation.mutate(text);
              // }

              if (text === "") {
                setPatientSearched(undefined);
              } else {
                setPatientSearched(text);
              }
            }}
          />
        </div>

        <div className="headSpacer" />

        <div className="headActions">
          <ButtonCC
            onClick={() => refetch()}
            classname="refreshPatientsButton"
            type="Phantom"
            icon={IconsCC.Refresh}
          />
          <ButtonCC
            onClick={() => OpenFilterModal()}
            classname="filterButton"
            type="Phantom"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3.792 2.938A49.069 49.069 0 0 1 12 2.25c2.797 0 5.54.236 8.209.688a1.857 1.857 0 0 1 1.541 1.836v1.044a3 3 0 0 1-.879 2.121l-6.182 6.182a1.5 1.5 0 0 0-.439 1.061v2.927a3 3 0 0 1-1.658 2.684l-1.757.878A.75.75 0 0 1 9.75 21v-5.818a1.5 1.5 0 0 0-.44-1.06L3.13 7.938a3 3 0 0 1-.879-2.121V4.774c0-.897.64-1.683 1.542-1.836Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
          <ButtonCC
            onClick={() => openFilterAndSearchDGIISModal()}
            classname="openFilterAndSearchDGIISModal"
            type="Phantom"
            icon={IconsCC.DatabaseSearch}
          />
          <ButtonCC
            onClick={() => {}}
            classname="notifButton"
            type="Phantom"
            icon={
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.25 9a6.75 6.75 0 0 1 13.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 0 1-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 1 1-7.48 0 24.585 24.585 0 0 1-4.831-1.244.75.75 0 0 1-.298-1.205A8.217 8.217 0 0 0 5.25 9.75V9Zm4.502 8.9a2.25 2.25 0 1 0 4.496 0 25.057 25.057 0 0 1-4.496 0Z"
                  clipRule="evenodd"
                />
              </svg>
            }
          />
        </div>
      </div>

      <div className="viewTitleRow">
        <div className="viewTitleText">
          {folderSelected && folderData && (
            <ButtonCC
              type="Phantom"
              classname="folderBackBtn"
              icon={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.28 7.72a.75.75 0 0 1 0 1.06l-2.47 2.47H21a.75.75 0 0 1 0 1.5H4.81l2.47 2.47a.75.75 0 1 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 0 1 1.06 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              onClick={() => setSelectedFolder(undefined)}
            />
          )}
          <div className="titleTextBlock">
            <h2>
              {searchType === "global"
                ? "Búsqueda Global"
                : folderSelected && folderData
                  ? folderData.data.name
                  : "Mis Pacientes"}
            </h2>
            <p>
              {`${
                searchType === "global"
                  ? searchedPatients.length
                  : filteredPatients.length
              } ${
                (searchType === "global"
                  ? searchedPatients.length
                  : filteredPatients.length) === 1
                  ? "registro"
                  : "registros"
              }`}
            </p>
          </div>
        </div>
        {folderSelected && folderData && (
          <ButtonCC
            type="Phantom"
            classname="folderDeleteBtn"
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                  clipRule="evenodd"
                />
              </svg>
            }
            onClick={() => {
              setFolderToDelete(folderSelected);
              setNewGroupModalOpen(true);
            }}
          />
        )}
      </div>
      <div className="displayPatientsContainer">
        {isPending || isRefetching ? (
          <div className="PatientsLoaderContainer">
            <FancyLoader bg="translucid" />
          </div>
        ) : (
          <div
            className={`patientsContainer`}
            id={`LinearFlex`}
            style={{
              height:
                showPatient && isMobile && chRef && chRef.current?.offsetHeight
                  ? `${chRef.current?.offsetHeight - 250}px`
                  : "auto",
              opacity: showPatient ? 0 : 1,
            }}
          >
            {/* Global Patient Search */}
            {searchType === "global" ? (
              <>
                {search_one_patient_mutation.isPending ? (
                  <div className="PatientsMiniLoaderContainer">
                    <FancyLoader bg="translucid" />
                  </div>
                ) : searchedPatients.length === 0 ? (
                  <ActionCC
                    id="GlobalSearchLottie"
                    emptyIcon={IconsCC.DatabaseSearch}
                    text="El buscador global busca pacientes por nombre en toda la base de datos de cronos. Los resultados apareceran aquí."
                    button=""
                    onClick={() => {}}
                  />
                ) : (
                  <>
                    {searchedPatients.map((patient, index) => {
                      return (
                        <PatientLineDisplay
                          key={`${patient.LUID} ${index}`}
                          patient={patient}
                          searchedWord={patientSearch}
                          onAddPatientToGroup={() => {
                            setPatientIdToAdd(patient);
                            setNewGroupModalOpen(true);
                          }}
                          onClick={() => {
                            setShowPatient(patient);
                            if (isMobile) {
                              window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }}
                        />
                      );
                    })}
                  </>
                )}
              </>
            ) : (
              // Default Patient Search
              // Loading Patients
              <>
                {userLoading || (folderSelected && folderLoading) ? (
                  <div className="PatientsMiniLoaderContainer">
                    <FancyLoader bg="translucid" />
                  </div>
                ) : // Folder Patients Interphase
                folderData && folderSelected ? (
                  // Top Folder Container Search
                  <>
                    {filteredPatients.length === 0 && (
                      <ActionCC
                        text="No hay pacientes en esta carpeta"
                        button="Regresar"
                        onClick={() => setSelectedFolder(undefined)}
                        style={{ height: "400px" }}
                      />
                    )}

                    {/* Patients List Inside Folder Selected */}
                    {filteredPatients.map((patient, index) => {
                      return (
                        <PatientLineDisplay
                          key={`${patient.LUID} ${index}`}
                          patient={patient}
                          searchedWord={patientSearch}
                          onAddPatientToGroup={() => {
                            setPatientIdToAdd(patient);
                            setNewGroupModalOpen(true);
                          }}
                          onRemovePatientFromGroup={() => {
                            remove_patient_from_group_mutation.mutate(
                              patient._id,
                            );
                          }}
                          onClick={() => {
                            setShowPatient(patient);
                            if (isMobile) {
                              window.scrollTo({
                                top: 0,
                                behavior: "smooth",
                              });
                            }
                          }}
                        />
                      );
                    })}
                  </>
                ) : (
                  // Patients Central List
                  <>
                    <div className="RecentlyTitle">
                      <span className="line" />
                      <p>{"Mis Folders"}</p>
                    </div>
                    <div className="foldersContainer">
                      <div className="foldersInnerContainer">
                        <ButtonCC
                          onClick={() => setNewGroupModalOpen(true)}
                          classname="plusSearchButton"
                          icon={IconsCC.AddFolder}
                          type="Phantom"
                        />

                        {groupsPending || refetchingGroups ? (
                          <div className="foldersLoader">
                            <LoaderCC />
                          </div>
                        ) : groupsData?.data.length === 0 ? (
                          userData?.data.user.groups.length === 0 ? (
                            <p className="noFoldersText">
                              {"Crea Folders para Organizar a tus Pacientes"}
                            </p>
                          ) : (
                            userData?.data.user.groups.map((group) => {
                              return (
                                <div
                                  key={group.id}
                                  className="groupFolder"
                                  onClick={() => setSelectedFolder(group.id)}
                                >
                                  <p>{group.name}</p>
                                </div>
                              );
                            })
                          )
                        ) : (
                          groupsData?.data.map((group) => {
                            return (
                              <div
                                key={group._id}
                                className="groupFolder"
                                onClick={() => setSelectedFolder(group._id)}
                              >
                                <p>{group.name}</p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {filteredPatients.length === 0 ? (
                      <ActionCC
                        text="Aun no tienes Pacientes"
                        button="Agrega un Nuevo Paciente"
                        style={{ height: "350px" }}
                        onClick={() => goToDashboardPage("New Patient")}
                      />
                    ) : (
                      <AnimatePresence mode={"popLayout"}>
                        <div className="RecentlyTitle">
                          <span className="line" />
                          <p>{"Vistos Recientemente"}</p>
                        </div>
                        {filteredPatients.map((patient, index) => {
                          return (
                            <PatientLineDisplay
                              key={`${patient.LUID} ${index}`}
                              patient={patient}
                              searchedWord={patientSearch}
                              onAddPatientToGroup={() => {
                                setPatientIdToAdd(patient);
                                setNewGroupModalOpen(true);
                              }}
                              onClick={() => {
                                setShowPatient(patient);
                                if (isMobile) {
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }
                              }}
                            />
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <ModalCC
        size={folderToDelete ? "small" : "medium"}
        identifier="newGroupModal"
        onModalClose={() => {
          if (patientIdToAdd) setPatientIdToAdd(undefined);
          if (folderToDelete) setFolderToDelete(undefined);
        }}
        animation="popUp"
        useStates={{
          setState: setNewGroupModalOpen,
          state: newGroupModalOpen,
        }}
      >
        <div className="newGroupModalFormContainer">
          {folderToDelete ? (
            <FormCC
              title="Borrar Folder"
              colorSchema="night"
              subtitle={"Estar seguro que quieres elminiar el folder?"}
              identifier="deleteGroupModalForm"
              onSubmit={() => {
                delete_folder_mutation.mutate(folderToDelete);
              }}
              inputList={[]}
              submitButtonStyles={{
                text: "Eliminar",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                ),
              }}
            />
          ) : patientIdToAdd ? (
            <FormCC
              identifier="AddUserToGroupForm"
              title="Agregar a Folder"
              colorSchema="night"
              subtitle={
                "Selecciona el folder al que quieres agregar a este paciente"
              }
              onSubmit={(formData) => {
                setFormsLoading(true);
                const groupName = formData.get("groupName") as string;
                add_patient_to_group_mutation.mutate(groupName);
              }}
              buttonLoading={formsLoading || groupsPending || refetchingGroups}
              inputList={[
                {
                  type: "select",
                  options: groupsData?.data?.map((group) => group.name),
                  identifier: "groupName",
                  required: true,
                },
              ]}
            />
          ) : (
            <FormCC
              title="Nuevo Folder"
              colorSchema="night"
              subtitle={
                "Un folder te ayuda a seccionar, organizar y compartir pacientes"
              }
              onSuccess={() => {
                refetchGroups();
                setNewGroupModalOpen(false);
              }}
              identifier="newGroupModalForm"
              onFeathersApiAction={Create_Group}
              inputList={[
                {
                  type: "text",
                  identifier: "groupName",
                  placeholder: "Nombre del Folder",
                },
              ]}
              buttonLoading={formsLoading}
              submitButtonStyles={{
                text: "Crear Folder",
                icon: (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19.5 21a3 3 0 0 0 3-3V9a3 3 0 0 0-3-3h-5.379a.75.75 0 0 1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H4.5a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h15Zm-6.75-10.5a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V10.5Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                ),
              }}
            />
          )}
        </div>
      </ModalCC>
    </section>
  );
};

export default MyPatients;
