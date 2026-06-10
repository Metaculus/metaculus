export type CuratedQuote = {
  /** Exact excerpt to display, verbatim (not derived from the live comment). */
  body: string;
  author: string;
  /** Original comment ID on the job's own post — used to link back. */
  commentId: number;
};

/**
 * Real names for the pros who gave permission to use them (source-doc legend);
 * everyone else stays username-only.
 */
export const REAL_NAMES: Record<string, string> = {
  draaglom: "Patric Molgaard",
  exmateriae: "Yann Riviere",
  lubossaloky: "Ľuboš Saloky",
  Adonis: "Adonis da Silva",
  Haiku: "Nathan Metzger",
  Jleibowich: "Jared Leibowich",
};

// Hand-curated pro-forecaster excerpts, keyed by job slug. Shown verbatim in the
// Curated Insights section (not derived from the live comment body); commentId
// links back to the original comment.
export const CURATED_QUOTES: Record<string, CuratedQuote[]> = {
  "laborers-and-movers": [
    {
      body: "Humanoid robots remain experimental rather than production-ready assets due to high energy use, limited speed, high costs and immature perception and dexterity. However, potential for automation is almost unlimited, once the technology is mature enough.",
      author: "lubossaloky",
      commentId: 799619,
    },
    {
      body: "Even beyond the pure capabilities side, there is also a production aspect to this question. If you want to make 7M jobs disappear, you need a lot of robots.",
      author: "exmateriae",
      commentId: 799482,
    },
    {
      body: "This category is a primary target for automation for the humanoid robotics companies, and I expect real-world impacts in the near term. It appears to be nearly inevitable at this point that multiple robotics companies will be selling competent general-purpose warehouse workers before 2030.",
      author: "Haiku",
      commentId: 792968,
    },
  ],
  "construction-workers": [
    {
      body: "If AI significantly boosts the economy, some of that economy is going to occur in physical spaces, which will require physical infrastructure. In the long term, by 2035, there is a good chance that AI-powered robotics will be able to do all of these jobs.",
      author: "Haiku",
      commentId: 792763,
    },
    {
      body: "Chatbots will impact the demand to some level: people will be able to fix things that they needed electricians or plumbers for. Maybe a few people will actually want to build things themselves with LLM support. That will remain mostly on the margin I think though. What actually matters is the impact of robotics.",
      author: "exmateriae",
      commentId: 776050,
    },
  ],
  "janitors-and-cleaners": [
    {
      body: "The robotics isn't quite there yet, and once it gets there, diffusion will be slow in real terms (even if it is fast relative to other automation technologies).",
      author: "Haiku",
      commentId: 792762,
    },
    {
      body: "Large-scale corporate downsizing and relocations are already happening, this is not a distant scenario. Today's office struggles are structural. Remote and hybrid work have decoupled office demand from GDP growth. And if residential real estate markets face decline due to white-collar job losses, residential cleaning demand could also decline, as homeowners cut discretionary services during recessions.",
      author: "lubossaloky",
      commentId: 799110,
    },
    {
      body: "Overall, I expect a small percentage decrease in this job classification by 2030, and a larger decrease by 2035 as humanoid robots become cheaper and have improved capabilities.",
      author: "Jleibowich",
      commentId: 773358,
    },
  ],
  "restaurant-servers": [
    {
      body: "Good technology to automate food service - in the form of self-serve / fast-casual restaurants - already exists and has done so for some time, and yet human food service roles have grown. I'd expect this trend to continue by default. The downside risk I see is primarily from contagion from other economic impacts, and model uncertainty as we look further ahead.",
      author: "draaglom",
      commentId: 821674,
    },
    {
      body: "Jobs in the food service industry, such as waiters, waitresses, and bartenders, can not be easily automated and even augmentation is difficult. They require physical presence and real-time interaction in crowded, unpredictable environments. The real threat isn't AI replacing servers in one-to-one interactions, but rather structural obsolescence.",
      author: "lubossaloky",
      commentId: 799120,
    },
  ],
  "law-enforcement": [
    {
      body: "AI is transforming law enforcement operations, but as a force multiplier rather than a workforce reducer. AI will augment investigative work, administrative tasks and surveillance. Functions like human judgment, community engagement, physical intervention and accountability, are unlikely to be automated within this timeframe.",
      author: "lubossaloky",
      commentId: 798844,
    },
    {
      body: "There is no way our society would be okay with automated police officers. Furthermore, I expect the risk of societal instability to increase over the next decade as AI becomes a major destabilizing force, both as a result of huge job losses across certain sectors as well as the general chaos that ensues from a society radically transformed by AI.",
      author: "Jleibowich",
      commentId: 771922,
    },
    {
      body: "This seems like a category where AI mostly acts as an augmenter rather than a direct substitute through 2030. Better report writing, search, scheduling, evidence review, and surveillance could make each worker more productive, but the state still needs a person physically present to exercise authority. By 2035, I can imagine more pressure from computer vision, automated monitoring, and perhaps some autonomous systems, but I still think the physical/legal-human component is unusually strong here.",
      author: "exmateriae",
      commentId: 772605,
    },
  ],
  physicians: [
    {
      body: "Demand is growing faster than supply. Overall physician headcount will grow modestly. AI will not significantly change these numbers in either direction.",
      author: "lubossaloky",
      commentId: 796544,
    },
    {
      body: "Humanity's capacity for healthcare demand is nigh on infinite. Other than in a post-scarcity utopia, I have a hard time imagining physicians themselves being replaced. I expect the need for legal accountability to play a role here, too, as well as the high stakes and mere physical complexity of interacting with the human body in various contexts.",
      author: "Haiku",
      commentId: 785300,
    },
    {
      body: "The most important factor that makes me think that not much will change here is that, even though it's a white-collar job likely to be heavily influenced by AI, I think people will still highly value human interaction and accountability.",
      author: "Adonis",
      commentId: 779170,
    },
  ],
  "registered-nurses": [
    {
      body: "Some routine (digital) administrative tasks can probably be handled by AI tools pretty well in upcoming years. This may put a slight amount of downward pressure on the growing demand for nurses. However, there is considerably more pressure in the opposite direction. Most of the pressure comes from the rapidly aging general US population.",
      author: "Zaldath",
      commentId: 805475,
    },
    {
      body: "I'm still skeptical even over the course of a decade that AI will materially negatively affect nursing roles.",
      author: "Haiku",
      commentId: 799627,
    },
    {
      body: "This looks like a category where AI should raise productivity materially without making the occupation especially vulnerable in share terms by 2030. By 2035, I can imagine a lot more leverage per nurse and a lot of auxiliary work being automated, but I still think demographic demand and the hands-on nature of care make this category much more resilient than most.",
      author: "exmateriae",
      commentId: 799626,
    },
  ],
  "k12-teachers": [
    {
      body: "Teacher employment will decline primarily due to demographic changes, but automation risk is minimal.",
      author: "lubossaloky",
      commentId: 797855,
    },
    {
      body: "The job of a teacher isn't to deliver information; it is to facilitate an environment that enables learning. The existence of the internet didn't make everyone a physicist or similar, even among those who are intelligent enough to be physicists. Directed online education has worked, sometimes in some domains, but is generally considered a sub-par experience. Good teachers relate to their students through their shared humanity. An AI agent can say the same words and fail to make the same connection.",
      author: "Haiku",
      commentId: 783466,
    },
    {
      body: "Sure, a large fraction of the work is digital or semi-digital (lesson planning, grading, communication, administrative work, etc) but the core is still classroom management and student supervision.",
      author: "exmateriae",
      commentId: 797966,
    },
  ],
  "lawyers-and-law-clerks": [
    {
      body: "There is a ton of overlap between politics and lawyers, whether because they're strongly represented, because they actually understand the law or because of lobbying. I think there is a strong chance that one of the first professions to be completely protected from AI might be the lawyers, even in some cases if it means making things worse for everyone.",
      author: "exmateriae",
      commentId: 773363,
    },
    {
      body: "In the perhaps minority of worlds in which lawyers are unable to safeguard their profession from automation, I suspect there will be a significant amount of replacement. I also see this profession as a rare one in which the old adage of \"you won't be replaced by AI; you'll be replaced by someone using AI\" actually rings true to me. I can't see this profession disappearing entirely, even in the very long term, because of the strong need for human accountability.",
      author: "Haiku",
      commentId: 777876,
    },
  ],
  "services-sales-representatives": [
    {
      body: "Salespeople aren't facing extinction, but this job occupation is undergoing a significant transformation.",
      author: "lubossaloky",
      commentId: 801586,
    },
    {
      body: "Even if many of the professions, like real estate agents, insurance salespeople, and securities sales agents, require licenses, AI automation could have a significant impact on productivity and demand. Much of this work is done digitally and could be effectively automated by AI, but those roles that deal with businesses or items with high price tags should be less affected.",
      author: "Adonis",
      commentId: 798904,
    },
    {
      body: "Some will say the sales function is still tied to persuasion, trust, relationship maintenance but I think these people are underestimating the persuasiveness of current LLMs, which I would guess are already much better than some sales people. And they're only gonna get better.",
      author: "exmateriae",
      commentId: 778131,
    },
  ],
  designers: [
    {
      body: "Graphic / Web designers face the most AI automation risk, other fields remain relatively safe, and second-order effects (wealth, luxury, cross-sector flows) could offset employment declines. The key variable is whether AI wealth stays concentrated or disperses broadly.",
      author: "lubossaloky",
      commentId: 801539,
    },
    {
      body: "The more digital design segments look highly exposed to generative AI and could see significant consolidation or productivity gains that reduce headcount needs.",
      author: "exmateriae",
      commentId: 774787,
    },
    {
      body: "[Some types of designers] may be relatively safe. AI will likely be able to do [interior design], but part of what you're paying for is good taste. Humans may want trustworthy humans in the loop when it comes to making choices that would be particularly expensive to redo. [For fashion designers], high effort is high status. Brands may compete via the human origin of their designs. [For floral designers], someone needs to actually arrange the flowers, and I don't think there will be much appetite for automating this work.",
      author: "Haiku",
      commentId: 774105,
    },
  ],
  engineers: [
    {
      body: "Long-term demand for engineers building new products and infrastructure could offset AI impact. Engineering is among the most promising career paths for young people, alongside healthcare.",
      author: "lubossaloky",
      commentId: 799629,
    },
    {
      body: "AI could compress the pyramid of workers in large companies, reducing the need for juniors, who do calculation checks, drafting, CAD modeling, running simulations, writing sections of reports, and compiling data. However, senior engineers will probably still be required due to the need for human accountability and site-specific knowledge.",
      author: "Adonis",
      commentId: 798889,
    },
    {
      body: "I expect about 1/3 to 1/2 of these jobs to be safe even in fairly high-automation futures. In fact, in high-automation futures, I expect engineering (bridging the gap between plan and practice) to be a bottleneck to economic acceleration. That could result in a net increase for many roles.",
      author: "Haiku",
      commentId: 773926,
    },
  ],
  "software-developers": [
    {
      body: "With software development as #1 on the chopping block and having virtually no chance of legal protections, I expect this occupation to be a major canary in the coalmine for possible mass job loss in other sectors.",
      author: "Haiku",
      commentId: 772388,
    },
    {
      body: "I think it's plausible that AI will be awesome at software development in two years, but that doesn't necessarily mean that it will completely eat software development roles. While software development is among the jobs with the least chance of legal protection, I wouldn't completely rule it out, as we're talking about unprecedented circumstances.",
      author: "Adonis",
      commentId: 779168,
    },
    {
      body: "High-tech job losses will trigger a chain of economic effects outside of the tech industry, with the impact much deeper than their direct effect.",
      author: "lubossaloky",
      commentId: 797821,
    },
  ],
  "financial-specialists": [
    {
      body: "Automation risk is severe and concentrated in entry-level and routine roles. While the profession won't disappear, job losses are inevitable. The real danger is a hollowed middle: fewer junior positions to build the next generation of senior professionals.",
      author: "lubossaloky",
      commentId: 801593,
    },
    {
      body: "Knowledge work is especially exposed to replacement by AI, and financial specialists are no exception.",
      author: "Haiku",
      commentId: 772256,
    },
    {
      body: "Trust does not currently exist at scale to leave the integral parts of (public) accounting to AI, since auditors are liable for their opinion and companies for the correctness of their financial statements.",
      author: "Hippopotamus_bartholomeus",
      commentId: 801865,
    },
  ],
  "general-managers": [
    {
      body: "I think between the already pretty high number of persons with this occupation and the high degree of automation possible, this job is particularly in danger. The relation it has to HR and management may help it limit/offset the blow by 2030 however as things move not too fast and they may remove people under them, using AIs in their stead while still keeping their own jobs.",
      author: "exmateriae",
      commentId: 768208,
    },
    {
      body: "If there are human employees, there will be human managers. If there are not human employees, there will still be human managers. The exceptions I can imagine are if we get full automation of labor, or if the demand side of the economy is significantly reshaped so that fewer of those businesses are needed.",
      author: "Haiku",
      commentId: 768524,
    },
    {
      body: "I think the agent economy might make many managers lose their jobs, but I'm hesitant to forecast that there will be a sharp percentage drop in employment. The reason is that I think many humans will transition to jobs where they manage a large amount of agents acting together. Even if agents do an incredible job at various tasks, I think a real human will have to give the final stamp of approval for many things, especially in high-liability situations.",
      author: "Jleibowich",
      commentId: 771087,
    },
  ],
};
