import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import { AppButton } from "../components/ui/AppButton";

export default function Home() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/cookbooks" replace />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(24rem,0.9fr)]">
      <section className="app-panel relative overflow-hidden px-6 py-8 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_top,var(--interactive-soft),transparent_60%)]" />
        <div className="relative">
          <Logo size="large" withTagline />
          <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
            Store recipes, build shared cookbooks, and keep the practical joy of cooking in a product that feels polished on every screen.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <AppButton variant="primary">Get Started</AppButton>
            </Link>
            <Link to="/login">
              <AppButton>Log In</AppButton>
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["Organize", "Keep recipes tidy across personal and shared cookbooks."],
              ["Collaborate", "Invite friends and family with clear cookbook roles."],
              ["Cook anywhere", "Use the responsive app on phone, tablet, laptop, or desktop."],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-[1.5rem] border border-[var(--border-muted)] bg-[var(--surface-soft)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="app-panel app-pattern flex flex-col justify-between gap-6 px-6 py-8 sm:px-8">
        <div>
          <p className="app-eyebrow">Modern recipe workspace</p>
          <h2 className="mt-3 font-[var(--font-display)] text-3xl font-semibold text-[var(--text-primary)]">
            A self-hosted kitchen companion that still feels warm.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
            The new interface keeps the original homey spirit, but sharpens hierarchy, readability, and touch comfort for real day-to-day use.
          </p>
        </div>

        <div className="space-y-3">
          {[
            "Readable recipe layouts built for active cooking",
            "Consistent cards, forms, and dialogs across the app",
            "Installable as a progressive web app for a native-feeling experience",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-[var(--border-muted)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-secondary)]"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
