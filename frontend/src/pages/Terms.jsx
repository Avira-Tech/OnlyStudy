const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-gray-600 mb-6">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 mb-4">
            By accessing and using OnlyStudy, you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to abide by the above,
            please do not use this service.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. User Accounts</h2>
          <p className="text-gray-700 mb-4">
            When you create an account with us, you must provide information that is accurate,
            complete, and current at all times. You are responsible for safeguarding the password
            and for all activities that occur under your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Content and Conduct</h2>
          <p className="text-gray-700 mb-4">
            You are responsible for all content you post and your conduct on the platform.
            Prohibited activities include:
          </p>
          <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
            <li>Posting illegal, harmful, or offensive content</li>
            <li>Violating intellectual property rights</li>
            <li>Harassing or abusing other users</li>
            <li>Attempting to circumvent security measures</li>
            <li>Using the platform for commercial purposes without authorization</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Subscriptions and Payments</h2>
          <p className="text-gray-700 mb-4">
            Subscription fees are billed in advance on a recurring basis. You authorize us to
            charge your payment method for all fees incurred. All fees are non-refundable except
            as required by law.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
          <p className="text-gray-700 mb-4">
            The service and its original content, features, and functionality are and will remain
            the exclusive property of OnlyStudy and its licensors. The service is protected by
            copyright, trademark, and other laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Termination</h2>
          <p className="text-gray-700 mb-4">
            We may terminate or suspend your account immediately, without prior notice or liability,
            for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Disclaimers</h2>
          <p className="text-gray-700 mb-4">
            The information on this website is provided on an 'as is' basis. To the fullest extent
            permitted by law, OnlyStudy excludes all representations, warranties, conditions and terms
            whether express or implied, statutory or otherwise.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
          <p className="text-gray-700 mb-4">
            In no event shall OnlyStudy, nor its directors, employees, partners, agents, suppliers,
            or affiliates, be liable for any indirect, incidental, special, consequential or punitive
            damages, including without limitation, loss of profits, data, use, goodwill, or other
            intangible losses.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
          <p className="text-gray-700 mb-4">
            These Terms shall be interpreted and governed by the laws of [Your Jurisdiction],
            without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
          <p className="text-gray-700">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material, we will try to provide at least 30 days notice prior to any new
            terms taking effect.
          </p>
        </section>
      </div>
    </div>
  )
}

export default Terms
