import { InteractiveDemo } from "@/components/marketing/demo";
import { Hero, Nav } from "@/components/marketing/hero";
import {
  Features,
  FinalCta,
  Footer,
  HowItWorks,
  Industries,
  MadeFor,
  Pricing,
  ReportShowcase,
  SectionHead,
  Trust,
} from "@/components/marketing/sections";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <MadeFor />
        <section id="demo" className="relative scroll-mt-20 py-28 md:py-36">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHead title="Hear Reppy at work">
              Pick a scenario and press play. On the right you&apos;ll see what Reppy understands as the conversation happens: intent, details, the booking and the summary the owner receives.
            </SectionHead>
            <InteractiveDemo />
          </div>
        </section>
        <Features />
        <HowItWorks />
        <Industries />
        <ReportShowcase />
        <Pricing />
        <Trust />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
