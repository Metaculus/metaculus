import Image from "next/image";
import Link from "next/link";

import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus for Journalists",
  description:
    "Learn about Metaculus community etiquette, moderation rules, sanctions, and the role of Community Moderators.",
};

export default function PressPage() {
  return (
    <PageWrapper>
      <div className="prose [&amp;_a:hover]:text-blue-800 [&amp;_a:hover]:underline [&amp;_a:hover]:dark:text-blue-200 [&amp;_a]:text-blue-700 [&amp;_a]:dark:text-blue-400 [&amp;_code]:rounded [&amp;_code]:border [&amp;_code]:border-blue-400 [&amp;_code]:bg-white [&amp;_code]:p-0.5 [&amp;_code]:dark:border-blue-700 [&amp;_code]:dark:bg-blue-900 [&amp;_code]:md:bg-blue-200 [&amp;_code]:dark:md:bg-blue-800 [&amp;_h1]:mb-4 [&amp;_hr]:border-gray-300 [&amp;_hr]:dark:border-blue-700 [&amp;_li]:text-sm [&amp;_li]:md:text-base [&amp;_p]:text-sm [&amp;_p]:text-gray-700 [&amp;_p]:dark:text-gray-400 [&amp;_p]:md:text-base [&amp;_pre]:overflow-x-auto [&amp;_pre]:rounded [&amp;_pre]:border [&amp;_pre]:border-blue-400 [&amp;_pre]:bg-white [&amp;_pre]:p-3 [&amp;_pre]:dark:border-blue-700 [&amp;_pre]:dark:bg-blue-900 [&amp;_pre]:md:bg-blue-200 [&amp;_pre]:dark:md:bg-blue-800 container mx-auto my-0 max-w-4xl rounded bg-transparent p-3.5 pt-2 dark:bg-blue-900 dark:bg-transparent md:my-10 md:bg-white md:px-6 md:py-4 dark:md:bg-blue-900">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="pb-2">Metaculo para os jornalistas</h1>
            <div className="flex flex-col gap-2">
              <div className="w-full" data-headlessui-state="open" data-open="">
                <button
                  className="group flex w-full items-center gap-3 rounded rounded-b-none bg-blue-500 p-3 text-left text-lg transition-all dark:bg-blue-600"
                  id="headlessui-disclosure-button-:R2ccvesul5j6:"
                  type="button"
                  aria-expanded="true"
                  data-headlessui-state="open"
                  data-open=""
                  aria-controls="headlessui-disclosure-panel-:r7:"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="chevron-down"
                    className="svg-inline--fa fa-chevron-down fa-sm rotate-180 text-blue-800 transition-transform dark:text-blue-400"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                  O que está prevendo?
                </button>
                <div
                  className="max-h-[2000px] overflow-hidden rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 opacity-100 dark:border-blue-600 md:px-5"
                  id="headlessui-disclosure-panel-:r7:"
                  data-headlessui-state="open"
                  data-open=""
                >
                  <p>
                    A previsão é a prática de colocar probabilidades explícitas,
                    datas e números em eventos futuros – calcular as
                    probabilidades através de modelos e julgamento humano.
                  </p>
                  <p>
                    Embora tais estimativas sejam subjetivas, um corpo
                    substancial de pesquisa científica demonstra dois pontos:
                    que as pessoas que preveem podem melhorar, com algumas se
                    tornando habilmente calibradas; e que agregar muitas
                    opiniões diversas produz previsões mais precisas do que até
                    mesmo os melhores indivíduos que se preveem sozinhos. As
                    previsões resultantes nos dão uma noção mais clara de como
                    será o amanhã, permitindo-nos tomar melhores decisões hoje,
                    assim como um bom meteorologista pode nos ajudar a decidir
                    se devemos carregar um guarda-chuva.
                  </p>
                  <p>
                    Claro, assuntos como a geopolítica não são como a
                    meteorologia. No entanto, a validade científica da previsão
                    humana é verdadeira mesmo quando se trata de assuntos com
                    alto grau de incerteza, como a guerra entre a Rússia e a
                    Ucrânia. De fato,{" "}
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://pubmed.ncbi.nlm.nih.gov/24659192/"
                    >
                      pesquisas
                    </a>
                    dos psicólogos da Universidade da Pensilvânia, Philip
                    Tetlock e Barbara Mellers, descobriram que as previsões
                    geopolíticas agregadas dos principais analistas eram{" "}
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://www.npr.org/sections/parallels/2014/04/02/297839429/-so-you-think-youre-smarter-than-a-cia-agent"
                    >
                      mais precisas
                    </a>
                    do que as dos analistas da CIA com acesso a informações
                    classificadas.
                  </p>
                  <p>
                    Como as previsões são expressas probabilisticamente,
                    raramente podemos dizer que uma previsão específica estava
                    “certa” ou “errada”. Em vez disso, pontuamos as previsões
                    matematicamente comparando as previsões com os resultados em
                    um grande corpo de perguntas. Isso nos permite determinar o
                    quão “bem calibrado” qualquer meteorologista é – ou seja,
                    fazer coisas que eles acreditam que são 70% provavelmente
                    realmente acontecem 70% do tempo – bem como rastrear o
                    registro de toda a comunidade do Metaculus sobre milhares de
                    perguntas.
                  </p>
                  <p>
                    As previsões do Metaculus são bem calibradas. Proporcionarem
                    maior visibilidade do futuro.
                  </p>
                </div>
              </div>
              <div className="w-full" data-headlessui-state="open" data-open="">
                <button
                  className="group flex w-full items-center gap-3 rounded rounded-b-none bg-blue-500 p-3 text-left text-lg transition-all dark:bg-blue-600"
                  id="headlessui-disclosure-button-:R2kcvesul5j6:"
                  type="button"
                  aria-expanded="true"
                  data-headlessui-state="open"
                  data-open=""
                  aria-controls="headlessui-disclosure-panel-:r6:"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="chevron-down"
                    className="svg-inline--fa fa-chevron-down fa-sm rotate-180 text-blue-800 transition-transform dark:text-blue-400"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                  O que é o Metaculus?
                </button>
                <div
                  className="max-h-[2000px] overflow-hidden rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 opacity-100 dark:border-blue-600 md:px-5"
                  id="headlessui-disclosure-panel-:r6:"
                  data-headlessui-state="open"
                  data-open=""
                >
                  <p>
                    A Metaculus é uma plataforma de previsão on-line e um
                    mecanismo de agregação que trabalha para melhorar o
                    raciocínio humano e a coordenação em tópicos de importância
                    global. Como uma Corporação de Benefícios Públicos, a
                    Metaculus fornece apoio à decisão com base nessas previsões
                    para uma variedade de instituições (
                    <Link href="/about">saiba mais</Link>
                    ).
                  </p>
                  <p>
                    O Metaculus apresenta questões sobre uma ampla gama de
                    tópicos, com um foco particular em{" "}
                    <Link href="/questions/?topic=ai">
                      inteligência artificial
                    </Link>
                    ,{" "}
                    <Link href="/questions/?categories=health-pandemics">
                      biossegurança
                    </Link>
                    ,{" "}
                    <Link href="/questions/?categories=environment-climate">
                      mudanças climáticas
                    </Link>
                    e{" "}
                    <Link href="/questions/?categories=nuclear">
                      risco nuclear
                    </Link>
                    .
                  </p>
                </div>
              </div>
              <div className="w-full" data-headlessui-state="open" data-open="">
                <button
                  className="group flex w-full items-center gap-3 rounded rounded-b-none bg-blue-500 p-3 text-left text-lg transition-all dark:bg-blue-600"
                  id="headlessui-disclosure-button-:R2scvesul5j6:"
                  type="button"
                  aria-expanded="true"
                  data-headlessui-state="open"
                  data-open=""
                  aria-controls="headlessui-disclosure-panel-:r5:"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="chevron-down"
                    className="svg-inline--fa fa-chevron-down fa-sm rotate-180 text-blue-800 transition-transform dark:text-blue-400"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                  Então, o Metaculus é um “mercado de previsão”?
                </button>
                <div
                  className="max-h-[2000px] overflow-hidden rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 opacity-100 dark:border-blue-600 md:px-5"
                  id="headlessui-disclosure-panel-:r5:"
                  data-headlessui-state="open"
                  data-open=""
                >
                  <p>
                    Não, o Metaculus é uma plataforma de previsão e um motor de
                    agregação. Como os mercados de previsão, coletamos as
                    previsões das pessoas e as recompensamos por precisão. Mas
                    nos mercados de previsão, os participantes fazem apostas uns
                    contra os outros por recompensas financeiras, só podem
                    ganhar na medida em que alguém perde. Os meteorologistas do
                    Metaculus são incentivados apenas a fazer as previsões mais
                    precisas, e muitas vezes colaboram para fazê-lo.
                  </p>
                  <p>
                    Os mercados de previsão produzem previsões através de onde o
                    mercado de apostas se instala. O Metaculus agrega
                    explicitamente as previsões de todos usando algoritmos que
                    refinamos ao longo do tempo. Produzimos uma mediana
                    ponderada pelo tempo, a &quot;Previsão da Comunidade&quot;,
                    bem como a mais sofisticada &quot;Previsão Metaculus&quot;.
                  </p>
                  <p>
                    Os apostadores de mercado de previsão podem produzir
                    previsões precisas porque têm “pele no jogo”. Mas{" "}
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://pubsonline.informs.org/doi/abs/10.1287/mnsc.2015.2374"
                    >
                      a pesquisa
                    </a>
                    mostra que as plataformas de previsão como o Metaculus
                    muitas vezes superam os mercados{" "}
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://www.washingtonpost.com/lifestyle/2023/01/24/predictit-gambling-on-politics/"
                    >
                      de
                    </a>
                    previsão, evitando muitas das desvantagens dos incentivos de
                    mercado que levam os reguladores a{" "}
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href="https://www.washingtonpost.com/lifestyle/2023/01/24/predictit-gambling-on-politics/"
                    >
                      restringir sua atividade.
                    </a>
                    E, criticamente, a pesquisa, os métodos e o raciocínio que
                    os meteorologistas do Metaculus produzem são eles próprios
                    valiosos, como visto tanto em comentários de perguntas
                    quanto no{" "}
                    <Link href="/project/journal">Metaculus Journal</Link>.
                  </p>
                </div>
              </div>
              <div className="w-full" data-headlessui-state="open" data-open="">
                <button
                  className="group flex w-full items-center gap-3 rounded rounded-b-none bg-blue-500 p-3 text-left text-lg transition-all dark:bg-blue-600"
                  id="headlessui-disclosure-button-:R34cvesul5j6:"
                  type="button"
                  aria-expanded="true"
                  data-headlessui-state="open"
                  data-open=""
                  aria-controls="headlessui-disclosure-panel-:r4:"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="chevron-down"
                    className="svg-inline--fa fa-chevron-down fa-sm rotate-180 text-blue-800 transition-transform dark:text-blue-400"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                  Como as previsões podem ajudar com seus relatórios?
                </button>
                <div
                  className="max-h-[2000px] overflow-hidden rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 opacity-100 dark:border-blue-600 md:px-5"
                  id="headlessui-disclosure-panel-:r4:"
                  data-headlessui-state="open"
                  data-open=""
                >
                  <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start lg:gap-8">
                    <div>
                      <p>
                        <b>1. Análise de especialistas complementares.</b>
                      </p>
                      <p>
                        As notícias muitas vezes contam com a análise de
                        especialistas para colocar os desenvolvimentos em
                        contexto e para antecipar o curso futuro dos eventos.
                        Infelizmente, os especialistas frequentemente oferecem
                        previsões imprecisamente redigidas – por exemplo, “Se os
                        Estados Unidos fornecerem F-16s, há uma possibilidade
                        real de que a Ucrânia recupere o controle de seu espaço
                        aéreo” – e{" "}
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://hbr.org/2018/07/if-you-say-something-is-likely-how-likely-do-people-think-it-is"
                        >
                          pesquisas
                        </a>
                        mostram que as pessoas interpretam “possibilidade real”
                        de significar qualquer coisa entre 20% e 80%,
                        confundindo jornalistas e seu público. As previsões
                        provbelistas eliminam esse problema.
                      </p>
                      <p>
                        Além disso, na medida em que os especialistas colocam
                        probabilidades precisas em eventos futuros, seu
                        histórico é ruim. Uma das{" "}
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://press.princeton.edu/books/hardcover/9780691178288/expert-political-judgment"
                        >
                          primeiras descobertas
                        </a>
                        de Tetlock foi que os especialistas políticos são
                        altamente confiantes em suas previsões. De fato, embora
                        haja uma variação significativa, suas previsões
                        agregadas têm um desempenho pouco melhor do que o acaso.
                        Por outro lado, as previsões do Metaculus têm um
                        desempenho significativamente melhor do que o acaso.
                      </p>
                      <p>
                        <b>
                          2. Sirva como um controle sobre a sabedoria
                          convencional.
                        </b>
                      </p>
                      <p>
                        As previsões podem sugerir que a sabedoria convencional
                        pode estar errada e que as crenças fortemente mantidas
                        valem a pena questionar fortemente. Por exemplo, a
                        sabedoria convencional dentro dos militares americanos é
                        que a China invadirá Taiwan nos próximos anos. Um
                        general de quatro estrelas chegou ao ponto de{" "}
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://www.airandspaceforces.com/read-full-memo-from-amc-gen-mike-minihan/"
                        >
                          sugerir que
                        </a>
                        havia uma chance de 100% de a RPC tentar tomar a ilha em
                        2025, levando à guerra com os Estados Unidos. Por outro
                        lado, a previsão do Metaculus para o mesmo período de
                        tempo é de{" "}
                        <Link
                          href="/questions/7792/100-deaths-in-chinataiwan-conflict-by-2026/"
                          className="text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:dark:text-blue-200"
                        >
                          9%
                        </Link>
                        , até porque a guerra entre grandes potências é rara e
                        porque a guerra entre grandes potências nucleares é sem
                        precedentes. As previsões podem fornecer uma perspectiva
                        externa sobre questões altamente carregadas e servir
                        como um controle sobre o pensamento interno, adicionando
                        nuances às histórias.
                      </p>
                      <p>
                        <b>3. Faça sentido das grandes questões.</b>
                      </p>
                      <p>
                        As previsões do Metaculus podem ajudar os jornalistas e
                        seus leitores a entender os desenvolvimentos, onde há
                        uma tremenda incerteza, quebrando grandes questões
                        difíceis de responder em questões menores e mais
                        tratáveis.
                      </p>
                      <p>
                        O futuro da inteligência artificial se enquadra nessa
                        categoria, onde as perguntas nas quais as pessoas estão
                        mais interessadas (por exemplo, “A IA levará a um futuro
                        mais utópico ou mais distópico?”) é impossível responder
                        neste momento. Podemos, no entanto, fornecer previsões
                        sobre{" "}
                        <Link href="/questions/?topic=ai">
                          questões mais direcionadas
                        </Link>
                        sobre <Link href="/questions/?topic=ai">segurança</Link>
                        da IA, a regulamentação da IA, o progresso técnico em IA
                        e o negócio de IA – todos os quais podem nos ajudar a
                        entender melhor em qual direção estamos indo e com que
                        rapidez. As questões prevetivas servem como pistas sobre
                        quais desenvolvimentos devemos prestar especial atenção.
                        E uma{" "}
                        <Link href="/notebooks/16708/exploring-metaculuss-ai-track-record/">
                          análise completa
                        </Link>
                        do nosso histórico sobre questões relacionadas à IA
                        mostrou que as previsões do Metaculus oferecem insights
                        claros e úteis sobre o futuro do campo e seus impactos.
                      </p>
                      <p>
                        As previsões do Metaculus também podem identificar onde
                        houve mudanças significativas em nossas antecipações do
                        futuro. Por exemplo, a redução drástica na data prevista
                        de chegada da IA transformadora – desde o início da
                        década de 2040 até a distribuição atual, centrada em 29{" "}
                        <Link
                          href="/questions/5121/date-of-artificial-general-intelligence/"
                          className="text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:dark:text-blue-200"
                        >
                          de abril de 2033
                        </Link>
                        – foi usada pela{" "}
                        <a
                          target="_blank"
                          rel="noreferrer"
                          href="https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai"
                        >
                          The Economist
                        </a>
                        como um exemplo tangível de como as expectativas da
                        sociedade de IA estão mudando rapidamente.
                      </p>
                    </div>
                    <a
                      className="block w-full max-w-[21rem] lg:min-w-[21rem]"
                      href="https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Image
                        className="h-auto w-full max-w-full"
                        src="https://cdn.metaculus.com/TheEconomistMetaculusAI.webp"
                        alt="The Economist graph based on data by Metaculus on the question of when will the first general-AI system be devised, tested and announced"
                        width={640}
                        height={708}
                        unoptimized
                      />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="pb-2">Como fazer as previsões de referência</h2>
            <div className="flex flex-col gap-2">
              <div className="w-full" data-headlessui-state="open" data-open="">
                <button
                  className="group flex w-full items-center gap-3 rounded rounded-b-none bg-blue-500 p-3 text-left text-lg transition-all dark:bg-blue-600"
                  id="headlessui-disclosure-button-:R1ckvesul5j6:"
                  type="button"
                  aria-expanded="true"
                  data-headlessui-state="open"
                  data-open=""
                  aria-controls="headlessui-disclosure-panel-:r3:"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="chevron-down"
                    className="svg-inline--fa fa-chevron-down fa-sm rotate-180 text-blue-800 transition-transform dark:text-blue-400"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                  Como incorporar um gráfico do Metaculus
                </button>
                <div
                  className="max-h-[2000px] overflow-hidden rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 opacity-100 dark:border-blue-600 md:px-5"
                  id="headlessui-disclosure-panel-:r3:"
                  data-headlessui-state="open"
                  data-open=""
                >
                  <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
                    No Substack, Twitter ou a maioria das outras redes sociais:
                  </h4>
                  <p>
                    Basta colar o link para o URL da pergunta Metaculus, como{" "}
                    <Link href="/questions/17096/us-tracks-training-runs-by-2026/">
                      www.metaculus.com/questions/17096/us-tracks-training-runs-by-2026
                    </Link>
                    , e a imagem de visualização com o gráfico aparecerá
                    automaticamente.
                  </p>
                  <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
                    Em outros sites:
                  </h4>
                  <p>
                    Na página de perguntas, clique em “incorporar” na parte
                    superior. Escolha o seu tema, largura e altura e copie o
                    iframe para o seu site.
                  </p>
                  <p>
                    Se você preferir ter uma imagem estática em vez de uma
                    incorporação com a qual os usuários possam interagir,
                    navegue até o URL da incorporação, por exemplo,{" "}
                    <Link href="/questions/embed/17096/">
                      www.metaculus.com/questions/embed/17096/
                    </Link>
                    . Em seguida, salve a imagem, geralmente através do botão
                    direito do mouse + &quot;salvar imagem como&quot;, e
                    carregue-a para o seu site preferido.
                  </p>
                  <iframe src="/questions/embed/13531/?theme=light"></iframe>
                </div>
              </div>
              <div className="w-full" data-headlessui-state="open" data-open="">
                <button
                  className="group flex w-full items-center gap-3 rounded rounded-b-none bg-blue-500 p-3 text-left text-lg transition-all dark:bg-blue-600"
                  id="headlessui-disclosure-button-:R1kkvesul5j6:"
                  type="button"
                  aria-expanded="true"
                  data-headlessui-state="open"
                  data-open=""
                  aria-controls="headlessui-disclosure-panel-:r2:"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="chevron-down"
                    className="svg-inline--fa fa-chevron-down fa-sm rotate-180 text-blue-800 transition-transform dark:text-blue-400"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                  Como baixar previsões brutas
                </button>
                <div
                  className="max-h-[2000px] overflow-hidden rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 opacity-100 dark:border-blue-600 md:px-5"
                  id="headlessui-disclosure-panel-:r2:"
                  data-headlessui-state="open"
                  data-open=""
                >
                  <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
                    Por meio da API:
                  </h4>
                  <p>
                    Veja a <Link href="/api">documentação completa da API</Link>
                    . Você também pode ver os dados brutos de perguntas em seu
                    navegador, como{" "}
                    <Link href="/api2/questions/17096/">
                      www.metaculus.com/api2/questions/17096/
                    </Link>
                    .
                  </p>
                  <h4 className="text-metac-blue-800 dark:text-metac-blue-800-dark text-xl font-bold">
                    Dados de Perguntas de download:
                  </h4>
                  <p>
                    Selecione o menu &quot;...&quot; na página de perguntas e
                    clique em &quot;Baixar CSV&quot;. (Apenas disponível em
                    questões com uma massa crítica de previsões.) Se você tiver
                    necessidades de dados mais expansivas, por favor, entre em
                    contato com{" "}
                    <a href="mailto:christian@metaculus.com">
                      christian.metaculus.com
                    </a>
                    e podemos construir um conjunto de dados personalizado para
                    você.
                  </p>
                </div>
              </div>
              <div className="w-full" data-headlessui-state="open" data-open="">
                <button
                  className="group flex w-full items-center gap-3 rounded rounded-b-none bg-blue-500 p-3 text-left text-lg transition-all dark:bg-blue-600"
                  id="headlessui-disclosure-button-:R1skvesul5j6:"
                  type="button"
                  aria-expanded="true"
                  data-headlessui-state="open"
                  data-open=""
                  aria-controls="headlessui-disclosure-panel-:r0:"
                >
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fas"
                    data-icon="chevron-down"
                    className="svg-inline--fa fa-chevron-down fa-sm rotate-180 text-blue-800 transition-transform dark:text-blue-400"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                  >
                    <path
                      fill="currentColor"
                      d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
                    ></path>
                  </svg>
                  Como encontrar a questão do Metaculus certo
                </button>
                <div
                  className="max-h-[2000px] overflow-hidden rounded-t-none border border-blue-500 px-3 py-0 text-gray-700 opacity-100 dark:border-blue-600 md:px-5"
                  id="headlessui-disclosure-panel-:r0:"
                  data-headlessui-state="open"
                  data-open=""
                >
                  <p>
                    Há milhares de questões do Metaculus. Você pode pesquisar{" "}
                    <Link href="/questions">no feed principal</Link>
                    por tópico ou palavra-chave. Nossas perguntas de IA podem
                    ser encontradas{" "}
                    <Link href="/questions/?topic=ai">aqui</Link>.
                  </p>
                  <p>
                    Se você não consegue encontrar o que está procurando, ou
                    quer sugerir uma pergunta para prever, chegar a{" "}
                    <a href="mailto:christian@metaculus.com">
                      christian.metaculus.com
                    </a>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h2 className="pb-4">
              Notícias que citaram{" "}
              <span className="text-blue-600 dark:text-blue-400">
                Metaculus (pe) de Meta
              </span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://www.economist.com/finance-and-economics/2023/05/23/what-would-humans-do-in-a-world-of-super-ai/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/The_Economist_Logo.svg"
                    alt="The Economist"
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  O que os humanos fariam em um mundo de super-IA?
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://www.forbes.com/sites/calumchace/2023/05/02/gpt-to-ban-or-not-to-ban-that-is-the-question/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/Forbes_logo.svg"
                    alt="Forbes"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  GPT: Proibir ou não proibir? Essa é a pergunta
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://www.theatlantic.com/ideas/archive/2022/08/future-generations-climate-change-pandemics-ai/671148/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/The_Atlantic_magazine_logo.svg"
                    alt="The Atlantic"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  Como as gerações futuras vão nos lembrar
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://www.politico.com/news/magazine/2023/05/08/manhattan-project-for-ai-safety-00095779/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/POLITICOLOGO.svg"
                    alt="Politico"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  Precisamos de um Projeto Manhattan para a Segurança da IA
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://www.washingtonpost.com/outlook/2022/09/16/future-design-yahaba-politics/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/The_Logo_of_The_Washington_Post_Newspaper.svg"
                    alt="The Washington Post"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  Quer que a política seja melhor? Foco nas futuras gerações
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://www.vox.com/future-perfect/2020/4/8/21210193/coronavirus-forecasting-models-predictions/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/Vox_logo.svg"
                    alt="Vox"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  As previsões são difíceis, especialmente sobre o coronavírus
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://seekingalpha.com/article/4591891-nvidia-may-need-more-cash-flow-to-join-trillion-dollar-club/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/Seeking_Alpha_Logo.svg"
                    alt="Seeking Alpha"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  Nvidia pode precisar de mais fluxo de caixa para se juntar ao
                  Clube Trilhão-Dólar
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://theconversation.com/will-ai-ever-reach-human-level-intelligence-we-asked-five-experts-202515/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/The_Conversation_website_text_logo.svg"
                    alt="The Conversation"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  A IA chegará a inteligência de nível humano? Nós perguntamos a
                  cinco especialistas
                </h3>
              </a>
              <a
                className="block rounded bg-white p-4 no-underline dark:bg-blue-400 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-400 md:dark:hover:bg-blue-300"
                href="https://www.bbc.com/future/article/20220805-what-is-longtermism-and-why-does-it-matter/#:~:text=Metaculus"
                target="_blank"
                rel="noreferrer"
              >
                <div className="relative mx-2 mb-4 mt-2 h-8 p-2">
                  <Image
                    fill
                    className="object-contain object-left"
                    src="https://cdn.metaculus.com/logos/BBC_Logo_2021.svg"
                    alt="BBC.com"
                    unoptimized
                  />
                </div>
                <h3 className="mx-2 my-0 text-base text-blue-800 dark:text-blue-800">
                  O que é o longtermismo?
                </h3>
              </a>
            </div>
          </div>
          <div>
            <h2>Gravação de faixa do Metaculus</h2>
            <p>
              As previsões individuais dos usuários do Metaculus são mostradas
              em seus registros de perfil e são rigorosamente avaliadas. O nosso{" "}
              <Link href="/questions/track-record">próprio histórico</Link>É
              público e robusto.
            </p>
            <h2>Baixar os ativos</h2>
            <p>
              <a
                target="_blank"
                rel="noreferrer"
                href="https://cdn.metaculus.com/metaculus-press-kit.zip"
              >
                Clique aqui
              </a>
              para baixar uma cópia do logotipo e monograma do Metaculus.
            </p>
            <div className="text-lg">
              Para quaisquer outros pedidos, por favor, entre em contato com{" "}
              <a href="mailto:christian@metaculus.com">
                christian?metaculus.com
              </a>
              Estamos sempre felizes em ajudar.
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
