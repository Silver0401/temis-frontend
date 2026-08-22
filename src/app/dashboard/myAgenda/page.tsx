"use client";

import React, { useContext, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import esLocale from "@fullcalendar/core/locales/es";
import { useMediaQuery } from "react-responsive";
import ModalCC from "@/components/Modal-CC";
import PatientSearchCC from "@/components/PatientSearch-CC";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Get_User_Agenda,
  Add_Patient_To_Agenda,
  Modify_Agenda_Event,
  Delete_Agenda_Event,
  Get_User_Patients,
} from "@/e2e/server/FeathersAPI";
import { GlobalContext, useGlobalContext } from "@/e2e/globalContext";
import FancyLoader from "@/library/Generics/Loaders/FancyLoader";
import LoaderCC from "@/components/Loader-CC";
import { DashboardContext } from "@/e2e/dashboardContext";
import ButtonCC from "@/components/Button-CC";

const MyAgenda = () => {
  const { feathersFetchCC } = useGlobalContext();
  const { setShowPatient } = useContext(DashboardContext);
  const isMobile = useMediaQuery({ query: "(max-width: 800px)" });
  const [eventIDToDelete, setEventIDToDelete] = useState<string | undefined>(
    undefined,
  );
  const calendarRef = React.useRef<FullCalendar>(null);
  const [CalendarModalOpen, setCalendarModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"day" | "month" | "week">("month");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [dateSelected, setDateSelected] = useState<
    | {
        startDate: Date;
        endDate: Date | "Invalid Date";
      }
    | undefined
  >(undefined);

  const { data: patientsData } = useQuery({
    queryFn: async () => {
      const req = await Get_User_Patients();
      return feathersFetchCC<{ patientsList: Patient[] }>(req);
    },
    refetchOnWindowFocus: false,
    queryKey: ["fetching_user_patients"],
  });

  const { isPending, data, refetch } = useQuery({
    queryFn: async () => {
      const req = await Get_User_Agenda();
      return feathersFetchCC<Array<Agenda>>(req);
    },
    refetchOnWindowFocus: false,
    queryKey: ["fetching_user_agenda"],
  });

  const events = useMemo(() => {
    if (data?.data && data?.data?.length > 0) {
      return (data.data[0].appointments ?? []).map((appointment) => {
        return {
          title: `${appointment.patientName} | ${appointment.patientId}`,
          date: new Date(appointment.startDate),
          end:
            appointment.endDate === "Invalid Date"
              ? undefined
              : new Date(appointment.endDate),
          id: appointment.id,
        };
      });
    } else return [];
  }, [data]);

  // Color determinista por paciente (cyan / blue / purple) — el modelo de
  // citas no trae categoría, así que derivamos el acento del patientId.
  const APPT_COLORS = ["c", "b", "p"] as const;
  const colorForId = (id: string) =>
    APPT_COLORS[
      [...(id || "")].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 3
    ];

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const apptsRaw = data?.data?.[0]?.appointments ?? [];

  const apptsForDay = (day: Date) =>
    apptsRaw
      .map((a) => ({ ...a, _start: new Date(a.startDate) }))
      .filter((a) => !isNaN(a._start.getTime()) && sameDay(a._start, day))
      .sort((x, y) => x._start.getTime() - y._start.getTime());

  const nextDay = useMemo(() => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + 1);
    return d;
  }, [selectedDay]);

  const primaryAppts = apptsForDay(selectedDay);
  const secondaryAppts = apptsForDay(nextDay);

  const fmtHead = (d: Date) => {
    const label = d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
    });
    return sameDay(d, new Date()) ? `Hoy · ${label}` : label;
  };
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const changeView = (mode: "day" | "month" | "week") => {
    setViewMode(mode);
    const api = calendarRef.current?.getApi();
    api?.changeView(
      mode === "day"
        ? "timeGridDay"
        : mode === "week"
          ? "timeGridWeek"
          : "dayGridMonth",
    );
  };

  const openPatientById = (patientId: string) => {
    const patient = patientsData?.data.patientsList.find(
      (p) => p._id === patientId,
    );
    setShowPatient(patient);
  };

  const openNewAppointment = () => {
    setEventIDToDelete(undefined);
    setDateSelected({ startDate: selectedDay, endDate: "Invalid Date" });
    setCalendarModalOpen(true);
  };

  const TrashIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-6"
    >
      <path
        fillRule="evenodd"
        d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
        clipRule="evenodd"
      />
    </svg>
  );

  const renderAppt = (a: AppointmentWithId & { _start: Date }) => (
    <div className="appt" key={a.id}>
      <div className="appt-time mono">{fmtTime(a._start)}</div>
      <div className={`appt-bar ${colorForId(a.id)}`} />
      <div className="appt-body" onClick={() => openPatientById(a.patientId)}>
        <div className="at">{a.patientName}</div>
        <div className="as">{`ID ${a.patientId}`}</div>
      </div>
      <div
        className="apptTrash"
        onClick={() => {
          setEventIDToDelete(a.id);
          setCalendarModalOpen(true);
        }}
      >
        <TrashIcon />
      </div>
    </div>
  );

  const add_patient_to_agenda_mutation = useMutation({
    mutationFn: async (patientIdAndName: string) => {
      // `data.data[0]` estaba sin guarda: mientras no existía el documento de
      // agenda, elegir paciente lanzaba un TypeError y la petición nunca salía
      // —el modal se quedaba quieto sin error visible—. El backend ya crea la
      // agenda a demanda; esta guarda evita además mandar "undefined" si la
      // consulta todavía no ha resuelto.
      const agendaId = data?.data?.[0]?._id;
      if (!agendaId) {
        throw new Error("Todavía no se carga tu agenda, intenta de nuevo");
      }

      const req = await Add_Patient_To_Agenda({
        startDate: `${dateSelected?.startDate?.toLocaleString()}`,
        endDate: `${dateSelected?.endDate?.toLocaleString()}`,
        patientId: patientIdAndName.split("|")[1].trim(),
        agendaId: `${agendaId}`,
        patientName: patientIdAndName.split("|")[0].trim(),
      });
      return feathersFetchCC<Array<Agenda>>(req);
    },
    mutationKey: ["add_patient_to_agenda"],
    onSettled: (data) => {
      if (data?.type === "success") {
        refetch();
        setCalendarModalOpen(false);
      }
    },
  });

  const modify_agenda_event_mutation = useMutation({
    mutationFn: async (changedEventData: AppointmentWithId) => {
      const req = await Modify_Agenda_Event(changedEventData);

      return feathersFetchCC<Array<Agenda>>(req);
    },
    mutationKey: ["modify_agenda_event"],
  });

  const delete_agenda_event_mutation = useMutation({
    mutationFn: async () => {
      if (!eventIDToDelete) return;

      const event = data?.data[0].appointments.filter((appointment) => {
        return appointment.id === eventIDToDelete;
      })[0];

      if (!event) return;
      const req = await Delete_Agenda_Event({
        ...event,
        agendaId: `${data?.data[0]._id}`,
      });
      return feathersFetchCC<Array<Agenda>>(req);
    },
    onSettled: (data) => {
      if (data?.type === "success") {
        refetch();
        setCalendarModalOpen(false);
        setEventIDToDelete(undefined);
      }
    },
    mutationKey: ["delete_agenda_event"],
  });

  const renderEventContent = (eventInfo: any) => {
    // En vista mes solo mostramos un dot de color (estilo mockup LP-11).
    if (eventInfo.view.type === "dayGridMonth") {
      return (
        <span className={`cal-ev ${colorForId(eventInfo.event.id || "")}`} />
      );
    }
    return (
      <>
        <b>{eventInfo.timeText}</b>
        <i>{eventInfo.event.title.split("|")[0].trim()}</i>

        <div
          className="eventClicker"
          onClick={() => {
            const PatientFiltered = patientsData?.data.patientsList.filter(
              (patient) => {
                return (
                  patient._id === eventInfo.event.title.split("|")[1].trim()
                );
              },
            )[0];
            setShowPatient(PatientFiltered);
          }}
        />

        <div
          className="trashCont"
          onClick={() => {
            setEventIDToDelete(eventInfo.event._def.publicId);
            setCalendarModalOpen(true);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="size-6"
          >
            <path
              fillRule="evenodd"
              d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
              clip-rule="evenodd"
            />
          </svg>
        </div>
      </>
    );
  };

  return (
    <section className="MyAgendaContainer">
      {isPending ? (
        <FancyLoader bg="translucid" />
      ) : (
        <>
          <div className="AgendaTopBar">
            <div className="v-title">
              <h2>Mi Agenda</h2>
              <span className="sub">{`${apptsRaw.length} citas`}</span>
            </div>
            <div className="cal-view-toggle">
              <button
                className={viewMode === "day" ? "on" : ""}
                onClick={() => changeView("day")}
              >
                Día
              </button>
              <button
                className={viewMode === "month" ? "on" : ""}
                onClick={() => changeView("month")}
              >
                Mes
              </button>
              <button
                className={viewMode === "week" ? "on" : ""}
                onClick={() => changeView("week")}
              >
                Semana
              </button>
            </div>
          </div>

          <div className="AgendaLayout">
            <div className="CalendarContainer">
              <FullCalendar
                ref={calendarRef}
                allDaySlot={false}
                weekends
                editable
                nowIndicator
                stickyHeaderDates
                dayMaxEvents={3}
                locale={esLocale}
                initialView="dayGridMonth"
                height={isMobile ? "1200px" : "100%"}
                eventContent={renderEventContent}
              eventChange={(eventChangeInfo) => {
                const event = data?.data[0].appointments.filter(
                  (appointment) => {
                    return (
                      appointment.id === eventChangeInfo.event._def.publicId
                    );
                  },
                )[0];

                if (!event) return;

                const newEvent: AppointmentWithId = {
                  ...event,
                  startDate: `${eventChangeInfo.event.start?.toLocaleString()}`,
                  endDate: `${eventChangeInfo.event.end?.toLocaleString()}`,
                  agendaId: `${data?.data[0]._id}`,
                };

                modify_agenda_event_mutation.mutate(newEvent);
              }}
              dateClick={(dateInfo) => {
                setSelectedDay(dateInfo.date);
              }}
              events={events}
              plugins={[
                dayGridPlugin,
                interactionPlugin,
                timeGridPlugin,
                listPlugin,
              ]}
              headerToolbar={{
                left: "prev,next",
                center: "title",
                right: "today",
              }}
              />
            </div>

            <aside className="AgendaSide">
              <div className="agenda-head">
                <span className="t">{fmtHead(selectedDay)}</span>
                <span className="badge mono">{`${primaryAppts.length} citas`}</span>
                <button
                  className="addAppt"
                  onClick={openNewAppointment}
                  aria-label="Nueva cita"
                >
                  +
                </button>
              </div>

              <div className="AgendaSideInner" key={selectedDay.toDateString()}>
                <div className="agenda-list">
                  {primaryAppts.length > 0 ? (
                    primaryAppts.map(renderAppt)
                  ) : (
                    <p className="agenda-empty">Sin citas este día</p>
                  )}
                </div>

                {secondaryAppts.length > 0 && (
                  <>
                    <div className="agenda-divider">
                      <span className="ln" />
                      <span className="lb mono">{fmtHead(nextDay)}</span>
                      <span className="ln" />
                    </div>
                    <div className="agenda-list">
                      {secondaryAppts.map(renderAppt)}
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>

          <ModalCC
            size={"small"}
            identifier="calendarModal"
            animation="popUp"
            onModalClose={() => {
              if (eventIDToDelete) {
                setEventIDToDelete(undefined);
              }
            }}
            useStates={{
              setState: setCalendarModalOpen,
              state: CalendarModalOpen,
            }}
          >
            {add_patient_to_agenda_mutation.isPending ||
            delete_agenda_event_mutation.isPending ? (
              <LoaderCC schema="night" />
            ) : eventIDToDelete ? (
              <div className="CalendarModalWrapper">
                <h3 className="titleCal">{"Borrar Cita"}</h3>
                <p className="subtitleCal">{`Estas seguro que quieres borrar la cita de ${events
                  ?.filter((eventData) => {
                    return eventData.id === eventIDToDelete;
                  })[0]
                  .title.split("|")[0]
                  .trim()}`}</p>
                <ButtonCC
                  type="Solid" size="lg"
                  onClick={() => delete_agenda_event_mutation.mutate()}
                  text="Borrar Cita "
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="size-6"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  }
                />
              </div>
            ) : (
              <div className="CalendarModalWrapper">
                <h3 className="titleCal">{"Nueva Cita"}</h3>
                <p className="subtitleCal">{`Fecha: ${dateSelected?.startDate?.toLocaleString()}`}</p>
                <PatientSearchCC
                  onPatientSelect={(patientData) => {
                    add_patient_to_agenda_mutation.mutate(
                      patientData.idAndName,
                    );
                  }}
                  colorSchema="night"
                />
              </div>
            )}
          </ModalCC>
        </>
      )}
    </section>
  );
};

export default MyAgenda;
