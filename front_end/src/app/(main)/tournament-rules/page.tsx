import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus Tournament Rules",
  description:
    "Official rules governing tournaments and competitions on Metaculus unless superseded by specific terms, including eligibility requirements, entry procedures, prize distribution, and general competition guidelines.",
};

export default async function TournamentRules() {
  return (
    <PageWrapper>
      <h1 className="mb-6 text-3xl font-bold">
        Rules for Competitions on Metaculus
      </h1>

      <p className="mb-4">Last Modified: Jun 10, 2025</p>

      <p className="mb-4">
        These rules govern all tournaments and competitions (collectively,
        &quot;Competition(s)&quot;) hosted on Metaculus unless superseded by
        specific terms, guidelines, or descriptions provided on the relevant
        Competition or in associated rules. Competitions on Metaculus are
        skills-based, designed to evaluate participants&apos; forecasting and
        reasoning skills. No purchase, fee, or payment is required to
        participate. All entries are judged by an algorithm, or in some cases
        when specifically disclosed for a particular contest, a panel of judges,
        in each case applying objective criteria.
      </p>

      <p className="mb-4">
        Each Competition on Metaculus has its own unique page which displays the
        applicable prize pool, the relevant forecasting questions, and any
        specific rules governing that Competition. Unless otherwise indicated on
        the Competition page, prize(s) are determined according to
        Metaculus&apos;{" "}
        <a
          href="https://www.metaculus.com/help/scores-faq/#tournaments-section"
          className="text-blue-600 hover:underline"
        >
          Tournament Scoring Rules
        </a>
        , which allocate prizes algorithmically based on the accuracy of each
        registered participant&apos;s (&quot;Participant User&quot;) forecasts
        and/or according to criteria published on the relevant Competition page
        as judged by a panel of judges selected by Metaculus. The prize(s)
        awarded to such winner(s), and when such prize(s) will be awarded will
        be posted on the relevant Competition page. All Competitions will be run
        in accordance with these rules, Competition-specific rules, if any, all
        applicable laws, and the Metaculus Terms of Use (collectively,
        &quot;Competition Rules&quot;). Such Competition Rules will also include
        how and when a Participant User must submit Competition Entries (defined
        below) and the rights that Metaculus and any competition sponsor(s) will
        be granted in such Competition Entry. The Competition Rules may impose
        additional restrictions or requirements for Competitions.
      </p>

      <p className="mb-4">
        Each Participant User will comply with all Competition Rules, and
        submission of a Competition Entry or registration for a Competition
        constitutes acceptance by Participant User of the Competition Rules.
      </p>

      <p className="mb-4">
        You acknowledge and agree that Metaculus may, without any liability but
        without any obligation to do so, remove or disqualify a Participant
        User, if Metaculus determines, in its sole and absolute discretion, that
        such Participant User is in violation these Competition Rules or the
        sitewide Terms of Use or otherwise poses a risk to Metaculus, the
        Service (as defined in the Terms of Use) or another user of the Service.
      </p>

      <p className="mb-4">
        Notwithstanding anything to the contrary contained herein, Participant
        Users acknowledge and agree that Metaculus has no obligation to hold a
        Competition Entry in confidence or otherwise restrict its activities
        based on receipt of such Competition Entry. Metaculus has no obligation
        to become involved in disputes between users or between users and any
        third party relating to the use of the Services.
      </p>

      <p className="mb-4">
        Metaculus will decide the final resolution of all forecasting questions
        at its sole discretion. Annulled or Ambiguous questions will no longer
        be scored as part of the Competition.
      </p>

      <p className="mb-4">
        Metaculus reserves the right to cancel, suspend, or modify a Competition
        if any unforeseen problem – technical, legal or otherwise – prevents the
        Competition from being run as planned.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="entry-into-competition"
      >
        Entry Into a Competition
      </h2>

      <p className="mb-4">
        A &quot;Competition Entry&quot; will consist of any User Content which
        Metaculus considers to pertain to a Competition. If you are a
        Participant User and submit a Competition Entry, then you grant
        Metaculus certain rights to that Competition Entry as set forth in the
        Terms of Use. Metaculus may transfer or sublicense those rights to a
        sponsor of the Competition or other third party that has helped arrange
        or is otherwise involved in the Competition (hereafter
        &quot;Partners&quot;), as permitted by the Terms of Use.
      </p>

      <p className="mb-4">
        Competitions on Metaculus are generally open to participants worldwide,
        ages 13 or older; however, in compliance with U.S. laws and regulations,
        we cannot send monetary prizes, cash equivalents, or physical prizes to
        individuals located in countries subject to U.S. sanctions or export
        restrictions, including but not limited to Russia, Cuba, North Korea,
        and others as determined by current regulations. Participants from these
        restricted countries are welcome to compete, unless otherwise ineligible
        under the Terms of Use, and may earn non-monetary rewards such as
        medals, rankings, or recognition within our platform, as long as such
        awards do not violate applicable laws. By participating, users
        acknowledge their responsibility to comply with local laws and confirm
        their understanding that eligibility for prizes is subject to these
        restrictions. We reserve the right to withhold monetary or physical
        prizes where distribution would contravene U.S. or other applicable
        laws, and this policy is subject to change based on updates to legal
        requirements. Certain Competitions may have further geographic or age
        restrictions and be open only to residents of certain countries.
        Employees or, to the extent prohibited under an applicable contract,
        independent contractors of Metaculus and its Partners and their
        respective affiliates, subsidiaries, and agencies, and members of their
        immediate family or persons living in the same household are not
        eligible to participate in any Competition. Any person wishing to
        participate must create a free Metaculus user account. No purchase or
        entry fee is necessary to enter a Metaculus competition. Void where
        prohibited.
      </p>

      <p className="mb-4">
        You may enter a Competition only once. Entering more than once will void
        all entries and result in disqualification. You may not enter more than
        once by using multiple email addresses, identities, or devices in an
        attempt to circumvent this prohibition. Unless otherwise specifically
        permitted on the Competition-specific rules, Participant Users are not
        allowed to share accounts or participate as a team under one account –
        forecasts must be your own work.
      </p>

      <p className="mb-4">
        Unless otherwise specifically permitted in the Competition-specific
        rules, automated systems, bots, artificial intelligence, or user
        accounts which are officially registered as bot accounts, are ineligible
        for tournament prizes. However, human participants are allowed to use AI
        tools or systems to assist in their forecasting, as long as the final
        submissions reflect their own decisions and understanding.
      </p>

      <h2
        className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold"
        id="distribution-of-prizes"
      >
        Distribution of Prizes
      </h2>

      <p className="mb-4">
        At the conclusion of the Competition or a stage of a Competition,
        Metaculus will publish an announcement of the Competition rankings and
        winners. Metaculus may remove a Participant User at any time, including
        in the final announcement of the rankings and winners, if Metaculus
        believes that the Participant User is not eligible to receive a prize,
        is in violation of these Competition Rules or the Terms of Use, or has
        cheated in the Competition.
      </p>

      <p className="mb-4">
        Prize winners will be notified by email (or via any other contact
        information the Participant User has provided), with instructions
        describing steps that must be taken by winners in order to receive the
        prize. The communication may contain reasonable time period(s) by which
        certain steps must be completed in order to receive the prize. If the
        Participant User fails to respond to this communication, or, during
        subsequent communications, fails to provide the necessary information
        within the sooner of (i) the required time period(s) or (ii) 180 days
        after Metaculus sent the winner notification, such Participant User will
        be deemed to have forfeited the prize and waived any and all claims
        against Metaculus and its Partners with respect to such prize winnings.
      </p>

      <p className="mb-4">
        In order to receive the prize, prize winners must sign and return any
        and all acceptance documents as may be required by Metaculus and its
        Partners, and provide any and all information Metaculus deems necessary
        to deliver the prize, including without limitation: (a) eligibility
        certifications or proof of identity; (b) U.S. tax forms (such as IRS
        Form W-9 if U.S. resident, IRS Form W-8BEN if foreign resident, or
        future equivalents); (c) payment delivery information, such as bank
        account information, provided to Metaculus or via a third-party service
        as instructed by Metaculus.
      </p>

      <p className="mb-4">
        Metaculus and its Partners shall have no liability for any failures,
        delays, or errors in email or other communication delivery, including
        but not limited to instances where notifications sent to prize winners
        are not received, are delayed, or are sent to incorrect addresses.
        Additionally, Metaculus and its Partners are not liable for the failure
        of delivery of prizes sent electronically or physically, including but
        not limited to issues arising from incorrect or outdated recipient
        information provided by the Participant User, errors or delays by
        third-party delivery or courier services, or any other unforeseen
        circumstances. It is the sole responsibility of the Participant User to
        provide accurate and up-to-date contact and delivery information.
        Metaculus assumes no liability for any consequences arising from
        incorrect information or issues related to third-party service
        providers.
      </p>

      <p className="mb-4">
        Metaculus reserves the right to update or otherwise correct the
        leaderboard, winners announcement, and communications about prizes and
        winners if Metaculus believes there are any errors in the same, or if
        Metaculus believes that Participant Users must be removed or
        disqualified for ineligibility or violations of these Competition Rules
        or the Terms of Use.
      </p>

      <p className="mb-4">
        Metaculus awards tournament prizes based on the information available
        and the determinations Metaculus has made at the time tournament winners
        are announced. While Metaculus retains sole discretion to re-resolve
        forecasting questions where it believes an error occurred in prior
        resolutions, it is the general policy of Metaculus that such
        re-resolutions will not result in the issuance of additional prizes,
        compensation, or modifications to previously announced prizes or
        official tournament placements. Notwithstanding this general policy,
        Metaculus reserves the right, at its sole discretion, to offer
        additional prizes or compensation for questions that re-resolve after
        tournament winners have been announced; however, Metaculus is under no
        obligation to do so.
      </p>

      <p className="mb-4">
        Competition winners will receive payouts or prizes that depend on their
        rank and performance, as determined according to Metaculus&apos;{" "}
        <a
          href="https://www.metaculus.com/help/scores-faq/#tournaments-section"
          className="text-blue-600 hover:underline"
        >
          Tournament Scoring Rules
        </a>
        , which allocate prizes algorithmically based on the accuracy of each
        Participant User&apos;s forecasts and/or according to criteria published
        on the relevant Competition page as judged by a panel of judges selected
        by Metaculus. Monetary payouts may be paid in the form of cash or a cash
        equivalent, which may include but is not limited to prepaid virtual
        cards, gift cards, or similar methods, at the discretion of Metaculus.
        Metaculus reserves the right to determine the specific form of payment,
        and no alternative form of payment will be offered unless explicitly
        provided by Metaculus. Taxes and fees are paid by recipients.
      </p>

      <h2 className="mb-4 mt-8 scroll-mt-nav text-2xl font-bold" id="changes">
        Changes
      </h2>

      <p className="mb-4">
        Metaculus may modify the rules on this page with or without prior
        notice. By using the Service after these rules have been updated, each
        Participant User agrees to be bound by the then-current version of these
        rules. It is therefore important that Participant Users review these
        rules regularly to ensure they are aware of any such changes. Updated
        rules will be effective as of the time of posting, or such later date as
        may be specified in the updates, and will apply to all Competitions from
        that time forward.
      </p>
    </PageWrapper>
  );
}
