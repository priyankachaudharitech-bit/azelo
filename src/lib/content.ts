/**
 * Central content model for the landing page.
 *
 * Everything a business owner is likely to edit lives here, typed and separated
 * from presentation. Sections import these exports; components never hard-code
 * marketing copy.
 *
 * Rules for this file:
 * - No invented proof. No client names, counts, ratings, prices, durations or
 *   credentials unless the owner supplies real ones.
 * - Unconfirmed values are expressed as `null` and the UI omits them entirely
 *   rather than rendering filler.
 */

/* -------------------------------------------------------------------------- */
/* Site                                                                       */
/* -------------------------------------------------------------------------- */

export type SocialLink = {
  /** Display label, e.g. "GitHub". */
  label: string;
  /** Full absolute URL, e.g. "https://github.com/your-handle". */
  href: string;
};

export const site = {
  name: "AZELO",
  role: "AI Automation & Full-Stack Systems",
  positioning:
    "Independent AI, automation and full-stack digital solutions brand building practical systems for modern businesses.",
  /**
   * PUBLIC contact address shown in the footer.
   *
   * This is a PUBLIC, visitor-facing address and is separate from
   * `INQUIRY_TO_EMAIL`, which is the private inbox where form submissions are
   * delivered. Set this deliberately — the internal destination inbox must not
   * be published automatically.
   *
   * `null` means "not published yet"; the footer then renders nothing rather
   * than a dead or invented address.
   */
  email: "priyankachaudhari.tech@gmail.com",
  /**
   * Social profiles. Empty by default: no profile URLs are invented, and the
   * footer renders no social row until real URLs are supplied.
   */
  social: [] as SocialLink[],
} as const;

/* -------------------------------------------------------------------------- */
/* Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export type NavLink = {
  label: string;
  /** In-page anchor. Every href resolves to a rendered section id. */
  href: string;
};

export const navigation = {
  links: [
    { label: "Services", href: "#services" },
    { label: "Work", href: "#work" },
    { label: "Process", href: "#process" },
    { label: "About", href: "#about" },
  ] satisfies NavLink[],
  cta: { label: "Discuss My Project", href: "#contact" } satisfies NavLink,
} as const;

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

export const hero = {
  eyebrow: "FULL-STACK • AI AUTOMATION • VOICE AI • DATA",
  headline: "I Build AI-Powered Systems That Help Businesses Work Smarter & Grow Faster.",
  supporting:
    "From high-converting websites and n8n automations to AI voice agents, lead research and data analytics — I design and build practical systems that reduce manual work and turn opportunities into action.",
  primaryCta: { label: "Discuss My Project", href: "#contact" },
  secondaryCta: { label: "Explore My Work", href: "#work" },
  /** Service-model statement. Not a metric, rating or client claim. */
  supportLine:
    "One technical partner from idea → UI → backend → automation → AI → data → deployment.",
} as const;

/**
 * The workflow the hero visual animates. Doubles as the explanatory text, so it
 * stays meaningful when animation is disabled.
 */
export type FlowNode = {
  id: string;
  label: string;
  /** What the system is doing at this step. */
  detail: string;
};

export const heroFlow: {
  caption: string;
  nodes: FlowNode[];
} = {
  caption: "A typical lead-to-report path through a connected system.",
  nodes: [
    { id: "capture", label: "Website Lead", detail: "Inquiry captured" },
    { id: "qualify", label: "Qualification", detail: "Lead scored" },
    { id: "automate", label: "Automation", detail: "Workflow triggered" },
    { id: "crm", label: "CRM / Sheets", detail: "Record updated" },
    { id: "outreach", label: "Email / Voice", detail: "Follow-up queued" },
    { id: "analytics", label: "Analytics", detail: "Report refreshed" },
  ],
};

/* -------------------------------------------------------------------------- */
/* Pain points                                                                */
/* -------------------------------------------------------------------------- */

export type PainPoint = {
  id: string;
  problem: string;
  /** The practical cost of leaving it unaddressed. */
  consequence: string;
};

export const painPoints = {
  eyebrow: "The Cost Of Manual Work",
  title: "Your business should not depend on repetitive manual work.",
  description:
    "Most operational friction is not a people problem. It is a systems problem — and it is fixable.",
  items: [
    {
      id: "slow-followup",
      problem: "Leads arrive, but follow-up is slow or inconsistent.",
      consequence: "Warm inquiries cool off while attention is spent elsewhere.",
    },
    {
      id: "copy-paste",
      problem: "Teams repeatedly copy information between tools and spreadsheets.",
      consequence: "Hours disappear into rekeying, and mistakes travel with the data.",
    },
    {
      id: "scattered-inquiries",
      problem: "Important inquiries get buried across forms, email and inboxes.",
      consequence: "Nobody owns the next step, so opportunities quietly go cold.",
    },
    {
      id: "manual-research",
      problem: "Prospect research consumes hours of manual searching.",
      consequence: "The list grows slowly and the quality stays unverified.",
    },
    {
      id: "unused-data",
      problem: "Business data exists but does not produce clear decisions.",
      consequence: "Reports describe the past instead of guiding the next move.",
    },
    {
      id: "ai-unclear",
      problem: "Teams want to use AI but cannot identify what should actually be automated.",
      consequence: "Experiments start, stall, and never reach daily operation.",
    },
  ] satisfies PainPoint[],
} as const;

/* -------------------------------------------------------------------------- */
/* Services                                                                   */
/* -------------------------------------------------------------------------- */

export type Service = {
  id: string;
  /** Two-digit marker shown in the mono label row. */
  index: string;
  title: string;
  /** One-line outcome promise. */
  summary: string;
  problem: string;
  solution: string;
  benefit: string;
  tech: string[];
};

export const services = {
  eyebrow: "What I Build",
  title: "Systems that replace manual work with connected processes.",
  description:
    "Five areas where most of the measurable time savings actually come from.",
  items: [
    {
      id: "web",
      index: "01",
      title: "Web Experiences Built to Generate Business",
      summary:
        "Websites and applications that turn attention into qualified inquiries.",
      problem:
        "Traffic arrives, but the site does not guide visitors toward a clear next step or capture the details you need to follow up.",
      solution:
        "Responsive, accessible frontends built on a real backend, with conversion-focused structure and API integrations back to your existing tools.",
      benefit:
        "Visitors get a clear path to enquire, and every submission arrives structured and ready to action.",
      tech: ["Next.js", "React", "TypeScript", "Node.js", "REST APIs"],
    },
    {
      id: "automation",
      index: "02",
      title: "Automate Repetitive Business Work",
      summary:
        "The steps between your tools run themselves, reliably and visibly.",
      problem:
        "Data moves between forms, inboxes, spreadsheets and CRMs by hand, so updates are slow and errors are common.",
      solution:
        "Workflow automation that routes leads, triggers notifications, keeps records synchronised and reports failures instead of failing quietly.",
      benefit:
        "Repetitive handoffs stop depending on who happens to be watching the inbox.",
      tech: ["n8n", "REST APIs", "Webhooks", "Node.js"],
    },
    {
      id: "voice",
      index: "03",
      title: "Never Let an Important Inquiry Go Unanswered",
      summary:
        "Voice workflows that answer, qualify and hand off with a clear record.",
      problem:
        "Calls arrive outside working hours or during busy periods, and the first person to call back may not be the right one.",
      solution:
        "AI voice workflows that answer routine enquiries, collect structured details, check availability, book or schedule a follow-up, and pass the context to a human.",
      benefit:
        "Every caller gets a response, and the team receives the detail they need before picking the conversation up.",
      tech: ["Voice APIs", "Webhooks", "n8n", "CRM"],
    },
    {
      id: "research",
      index: "04",
      title: "Turn Prospect Research Into Sales-Ready Data",
      summary:
        "A structured, deduplicated prospect list delivered in the format you already use.",
      problem:
        "Building a target list means hours of searching, copying and cleaning, with duplicates and gaps left behind.",
      solution:
        "Defined targeting criteria, enrichment from publicly available business information, structured Excel and CSV delivery, and de-duplication.",
      benefit:
        "Your team opens a usable list instead of a research task.",
      tech: ["Excel", "CSV", "Python", "REST APIs"],
    },
    {
      id: "data",
      index: "05",
      title: "Turn Messy Data Into Decisions",
      summary:
        "Cleaned, joined and reported data that answers an actual question.",
      problem:
        "Operational data sits in exports nobody reconciles, so reporting is manual and conclusions are hard to defend.",
      solution:
        "Cleaning and joining of the underlying data, repeatable analysis, and dashboards that surface the figures worth watching.",
      benefit:
        "Reporting becomes repeatable, and decisions rest on numbers you can trace.",
      tech: ["Python", "SQL", "Excel", "Power BI"],
    },
  ] satisfies Service[],
} as const;

/* -------------------------------------------------------------------------- */
/* Outcomes                                                                   */
/* -------------------------------------------------------------------------- */

export type Outcome = {
  id: string;
  title: string;
  statement: string;
};

export const outcomes = {
  eyebrow: "Business Outcomes",
  title: "What changes when the system works.",
  description:
    "These are the effects these systems are designed to produce. Actual results depend on your process, volume and existing tools — nothing here is a guaranteed result.",
  items: [
    {
      id: "faster-response",
      title: "Faster lead response",
      statement:
        "Built to reduce the gap between an inquiry arriving and a person or workflow responding to it.",
    },
    {
      id: "less-repetition",
      title: "Less repetitive work",
      statement:
        "Designed to remove rekeying, copying and chasing, so people spend time on work that needs judgement.",
    },
    {
      id: "connected-tools",
      title: "Connected business tools",
      statement:
        "Built so the systems you already pay for update each other rather than sitting in isolation.",
    },
    {
      id: "cleaner-data",
      title: "Cleaner operational data",
      statement:
        "Built to reduce duplicate records and missing fields before the data reaches a report.",
    },
    {
      id: "visibility",
      title: "Better visibility",
      statement:
        "Can help teams see where leads stall and where manual effort concentrates, from one place.",
    },
    {
      id: "scales-with-workflow",
      title: "Systems that scale with the workflow",
      statement:
        "Designed so added volume is absorbed by the process rather than by adding more copying.",
    },
  ] satisfies Outcome[],
} as const;

/* -------------------------------------------------------------------------- */
/* Process                                                                    */
/* -------------------------------------------------------------------------- */

export type ProcessStage = {
  id: string;
  step: string;
  title: string;
  description: string;
  /** Concrete artefact produced in this phase. */
  output: string;
};

export const process = {
  eyebrow: "How I Work",
  title: "An engineering process, not a sales funnel.",
  description:
    "Each phase produces something reviewable, so decisions are made on evidence rather than on enthusiasm.",
  stages: [
    {
      id: "discover",
      step: "01",
      title: "Discover",
      description:
        "I map the current process, the tools already in use and where time is actually being lost.",
      output: "Process map and prioritised problem list",
    },
    {
      id: "design",
      step: "02",
      title: "Design",
      description:
        "The architecture and interfaces are sketched and agreed before implementation begins.",
      output: "System design, data flow and screen designs",
    },
    {
      id: "build",
      step: "03",
      title: "Build",
      description:
        "Implementation in short, reviewable increments so progress stays visible throughout.",
      output: "Working software in a testable environment",
    },
    {
      id: "test",
      step: "04",
      title: "Test",
      description:
        "Functionality, failure handling and real-world input are verified before anything goes live.",
      output: "Test results and a verified staging build",
    },
    {
      id: "launch",
      step: "05",
      title: "Launch",
      description:
        "Deployment with the integrations, redirects and monitoring needed for a clean release.",
      output: "Live system and documented handover",
    },
    {
      id: "improve",
      step: "06",
      title: "Improve",
      description:
        "Real usage data points to the next bottleneck, and the system is extended where it pays.",
      output: "Prioritised next iteration",
    },
  ] satisfies ProcessStage[],
} as const;

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export type ProjectKind = "Demo System" | "Concept Project" | "Internal Project";

export type Project = {
  id: string;
  /** Honesty label. Never remove — these are not client engagements. */
  kind: ProjectKind;
  title: string;
  /** Plain statement that this is a self-initiated build, not client work. */
  disclaimer: string;
  challenge: string;
  /** Ordered pipeline steps. */
  system: string[];
  capabilities: string[];
  tech: string[];
};

export const projects = {
  eyebrow: "Selected Work",
  title: "Systems built to demonstrate how the pieces fit together.",
  description:
    "No verified client case studies are published yet. What follows are self-initiated demo and concept systems — real architectures and real implementations, not client engagements.",
  items: [
    {
      id: "lead-pipeline",
      kind: "Demo System",
      title: "Automated Lead Qualification Pipeline",
      disclaimer:
        "Self-initiated demo system. Not client work, and no client results are claimed.",
      challenge:
        "A website inquiry arrives as unstructured text, and the sales team has no consistent way to judge urgency before responding.",
      system: [
        "Website inquiry received",
        "Structured extraction and scoring",
        "n8n workflow routing",
        "CRM or sheet record written",
        "Email follow-up queued",
        "Activity reported",
      ],
      capabilities: [
        "Field validation and scoring rules",
        "Branch routing by lead quality",
        "Duplicate and failed-write handling",
        "Status reporting per lead",
      ],
      tech: ["Next.js", "n8n", "REST APIs", "Google Sheets", "Zod"],
    },
    {
      id: "voice-assistant",
      kind: "Demo System",
      title: "AI Voice Lead Assistant",
      disclaimer:
        "Self-initiated demo system. Call handling is scripted and bounded; a human remains in control of escalation.",
      challenge:
        "Enquiries arriving outside working hours need a consistent response and a reliable record, without promising capability the system does not have.",
      system: [
        "Inbound or outbound call answered",
        "Structured qualification collected",
        "Availability checked",
        "Appointment or follow-up actioned",
        "CRM record updated",
        "Human handoff with full context",
      ],
      capabilities: [
        "Bounded scripted conversations",
        "Explicit handoff and escalation path",
        "Call outcome written to the record",
        "No sensitive or payment data collected",
      ],
      tech: ["Voice APIs", "Webhooks", "n8n", "CRM"],
    },
    {
      id: "bi-dashboard",
      kind: "Concept Project",
      title: "Business Intelligence Dashboard",
      disclaimer:
        "Concept build demonstrating the data pipeline. Figures shown are synthetic sample data.",
      challenge:
        "Operational exports are pulled manually each week, reconciled by hand, and reported without a consistent definition.",
      system: [
        "Raw operational exports collected",
        "Cleaning and de-duplication",
        "Joined into a consistent model",
        "Analysis and metric definitions",
        "Dashboard and scheduled report",
      ],
      capabilities: [
        "Repeatable cleaning pipeline",
        "Documented metric definitions",
        "Scheduled report delivery",
        "Traceable figures back to source rows",
      ],
      tech: ["Python", "SQL", "Power BI", "CSV", "PostgreSQL"],
    },
  ] satisfies Project[],
} as const;

/* -------------------------------------------------------------------------- */
/* Why work with me                                                           */
/* -------------------------------------------------------------------------- */

export const whyWorkWithMe = {
  eyebrow: "Why Work With Me",
  title: "One technical partner across the whole system.",
  description:
    "Most projects break between specialists. A design decision, an API contract and an automation rule are usually owned by three different people who never speak. I work across the full chain, so the pieces are designed to fit each other.",
  stages: [
    "Strategy",
    "UX / UI",
    "Frontend",
    "Backend",
    "APIs",
    "Automation",
    "AI",
    "Data",
    "Deployment",
  ],
  points: [
    {
      id: "fewer-handoffs",
      title: "Fewer handoffs",
      description:
        "The person who designs the flow is the person who implements it, so nothing is lost in translation between contractors.",
    },
    {
      id: "context",
      title: "Whole-system context",
      description:
        "Frontend, backend, automation and data are considered together from the start rather than retrofitted to each other.",
    },
    {
      id: "ownership",
      title: "One implementation owner",
      description:
        "There is a single accountable party for whether the end-to-end flow works, including the integrations in between.",
    },
    {
      id: "maintainability",
      title: "Maintainable by design",
      description:
        "Systems are built to be understood and adjusted later, rather than depending on undocumented knowledge.",
    },
  ],
  caveat:
    "This is a single independent practice. For work that requires a large dedicated team, specialist compliance review, or regulated-scale delivery, the right answer is usually a firm with those resources.",
} as const;

/* -------------------------------------------------------------------------- */
/* Technology                                                                 */
/* -------------------------------------------------------------------------- */

export type TechnologyItem = {
  label: string;
  /**
   * OWNER VERIFICATION REQUIRED unless marked otherwise.
   *
   * `true` = taken directly from the confirmed business brief.
   * `false` = inferred from the services offered. Inference is NOT evidence of
   *   professional ability, so these are hidden until you confirm them.
   *
   * Set `onlyShowVerified: true` below once you have confirmed or removed the
   * unverified entries, and the section will render only what you stand behind.
   */
  verified: boolean;
};

export type TechnologyGroup = {
  id: string;
  group: string;
  items: TechnologyItem[];
};

export const technology = {
  eyebrow: "Technology",
  title: "An ecosystem, not a logo wall.",
  description:
    "The tools below are chosen per project. Each one is listed because it is part of how the work actually gets delivered.",
  onlyShowVerified: true,
  groups: [
    {
      id: "frontend",
      group: "Frontend",
      items: [
        { label: "Next.js", verified: true },
        { label: "React", verified: true },
        { label: "TypeScript", verified: true },
        { label: "Tailwind CSS", verified: true },
      ],
    },
    {
      id: "backend",
      group: "Backend",
      items: [
        { label: "Node.js", verified: true },
        { label: "REST APIs", verified: true },
      ],
    },
    {
      id: "automation",
      group: "Automation",
      items: [
        { label: "n8n", verified: true },
        { label: "Email delivery", verified: true },
      ],
    },
    {
      id: "data",
      group: "Data",
      items: [
        { label: "Excel", verified: true },
        { label: "CSV", verified: true },
      ],
    },
    {
      id: "delivery",
      group: "Delivery",
      items: [
        { label: "Git", verified: true },
      ],
    },
  ] satisfies TechnologyGroup[],
} as const;

/* -------------------------------------------------------------------------- */
/* About                                                                      */
/* -------------------------------------------------------------------------- */

export const about = {
  eyebrow: "About",
  title: "An independent AI, automation and full-stack digital solutions brand.",
  paragraphs: [
    "AZELO is an independent AI, automation and full-stack digital solutions brand focused on building practical systems for modern businesses.",
    "I help businesses reduce repetitive work, capture and manage opportunities more effectively, and turn disconnected tools and data into useful working systems.",
    "My work combines full-stack web development, n8n automation, AI voice agents, lead research and data analysis. I can work across the full solution — from understanding the business problem and designing the interface to backend logic, automation, AI integration and deployment.",
    "The goal is not to add AI simply because it is trending. The goal is to build technology that solves a real business problem, saves time and makes the business easier to operate.",
  ],
  workingAcross: [
    "Full-Stack Web Development",
    "AI & Business Automation",
    "n8n Workflows",
    "AI Voice Agents",
    "Lead Research & Excel Delivery",
    "Data Analysis",
    "API & Tool Integrations",
    "Technical Implementation",
  ],
} as const;

/* -------------------------------------------------------------------------- */
/* FAQ                                                                        */
/* -------------------------------------------------------------------------- */

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const faq = {
  eyebrow: "Questions",
  title: "What clients usually ask first.",
  items: [
    {
      id: "project-types",
      question: "What kinds of projects do you take on?",
      answer:
        "Lead capture and enquiry handling, workflow automation between existing tools, AI voice workflows for enquiries, prospect research delivery, and internal reporting. Most projects combine two or three of these.",
    },
    {
      id: "existing-systems",
      question: "Can you improve an existing system instead of rebuilding it?",
      answer:
        "Usually, yes. The first step is understanding what is already working and where it breaks. Rebuilding only makes sense when the current structure is the actual constraint, and I will explain why if that is the case.",
    },
    {
      id: "tool-connection",
      question: "Can you connect the tools we already use?",
      answer:
        "If the tools expose an API, webhook, or import/export path, they can usually be connected. I will confirm what is possible for your specific stack before any commitment.",
    },
    {
      id: "n8n-apis",
      question: "Do you work with n8n and APIs?",
      answer:
        "Yes. n8n is a common backbone for lead routing, notifications and data synchronisation, and API design is part of most projects I build.",
    },
    {
      id: "frontend-backend",
      question: "Can you build both the frontend and the backend?",
      answer:
        "Yes. Keeping both ends in one implementation is usually why projects avoid the gaps that appear when separate contractors own each side.",
    },
    {
      id: "starting",
      question: "How does a project usually start?",
      answer:
        "With a conversation about the process, not a feature list. If there is a clear fit, I map where time is being lost and propose the smallest useful first step.",
    },
    {
      id: "teams",
      question: "Can you work with an existing team or agency?",
      answer:
        "Yes. I regularly act as the technical implementation partner for agencies that already handle strategy or client relationships but need engineering delivered.",
    },
  ] satisfies FaqItem[],
} as const;

/* -------------------------------------------------------------------------- */
/* Contact                                                                    */
/* -------------------------------------------------------------------------- */

export const contact = {
  eyebrow: "Project Inquiry",
  title: "Tell me about your project.",
  supporting:
    "The more concrete the process, the more useful the first reply. Sharing what happens today, which tools are involved and where the work gets stuck is enough to start.",
  /**
   * Phase 4 replaces the preview shell with a validated, rate-limited
   * submission flow. Field definitions already live here so the UI and the
   * eventual Zod schema share one source of truth.
   */
  fieldNotes: [
    "What you need built, and why now",
    "The tools the work moves between today",
    "Who currently does the task by hand",
  ],
  previewNotice:
    "This form is a preview — submissions are not delivered yet. Direct email contact will be published here once it is set up.",
} as const;

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

export const footer = {
  statement: site.positioning,
  columns: [
    {
      id: "navigate",
      title: "Navigate",
      links: [
        { label: "Services", href: "#services" },
        { label: "Selected Work", href: "#work" },
        { label: "How I Work", href: "#process" },
        { label: "About", href: "#about" },
        { label: "FAQ", href: "#faq" },
      ] satisfies NavLink[],
    },
    {
      id: "capabilities",
      title: "Capabilities",
      links: [
        { label: "Full-Stack Web", href: "#services" },
        { label: "Workflow Automation", href: "#services" },
        { label: "AI Voice Workflows", href: "#services" },
        { label: "Lead Research Delivery", href: "#services" },
        { label: "Data & Reporting", href: "#services" },
      ] satisfies NavLink[],
    },
    {
      id: "start",
      title: "Start",
      links: [{ label: "Discuss My Project", href: "#contact" }] satisfies NavLink[],
    },
  ],
} as const;