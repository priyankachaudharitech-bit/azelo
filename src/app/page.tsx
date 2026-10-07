import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Faq } from "@/components/sections/Faq";
import { Hero } from "@/components/sections/Hero";
import { Outcomes } from "@/components/sections/Outcomes";
import { PainPoints } from "@/components/sections/PainPoints";
import { Process } from "@/components/sections/Process";
import { Services } from "@/components/sections/Services";
import { Technology } from "@/components/sections/Technology";
import { WhyWorkWithMe } from "@/components/sections/WhyWorkWithMe";
import { Work } from "@/components/sections/Work";
import { navigation } from "@/lib/content";

/**
 * Single landing page. Sections are listed in conversion order; all except the
 * navbar render on the server.
 */
export default function HomePage() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-accent focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-bg"
      >
        Skip to content
      </a>

      <Navbar links={navigation.links} cta={navigation.cta} />

      <main id="main">
        <Hero />
        <PainPoints />
        <Services />
        <Outcomes />
        <Process />
        <Work />
        <WhyWorkWithMe />
        <Technology />
        <About />
        <Faq />
        <Contact />
      </main>

      <Footer />
    </>
  );
}