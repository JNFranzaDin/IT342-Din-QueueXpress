export const OFFICES = ["Accounting", "ETO", "Clinic"];

const DEFAULT_COUNTERS = [
  "Counter 1",
  "Counter 2",
  "Counter 3",
  "Counter 4",
  "Counter 5",
  "Counter 6",
  "Counter 7",
  "Counter 8",
  "Counter 9",
  "Counter 10",
  "Counter A",
  "Counter B",
  "Counter C",
  "Counter D",
  "Counter E",
  "Counter F",
];

export const OFFICE_COUNTERS = {
  Accounting: DEFAULT_COUNTERS,
  ETO: DEFAULT_COUNTERS,
  Clinic: DEFAULT_COUNTERS,
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
