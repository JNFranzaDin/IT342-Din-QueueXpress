import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import AuthPage from "./components/auth/AuthPage";
import AdminPage from "./components/admin/AdminPage";
import DashboardPage from "./components/dashboard/DashboardPage";
import StaffPage from "./components/staff/StaffPage";
import {
  OFFICE_COUNTERS,
  OFFICES,
  getOfficeCountersForPurpose,
  sortOfficeCounters,
} from "./components/queueManagement/queueConfig";
import { loadQueueState, persistQueueState } from "./components/queueManagement/queueState";
import { API_BASE, postJson, toReadableError } from "./lib/apiClient";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
const ADMIN_EMAIL = (process.env.REACT_APP_ADMIN_EMAIL || "queuexpressadmin@gmail.com").trim().toLowerCase();
const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || "queuexpress123";

const getUserRole = (nextUser) => {
  const rawRole = (nextUser?.role || nextUser?.user_metadata?.role || "").toString();
  const norm = rawRole.trim().toUpperCase();
  if (norm === "ADMIN" || norm === "ADMINISTRATOR") return "ADMIN";
  if (norm === "STAFF") return "STAFF";
  // fallback to configured admin email
  if ((nextUser?.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase()) return "ADMIN";
  return "USER";
};

const isAdminUser = (nextUser) => getUserRole(nextUser) === "ADMIN";
const isStaffUser = (nextUser) => getUserRole(nextUser) === "STAFF";
const getLandingScreenForUser = (nextUser) => {
  if (isAdminUser(nextUser)) return "admin";
  if (isStaffUser(nextUser)) return "staff";
  return "office";
};

const createLocalAdminUser = () => ({
  userId: "local-admin",
  name: "QueueXpress Admin",
  email: ADMIN_EMAIL,
  role: "ADMIN",
});

const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) return null;

  const userName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split("@")[0] ||
    "User";

  // prefer role stored in user_metadata (e.g., from registration), normalize to ADMIN/USER
  const metaRole = supabaseUser.user_metadata?.role || supabaseUser.user_metadata?.role?.toString?.();

  return {
    userId: supabaseUser.id,
    name: userName,
    email: supabaseUser.email || "",
    role: metaRole || undefined,
    office: supabaseUser.user_metadata?.office || null,
  };
};

const deriveActiveTicketsFromDirectory = (ticketDirectory = {}, userId = "") =>
  Object.fromEntries(
    Object.entries(ticketDirectory)
      .filter(([, details]) => details?.userId === userId && details?.status !== "removed")
      .map(([ticketNumber, details]) => [details.officeName, { ticket: details.ticket || ticketNumber, ...details }])
  );

const createEmptyUserProfile = () => ({
  activeTicket: null,
  activeTickets: {},
  notifications: [],
});

const EMPTY_USER_PROFILE = createEmptyUserProfile();

function App() {
  const registerFlowRef = useRef(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("auth");
  const [userSection, setUserSection] = useState("home");
  const [queueState, setQueueState] = useState(() => loadQueueState());
  const { activeOffice, officeQueues, officeCounterTurn, officeStatus, ticketState } = queueState;

  const currentUserId = user?.userId || user?.email || "";
  const currentUserProfile = ticketState?.userProfiles?.[currentUserId] || EMPTY_USER_PROFILE;
  const directoryActiveTickets = useMemo(
    () => deriveActiveTicketsFromDirectory(ticketState?.ticketDirectory, currentUserId),
    [ticketState?.ticketDirectory, currentUserId]
  );
  const activeTickets = useMemo(
    () => ({
      ...(currentUserProfile.activeTickets || {}),
      ...directoryActiveTickets,
    }),
    [currentUserProfile.activeTickets, directoryActiveTickets]
  );
  const currentTicket = activeTickets[activeOffice] || currentUserProfile.activeTicket || null;
  const unreadNotifications = (currentUserProfile.notifications || []).filter((item) => !item.read && !item.removed).length;

  const managedOffices = useMemo(() => {
    if (!user) {
      return [];
    }

    if (isAdminUser(user)) {
      return OFFICES;
    }

    if (isStaffUser(user)) {
      const normalizedOffice = (user.office || "").toString().trim();
      return OFFICES.includes(normalizedOffice) ? [normalizedOffice] : [];
    }

    return [];
  }, [user]);

  const canManageOffice = (officeName) => managedOffices.includes(officeName);

  const getOpenCounters = (officeName, nextOfficeStatus = officeStatus) => {
    const officeRecord = nextOfficeStatus?.[officeName];
    if (!officeRecord?.isOpen) {
      return [];
    }

    return sortOfficeCounters(officeName, officeRecord.openCounters || []);
  };

  const updateOfficeStatus = (updater) => {
    setQueueState((prev) => ({
      ...prev,
      officeStatus: updater(prev.officeStatus),
    }));
  };

  const updateCurrentUserProfile = useCallback((updater) => {
    setQueueState((prev) => {
      const existingProfile = prev.ticketState?.userProfiles?.[currentUserId] || createEmptyUserProfile();

      return {
        ...prev,
        ticketState: {
          ...prev.ticketState,
          userProfiles: {
            ...prev.ticketState.userProfiles,
            [currentUserId]: updater(existingProfile),
          },
        },
      };
    });
  }, [currentUserId]);

  const pushNotification = (profile, notification) => ({
    ...profile,
    notifications: [notification, ...(profile.notifications || [])].slice(0, 50),
  });

  const buildNotification = (ticket, officeName, counterName, type, message) => ({
    id: `${type}-${ticket}-${Date.now()}`,
    type,
    ticket,
    officeName,
    counterName,
    message,
    read: false,
    createdAt: Date.now(),
  });

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setScreen("auth");
      setUserSection("home");
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const activeUser = mapSupabaseUser(data.session?.user);
      if (activeUser) {
        setUser(activeUser);
        setScreen(getLandingScreenForUser(activeUser));
        setUserSection("home");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (registerFlowRef.current) {
        return;
      }

      const activeUser = mapSupabaseUser(session?.user);
      if (activeUser) {
        setUser(activeUser);
        setScreen(getLandingScreenForUser(activeUser));
        setUserSection("home");
      } else {
        setUser(null);
        setScreen("auth");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    persistQueueState(queueState);
  }, [queueState]);

  useEffect(() => {
    const ticketsToTrack = Object.values(activeTickets);
    if (ticketsToTrack.length === 0) {
      return;
    }
    // Persist 'served' status into ticketDirectory for any ticket that is now at the front
    const ticketsNowAtCounter = ticketsToTrack.filter((ticketRecord) => {
      if (!ticketRecord?.ticket || !ticketRecord?.officeName || !ticketRecord?.counterName) {
        return false;
      }
      const activeOfficeTickets = officeQueues?.[ticketRecord.officeName]?.[ticketRecord.counterName] || [];
      return activeOfficeTickets[0] === ticketRecord.ticket;
    });

    if (ticketsNowAtCounter.length > 0) {
      setQueueState((prev) => {
        const nextDirectory = { ...(prev.ticketState.ticketDirectory || {}) };
        ticketsNowAtCounter.forEach((t) => {
          const key = String(t.ticket);
          const existing = nextDirectory[key] || {};
          if ((existing.status || "").toString().toLowerCase() === "served") return;
          nextDirectory[key] = {
            ...existing,
            ticket: key,
            officeName: t.officeName,
            counterName: t.counterName,
            status: "served",
          };
        });

        return {
          ...prev,
          ticketState: {
            ...prev.ticketState,
            ticketDirectory: nextDirectory,
          },
        };
      });
    }

    updateCurrentUserProfile((profile) => {
      const notifications = profile.notifications || [];
      const nextNotifications = [...notifications];
      const nextActiveTickets = { ...(profile.activeTickets || {}) };

      ticketsToTrack.forEach((ticketRecord) => {
        if (!ticketRecord?.ticket || !ticketRecord?.officeName || !ticketRecord?.counterName) {
          return;
        }

        const activeOfficeTickets = officeQueues?.[ticketRecord.officeName]?.[ticketRecord.counterName] || [];
        if (activeOfficeTickets[0] !== ticketRecord.ticket) {
          return;
        }

        const alreadyNotified = nextNotifications.some((item) => item.type === "served" && item.ticket === ticketRecord.ticket);
        if (alreadyNotified) {
          return;
        }

        const servedMessage = `Your Ticket ${ticketRecord.ticket} is now being served at ${ticketRecord.counterName} in ${ticketRecord.officeName}. Please proceed to the counter and have your ID and any required documents ready. Thank you.`;
        nextNotifications.unshift(buildNotification(ticketRecord.ticket, ticketRecord.officeName, ticketRecord.counterName, "served", servedMessage));
        nextActiveTickets[ticketRecord.officeName] = {
          ...ticketRecord,
          status: "served",
        };
      });

      return {
        ...profile,
        activeTickets: nextActiveTickets,
        notifications: nextNotifications.slice(0, 50),
      };
    });
  }, [activeOffice, activeTickets, officeQueues, updateCurrentUserProfile]);

  const handleRegister = async (form) => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const isStaffRegistration = (form.role || "").toString().trim().toUpperCase() === "STAFF";

      if (isSupabaseConfigured && supabase && !isStaffRegistration) {
        registerFlowRef.current = true;

        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
              role: form.role || "Student",
              office: form.office || null,
            },
          },
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          await supabase.auth.signOut();
        }

        const registrationMessage =
          "Account created successfully. Please sign in with your credentials.";

        setUser(null);
        setScreen("auth");
        setStatus({ type: "ok", message: registrationMessage });
        setActiveTab("login");
        return true;
      }

      const payload = await postJson("/api/auth/register", form);
      setStatus({ type: "ok", message: payload.message || "Registration successful." });
      setActiveTab("login");
      return true;
    } catch (error) {
      setStatus({
        type: "error",
        message: toReadableError(
          error,
          isSupabaseConfigured ? "Supabase Auth" : `backend API at ${API_BASE || "(proxy)"}`
        ),
      });
      return false;
    } finally {
      registerFlowRef.current = false;
      setLoading(false);
    }
  };

  const handleLogin = async (form) => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    const normalizedEmail = form.email.trim().toLowerCase();
    const isAdminLogin = normalizedEmail === ADMIN_EMAIL;
    const isAdminPasswordMatch = form.password === ADMIN_PASSWORD;

    try {
      const payload = await postJson("/api/auth/login", {
        email: normalizedEmail,
        password: form.password,
      });
      setUser(payload);
      setStatus({ type: "ok", message: payload.message || "Login successful." });
      setScreen(getLandingScreenForUser(payload));
      setUserSection("home");
    } catch (backendError) {
      if (isSupabaseConfigured && supabase && !isAdminLogin) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password: form.password,
          });

          if (error) {
            throw error;
          }

          const activeUser = mapSupabaseUser(data.user);
          setUser(activeUser);
          setStatus({ type: "ok", message: "Login successful." });
          setScreen(getLandingScreenForUser(activeUser));
          setUserSection("home");
          return;
        } catch (supabaseError) {
          const loginErrorMessage = toReadableError(
            supabaseError,
            isSupabaseConfigured ? "Supabase Auth" : `backend API at ${API_BASE || "(proxy)"}`
          );
          setUser(null);
          setStatus({
            type: "error",
            message: loginErrorMessage,
          });
          return;
        }
      }

      const loginErrorMessage = toReadableError(
        backendError,
        isSupabaseConfigured ? "Supabase Auth" : `backend API at ${API_BASE || "(proxy)"}`
      );
      const backendUnreachable = /cannot reach backend api/i.test(loginErrorMessage);

      if (isAdminLogin && backendUnreachable) {
        const localAdminUser = createLocalAdminUser();
        setUser(localAdminUser);
        setStatus({
          type: "ok",
          message: "Admin login opened locally because the backend API is unreachable.",
        });
        setScreen("admin");
        setUserSection("home");
        return;
      }

      if (isAdminLogin && isAdminPasswordMatch) {
        const localAdminUser = createLocalAdminUser();
        setUser(localAdminUser);
        setStatus({
          type: "ok",
          message: "Admin login opened locally because the backend API is unreachable.",
        });
        setScreen("admin");
        setUserSection("home");
        return;
      }

      setUser(null);
      setStatus({
        type: "error",
        message: loginErrorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setStatus({ type: "", message: "Logged out." });
    setActiveTab("login");
    setScreen("auth");
    setUserSection("home");
  };

  const openQueue = (officeName) => {
    const officeRecord = officeStatus[officeName];
    if (!officeRecord?.isOpen) {
      setStatus({ type: "error", message: `${officeName} is currently closed.` });
      return;
    }

    setQueueState((prev) => ({
      ...prev,
      activeOffice: officeName,
    }));
    setScreen("queue");
    setUserSection("home");
  };

  const backToOffice = () => {
    setScreen("office");
    setUserSection("home");
  };

  const handleGetQueue = (officeName, form = {}) => {
    if (activeTickets?.[officeName]?.status === "waiting") {
      setStatus({ type: "error", message: `You already have an active ticket for ${officeName}: ${activeTickets[officeName].ticket}.` });
      return;
    }

    const openCounters = getOpenCounters(officeName);
    const eligibleCounters = getOfficeCountersForPurpose(officeName, form.purpose);
    const counters = openCounters.filter((counterName) => eligibleCounters.includes(counterName));

    if (counters.length === 0) {
      setStatus({
        type: "error",
        message:
          officeName === "Accounting"
            ? "Accounting has no open counters for this ticket purpose."
            : `${officeName} has no open counters.`,
      });
      return;
    }

    const nextNumber = ticketState?.nextTicketNumber || 101;
    const chosenCounter = counters[(officeCounterTurn[officeName] || 0) % counters.length];

    if (!chosenCounter) {
      setStatus({
        type: "error",
        message: `${officeName} does not have an open counter available right now.`,
      });
      return;
    }

    const queueNumber = String(nextNumber);
    const issuedAt = Date.now();
    const ticketRecord = {
      ticket: queueNumber,
      officeName,
      counterName: chosenCounter,
      status: "waiting",
      issuedAt,
      idNumber: form.idNumber || "",
      name: form.name || user?.name || "User",
      purpose: form.purpose || "",
      amount: form.amount || "",
    };

    setQueueState((prev) => ({
      ...prev,
      activeOffice: officeName,
      officeQueues: {
        ...prev.officeQueues,
        [officeName]: {
          ...prev.officeQueues[officeName],
          [chosenCounter]: [...(prev.officeQueues[officeName]?.[chosenCounter] || []), queueNumber],
        },
      },
      officeQueueNumbers: {
        ...prev.officeQueueNumbers,
        [officeName]: (prev.officeQueueNumbers[officeName] || 1) + 1,
      },
      officeCounterTurn: {
        ...prev.officeCounterTurn,
        [officeName]: (prev.officeCounterTurn[officeName] || 0) + 1,
      },
      ticketState: {
        ...prev.ticketState,
        nextTicketNumber: nextNumber + 1,
        ticketDirectory: {
          ...prev.ticketState.ticketDirectory,
          [queueNumber]: {
            ticket: queueNumber,
            userId: currentUserId,
            userName: ticketRecord.name,
            userEmail: user?.email || "",
            idNumber: ticketRecord.idNumber,
            purpose: ticketRecord.purpose,
            amount: ticketRecord.amount,
            officeName,
            counterName: chosenCounter,
            status: "waiting",
            issuedAt,
          },
        },
        userProfiles: {
          ...prev.ticketState.userProfiles,
          [currentUserId]: {
            ...(prev.ticketState.userProfiles[currentUserId] || createEmptyUserProfile()),
            activeTickets: {
              ...(prev.ticketState.userProfiles[currentUserId]?.activeTickets || {}),
              [officeName]: ticketRecord,
            },
            activeTicket: {
              ...ticketRecord,
            },
          },
        },
      },
    }));
    setStatus({ type: "ok", message: `${queueNumber} added to ${officeName}.` });
    setScreen("office");
    setUserSection("home");
  };

  const handleClearQueue = (officeName = activeOffice) => {
    if (!canManageOffice(officeName)) {
      setStatus({ type: "error", message: `You are not allowed to manage ${officeName}.` });
      return;
    }

    const counters = OFFICE_COUNTERS[officeName] || [];

    setQueueState((prev) => ({
      ...prev,
      officeQueues: {
        ...prev.officeQueues,
        [officeName]: counters.reduce((counterAcc, counter) => {
          counterAcc[counter] = [];
          return counterAcc;
        }, {}),
      },
      officeQueueNumbers: {
        ...prev.officeQueueNumbers,
        [officeName]: 1,
      },
      officeCounterTurn: {
        ...prev.officeCounterTurn,
        [officeName]: 0,
      },
      ticketState: {
        ...prev.ticketState,
        ticketDirectory: Object.fromEntries(
          Object.entries(prev.ticketState.ticketDirectory).map(([ticket, details]) =>
            details.officeName === officeName ? [ticket, { ...details, status: "removed" }] : [ticket, details]
          )
        ),
        userProfiles: Object.fromEntries(
          Object.entries(prev.ticketState.userProfiles).map(([profileUserId, profile]) => {
            const activeTicket = profile.activeTickets?.[officeName];
            if (!activeTicket) {
              return [profileUserId, profile];
            }

            const nextProfile = {
              ...profile,
              activeTickets: {
                ...(profile.activeTickets || {}),
                [officeName]: { ...activeTicket, status: "removed" },
              },
              activeTicket: { ...activeTicket, status: "removed" },
            };

            return [profileUserId, nextProfile];
          })
        ),
      },
    }));

    setStatus({ type: "ok", message: `${officeName} queue cleared.` });
  };

  const handleToggleOffice = (officeName) => {
    if (!canManageOffice(officeName)) {
      setStatus({ type: "error", message: `You are not allowed to manage ${officeName}.` });
      return;
    }

    updateOfficeStatus((prevStatus) => ({
      ...prevStatus,
      [officeName]: {
        ...prevStatus[officeName],
        isOpen: !prevStatus[officeName]?.isOpen,
      },
    }));
  };

  const handleToggleCounter = (officeName, counterName) => {
    if (!canManageOffice(officeName)) {
      setStatus({ type: "error", message: `You are not allowed to manage ${officeName}.` });
      return;
    }

    updateOfficeStatus((prevStatus) => {
      const officeRecord = prevStatus[officeName] || { isOpen: true, openCounters: [] };
      const isOpen = officeRecord.openCounters?.includes(counterName);
      const nextCounters = isOpen
        ? officeRecord.openCounters.filter((counter) => counter !== counterName)
        : sortOfficeCounters(officeName, [...(officeRecord.openCounters || []), counterName]);

      return {
        ...prevStatus,
        [officeName]: {
          ...officeRecord,
          openCounters: nextCounters,
        },
      };
    });
  };

  const handleRemoveTicket = (officeName, counterName, ticket = null) => {
    if (!canManageOffice(officeName)) {
      setStatus({ type: "error", message: `You are not allowed to manage ${officeName}.` });
      return;
    }

    const currentTickets = officeQueues[officeName]?.[counterName] || [];
    if (currentTickets.length === 0) {
      setStatus({ type: "error", message: `${counterName} has no tickets to remove.` });
      return;
    }

    const removedTicket = ticket || currentTickets[currentTickets.length - 1];
    const nextTickets = currentTickets.filter((t) => t !== removedTicket);

    setQueueState((prev) => ({
      ...prev,
      activeOffice: officeName,
      officeQueues: {
        ...prev.officeQueues,
        [officeName]: {
          ...prev.officeQueues[officeName],
          [counterName]: nextTickets,
        },
      },
      ticketState: {
        ...prev.ticketState,
        ticketDirectory: {
          ...prev.ticketState.ticketDirectory,
          [removedTicket]: {
            ...(prev.ticketState.ticketDirectory[removedTicket] || {}),
            status: "removed",
            officeName,
            counterName,
          },
        },
        userProfiles: Object.fromEntries(
          Object.entries(prev.ticketState.userProfiles).map(([profileUserId, profile]) => {
            const activeTicket = profile.activeTickets?.[officeName];
            if (activeTicket?.ticket !== removedTicket) {
              return [profileUserId, profile];
            }

            const nextProfile = {
              ...profile,
              activeTickets: {
                ...(profile.activeTickets || {}),
                [officeName]: { ...activeTicket, status: "removed" },
              },
              activeTicket: { ...activeTicket, status: "removed" },
            };

            return [profileUserId, nextProfile];
          })
        ),
      },
    }));

    setStatus({ type: "ok", message: `${removedTicket} marked done at ${counterName}.` });
  };

  const handleDoneTicket = (ticketRecord) => {
    if (!ticketRecord?.ticket || !ticketRecord?.officeName || !ticketRecord?.counterName) {
      return;
    }

    const { ticket, officeName, counterName } = ticketRecord;

    setQueueState((prev) => {
      const currentTickets = prev.officeQueues?.[officeName]?.[counterName] || [];
      const nextTickets = currentTickets.filter((currentTicket) => currentTicket !== ticket);

      return {
        ...prev,
        activeOffice: officeName,
        officeQueues: {
          ...prev.officeQueues,
          [officeName]: {
            ...prev.officeQueues[officeName],
            [counterName]: nextTickets,
          },
        },
        ticketState: {
          ...prev.ticketState,
          ticketDirectory: {
            ...prev.ticketState.ticketDirectory,
            [ticket]: {
              ...(prev.ticketState.ticketDirectory[ticket] || {}),
              status: "removed",
              officeName,
              counterName,
            },
          },
          userProfiles: Object.fromEntries(
            Object.entries(prev.ticketState.userProfiles).map(([profileUserId, profile]) => {
              const activeTicket = profile.activeTickets?.[officeName];
              const topActiveTicket = profile.activeTicket;
              const ticketMatches = activeTicket?.ticket === ticket || topActiveTicket?.ticket === ticket;

              if (!ticketMatches) {
                return [profileUserId, profile];
              }

              const nextActiveTickets = { ...(profile.activeTickets || {}) };
              delete nextActiveTickets[officeName];

              return [
                profileUserId,
                {
                  ...profile,
                  activeTickets: nextActiveTickets,
                  activeTicket: Object.values(nextActiveTickets)[0] || null,
                },
              ];
            })
          ),
        },
      };
    });

    setStatus({ type: "ok", message: `${ticket} removed from ${counterName}.` });
  };

  const handleServeTicket = (officeName, counterName, ticket = null) => {
    if (!canManageOffice(officeName)) {
      setStatus({ type: "error", message: `You are not allowed to manage ${officeName}.` });
      return;
    }

    const currentTickets = officeQueues[officeName]?.[counterName] || [];
    if (currentTickets.length === 0) {
      setStatus({ type: "error", message: `${counterName} has no tickets to serve.` });
      return;
    }

    let servedTicket;
    let remainingTickets;

    if (ticket) {
      // serve the selected ticket
      servedTicket = ticket;
      remainingTickets = currentTickets.filter((t) => t !== ticket);
    } else {
      // default behaviour: serve the first ticket
      [servedTicket, ...remainingTickets] = currentTickets;
    }

    setQueueState((prev) => ({
      ...prev,
      activeOffice: officeName,
      officeQueues: {
        ...prev.officeQueues,
        [officeName]: {
          ...prev.officeQueues[officeName],
          [counterName]: remainingTickets,
        },
      },
      ticketState: {
        ...prev.ticketState,
        ticketDirectory: {
          ...prev.ticketState.ticketDirectory,
          ...(servedTicket
            ? {
                [servedTicket]: {
                  ...(prev.ticketState.ticketDirectory[servedTicket] || {}),
                  status: "served",
                  officeName,
                  counterName,
                },
              }
            : {}),
        },
        userProfiles: Object.fromEntries(
          Object.entries(prev.ticketState.userProfiles).map(([profileUserId, profile]) => {
            const officeActiveTicket = profile.activeTickets?.[officeName];
            const topActiveTicket = profile.activeTicket;
            const ticketMatches = (officeActiveTicket?.ticket === servedTicket) || (topActiveTicket?.ticket === servedTicket);
            if (!ticketMatches) {
              return [profileUserId, profile];
            }

            const matchedTicketRecord = officeActiveTicket?.ticket === servedTicket ? officeActiveTicket : topActiveTicket;
            const nextProfile = {
              ...profile,
              activeTickets: {
                ...(profile.activeTickets || {}),
                [officeName]: { ...matchedTicketRecord, status: "served" },
              },
              activeTicket: { ...matchedTicketRecord, status: "served" },
            };

            return [
              profileUserId,
              pushNotification(
                nextProfile,
                buildNotification(
                  servedTicket,
                  officeName,
                  counterName,
                  "served",
                  `Your Ticket ${servedTicket} is now being served at ${counterName} in ${officeName}. Please proceed to the counter and have your ID and any required documents ready. Thank you.`
                )
              ),
            ];
          })
        ),
      },
    }));
    setStatus({ type: "ok", message: `${servedTicket} served from ${counterName}.` });
  };

  const handleNavigateSection = (section) => {
    setUserSection(section);
    if (screen === "queue") {
      setScreen("office");
    }
  };

  const handleMarkNotificationsRead = () => {
    updateCurrentUserProfile((profile) => ({
      ...profile,
      notifications: (profile.notifications || []).map((item) => ({ ...item, read: true })),
    }));
  };

  const handleRemoveNotification = (notificationId) => {
    updateCurrentUserProfile((profile) => ({
      ...profile,
      notifications: (profile.notifications || []).map((item) =>
        item.id === notificationId ? { ...item, removed: true, read: true } : item
      ),
    }));
  };

  const handleDeleteNotification = (notificationId) => {
    updateCurrentUserProfile((profile) => ({
      ...profile,
      notifications: (profile.notifications || []).filter((item) => item.id !== notificationId),
    }));
  };

  const handleDeleteAllNotifications = () => {
    updateCurrentUserProfile((profile) => ({
      ...profile,
      notifications: [],
    }));
  };

  const handleChangePassword = async ({ currentPassword, password }) => {
    if (!isSupabaseConfigured || !supabase) {
      return { ok: false, message: "Password changes are available when signing in with Supabase." };
    }

    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });

      if (reauthError) {
        return { ok: false, message: "Current password is incorrect." };
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { ok: false, message: toReadableError(error, "Supabase Auth") };
      }

      return { ok: true, message: "Password updated successfully." };
    } catch (error) {
      return { ok: false, message: toReadableError(error, "Supabase Auth") };
    }
  };

  // Sync across browser tabs (simple cross-tab visibility for admin changes)
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key) return;
      if (e.key !== "queuexpress.queue-state") return;
      try {
        const fresh = loadQueueState();
        setQueueState(fresh);
      } catch (err) {
        // ignore parse errors
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activeAdminOffice = OFFICES.includes(activeOffice) ? activeOffice : OFFICES[0];

  if (user && isAdminUser(user) && screen === "admin") {
    return (
      <AdminPage
        user={user}
        userRole={getUserRole(user)}
        status={status}
        apiBase={API_BASE}
        managedOffices={managedOffices}
        canManageUsers={isAdminUser(user)}
        activeOffice={activeAdminOffice}
        officeStatus={officeStatus}
        officeQueues={officeQueues}
        onSelectOffice={(office) => {
          if (!canManageOffice(office)) {
            setStatus({ type: "error", message: `You are not allowed to manage ${office}.` });
            return;
          }

          setQueueState((prev) => ({
            ...prev,
            activeOffice: office,
          }));
        }}
        onToggleOffice={handleToggleOffice}
        onToggleCounter={handleToggleCounter}
        onRemoveTicket={handleRemoveTicket}
        onServeTicket={handleServeTicket}
        onLogout={handleLogout}
      />
    );
  }

  if (user && isStaffUser(user) && screen === "staff") {
    return (
      <StaffPage
        user={user}
        status={status}
        activeOffice={activeOffice}
        officeStatus={officeStatus}
        officeQueues={officeQueues}
        onSelectOffice={(office) => {
          if (!canManageOffice(office)) {
            setStatus({ type: "error", message: `You are not allowed to manage ${office}.` });
            return;
          }

          setQueueState((prev) => ({
            ...prev,
            activeOffice: office,
          }));
        }}
        onToggleOffice={handleToggleOffice}
        onToggleCounter={handleToggleCounter}
        onRemoveTicket={handleRemoveTicket}
        onServeTicket={handleServeTicket}
        onLogout={handleLogout}
      />
    );
  }

  if (screen === "auth" || !user) {
    return (
      <AuthPage
        activeTab={activeTab}
        status={status}
        loading={loading}
        onTabChange={(tab) => {
          setStatus({ type: "", message: "" });
          setActiveTab(tab);
        }}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <DashboardPage
      user={user}
      view={screen}
      section={userSection}
      activeOffice={activeOffice}
      officeQueues={officeQueues}
      officeStatus={officeStatus}
      currentTicket={currentTicket}
      currentTickets={Object.values(activeTickets)}
      notifications={currentUserProfile.notifications || []}
      ticketDirectory={ticketState?.ticketDirectory || {}}
      unreadNotifications={unreadNotifications}
      onSelectOffice={openQueue}
      onGetQueue={handleGetQueue}
      onClearQueue={isAdminUser(user) ? handleClearQueue : undefined}
      onDoneTicket={handleDoneTicket}
      onBackToOffice={backToOffice}
      onNavigateSection={handleNavigateSection}
      onMarkNotificationsRead={handleMarkNotificationsRead}
      onRemoveNotification={handleRemoveNotification}
      onDeleteNotification={handleDeleteNotification}
      onDeleteAllNotifications={handleDeleteAllNotifications}
      onChangePassword={handleChangePassword}
      onLogout={handleLogout}
    />
  );
}

export default App;
