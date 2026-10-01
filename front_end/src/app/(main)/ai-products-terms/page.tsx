import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus AI Products Terms Supplement",
  description:
    "Additional terms that govern Metaculus AI products, including Radiant, and supplement the Metaculus Terms of Use and Privacy Policy.",
};

export default function AIProductsTerms() {
  const styles = {
    paragraph: "mb-4",
    sectionHeader: "mb-4 mt-8 scroll-mt-nav text-2xl font-bold",
  };
  return (
    <PageWrapper>
      <h1 className="mb-6 text-3xl font-bold">
        Metaculus AI Products Terms Supplement
      </h1>

      <p className={styles.paragraph}>
        <b>Effective Date:</b> September 21, 2026
      </p>

      <p className={styles.paragraph}>
        The Metaculus AI Products Privacy Notice referred to in this Supplement
        is available at{" "}
        <a href="https://www.metaculus.com/ai-products-privacy/">
          https://www.metaculus.com/ai-products-privacy/
        </a>
        .
      </p>

      <p className={styles.paragraph}>
        These AI Products Terms (this &quot;<strong>Supplement</strong>&quot;)
        govern your access to and use of Radiant (a &quot;Covered Product,&quot;
        as defined below), an AI-assisted forecasting and modeling service
        offered by Metaculus, Inc. (&quot;<strong>Metaculus</strong>,&quot;
        &quot;<strong>we</strong>,&quot; or &quot;<strong>us</strong>&quot;).
        This Supplement is part of, and incorporates by reference, the Metaculus
        Terms of Use available at{" "}
        <a href="https://www.metaculus.com/terms-of-use/">
          https://www.metaculus.com/terms-of-use/
        </a>{" "}
        (the &quot;<strong>Terms</strong>&quot;) and the Metaculus Privacy
        Policy available at{" "}
        <a href="https://www.metaculus.com/privacy-policy/">
          https://www.metaculus.com/privacy-policy/
        </a>{" "}
        (the &quot;<strong>Privacy Policy</strong>&quot;), each as supplemented
        by this document. Capitalized terms not defined here have the meanings
        given in the Terms.
      </p>
      <p className={styles.paragraph}>
        <strong>
          By creating an account for, signing in to, connecting to, enabling, or
          using a Covered Product, including through a third-party AI assistant
          or application,
        </strong>{" "}
        <strong>
          you agree to this Supplement, the Terms, and the Privacy Policy.
        </strong>{" "}
        If you do not agree, do not use the Covered Products. If you are using a
        Covered Product on behalf of an organization, you represent that you
        have authority to bind that organization, and &quot;you&quot; refers to
        both you and the organization.
      </p>
      <h2 className={styles.sectionHeader} id="definitions">
        1. Definitions
      </h2>
      <p className={styles.paragraph}>
        1.1 &quot;<strong>Covered Products</strong>&quot; means Radiant, however
        accessed, including its web interface on metaculus.com and its
        subdomains, its API, its MCP server, and any plugin, connector, app, or
        integration through which Metaculus makes it available, together with
        any other Metaculus product that Metaculus identifies as subject to this
        Supplement. &quot;<strong>Radiant</strong>&quot; means the interactive
        forecasting and modeling service that Metaculus offers under the Radiant
        name, in which you build models (&quot;maps&quot;) of uncertain
        quantities and run simulations and analyses on them. A reference to a
        &quot;Covered Product&quot; applies to each Covered Product.
      </p>
      <p className={styles.paragraph}>
        1.2 &quot;<strong>Host Platform</strong>&quot; means any third-party AI
        assistant, agent, model, application, or marketplace through which you
        access a Covered Product, such as Claude, Claude Code, or ChatGPT, and
        the provider of that platform.
      </p>
      <p className={styles.paragraph}>
        1.3 &quot;<strong>Input</strong>&quot; means the questions, prompts,
        text, files, parameters, and other content that you (or a Host Platform
        acting on your instructions) submit to a Covered Product, including the
        content of any map you build or edit (such as node titles, descriptions,
        values, formulas, and imported documents). Input does not include Shared
        Content.
      </p>
      <p className={styles.paragraph}>
        1.4 &quot;<strong>Output</strong>&quot; means the forecasts,
        probabilities, reasoning, explanations, summaries, and other content
        that a Covered Product generates and returns in response to Input,
        including simulation results, sensitivity analyses, and AI-generated
        suggestions and explanations. Output does not include Metaculus Data.
      </p>
      <p className={styles.paragraph}>
        1.5 &quot;<strong>Metaculus Data</strong>&quot; means questions,
        community and aggregate forecasts, comments, resolutions, scores, and
        other data and content from the Metaculus platform, whether accessed
        directly or reproduced or referenced in Output, and includes Metaculus
        Content and other users&apos; User Content.
      </p>
      <p className={styles.paragraph}>
        1.6 &quot;<strong>Shared Content</strong>&quot; means any Input or
        Output that you elect to publish to the Metaculus platform using a
        &quot;Share on Metaculus&quot; control or similar feature that Metaculus
        identifies as making content public. Content that you make visible to
        others by link, visibility setting, or collaborator invitation without
        using such a control is not Shared Content and is governed by Section
        6.6.
      </p>
      <p className={styles.paragraph}>
        1.7 &quot;<strong>Credits</strong>&quot; means the prepaid units of
        usage that Metaculus may sell or grant for use of a Covered Product,
        including periodic Credit allowances.
      </p>
      <p className={styles.paragraph}>
        1.8 &quot;<strong>AI Provider</strong>&quot; means a third-party
        provider of large language models, model routing, web search or
        research, or related AI services that Metaculus uses to operate the
        Covered Products.
      </p>
      <h2
        className={styles.sectionHeader}
        id="relationship-to-the-terms-of-use"
      >
        2. Relationship to the Terms of Use
      </h2>
      <p className={styles.paragraph}>
        2.1 <strong>The Covered Products are part of the Service.</strong> For
        purposes of the Terms and the Privacy Policy, the &quot;Service&quot;
        includes each Covered Product wherever and however you access it,
        including through a Host Platform and whether or not you visit
        metaculus.com.
      </p>
      <p className={styles.paragraph}>
        2.2 <strong>Order of precedence.</strong> If this Supplement conflicts
        with the Terms or the Privacy Policy with respect to a Covered Product,
        this Supplement controls. In particular, and only with respect to the
        Covered Products: (a) Input is <strong>not</strong> User Content and is
        governed by Section 6 rather than the &quot;User Content and
        Activities&quot; section of the Terms; (b) Output is governed by Section
        7 rather than the &quot;Proprietary Rights&quot; and &quot;Your License
        to Use Site Content&quot; sections of the Terms; (c) the restrictions in
        the Terms on automated use, scripts, and bots, and the requirement that
        you use the Service only for personal use, are modified by Section 5;
        and (d) the age requirement in the Terms is replaced by Section 3.1. All
        other provisions of the Terms, including the Acceptable Use Policy,
        Disclaimer of Warranties, Limitations of Liability, Indemnity, and Legal
        Disputes sections, apply to the Covered Products in full.
      </p>
      <p className={styles.paragraph}>
        2.3 <strong>Additional terms.</strong> Metaculus may post additional
        terms, documentation, or usage limits for specific features of a Covered
        Product or for its API or MCP server. Those additional terms are
        incorporated into this Supplement.
      </p>
      <p className={styles.paragraph}>
        2.4 <strong>Separate agreements.</strong> If you or your organization
        has a separate written agreement with Metaculus that covers your use of
        a Covered Product (for example, a pilot, services, or subscription
        agreement), that agreement controls over this Supplement to the extent
        of any conflict.
      </p>
      <h2 className={styles.sectionHeader} id="eligibility-and-accounts">
        3. Eligibility and Accounts
      </h2>
      <p className={styles.paragraph}>
        3.1 <strong>Age.</strong> You must be at least 16 years old to use a
        Covered Product. If you are between 16 and the age of majority where you
        live, you must review this Supplement and the Terms with your parent or
        guardian, who must agree to them on your behalf, and you may not
        purchase Credits. The Covered Products are not directed to, and may not
        be used by, anyone under 16.
      </p>
      <p className={styles.paragraph}>
        3.2 <strong>Account and linking.</strong> Use of a Covered Product
        requires an account for that product. Product accounts are separate from
        accounts on the Metaculus platform at metaculus.com, and the limit in
        the Terms of one Metaculus account per person applies separately to each
        Covered Product and to the Metaculus platform. Some Covered Products are
        available by invitation only, and Metaculus may create your account at
        your or your organization&apos;s request. Use of a Covered Product may
        also require you to link your account to a Host Platform, or to generate
        API keys, tokens, or other credentials (&quot;
        <strong>Credentials</strong>&quot;). Credentials are personal to you and
        your account. You may not share, sell, or transfer Credentials, and you
        are responsible for all activity conducted through your Credentials and
        through any Host Platform or agent connected to your account, whether or
        not you specifically directed each action.
      </p>
      <p className={styles.paragraph}>
        3.3 <strong>Agent activity.</strong> When you connect a Covered Product
        to a Host Platform or other software agent, that agent may submit Input,
        consume Output, and take other actions on your behalf. You are
        responsible for configuring, supervising, and controlling any such agent
        and for all Input it submits. Metaculus is not responsible for the
        behavior of any Host Platform or agent, including its interpretation or
        use of Output.
      </p>
      <p className={styles.paragraph}>
        3.4 <strong>Organizations.</strong> If you use a Covered Product on
        behalf of an organization, you are responsible for ensuring that all of
        the organization&apos;s users comply with this Supplement.
      </p>
      <h2 className={styles.sectionHeader} id="early-access-and-beta-services">
        4. Early Access and Beta Services
      </h2>
      <p className={styles.paragraph}>
        4.1 The Covered Products are currently offered as early access or{" "}
        <strong>beta</strong> services. They are under active development, may
        contain errors, may be changed, suspended, or discontinued at any time
        without notice, and may be subject to usage limits, downtime, and loss
        of data, Input, Output, or Credits. Features described in documentation
        or marketing may not be available or may work differently than
        described.
      </p>
      <p className={styles.paragraph}>
        4.2 Metaculus may limit access to a Covered Product, or to particular
        features, to selected users, regions, or Host Platforms during the early
        access or beta period, and may transition a Covered Product to a paid or
        generally available service on notice posted to the Service or sent to
        you. Section 9 governs any charges.
      </p>
      <p className={styles.paragraph}>
        4.3 Any feedback, suggestions, or ideas you provide about a Covered
        Product are governed by the &quot;User Content and Activities&quot;
        section of the Terms as it relates to ideas and concepts, and Metaculus
        may use them without restriction or compensation. Feedback is not Input.
      </p>
      <h2
        className={styles.sectionHeader}
        id="permitted-use-automated-and-agentic-access"
      >
        5. Permitted Use; Automated and Agentic Access
      </h2>
      <p className={styles.paragraph}>
        5.1 <strong>License to use the Covered Products.</strong> Subject to
        your compliance with this Supplement and the Terms, Metaculus grants you
        a limited, non-exclusive, non-transferable, revocable license to access
        and use the Covered Products, including through their APIs and MCP
        servers and through supported Host Platforms, for your personal use and
        for your internal business purposes. Your rights to use Output,
        including in work product you prepare for others, are set out in Section
        7.
      </p>
      <p className={styles.paragraph}>
        5.2{" "}
        <strong>
          Automated access is permitted through sanctioned interfaces.
        </strong>{" "}
        Notwithstanding the restrictions in the Terms on automated use, scripts,
        bots, or data-mining, you may access a Covered Product by automated
        means, including through an AI agent or Host Platform, but only through
        that product&apos;s API, MCP server, or other interface that Metaculus
        designates for that purpose, and only in compliance with any rate
        limits, usage limits, and technical documentation that Metaculus
        publishes. Access to a Covered Product or to Metaculus Data by any other
        automated means (including scraping the Metaculus website) remains
        prohibited.
      </p>
      <p className={styles.paragraph}>
        5.3 <strong>Restrictions.</strong> In addition to the Acceptable Use
        Policy in the Terms, you may not, and may not permit or direct any agent
        or Host Platform to:
      </p>
      <p className="mb-4 ml-6">
        (a) use a Covered Product or Output to train, fine-tune, evaluate for
        the purpose of training, or otherwise develop any artificial
        intelligence or machine learning model, or to build a dataset for those
        purposes, without Metaculus&apos;s prior written permission (for
        clarity, submitting Output to a Host Platform in the ordinary course of
        using a Covered Product through that platform is permitted);
      </p>
      <p className="mb-4 ml-6">
        (b) use a Covered Product to systematically extract, reconstruct, or
        replicate Metaculus Data, or to build or contribute to a product or
        service that competes with Metaculus&apos;s forecasting platform or the
        Covered Products;
      </p>
      <p className="mb-4 ml-6">
        (c) resell, sublicense, rent, or provide a Covered Product, or offer
        Output on demand as a service to third parties, including by wrapping or
        white-labeling a Covered Product, without Metaculus&apos;s prior written
        permission (for clarity, including Output in reports, analyses, and
        other work product that you prepare for your clients or your
        organization is permitted under Section 7.2);
      </p>
      <p className="mb-4 ml-6">
        (d) attempt to extract, reverse engineer, or manipulate a Covered
        Product&apos;s system prompts, instructions, model configuration, or
        safeguards, or submit Input designed to cause a Covered Product to
        bypass its safeguards, act outside its intended function, or generate
        content that violates the Terms (including &quot;prompt injection&quot;
        or &quot;jailbreak&quot; techniques);
      </p>
      <p className="mb-4 ml-6">
        (e) circumvent rate limits, usage limits, or Credit requirements, or use
        multiple accounts or Credentials to do so;
      </p>
      <p className="mb-4 ml-6">
        (f) submit Input that contains personal data about others that you do
        not have the right to disclose, or protected health, financial account,
        government identifier, or other sensitive personal data, except as the
        product&apos;s documentation expressly permits;
      </p>
      <p className="mb-4 ml-6">
        (g) use a Covered Product in any manner that violates the usage policies
        or terms of the Host Platform through which you access it; or
      </p>
      <p className="mb-4 ml-6">
        (h) represent that Output is endorsed by Metaculus, is a Metaculus
        community forecast, or reflects the views of Metaculus or its community,
        or remove or alter any notice that Output is AI-generated.
      </p>
      <p className={styles.paragraph}>
        5.4 <strong>Metaculus Data.</strong> Metaculus Data that a Covered
        Product surfaces or incorporates in Output remains Metaculus Content or
        other users&apos; User Content, as applicable, and remains subject to
        the Terms. Your license under Section 7.2 to use Output does not expand
        your rights in Metaculus Data beyond those granted in the Terms, except
        that you may reproduce Metaculus Data to the extent it is incidentally
        embedded in Output that you are otherwise permitted to use.
      </p>
      <h2
        className={styles.sectionHeader}
        id="your-input-privacy-presumption-and-limited-license"
      >
        6. Your Input: Privacy Presumption and Limited License
      </h2>
      <p className={styles.paragraph}>
        6.1 <strong>Input is private by default.</strong> Unless and until you
        make it Shared Content, your Input (and the Output generated from it) is
        not User Content, will not be published or displayed to other users or
        the public (other than to people you choose to share it with under
        Section 6.6), will not be indexed or made searchable, and will not be
        used to generate or adjust Metaculus community forecasts or other
        Metaculus Data. Metaculus will treat unshared Input and Output as
        confidential information of yours, subject to Section 6.3, and will not
        be liable to you for any use or disclosure that Section 6.3 permits.
      </p>
      <p className={styles.paragraph}>
        6.2 <strong>Your rights.</strong> As between you and Metaculus, you
        retain all rights you have in your Input. You represent that you have
        the right to submit your Input and that doing so does not violate any
        law or the rights of any person.
      </p>
      <p className={styles.paragraph}>
        6.3 <strong>Limited license to Metaculus.</strong> You grant Metaculus
        and its service providers (including AI Providers and Host Platforms to
        the extent they process Input on Metaculus&apos;s behalf) a
        non-exclusive, worldwide, royalty-free license to host, store, copy,
        transmit, process, and create derivative works of your Input and the
        resulting Output solely to the extent necessary to:
      </p>
      <p className="mb-4 ml-6">
        (a) operate the Covered Products and provide Output to you, including
        transmitting Input, together with relevant Metaculus Data and system
        instructions, to AI Providers, and including hosting and displaying
        Input and Output to the people you choose to share it with under Section
        6.6;
      </p>
      <p className="mb-4 ml-6">
        (b) maintain the security and integrity of the Covered Products, detect
        and prevent abuse, fraud, and violations of this Supplement, and comply
        with law and enforce our rights;
      </p>
      <p className="mb-4 ml-6">
        (c) provide you with support that you request; and
      </p>
      <p className="mb-4 ml-6">
        (d) improve, evaluate, and develop the Covered Products and related
        Metaculus services, using Input and Output only in de-identified or
        aggregated form that does not identify you or your account and is not
        displayed publicly.
      </p>
      <p className={styles.paragraph}>
        6.4 <strong>No training of third-party models.</strong> Metaculus does
        not permit AI Providers to use your Input or Output to train or improve
        their models, and uses AI Providers only under terms that prohibit such
        use and, for the model providers, limit their retention of Input and
        Output to the periods described in the AI Products Privacy Notice.
      </p>
      <p className={styles.paragraph}>
        6.5 <strong>Human review.</strong> Metaculus personnel and contractors
        may access unshared Input and Output only as needed for the purposes in
        Section 6.3, and Metaculus limits such access to personnel who need it
        for those purposes and who are bound by confidentiality obligations.
      </p>
      <p className={styles.paragraph}>
        6.6 <strong>Sharing and visibility.</strong> A Covered Product may let
        you share Input and Output with others without making it Shared Content,
        for example by sharing a link, by changing the visibility setting of a
        map (such as making it visible to other members of your workspace or to
        anyone on the internet), or by inviting collaborators to view or edit
        it. If you do so: (a) Metaculus may host and display that Input and
        Output to the people you have chosen, and may allow them to edit it
        where you permit editing, and the license in Section 6.3 extends to
        those purposes; (b) the content remains subject to this Section 6 and
        does not become User Content, and Section 6.1 continues to apply except
        as to the disclosure you have chosen; (c) anyone you share with may
        view, copy, and further share what you have shared, and Metaculus cannot
        recall copies they have made; (d) some sharing methods, such as links,
        may not be revocable other than by deleting the content, as the
        product&apos;s documentation describes; and (e) you are responsible for
        the people you share with and for having the right to share any Input
        that contains information about others. Content you make visible to
        anyone on the internet is public in fact even though it is not User
        Content, and the confidentiality commitment in Section 6.1 does not
        apply to it while it is so visible.
      </p>
      <p className={styles.paragraph}>
        6.7 <strong>Sharing to Metaculus.</strong> If you elect to make Input or
        Output Shared Content, then, effective upon sharing, (a) the Shared
        Content becomes User Content and is licensed to Metaculus and other
        users under, and otherwise governed by, the &quot;User Content and
        Activities&quot; section of the Terms; (b) Section 6.1 no longer applies
        to it; and (c) you understand that Shared Content is public and may be
        viewed, copied, and used by anyone, and that removing it from your
        account or deleting your account may not remove copies that others have
        made. With respect to any Output included in Shared Content, your
        representation in the Terms that you &quot;own the User Content&quot; is
        modified to a representation that you have the right under Section 7 to
        publish that Output. Sharing does not affect the private status of any
        Input or Output that you did not share.
      </p>
      <p className={styles.paragraph}>
        6.8 <strong>Deletion.</strong> You may delete unshared Input and Output
        from your account through your account settings where the product offers
        that feature, or by contacting{" "}
        <a href="mailto:support@metaculus.com">support@metaculus.com</a>.
        Deleted content will be removed from active systems within 30 days and
        from backups on our normal backup rotation, subject to retention for the
        purposes in Section 6.3(b) and as described in the AI Products Privacy
        Notice. Retention and deletion of Shared Content are governed by the
        Terms and the Privacy Policy.
      </p>
      <p className={styles.paragraph}>
        6.9 <strong>Survival.</strong> Sections 6.1, 6.4, and 6.5 survive
        termination of your account to the extent Metaculus continues to hold
        your unshared Input or Output.
      </p>
      <h2 className={styles.sectionHeader} id="output">
        7. Output
      </h2>
      <p className={styles.paragraph}>
        7.1 <strong>Ownership.</strong> As between you and Metaculus, and
        subject to Sections 5.4 and 7.3, Metaculus assigns to you all of its
        right, title, and interest, if any, in and to the Output generated in
        response to your Input, effective upon generation. You are responsible
        for the Output and for your use of it.
      </p>
      <p className={styles.paragraph}>
        7.2 <strong>Permitted use.</strong> You may use, reproduce, modify, and
        distribute Output for any lawful purpose, including internal business
        use, commercial use, and inclusion in reports, analyses, and other work
        product that you prepare for your clients or your organization, subject
        to this Supplement. If you publish or distribute Output externally, you
        must not remove any indication that it was generated by a Covered
        Product or misrepresent its source, and you must comply with Section
        5.3(h). Attribution such as &quot;Built with Metaculus Radiant&quot; is
        requested but not required.
      </p>
      <p className={styles.paragraph}>
        7.3 <strong>Metaculus&apos;s retained rights.</strong> Because Output is
        generated by software and draws on Metaculus Data and AI Providers&apos;
        models, you acknowledge that (a) Output is not unique to you, and a
        Covered Product may generate the same or similar Output for other users,
        and nothing in this Supplement restricts Metaculus from doing so or from
        using such other Output in any way; (b) Metaculus retains the license in
        Section 6.3 with respect to Output; and (c) Metaculus and its licensors
        retain all rights in the Covered Products, the models, prompts, and
        system instructions used to generate Output, and Metaculus Data.
      </p>
      <p className={styles.paragraph}>
        7.4 <strong>Third-party content.</strong> Output may summarize, quote,
        or link to third-party content such as news reports and public data.
        Metaculus makes no representation that your use of such third-party
        content is permitted, and you are responsible for complying with any
        applicable third-party rights and licenses.
      </p>
      <p className={styles.paragraph}>
        7.5{" "}
        <strong>
          Output is not Metaculus Content or a community forecast.
        </strong>{" "}
        Output is not a Metaculus community forecast, a Metaculus Pro forecast,
        a question resolution, or a statement of Metaculus&apos;s views, and it
        is not scored or tracked on the Metaculus platform unless you make it
        Shared Content and Metaculus&apos;s platform rules so provide.
      </p>
      <h2
        className={styles.sectionHeader}
        id="nature-of-ai-generated-forecasts-disclaimers"
      >
        8. Nature of AI-Generated Forecasts; Disclaimers
      </h2>
      <p className={styles.paragraph}>
        8.1 <strong>Probabilistic, machine-generated content.</strong> Output is
        generated by software, including large language models operated by AI
        Providers and simulations of the models you build, using Input,
        Metaculus Data, and other information available to the software.
        Artificial intelligence is probabilistic and experimental. Output may be
        inaccurate, incomplete, outdated, biased, internally inconsistent, or
        fabricated (including fabricated facts, sources, or reasoning), may
        differ across requests, and may not reflect the current Metaculus
        community forecast or the actual likelihood of any event.
      </p>
      <p className={styles.paragraph}>
        8.2 <strong>Not advice.</strong> Output is provided for informational
        purposes only. It is not, and should not be relied on as, financial,
        investment, trading, legal, tax, medical, insurance, safety, or other
        professional advice, and it is not a recommendation to buy, sell, hold,
        wager on, or otherwise act with respect to any security, contract,
        market position, or event. Metaculus is not a registered investment
        adviser, broker-dealer, commodity trading advisor, or gaming operator,
        does not operate a prediction market, and does not accept or facilitate
        wagers. Using a Covered Product does not create any advisory, fiduciary,
        or other special relationship between you and Metaculus.
      </p>
      <p className={styles.paragraph}>
        8.3 <strong>Your responsibility.</strong> You are solely responsible for
        evaluating Output, for any decision or action you take in reliance on
        it, and for any consequences. You should independently verify Output and
        consult qualified professionals before acting on it. You must not use
        Output as the sole basis for any decision that could result in death,
        personal injury, or significant financial, property, environmental, or
        legal harm, and you must not use a Covered Product in connection with
        any activity where failure or inaccuracy of the Output could lead to
        death or personal injury.
      </p>
      <p className={styles.paragraph}>
        8.4 WITHOUT LIMITING THE &quot;DISCLAIMER OF WARRANTIES&quot; AND
        &quot;LIMITATIONS OF LIABILITY; WAIVER&quot; SECTIONS OF THE TERMS,
        WHICH APPLY TO THE COVERED PRODUCTS AND TO ALL INPUT, OUTPUT, AND
        METACULUS DATA, THE COVERED PRODUCTS AND ALL OUTPUT ARE PROVIDED
        &quot;AS IS,&quot; &quot;AS AVAILABLE,&quot; AND &quot;WITH ALL
        FAULTS,&quot; WITHOUT WARRANTY OF ANY KIND, AND THE METACULUS PARTIES
        SPECIFICALLY DISCLAIM ANY WARRANTY OR REPRESENTATION AS TO THE ACCURACY,
        CALIBRATION, RELIABILITY, COMPLETENESS, TIMELINESS, OR USEFULNESS OF ANY
        OUTPUT OR ANY FORECAST, PROBABILITY, OR REASONING IT CONTAINS, AND AS TO
        THE CONTINUED AVAILABILITY OF ANY COVERED PRODUCT DURING OR AFTER THE
        EARLY ACCESS OR BETA PERIOD. YOU ACKNOWLEDGE THAT THE LIMITATIONS OF
        LIABILITY IN THE TERMS, INCLUDING THE CAP ON THE METACULUS PARTIES&apos;
        TOTAL LIABILITY, APPLY TO ANY CLAIM ARISING OUT OF OR RELATING TO A
        COVERED PRODUCT, INPUT, OR OUTPUT, AND THAT AMOUNTS PAID FOR CREDITS ARE
        THE ONLY AMOUNTS &quot;PAID BY YOU TO METACULUS&quot; FOR PURPOSES OF
        THAT CAP.
      </p>
      <h2 className={styles.sectionHeader} id="free-tier-credits-and-payment">
        9. Free Tier, Credits, and Payment
      </h2>
      <p className={styles.paragraph}>
        9.1 <strong>Free tier.</strong> Metaculus may offer some or all of a
        Covered Product free of charge, including through granted Credits or
        periodic Credit allowances, subject to usage limits. Metaculus may
        change or discontinue free access, or convert any feature to a paid
        feature, at any time on notice posted to the Service or sent to you.
      </p>
      <p className={styles.paragraph}>
        9.2 <strong>Credits.</strong> Metaculus may grant, and may in the future
        sell, Credits for use of a Covered Product. Credits are consumed at the
        rates shown in the product at the time of use. Metaculus may change
        rates and the Credit cost of any feature prospectively on notice;
        changes do not affect Credits already consumed. Credits are not money,
        have no cash value, are not redeemable for cash, may not be transferred,
        sold, or shared, and may be used only by the account that purchased or
        received them.
      </p>
      <p className={styles.paragraph}>
        9.3 <strong>Expiration.</strong> Granted or promotional Credits,
        including periodic allowances, expire as stated when granted (for
        example, at the end of the allowance period) or, if no period is stated,
        ninety (90) days after grant. If Metaculus offers Credits for purchase,
        purchased Credits expire twelve (12) months after purchase unless
        Metaculus states otherwise at the time of purchase. Expired Credits are
        forfeited without refund. All Credits are forfeited on termination of
        your account for breach of the Terms or this Supplement.
      </p>
      <p className={styles.paragraph}>
        9.4 <strong>Payment (if Credits are offered for purchase).</strong> If
        Metaculus offers Credits for purchase, you must be at least 18 years old
        to purchase them, and you agree to pay all fees for Credits you
        purchase, plus applicable taxes. Payments are processed by a third-party
        payment processor, and are subject to the processor&apos;s terms and
        privacy policy. You authorize Metaculus and its processor to charge your
        payment method for the amounts you approve at checkout. Metaculus does
        not receive or store your full payment card number.
      </p>
      <p className={styles.paragraph}>
        9.5 <strong>No refunds.</strong> Except as required by applicable law or
        as expressly stated by Metaculus at the time of purchase, all purchases
        of Credits are final and non-refundable, including for unused or expired
        Credits and Credits consumed by Output that you consider unsatisfactory.
        If Metaculus permanently discontinues a Covered Product, Metaculus will,
        at its option, refund the purchase price of unused purchased Credits or
        provide notice and a reasonable period to use them.
      </p>
      <p className={styles.paragraph}>
        9.6 <strong>Chargebacks and disputes.</strong> If you dispute a charge
        with your payment provider, Metaculus may suspend your access to the
        Covered Product and your Credits pending resolution. You agree to
        contact Metaculus at{" "}
        <a href="mailto:support@metaculus.com">support@metaculus.com</a> before
        initiating a chargeback.
      </p>
      <p className={styles.paragraph}>
        9.7 <strong>Consumers outside the United States.</strong> If you are a
        consumer in a jurisdiction that grants you a statutory right to cancel a
        purchase of digital content or services, you acknowledge and agree that
        the Covered Product is made available to you, and you begin consuming
        Credits, immediately upon purchase, and you consent to immediate
        performance and acknowledge that you may lose your cancellation right
        once performance begins, to the extent permitted by law.
      </p>
      <h2 className={styles.sectionHeader} id="access-through-host-platforms">
        10. Access Through Host Platforms
      </h2>
      <p className={styles.paragraph}>
        10.1 <strong>Host Platform terms govern the Host Platform.</strong> When
        you access a Covered Product through a Host Platform, your use of the
        Host Platform is governed by the Host Platform provider&apos;s own
        terms, usage policies, and privacy policy, not by this Supplement.
        Metaculus does not control Host Platforms, is not a party to your
        agreement with them, and is not responsible for their availability,
        conduct, security, data practices, or handling of your Input or Output.
        The &quot;Third Party Links, Content and Applications&quot; section of
        the Terms applies to Host Platforms.
      </p>
      <p className={styles.paragraph}>
        10.2 <strong>Data flows.</strong> You understand that Input you submit
        through a Host Platform passes through, and may be stored and processed
        by, the Host Platform provider before it reaches Metaculus, and that
        Output returned to a Host Platform will be processed by that provider
        and may be retained, displayed, or used by it under its own policies.
        Metaculus is responsible only for Input and Output while in
        Metaculus&apos;s systems and those of its service providers, as
        described in the AI Products Privacy Notice.
      </p>
      <p className={styles.paragraph}>
        10.3 <strong>Host Platform policies.</strong> You must comply with the
        usage policies of any Host Platform through which you access a Covered
        Product, and Metaculus may suspend or restrict access through a Host
        Platform if required by the Host Platform provider or to comply with
        those policies.
      </p>
      <p className={styles.paragraph}>
        10.4 <strong>Availability.</strong> Metaculus may add, change, or
        discontinue support for any Host Platform at any time. A Host Platform
        provider may also remove or restrict a Covered Product without
        Metaculus&apos;s consent.
      </p>
      <h2
        className={styles.sectionHeader}
        id="suspension-termination-and-changes"
      >
        11. Suspension, Termination, and Changes
      </h2>
      <p className={styles.paragraph}>
        11.1 Metaculus may suspend, limit, or terminate your access to a Covered
        Product, revoke Credentials, or impose usage limits at any time, with or
        without notice, including for actual or suspected violation of this
        Supplement, unusual or abusive usage patterns, security concerns,
        non-payment, or as required by law or a Host Platform. The &quot;Account
        Registration &amp; Termination&quot; and &quot;Account
        Cancellation&quot; sections of the Terms apply.
      </p>
      <p className={styles.paragraph}>
        11.2 On termination of your access to a Covered Product, your license
        under Section 5.1 ends and unused Credits are forfeited, except as
        Section 9.5 provides. Sections 5.3, 5.4, 6 (as provided in Section 6.9),
        7, 8, 9, and 11 through 13 survive termination.
      </p>
      <p className={styles.paragraph}>
        11.3 Metaculus may modify this Supplement in accordance with the
        &quot;Changes&quot; section of the Terms. Changes to the &quot;Legal
        Disputes&quot; section of the Terms are governed by the procedures in
        that section.
      </p>
      <h2 className={styles.sectionHeader} id="legal-disputes">
        12. Legal Disputes
      </h2>
      <p className={styles.paragraph}>
        The &quot;Legal Disputes&quot; section of the Terms, including its
        binding arbitration agreement, class action waiver, governing law
        (California), and forum provisions, applies to any dispute arising out
        of or relating to a Covered Product, this Supplement, Input, Output, or
        Credits. Please read it carefully.
      </p>
      <h2 className={styles.sectionHeader} id="contact">
        13. Contact
      </h2>
      <p className={styles.paragraph}>
        Questions about a Covered Product or this Supplement, including billing
        questions and deletion requests, may be sent to Metaculus, Inc., 1112
        Montana Ave. Ste. 464, Santa Monica, CA 90403, or by email to{" "}
        <a href="mailto:support@metaculus.com">support@metaculus.com</a>.
        Privacy inquiries may be sent to{" "}
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>.
      </p>
    </PageWrapper>
  );
}
