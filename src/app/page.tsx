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
        <section id="demo" className="relative scroll-mt-20 py-24 md:py-28">
          <div className="mx-auto max-w-7xl px-5 md:px-8">
            <SectionHead title="Hear Reppy at work">
              Pick a scenario and press play. On the right you&apos;ll see what Reppy understands as the conversation happens: intent, details, the booking and the summary the owner receives.
            </SectionHead>
            <InteractiveDemo />
            <p className="mt-6 text-[14px] text-fg-3">
              These are scripted.{" "}
              <a href="/chat" className="text-violet-300 underline decoration-violet-500/40 underline-offset-4 hover:text-violet-400">
                Chat with the real AI
              </a>{" "}
              or{" "}
              <a href="/setup" className="text-violet-300 underline decoration-violet-500/40 underline-offset-4 hover:text-violet-400">
                set up your own business
              </a>
              .
            </p>
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
