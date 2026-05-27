import {
  createInitialCounterTurn,
  createInitialOfficeNumbers,
  createInitialOfficeQueues,
  createInitialOfficeStatus,
  OFFICE_COUNTERS,
} from "./queueConfig";

const QUEUE_STORAGE_KEY = "queuexpress.queue-state";

const createInitialTicketState = () => ({
  ticketDirectory: {},
  userProfiles: {},
  nextTicketNumber: 101,
});

const createEmptyQueueState = () => ({
  officeQueues: createInitialOfficeQueues(),
  officeQueueNumbers: createInitialOfficeNumbers(),
  officeCounterTurn: createInitialCounterTurn(),
  officeStatus: createInitialOfficeStatus(),
  ticketState: createInitialTicketState(),
  activeOffice: "Accounting",
});

const normalizeLoadedOfficeQueues = (parsedOfficeQueues = {}) =>
  Object.fromEntries(
    Object.entries(createInitialOfficeQueues()).map(([officeName, officeCounters]) => [
      officeName,
      Object.fromEntries(
        Object.keys(officeCounters).map((counterName) => [counterName, parsedOfficeQueues?.[officeName]?.[counterName] || []])
      ),
    ])
  );

const normalizeLoadedOfficeStatus = (parsedOfficeStatus = {}) =>
  Object.fromEntries(
    Object.entries(createInitialOfficeStatus()).map(([officeName, officeRecord]) => {
      const parsedRecord = parsedOfficeStatus?.[officeName] || {};
      const parsedOpenCounters = Array.isArray(parsedRecord.openCounters) ? parsedRecord.openCounters : null;
      const filteredOpenCounters = (parsedOpenCounters || officeRecord.openCounters || []).filter((counterName) =>
        OFFICE_COUNTERS[officeName].includes(counterName)
      );
      const openCounters =
        parsedOpenCounters && parsedOpenCounters.length > 0 && filteredOpenCounters.length === 0
          ? [...officeRecord.openCounters]
          : filteredOpenCounters;

      return [
        officeName,
        {
          isOpen: typeof parsedRecord.isOpen === "boolean" ? parsedRecord.isOpen : officeRecord.isOpen,
          openCounters,
        },
      ];
    })
  );

const normalizeLoadedUserProfiles = (parsedUserProfiles = {}, parsedTicketDirectory = {}) =>
  Object.fromEntries(
    Object.entries(parsedUserProfiles).map(([userId, profile]) => {
      const activeTicketsSource = profile.activeTickets || (profile.activeTicket?.officeName ? { [profile.activeTicket.officeName]: profile.activeTicket } : {});
      const activeTickets = Object.fromEntries(
        Object.entries(activeTicketsSource).filter(([_, ticketRecord]) => {
          if (!ticketRecord?.ticket) {
            return false;
          }

          const directoryRecord = parsedTicketDirectory?.[ticketRecord.ticket];
          return directoryRecord?.status !== "removed";
        })
      );

      const activeTicket = Object.values(activeTickets)[0] || null;

      return [
        userId,
        {
          ...profile,
          activeTickets,
          activeTicket,
        },
      ];
    })
  );

const resolveNextTicketNumber = (parsedTicketState = {}) => {
  if (Number.isInteger(parsedTicketState.nextTicketNumber) && parsedTicketState.nextTicketNumber >= 101) {
    return parsedTicketState.nextTicketNumber;
  }

  const existingNumbers = Object.keys(parsedTicketState.ticketDirectory || {})
    .map((ticket) => Number.parseInt(ticket, 10))
    .filter((ticketNumber) => Number.isInteger(ticketNumber) && ticketNumber >= 101);

  if (existingNumbers.length === 0) {
    return 101;
  }

  return Math.max(...existingNumbers) + 1;
};

export const loadQueueState = () => {
  if (typeof window === "undefined") {
    return createEmptyQueueState();
  }

  try {
    const storedState = window.localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!storedState) {
      return createEmptyQueueState();
    }

    const parsedState = JSON.parse(storedState);
    const fallbackState = createEmptyQueueState();

    return {
      officeQueues: normalizeLoadedOfficeQueues(parsedState.officeQueues || fallbackState.officeQueues),
      officeQueueNumbers: parsedState.officeQueueNumbers || fallbackState.officeQueueNumbers,
      officeCounterTurn: parsedState.officeCounterTurn || fallbackState.officeCounterTurn,
      officeStatus: normalizeLoadedOfficeStatus(parsedState.officeStatus || fallbackState.officeStatus),
      ticketState: {
        ticketDirectory: parsedState.ticketState?.ticketDirectory || fallbackState.ticketState.ticketDirectory,
        userProfiles: normalizeLoadedUserProfiles(
          parsedState.ticketState?.userProfiles || fallbackState.ticketState.userProfiles,
          parsedState.ticketState?.ticketDirectory || fallbackState.ticketState.ticketDirectory
        ),
        nextTicketNumber: resolveNextTicketNumber(parsedState.ticketState || fallbackState.ticketState),
      },
      activeOffice: parsedState.activeOffice || fallbackState.activeOffice,
    };
  } catch (error) {
    return createEmptyQueueState();
  }
};

export const persistQueueState = (queueState) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queueState));
};