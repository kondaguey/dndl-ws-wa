"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="card bg-white p-8 md:p-12 shadow-xl border border-slate-100 rounded-3xl">
        <h1 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase text-transparent bg-clip-text bg-gradient-to-br from-[var(--color-primary-dark)] to-[var(--color-primary)]">
          Privacy Policy
        </h1>

        <div className="space-y-8 text-gray-800 leading-relaxed font-medium">
          <p className="text-lg text-slate-600 mb-8 italic">
            Effective Date: December 13, 2025
          </p>

          {/* Section 1 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              1. Introduction
            </h2>
            <p>
              Your privacy is paramount. This policy outlines how this website
              collects, uses, and protects your information. As a personal
              portfolio and blog, my philosophy is simple:{" "}
              <strong>I only collect what is strictly necessary</strong> to keep
              the site running and to communicate with you. I do not sell your
              data.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              2. Information Collected
            </h2>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>
                <strong>Voluntary Information:</strong> If you contact me via
                email or a form, I collect your name, email address, and message
                content solely to reply to your inquiry.
              </li>
              <li>
                <strong>Technical Data:</strong> Like most websites, standard
                server logs (IP address, browser type, referring pages) are
                collected automatically for security and troubleshooting
                purposes.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              3. Cookies & Technology
            </h2>
            <p>
              This site uses minimal cookies essential for functionality,
              primarily provided by <strong>Supabase</strong> (my database
              provider) to manage secure sessions and authentication.
            </p>
            <p className="mt-2">
              You may disable cookies in your browser settings, though some site
              features may not function correctly without them. I do not use
              invasive third-party tracking pixels for advertising.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              4. Third-Party Services
            </h2>
            <p>
              I use trusted third-party service providers to host and run this
              site. While I do not control their privacy policies, I have
              selected providers known for security:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>
                <strong>Vercel:</strong> For website hosting and deployment.
              </li>
              <li>
                <strong>Supabase:</strong> For database management and content
                storage.
              </li>
            </ul>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              5. No AI Training
            </h2>
            <p>
              Consistent with my Terms of Use, I do not authorize the use of any
              user data or site content to train artificial intelligence models.
              Furthermore, I do not share user data with third-party AI
              companies for such purposes.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              6. Your Rights
            </h2>
            <p>
              Depending on your location (e.g., GDPR in Europe, CCPA in
              California), you may have rights regarding your data, including
              accessing, correcting, or deleting your personal information. If
              you wish to exercise these rights, please contact me directly.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              7. Contact
            </h2>
            <p>
              If you have any questions regarding this policy or your data,
              please contact me at:{" "}
              <a
                href="mailto:dm@danielnotdaylewis.com"
                className="text-[var(--color-primary)] font-bold hover:underline"
              >
                dm@danielnotdaylewis.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
