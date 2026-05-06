import {
  createInitialCounterTurn,
  createInitialOfficeNumbers,
  createInitialOfficeQueues,
} from "./queueConfig";

const QUEUE_STORAGE_KEY = "queuexpress.queue-state";

const createEmptyQueueState = () => ({
  officeQueues: createInitialOfficeQueues(),
  officeQueueNumbers: createInitialOfficeNumbers(),
  officeCounterTurn: createInitialCounterTurn(),
  activeOffice: "Accounting",
});

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
      officeQueues: parsedState.officeQueues || fallbackState.officeQueues,
      officeQueueNumbers: parsedState.officeQueueNumbers || fallbackState.officeQueueNumbers,
      officeCounterTurn: parsedState.officeCounterTurn || fallbackState.officeCounterTurn,
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