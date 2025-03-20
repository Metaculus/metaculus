import { getLocale } from "next-intl/server";

import content_pt from "./page_pt";
import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus Terms of Use",
  description:
    "The terms and conditions governing your use of the Metaculus service, including account registration, age requirements, proprietary rights, and licensing.",
};

export default async function TermsOfUse() {
  const locale = await getLocale();
  if (locale === "pt") {
    return content_pt();
  }

  return (
    <PageWrapper>
      <h1 className="mb-6 text-3xl font-bold">Terms of Use</h1>

      <p className="mb-4">Last Modified: May 8, 2024</p>

      <p className="mb-4 font-bold">WELCOME TO METACULUS!</p>

      <p className="mb-4 font-bold">
        IMPORTANT! PLEASE CAREFULLY READ THESE TERMS OF USE, AS THEY AFFECT YOUR
        LEGAL RIGHTS AND OBLIGATIONS.
      </p>

      <p className="mb-4">
        The following terms and conditions, together with any documents they
        expressly incorporate by reference (collectively, &quot;Terms of
        Use&quot;) apply to the Metaculus.com web site including any content,
        functionality, and services offered on or through the Metaculus.com
        website (the &quot;Service&quot; or &quot;Site&quot; or
        &quot;Website&quot;), whether as a guest or registered user. Metaculus,
        Inc. is referred to in these Terms of Use as
        <strong>Metaculus</strong>, <strong>Metaculus Website</strong>,{" "}
        <strong>we</strong> or <strong>our</strong>.<strong>You</strong>,{" "}
        <strong>your</strong> and <strong>user</strong> refer to any person or
        entity using the Service.
      </p>

      <p className="mb-4">
        These Terms of Use govern your access to and use of the Service,
        regardless of how you access it, whether by computer, mobile device, or
        otherwise; and whether directly through our Service, or through any
        third-party website that links to it (<strong>Linked Service</strong>).{" "}
        <strong>
          By using the Service, you agree to be bound and abide by the Terms of
          Use and our{" "}
          <a
            href="http://www.metaculus.com/privacy-policy"
            className="text-blue-600 hover:underline"
          >
            Privacy Policy
          </a>
          , found at{" "}
          <a
            href="http://www.metaculus.com/privacy-policy"
            className="text-blue-600 hover:underline"
          >
            https://www.metaculus.com/privacy-policy/
          </a>
          , incorporated herein by reference. If you do not agree to the Terms
          of Use of the Privacy Policy, you are not authorized to access or use
          the Service and you must cease all such use immediately.
        </strong>
      </p>

      <p className="mb-4 font-bold">
        ARBITRATION NOTICE: Except for certain types of disputes described in
        the ARBITRATION section below, you agree that disputes between you and
        METACULUS will be resolved by binding, individual ARBITRATION and you
        waive your right to participate in a class action lawsuit or class-wide
        arbitration.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="account-registration"
      >
        Account Registration &amp; Termination
      </h2>
      <p className="mb-4">
        Metaculus provides the Service, a platform for users to predict future
        events in a variety of disciplines, including but not limited to
        science, politics and finance, and display their track record of
        accurately predicting such events. You may only have one Metaculus
        account for use of the Service. You may not create or use more than one
        account, and you may not share your account or any of the Service with
        others. A parent or guardian may create an account for the benefit of a
        minor, but otherwise you may not create an account for anyone unless
        expressly authorized by Metaculus. All information you provide to create
        an account must be accurate and complete. You may not impersonate any
        other person or use a name that is not your own. It is your
        responsibility to update your account information to keep it current and
        accurate. When you set up an account, you must also choose a password.
        You are solely responsible for maintaining the confidentiality of your
        password, and for any and all use of your account. You agree not to use
        the account, username, or password of another user at any time, nor to
        disclose your password to any third party. You agree you will not sell
        or share or otherwise transfer your membership or any membership rights.
        You agree to notify Metaculus immediately if you suspect any
        unauthorized use of your account or access to your password. Metaculus
        has the right to terminate your account for any reason at our sole
        discretion without notice and without liability.
      </p>
      <p className="mb-4">
        Competitions on Metaculus are skills-based, designed to evaluate
        participants&apos; forecasting and reasoning skills. No purchase, fee,
        or payment is required to participate. All entries are judged by an
        algorithm, described at{" "}
        <a
          href="https://www.metaculus.com/help/scores-faq/#proper-scoring"
          className="text-blue-600 hover:underline"
        >
          https://www.metaculus.com/help/scores-faq/#proper-scoring
        </a>
        , that applies objective criteria.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="age-requirements"
      >
        Age and Residence Requirements; U.S. Jurisdiction
      </h2>
      <p className="mb-4">
        The Service is offered and is available to individuals age 13 and over.
        If you are between the ages of 13 and the age of majority where you
        live, you must review these Terms of Use with your parent or guardian to
        confirm that you and your parent or guardian understand and agree to it.
        The Service is not intended or authorized for distribution or use in any
        jurisdiction or country where such distribution or use would be contrary
        to law or regulation or which would subject Metaculus to any
        registration requirement within such jurisdiction or country, and meet
        all of the foregoing eligibility requirements. By using this Website,
        you represent and warrant that you of legal age to form a binding
        contract with the Company, are not on any list of restricted persons
        with whom it is unlawful for a U.S. company to do business. Metaculus
        operates the Service in the United States. Metaculus makes no
        representations or warranties that the Service is appropriate for use or
        access in other locations. Anyone using or accessing the Service from
        other locations does so on their own initiative and is responsible for
        compliance with United States&apos; and local laws regarding online
        conduct and acceptable content, if and to the extent such laws are
        applicable. We reserve the right to limit the availability of the
        Service and/or the provision of any content, program, product, service
        or other feature to any person, geographic area, or jurisdiction, at any
        time and in our sole discretion, and to limit the quantities of any such
        content, program, product, service or other feature that we provide.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="proprietary-rights"
      >
        Proprietary Rights
      </h2>
      <p className="mb-4">
        The Service is owned and operated by Metaculus. Unless otherwise
        explicitly specified by Metaculus, all materials that are included in or
        otherwise a part of the Service, including past, present, and future
        versions, domain names, source and object code, the text, site design,
        logos, graphics, bibliographic information, icons, and book cover
        images, as well as the selection, assembly and arrangement thereof and
        the &quot;look and feel&quot; of the Service (collectively,
        &quot;Metaculus Content&quot;), are owned, controlled, or licensed by
        Metaculus. Metaculus Content is protected from unauthorized use, copying
        and dissemination by copyright, trademark, patent, and other laws,
        rules, regulations and treaties.{" "}
        <strong>
          <em>Any unauthorized use of Metaculus Content is prohibited.</em>
        </strong>{" "}
        Any unauthorized use of the materials appearing on the Service may
        violate copyright, trademark, patent, and other applicable laws, rules,
        regulations, and treaties, and could result in criminal or civil
        penalties.
      </p>

      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="license">
        Your License to Use Site Content
      </h2>
      <p className="mb-4">
        Subject to your compliance with these Terms of Use, Metaculus grants you
        a limited, personal, non-exclusive, non-commercial, revocable and
        non-transferable license to view the Metaculus Content. You may only use
        the Service for your own personal use. You agree not to view, copy, or
        procure content or information from the Service by automated means (such
        as scripts, bots, spiders, crawlers, or scrapers), or to use other data
        mining technology or processes to frame, mask, extract data or other
        materials from the Metaculus Content (except as may be a result of
        standard search engine or Internet browser usage), unless formally
        authorized by Metaculus under separate written agreement. No materials
        from the Service may be copied, reproduced, modified, republished,
        downloaded, uploaded, posted, transmitted, or distributed in any form or
        by any means without Metaculus&apos;s prior written permission or as
        expressly provided in these Terms of Use. You may not use the Service,
        any Metaculus Content, or any User Content accessed through the Service
        to train or otherwise create or develop any artificial intelligence or
        machine learning model or algorithm without Metaculus&apos;s prior
        written permission. When you download or use the Metaculus Content as
        authorized by these Terms of Use, you must: (a) keep intact all
        copyright and other proprietary notices; (b) make no modifications to
        the Metaculus Content; and (c) not copy or adapt any object code
        associated with the Service or reverse engineer, modify or attempt to
        discover any source code associated with the Service, nor allow or
        assist any third party (whether or not for your benefit) to do so. All
        rights not expressly granted herein are reserved. Metaculus may impose
        reasonable limits on your scope of access to Metaculus Content,
        including limits on time or number of materials accessed or machines
        used to access such Content, to prevent unauthorized third party access
        to or use of that Content.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="social-distribution"
      >
        Social Distribution and Widgets
      </h2>
      <p className="mb-4">
        Metaculus may allow you, but only through express written permission, to
        engage in certain personal uses of Metaculus Content that include the
        ability to share certain Metaculus Content with others (&quot;Social
        Distribution&quot;). For example, the Service may allow you to send
        certain Metaculus Content to friends, display Metaculus Content on your
        personal web site or post Metaculus Content on a third party web site.
        You agree that you will not imply that you and Metaculus are affiliated
        in any way or that Metaculus approves of your comments. We reserve the
        right to revoke our permission for Social Distribution at any time and
        for any reason, and you agree to immediately cease Social Distribution
        upon notice of revocation and to comply with any terms we post in
        connection with the Social Distribution of Metaculus Content.
      </p>

      <p className="mb-4">
        Similarly, the Service may provide content that you may choose to embed
        on your personal web page, third party web site or social networking
        site by pasting the HTML or other code provided by us (typically labeled
        as an embed code) (&quot;Widgets&quot;). Widgets are Metaculus Content
        and subject to the limited, revocable license described above. We may
        discontinue providing the Service necessary for the Widgets to operate
        or we may disable Widgets you have embedded at any time for any reason
        without any liability to you. You agree that our permission to you to
        use Widgets does not provide you (or any third party) with any
        intellectual property rights in or to the Widget or any Metaculus
        Content made available via any Widget.
      </p>

      <p className="mb-4 font-bold">
        NOTICE TO THIRD PARTY SITES: Any Metaculus Content made available in
        connection with your site, or otherwise, by our Widgets, third party
        widgets or otherwise, is our exclusive property and no grant of any
        intellectual property rights is made by us. We retain the right to
        demand that you cease any use of Metaculus Content upon notice.
      </p>
      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="user-content"
      >
        User Content and Activities
      </h2>
      <p className="mb-4">
        All information we collect on this Website is subject to our Privacy
        Policy. By using the Website, you consent to all actions taken by us
        with respect to your information in compliance with the Privacy Policy.
      </p>
      <p className="mb-4">
        When you submit, post, upload, embed, display, communicate, link to,
        email or otherwise distribute or publish any question, prediction,
        review, problem, suggestion, idea, solution, question, answer, feedback,
        message, image, video, text, profile data or other material (
        <strong>User Content</strong>) to Metaculus, any Metaculus employee or
        contractor, or a Metaculus web site,{" "}
        <strong>
          you grant Metaculus and our affiliates, licensees, distributors,
          agents, representatives and other entities or individuals authorized
          by Metaculus, a non-exclusive, worldwide, perpetual, unlimited,
          irrevocable, royalty-free, fully sublicensable (through multiple
          tiers) and fully transferable right to make copies of such content and
          to publish such content through the Website, partners or affiliates,
          to make, use, reproduce, copy, display, publish, exhibit, distribute,
          modify, sell, offer for sale, create derivative works based upon and
          otherwise use the User Content
        </strong>
        . You also grant each user of the service the right to access your
        Content through the Website.
      </p>
      <p className="mb-4">
        You further agree that Metaculus is free to use any ideas or concepts
        contained in any User Content for any purposes whatsoever, including,
        without limitation, developing, manufacturing and marketing products and
        Service; and creating informational articles, without any payment of any
        kind to you. You authorize Metaculus to publish your User Content in a
        searchable format that may be accessed by users of the Service and the
        Internet. Except as prohibited by law, you waive any moral rights you
        may have in any User Content you submit, even if such User Content is
        altered or changed in a manner not agreeable to you.
      </p>
      <p className="mb-4">
        Metaculus is not required to host, display, or distribute, and may
        remove at any time, any User Content. Metaculus reserves the right to
        change the format, sizing, and any other display specifications of the
        User Content as it sees fit.
      </p>
      <p className="mb-4">
        You represent and warrant that (i) you own the User Content submitted by
        you on, through or in connection with the Service, or otherwise have the
        right to grant the licenses set forth in this section, and (ii) the
        posting of your User Content on, through or in connection with the
        Service and/or Linked Service does not violate the privacy rights,
        publicity rights, copyrights, contract rights or any other rights of any
        person or entity. Upon Metaculus&apos;s request, you will furnish
        Metaculus any documentation, substantiation or releases necessary to
        verify your compliance with these Terms of Use. You retain full
        ownership of all your User Content and any intellectual property rights
        in that content, subject to the rights granted herein.
      </p>
      <p className="mb-4">
        Except as otherwise described in the posted{" "}
        <a
          href="http://www.metaculus.com/privacy-policy"
          className="text-blue-600 hover:underline"
        >
          privacy policy
        </a>
        , or other agreement on the Service presented at the time you provide
        your User Content (defined below), you agree that your User Content will
        be treated as non-confidential and non-proprietary and will not be
        returned. You acknowledge and agree that your relationship with
        Metaculus is not a confidential, fiduciary, or other type of special
        relationship, and that your decision to submit any User Content does not
        place Metaculus in a position that is any different from the position
        held by members of the general public, including with regard to your
        User Content. None of your User Content will be subject to any
        obligation of confidence on the part of Metaculus, and Metaculus will
        not be liable for any use or disclosure of any User Content that you
        provide.
      </p>
      <p className="mb-4">
        It is our policy not to accept or consider content, information, ideas,
        suggestions or other materials other than those we have specifically
        requested, to which certain specific terms, conditions and requirements
        may apply. This is to avoid any misunderstandings if your ideas are
        similar to those we have developed or are developing independently.
        Accordingly, Metaculus does not accept unsolicited materials or ideas,
        and takes no responsibility for any materials or ideas so transmitted.
      </p>
      <p className="mb-4">
        You understand that any predictions made on or through the Website as
        not guarantees – the future is not knowable, and the User Content on the
        Website is at most simply a prediction, forecast, or surmise about what
        may happen in the future. Acting in reliance on any User Content is at
        your own risk, and we advise you to do your own research and consult
        with your own professional advisors prior to taking any action relying
        on the User Content.
      </p>
      <p className="mb-4">
        You agree that Metaculus has no obligation to monitor or enforce your
        intellectual property rights to your User Content but has the right to
        protect and enforce its and its licensees&apos; rights to your User
        Content. You further acknowledge and agree that Metaculus will not have
        any obligation to you with regard to User Content and that Metaculus may
        or may not monitor, display or accept your User Content and may delete
        it at any time. We may, but are not obligated to, review User Content
        prior to posting it on or distributing it through the Service, or
        allowing them to be distributed through the Service. This includes
        private messages exchanged by you and other users through the Service.
        This &quot;User Content and Activities&quot; section shall survive any
        expiration or termination of your relationship with Metaculus.
      </p>
      <p className="mb-4">
        You understand and agree that Metaculus may, at various times, make a
        series of evaluations, decisions concerning whether your User Content is
        appropriate, or whether your predictions were accurate, and how much
        value (points or other value) to assign or take away from your profile,
        which is public. These evaluations and decisions may involve independent
        judgment from Metaculus, its user community, or other individuals that
        Metaculus may in its discretion grant the authority to make such
        evaluations and decisions. You expressly acknowledge that Metaculus and
        its assigns have the final authority to interpret and decide all issues
        relating to questions, comments, predictions, timing, resolutions,
        scoring and outcomes, and all other matters regarding the operation of
        the Site, even if they may be subject to different interpretations or
        resolutions. You agree to accept the interpretations and final decisions
        of Metaculus regarding such matters.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="acceptable-use"
      >
        Acceptable Use Policy
      </h2>
      <p className="mb-4">
        You are solely responsible for the User Content you submit, through or
        in connection with our Service, and any material or information that you
        transmit to other users and for your interactions with other users. When
        you contribute, upload or otherwise provide User Content via the
        Service, you agree to comply with the following Community Usage Rules.
        In addition to removing prohibited materials, Metaculus may terminate
        the responsible accounts, and/or report such activities to law
        enforcement authorities as appropriate.
      </p>
      <p className="mb-4">
        Prohibited User Content includes, but is not limited to, material that
        Metaculus determines:
      </p>
      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>
          is patently offensive or promotes or otherwise incites racism,
          bigotry, hatred or physical harm of any kind against any group or
          individual;
        </li>
        <li>harasses or advocates harassment of another person;</li>
        <li>
          exploits people in a sexual or violent manner or contains nudity,
          excessive violence, or offensive subject matter or contains a link to
          an adult or otherwise objectionable website;
        </li>
        <li>
          posts information that poses or creates a privacy or security risk to
          any person;
        </li>
        <li>
          constitutes or promotes information that you know is false or
          misleading or promotes illegal activities or conduct that is abusive,
          threatening, obscene, defamatory or libelous;
        </li>
        <li>
          constitutes or promotes an illegal or unauthorized copy of another
          person&apos;s copyrighted work, such as providing pirated computer
          programs or links to them, providing information to circumvent
          manufacturer-installed copy-protect devices, or providing pirated
          music or links to pirated music files;
        </li>
        <li>
          involves the transmission of &quot;junk mail,&quot; &quot;chain
          letters,&quot; or unsolicited mass mailing, instant messaging,
          &quot;spimming,&quot; or &quot;spamming&quot;;
        </li>
        <li>
          contains restricted or password only access pages or hidden pages or
          images (those not linked to or from another accessible page) or
          solicits or is designed to solicit passwords or personal identifying
          information for commercial or unlawful purposes from other users;
        </li>
        <li>
          furthers or promotes any criminal activity or enterprise or provides
          instructional information about illegal activities including, but not
          limited to, making or buying illegal weapons or providing or creating
          computer viruses;
        </li>
        <li>
          involves commercial activities and/or sales without prior written
          consent from Metaculus such as contests, sweepstakes, barter,
          advertising, or pyramid schemes;
        </li>
        <li>
          includes a photograph or video of another person that you have posted
          without that person&apos;s consent;
        </li>
        <li>
          violates or attempts to violate the privacy rights, publicity rights,
          copyrights, patent rights, trademark rights, contract rights or any
          other rights of any person.
        </li>
      </ol>
      <p className="mb-4">Prohibited activities include, without limitation:</p>
      <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
        <li>
          unauthorized advertising to, or solicitation of, any user to buy or
          sell any products or Service;
        </li>
        <li>
          circumventing or modifying, attempting to circumvent or modify, or
          encouraging or assisting any other person in circumventing or
          modifying any security technology or software that is part of our
          Service;
        </li>
        <li>
          activity that involves the use of viruses, bots, worms, or any other
          computer code, files or programs that interrupt, destroy or limit the
          functionality of any computer software or hardware, or otherwise
          permit the unauthorized use of or access to a computer or a computer
          network;
        </li>
        <li>
          modifying, copying, distributing, downloading, scraping or
          transmitting in any form or by any means, in whole or in part, any
          content from the Service;
        </li>
        <li>
          covering or obscuring the banner advertisements and/or safety features
          (e.g., report abuse button) on your personal profile page, or any
          Metaculus page via HTML/CSS or any other means;
        </li>
        <li>
          any automated use of the Service, such as, but not limited to, using
          scripts to send messages or posts;
        </li>
        <li>
          use of the Service, any Metaculus Content, or any User Content
          accessed through the Service to train or otherwise create or develop
          any artificial intelligence or machine learning model or algorithm
          without Metaculus&apos;s prior written permission;
        </li>
        <li>
          interfering with, disrupting, or creating an undue burden on the
          Service or the networks or Service connected to the Service;
        </li>
        <li>
          displaying an unauthorized commercial advertisement on your profile,
          or accepting payment or anything of value from a third person in
          exchange for your performing any commercial activity through the use
          of the Service on behalf of that person, such as placing commercial
          content on review posts or solutions, links to e-commerce sites not
          authorized by Metaculus, or sending messages with a commercial
          purpose;
        </li>
        <li>
          activity unrelated or disruptive to the Service, such as submissions
          that force browsers to scroll horizontally, large blank or
          content-free submissions, &quot;Bumping&quot; multiple older topics
          (posting in them well after the last post), posting multiple identical
          or near-identical messages or topics, including &quot;fad&quot;
          topics, hard-to-read topic titles (e.g., ALL CAPS, AlTeRnAtE cApS, no
          spaces, no or excessive punctuation), or multiple hard-to-read or
          nonsensical messages in a single or multiple topics; or
        </li>
        <li>
          using the Service in a manner inconsistent with any applicable law.
        </li>
      </ol>
      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="service-modifications"
      >
        Service Modifications
      </h2>
      <p className="mb-4">
        Metaculus reserves the right, in our sole discretion, to make changes to
        or discontinue any of the Service at any time. Any description of the
        Service provided by Metaculus is not a representation that the Service
        are working or will always work in that manner, as Metaculus is
        continuously updating the Service, and these updates may not always be
        reflected in the Terms of Use.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="mobile-use"
      >
        Mobile Use
      </h2>
      <p className="mb-4">
        The Service may offer features and Service that are available to you via
        your mobile device. These features and Service may include, without
        limitation, the ability to upload content to the Service, receive
        messages from the Service, download applications to your mobile phone or
        access features from the Service (collectively, the &quot;
        <strong>Mobile Features</strong>&quot;). We may charge for Mobile
        Features and these charges will be disclosed prior to completion of
        registration for the Mobile Feature. Also, standard messaging, data and
        other fees may be charged by your carrier. Carrier fees and charges will
        appear on your mobile bill or be deducted from your pre-paid balance.
        Your carrier may prohibit or restrict certain Mobile Features and
        certain Mobile Features may be incompatible with your carrier or mobile
        device. Contact your carrier with questions regarding these issues.
      </p>
      <p className="mb-4">
        If you change or terminate your mobile account, you are responsible for
        promptly updating your Metaculus account information so that any
        messages or notices from Metaculus regarding the Service are sent to you
        and not to the person who is assigned your old number.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="email-notifications"
      >
        Email and Text Message Notifications
      </h2>
      <p className="mb-4">
        Notifications or receipts from Metaculus will be delivered to you by
        email at the address you provided to Metaculus when you created your
        account or as later updated. You hereby agree and acknowledge that
        Metaculus is not responsible to notify you in any way other than by
        email. Metaculus will not ask you for your personal information, account
        username, and password, or any of your credit or debit card information
        via email or text message. Metaculus will have no responsibility for any
        misuse of such information if you provide such information via email or
        text message.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="account-cancellation"
      >
        Account Cancellation
      </h2>
      <p className="mb-4">
        You may cancel your account at any time throughout our Service.
        Metaculus may cancel your account in its sole discretion any reason,
        including but not limited to inactivity or misuse of the Service. Even
        if your account in cancelled, your information, posts, and any other
        data you have shared via the Service may persist within the Service
        after cancellation of your account.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="third-party-links"
      >
        Third Party Links, Content and Applications
      </h2>
      <p className="mb-4">
        There may be links from the Service, or from communications you receive
        from the Service, to third party web sites or online features. The
        Service also may include third party content that we do not control,
        maintain or endorse.
      </p>
      <p className="mb-4">
        Functionality on the Service may also permit interactions between the
        Service and a third party web site or online feature, including
        applications that connect the Service or your profile on the Service
        with a third party site. For example, the Service may include a button
        enabling you to indicate, on your social networking page, that you
        &quot;like&quot; a specific product on the Service, or a feature that
        lets you post to your social networking page a link to a specific
        product or the ability to share content from the Service or your User
        Content with a third party, which may be publicly posted on that third
        party&apos;s web site. Using this functionality typically requires you
        to login to your account on the third party website, and you do so at
        your own risk. We do not control any of these third party sites or any
        of their content. Accordingly, you expressly acknowledge and agree that
        we are in no way responsible or liable for any of those third party
        sites or online features. YOUR CORRESPONDENCE AND BUSINESS DEALINGS WITH
        THIRD PARTIES FOUND THROUGH THE SERVICE INCLUDING, WITHOUT LIMITATION,
        THE PAYMENT AND DELIVERY OF PRODUCTS AND SERVICE, AND ANY TERMS,
        CONDITIONS, WARRANTIES AND REPRESENTATIONS ASSOCIATED WITH ANY SUCH
        DEALINGS, ARE SOLELY BETWEEN YOU AND THE THIRD PARTY.
      </p>
      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="linking-policy"
      >
        Linking Policy
      </h2>
      <p className="mb-4">
        Metaculus grants you the revocable permission to link to the web sites
        on which these Terms of Use are posted; provided, however, that any link
        to such a web site: (a) must not frame or create a browser or border
        environment around any of the content on such web sites or otherwise
        mirror any part of such web sites; (b) must not imply that Metaculus or
        the Service are endorsing or sponsoring any third party or its products
        or Service, unless Metaculus has given the third party prior written
        consent; (c) must not present false information about, or disparage,
        tarnish, or otherwise, in Metaculus&apos;s sole opinion, harm Metaculus
        or its products or Service; (d) must not use any Metaculus trademarks
        without the prior written permission from Metaculus; (e) must not
        contain content that could be construed as distasteful, offensive or
        controversial or otherwise objectionable (in Metaculus&apos;s sole
        opinion); and (f) must be owned and controlled by you or the person or
        entity placing the link, or otherwise permit you to enable such link
        subject to these Terms of Use. By linking to a Metaculus web site, you
        agree that you do and will continue to comply with the above linking
        requirements.
      </p>
      <p className="mb-4">
        Notwithstanding anything to the contrary contained in these Terms of
        Use, Metaculus reserves the right to prohibit linking to any Metaculus
        web site for any reason in our sole and absolute discretion.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="disclaimer"
      >
        Disclaimer of Warranties
      </h2>
      <p className="mb-4">
        THE METACULUS WEBSITE AND SERVICE ARE PROVIDED ON AN &quot;AS IS,&quot;
        &quot;AS AVAILABLE,&quot; AND &quot;WITH ALL FAULTS&quot; BASIS AND
        WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. TO THE
        FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, METACULUS AND ITS
        DIRECTORS, EMPLOYEES, MANAGERS, OFFICERS, AGENTS, REPRESENTATIVES OR
        VENDORS (COLLECTIVELY THE &quot;METACULUS PARTIES&quot;) SPECIFICALLY
        MAKE NO REPRESENTATIONS, WARRANTIES, OR ENDORSEMENTS OF ANY KIND,
        WHETHER EXPRESS OR IMPLIED, AS TO (A) THE SERVICE; (B) THE METACULUS
        CONTENT; (C) USER CONTENT; AND/OR (D) SECURITY ASSOCIATED WITH THE
        TRANSMISSION OF INFORMATION TO METACULUS OR VIA THE SERVICE. IN
        ADDITION, THE METACULUS PARTIES DISCLAIM ALL WARRANTIES, EXPRESS,
        IMPLIED, OR STATUTORY, INCLUDING, BUT NOT LIMITED TO, WARRANTIES OF
        FITNESS FOR A PARTICULAR PURPOSE, OF MERCHANTABILITY,NON-INFRINGEMENT,
        TITLE, CUSTOM, TRADE, QUIET ENJOYMENT, SYSTEM INTEGRATION, AND FREEDOM
        FROM COMPUTER VIRUS.
      </p>
      <p className="mb-4">
        WITHOUT LIMITING THE FOREGOING, THE METACULUS PARTIES SPECIFICALLY DO
        NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE, THAT DEFECTS WILL BE
        CORRECTED OR THAT THE SERVICE OR THE SERVER, NETWORK OR OTHER SOFTWARE
        AND EQUIPMENT THAT MAKES THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER
        HARMFUL COMPONENTS. METACULUS DOES NOT MAKE ANY REPRESENTATIONS OR
        WARRANTIES REGARDING THE CONTENT OF ITS PRODUCTS, WEBSITES OR SERVICE,
        OR REGARDING THE RESULTS OF THE USE OF THE SERVICE IN TERMS OF THEIR
        COMPLETENESS, CORRECTNESS, ACCURACY, RELIABILITY, USEFULNESS OR
        OTHERWISE, UNLESS SPECIFICALLY SET OUT ON THE SERVICE. YOU ACKNOWLEDGE
        THAT YOUR USE OF THE SERVICE ARE AT YOUR SOLE RISK. THE METACULUS
        PARTIES DO NOT WARRANT THAT YOUR USE OF THE SERVICE ARE LAWFUL IN ANY
        PARTICULAR JURISDICTION, AND THE METACULUS PARTIES SPECIFICALLY DISCLAIM
        SUCH WARRANTIES. SOME JURISDICTIONS LIMIT OR DO NOT ALLOW THE DISCLAIMER
        OF IMPLIED OR OTHER WARRANTIES SO THE ABOVE DISCLAIMER MAY NOT APPLY TO
        THE EXTENT SUCH JURISDICTION&apos;S LAW IS APPLICABLE TO THESE TERMS.
      </p>
      <p className="mb-4">
        BY ACCESSING OR USING THE SERVICE YOU REPRESENT AND WARRANT THAT YOUR
        ACTIVITIES ARE LAWFUL IN EVERY JURISDICTION WHERE YOU ACCESS OR USE THE
        SERVICE.
      </p>
      <p className="mb-4">
        THE METACULUS PARTIES ARE NOT RESPONSIBLE FOR THE USER CONTENT, ACCURACY
        OR OPINIONS EXPRESSED IN USER CONTENT POSTED OR PROVIDED BY THIRD
        PARTIES ON THE SERVICE OR LINKED SERVICE, AND SUCH SERVICE ARE NOT
        NECESSARILY INVESTIGATED, MONITORED OR CHECKED FOR ACCURACY OR
        COMPLETENESS BY METACULUS. INCLUSION OF ANY LINKED WEBSITE OR FEATURE ON
        THE SERVICE DOES NOT IMPLY APPROVAL OR ENDORSEMENT OF THE LINKED WEBSITE
        OR FEATURE BY METACULUS. IN ADDITION, THE METACULUS PARTIES ARE NOT
        RESPONSIBLE FOR, AND SPECIFICALLY DISCLAIM ANY RESPONSIBILITY OR
        LIABILITY TO ANY PERSON OR ANY ENTITY FOR ANY DAMAGE (WHETHER ACTUAL,
        CONSEQUENTIAL, PUNITIVE OR OTHERWISE), INJURY, LOSS, CLAIM, OR LIABILITY
        OR OTHER CAUSE OF ANY KIND OR CHARACTER BASED UPON OR RESULTING FROM ANY
        USER CONTENT OR BY ANY OF THE EQUIPMENT OR PROGRAMMING ASSOCIATED WITH
        OR UTILIZED IN THE SERVICE OR LINKED SERVICE. POSTS AND LINKED SERVICE
        CREATED AND POSTED BY USERS ON, THOUGH OR IN CONNECTION WITH THE SERVICE
        MAY CONTAIN LINKS TO OTHER WEBSITES OR SERVICE. METACULUS TAKES NO
        RESPONSIBILITY FOR THIRD PARTY ADVERTISEMENTS OR LINKED SERVICE THAT ARE
        POSTED ON, THROUGH OR IN CONNECTION WITH THE SERVICE OR LINKED SERVICE,
        NOR DOES IT TAKE ANY RESPONSIBILITY FOR THE GOODS OR SERVICE PROVIDED BY
        THESE THIRD PARTIES.
      </p>
      <p className="mb-4">
        UNDER NO CIRCUMSTANCES WILL METACULUS BE RESPONSIBLE FOR ANY LOSS OR
        DAMAGE, INCLUDING, WITHOUT LIMITATION, PERSONAL INJURY OR DEATH,
        RESULTING FROM USE OF THE SERVICE OR LINKED SERVICE, ATTENDANCE AT A
        METACULUS EVENT, FROM ANY USER CONTENT POSTED ON OR THROUGH THE SERVICE
        OR LINKED SERVICE, OR FROM THE CONDUCT OF ANY USERS OF THE SERVICE,
        WHETHER ONLINE OR OFFLINE. THIS &quot;DISCLAIMERS&quot; SECTION SHALL
        SURVIVE ANY EXPIRATION OR TERMINATION OF YOUR RELATIONSHIP WITH
        METACULUS.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="limitations"
      >
        Limitations of Liability; Waiver
      </h2>
      <p className="mb-4">
        IN NO EVENT SHALL THE METACULUS PARTIES BE LIABLE FOR ANY LOSS OR
        DAMAGES OF ANY KIND (INCLUDING, WITHOUT LIMITATION, DIRECT, INDIRECT,
        ECONOMIC, EXEMPLARY, SPECIAL, PUNITIVE, INCIDENTAL OR CONSEQUENTIAL
        LOSSES OR DAMAGES)THAT ARE DIRECTLY OR INDIRECTLY RELATED TO: (A) THE
        SERVICE; (B) THE METACULUS CONTENT; (C) USER CONTENT; (D) YOUR USE OF,
        INABILITY TO USE, OR THE PERFORMANCE OF THE SITE; (E) ANY ACTION TAKEN
        IN CONNECTION WITH AN INVESTIGATION BY THE METACULUS PARTIES OR LAW
        ENFORCEMENT AUTHORITIES REGARDING YOUR USE OF THE SITE; (F) ANY ACTION
        TAKEN IN CONNECTION WITH COPYRIGHT OR OTHER INTELLECTUAL PROPERTY
        OWNERS; (G) ANY ERRORS OR OMISSIONS IN THE SERVICE&apos;S TECHNICAL
        OPERATION; OR (H) ANY DAMAGE TO ANY USER&apos;S COMPUTER, MOBILE DEVICE,
        OR OTHER EQUIPMENT OR TECHNOLOGY INCLUDING, WITHOUT LIMITATION, DAMAGE
        FROM ANY SECURITY BREACH OR FROM ANY VIRUS, BUGS, TAMPERING, FRAUD,
        ERROR, OMISSION, INTERRUPTION, DEFECT, DELAY IN OPERATION OR
        TRANSMISSION, COMPUTER LINE OR NETWORK FAILURE OR ANY OTHER TECHNICAL OR
        OTHER MALFUNCTION, INCLUDING, WITHOUT LIMITATION, DAMAGES FOR LOST
        PROFITS, LOSS OF GOODWILL, LOSS OF DATA, WORK STOPPAGE, ACCURACY OF
        RESULTS, OR COMPUTER FAILURE OR MALFUNCTION, EVEN IF FORESEEABLE OR EVEN
        IF THE METACULUS PARTIES HAVE BEEN ADVISED OF OR SHOULD HAVE KNOWN OF
        THE POSSIBILITY OF SUCH DAMAGES, WHETHER IN AN ACTION OF CONTRACT,
        NEGLIGENCE, STRICT LIABILITY OR TORT (INCLUDING, WITHOUT LIMITATION,
        WHETHER CAUSED IN WHOLE OR IN PART BY NEGLIGENCE, ACTS OF GOD,
        TELECOMMUNICATIONS FAILURE, OR THEFT OR DESTRUCTION OF THE SITE). IN NO
        EVENT WILL THE METACULUS PARTIES BE LIABLE TO YOU OR ANYONE ELSE FOR
        LOSS, DAMAGE OR INJURY, INCLUDING, WITHOUT LIMITATION, DEATH OR PERSONAL
        INJURY. SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF
        INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATION OR
        EXCLUSION MAY NOT APPLY TO YOU. IN NO EVENT WILL THE METACULUS PARTIES
        TOTAL LIABILITY TO YOU FOR ALL DAMAGES, LOSSES OR CAUSES OR ACTION
        EXCEED THE AMOUNTS PAID BY YOU TO METACULUS IN THE PAST SIX MONTHS, OR
        $250, WHICHEVER IS GREATER. THE EXCLUSIONS AND LIMITATIONS OF LIABILITY
        IN THESE TERMS OF USE WILL APPLY NOTWITHSTANDING ANY FAILURE OF
        ESSENTIAL PURPOSE OF ANY LIMITED REMEDY. THIS SECTION SHALL SURVIVE ANY
        EXPIRATION OR TERMINATION OF YOUR RELATIONSHIP WITH METACULUS.
      </p>
      <p className="mb-4">
        YOU AGREE THAT IN THE EVENT YOU INCUR ANY DAMAGES, LOSSES OR INJURIES
        THAT ARISE OUT OF THE METACULUS PARTIES&apos; ACTS OR OMISSIONS, THE
        DAMAGES, IF ANY, CAUSED TO YOU ARE NOT IRREPARABLE OR SUFFICIENT TO
        ENTITLE YOU TO AN INJUNCTION PREVENTING ANY EXPLOITATION OF ANY WEB
        SITE, PROPERTY, PRODUCT, SERVICE, OR OTHER METACULUS CONTENT OWNED OR
        CONTROLLED BY THE METACULUS PARTIES, AND YOU WILL HAVE NO RIGHTS TO
        ENJOIN OR RESTRAIN THE DEVELOPMENT, PRODUCTION, DISTRIBUTION,
        ADVERTISING, EXHIBITION OR EXPLOITATION OF ANY WEB SITE, PROPERTY,
        PRODUCT, SERVICE, OR OTHER METACULUS CONTENT OWNED OR CONTROLLED BY THE
        METACULUS PARTIES.
      </p>
      <p className="mb-4">
        BY ACCESSING THE SERVICE, YOU UNDERSTAND THAT YOU MAY BE WAIVING RIGHTS
        WITH RESPECT TO CLAIMS THAT ARE AT THIS TIME UNKNOWN OR UNSUSPECTED, AND
        IN ACCORDANCE WITH SUCH WAIVER, YOU ACKNOWLEDGE THAT YOU HAVE READ AND
        UNDERSTAND, AND HEREBY EXPRESSLY WAIVE, THE BENEFITS OF SECTION 1542 OF
        THE CIVIL CODE OF CALIFORNIA, AND ANY SIMILAR LAW OF ANY STATE OR
        TERRITORY, WHICH PROVIDES AS FOLLOWS: &quot;A GENERAL RELEASE DOES NOT
        EXTEND TO CLAIMS WHICH THE CREDITOR DOES NOT KNOW OR SUSPECT TO EXIST IN
        HIS FAVOR AT THE TIME OF EXECUTING THE RELEASE, WHICH IF KNOWN BY HIM
        MUST HAVE MATERIALLY AFFECTED HIS SETTLEMENT WITH THE DEBTOR.&quot;
      </p>

      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="indemnity">
        Indemnity
      </h2>
      <p className="mb-4">
        You agree to defend, indemnify and hold harmless the Metaculus Parties
        from and against any and all loss, liability, damages, judgments,
        claims, demands, costs, investigations, settlements, and expenses
        (including, without limitation, reasonable attorneys&apos; fees) arising
        out of or directly or indirectly relating to (a) your User Content; (b)
        your use of the Service or activities in connection with the Service;
        (c) your breach or anticipatory breach of these Terms of Use; (d) your
        violation of any laws, rules, regulations, codes, statutes, ordinances
        or orders of any governmental and quasi-governmental authorities,
        including, without limitation, all regulatory, administrative and
        legislative authorities; (e) information or material transmitted through
        your computer, even if not submitted by you, that infringes, violates or
        misappropriates any copyright, trademark, trade secret, trade dress,
        patent, publicity, privacy or other right of any person or defames any
        person; (f) any misrepresentation made by you; or (g) the Metaculus
        Parties&apos; use of your information or User Content as permitted under
        these Terms of Use, the Privacy Policy, or any other written agreement
        between you and Metaculus. You will cooperate as fully required by the
        Metaculus Parties in the defense of any claim. The Metaculus Parties
        reserve the right to assume the exclusive defense and control of any
        matter otherwise subject to indemnification by you, and you will not in
        any event settle any claim without the prior written consent of a duly
        authorized employee of the Metaculus Parties. These indemnity
        obligations shall survive any expiration or termination of your
        relationship with Metaculus.
      </p>
      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="copyright-violations"
      >
        Reporting Copyright and Other Intellectual Property Violations
      </h2>
      <p className="mb-4">
        Metaculus respects the intellectual property rights of others and takes
        the protection of copyrights and other intellectual property seriously.
        Only the intellectual property rights owner or person authorized to act
        on behalf of the owner can report potentially infringing content. If you
        believe your work has been infringed through the Service, please notify
        us at Metaculus, Inc., Attention: Copyright Agent, 1112 Montana Avenue
        Suite 464, Santa Monica, CA, US 90403, or at the email address{" "}
        <a
          href="mailto:copyright@metaculus.com"
          className="text-blue-600 hover:underline"
        >
          copyright@metaculus.com
        </a>{" "}
        and provide the following information:
      </p>
      <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
        <li>
          Your contact information, including name, address, telephone number,
          and e-mail address;
        </li>
        <li>
          A description of the copyrighted work you claim has been infringed;
        </li>
        <li>
          A reasonably specific description of where the allegedly infringing
          material is located on the Service (including, e.g., the URL);
        </li>
        <li>
          A statement by you that you have a good-faith belief that the
          allegedly infringing material is not authorized by the copyright
          owner, its agent, or the law;
        </li>
        <li>Your electronic or physical signature;</li>
        <li>
          A statement by you, made under penalty of perjury, that the
          information in your notice is accurate and that you are the copyright
          owner or authorized to act on the copyright owner&apos;s behalf; and
        </li>
        <li>
          Information reasonably sufficient to permit us to contact the
          complaining party.
        </li>
      </ul>
      <p className="mb-4">
        NOTE: This contact information is for inquiries regarding potential
        copyright and other infringement only.
      </p>
      <p className="mb-4">
        It is often difficult to determine if your intellectual property rights
        have been violated or if the DMCA requirements have been met. We may
        request additional information before we remove any infringing material.
        If a dispute develops as to the correct owner of the rights in question,
        we reserve the right to remove your content along with that of the
        alleged infringer pending resolution of the matter.
      </p>
      <p className="mb-4">
        Metaculus will provide you with notice if your materials have been
        removed based on a third party complaint of alleged infringement of the
        third party&apos;s intellectual property rights.
      </p>
      <p className="mb-4">
        IF YOU KNOWINGLY MISREPRESENT THAT MATERIAL IS OR IS NOT INFRINGING, YOU
        MAY BE SUBJECT TO CIVIL PENALTIES. THESE INCLUDE MONETARY DAMAGES, COURT
        COSTS, AND ATTORNEYS&apos; FEES INCURRED BY METACULUS, BY ANY COPYRIGHT
        OWNER, OR BY ANY COPYRIGHT OWNER&apos;S LICENSEE THAT IS INJURED AS A
        RESULT OF RELIANCE UPON YOUR MISREPRESENTATION. YOU MAY ALSO BE SUBJECT
        TO CRIMINAL PROSECUTION FOR PERJURY. You agree we may provide your
        notice to the provider of the allegedly infringing material.
      </p>
      <p className="mb-4">
        We have a policy of terminating accounts of users who repeatedly or
        intentionally infringe the intellectual property rights of others.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="legal-disputes"
      >
        Legal Disputes
      </h2>
      <p className="mb-4">
        If a dispute arises between you and Metaculus, you agree that we will
        resolve any claim or controversy at law or equity that relates to or
        arises out of the Terms of Use or the Service or your use of the Service
        (a &quot;<strong>Claim</strong>&quot;) in accordance with the
        subsections below.
      </p>
      <p className="mb-4">
        General. You and Metaculus agree that any dispute, claim or controversy
        arising out of or relating to these Terms of Use or the breach,
        termination, enforcement, interpretation or validity thereof
        (collectively, &quot;<strong>Disputes</strong>&quot;) will be settled by
        binding arbitration; except as set forth in the Judicial Resolution
        section below.{" "}
        <strong>
          You acknowledge and agree that you and Metaculus are each waiving the
          right to a trial by jury or to participate as a plaintiff or class
          member in any purported class action or representative proceeding.
        </strong>{" "}
        Further, unless both you and Metaculus otherwise agree, the arbitrator
        may not consolidate more than one person&apos;s claims, and may not
        otherwise preside over any form of any class or representative
        proceeding. If this specific paragraph is held unenforceable, then the
        entirety of this &quot;Legal Disputes&quot; section will be deemed void.
        This &quot;Legal Disputes&quot; section will survive any termination of
        these Terms of Use. Notwithstanding the foregoing, each party reserves
        the right to seek injunctive or other equitable relief in a court of
        competent jurisdiction with respect to any dispute related to the actual
        or threatened infringement, misappropriation or violation of a
        party&apos;s intellectual property or proprietary rights or breach of
        the User Content and Activities provisions of this Agreement.
      </p>
      <p className="mb-4">
        Arbitration Rules, Governing Law, Jurisdiction and Venue. The
        arbitration will be administered by the American Arbitration Association
        (&quot;<strong>AAA</strong>&quot;) in accordance with the Commercial
        Arbitration Rules and the Supplementary Procedures for Consumer Related
        Disputes (the &quot;<strong>AAA Rules</strong>&quot;) then in effect,
        except as modified by this Section of these Terms of Use. (The AAA Rules
        are available at www.adr.org/arb_med or by calling the AAA at
        1-800-778-7879.) The Federal Arbitration Act will govern the
        interpretation and enforcement of this Section. These Terms and any
        action related thereto will be governed by the laws of the State of
        California without regard to its conflict of laws provisions. The
        exclusive jurisdiction and venue of any action taken in a small claims
        court as contemplated by these terms will be the courts located in the
        Northern District of California and each of the parties hereto waives
        any objection to jurisdiction and venue in such courts.
      </p>
      <p className="mb-4">
        Arbitration Process. A party who desires to initiate arbitration must
        provide the other party with a written Demand for Arbitration as
        specified in the AAA Rules. (The AAA provides a form Demand for
        Arbitration at www.adr.org/si.asp?id=3477 and a separate form for
        California residents at www.adr.org/si.asp?id=3485.) The arbitrator will
        be either a retired judge or an attorney licensed to practice law in the
        state of California and will be selected by the parties from the
        AAA&apos;s roster of consumer dispute arbitrators. If the parties are
        unable to agree upon an arbitrator within seven (7) days of delivery of
        the Demand for Arbitration, then the AAA will appoint the arbitrator in
        accordance with the AAA Rules.
      </p>
      <p className="mb-4">
        Arbitration Location and Procedure. Unless you and Metaculus otherwise
        agree, the arbitration will be conducted in the county where you reside.
        If your claim does not exceed $10,000, then the arbitration will be
        conducted solely on the basis of documents you and Metaculus submit to
        the arbitrator, unless you request a hearing or the arbitrator
        determines that a hearing is necessary. If your claim exceeds $10,000,
        your right to a hearing will be determined by the AAA Rules. Subject to
        the AAA Rules, the arbitrator will have the discretion to direct a
        reasonable exchange of information by the parties, consistent with the
        expedited nature of the arbitration.
      </p>
      <p className="mb-4">
        Arbitrator&apos;s Decision. The arbitrator will render an award within
        the time frame specified in the AAA Rules. The arbitrator&apos;s
        decision will include the essential findings and conclusions upon which
        the arbitrator based the award. Judgment on the arbitration award may be
        entered in any court having jurisdiction thereof. The arbitrator&apos;s
        award damages must be consistent with the terms of Limitation of
        Liability section of these Terms of Use as to the types and the amounts
        of damages for which a party may be held liable. The arbitrator may
        award declaratory or injunctive relief only in favor of the claimant and
        only to the extent necessary to provide relief warranted by the
        claimant&apos;s individual claim. If you prevail in arbitration you will
        be entitled to an award of attorneys&apos; fees and expenses, to the
        extent provided under applicable law. Metaculus will not seek, and
        hereby waives all rights it may have under applicable law to recover,
        attorneys&apos; fees and expenses if it prevails in arbitration.
      </p>
      <p className="mb-4">
        Fees. Your responsibility to pay any AAA filing, administrative and
        arbitrator fees will be solely as set forth in the AAA Rules. However,
        if your claim for damages does not exceed $75,000, Metaculus will pay
        all such fees unless the arbitrator finds that either the substance of
        your claim or the relief sought in your Demand for Arbitration was
        frivolous or was brought for an improper purpose (as measured by the
        standards set forth in Federal Rule of Civil Procedure 11(b)).
      </p>
      <p className="mb-4">
        Judicial Resolution. Notwithstanding the foregoing: (1) either party
        retains the right to bring an individual action in small claims court;
        (2) either party may apply to a court of competent jurisdiction or other
        appropriate tribunal to secure preliminary or provisional relief as
        available under applicable law in connection with a Dispute; and (3) any
        Dispute involving or relating to (i) the ownership, infringement, or
        misappropriation of any intellectual property right, including but not
        limited to copyrights, patents, patent disclosures and inventions
        (whether patentable or not), trademarks, service marks, trade secrets,
        know-how, and other confidential information, trade dress, trade names,
        logos, corporate names and domain names, together with all of the
        goodwill associated therewith, or (ii) your breach of the License to Use
        Site Content or the Acceptable Use Policy sections set forth above, may
        be brought in the courts of the State of California or the courts of the
        United States of America, in either case, situated in Santa Clara
        County, California. Each party hereby submits to the jurisdiction of
        such courts and waives any defense to the exercise of such jurisdiction
        based on lack of personal jurisdiction or forum non conveniens.{" "}
      </p>
      <p className="mb-4">
        Changes. If Metaculus changes this Legal Disputes section, you may
        reject any such change by sending us written notice (including by email
        to legal@metaculus.com) within 30 days of the date such change became
        effective, as indicated in the &quot;Last Updated&quot; date. By
        rejecting any change, you are agreeing that you will resolve any Dispute
        between you and Metaculus in accordance with the provisions of this
        Section as of the date you first accepted the terms of these Terms of
        Use (or accepted any subsequent changes to these Terms of Use).
      </p>
      <p className="mb-4">
        This &quot;Legal Disputes&quot; section shall survive any expiration or
        termination of your relationship with Metaculus.
      </p>

      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="policies">
        Policies
      </h2>
      <p className="mb-4">
        When using the Service, you are subject to any posted policies or rules
        applicable to features you use through the Service, including without
        limitation the GENERAL POLICIES, FAQ/Help and all policies referenced in
        the General Policies or elsewhere in this Agreement (&quot;
        <strong>Additional Terms</strong>&quot;). All such policies or rules are
        hereby incorporated into these Terms of Use. These policies may change
        from time to time.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="miscellaneous"
      >
        Miscellaneous
      </h2>
      <p className="mb-4">
        Unless otherwise stated in this agreement, if any provision of the Terms
        of Use is declared invalid, illegal or unenforceable, all remaining
        provisions continue in full force and effect. The failure of Metaculus
        to exercise or enforce any right or provision of the Terms of Use is not
        a waiver of such right or provision. The section titles of the Terms of
        Use are for convenience only and have no legal or contractual effect.
        Non-performance of either party, except for the failure to make required
        payments, will be excused to the extent performance is delayed or
        rendered impossible by any reason where failure to perform is beyond the
        reasonable control of the non-performing party. This
        &quot;Miscellaneous&quot; section shall survive any expiration or
        termination of your relationship with Metaculus.
      </p>

      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="changes">
        Changes
      </h2>
      <p className="mb-4">
        Metaculus may modify the Terms of Use including the linked policies
        contained herein from time to time, without prior notice, though you
        will receive email notice of substantial revisions to these Terms. By
        using our Service after we have updated the terms (or engaging in such
        other conduct as we may reasonably specify), you agree to be bound by
        the then-current version of the Terms of Use, including any changes we
        may have made since the last time you used our Service. It is therefore
        important that you review the Terms of Use regularly to ensure you are
        aware of any such changes. The updated Terms of Use will be effective as
        of the time of posting, or such later date as may be specified in the
        updated Terms of Use, and will apply to your use of the Service from
        that point forward.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="entire-agreement"
      >
        Entire Agreement
      </h2>
      <p className="mb-4">
        The then-current Metaculus Terms of Use, including (a) any related
        policies and terms referenced in the Terms of Use and (b) any Additional
        Terms, are the entire agreement between you and Metaculus regarding the
        Service. The Terms of Use may not be modified without the consent of a
        duly authorized representative of Metaculus, and will supersede and
        prevail over any terms or conditions you may include with any purchase
        order or other transaction document or communication with us, regardless
        of whether Metaculus signs them or fails to object to them. This
        &quot;Entire Agreement&quot; section shall survive any expiration or
        termination of your relationship with Metaculus.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="contacting-metaculus"
      >
        Contacting Metaculus
      </h2>
      <p className="mb-4">
        If you have any questions or concerns regarding the Metaculus Websites
        or Service, please write to us Metaculus Inc., 119 Merced Ave, Santa
        Cruz CA 95060. All notices, authorizations, and requests to Metaculus
        shall be deemed given on receipt.
      </p>
    </PageWrapper>
  );
}
