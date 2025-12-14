"use client";

export default function TermsPage() {
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-12 md:py-20">
      <div className="card bg-white p-8 md:p-12">
        <h1 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase text-gradient">
          Terms of Use
        </h1>

        <div className="space-y-8 text-gray-800 leading-relaxed">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              1. Ownership
            </h2>
            <p>
              All content on this site—including text, images, audio, and
              code—is the original work of the site owner unless otherwise
              stated. You do not have permission to copy, use, or reproduce any
              content for personal, commercial, or research purposes without
              explicit written consent.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              2. No AI Training
            </h2>
            <p>
              You are strictly prohibited from using this content in any way
              that contributes to the training, fine-tuning, or development of
              artificial intelligence models, language models, or machine
              learning datasets—public or private, commercial or academic.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              3. No Scraping or Reuse
            </h2>
            <p>
              You may not scrape, download, archive, mirror, or otherwise
              extract content from this site for reuse or redistribution.
              Automated tools, bots, and scripts are not permitted to interact
              with this site outside of normal browsing activity.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              4. Liability
            </h2>
            <p>
              The content is provided as-is without guarantees. You access and
              use this site at your own risk. The owner is not responsible for
              any consequences resulting from the use or misuse of site
              materials.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              5. Updates
            </h2>
            <p>
              These terms may be updated at any time without notice. Continued
              use of the site implies acceptance of the current version of these
              terms.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold mb-3 text-[var(--color-primary-dark)]">
              6. Contact
            </h2>
            <p>
              For questions or permission requests, contact the site owner
              directly via the email provided on the collab page at{" "}
              <a
                href="mailto:dm@danielnotdaylewis.com"
                className="text-[var(--color-primary)] font-bold hover:underline"
              >
                dm@danielnotdaylewis.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
