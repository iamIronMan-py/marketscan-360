import { useAuthStore } from "../hooks/useAuthStore";

export function AccountPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="page-stack">
      <section className="hero-card secondary">
        <div>
          <p className="eyebrow">Account</p>
          <h3>Research operator profile</h3>
          <p className="hero-copy">
            Use this profile area to keep login identity, session ownership, and future scan preferences in one place.
          </p>
        </div>
      </section>

      <section className="info-grid">
        <article className="info-card">
          <strong>Email</strong>
          <p>{user?.email ?? "No user loaded"}</p>
        </article>
        <article className="info-card">
          <strong>Name</strong>
          <p>{user?.fullName ?? "No name available"}</p>
        </article>
        <article className="info-card">
          <strong>Verification</strong>
          <p>{user?.isVerified ? "Verified and active" : "Not verified"}</p>
        </article>
      </section>
    </div>
  );
}
