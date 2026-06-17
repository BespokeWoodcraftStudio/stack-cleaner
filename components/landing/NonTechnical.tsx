import Link from "next/link";
import { Arrow } from "@/components/ui/icons";

/** Reassuring callout for non-technical people → /setup. */
export function NonTechnical() {
  return (
    <section className="section" aria-labelledby="lp-nt-title">
      <div className="container-narrow">
        <div className="card card-pad-lg lp-nt-card">
          <span className="badge accent lp-nt-tag">No terminal experience needed</span>
          <h2 id="lp-nt-title" className="lp-nt-title">
            Never opened a terminal? You&rsquo;ll be fine.
          </h2>
          <p className="lead lp-nt-body">
            The setup page walks you through it copy-paste by copy-paste &mdash; what to
            open, exactly what to type, and what you&rsquo;ll see back. No code to read,
            no GitHub account, nothing to install and configure. If you can copy a line
            and press Enter, you can do this.
          </p>
          <div className="lp-cta-row">
            <Link href="/setup" className="btn btn-primary btn-lg">
              Open the guided setup <Arrow size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
