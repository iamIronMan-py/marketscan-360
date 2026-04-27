import { useSnackbarStore } from "../hooks/useSnackbarStore";

export function Snackbar() {
  const { text, tone, dismiss } = useSnackbarStore();
  if (!text) return null;
  return (
    <div className={`snackbar snackbar--${tone}`} role={tone === "error" ? "alert" : "status"}>
      <span className="snackbar__text">{text}</span>
      <button type="button" className="snackbar__close" onClick={dismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
