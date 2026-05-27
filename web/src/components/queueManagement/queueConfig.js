export const OFFICES = ["Accounting", "ETO", "Clinic"];

export const ACCOUNTING_NUMERICAL_COUNTERS = [
  "Counter 1",
  "Counter 2",
  "Counter 3",
  "Counter 4",
  "Counter 5",
  "Counter 6",
  "Counter 7",
  "Counter 8",
];

export const ACCOUNTING_ALPHABET_COUNTERS = ["Counter A", "Counter B", "Counter C", "Counter D", "Counter E"];

export const OFFICE_COUNTERS = {
  Accounting: [...ACCOUNTING_NUMERICAL_COUNTERS, ...ACCOUNTING_ALPHABET_COUNTERS],
  ETO: ["Counter 1", "Counter 2", "Counter 3", "Counter 4"],
  Clinic: ["Counter 1", "Counter 2", "Counter 3", "Counter 4"],
};

export const isAccountingNumericalPurpose = (purpose = "") => {
  const normalizedPurpose = purpose.trim().toLowerCase();
  return normalizedPurpose.includes("tuition") || normalizedPurpose.includes("vehicle sticker");
};

export const getAccountingCountersForPurpose = (purpose = "") =>
  isAccountingNumericalPurpose(purpose) ? ACCOUNTING_NUMERICAL_COUNTERS : ACCOUNTING_ALPHABET_COUNTERS;

export const getOfficeCountersForPurpose = (officeName, purpose = "") => {
  if (officeName === "Accounting") {
    return getAccountingCountersForPurpose(purpose);
  }

  return OFFICE_COUNTERS[officeName] || [];
};

export const selectLeastBusyCounter = (officeName, counters, officeQueues) => {
  if (!counters.length) {
    return null;
  }

  return counters.reduce((selectedCounter, currentCounter) => {
    if (!selectedCounter) {
      return currentCounter;
    }

    const selectedQueueLength = officeQueues?.[officeName]?.[selectedCounter]?.length ?? Number.POSITIVE_INFINITY;
    const currentQueueLength = officeQueues?.[officeName]?.[currentCounter]?.length ?? Number.POSITIVE_INFINITY;

    return currentQueueLength < selectedQueueLength ? currentCounter : selectedCounter;
  }, null);
};

export const createInitialOfficeStatus = () =>
  OFFICES.reduce((acc, office) => {
    acc[office] = {
      isOpen: true,
      openCounters: [...OFFICE_COUNTERS[office]],
    };
    return acc;
  }, {});

export const sortOfficeCounters = (officeName, counters) => {
  const officeCounters = OFFICE_COUNTERS[officeName] || [];
  return officeCounters.filter((counter) => counters.includes(counter));
};

export const createInitialOfficeQueues = () =>
  OFFICES.reduce((acc, office) => {
    acc[office] = OFFICE_COUNTERS[office].reduce((counterAcc, counter) => {
      counterAcc[counter] = [];
      return counterAcc;
    }, {});
    return acc;
  }, {});

export const createInitialOfficeNumbers = () =>
  OFFICES.reduce((acc, office) => {
    acc[office] = 1;
    return acc;
  }, {});

export const createInitialCounterTurn = () =>
  OFFICES.reduce((acc, office) => {
    acc[office] = 0;
    return acc;
  }, {});