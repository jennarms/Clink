import { useState } from "react";

const ACCENT = "#2D5A27";

function ArrowLeft({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function Header({ title, onBack }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <button
        type="button"
        onClick={onBack}
        className="p-1 -ml-1 rounded-lg text-slate-400 hover:text-[#2D5A27] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        aria-label="Back"
      >
        <ArrowLeft size={18} />
      </button>
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
    </div>
  );
}

function Section({ heading, children }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{heading}</h3>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
        {children}
      </div>
    </div>
  );
}

export function TermsOfService({ onBack }) {
  return (
    <div className="space-y-4">
      <Header title="Terms of Service" onBack={onBack} />
      <p className="text-xs text-slate-400">Last updated: August 26, 2026</p>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        <Section heading="1. Accepting these terms">
          <p>By creating an account or using Clink, you agree to these Terms of Service. If you don't agree, please don't use the app.</p>
        </Section>

        <Section heading="2. What Clink does">
          <p>Clink is a link-in-bio tool. It lets you build a single page that links out to your other profiles, sites, and content, and share that page with your audience.</p>
        </Section>

        <Section heading="3. Your account">
          <p>You're responsible for keeping your login secure and for anything that happens under your account. Let us know right away if you think someone else has access to it.</p>
        </Section>

        <Section heading="4. Your content">
          <p>You keep ownership of the links, text, and images you add to your page. By posting them, you give Clink permission to display and store that content so your page works as intended.</p>
        </Section>

        <Section heading="5. Acceptable use">
          <p>Don't use Clink to share illegal content, malware, or links that impersonate someone else, and don't attempt to disrupt or reverse-engineer the service.</p>
        </Section>

        <Section heading="6. Availability">
          <p>We aim to keep Clink up and running, but we don't guarantee uninterrupted access. Features may change as the app improves.</p>
        </Section>

        <Section heading="7. Ending your account">
          <p>You can delete your account at any time. We may suspend or remove accounts that violate these terms.</p>
        </Section>

        <Section heading="8. Changes to these terms">
          <p>We may update these terms as Clink evolves. Continued use after an update means you accept the revised terms.</p>
        </Section>

        <Section heading="9. Contact">
          <p>Questions about these terms? Reach out from the Contact Support page.</p>
        </Section>
      </div>
    </div>
  );
}

export function PrivacyPolicy({ onBack }) {
  return (
    <div className="space-y-4">
      <Header title="Privacy Policy" onBack={onBack} />
      <p className="text-xs text-slate-400">Last updated: August 26, 2026</p>

      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        <Section heading="1. What we collect">
          <p>Your account details (like name and email), the links and content you add to your page, and basic usage data such as page views on your Clink link.</p>
        </Section>

        <Section heading="2. How we use it">
          <p>To run and improve Clink, show you visit stats for your own page, keep your account secure, and get in touch about important changes.</p>
        </Section>

        <Section heading="3. What we don't do">
          <p>We don't sell your personal data, and we don't share your content with third parties beyond what's needed to run the service (like hosting).</p>
        </Section>

        <Section heading="4. Cookies">
          <p>Clink uses minimal cookies to keep you signed in and remember preferences like dark mode. We don't use tracking cookies for advertising.</p>
        </Section>

        <Section heading="5. Data storage">
          <p>Your data is stored securely with providers we trust, and kept only as long as your account is active or as required by law.</p>
        </Section>

        <Section heading="6. Your choices">
          <p>You can edit or delete your content at any time, and you can request a copy or full deletion of your data by contacting support.</p>
        </Section>

        <Section heading="7. Children's privacy">
          <p>Clink isn't directed at children under 13, and we don't knowingly collect data from them.</p>
        </Section>

        <Section heading="8. Changes to this policy">
          <p>If this policy changes in a meaningful way, we'll let you know in the app before the change takes effect.</p>
        </Section>
      </div>
    </div>
  );
}

function ContactSupport({ onBack }) {
  return (
    <div className="space-y-4">
      <Header title="Contact Support" onBack={onBack} />

      <p className="text-sm text-slate-600 dark:text-slate-300 text-center px-2 pt-2">
        Something broken, confusing, or missing? Send a message and the Clink team
        will get back to you.
      </p>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">
        <a
          href="mailto:emailnotupdated"
          className="px-4 py-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="text-slate-500 dark:text-slate-400">Email</span>
          <span style={{ color: ACCENT }}>no contact support yet</span>
        </a>
      </div>

      <p className="text-xs text-slate-400 text-center">Typical response time: 1–2 business days</p>
    </div>
  );
}

export default function AboutWebsite({ onComplete }) {
  const [view, setView] = useState("about");

  if (view === "terms") return <TermsOfService onBack={() => setView("about")} />;
  if (view === "privacy") return <PrivacyPolicy onBack={() => setView("about")} />;
  if (view === "contact") return <ContactSupport onBack={() => setView("about")} />;

  return (
    <div className="space-y-4">
      <div className="text-center pt-2 pb-1">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">About Clink</h2>
        <p className="text-xs text-slate-500 mt-1">Version 1.0.0</p>
      </div>

      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <p>Clink is a simple link-in-bio tool that lets you share all your links from one page.</p>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden">

          <div className="px-4 py-3 flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Version</span>
            <span className="font-medium text-slate-800 dark:text-slate-100">1.0.0</span>
          </div>

          <button
            type="button"
            onClick={() => setView("terms")}
            className="w-full px-4 py-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <span className="text-slate-500 dark:text-slate-400">Terms of Service</span>
            <span style={{ color: ACCENT }}>View</span>
          </button>

          <button
            type="button"
            onClick={() => setView("privacy")}
            className="w-full px-4 py-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <span className="text-slate-500 dark:text-slate-400">Privacy Policy</span>
            <span style={{ color: ACCENT }}>View</span>
          </button>

          <button
            type="button"
            onClick={() => setView("contact")}
            className="w-full px-4 py-3 flex justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <span className="text-slate-500 dark:text-slate-400">Contact Support</span>
            <span style={{ color: ACCENT }}>View</span>
          </button>

        </div>
      </div>

      <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-700">
        <button type="button" onClick={onComplete} className="text-xs text-slate-500 hover:text-[#2D5A27] hover:underline cursor-pointer font-medium">
          ← Back to Account Settings
        </button>
      </div>
    </div>
  );
}