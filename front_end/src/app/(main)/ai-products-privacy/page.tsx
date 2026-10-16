import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus AI Products Privacy Notice",
  description:
    "How Metaculus collects, uses, discloses, and retains personal data in connection with its AI products, including Radiant. Supplements the Metaculus Privacy Policy.",
};

export default function AIProductsPrivacy() {
  const styles = {
    paragraph: "mb-4",
    sectionHeader: "mb-4 mt-8 scroll-mt-nav text-2xl font-bold",
  };
  return (
    <PageWrapper>
      <h1 className="mb-6 text-3xl font-bold">
        Metaculus AI Products Privacy Notice
      </h1>

      <p className={styles.paragraph}>
        <b>Effective Date:</b> September 21, 2026
      </p>

      <p className={styles.paragraph}>
        The Metaculus AI Products Terms Supplement referred to in this Notice is
        available at{" "}
        <a href="https://www.metaculus.com/ai-products-terms/">
          https://www.metaculus.com/ai-products-terms/
        </a>
        .
      </p>

      <p className={styles.paragraph}>
        This AI Products Privacy Notice (this &quot;<strong>Notice</strong>
        &quot;) supplements the Metaculus Privacy Policy available at{" "}
        <a href="https://www.metaculus.com/privacy-policy/">
          https://www.metaculus.com/privacy-policy/
        </a>{" "}
        and describes how Metaculus, Inc. collects, uses, discloses, and retains
        personal data in connection with the Covered Products (currently
        Radiant), wherever you access them. The Privacy Policy applies to the
        Covered Products, and its references to the &quot;Service&quot; include
        each Covered Product (including access through a Host Platform and
        through its API and MCP server). If this Notice conflicts with the
        Privacy Policy with respect to a Covered Product, this Notice controls.
        Capitalized terms have the meanings given in the Metaculus AI Products
        Terms Supplement and the Privacy Policy.
      </p>
      <h2
        className={styles.sectionHeader}
        id="a.-information-we-collect-through-the-covered-products"
      >
        A. Information We Collect Through the Covered Products
      </h2>
      <p className={styles.paragraph}>
        A.1 <strong>Account and connection data.</strong> Your Metaculus account
        information; Credentials such as API keys and OAuth tokens; and, when
        you connect through a Host Platform, identifiers that the Host Platform
        provides to authenticate you. We do not receive your Host Platform
        password or your Host Platform conversation history other than the Input
        the Host Platform sends to the Covered Product.
      </p>
      <p className={styles.paragraph}>
        A.2 <strong>Input and Output.</strong> The Input you (or your agent)
        submit, including the maps you build and any documents you import into
        them, and the Output the Covered Product returns. Input may contain
        personal data about you or others if you choose to include it. Unshared
        Input and Output are not public and are not &quot;public comments and
        postings&quot; for purposes of the Privacy Policy.
      </p>
      <p className={styles.paragraph}>
        A.3 <strong>Usage and technical data.</strong> Request timestamps, tool
        or endpoint called, Credits consumed, response status, error logs, IP
        address, Host Platform and client identifiers, and similar Usage
        Information, collected as described in the Privacy Policy.
      </p>
      <p className={styles.paragraph}>
        A.4 <strong>Payment data.</strong> If you purchase Credits, our payment
        processor collects your payment card or other payment details directly.
        We receive confirmation of payment, the last four digits and type of
        your card, billing name and country, and transaction history, but not
        your full card number.
      </p>
      <h2
        className={styles.sectionHeader}
        id="b.-how-we-use-information-collected-through-the-covered-products"
      >
        B. How We Use Information Collected Through the Covered Products
      </h2>
      <p className={styles.paragraph}>
        In addition to the purposes described in the Privacy Policy, we use
        information collected through the Covered Products to: provide the
        Covered Products and generate Output, including by transmitting Input
        and relevant Metaculus Data to AI Providers; authenticate you and
        connect your account to Host Platforms; meter usage, bill and account
        for Credits, and prevent circumvention of limits; maintain security,
        detect and prevent abuse, fraud, and violations of the Terms and the
        Metaculus AI Products Terms Supplement, and debug errors; respond to
        support requests; comply with legal obligations and enforce our rights;
        and improve, evaluate, and develop the Covered Products using Input and
        Output in de-identified or aggregated form as described in Section
        6.3(d) of the Metaculus AI Products Terms Supplement.{" "}
        <strong>
          We do not use unshared Input or Output to serve advertising, to build
          advertising profiles, or
        </strong>{" "}
        <strong>
          to personalize content outside the Covered Products, and we do not
          sell it or share it for cross-context behavioral advertising.
        </strong>
      </p>
      <h2 className={styles.sectionHeader} id="c.-ai-providers">
        C. AI Providers
      </h2>
      <p className={styles.paragraph}>
        C.1 To generate Output, we transmit your Input, together with relevant
        Metaculus Data and our system instructions, to one or more AI Providers.
        Currently these are: (a) OpenRouter, Inc., which routes each request to
        a large language model operated by a model provider, currently OpenAI,
        L.L.C. and Anthropic, PBC, and which performs web search through those
        model providers&apos; own search tools; and (b) when you request an AI
        forecast or question operationalization, Metaculus&apos;s own AI
        forecasting service, which runs on Metaculus systems, uses the providers
        in (a), and sends model-generated research queries and page requests
        (not your Input verbatim) to web search, news, and page-retrieval
        providers, currently Perplexity (through OpenRouter), AskNews, Parallel
        Web Systems, and Hyperbrowser. AI Providers act as our service providers
        (processors) and are contractually restricted to processing this data to
        provide their services to us.
      </p>
      <p className={styles.paragraph}>
        C.2 Under our agreements with the model providers in C.1(a), they do not
        use Input or Output to train or improve their models and retain API
        inputs and outputs for no more than 30 days for abuse and misuse
        monitoring, after which they are deleted, except where a provider is
        legally required to retain them longer. The research providers in C.1(b)
        receive only the queries and page requests described there and retain
        them under their own policies. We may change AI Providers from time to
        time and will update this Notice accordingly.
      </p>
      <p className={styles.paragraph}>
        C.3 Metaculus Data that we include in prompts to AI Providers may
        contain other users&apos; public User Content (such as comments and
        usernames). That content is already public on the Metaculus platform and
        its inclusion is within the license granted in the Terms.
      </p>
      <h2 className={styles.sectionHeader} id="d.-host-platforms">
        D. Host Platforms
      </h2>
      <p className={styles.paragraph}>
        When you access a Covered Product through a Host Platform, the Host
        Platform provider independently collects and processes your data,
        including your prompts, conversation history, Input and Output, and
        account information, under its own privacy policy and as an independent
        controller (not as our service provider). We do not control that
        processing. Please review the privacy policy of the Host Platform you
        use. We receive from Host Platforms only the Input and authentication
        data described in Section A, and we disclose to Host Platforms only the
        Output and technical responses needed to deliver the Covered Product to
        you.
      </p>
      <h2 className={styles.sectionHeader} id="e.-disclosure">
        E. Disclosure
      </h2>
      <p className={styles.paragraph}>
        We disclose information collected through the Covered Products to AI
        Providers as described in Section C; to Host Platforms as described in
        Section D; to the people you choose to share Input or Output with, as
        described in Section 6.6 of the Metaculus AI Products Terms Supplement;
        to our payment processor and other service providers (such as hosting,
        logging, analytics, and customer support providers) that process it on
        our behalf; and in the other circumstances described in the
        &quot;Information Sharing&quot; section of the Privacy Policy, including
        for legal reasons and business transitions.{" "}
        <strong>
          We do not disclose unshared Input or Output to other users or the
          public except to the people you choose to share it with
        </strong>
        , and we do not disclose it to third parties for their own marketing
        purposes.
      </p>
      <h2 className={styles.sectionHeader} id="f.-shared-content">
        F. Shared Content
      </h2>
      <p className={styles.paragraph}>
        If you use a &quot;Share on Metaculus&quot; or similar control, the
        shared Input or Output becomes public User Content. The Privacy
        Policy&apos;s provisions on Community Forums, User Content, and Public
        Information apply to Shared Content, and removal may not be possible or
        complete, as described there. Sharing does not affect the private status
        of Input and Output you have not shared. If you share Input or Output by
        link, visibility setting, or collaborator invitation without using such
        a control, it is disclosed to the people you chose, as described in
        Section 6.6 of the Metaculus AI Products Terms Supplement, but it does
        not become User Content.
      </p>
      <h2 className={styles.sectionHeader} id="g.-retention-and-deletion">
        G. Retention and Deletion
      </h2>
      <p className={styles.paragraph}>
        G.1 We retain unshared Input and Output for as long as your account is
        active, unless you delete it sooner or we are required to retain it
        longer. You may delete unshared Input and Output through your account
        settings where the product offers that feature or by emailing{" "}
        <a href="mailto:support@metaculus.com">support@metaculus.com</a> (or{" "}
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>
        ), and deleted content is removed from our active systems within 30 days
        of deletion or account closure and from backups on our normal rotation.
      </p>
      <p className={styles.paragraph}>
        G.2 We may retain de-identified or aggregated data derived from Input
        and Output indefinitely for the improvement purposes described in
        Section B. We retain usage, security, and billing records for the
        periods described in the &quot;General Retention Periods&quot; section
        of the Privacy Policy, and we may retain any data as needed to comply
        with law, resolve disputes, prevent abuse, or enforce our agreements.
      </p>
      <p className={styles.paragraph}>
        G.3 AI Providers retain Input and Output for the limited periods
        described in Section C. Host Platforms retain data under their own
        policies.
      </p>
      <h2 className={styles.sectionHeader} id="h.-children">
        H. Children
      </h2>
      <p className={styles.paragraph}>
        The Covered Products are not directed to, and may not be used by, anyone
        under 16 years of age. We do not knowingly collect personal data through
        the Covered Products from anyone under 16. If you believe we have done
        so, please contact{" "}
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a> and we will
        delete it.
      </p>
      <h2
        className={styles.sectionHeader}
        id="i.-individuals-in-the-eea-u.k.-and-switzerland"
      >
        I. Individuals in the EEA, U.K., and Switzerland
      </h2>
      <p className={styles.paragraph}>
        If you are located in the European Economic Area, the United Kingdom, or
        Switzerland, the EEA and UK Privacy Addendum to the Privacy Policy
        applies to the Covered Products. Our legal bases for processing personal
        data through the Covered Products are: performance of our contract with
        you (providing the Covered Products, metering Credits, and billing); our
        legitimate interests (securing the Covered Products, preventing abuse,
        and improving our services using de-identified data, balanced against
        your interests and rights); compliance with legal obligations; and your
        consent, where we ask for it (for example, for any identifiable-form use
        of Input for improvement). Input and Output are processed in the United
        States by Metaculus and its AI Providers and other service providers,
        under the transfer safeguards described in the Addendum. You may
        exercise your rights of access, rectification, erasure, restriction,
        portability, and objection as described in the Addendum, including with
        respect to unshared Input and Output.
      </p>
      <h2 className={styles.sectionHeader} id="j.-u.s.-state-privacy-rights">
        J. U.S. State Privacy Rights
      </h2>
      <p className={styles.paragraph}>
        Residents of California and other U.S. states with comprehensive privacy
        laws may exercise the rights described in the Privacy Policy with
        respect to personal data collected through the Covered Products,
        including the rights to know, delete, and correct. Unshared Input and
        Output are treated as personal data (not publicly available information)
        for these purposes. We do not sell personal data collected through the
        Covered Products or share it for cross-context behavioral advertising.
      </p>
      <h2 className={styles.sectionHeader} id="k.-changes-and-contact">
        K. Changes and Contact
      </h2>
      <p className={styles.paragraph}>
        We may update this Notice as the Covered Products evolve, including to
        reflect changes in AI Providers or retention practices, and will post
        the updated Notice at{" "}
        <a href="https://www.metaculus.com/ai-products-privacy/">
          https://www.metaculus.com/ai-products-privacy/
        </a>{" "}
        with a new Effective Date, and provide additional notice of material
        changes as the Privacy Policy describes. Questions about this Notice may
        be directed to Metaculus, Inc., Attn: Privacy Policy Issues, 1112
        Montana Avenue, Suite 464, Santa Monica, CA 90403, or{" "}
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>.
      </p>
    </PageWrapper>
  );
}
