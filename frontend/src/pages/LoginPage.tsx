import { FormEvent, useState } from "react";

import { useAuthStore } from "../hooks/useAuthStore";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

type AuthMode = "login" | "signup" | "forgot";

interface LoginPageProps {
  onLoggedIn: () => void;
}

async function postJson(url: string, body: object) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail ?? data.deliveryError ?? "Request failed");
  }
  return data;
}

export function LoginPage({ onLoggedIn }: LoginPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [setupToken, setSetupToken] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalTitle, setModalTitle] = useState("Create your password");
  const [snackbar, setSnackbar] = useState<{ text: string; tone: "success" | "error" | "info" } | null>(null);
  const setSession = useAuthStore((state) => state.setSession);

  function showSnack(text: string, tone: "success" | "error" | "info") {
    setSnackbar({ text, tone });
    window.setTimeout(() => setSnackbar(null), 3200);
  }

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await postJson(`${API_BASE}/auth/login`, { email, password });
      setSession(result.token, result.user);
      showSnack("Login successful.", "success");
      onLoggedIn();
    } catch (error) {
      showSnack(error instanceof Error ? error.message : "Unable to login", "error");
    }
  }

  async function handleRequestOtp(event: FormEvent) {
    event.preventDefault();
    try {
      const route = mode === "signup" ? "signup/request-otp" : "forgot-password/request-otp";
      const result = await postJson(`${API_BASE}/auth/${route}`, { email });
      showSnack(
        result.debugOtp
          ? `OTP generated. Debug OTP: ${result.debugOtp}`
          : result.emailSent
            ? "OTP sent to your email."
            : result.deliveryError ?? "OTP could not be sent.",
        result.emailSent || result.debugOtp ? "success" : "info",
      );
    } catch (error) {
      showSnack(error instanceof Error ? error.message : "Unable to request OTP", "error");
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    try {
      const route = mode === "signup" ? "signup/verify-otp" : "forgot-password/verify-otp";
      const result = await postJson(`${API_BASE}/auth/${route}`, { email, code: otp });
      setSetupToken(result.setupToken);
      setModalTitle(mode === "signup" ? "Create your password" : "Reset your password");
      setShowPasswordModal(true);
      showSnack("OTP verified. Continue in the next step.", "success");
    } catch (error) {
      showSnack(error instanceof Error ? error.message : "Unable to verify OTP", "error");
    }
  }

  async function handleSetPassword(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await postJson(`${API_BASE}/auth/set-password`, {
        setupToken,
        password,
        confirmPassword,
      });
      setSession(result.token, result.user);
      showSnack("Password saved and session created.", "success");
      onLoggedIn();
    } catch (error) {
      showSnack(error instanceof Error ? error.message : "Unable to save password", "error");
    }
  }

  return (
    <div className="login-screen">
      <section className="login-card">
        <p className="eyebrow">MarketScan 360</p>
        <h1>Background R&amp;D login</h1>
        <p className="hero-copy">
          Password login is the default. Signup and forgot password use OTP, then continue to password setup in the floating step.
        </p>

        <div className="login-switch">
          <button className={mode === "login" ? "is-selected" : ""} onClick={() => setMode("login")} type="button">
            Login
          </button>
          <button className={mode === "signup" ? "is-selected" : ""} onClick={() => setMode("signup")} type="button">
            Sign up
          </button>
          <button className={mode === "forgot" ? "is-selected" : ""} onClick={() => setMode("forgot")} type="button">
            Forgot password
          </button>
        </div>

        {mode === "login" ? (
          <form className="login-form" onSubmit={handlePasswordLogin}>
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter password" />
            </label>
            <button type="submit">Login</button>
          </form>
        ) : (
          <>
            <form className="login-form" onSubmit={handleRequestOtp}>
              <label>
                Email
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@gmail.com" />
              </label>
              <button type="submit">{mode === "signup" ? "Send signup OTP" : "Send reset OTP"}</button>
            </form>

            <form className="login-form" onSubmit={handleVerifyOtp}>
              <label>
                OTP code
                <input type="text" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="6-digit OTP" />
              </label>
              <button type="submit">Verify OTP</button>
            </form>
          </>
        )}
      </section>

      {showPasswordModal ? (
        <div className="floating-auth-layer">
          <div className="floating-auth-card">
            <div className="floating-auth-head">
              <div>
                <p className="eyebrow">Next step</p>
                <h2>{modalTitle}</h2>
              </div>
              <button className="floating-close" onClick={() => setShowPasswordModal(false)} type="button">
                Close
              </button>
            </div>
            <form className="login-form" onSubmit={handleSetPassword}>
              <label>
                New password
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" />
              </label>
              <label>
                Confirm password
                <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" />
              </label>
              <button type="submit">Save password</button>
            </form>
          </div>
        </div>
      ) : null}

      {snackbar ? <div className={`snackbar snackbar--${snackbar.tone}`}>{snackbar.text}</div> : null}
    </div>
  );
}
