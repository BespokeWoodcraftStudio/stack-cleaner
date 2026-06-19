import "@/components/landing/landing.css";
import { Hero } from "@/components/landing/Hero";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { NonTechnical } from "@/components/landing/NonTechnical";
import { FinalCta } from "@/components/landing/FinalCta";
import { JsonLd } from "@/components/JsonLd";
import { softwareAppGraph } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <JsonLd data={softwareAppGraph} />
      <Hero />
      <Problem />
      <HowItWorks />
      <Features />
      <NonTechnical />
      <FinalCta />
    </>
  );
}
