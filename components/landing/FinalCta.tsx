import Link from "next/link";
import { Arrow, Terminal } from "@/components/ui/icons";

/** Final CTA band — try the demo / scan your own setup. */
export function FinalCta() {
  return (
    <section className="section lp-final" aria-labelledby="lp-final-title">
      <div className="container-narrow stack center lp-final-inner">
        <span className="eyebrow">Ready when you are</span>
        <h2 id="lp-final-title" className="section-title lp-section-title lp-center">
          See what&rsquo;s really in your Claude setup
        </h2>
        <p className="lead lp-center lp-final-lead">
          Poke around the demo with no setup at all, or scan your own machine and
          start tidying. Either way it&rsquo;s free, local, and takes about two minutes.
        </p>
        <div className="row gap-2 wrap center lp-cta-row">
          <Link href="/inventory" className="btn btn-primary btn-lg">
            Try the demo <Arrow size={16} />
          </Link>
          <Link href="/setup" className="btn btn-secondary btn-lg">
            <Terminal size={16} /> Scan your own setup
          </Link>
        </div>
      </div>
    </section>
  );
}
