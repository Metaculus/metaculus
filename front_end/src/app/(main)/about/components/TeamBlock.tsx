"use client";
import React, { FC, useEffect, useState } from "react";

import PersonModal from "./PersonModal";

export type Group = "team" | "board" | "advisors";

export type Groups = {
  [key in Group]: Person["name"][];
};

type Social = {
  link: string;
  platform: "LinkedIn" | "Twitter";
};

export interface Person {
  userId?: number;
  name: string;
  imgSrc?: string;
  position?: string;
  socials?: Social[];
  introduction: string;
}

const people: Person[] = [
  {
    userId: 177019,
    name: "Deger Turan",
    position: "Chief Executive Officer",
    imgSrc: "https://metaculus-public.s3.us-west-2.amazonaws.com/deger.webp",
    introduction:
      "Before joining Metaculus as CEO in 2024, Deger Turan served as President of the AI Objectives Institute, developing Talk to the City, a platform that strengthens communication between under-resourced communities and the government officials serving them. Prior to AOI, he founded Cerebra Technologies, which forecasted shifts of public opinion and demand trends for 300 million citizens to support governments, hedge funds, and international retailers.",
    socials: [
      {
        link: "https://www.linkedin.com/in/vehbidegerturan/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 120279,
    name: "Tom Liptay",
    position: "Director of Forecasting",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/tom_liptay.webp",
    introduction:
      "Tom is an accomplished professional with a passion for forecasting. He became a GJP Superforecaster, joined the executive team at Good Judgment, Inc., and co-founded Maby, a forecasting startup. Tom's diverse background includes starting an investment fund, designing computer chips, and conducting nanocrystal research for his doctorate at MIT.",
    socials: [
      {
        link: "https://www.linkedin.com/in/tom-liptay-2016343/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 126463,
    name: "Atakan Seçkin",
    position: "Head of Design",
    imgSrc: "https://metaculus-media.s3.amazonaws.com/ato-bw.webp",
    introduction:
      "Atakan began his career in graphic design and has since worked with startups of various sizes and stages, with a particular emphasis on education and healthcare. During his studies in Visual Communication Design, he interned at Google as a UX Designer. After graduation, Atakan continued helping companies with product management, UX design, and front-end development.",
    socials: [
      {
        link: "https://www.linkedin.com/in/atakan-se%C3%A7kin-b7366649/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 103275,
    name: "Christian Williams",
    position: "Director of Communications & Data",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/christian_williams.webp",
    introduction:
      "Christian oversees Metaculus’ communications and marketing efforts, working closely with the operations and program teams. Previously, he worked in the aerospace and defense industry as a marketing operations lead. He received his master’s in psychology from Rutgers University, where he conducted behavioral and fMRI research on moral judgment and decision-making. Before entering the science world, he wrote for <cite>The Onion AV Club</cite> and contributed material to <cite>Saturday Night Live</cite>.",
  },
  {
    userId: 117502,
    name: "Ryan Beck",
    position: "Forecasting Program Coordinator",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/ryan_beck.webp",
    introduction:
      "Ryan is Metaculus’ Forecasting Program Coordinator. He received a Master’s degree in Civil Engineering from Iowa State University, and was previously a bridge engineer for six years. He is an avid forecaster and a pro-forecaster at INFER. Ryan is also the author of a science fiction novel, <cite>SEER</cite>.",
  },
  {
    userId: 105951,
    name: "Sylvain Chevalier",
    position: "Director of Product",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/sylvain_chevalier.webp",
    introduction:
      "Sylvain is the Director of Product at Metaculus, with a background in software engineering and expertise in forecasting methodologies. He holds two master's degrees in physical and organic chemistry from top universities in Lyon. Sylvain is dedicated to empowering forecasters and improving decision-making through advanced tools and techniques.",
  },
  {
    userId: 111848,
    name: "Juan Cambeiro",
    position: "Presidential Management Fellow; NIH Office of Science Policy",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/juan_cambeiro.webp",
    introduction:
      "Juan is a Presidential Management Fellow in the Division of Biosafety, Biosecurity, and Emerging Biotechnology Policy at the National Institutes of Health. Juan received his Masters of Public Health in epidemiology/biostatistics from Columbia University. He is currently a PhD student in Health Security at Johns Hopkins University. Juan was the top-ranked forecaster in IARPA’s COVID-19 FOCUS Forecasting Tournament and is a Superforecaster with Good Judgment Open, where he was ranked #1 on COVID-19 forecast questions.",
  },
  {
    userId: 109639,
    name: "Nikos Bosse",
    position: "Research Coordinator",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/nikos_bosse.webp",
    introduction:
      "Nikos advances Metaculus’ research agenda, focusing on forecast aggregation and forecast evaluation. He received his master’s in applied statistics from the University of Göttingen and is working toward his PhD in infectious disease forecasting and forecast evaluation at the London School of Hygiene and Tropical Medicine.",
  },
  {
    name: "Leonard Barrett",
    position: "Chief of Staff",
    imgSrc: "https://metaculus-public.s3.us-west-2.amazonaws.com/leonard.png",
    introduction:
      "Leonard’s work spans Metaculus’ various teams and initiatives, advancing our strategic direction, growth, and operational efficiency. Prior to Metaculus, he worked in real estate development and asset management, overseeing complex real estate development projects. His forecasting background includes experience as a Good Judgment Superforecaster and consistent top performance on various forecasting platforms and competitions. Leonard is passionate about elevating the crowd forecasting ecosystem to unlock its full potential in guiding policy and decision-making to mitigate global risks.",
  },
  {
    name: "Connor McCormick",
    position: "Collective Intelligence Specialist",
    imgSrc: "https://metaculus-public.s3.us-west-2.amazonaws.com/connor.webp",
    introduction:
      "Connor is a collective intelligence strategist, focused on creating environments where the wisdom of the crowd can thrive. At Metaculus, he is making tools to help forecasters share insights and estimate base rates so that cohesive models can be collaboratively developed, tested, and scored. Before joining Metaculus, Connor founded a machine learning and computer vision hardware company. When he’s not forecasting or refining collective intelligence systems, you’ll find him exploring the mountains of Colorado.",
  },
  {
    name: "Molly Hickman",
    position: "Technical Product Manager",
    imgSrc: "https://metaculus-public.s3.us-west-2.amazonaws.com/molly.webp",
    introduction:
      "Molly is a computer scientist specializing in crowdsourced intelligence. She previously worked at the MITRE Corporation, focusing on testing and evaluation for forecasting projects. At the Forecasting Research Institute, Molly concentrated on developing metrics and methods to identify the most impactful questions. She forecasts as part of the Samotsvety team and as a Pro at INFER.",
  },
  {
    userId: 137979,
    name: "Elis Popescu",
    position: "Senior Software Engineer",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/elis_popescu.webp",
    introduction:
      "Elis previously cofounded Tekudo, a SaaS tool for VC firms to manage ESG data. Prior to that, he was VP and head of software at Airtame, where he managed five teams developing multiple products with various technologies. With over a decade of experience, he has expertise in cross-platform development, live video streaming, embedded systems, and more.",
  },
  {
    userId: 135613,
    name: "Luke Sabor",
    position: "Software Engineer",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/luke_sabor.webp",
    introduction:
      "Passionate about AI safety and fueled by a love for math and logic games, Luke previously worked as a personal assistant to Max Tegmark and conducted research at UPenn's superforecasting team under Philip Tetlock. His diverse experience, spanning AI safety research to collaborating with quantum physicists, led him to work on development for Metaculus. Beyond technology, Luke enjoys exploring nature through climbing, running, biking, and birdwatching.",
  },

  {
    userId: 8,
    name: "Anthony Aguirre",
    position: "Founder & Chairman of the Board",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/anthony_aguirre.webp",
    introduction:
      "An astrophysicist and cosmologist, Anthony co-founded the Foundational Questions Institute and The Future of Life Institute. He is a Professor of Physics at UCSC and holds a PhD from Harvard. Fascinated by deep questions in physics and a belief that the long-term future of humanity hinges upon the next half-century, Anthony’s work with Metaculus is driven by his belief that it will help society navigate the coming crucial decades.",
    socials: [
      {
        link: "https://www.linkedin.com/in/anthony-aguirre-75751b9/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 10,
    name: "Greg Laughlin",
    position: "Founder & R&D Fellow",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/greg_laughlin.webp",
    introduction:
      "Greg is a planet-finder, astrophysicist, and expert on numerical computation and time-series analysis from accretion disks to trading and finance. Greg has probed the limits of predictability, from microseconds in markets to the ultra-long term cosmic future. Greg is a Professor of Astronomy at Yale and holds a PhD from UCSC.",
    socials: [
      {
        link: "https://www.linkedin.com/in/greg-laughlin-493616205/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 5,
    name: "Carroll “Max” Wainwright",
    position: "Founder & AI Advisor",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/carroll_wainwright.webp",
    introduction:
      "Max is an AI Research Scientist at OpenAI where he focuses on technical aspects of AI safety. He earned his Ph.D. in theoretical physics from the University of California Santa Cruz, where he studied phase transitions in the very early universe.",
    socials: [
      {
        link: "https://www.linkedin.com/in/carroll-wainwright-7690229a/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 100038,
    name: "David Levine",
    position: "Founder",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/david_levine.webp",
    introduction:
      "David is the president and CEO of Choice Yield Inc. and the co-founder of Goodsource Solutions. He has 30 years of experience in growing, marketing, and operating successful businesses.",
    socials: [
      {
        link: "https://www.linkedin.com/in/david-levine-521101255/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 104761,
    name: "Tamay Besiroglu",
    position: "Research Scientist, MIT; Associate Director, Epoch",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/tamay_besiroglu.webp",
    introduction:
      "Tamay is a research scientist at the Computer Science and AI Lab at MIT, an associate director at Epoch, and was previously the strategy and operations lead at Metaculus. Tamay has also contributed to the Future of Humanity Institute at Oxford University and to Bloomberg LP in London. He studied philosophy, politics, and economics at University of Warwick and received his Master of Philosophy in economics from the University of Cambridge.",
    socials: [
      {
        link: "https://www.linkedin.com/in/tamay-besiroglu/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    name: "Welton Chang",
    position: "Co-founder and CEO, Pyrra Technologies",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/welton_chang.webp",
    introduction:
      "Welton Chang is a co-founder and CEO of Pyrra Technologies, a startup combating disinformation, conspiracy, and incitement online. Welton received his PhD from the University of Pennsylvania, where he wrote his dissertation on forecasting and accountability systems. For nearly a decade, he worked as an intelligence officer at the Defense Intelligence Agency.",
    socials: [
      {
        link: "https://www.linkedin.com/in/welton-chang-a6312510/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    name: "Burak Nehbit",
    position: "Senior Interaction Designer, Google",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/burak_nehbit.webp",
    introduction:
      "Burak is a Senior Interaction Designer at Google and was the co-founder of Aether, a decentralized peer-to-peer network. Previously, Burak worked on AdWords  at Google and ad fraud at Meta. He received BFAs in communication design from Parsons School of Design in New York and from Istanbul Bilgi University.",
    socials: [
      {
        link: "https://www.linkedin.com/in/nehbit/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    name: "Steven Schkolne",
    position: "Founder, MightyMeld",
    imgSrc:
      "https://metaculus-media.s3.us-west-2.amazonaws.com/about/steven_schkolne.webp",
    introduction:
      "Steven Schkolne is a computer scientist, artist, and entrepreneur who has worked with companies such as BMW, Microsoft, and Disney. He laid the foundations for popular VR art programs like Tilt Brush and Quill while at Caltech, where he also earned his MS and PhD in Computer Science. Steven has also founded and grown companies, including Vain Media and 3dSunshine. Steven’s design leadership shaped past iterations of Metaculus, and he currently advises on UI/UX across the platform.",
    socials: [
      {
        link: "https://www.linkedin.com/in/schkolne/",
        platform: "LinkedIn",
      },
    ],
  },
];

const groups: Groups = {
  team: [
    "Deger Turan",
    "Tom Liptay",
    "Atakan Seçkin",
    "Molly Hickman",
    "Leonard Barrett",
    "Connor McCormick",
    "Christian Williams",
    "Ryan Beck",
    "Sylvain Chevalier",
    "Nikos Bosse",
    "Elis Popescu",
    "Luke Sabor",
  ],
  board: [
    "Anthony Aguirre",
    "Greg Laughlin",
    "Carroll “Max” Wainwright",
    "David Levine",
  ],
  advisors: [
    "Juan Cambeiro",
    "Tamay Besiroglu",
    "Welton Chang",
    "Burak Nehbit",
    "Steven Schkolne",
  ],
};

const TeamBlock: FC = ({}) => {
  const [randomizedGroups, setRandomizedGroups] = useState(groups);
  const [openPerson, setOpenPerson] = useState<{
    groupName: Group;
    personsName: Person["name"];
  }>({ groupName: "team", personsName: "" });

  useEffect(() => {
    const shuffledGroups = { ...groups };
    shuffledGroups.team = [...groups.team].sort(() => 0.5 - Math.random());
    setRandomizedGroups(shuffledGroups);
  }, []);

  return (
    <div>
      {Object.entries(randomizedGroups).map(([groupName, names]) => (
        <div key={groupName}>
          <h2 className="mb-12 mt-20 text-center text-4xl capitalize tracking-tight text-blue-600 dark:text-blue-600-dark sm:text-5xl md:text-left">
            {groupName}
          </h2>
          <div className="grid grid-cols-1 justify-around xs:grid-cols-[192px_192px] sm:grid-cols-[192px_192px_192px] sm:justify-between md:grid-cols-[216px_216px_216px] lg:grid-cols-[216px_216px_216px_216px] xl:grid-cols-[216px_216px_216px_216px_216px]">
            {names.map((personsName) => {
              const person = people.find(({ name }) => name === personsName);
              if (!person) return null;

              const { name, position, imgSrc } = person;
              return (
                <button
                  key={name}
                  className="group flex flex-col items-center justify-start rounded-lg px-5 py-4 hover:bg-gray-0 hover:shadow-lg focus-visible:bg-gray-0 active:shadow-md hover:dark:bg-gray-900 focus-visible:dark:bg-gray-900"
                  onClick={() =>
                    setOpenPerson({
                      groupName: groupName as Group,
                      personsName,
                    })
                  }
                >
                  <div className="size-24 rounded-full bg-[url('(main)/about/img/person.webp')] bg-cover md:size-44">
                    {imgSrc && (
                      <img
                        alt={name}
                        className="size-full rounded-full object-cover"
                        src={imgSrc}
                      />
                    )}
                  </div>
                  <h3 className="mb-1 mt-6 text-xl font-bold leading-tight text-blue-900 dark:text-blue-100">
                    {name}
                  </h3>
                  {position && (
                    <p className="my-1 text-base leading-tight text-blue-700 dark:text-blue-500">
                      {position}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!!openPerson.personsName && (
        <PersonModal
          people={people}
          randomizedGroups={randomizedGroups}
          groupName={openPerson.groupName}
          personsName={openPerson.personsName}
          setOpenPerson={setOpenPerson}
        />
      )}
    </div>
  );
};

export default TeamBlock;
