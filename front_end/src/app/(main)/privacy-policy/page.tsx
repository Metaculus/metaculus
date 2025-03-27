import Link from "next/link";

import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Privacy Policy | Metaculus",
  description:
    "Learn about Metaculus privacy practices, including information collection, use, sharing, and your rights regarding your personal data.",
};

export default function PrivacyPolicy() {
  const styles = {
    paragraph: "mb-4",
    list: "mb-4 ml-4 list-inside list-disc space-y-2",
    sectionHeader: "mb-4 mt-8 scroll-mt-nav text-2xl font-bold",
    subsectionHeader: "mb-3 mt-6 scroll-mt-nav text-xl font-semibold",
  };
  return (
    <PageWrapper>
      <h1 className="mb-6 text-3xl font-bold">Metaculus Privacy Policy</h1>

      <p className={styles.paragraph}>
        <b>Effective Date:</b> Feb 14, 2025
      </p>

      <p className={styles.paragraph}>
        Welcome to Metaculus.com (or the &quot;<b>Website</b>&quot;), a website
        owned and operated by Metaculus, Inc. (&quot;<b>Metaculus</b>&quot;). At
        Metaculus, we respect your right to privacy. We strive to manage your
        personal data thoughtfully and responsibly.
      </p>

      <h3 className={styles.subsectionHeader}>
        Purpose of This Privacy Policy
      </h3>

      <p className={styles.paragraph}>
        We at Metaculus have created this Metaculus Privacy Policy (&quot;
        <b>Privacy Policy&quot;</b>) to describe our practices regarding the
        personal data we may collect or that you may provide when you visit
        Metaculus.com or any subdomains thereof, including any content,
        functionality, and services offered on or through Metaculus.com (the
        &quot;<b>Service</b>&quot;). Certain features discussed in this Privacy
        Policy may not be offered at any particular time.{" "}
      </p>

      <h3 className={styles.subsectionHeader}>
        Applicability of This Privacy Policy
      </h3>

      <p className={styles.paragraph}>
        This Privacy Policy applies to personal data we collect on or through
        the Service.
      </p>

      <p className={styles.paragraph}>
        It does not apply to personal data collected by:{" "}
      </p>

      <ul className={styles.list}>
        <li>
          Us offline or through any other means, including on any other website
          operated by Metaculus or any third party (including our affiliates and
          subsidiaries); or
        </li>
        <li>
          Any third party, including through any application or content
          (including advertising) that may link to or be accessible from or
          through the Service.
        </li>
      </ul>

      <p className={styles.paragraph}>
        <b>
          By accessing and using the Website you acknowledge that you have read
          and understood the contents of this Privacy Policy. Accordingly, if
          you do not agree to the terms of this Privacy Policy, do not use the
          Website.{" "}
        </b>{" "}
      </p>

      <h3 className={styles.subsectionHeader}>
        Individuals Located in the EEA or U.K.
      </h3>

      <p className={styles.paragraph}>
        If you are located in the European Economic Area (&quot;<b>EEA&quot;</b>
        ) or the United Kingdom (&quot;<b>U.K.</b>&quot;), this entire Privacy
        Policy applies to you. However, please see our{" "}
        <Link href="/privacy-policy/eea-and-uk/">
          EEA and UK Privacy Addendum
        </Link>
        , which provides more information about which rights you have regarding
        the processing of your personal data.
      </p>

      <h3 className={styles.subsectionHeader}>
        Changes to This Privacy Policy
      </h3>

      <p className={styles.paragraph}>
        Updates to this Privacy Policy may be made from time to time to comply
        with changing regulations or internal data privacy procedures. In the
        event of an update, the revised policy statement will be posted
        at:&nbsp;
        <Link href="/privacy-policy/">
          https://www.metaculus.com/privacy-policy/
        </Link>
        . Your continued use of the Service following the posting of changes
        will mean that you accept and agree to the revised Privacy Policy.
      </p>

      <h3 className={styles.subsectionHeader}>
        Who We Are and How to Contact Us
      </h3>

      <p className={styles.paragraph}>
        If you have a question or concern about this Privacy Policy or the
        privacy and protection of your personal data, please contact us:
      </p>

      <p className={styles.paragraph}>
        Attn: Privacy Policy Issues
        <br />
        Metaculus, Inc.
        <br />
        1112 Montana Avenue, Suite 464
        <br />
        Santa Monica, CA 90403U.S.A.
        <br />
      </p>

      <p className={styles.paragraph}>
        Email: <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>
      </p>

      <h3 className={styles.subsectionHeader}>
        Children Under the Age of Sixteen
      </h3>

      <p className={styles.paragraph}>
        The Service is not intended for children under sixteen (16) years of
        age. Our services are general audience in nature and are not intended
        for, marketed to or available to individuals younger than the age of
        sixteen (16). No one under age sixteen (16) may provide any personal
        data to the Service. We do not knowingly collect personal data from
        children under sixteen (16) years of age. If you are under age sixteen
        (16), do not use or provide any personal data to us on the Service. If
        we learn we have collected or received personal data from a child under
        age sixteen (16) without verification of parental consent, we will
        delete that personal data. If you believe we might have any personal
        data from or about a child under age sixteen (16), please contact us at 
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>.
      </p>

      <h3 className={styles.subsectionHeader}>Privacy Policy Summary</h3>

      <p className={styles.paragraph}>
        This summary highlights key points about how we collect, use, and
        disclose your personal data. While it offers a quick overview, it does
        not replace the full Privacy Policy, which contains more detailed
        information.
      </p>
      <p className={styles.paragraph}>
        <b>Collection of Your Personal Data:</b> We collect personal data and
        other information, including account information, user-generated
        content, and usage data, directly and indirectly from you. Please see
        the section on <a href="#collection">Our Collection of Information</a>{" "}
        for more information.
      </p>
      <p className={styles.paragraph}>
        <b>Use of Your Personal Data:</b> We may use the personal data we
        collect from you while using the Service to manage your relationship
        with Metaculus, support your use of the Service, and send you
        information from us or on behalf of selected third parties. This
        includes connecting you to other members of the Metaculus community. It
        also includes extending offers to you based on your personal data.
        Please see{" "}
        <a href="#how-we-use-your-information">How We Use Your Information</a>{" "}
        for more information.
      </p>
      <p className={styles.paragraph}>
        <b>Disclosing Your Personal Data:</b> We may disclose your personal data
        to contractors, service providers, and other third parties that support
        our business. We may also disclose your personal data in other limited
        circumstances, such as to a successor in interest, legally compelled
        disclosure, or for the protection of our rights or property. For more
        details, please review the section below entitled 
        <a href="#information-sharing">Information Sharing</a>.
      </p>
      <p className={styles.paragraph}>
        <b>Third Parties:</b> Metaculus may work with network advertisers,
        analytics service providers and other vendors to serve third party
        advertisements on and through the Service, to provide us with
        information regarding traffic on the Service, including the pages viewed
        and the actions users take when visiting the Service; and to provide us
        with information regarding the use of the Service and the effectiveness
        of our advertisements. Please review 
        <a href="#third-party-content">
          Third Party Content, Links to Other Sites, and Metaculus Content Found
          Outside of the Service
        </a>
         for additional information.
      </p>

      <h3 className={styles.subsectionHeader} id="collection">
        Our Collection of Information
      </h3>

      <p className={styles.paragraph}>
        <b>
          Overview of Information We Collect About You and How We Collect It
        </b>
      </p>

      <p className={styles.paragraph}>
        We collect several types of information, including personal data, from
        and about users of the Service, including the following categories of
        information:
      </p>

      <ul className={styles.list}>
        <li>
          Information by which you may be personally identified, such as name,
          postal address, email address, telephone number, profile photos,
          personal biography, or personal website if uploaded by you to the
          Service (&quot;<b>personal data</b>&quot;) (&quot;personal data&quot;
          does not include information that is publicly available, deidentified,
          or aggregated);
        </li>
        <li>
          About your company, if applicable, such as company name,
          country/region, business phone number, and industry;
        </li>
        <li>
          Measures of traffic, including automatically recorded times and dates
          of visits to Metaculus.com;
        </li>
        <li>
          The contents of a user&apos;s public comments and postings on
          Metaculus.com;
        </li>
        <li>
          Information that is about you but individually does not identify you,
          such as some Usage Information; and/or
        </li>
        <li>
          About your internet connection (such as IP address, IP country, etc.),
          the equipment you use to access the Service, and usage details (such
          as your interactions with the Service and website pages for the
          Service, forms, documents, meetings links, or tracked one-to-one
          emails with Metaculus).
        </li>
      </ul>

      <p className={styles.paragraph}>
        We collect this information through one or more of the following
        methods:
      </p>

      <ul className={styles.list}>
        <li>
          Directly from you when you provide it to us (including from the
          account registration process, Profile creation and updates, User
          Content, Community Forums, emails, blog posts, user support
          interactions, surveys and feedback responses, social media platforms,
          promotional activities and contests, cross-platform monitoring, social
          media integrations, and business transition data transfers);
        </li>
        <li>
          Automatically as you navigate through Metaculus.com when you use and
          access the Service. Information collected automatically may include
          usage details, IP addresses, and information collected through
          cookies, web beacons, tracking pixels, server log files, mobile device
          tracking, analytics tools and frameworks, embedded scripts and
          tracking code, postback Uniform Resource Locators (&quot;URLs&quot;),
          software development kits (&quot;SDKs&quot;), application programming
          interfaces (&quot;APIs&quot;), or other similar tracking technologies;
          and
        </li>
        <li>
          From third parties, such as our business partners, advertising
          networks, analytics providers, social media platforms, public
          databases, third-party applications and widgets when you navigate
          through our Service or on websites external to our Metaculus.com
          website, including personal data collected over time or to conduct
          trend analyses.
        </li>
      </ul>

      <h3 className={styles.subsectionHeader}>
        1. Registration and Other Information You Provide
      </h3>

      <p className={styles.paragraph}>
        The Service may collect your personal data directly, indirectly, or from
        third parties. In particular, the Service may collect personal data such
        as your name and email address, account information and demographic or
        other information such as your background, state or country of
        residence, information about your interests and education, and
        historical information about questions and predictions, including the
        accuracy of any predictions.
      </p>

      <h3 className={styles.subsectionHeader}>
        2. Your Profile, Community Forums and User Content
      </h3>

      <p className={styles.paragraph}>
        <i>Profile Information and Data Collection</i>
      </p>
      <p className={styles.paragraph}>
        You may have the opportunity to create a profile. Profile information
        may include personal data, photographs, interests and activities, use of
        the Service, and any other information you willingly provide (&quot;
        <b>Profile</b>&quot;). Some of the information in your Profile may be
        visible to thirdparties or to everyone.
      </p>

      <p className={styles.paragraph}>
        <i>
          <b>Notice of Disclosure to Third Parties</b>
        </i>
      </p>
      <p className={styles.paragraph}>
        <b>
          Note that in order to provide services and opportunities to you, third
          parties may be able to review certain personal data in your Profile.
          Metaculus may send you information and offers from third parties and
          information about the Service.
        </b>
      </p>

      <p className={styles.paragraph}>
        <i>Community Forums and User Content</i>
      </p>
      <p className={styles.paragraph}>
        The Service may provide you the opportunity to participate and post
        content, including questions and predictions, publicly in forums,
        through interactive features and through other communication
        functionality (&quot;<b>Community Forums</b>&quot;). You may choose,
        through such features or otherwise, to submit or post questions,
        predictions, reviews, problems, suggestions, ideas, solutions,
        questions, answers, comments, testimonials, feedback, messages, images,
        videos, text, personal data, or other material (&quot;
        <b>User Content</b>&quot;). Your User Content may also be posted in your
        Profile.
      </p>

      <p className={styles.paragraph}>
        <i>Content Removal Policy</i>
      </p>
      <p className={styles.paragraph}>
        Please think carefully about what you post and before including personal
        data in your User Content. You may edit or remove your Profile
        information, but you may not be able to remove predictions, comments or
        postings or other uploaded User Content. To request removal of content
        you posted publicly on the Service, contact us at 
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>. We will
        honor removal requests received from registered users who are residents
        of California, unless otherwise excepted by law, and where otherwise
        required by law. Other removal requests received, may, in our sole
        discretion, be honored or refused. In some cases, we may remove only
        your personal data but maintain the rest of your User Content. Note that
        removal of public postings does not ensure complete or comprehensive
        removal of the content or personal data posted.
      </p>

      <p className={styles.paragraph}>
        <i>
          <b>Public Information Notice</b>
        </i>
      </p>
      <p className={styles.paragraph}>
        <b>
          Note that anything you post on Metaculus may be public. If you choose
          to voluntarily disclose personal data in your Profile or a Community
          Forum, or participate in the Service, that information will be
          considered public information and not personal data, and the
          protections of this Privacy Policy will not apply.
        </b>
      </p>

      <p className={styles.paragraph}>
        <i>User Communication and Collaboration</i>
      </p>
      <p className={styles.paragraph}>
        In addition, the Service may allow members to communicate and
        collaborate with each other, including some Service offerings that allow
        members to engage in one-on-one communication. If you create an account,
        participate in a Community Forum or choose to communicate with others
        through the Service, certain information about you may be disclosed in
        connection with your or others&apos; use of the Service, including
        certain information about you and your network (such as your name and
        profile photo, the number of connections you have, and the names and
        pictures of your connections). Our servers may record and we may retain
        records of the content of any such user-to-user communications.
      </p>

      <h3 className={styles.subsectionHeader}>
        3. Third-Party Use of Cookies and Other Tracking Technologies, Services,
        Social Media Platforms, and Information Third Parties Provide About You
      </h3>

      <p className={styles.paragraph}>
        <i>Third-Party Data Collection and Usage</i>
      </p>
      <p className={styles.paragraph}>
        Third parties may provide us with information about you. For example, if
        you are on a third-party website and you opt in to receive information
        from us, that third party will forward information about you to us so
        that we may contact you as requested. Alternatively, if you interact
        with our advertisements on third-party websites, for example, then that
        third party may provide us with information about that interaction.
        Information that you provide to us, or that is automatically collected
        and transmitted when you use the Service, may be shared with and used by
        third parties.
      </p>

      <p className={styles.paragraph}>
        <i>Tracking Technologies and Data Collection</i>
      </p>
      <p className={styles.paragraph}>
        Some content or applications, including advertisements, on the Service
        are served by third parties including advertisers, ad networks and
        servers, content providers, and application providers. These third
        parties may use analytics, methods or systems (cookies, web beacons,
        pixels, postback URLs, SDKs, APIs) or other tracking technologies to
        collect information about you when you use the Service, including
        storing and accessing cookies.
      </p>

      <p className={styles.paragraph}>
        <i>User Data Metrics and Personal Data</i>
      </p>
      <p className={styles.paragraph}>
        Third parties may collect, transmit, receive, or use personal data
        collected from the Service alone, or in combination with other metrics
        collected by that third party on its own (such as information the third
        party has collected about your online activities over time and across
        different websites and through other online services). This information
        may include personal data, data that has been aggregated and anonymized,
        or non-personal data that may be associated with your personal data,
        including:
      </p>

      <ul className={styles.list}>
        <li>Email address,</li>
        <li>Name,</li>
        <li>Phone number,</li>
        <li>IP address or IP country for visitors to the Service,</li>
        <li>
          Unique identifiers (such as those from Hashed Emails, Mobile
          Advertising IDs (MAIDS) or external identifications),
        </li>
        <li>User agent,</li>
        <li>Advertiser referrer URL or other traffic sources,</li>
        <li>Third-party advertising cookie,</li>
        <li>Certain standard event data from visitors to certain webpages,</li>
        <li>Device and/or browser name,</li>
        <li>Version of your operating system,</li>
        <li>Screen viewport information (like width and/or height),</li>
        <li>Metrics such as sessions and conversion rates,</li>
        <li>
          Information about actions taken on the Service or in relation to the
          Service, such as how visitors are interacting with website pages,
          forms, documents, meetings links, or tracked one-to-one emails
          (including but not limited to purchases made by visitors, sign-ups or
          other activity on the Service), and/or
        </li>
        <li>
          Other related information or any other personal data that you provide
          with your consent.
        </li>
      </ul>

      <p className={styles.paragraph}>
        <i>Advertising and Service Optimization</i>
      </p>
      <p className={styles.paragraph}>
        Third parties use such information to provide you with interest-based
        (behavioral) advertising or other targeted content or for other
        advertising purposes. To enable Metaculus to improve and optimize the
        Service, third parties may also use this information to provide
        Metaculus with metrics or insights about our business and marketing
        practices, marketing trend analyses, behavioral analyses, analyses of
        the performance of the Service (including the performance of individual
        pages of Metaculus.com), trigger automation workflows, and to assess
        marketing touchpoints and how they work to drive revenue. For example,
        they may use the information to provide key metrics about sessions, for
        conversion tracking, or to provide us with other measurement services to
        measure or assist in measuring conversions or actions users take on our
        Service (including our Website).
      </p>

      <p className={styles.paragraph}>
        <i>
          Interactions With Social Media Features, Functions, and Tracking
          Technologies
        </i>
      </p>
      <p className={styles.paragraph}>
        The Service may permit interactions between the Service and a
        third-party website or service, such as enabling you to &quot;like&quot;
        a product within our Service or &quot;share&quot; content to other
        websites. If you choose to &quot;like&quot; or &quot;share&quot; content
        or to otherwise post information from or via the Service to a
        third-party website, feature or application, that information may be
        publicly displayed, and the third-party website may have access to
        information about you and your use of our Service. Similarly, if you
        post information on a third-party platform that references Metaculus,
        your post may be published on our Service in accordance with the terms
        of that third party.
      </p>
      <p className={styles.paragraph}>
        These features may collect your IP address or other Device Identifier
        and which page you are visiting on our Website, and may set a cookie,
        pixel, or other tracking technology to enable the third-party feature to
        function properly. Third-party features and applications are either
        hosted by a third party or hosted directly on our Service. Your
        interactions with these features are governed by the privacy policy of
        the company providing it.
      </p>

      <p className={styles.paragraph}>
        <i>Facebook Connect and Google Sign-In</i>
      </p>
      <p className={styles.paragraph}>
        You may also choose to use a third-party application or feature through
        our Service (such as logging in through Facebook Connect or Google
        Sign-In) or on a third-party website or service (such as one of our
        Facebook applications or a similar application or feature on a
        third-party website or service) through which you allow us to collect
        (or the third party to share) information about you, including personal
        data. Information about you, including your name and profile photo, may
        be shown to other users of the Service if you are logged in through the
        Service or through a third-party website or service. The third party may
        allow you to remove the application or feature, in which case, we will
        no longer collect information about you through the application or
        feature, but we may retain the information previously collected.
      </p>

      <p className={styles.paragraph}>
        <i>Third-Party Measurement Services</i>
      </p>
      <p className={styles.paragraph}>
        When you choose to participate, you may be opting to link your activity
        on our Service with that third-party website or service, which may then
        collect information about your visits to our Service and may publish
        that activity as you request to your profile or similar feature with
        that third party (such as if you choose to share a prediction you made
        on Metaculus.com with your connections on the third-party website). In
        some instances, we may require that you participate in the Service
        through a third-party application or feature and, if you choose not to
        authorize or use the required third-party application or feature, you
        will not be able to use the applicable Service.
      </p>

      <p className={styles.paragraph}>
        <i>Content Sharing and Third-Party Interactions</i>
      </p>
      <p className={styles.paragraph}>
        The personal data we collect is subject to this Privacy Policy. The
        information collected and stored by the third party remains subject to
        the third party&apos;s privacy practices and policies, including whether
        the third party continues to share information with us, the types of
        information shared, and your choices with regard to what is visible to
        others on that third-party website and service. The third party may
        allow you to remove the application or feature, in which case, we will
        no longer collect personal data about you through the application or
        feature, but we may retain the personal data previously collected, in
        accordance with our data retention policies. We do not control these
        third parties&apos; tracking technologies or how they may be used. If
        you have any questions about an advertisement or other targeted content,
        you should contact the responsible provider directly. For information
        about how you can opt out of receiving targeted advertising from many
        providers, see 
        <a href="#choices-about-how-we-use">
          Choices About How We Use and Disclose Your Information
        </a>
        .
      </p>

      <p className={styles.paragraph}>
        <i>Combining Information</i>
      </p>
      <p className={styles.paragraph}>
        We also may supplement the personal data we collect with external
        records from third parties in order to provide you with information,
        provide services you have requested, enhance our ability to serve you,
        tailor our content to you, and offer you opportunities to use services
        that we believe may be of interest to you. We may combine the
        information we receive from those other sources with personal data we
        collect through the Service. In those cases, we will apply this Privacy
        Policy to the combined information.
      </p>

      <p className={styles.paragraph}>
        <i>
          <b>Cookie Consent for Users in the EEA and U.K.</b>
        </i>
      </p>
      <p className={styles.paragraph}>
        <b>For users in the EEA and U.K.</b>, we provide opt-in mechanisms with
        respect to non-essential cookies. If you opt in and subsequently change
        your mind, you may withdraw your consent at any time by clicking here.
      </p>

      {/* Add trigger to cookie modal to the above paragraph */}

      <h3 className={styles.subsectionHeader}>
        4. Information Metaculus Collects Through Automatic Data-Collection
        Technologies
      </h3>

      <p className={styles.paragraph}>
        <i>Automatic Data Collection</i>
      </p>
      <p className={styles.paragraph}>
        Like other websites and online services, we may automatically collect
        certain information about your equipment, browsing actions, and patterns
        (&quot;<b>Usage Information</b>&quot;) whenever you access and use the
        Service, including:
      </p>

      <ul className={styles.list}>
        <li>
          <b>Device Information:</b> Information about your computer, mobile
          phone, or other device and internet connection, including your IP
          address or other unique identifier (&quot;<b>Device Identifier</b>
          &quot;), and the mobile carrier, browser type and operating system you
          are using. A <b>Device Identifier</b> is a number that is
          automatically assigned to your device when used to access our Service.
          Our servers identify your device by its Device Identifier. Some mobile
          service providers may also provide us or our third-party service
          providers with information regarding the physical location of the
          device used to access a Service.
        </li>
        <li>
          <b>Visit Details:</b> Details of your visits to the Service, including
          traffic data, logs, mouse clicks, the URL or advertisement that
          referred you to our Service; the search terms you entered into a
          search engine that led you to our Service; all of the areas within our
          Service that you visit (including information about any ads you may
          view); the time of day you used the Service; and other communication
          data and the resources that you access and use on the Service.
        </li>
      </ul>

      <p className={styles.paragraph}>
        <i>Behavioral Tracking</i>
      </p>
      <p className={styles.paragraph}>
        We also may use these technologies to collect information about your
        online activities over time and across third-party websites or other
        online services (&quot;<b>Behavioral Tracking</b>&quot;). Click here for
        information on how you can opt out of Behavioral Tracking on the Service
        and how we respond to web browser signals and other mechanisms that
        enable consumers to exercise choice about Behavioral Tracking.
      </p>

      <p className={styles.paragraph}>
        <i>Usage Information</i>
      </p>
      <p className={styles.paragraph}>
        We may use Usage Information for a variety of purposes, including to
        tell you about people or events nearby, to provide special offers, to
        serve advertisements, to select appropriate content to display to you,
        or to enhance or otherwise improve the Service and our products.
      </p>
      <p className={styles.paragraph}>
        Usage Information is generally non-identifying (such as statistical data
        that does not include personal data) that we collect automatically, but
        if we maintain it or associate it with personal data that we collect in
        other ways or receive from third parties, then we treat it as personal
        data.
      </p>

      <p className={styles.paragraph}>
        <i>Tracking Technologies Overview</i>
      </p>
      <p className={styles.paragraph}>
        Usage Information is automatically collected via tracking technologies,
        which may include:
      </p>

      <ul className={styles.list}>
        <li>
          <b>Cookies (or browser cookies) and Log Files: </b> Metaculus may use
          cookies and web log files to track usage of our Service. A cookie is a
          tiny data file which resides on your computer, mobile phone, or other
          device and which allows Metaculus to recognize you as a user when you
          return using the same computer and web browser. You may refuse to
          accept browser cookies by activating the appropriate setting on your
          browser. However, if you select this setting, you may be unable to
          access certain parts of the Service. Unless you have adjusted your
          browser setting so that it will refuse cookies, our system will issue
          cookies when you direct your browser to the Service. For information
          about managing your privacy and security settings for cookies, see 
          <a href="#choices-about-how-we-use">
            Choices About How We Use and Disclose Your Information
          </a>
          . Log files are the record of your visits to the Service and include
          Usage Information. Like the information you enter at registration or
          in your Profile, cookie and log file data is used to customize your
          experience when you use the Service. Third parties may also set
          cookies as you interact with the Service.
        </li>
        <li>
          <b>Google Analytics:</b> Metaculus utilizes a third-party vendor,
          Google Analytics, to assist in collecting and analyzing data. Google
          Analytics collects information anonymously and reports website trends
          without identifying individual visitors. We use the information
          collected to understand how our visitors are using the Website and
          make improvements for a better online experience. Google Analytics
          uses third-party 
          <a
            href="https://www.google.com/intl/en/policies/privacy/faq/#toc-terms-cookie"
            target="_blank"
          >
            cookies
          </a>
           to track visitor interactions and collects an anonymized version of
          the 
          <a
            href="www.google.com/intl/en/privacy/faq.html#toc-terms-ip"
            target="_blank"
          >
            Internet protocol (IP) address
          </a>
           of website visitors in order to provide us a sense of where our
          visitors come from. Google Analytics does not store or report to us
          visitors&apos; actual IP address information. For more information
          about how Google collects and processes data when you visit websites
          or use applications that use Google technologies, please see &nbsp;
          <a href="www.google.com/policies/privacy/partners" target="_blank">
            www.google.com/policies/privacy/partners
          </a>
          .
        </li>
      </ul>

      <p className={styles.paragraph}>
        <i>Persistent Cookie Functionality</i>
      </p>
      <p className={styles.paragraph}>
        One type of cookie we use, known as a &quot;persistent&quot; cookie, is
        set once you have logged in to your account on the Service. If you do
        not log out of your account, then the next time you visit, the
        persistent cookie will allow us to recognize you as an existing user so
        you will not need to log in before using the Service. Of course, if you
        are using a public computer or sharing your private computer with
        others, you should log out of your account after each visit. If you log
        out of a Service, you will need to re-enter your password the next time
        you visit in order to log in to your account. You can remove persistent
        cookies by following directions provided in your Internet browser&apos;s
        &quot;help&quot; file. We also use a cookie which functions as a
        &quot;session&quot; cookie, meaning that it is used to identify a
        particular visit. Session cookies expire after a short period of time or
        when you close your web browser.
      </p>

      <p className={styles.paragraph}>
        <i>Web Beacons or Tracking Pixels</i>
      </p>
      <p className={styles.paragraph}>
        We, as well as affiliate program partners, service providers, and other
        third parties, may employ a software technology called &quot;clear
        gifs&quot; (a.k.a. web beacons, tracking pixels, and web bugs) on the
        Service and our emails, which help us better manage content on our
        Service by informing us of what content is effective. Clear gifs are
        tiny graphics with a unique identifier, similar in function to cookies,
        and are used to track the online movements of web users for our
        affiliate program. The information collected through clear gifs include
        information about individual surfing behavior and reading activities,
        downloads of publications, counts of users who have visited those pages
        or opened an email and for similar materials, and other related website
        statistics (for example, recording the popularity of certain website
        content and verifying system and server integrity). In contrast to
        cookies, which are stored on a user&apos;s computer hard drive, clear
        gifs are embedded invisibly on webpages and are about the size of the
        period at the end of this sentence. This information is used to help
        improve the overall quality and experience of our Service. We combine
        the information gathered by clear gifs with our users&apos; personal
        data so that we can optimize the Service according to your interests, to
        perform marketing, and to improve personalized ads based on your
        personal interests.
      </p>

      <p className={styles.paragraph}>
        <i>Embedded Script</i>
      </p>
      <p className={styles.paragraph}>
        An Embedded Script is programming code that is designed to collect
        information about your interactions with the Service, such as the links
        you click on. The code is temporarily downloaded onto your computer or
        other device from our server or a third-party service provider and is
        deactivated or deleted when you disconnect from the Service.
      </p>
      <p className={styles.paragraph}>
        In addition, we may use a variety of other technologies that collect
        similar information for security and fraud-detection purposes.
      </p>

      <p className={styles.paragraph}>
        <i>How We Respond to Do Not Track Signals</i>
      </p>
      <p className={styles.paragraph}>
        Please note that your browser settings may allow you to automatically
        transmit a &quot;Do Not Track&quot; (or &quot;DNT&quot;) signal to
        websites and online services you visit. Our Website does not currently
        respond to DNT signals due to the absence of an industry-standard
        protocol. To find out more about Do Not Track, please visit 
        <a href="http://www.allaboutdnt.com" target="_blank">
          http://www.allaboutdnt.com
        </a>
        .
      </p>

      <h3 className={styles.subsectionHeader} id="how-we-use-your-information">
        How We Use Your Information
      </h3>
      <p className={styles.paragraph}>
        We use information about you, including personal data, to:
      </p>

      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>
          To provide you with the Service, including user authentication,
          account management, account updates, maintenance, community feature
          enablement, and user support and enhancement;
        </li>
        <li>
          Allow you to participate in features we offer or to provide related
          user support, including, without limitation, to respond to your
          questions, complaints or comments;
        </li>
        <li>
          Tailor content, recommendations and offers we display to you, both on
          the Service and elsewhere online;
        </li>
        <li>Process a transaction you initiate;</li>
        <li>Manage emails and notifications;</li>
        <li>Target advertising delivery;</li>
        <li>Manage marketing campaigns;</li>
        <li>Manage business transitions and partner relationships;</li>
        <li>Provide you with information, services, or suggestions;</li>
        <li>
          Send or display to you and others using the Service special offers or
          advertisements from us, our advertisers, or third parties;
        </li>
        <li>
          Process your registration with our Service, including verifying that
          your email address is active and valid;
        </li>
        <li>
          Improve the Service and our products, and for internal business
          purposes, including the measurement of ad effectiveness, performance
          analytics, and feature development;
        </li>
        <li>
          Contact you with regard to your use of the Service and, in our
          discretion, changes to our policies;
        </li>
        <li>Permit other Metaculus users to contact you, and vice versa;</li>
        <li>
          Provide you with location features and services (e.g., telling you
          about local deals and events);
        </li>
        <li>
          Verify academic integrity (such as to ensure the quality of academic
          works that have relied on Website data); and
        </li>
        <li>
          As described in the Privacy Policy and for purposes disclosed at the
          time you provide your information or otherwise with your consent.
        </li>
      </ol>

      <p className={styles.paragraph}>
        <i>Aggregated and Deidentified Information</i>
      </p>
      <p className={styles.paragraph}>
        Aggregated and deidentified information is not personal data. We may use
        and disclose aggregated or deidentified information at our discretion,
        including for behavioral trend analysis, usage pattern studies,
        performance metrics compilation, marketing effectiveness measurement,
        platform optimization analysis, user demographic studies, or sharing
        anonymized data with third parties for analysis purposes.
      </p>

      <p className={styles.paragraph}>
        <i>Data Supplementation and Integration</i>
      </p>
      <p className={styles.paragraph}>
        We may combine the information gathered by clear gifs with personal
        data.
      </p>

      <p className={styles.paragraph}>
        <i>When You Contact Us</i>
      </p>
      <p className={styles.paragraph}>
        Please note that information submitted on the Service via a
        &quot;Contact Us&quot; or other similar function may not receive a
        response. We will not use the information provided via these functions
        to contact you for marketing purposes unrelated to your request unless
        you agree otherwise.
      </p>

      <h3 className={styles.subsectionHeader} id="information-sharing">
        Information Sharing
      </h3>
      <p className={styles.paragraph}>
        Metaculus may share aggregated information about our users and
        information that is not personal data, without restriction, including
        for behavioral trend analysis, usage pattern studies, performance
        metrics compilation, marketing effectiveness measurement, platform
        optimization analysis, and user demographic studies, and share
        anonymized data with third parties for analysis purposes. We also may
        share your personal data with third parties to fulfill the purpose for
        which you provide it and as described below or otherwise in this Privacy
        Policy:
      </p>

      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>
          <b>When You Request That We Disclose Your Personal Data:</b> We may
          offer opportunities and features through the Service that are brought
          to you by a third party or that otherwise involve disclosing your
          personal data with a third party. If you request or agree at that time
          to have your personal data disclosed, your personal data will be
          disclosed to that third party (or parties) and will be subject to the
          privacy policy and practices of that third party. You also may
          request, sometimes through your use of an interactive feature, a
          widget or third-party application, that we disclose personal data
          about you with a third party and we will typically do so under those
          circumstances.
        </li>
        <li>
          <b>Service Providers:</b> We may share your personal data with
          contractors, service providers, and other third parties who provide
          services to us or you in connection with the Service to support our
          business. For more information, see 
          <a href="#choices-about-how-we-use">
            Choices About How We Use and Disclose Your Information
          </a>
          .
        </li>
        <li>
          <b>
            Administrative, Legal Reasons & Academic Integrity Investigations:
          </b>{" "}
          We may also disclose your information, including personal data, to
          legal, financial, insurance and other advisors in connection with
          commercial transactions; the management of our organization and
          operations; and to comply with any court order, law, or legal process,
          including: to respond to any government or regulatory request, in
          response to a subpoena; to defend our rights; in response to a written
          request from law enforcement regarding an investigation into criminal
          activity that may have occurred through or in any way using
          Metaculus&apos;s Service or property; to provide information to a
          claimed owner of intellectual property who claims that content you
          have provided to us infringes on their rights; upon request of an
          academic institution connected to an investigation into academic
          integrity; to enforce or apply our 
          <Link href="/terms-of-use/">Terms of Use</Link> and other agreements
          applicable to the Service, including for billing and collection
          purposes; or if we believe disclosure is necessary or appropriate to
          protect the personal safety, rights, property or security of any
          organization or individual, including exchanging information with
          other companies and organizations for the purposes of fraud protection
          and credit risk reduction. We may also use Device Identifiers,
          including IP addresses, to identify users, and may do so in
          cooperation with copyright owners, Internet service providers,
          wireless service providers or law enforcement agencies in our
          discretion. These disclosures may be conducted without notice to you.
        </li>
        <li>
          <b>Business Transitions:</b> We may share your personal data in the
          event that Metaculus goes through a business transition, such as a
          merger, acquisition by another company, divestiture, restructuring,
          reorganization, dissolution, or other sale or transfer of all or a
          portion of its assets, or other corporate change, including, without
          limitation, during the course of any due diligence process whether as
          a going concern or as part of bankruptcy, liquidation, or similar
          proceedings in which personal data held by Metaculus about our Service
          users is among the assets transferred.
        </li>
        <li>
          <b>Sweepstakes, Contests and Promotions:</b> We may offer sweepstakes,
          contests, and other promotions (&quot;Promotion&quot;) that may
          require registration. By participating in a Promotion, you are
          agreeing to governing terms, conditions or official rules, which may
          impose specific requirements of you. If you choose to enter a
          Promotion, personal data, such as your name and shipping address, may
          be disclosed to third parties or the public in connection with the
          administration of such Promotion, including, without limitation, in
          connection with winner selection, prize fulfillment, and as required
          by law or permitted by the Promotion&apos;s official rules, such as on
          a winners list.
        </li>
      </ol>

      <h3 className={styles.subsectionHeader} id="choices-about-how-we-use">
        Choices About How We Use and Disclose Your Personal Data
      </h3>
      <p className={styles.paragraph}>
        We strive to provide you with choices regarding the personal data you
        provide to us. We have created mechanisms to provide you with the
        following control over your information:
      </p>

      <ul className={styles.list}>
        <li>
          <b>Tracking Technologies and Advertising:</b> You can set your browser
          to refuse all or some browser cookies, or to alert you when cookies
          are being sent. If you disable or refuse cookies, please note that
          some parts of the Service may then be inaccessible or not function
          properly. For more information about cookies, and how to disable
          cookies, visit{" "}
          <a href="https://www.allaboutcookies.org" target="_blank">
            https://www.allaboutcookies.org
          </a>
          .
        </li>
        <li>
          <b>Disclosure of Your Information for Third-Party Advertising:</b> If
          you do not want us to disclose your personal data with unaffiliated or
          non-agent third parties for promotional purposes, you may opt out by
          sending an email to 
          <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>. You can
          also always opt out by adjusting your user preferences in the cookie
          consent banner on the applicable Service, checking or unchecking the
          relevant boxes.
        </li>
        <li>
          <b>Targeted Advertising:</b> If you do not want us to use your
          personal data to deliver advertisements according to our
          advertisers&apos; target-audience preferences, you can opt out by
          sending an email to 
          <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>.
        </li>
      </ul>

      <p className={styles.paragraph}>
        <i>Privacy Options for Targeted Ads</i>
      </p>
      <p className={styles.paragraph}>
        We do not control third parties&apos; collection or use of your personal
        data to serve interest-based advertising. These third parties may,
        however, provide you with ways to choose not to have your personal data
        collected or used in this way. You may opt out of receiving targeted ads
        from members of the Network Advertising Initiative (&quot;NAI&quot;) on
        the 
        <a href="https://thenai.org/opt-out/" target="_blank">
          NAI&apos;s website
        </a>
        .
      </p>

      <h3 className={styles.subsectionHeader}>
        Updating Your Account Information and Control Over Metaculus Emails
      </h3>

      <p className={styles.paragraph}>
        You may be able to review, update, or delete your personal data by
        logging in to your account preferences page.
      </p>

      <p className={styles.paragraph}>
        We may send you marketing emails. If you decide that you no longer wish
        to receive these emails, you may unsubscribe by using the
        &quot;unsubscribe&quot; button at the bottom of the Metaculus email. We
        may, however, continue to send you non-marketing emails, e.g.,
        transactional or service related emails.
      </p>

      <h3 className={styles.subsectionHeader}>Closing Your Account</h3>

      <p className={styles.paragraph}>
        If you wish to close your account with us, please send your request
        to&nbsp;
        <a href="mailto:closemyaccount@metaculus.com">
          closemyaccount@metaculus.com
        </a>{" "}
        and we will remove your personal data, Profile, and User Content, if
        applicable, from the active database. You typically will receive a
        response to such a request sent to us within a commercially reasonable
        period of time. Requests to change your email preferences or unsubscribe
        from all emails may not be made through this email address, but rather
        must be submitted through one of the channels set out in the previous
        section.
      </p>

      <p className={styles.paragraph}>
        Even if your account is closed, personal data may remain in backup
        records and we may retain certain data if it may be necessary to prevent
        fraud or future abuse or for legitimate business purposes, such as
        analysis of aggregated, non-personally-identifiable data, account
        recovery or if required by law. All retained personal data will continue
        to be subject to the applicable privacy policy for the Service. Also, if
        you have posted content on or through the Service, such as in Community
        Forums, we may not be able to delete it.
      </p>

      <h3 className={styles.subsectionHeader} id="third-party-content">
        Third-Party Content, Links to Other Sites, and Metaculus Content Found
        Outside of the Service
      </h3>

      <p className={styles.paragraph}>
        <i>Third-Party Tracking Technologies and Data Collection</i>
      </p>
      <p className={styles.paragraph}>
        Certain content or applications, including advertisements, provided
        through the Service may be hosted and served by third parties, including
        advertisers, ad networks and servers, content providers, and application
        providers. These third parties may use cookies alone or in conjunction
        with web beacons or other tracking technologies to collect information
        about you when you use the Service. The information they collect may be
        associated with your personal data or they may collect information,
        including personal data, about your online activities over time and
        across different websites and other online services. They may use this
        information to provide you with interest-based (behavioral) advertising
        or other targeted content. These third parties may also use widgets,
        such as those that allow you to &quot;like&quot; or &quot;share&quot;
        content with third-party websites and online services.
      </p>

      <p className={styles.paragraph}>
        <i>Third-Party Links</i>
      </p>
      <p className={styles.paragraph}>
        In addition, the Service may link to third-party websites or content
        over which Metaculus has no control and which are governed by the
        privacy policies and business practices of those third parties. In
        addition, third-party partners of Metaculus from whom you order through
        the Service may have different privacy policies which apply to such
        partner&apos;s use of your information.
      </p>

      <p className={styles.paragraph}>
        <i>Metaculus Presence on Third-Party Web Pages</i>
      </p>
      <p className={styles.paragraph}>
        Please also note that Metaculus content and widgets may be included on
        web pages and websites that are not associated with us and over which we
        have no control. These third parties may independently collect data. We
        do not control these third parties&apos; tracking technologies or how
        they may be used. Metaculus is not responsible for the privacy practices
        or business practices of any third party. If you have any questions
        about an advertisement or other targeted content, you should contact the
        responsible provider directly. For information about how you can opt out
        of receiving targeted advertising from many providers, see 
        <a href="#choices-about-how-we-use">
          Choices About How We Use and Disclose Your Information
        </a>
        .
      </p>

      <h3 className={styles.subsectionHeader}>Testimonials</h3>

      <p className={styles.paragraph}>
        We display personal testimonials of satisfied users on our Service in
        addition to other endorsements. With your consent, we may post your
        testimonial along with your name. If you wish to update or delete your
        testimonial, you can contact us at 
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>.
      </p>

      <h3 className={styles.subsectionHeader}>General Retention Periods</h3>

      <p className={styles.paragraph}>
        We use the following criteria to determine our retention periods: the
        amount, nature and sensitivity of your personal data; the reasons for
        which we collect and process your personal data; the length of time we
        have an ongoing relationship with you and provide you with access to our
        Service; and applicable legal requirements. We will retain personal data
        we collect from you where we have an ongoing legitimate business need to
        do so (for example, to comply with applicable legal, tax or accounting
        requirements). Additionally, we cannot delete personal data when it is
        needed for the establishment, exercise or defense of legal claims, also
        known as a &quot;litigation hold.&quot; In this case, the personal data
        must be retained as long as needed for exercising respective potential
        legal claims.
      </p>

      <p className={styles.paragraph}>
        When we have no ongoing legitimate business need to process your
        personal data, we will either delete or anonymize it or, if this is not
        possible (for example, because your personal data has been stored in
        backup archives), we will securely store your personal data and isolate
        it from any further processing until deletion is possible.
      </p>

      <p className={styles.paragraph}>
        For any questions about data retention, please contact
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>.
      </p>

      <h3 className={styles.subsectionHeader}>Anonymization</h3>

      <p className={styles.paragraph}>
        In some instances, we may choose to anonymize your personal data instead
        of deleting it, for statistical use, for instance. When we choose to
        anonymize, we use reasonable efforts to prevent the personal data from
        being linked back to you or any specific user.
      </p>

      <h3 className={styles.subsectionHeader}>Data Security</h3>

      <p className={styles.paragraph}>
        <i>Data Security Measures</i>
      </p>
      <p className={styles.paragraph}>
        Metaculus takes commercially reasonable security measures aiming to
        protect your personal data both during transmission and once we receive
        it. We have implemented measures designed to secure your personal data
        from accidental loss and from unauthorized access, use, alteration, and
        disclosure. All personal data you provide to us is stored on our secure
        servers behind firewalls. Any payment transactions will be encrypted
        using secure socket layer (SSL) technology. For example, when you enter
        sensitive personal data such as a credit card number and CCV2 number on
        our checkout forms, that information is encrypted using SSL technology,
        to help protect the communications between you and our payment partners.
      </p>

      <p className={styles.paragraph}>
        <i>Passwords</i>
      </p>
      <p className={styles.paragraph}>
        The safety and security of your personal data also depends on you. Where
        we have given you (or where you have chosen) a password for access to
        certain parts of the Service, you are responsible for keeping this
        password confidential. We ask you not to share your password with
        anyone. We urge you to be careful about giving out such information in
        public areas of the Service, like message boards. The information you
        share in public areas may be viewed by any user of the Service.
      </p>

      <p className={styles.paragraph}>
        <i>Your Risks</i>
      </p>
      <p className={styles.paragraph}>
        However, no method of transmission over the Internet, or method of
        electronic storage, is completely secure. Therefore, while we strive to
        use commercially acceptable means to protect your personal data, as in
        any real-life scenario, we cannot guarantee its absolute security. Any
        transmission of personal data is at your own risk. We are not
        responsible for circumvention of any privacy settings or security
        measures contained on Metaculus.com. If you have any questions about
        security on our Service, you can email us at 
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a>.
      </p>

      <h3 className={styles.subsectionHeader}>Questions or Comments</h3>

      <p className={styles.paragraph}>
        If you have questions or comments about this Privacy Policy and our
        privacy practices, or need to access it in an alternative format due to
        having a disability, please email us at 
        <a href="mailto:legal@metaculus.com">legal@metaculus.com</a> or contact
        us at:
      </p>

      <p className={styles.paragraph}>
        Metaculus, Inc.
        <br />
        Attn: Privacy Policy Issues
        <br />
        1112 Montana Avenue ste 464
        <br />
        Santa Monica, CA, US
        <br />
        90403
      </p>
    </PageWrapper>
  );
}
