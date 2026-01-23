"use client";
import Image from "next/image";
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
    imgSrc: "https://cdn.metaculus.com/deger.webp",
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
    name: "Alex Costea",
    position: "Research Engineer",
    imgSrc: "https://cdn.metaculus.com/alex-costea-modified.webp",
    introduction:
      "Alex Costea is a Research Engineer at Metaculus, developing the PRISM-CC project. His passion lies in bridging the gap between technology and societal systems. Prior to Metaculus, he worked as a Software Engineer for SAP, developing e-commerce solutions for large multi-national corporations. He received a Bachelor's degree in Sociology from the University of Amsterdam. In his free time, he enjoys learning new things and creating various projects, software and otherwise.",
  },
  {
    name: "Jordan Rubin",
    position: "Quantitative Finance Executive",
    imgSrc: "https://cdn.metaculus.com/jordan-rubin-modified.webp",
    introduction:
      "Jordan is on garden leave after building the systematic buy-side alpha capture business at Two Sigma Investments. He currently blogs at FUTURE TOKENS on Substack. Jordan received a BS/BA degree in Economics from Wharton School at University of Pennsylvania. As advisor to Metaculus, he focuses on commercialization and monetization.",
  },
  {
    name: "Abhimanyu Pallavi Sudhir",
    position: "Research Fellow",
    imgSrc: "https://cdn.metaculus.com/abhimanyu-pallavi-sudhir-modified.webp",
    introduction:
      "Abhimanyu focuses on three primary research areas: (1) exploring analogies between economics and AI systems, particularly examining market dynamics and bounded rationality frameworks, (2) developing information markets and scalable oversight mechanisms to enhance epistemic processes and advance AI alignment, and (3) investigating applications of thermodynamics to these domains.",
  },
  {
    userId: 126463,
    name: "Atakan Seçkin",
    position: "Head of Design",
    imgSrc: "https://cdn.metaculus.com/ato-bw.webp",
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
    imgSrc: "https://cdn.metaculus.com/about/christian_williams.webp",
    introduction:
      "Christian leads communications and marketing at Metaculus, working closely with the operations and program teams. Prior to joining Metaculus, he was a marketing operations lead in the aerospace and defense industry. Christian earned his master's degree in psychology from Rutgers University, where he conducted behavioral and fMRI research on moral judgment and decision-making. Before graduate school, he was a writer for The Onion AV Club and contributed material to Saturday Night Live.",
  },
  {
    name: "Nikitas Angeletos Chrysaitis",
    position: "Forecasting Analyst",
    imgSrc: "https://cdn.metaculus.com/nikitas-angeletos-chrysaitis.webp",
    introduction:
      "Nikitas is a Forecasting Analyst at Metaculus, responsible for platform oversight, question development for various initiatives, and Metaculus Pro forecasting. He holds a background in Mathematics and a PhD in Computational Psychiatry from the University of Edinburgh.",
  },
  {
    userId: 183695,
    name: "Nikita Oleinykof",
    position: "Software Developer",
    imgSrc: "https://cdn.metaculus.com/Nikita-Oleinykof.webp",
    introduction:
      "At Metaculus, Nikita focuses on delivering seamless, user-centered experiences. His contributions include enhancing core platform functionality, automating deployments, increasing test coverage for key logic, and integrating third-party services.",
  },
  {
    userId: 183708,
    name: "Hlib Kononenko",
    position: "Senior Software Engineer",
    imgSrc: "https://cdn.metaculus.com/Hlib-Kononenko.webp",
    introduction:
      "With over a decade of experience, Hlib has a diverse background spanning from IoT to healthcare and AI medical research. Passionate about solving real-world problems, he specializes in infrastructure, backend, and frontend development. Throughout his career, Hlib has focused on building innovative solutions that bridge the gap between technology and practical applications.",
  },
  {
    userId: 228596,
    name: "Ben Wilson",
    position: "AI Research Automation Engineer",
    imgSrc: "https://cdn.metaculus.com/Ben-Wilson.webp",
    introduction:
      "Ben is an AI Research Automation Engineer proficient in Python, web scraping, prompt engineering, Next.js, and a wide range of other technologies. In 2024, he briefly entered the top 100 on Metaculus, and his bot placed 12th in Metaculus's Q3 AI Forecasting Benchmark Tournament. Ben also founded a non-profit with the goal of creating 'Logipedia: The Wikipedia for Debatable Topics.' He has a passion for philosophy and enjoys improvising on the piano.",
    socials: [
      {
        link: "https://www.linkedin.com/in/wilsonbenjamin1000/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 117502,
    name: "Ryan Beck",
    position: "Forecasting Program Coordinator",
    imgSrc: "https://cdn.metaculus.com/about/ryan_beck.webp",
    introduction:
      "Ryan is Metaculus’ Forecasting Program Coordinator. He received a Master’s degree in Civil Engineering from Iowa State University, and was previously a bridge engineer for six years. He is an avid forecaster and a pro-forecaster at INFER. Ryan is also the author of a science fiction novel, <cite>SEER</cite>.",
  },
  {
    userId: 115975,
    name: "John Bash",
    position: "Forecasting Analyst",
    imgSrc: "https://cdn.metaculus.com/john-bash.webp",
    introduction:
      "John specializes in question writing, resolution, and moderation. He qualified as a superforecaster at Good Judgment Project and has predicted for Swift Centre, the Rand Forecasting Initiative, and Metaculus. Previously, he ran an e-publishing business and earned an MBA from the University of Georgia.",
  },
  {
    userId: 105951,
    name: "Sylvain Chevalier",
    position: "Director of Product",
    imgSrc: "https://cdn.metaculus.com/about/sylvain_chevalier.webp",
    introduction:
      "Sylvain is the Director of Product at Metaculus, with a background in software engineering and expertise in forecasting methodologies. He holds two master's degrees in physical and organic chemistry from top universities in Lyon. Sylvain is dedicated to empowering forecasters and improving decision-making through advanced tools and techniques.",
  },
  {
    userId: 111848,
    name: "Juan Cambeiro",
    position:
      "Senior Advisor for Biosecurity, U.S. Center for AI Standards and Innovation",
    imgSrc: "https://cdn.metaculus.com/about/juan_cambeiro.webp",
    introduction:
      "Juan is a Presidential Management Fellow in the Division of Biosafety, Biosecurity, and Emerging Biotechnology Policy at the National Institutes of Health. Juan received his Masters of Public Health in epidemiology/biostatistics from Columbia University. He is currently a PhD student in Health Security at Johns Hopkins University. Juan was the top-ranked forecaster in IARPA’s COVID-19 FOCUS Forecasting Tournament and is a Superforecaster with Good Judgment Open, where he was ranked #1 on COVID-19 forecast questions.",
  },
  {
    userId: 109639,
    name: "Nikos Bosse",
    position: "Research Coordinator",
    imgSrc: "https://cdn.metaculus.com/about/nikos_bosse.webp",
    introduction:
      "Nikos advances Metaculus’ research agenda, focusing on forecast aggregation and forecast evaluation. He received his master’s in applied statistics from the University of Göttingen and is working toward his PhD in infectious disease forecasting and forecast evaluation at the London School of Hygiene and Tropical Medicine.",
  },
  {
    userId: 127582,
    name: "Leonard Barrett",
    position: "Chief Operating Officer",
    imgSrc: "https://cdn.metaculus.com/Leonard.webp",
    introduction:
      "Leonard joined Metaculus as Chief of Staff in 2024, after several years as a highly ranked forecaster and question contributor on the platform. Now, as COO, he leads our operations and spearheads strategic initiatives. Before Metaculus, Leonard was a principal at a real estate development and asset management firm, overseeing complex office and mixed-use projects. His forecasting background includes experience as a Good Judgment Superforecaster and consistent top performance on various platforms and tournaments.",
    socials: [
      {
        link: "https://www.linkedin.com/in/leonard-barrett/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    name: "Molly Hickman",
    position: "Technical Product Manager",
    imgSrc: "https://cdn.metaculus.com/molly.webp",
    introduction:
      "Molly is a computer scientist specializing in crowdsourced intelligence. She previously worked at the MITRE Corporation, focusing on testing and evaluation for forecasting projects. At the Forecasting Research Institute, Molly concentrated on developing metrics and methods to identify the most impactful questions. She forecasts as part of the Samotsvety team and as a Pro at INFER.",
  },
  {
    name: "Felipe Oliveira",
    position: "Operations Lead",
    imgSrc: "https://cdn.metaculus.com/Felipe.webp",
    introduction:
      "Felipe Oliveira is the Operations Lead at Metaculus, where he oversees finance, HR, and internal systems. With over 15 years of experience in financial planning, operations, and accounting, he specializes in building efficient, scalable structures that support mission-driven organizations. Felipe has worked across the nonprofit and private sectors with a strong focus on accountability, aligning operations with strategy, and enabling responsible expansion.",
  },
  {
    userId: 137979,
    name: "Elis Popescu",
    position: "Head of Engineering",
    imgSrc: "https://cdn.metaculus.com/about/elis_popescu.webp",
    introduction:
      "Elis previously cofounded Tekudo, a SaaS tool for VC firms to manage ESG data. Prior to that, he was VP and head of software at Airtame, where he managed five teams developing multiple products with various technologies. With over a decade of experience, he has expertise in cross-platform development, live video streaming, embedded systems, and more.",
  },
  {
    userId: 135613,
    name: "Luke Sabor",
    position: "Software Engineer",
    imgSrc: "https://cdn.metaculus.com/about/luke_sabor.webp",
    introduction:
      "Passionate about AI safety and fueled by a love for math and logic games, Luke previously worked as a personal assistant to Max Tegmark and conducted research at UPenn's superforecasting team under Philip Tetlock. His diverse experience, spanning AI safety research to collaborating with quantum physicists, led him to work on development for Metaculus. Beyond technology, Luke enjoys exploring nature through climbing, running, biking, and birdwatching.",
  },
  {
    name: "Cemre Inanc",
    position: "Software Developer",
    imgSrc: "https://cdn.metaculus.com/about/cemre_inanc.webp",
    introduction:
      "Cemre is a Software Developer with a degree in Visual Communication Design and over a decade of experience building interactive platforms, virtual event systems, and digital archives. Through his studio Kraftend, he has delivered projects for brands like Nike, Beko, Samsung, Netflix, and Red Bull. At Metaculus, he focuses on platform development and delivering seamless user experiences.",
    socials: [
      {
        link: "https://www.linkedin.com/in/cemreinanc/",
        platform: "LinkedIn",
      },
    ],
  },

  {
    userId: 100912,
    name: "Peter Wildeford",
    imgSrc: "https://cdn.metaculus.com/peter-wildeford.webp",
    introduction:
      "Peter Wildeford helps run the Institute for AI Policy and Strategy, a think tank that convenes experts across the US and allied nations to deliver concrete, technically sound policy research to ensure geopolitical stability and mitigate emerging risks while protecting the space for innovation to thrive. Prior to work at IAPS, Peter was a co-founder of a multi-issue think-and-do tank, as well as a data scientist in industry. Throughout his career, Peter has been an avid forecaster, ranking highly in forecasting tournaments, and specializing in geopolitical and electoral forecasting.",
    socials: [
      {
        link: "https://www.linkedin.com/in/peterhurford8/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 8,
    name: "Anthony Aguirre",
    position: "Founder & Chairman of the Board",
    imgSrc: "https://cdn.metaculus.com/about/anthony_aguirre.webp",
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
    name: "Joshua Elliott",
    imgSrc: "https://cdn.metaculus.com/joshua-elliott-image.webp",
    introduction:
      'Joshua Elliott is the Chief Scientist of Renaissance Philanthropy, with over 15 years of experience across academia, government, and philanthropy. He has led initiatives on solar radiation management, CO₂ removal, and climate resilience at Quadrature Climate Foundation, launched the Brains non-profit science accelerator, and incubated innovative R&D programs like ARC and Project InnerSpace.\n\nPreviously, Joshua managed nearly $600M in federal R&D funding at DARPA, focusing on "AI for Science" and programs spanning computational science, synthetic biology, and epidemiology. Earlier, he spent a decade in academia working on climate economics, energy modeling, and climate impacts, co-founding key initiatives like the Center for Robust Decision-making in Climate and Energy Policy. He holds a PhD in theoretical high-energy physics from McGill University.',
    socials: [
      {
        link: "https://www.linkedin.com/in/joshuawrightelliott/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    userId: 10,
    name: "Greg Laughlin",
    position: "Founder & R&D Fellow",
    imgSrc: "https://cdn.metaculus.com/about/greg_laughlin.webp",
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
    imgSrc: "https://cdn.metaculus.com/about/carroll_wainwright.webp",
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
    imgSrc: "https://cdn.metaculus.com/about/david_levine.webp",
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
    position: "Co-founder & CEO, Mechanize",
    imgSrc: "https://cdn.metaculus.com/about/tamay_besiroglu.webp",
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
    position: "Co-founder & CEO, Pyrra Technologies",
    imgSrc: "https://cdn.metaculus.com/about/welton_chang.webp",
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
    imgSrc: "https://cdn.metaculus.com/about/burak_nehbit.webp",
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
    imgSrc: "https://cdn.metaculus.com/about/steven_schkolne.webp",
    introduction:
      "Steven Schkolne is a computer scientist, artist, and entrepreneur who has worked with companies such as BMW, Microsoft, and Disney. He laid the foundations for popular VR art programs like Tilt Brush and Quill while at Caltech, where he also earned his MS and PhD in Computer Science. Steven has also founded and grown companies, including Vain Media and 3dSunshine. Steven's design leadership shaped past iterations of Metaculus, and he currently advises on UI/UX across the platform.",
    socials: [
      {
        link: "https://www.linkedin.com/in/schkolne/",
        platform: "LinkedIn",
      },
    ],
  },
  {
    name: "Seth Killian",
    position: "Game Designer\nCo-Founder, Evo Championship Series",
    imgSrc: "https://cdn.metaculus.com/seth01.JPG",
    introduction:
      "Seth Killian was a graduate fellow at the UIUC Center for Advanced Study teaching philosophy when he was recruited by Capcom into game development. As a designer and founder, he helped revive the Street Fighter series with Street Fighter IV, co-founded the first team acquired by Riot Games, served as lead designer on Fortnite, and as Head of Game Design for Netflix. As a player and organizer, he played on the first US National Street Fighter team, hosted the first fighting game broadcast on ESPN, and co-founded the Evo Championship Series, which has grown to become the largest live gaming competition in the world.",
  },
];

const groups: Groups = {
  team: [
    "Deger Turan",
    "Alex Costea",
    "Atakan Seçkin",
    "Molly Hickman",
    "Leonard Barrett",
    "Christian Williams",
    "Ryan Beck",
    "Sylvain Chevalier",
    "Nikos Bosse",
    "Elis Popescu",
    "Hlib Kononenko",
    "Ben Wilson",
    "Nikita Oleinykof",
    "Luke Sabor",
    "Nikitas Angeletos Chrysaitis",
    "Abhimanyu Pallavi Sudhir",
    "John Bash",
    "Felipe Oliveira",
    "Cemre Inanc",
  ],
  board: [
    "Anthony Aguirre",
    "Carroll “Max” Wainwright",
    "David Levine",
    "Joshua Elliott",
    "Peter Wildeford",
  ],
  advisors: [
    "Juan Cambeiro",
    "Tamay Besiroglu",
    "Welton Chang",
    "Burak Nehbit",
    "Jordan Rubin",
    "Steven Schkolne",
    "Seth Killian",
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
                  <div className="relative size-24 overflow-hidden rounded-full bg-[url('(main)/about/img/person.webp')] bg-cover md:size-44">
                    {imgSrc && (
                      <Image
                        alt={name}
                        src={imgSrc}
                        fill
                        className="object-cover"
                        sizes="(min-width: 768px) 176px, 96px"
                        unoptimized
                      />
                    )}
                  </div>
                  <h3 className="mb-1 mt-6 text-xl font-bold leading-tight text-blue-900 dark:text-blue-100">
                    {name}
                  </h3>
                  {position && (
                    <p className="my-1 whitespace-pre-line text-base leading-tight text-blue-700 dark:text-blue-500">
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
