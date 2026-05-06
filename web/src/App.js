import { useEffect, useRef, useState } from "react";
import "./App.css";
import AuthPage from "./components/auth/AuthPage";
import DashboardPage from "./components/dashboard/DashboardPage";
import { OFFICE_COUNTERS } from "./components/queueManagement/queueConfig";
import { loadQueueState, persistQueueState } from "./components/queueManagement/queueState";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";

const API_BASE = process.env.REACT_APP_API_BASE || "";

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
  const [queueState, setQueueState] = useState(() => loadQueueState());
  const { activeOffice, officeQueues, officeQueueNumbers, officeCounterTurn } = queueState;

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
    };
  };

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
        setScreen("office");
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
        setScreen("office");
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

    persistQueueState({
      activeOffice,
      officeQueues,
      officeQueueNumbers,
      officeCounterTurn,
    });
  }, [activeOffice, officeCounterTurn, officeQueueNumbers, officeQueues]);

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
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });

        if (error) {
          throw error;
        }

        setUser(mapSupabaseUser(data.user));
        setStatus({ type: "ok", message: "Login successful." });
        setScreen("office");
        return;
      }

      const payload = await postJson("/api/auth/login", form);
      setUser(payload);
      setStatus({ type: "ok", message: payload.message || "Login successful." });
      setScreen("office");
    } catch (error) {
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
  };

  const openQueue = (officeName) => {
    setQueueState((prev) => ({
      ...prev,
      activeOffice: officeName,
    }));
    setScreen("queue");
  };

  const backToOffice = () => {
    setScreen("office");
  };

  const handleGetQueue = (officeName) => {
    const counters = OFFICE_COUNTERS[officeName] || [];
    if (counters.length === 0) {
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
    }));
    setScreen("queue");
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
    }));

    setStatus({ type: "ok", message: `${officeName} queue cleared.` });
  };

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
      activeOffice={activeOffice}
      officeQueues={officeQueues}
      onSelectOffice={openQueue}
      onGetQueue={handleGetQueue}
      onClearQueue={handleClearQueue}
      onBackToOffice={backToOffice}
      onLogout={handleLogout}
    />
  );
}

export default App;
