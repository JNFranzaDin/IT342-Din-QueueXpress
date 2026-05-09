import { useEffect, useRef, useState } from "react";
import "./App.css";
import AuthPage from "./components/auth/AuthPage";
import AdminPage from "./components/admin/AdminPage";
import DashboardPage from "./components/dashboard/DashboardPage";
import { OFFICE_COUNTERS, OFFICES, sortOfficeCounters } from "./components/queueManagement/queueConfig";
import { loadQueueState, persistQueueState } from "./components/queueManagement/queueState";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";

const API_BASE = process.env.REACT_APP_API_BASE || "";
const ADMIN_EMAIL = "queuexpressadmin@gmail.com";
const ADMIN_PASSWORD = "queuexpress123";

const getUserRole = (nextUser) => nextUser?.role || (nextUser?.email === ADMIN_EMAIL ? "ADMIN" : "USER");

const isAdminUser = (nextUser) => getUserRole(nextUser) === "ADMIN";

const createLocalAdminUser = () => ({
  userId: "local-admin",
  name: "QueueXpress Admin",
  email: ADMIN_EMAIL,
  role: "ADMIN",
});

const mapSupabaseUser = (supabaseUser) => {
  if (!supabaseUser) {
    return null;
  }

  const userName =
    supabaseUser.user_metadata?.full_name ||
    supabaseUser.user_metadata?.name ||
    supabaseUser.email?.split("@")[0] ||
    "User";

  return {
    userId: supabaseUser.id,
    name: userName,
    email: supabaseUser.email || "",
    role: getUserRole({ email: supabaseUser.email || "" }),
  };
};

const toReadableError = (error, serviceLabel) => {
  const raw = (error && error.message) || "";
  if (/failed to fetch|networkerror|network error/i.test(raw)) {
    return `Cannot reach ${serviceLabel}. Check internet/server and try again.`;
  }
  return raw || "Request failed.";
};

function App() {
  const registerFlowRef = useRef(false);
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("auth");
  const [userSection, setUserSection] = useState("home");
  const [queueState, setQueueState] = useState(() => loadQueueState());
  const { activeOffice, officeQueues, officeQueueNumbers, officeCounterTurn, officeStatus, ticketState } =
    queueState;

  const currentUserId = user?.userId || user?.email || "";
  const currentUserProfile = ticketState?.userProfiles?.[currentUserId] || {
    activeTicket: null,
    notifications: [],
  };
  const currentTicket = currentUserProfile.activeTicket || null;
  const unreadNotifications = (currentUserProfile.notifications || []).filter((item) => !item.read).length;

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

  const updateCurrentUserProfile = (updater) => {
    setQueueState((prev) => {
      const existingProfile = prev.ticketState?.userProfiles?.[currentUserId] || {
        activeTicket: null,
        notifications: [],
      };

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
  };

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
    if (!isSupabaseConfigured) {
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
        setScreen(isAdminUser(activeUser) ? "admin" : "office");
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
        setScreen(isAdminUser(activeUser) ? "admin" : "office");
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
    if (!currentTicket?.ticket || !currentTicket?.officeName || !currentTicket?.counterName) {
      return;
    }

    const activeOfficeTickets = officeQueues?.[currentTicket.officeName]?.[currentTicket.counterName] || [];
    const isFirstInLine = activeOfficeTickets[0] === currentTicket.ticket;
    const handlingMessage = `${currentTicket.counterName} is now handling your ticket ${currentTicket.ticket}.`;

    if (!isFirstInLine) {
      return;
    }

    updateCurrentUserProfile((profile) => {
      const notifications = profile.notifications || [];
      const alreadyNotified = notifications.some(
        (item) => item.type === "handling" && item.ticket === currentTicket.ticket
      );

      if (alreadyNotified) {
        return profile;
      }

      return pushNotification(
        profile,
        buildNotification(currentTicket.ticket, currentTicket.officeName, currentTicket.counterName, "handling", handlingMessage)
      );
    });
  }, [currentTicket?.counterName, currentTicket?.officeName, currentTicket?.ticket, officeQueues]);

  const postJson = async (path, body) => {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw new Error(toReadableError(error, `backend API at ${API_BASE || "(proxy)"}`));
    }

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message =
        (Array.isArray(payload.details) && payload.details.join(" | ")) ||
        payload.message ||
        "Request failed.";
      throw new Error(message);
    }

    return payload;
  };

  const handleRegister = async (form) => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      if (isSupabaseConfigured) {
        registerFlowRef.current = true;

        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: {
              full_name: form.name,
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
      if (isSupabaseConfigured && !isAdminLogin) {
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
        setScreen(isAdminUser(activeUser) ? "admin" : "office");
        setUserSection("home");
        return;
      }

      const payload = await postJson("/api/auth/login", {
        email: normalizedEmail,
        password: form.password,
      });
      setUser(payload);
      setStatus({ type: "ok", message: payload.message || "Login successful." });
      setScreen(isAdminUser(payload) ? "admin" : "office");
      setUserSection("home");
    } catch (error) {
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
        message: toReadableError(
          error,
          isSupabaseConfigured ? "Supabase Auth" : `backend API at ${API_BASE || "(proxy)"}`
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
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
    if (currentTicket?.status === "waiting") {
      setStatus({ type: "error", message: `You already have an active ticket: ${currentTicket.ticket}.` });
      return;
    }

    const counters = getOpenCounters(officeName);
    if (counters.length === 0) {
      setStatus({ type: "error", message: `${officeName} has no open counters.` });
      return;
    }

    const nextNumber = officeQueueNumbers[officeName] || 1;
    const turn = officeCounterTurn[officeName] || 0;
    const chosenCounter = counters[turn % counters.length];
    const queueNumber = `${officeName.charAt(0).toUpperCase()}-${String(nextNumber).padStart(3, "0")}`;

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
        [officeName]: nextNumber + 1,
      },
      officeCounterTurn: {
        ...prev.officeCounterTurn,
        [officeName]: turn + 1,
      },
      ticketState: {
        ...prev.ticketState,
        ticketDirectory: {
          ...prev.ticketState.ticketDirectory,
          [queueNumber]: {
            userId: currentUserId,
            userName: form.name || user?.name || "User",
            userEmail: user?.email || "",
            idNumber: form.idNumber || "",
            purpose: form.purpose || "",
            amount: form.amount || "",
            officeName,
            counterName: chosenCounter,
            status: "waiting",
            issuedAt: Date.now(),
          },
        },
        userProfiles: {
          ...prev.ticketState.userProfiles,
          [currentUserId]: pushNotification(
            {
              ...(prev.ticketState.userProfiles[currentUserId] || {
                activeTicket: null,
                notifications: [],
              }),
              activeTicket: {
                ticket: queueNumber,
                officeName,
                counterName: chosenCounter,
                status: "waiting",
                issuedAt: Date.now(),
                idNumber: form.idNumber || "",
                name: form.name || user?.name || "User",
                purpose: form.purpose || "",
                amount: form.amount || "",
              },
            },
            buildNotification(
              queueNumber,
              officeName,
              chosenCounter,
              "issued",
              `Ticket ${queueNumber} has been issued for ${officeName} - ${chosenCounter}.`
            )
          ),
        },
      },
    }));
    setStatus({ type: "ok", message: `${queueNumber} added to ${officeName}.` });
    setScreen("queue");
    setUserSection("home");
  };

  const handleClearQueue = (officeName = activeOffice) => {
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
            const activeTicket = profile.activeTicket;
            if (activeTicket?.officeName !== officeName) {
              return [profileUserId, profile];
            }

            const removalMessage = `The ${officeName} queue was cleared by the admin.`;
            return [
              profileUserId,
              pushNotification(
                {
                  ...profile,
                  activeTicket: activeTicket
                    ? { ...activeTicket, status: "removed" }
                    : activeTicket,
                },
                buildNotification(
                  activeTicket?.ticket || officeName,
                  officeName,
                  activeTicket?.counterName || "",
                  "removed",
                  removalMessage
                )
              ),
            ];
          })
        ),
      },
    }));

    setStatus({ type: "ok", message: `${officeName} queue cleared.` });
  };

  const handleToggleOffice = (officeName) => {
    updateOfficeStatus((prevStatus) => ({
      ...prevStatus,
      [officeName]: {
        ...prevStatus[officeName],
        isOpen: !prevStatus[officeName]?.isOpen,
      },
    }));
  };

  const handleToggleCounter = (officeName, counterName) => {
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
            const activeTicket = profile.activeTicket;
            if (activeTicket?.ticket !== removedTicket) {
              return [profileUserId, profile];
            }

            const nextProfile = {
              ...profile,
              activeTicket: { ...activeTicket, status: "removed" },
            };

            return [
              profileUserId,
              pushNotification(
                nextProfile,
                buildNotification(
                  removedTicket,
                  officeName,
                  counterName,
                  "removed",
                  `Your ticket ${removedTicket} was removed from ${counterName}.`
                )
              ),
            ];
          })
        ),
      },
    }));

    setStatus({ type: "ok", message: `${removedTicket} removed from ${counterName}.` });
  };

  const handleServeTicket = (officeName, counterName, ticket = null) => {
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
            const activeTicket = profile.activeTicket;
            if (activeTicket?.ticket !== servedTicket) {
              return [profileUserId, profile];
            }

            const nextProfile = {
              ...profile,
              activeTicket: { ...activeTicket, status: "served" },
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
                  `Your ticket ${servedTicket} is now being handled at ${counterName}.`
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

  const handleChangePassword = async ({ password }) => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: "Password changes are available when signing in with Supabase." };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        throw error;
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
        status={status}
        activeOffice={activeAdminOffice}
        officeStatus={officeStatus}
        officeQueues={officeQueues}
        onSelectOffice={(office) => {
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
      notifications={currentUserProfile.notifications || []}
      unreadNotifications={unreadNotifications}
      onSelectOffice={openQueue}
      onGetQueue={handleGetQueue}
      onClearQueue={isAdminUser(user) ? handleClearQueue : undefined}
      onBackToOffice={backToOffice}
      onNavigateSection={handleNavigateSection}
      onMarkNotificationsRead={handleMarkNotificationsRead}
      onChangePassword={handleChangePassword}
      onLogout={handleLogout}
    />
  );
}

export default App;
