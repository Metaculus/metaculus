import Link from "next/link";

import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Scores FAQ | Metaculus",
  description:
    "Learn how Metaculus scores work, including Peer scores, Relative scores, and legacy scoring methods. Understand tournament rankings, coverage, and prize calculations.",
};

export default function ScoresFAQ() {
  return (
    <PageWrapper>
      <div className="prose [&amp;_a:hover]:text-blue-800 [&amp;_a:hover]:underline [&amp;_a:hover]:dark:text-blue-200 [&amp;_a]:text-blue-700 [&amp;_a]:dark:text-blue-400 [&amp;_code]:rounded [&amp;_code]:border [&amp;_code]:border-blue-400 [&amp;_code]:bg-white [&amp;_code]:p-0.5 [&amp;_code]:dark:border-blue-700 [&amp;_code]:dark:bg-blue-900 [&amp;_code]:md:bg-blue-200 [&amp;_code]:dark:md:bg-blue-800 [&amp;_h1]:mb-4 [&amp;_hr]:border-gray-300 [&amp;_hr]:dark:border-blue-700 [&amp;_li]:text-sm [&amp;_li]:md:text-base [&amp;_p]:text-sm [&amp;_p]:text-gray-700 [&amp;_p]:dark:text-gray-400 [&amp;_p]:md:text-base [&amp;_pre]:overflow-x-auto [&amp;_pre]:rounded [&amp;_pre]:border [&amp;_pre]:border-blue-400 [&amp;_pre]:bg-white [&amp;_pre]:p-3 [&amp;_pre]:dark:border-blue-700 [&amp;_pre]:dark:bg-blue-900 [&amp;_pre]:md:bg-blue-200 [&amp;_pre]:dark:md:bg-blue-800 container mx-auto my-0 max-w-4xl rounded bg-transparent p-3.5 pt-2 dark:bg-blue-900 dark:bg-transparent md:my-10 md:bg-white md:px-6 md:py-4 dark:md:bg-blue-900">
        <h1>Perguntas frequentes sobre as pontuações</h1>
        <p>
          Abaixo estão Perguntas Frequentes (e respostas!) sobre pontuações. O
          FAQ geral é <Link href="/faq/">aqui e aqui</Link>, e as medalhas FAQ é
          <Link href="/help/medals-faq/">aqui e aqui</Link>( , . e
        </p>
        <div className="table-of-contents">
          <ul className="space-y-2">
            <li className="font-bold">
              <a href="#scores-section">Pontuações</a>
            </li>
            <ul className=" space-y-1 pl-4">
              <li>
                <a href="#scoring-rule">O que é uma regra de pontuação?</a>
              </li>
              <li>
                <a href="#proper-scoring">
                  O que é uma regra de pontuação adequada?
                </a>
              </li>
              <li>
                <a href="#log-score">Qual é a pontuação de log?</a>
              </li>
              <li>
                <a href="#continuous-log-score">
                  Qual é a pontuação de log para perguntas contínuas?
                </a>
              </li>
              <li>
                <a href="#spot-score">O que é uma pontuação spot?</a>
              </li>
              <li>
                <a href="#baseline-score">Qual é o score Baseline?</a>
              </li>
              <li>
                <a href="#peer-score">Qual é a pontuação de pares?</a>
              </li>
              <li>
                <a href="#cp-positive-peer">
                  Por que o Preservação dos Pars da Comunidade é positivo?
                </a>
              </li>
              <li>
                <a href="#time-averaging">
                  Todas as minhas previsões em uma pergunta contam para a minha
                  pontuação?
                </a>
              </li>
              <li>
                <a href="#extremizing">
                  Posso obter melhores pontuações prevendo valores extremos?
                </a>
              </li>
              <li>
                <a href="#score-truncation">
                  Por que eu tive uma pequena pontuação quando eu estava certo?
                </a>
              </li>
              <li>
                <a href="#legacy-scores">Quais são os pontos legados?</a>
                <ul className="space-y-1  pl-4 pt-2">
                  <li>
                    <a href="#relative-score">Qual é a pontuação em série?</a>
                  </li>
                  <li>
                    <a href="#coverage">Qual é a cobertura?</a>
                  </li>
                  <li>
                    <a href="#old-points">O que são os pontos Metaculus?</a>
                  </li>
                </ul>
              </li>
            </ul>
            <li className="font-bold">
              <a href="#tournaments-section">Torneios de Futebol</a>
            </li>
            <ul className="space-y-1 pl-4">
              <li>
                <a href="#tournament-scores">
                  Como é calculada a minha pontuação de torneio, cobertura,
                  Take, Prize e Rank?
                </a>
              </li>
              <li>
                <a href="#legacy-tournament-scores">
                  Como é que a minha pontuação do torneio (legado) é calculada,
                  Cobertura, Recolmeção, Prémio e Rank?
                </a>
              </li>
              <li>
                <a href="#hidden-period">
                  Quais são os pesos ocultos e cobertura oculta?
                </a>
              </li>
            </ul>
          </ul>
        </div>
        {/* <hr className="my-8"> */}
        <h1 className="scroll-mt-nav" id="scores-section">
          Pontuações
        </h1>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="scoring-rule">
          O que é uma regra de pontuação?
        </h2>
        <p>
          Uma regra de pontuação é uma função matemática que, dada uma previsão
          e um resultado, dá uma pontuação na forma de um número.
        </p>
        <p>
          Uma regra de pontuação ingênua pode ser: &quot;você marca é igual à
          probabilidade que você deu ao resultado correto&quot;. Assim, por
          exemplo, se você prever 80% e a questão resolver Sim, sua pontuação
          seria 0,8 (e 0,2 se a questão for resolvida Não). A primeira vista,
          isso parece uma boa regra de pontuação: os meteorologistas que deram
          as previsões mais perto da verdade obtêm pontuações mais altas.
        </p>
        <p>
          Infelizmente, esta regra de pontuação não é &quot;adeto&quot;, como
          veremos na próxima seção.
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="proper-scoring">
          O que é uma regra de pontuação adequada?
        </h2>
        <p>
          As regras de pontuação adequadas têm uma propriedade muito especial: a
          única maneira de otimizar sua pontuação em média é prever suas crenças
          sinceras.
        </p>
        <p>
          Como sabemos que a regra de pontuação ingênua da seção anterior não é
          adequada? Um exemplo deve ser esclarecedor: considere a pergunta
          &quot;Vou rolar um 6 sobre este belo morrer?&quot;. Uma vez que o dado
          é justo, sua crença é &quot;1/6&quot; ou cerca de 17%. Agora considere
          três possibilidades: você poderia prever sua verdadeira crença (17%),
          prever algo mais extremo, como 5%, ou prever algo menos extremo, como
          30%. Aqui está uma tabela das pontuações que você espera para cada
          possível rolo de matriz:
        </p>
        <div className="overflow-x-auto">
          <table className="mx-auto w-auto border-collapse">
            <thead>
              <tr className="text-xs font-bold md:text-sm">
                <td className="p-3">rolo de matriz de resultado</td>
                <td className="p-3">pontuação ingênua de p ?5%</td>
                <td className="p-3">escore ingênuo de p ? 17%</td>
                <td className="p-3">pontuação ingênua de p ?30%</td>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">1 em (&quot;</td>
                <td className="p-3">0.95 (&quot;)</td>
                <td className="p-3">0.83</td>
                <td className="p-3">0.7</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">2</td>
                <td className="p-3">0.95 (&quot;)</td>
                <td className="p-3">0.83</td>
                <td className="p-3">0.7</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">3</td>
                <td className="p-3">0.95 (&quot;)</td>
                <td className="p-3">0.83</td>
                <td className="p-3">0.7</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">4</td>
                <td className="p-3">0.95 (&quot;)</td>
                <td className="p-3">0.83</td>
                <td className="p-3">0.7</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">5</td>
                <td className="p-3">0.95 (&quot;)</td>
                <td className="p-3">0.83</td>
                <td className="p-3">0.7</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">6</td>
                <td className="p-3">0.05</td>
                <td className="p-3">0.17 (s)</td>
                <td className="p-3">0.3 (m)</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">Média</td>
                <td className="p-3">0.8</td>
                <td className="p-3">0.72 (&quot;)</td>
                <td className="p-3">0.63</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          O que significa que você obtém uma pontuação melhor em média se você
          prevê 5% do que 17%. Em outras palavras, essa pontuação ingênua
          incentiva você a prever algo diferente da probabilidade verdadeira.
          Isto é muito mau!
        </p>
        <p>
          As regras de pontuação adequadas não têm esse problema: sua pontuação
          é melhor quando você prevê a probabilidade verdadeira. A pontuação do
          log, que sustenta todas as pontuações do Metaculus, é uma pontuação
          adequada (veja
          <Link href="/help/scores-faq/#log-score">
            Qual é a pontuação de log?
          </Link>
          ) Em que o es., . Podemos comparar as pontuações que você obtém no
          exemplo anterior:
        </p>
        <div className="overflow-x-auto">
          <table className="mx-auto w-auto border-collapse">
            <thead>
              <tr className="text-xs font-bold  md:text-sm">
                <td className="p-3">rolo de matriz de resultado</td>
                <td className="p-3">pontuação de log de p ?5%</td>
                <td className="p-3">pontuação de log de p ? 17%</td>
                <td className="p-3">pontuação de log de p ?30%</td>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">1 em (&quot;</td>
                <td className="p-3">- 0.05</td>
                <td className="p-3">-0.19</td>
                <td className="p-3">-0.37</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">2</td>
                <td className="p-3">- 0.05</td>
                <td className="p-3">-0.19</td>
                <td className="p-3">-0.37</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">3</td>
                <td className="p-3">- 0.05</td>
                <td className="p-3">-0.19</td>
                <td className="p-3">-0.37</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">4</td>
                <td className="p-3">- 0.05</td>
                <td className="p-3">-0.19</td>
                <td className="p-3">-0.37</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">5</td>
                <td className="p-3">- 0.05</td>
                <td className="p-3">-0.19</td>
                <td className="p-3">-0.37</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">6</td>
                <td className="p-3">- 3</td>
                <td className="p-3">- 1.77 ( TripAdvisor)</td>
                <td className="p-3">-1.2</td>
              </tr>
              <tr className="text-xs font-normal md:text-sm">
                <td className="p-3">Média</td>
                <td className="p-3">-0.54</td>
                <td className="p-3">-0.45</td>
                <td className="p-3">-0.51</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Com a pontuação de log, você obtém uma pontuação mais alta (melhor) se
          você prever a verdadeira probabilidade de 17%.
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="log-score">
          Qual é a pontuação de log?
        </h2>
        <p>
          A regra de pontuação logarítmica, ou &quot;pontuação de log&quot; para
          abreviar, é definida como:
        </p>
        <span role="math" tabIndex={-1} className="!whitespace-normal">
          <span className="katex-display">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord text">
                    <span className="mord">pontuação de log</span>
                  </span>
                  <span className="mspace"></span>
                  <span className="mrel">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">ln</span>
                  <span className="mopen">(</span>
                  <span className="mord mathnormal">P</span>
                  <span className="mopen">(</span>
                  <span className="mord mathnormal">o</span>
                  <span className="mord mathnormal">u t</span>
                  <span className="mord mathnormal">t</span>
                  <span className="mord mathnormal">t co</span>
                  <span className="mord mathnormal">m</span>
                  <span className="mord mathnormal">e</span>
                  <span className="mclose">))</span>
                </span>
              </span>
            </span>
          </span>
        </span>
        <p>
          Onde{" "}
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">ln</span>
                </span>
              </span>
            </span>
          </span>
          é o logaritmo natural e{" "}
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord mathnormal">P</span>
                  <span className="mopen">(</span>
                  <span className="mord mathnormal">o</span>
                  <span className="mord mathnormal">u</span>
                  <span className="mord mathnormal">t</span>
                  <span className="mord mathnormal">co</span>
                  <span className="mord mathnormal">m</span>
                  <span className="mord mathnormal">e</span>
                  <span className="mclose">)</span>
                </span>
              </span>
            </span>
          </span>
          é a probabilidade prevista para o resultado que realmente aconteceu.
          Esta pontuação de log aplica-se a previsões categóricas, onde um de um
          (geralmente) pequeno conjunto de resultados pode acontecer. No
          Metaculus essas são perguntas binárias e de múltipla escolha. Veja a
          próxima seção para as pontuações de log de perguntas contínuas.
        </p>
        <p>Pontuações mais altas são melhores:</p>
        <ul className="ml-6 list-disc">
          <li>
            Se você previu 0% no resultado correto, sua pontuação será
            <span role="math" tabIndex={-1} className="!whitespace-normal">
              <span className="katex">
                <span className="katex-html" aria-hidden="true">
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mord">? </span>
                    <span className="mord">?</span>
                  </span>
                </span>
              </span>
            </span>
            (menos de infinito).
          </li>
          <li>
            Se você prever 100% no resultado correto, sua pontuação será 0.
          </li>
        </ul>
        <p>
          Isso significa que a pontuação de log é sempre negativa (para
          perguntas binárias e de múltipla escolha). Isso se mostrou pouco
          intuitivo, o que é uma das razões pelas quais o Metaculus usa o
          <Link href="/help/scores-faq/#baseline-score">Linha de base</Link>E a
          <Link href="/help/scores-faq/#peer-score">Peer em</Link>
          As pontuações, que são baseadas na pontuação de log, mas podem ser
          positivas.
        </p>
        <p>
          A pontuação do log é adequada (ver
          <Link href="/help/scores-faq/#proper-scoring">
            O que é uma regra de pontuação adequada?
          </Link>
          ) do que se ala (, a e o da .) Isso significa que para maximizar sua
          pontuação
          <b>Você deve prever suas crenças verdadeiras</b>
          (Veja
          <a href="#extremizing">
            Posso obter melhores pontuações prevendo valores extremos?
          </a>
          ) do que se a
        </p>
        <p>
          Uma propriedade interessante da pontuação do log: é muito mais
          punitivo de previsões erradas extremas do que recompensando as
          previsões de extrema direita. Considere as pontuações que você obtém
          para prever 99% ou 99,9%:
        </p>
        <div className="overflow-x-auto">
          <table className="mx-auto w-auto border-collapse">
            <thead>
              <tr className="text-xs font-bold md:text-sm">
                <td className="p-2"></td>
                <td className="p-2">99% Sim, 1% Não</td>
                <td className="p-2">99,9% Sim, 0,1% Não</td>
              </tr>
            </thead>
            <tbody>
              <tr className="text-xs font-light md:text-sm">
                <td className="p-2">Pontuação se o resultado ? Sim</td>
                <td className="p-2">-0.01</td>
                <td className="p-2">-0.001</td>
              </tr>
              <tr className="text-xs font-light md:text-sm">
                <td className="p-2">Pontuação se o resultado ? Não</td>
                <td className="p-2">-4.6</td>
                <td className="p-2">-6.9</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Ir de 99% para 99,9% só lhe dá uma pequena vantagem se você estiver
          correto (+0,009), mas uma grande penalidade se você estiver errado
          (-2.3). Portanto, tenha cuidado, e use apenas probabilidades extremas
          quando tiver certeza de que elas são apropriadas!
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="continuous-log-score">
          Qual é a pontuação de log para perguntas contínuas?
        </h2>
        <p>
          Uma vez que o domínio de possíveis resultados para questões contínuas
          é contínuo, qualquer resultado tem matematicamente 0 chance de
          acontecer. Felizmente, podemos adaptar a pontuação de log no
          formulário:
        </p>
        <span role="math" tabIndex={-1} className="!whitespace-normal">
          <span className="katex-display">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord text">
                    <span className="mord">pontuação de log</span>
                  </span>
                  <span className="mspace"></span>
                  <span className="mrel">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">ln</span>
                  <span className="mopen">(</span>
                  <span className="mop">
                    <span className="mord mathrm">pdf</span>
                  </span>
                  <span className="mopen">(</span>
                  <span className="mord mathnormal">o</span>
                  <span className="mord mathnormal">u</span>
                  <span className="mord mathnormal">t t</span>
                  <span className="mord mathnormal">co</span>
                  <span className="mord mathnormal">m</span>
                  <span className="mord mathnormal">e</span>
                  <span className="mclose">))</span>
                </span>
              </span>
            </span>
          </span>
        </span>
        <p>
          Onde é o caso{" "}
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">In (&quot;)</span>
                </span>
              </span>
            </span>
          </span>
          é o logaritmo natural e{" "}
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">
                    <span className="mord mathrm">pdf</span>
                  </span>
                  <span className="mopen">(</span>
                  <span className="mord mathnormal">o</span>
                  <span className="mord mathnormal">u</span>
                  <span className="mord mathnormal">t</span>
                  <span className="mord mathnormal">co</span>
                  <span className="mord mathnormal">m</span>
                  <span className="mord mathnormal">e</span>
                  <span className="mclose">)</span>
                </span>
              </span>
            </span>
          </span>
          É o valor do previsto
          <a href="https://en.wikipedia.org/wiki/Probability_density_function">
            Função de densidade de probabilidade
          </a>
          no resultado. Note-se que no Metaculus, todos os pdf têm um
          <a href="https://en.wikipedia.org/wiki/Uniform_distribution">
            distribuição uniforme
          </a>
          de altura 0,01 adicionado a eles. Isso evita pontuações extremas de
          log.
        </p>
        <p>
          Esta também é uma regra de pontuação adequada e se comporta de
          maneiras um pouco semelhantes à pontuação de log descrita acima. Uma
          diferença é que, ao contrário das probabilidades que estão sempre
          entre 0 e 1,
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">
                    <span className="mord mathrm">pdf em que</span>
                  </span>
                </span>
              </span>
            </span>
          </span>
          Os valores podem ser maiores que 1. Isso significa que a pontuação de
          log contínuo pode ser maior que 0: em teoria, não tem valor máximo,
          mas na prática o Metaculus restringe o quão nítidos os pdfs podem ser
          obtidos (veja os escores máximos tabulados abaixo).
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="spot-score">
          O que é uma pontuação spot?
        </h2>
        <p>
          Uma pontuação &quot;spot&quot; é uma versão específica do tipo de
          pontuação dada (por exemplo, &quot;pontuação do ponto) onde a
          avaliação não leva em conta a duração da previsão. Para uma pontuação
          spot, apenas a previsão em um determinado momento é considerada. Salvo
          indicação em contrário, as pontuações são avaliadas ao mesmo tempo em
          que a previsão comunitária é revelada. A cobertura é de 100% se houver
          uma previsão ativa no momento e 0% se não houver. A matemática é a
          mesma que o tipo de pontuação dada.
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="baseline-score">
          Qual é o score Baseline?
        </h2>
        <p>
          A pontuação Baseline compara uma previsão a uma linha de base
          &quot;chance&quot; fixa. Se for positivo, a previsão foi melhor do que
          a chance. Se é negativo, foi pior do que o acaso.
        </p>
        <p>
          Essa linha de base de &quot;chance&quot; dá a mesma probabilidade a
          todos os resultados. Para questões binárias, esta é uma previsão de
          50%. Para uma pergunta de escolha múltipla de opção N é uma previsão
          de 1/N para cada opção. Para questões contínuas, esta é uma
          distribuição uniforme (plana).
        </p>
        <p>
          A pontuação de linha de base é derivada do
          <Link href="/help/scores-faq/#log-score">pontuação de log</Link>,
          redimensionou de modo que:
        </p>
        <ul className="list-disc pl-5">
          <li>
            Prever a mesma probabilidade em todos os resultados dá uma pontuação
            de 0.
          </li>
          <li>
            Prever perfeitamente uma questão de escolha binária ou múltipla dá
            uma pontuação de +100.
          </li>
          <li>
            As pontuações médias de perguntas binárias e contínuas correspondem
            aproximadamente.
          </li>
        </ul>
        <p>Aqui estão alguns valores notáveis para o escore Baseline:</p>
        <div className="overflow-x-auto">
          <table className="mx-auto w-auto">
            <thead>
              <tr>
                <th className="p-4 text-xs font-bold  md:text-sm"></th>
                <th className="p-4 text-xs font-bold  md:text-sm">
                  Perguntas binárias
                </th>
                <th className="p-4 text-xs font-bold  md:text-sm">
                  Perguntas de múltipla escolha<br></br>
                  (8 opções)
                </th>
                <th className="p-4 text-xs font-bold  md:text-sm">
                  Perguntas contínuas
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 text-xs font-light md:text-sm">
                  Melhor placa de base em Metaculus
                </td>
                <td className="p-4 text-xs font-light md:text-sm">+9,9</td>
                <td className="p-4 text-xs font-light md:text-sm">+9,9</td>
                <td className="p-4 text-xs font-light md:text-sm">+183</td>
              </tr>
              <tr>
                <td className="p-4 text-xs font-light md:text-sm">
                  Pior pontuação de linha de base em Metaculus
                </td>
                <td className="p-4 text-xs font-light md:text-sm">-897</td>
                <td className="p-4 text-xs font-light md:text-sm">-232</td>
                <td className="p-4 text-xs font-light md:text-sm">- 230</td>
              </tr>
              <tr>
                <td className="p-4 text-xs font-light md:text-sm">
                  Pontuação empírica mediana de base
                </td>
                <td className="p-4 text-xs font-light md:text-sm">+17</td>
                <td className="p-4 text-xs font-light md:text-sm">
                  Ainda não há dados
                </td>
                <td className="p-4 text-xs font-light md:text-sm">+14</td>
              </tr>
              <tr>
                <td className="p-4 text-xs font-light md:text-sm">
                  Pontuação empírica média de linha de base
                </td>
                <td className="p-4 text-xs font-light md:text-sm">+13</td>
                <td className="p-4 text-xs font-light md:text-sm">
                  Ainda não há dados
                </td>
                <td className="p-4 text-xs font-light md:text-sm">+13</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Teoricamente, os escores binários podem ser infinitamente negativos, e
          as pontuações contínuas podem ser infinitamente positivas e
          infinitamente negativas. Na prática, o Metaculus restringe as
          previsões binárias entre 0,1% e 99,9%, e os pdfs contínuos estão entre
          0,01 e 35o, levando aos escores acima. Os escores empíricos são
          baseados em todos os escores observados em todas as questões
          resolvidas do Metaculus, a partir de novembro de 2023.
        </p>
        <p>
          Observe que o acima descreve a pontuação de linha de base em um único
          ponto no tempo. As pontuações do Metaculus são médias de tempo ao
          longo da vida da questão, veja
          <Link href="/help/scores-faq/#time-averaging">
            Todas as minhas previsões em uma pergunta contam para a minha
            pontuação?
          </Link>
          ( , . e
        </p>
        <p>
          Você pode expandir a seção abaixo para mais detalhes e matemática.
        </p>
        <div className="w-full" data-headlessui-state="">
          <button
            className="group flex w-full items-center gap-3 rounded bg-white p-3 text-left text-lg transition-all dark:bg-blue-900 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-800 md:dark:hover:bg-blue-700"
            id="headlessui-disclosure-button-:R2d4vfesul5j6:"
            type="button"
            aria-expanded="false"
            data-headlessui-state=""
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="chevron-down"
              className="svg-inline--fa fa-chevron-down fa-sm text-blue-700 transition-transform dark:text-blue-500"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
              ></path>
            </svg>
            Matemática de pontuação de linha de base
          </button>
        </div>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="peer-score">
          Qual é a pontuação de pares?
        </h2>
        <p>
          A pontuação de pares compara uma previsão a todas as outras previsões
          feitas sobre a mesma pergunta. Se for positivo, a previsão foi (em
          média) melhor que outras. Se é negativo, foi pior do que outros.
        </p>
        <p>
          A pontuação dos pares é derivada do
          <Link href="/help/scores-faq/#log-score">pontuação de log</Link>: é a
          diferença média entre a pontuação do log de uma previsão e as
          pontuações de log de todas as outras previsões sobre essa questão.
          Como o escore da linha de base, a pontuação de pares é multiplicada
          por 100.
        </p>
        <p>
          Uma propriedade interessante da pontuação Peer é que, em qualquer
          pergunta, a soma das pontuações de todos os participantes é sempre 0.
          Isso ocorre porque a pontuação de cada previsor é sua diferença média
          com todos os outros: quando você adiciona todas as pontuações, todas
          as diferenças cancelam e o resultado é 0. Aqui está um exemplo rápido:
          imagine a
          <Link href="/help/scores-faq/#continuous-log-score">
            Pergunta contínua
          </Link>
          , com três analistas tendo previsto:
        </p>
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="mx-auto table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Meteorologista
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  pontuação de log
                </th>
                <th className="px-4 py-2  text-left text-xs font-bold md:text-sm">
                  Pontuação de pares
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  Alex (tradução
                </td>
                <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                  <span
                    role="math"
                    tabIndex={-1}
                    className="!whitespace-normal"
                  >
                    <span className="katex">
                      <span className="katex-html" aria-hidden="true">
                        <span className="base">
                          <span className="strut"></span>
                          <span className="mord">?</span>
                          <span className="mord">1 (</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  <span
                    role="math"
                    tabIndex={-1}
                    className="!whitespace-normal"
                  >
                    <span className="katex-display">
                      <span className="katex">
                        <span className="katex-html" aria-hidden="true">
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">
                              <span className="mopen nulldelimiter"></span>
                              <span className="mfrac">
                                <span className="vlist-t vlist-t2">
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mord">2</span>
                                        </span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="frac-line"></span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mopen">(</span>
                                          <span className="mord mathnormal">
                                            A
                                          </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord mathnormal">
                                            B
                                          </span>
                                          <span className="mclose">)</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">+</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord mathnormal">
                                            A
                                          </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord mathnormal">
                                            C
                                          </span>
                                          <span className="mclose">)</span>
                                        </span>
                                      </span>
                                    </span>
                                    <span className="vlist-s">​</span>
                                  </span>
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className=""></span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span className="mclose nulldelimiter"></span>
                            </span>
                            <span className="mspace"></span>
                            <span className="mrel">?</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">
                              <span className="mopen nulldelimiter"></span>
                              <span className="mfrac">
                                <span className="vlist-t vlist-t2">
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mord">2</span>
                                        </span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="frac-line"></span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mopen">(</span>
                                          <span className="mord">1 </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mord">1)</span>
                                          <span className="mspace"></span>
                                          <span className="mord">1</span>
                                          <span className="mclose">)</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">+</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord">1 </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mord">2)</span>
                                          <span className="mspace"></span>
                                          <span className="mord">2</span>
                                          <span className="mclose">)</span>
                                        </span>
                                      </span>
                                    </span>
                                    <span className="vlist-s">​</span>
                                  </span>
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className=""></span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span className="mclose nulldelimiter"></span>
                            </span>
                            <span className="mspace"></span>
                            <span className="mrel">?</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord"></span>
                            <span className="mord"></span>
                          </span>
                          <span className="base"></span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord"></span>
                            <span className="mord"></span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  Bailey (tradução
                </td>
                <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                  <span
                    role="math"
                    tabIndex={-1}
                    className="!whitespace-normal"
                  >
                    <span className="katex">
                      <span className="katex-html" aria-hidden="true">
                        <span className="base">
                          <span className="strut"></span>
                          <span className="mord">1 em (&quot;</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  <span
                    role="math"
                    tabIndex={-1}
                    className="!whitespace-normal"
                  >
                    <span className="katex-display">
                      <span className="katex">
                        <span className="katex-html" aria-hidden="true">
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">
                              <span className="mopen nulldelimiter"></span>
                              <span className="mfrac">
                                <span className="vlist-t vlist-t2">
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mord">2</span>
                                        </span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="frac-line"></span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mopen">(</span>
                                          <span className="mord mathnormal">
                                            B
                                          </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord mathnormal">
                                            A
                                          </span>
                                          <span className="mclose">)</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">+</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord mathnormal">
                                            B
                                          </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord mathnormal">
                                            C
                                          </span>
                                          <span className="mclose">)</span>
                                        </span>
                                      </span>
                                    </span>
                                    <span className="vlist-s">​</span>
                                  </span>
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className=""></span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span className="mclose nulldelimiter"></span>
                            </span>
                            <span className="mspace"></span>
                            <span className="mrel">?</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">
                              <span className="mopen nulldelimiter"></span>
                              <span className="mfrac">
                                <span className="vlist-t vlist-t2">
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mord">2</span>
                                        </span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="frac-line"></span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mopen">(</span>
                                          <span className="mord">1</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord">−</span>
                                          <span className="mord">1</span>
                                          <span className="mclose">1))</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">+</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord">1</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord">2</span>
                                          <span className="mclose">2)</span>
                                        </span>
                                      </span>
                                    </span>
                                    <span className="vlist-s">​</span>
                                  </span>
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className=""></span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span className="mclose nulldelimiter"></span>
                            </span>
                            <span className="mspace"></span>
                            <span className="mrel">?</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">0.5</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  Cory (Cory)
                </td>
                <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                  <span
                    role="math"
                    tabIndex={-1}
                    className="!whitespace-normal"
                  >
                    <span className="katex">
                      <span className="katex-html" aria-hidden="true">
                        <span className="base">
                          <span className="strut"></span>
                          <span className="mord">2</span>
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  <span
                    role="math"
                    tabIndex={-1}
                    className="!whitespace-normal"
                  >
                    <span className="katex-display">
                      <span className="katex">
                        <span className="katex-html" aria-hidden="true">
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">
                              <span className="mopen nulldelimiter"></span>
                              <span className="mfrac">
                                <span className="vlist-t vlist-t2">
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mord">2</span>
                                        </span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="frac-line"></span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mopen">(</span>
                                          <span className="mord mathnormal">
                                            C
                                          </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord mathnormal">
                                            A
                                          </span>
                                          <span className="mclose">)</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">+</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord mathnormal">
                                            C
                                          </span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord mathnormal">
                                            B
                                          </span>
                                          <span className="mclose">)</span>
                                        </span>
                                      </span>
                                    </span>
                                    <span className="vlist-s">​</span>
                                  </span>
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className=""></span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span className="mclose nulldelimiter"></span>
                            </span>
                            <span className="mspace"></span>
                            <span className="mrel">?</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">
                              <span className="mopen nulldelimiter"></span>
                              <span className="mfrac">
                                <span className="vlist-t vlist-t2">
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mord">2</span>
                                        </span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="frac-line"></span>
                                      </span>
                                      <span className="">
                                        <span className="pstrut"></span>
                                        <span className="mord">
                                          <span className="mopen">(</span>
                                          <span className="mord">2</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord">−</span>
                                          <span className="mord">1</span>
                                          <span className="mclose">1))</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">+</span>
                                          <span className="mspace"></span>
                                          <span className="mopen">(</span>
                                          <span className="mord">2</span>
                                          <span className="mspace"></span>
                                          <span className="mbin">?</span>
                                          <span className="mspace"></span>
                                          <span className="mord">1</span>
                                          <span className="mclose">1) </span>
                                          <span className="mbin">?</span>
                                          <span className="mclose">1)</span>
                                        </span>
                                      </span>
                                    </span>
                                    <span className="vlist-s">​</span>
                                  </span>
                                  <span className="vlist-r">
                                    <span className="vlist">
                                      <span className=""></span>
                                    </span>
                                  </span>
                                </span>
                              </span>
                              <span className="mclose nulldelimiter"></span>
                            </span>
                            <span className="mspace"></span>
                            <span className="mrel">?</span>
                            <span className="mord"></span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">2</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
                <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                  soma
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  <span
                    role="math"
                    tabIndex={-1}
                    className="!whitespace-normal"
                  >
                    <span className="katex-display">
                      <span className="katex">
                        <span className="katex-html" aria-hidden="true">
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">?</span>
                            <span className="mord">2.5</span>
                            <span className="mspace"></span>
                            <span className="mbin">+</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">0.5</span>
                            <span className="mspace"></span>
                            <span className="mbin">+</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">2</span>
                            <span className="mspace"></span>
                            <span className="mrel">?</span>
                            <span className="mspace"></span>
                          </span>
                          <span className="base">
                            <span className="strut"></span>
                            <span className="mord">0</span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Aqui estão alguns valores notáveis para a pontuação Peer:</p>
        <table className="mx-auto table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2  text-xs font-bold md:text-sm"></th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                Binário e<br></br>
                Escolha Múltipla<br></br>
                Perguntas
              </th>
              <th className="px-4 py-2  text-xs font-bold md:text-sm">
                Contínuo<br></br>
                Perguntas
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                Melhor pontuação de pares em Metaculus
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                +691
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                +408
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                Pior possível Pista em Metaculus
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                -691
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                -408
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                Pontuação empírica mediana por pares
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                +2
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                +3
              </td>
            </tr>
            <tr>
              <td className="px-4 py-2 text-xs font-light md:text-sm">
                Pontuação empírica média de pares
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                0 ?
              </td>
              <td className="px-4 py-2 text-center text-xs font-light md:text-sm">
                0 ?
              </td>
            </tr>
          </tbody>
        </table>
        <p>A pontuação média de pares é 0 por definição.</p>
        <p>
          Teoricamente, os escores binários podem ser infinitamente negativos, e
          as pontuações contínuas podem ser infinitamente positivas e
          infinitamente negativas. Na prática, o Metaculus restringe as
          previsões binárias entre 0,1% e 99,9%, e os pdfs contínuos estão entre
          0,01 e 35o, levando aos escores acima.
        </p>
        <p>
          Os &quot;pontuações empíricos&quot; são baseados em todos os escores
          observados em todas as questões do Metaculus resolvidas, a partir de
          novembro de 2023.
        </p>
        <p>
          Observe que o acima descreve a pontuação de pares em um único ponto no
          tempo. As pontuações do Metaculus são médias de tempo ao longo da vida
          da questão, veja
          <Link href="/help/scores-faq/#time-averaging">
            Todas as minhas previsões em uma pergunta contam para a minha
            pontuação?
          </Link>
          ( , . e
        </p>
        <p>
          Você pode expandir a seção abaixo para mais detalhes e matemática.
        </p>
        <div className="w-full" data-headlessui-state="">
          <button
            className="group flex w-full items-center gap-3 rounded bg-white p-3 text-left text-lg transition-all dark:bg-blue-900 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-800 md:dark:hover:bg-blue-700"
            id="headlessui-disclosure-button-:R2gkvfesul5j6:"
            type="button"
            aria-expanded="false"
            data-headlessui-state=""
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="chevron-down"
              className="svg-inline--fa fa-chevron-down fa-sm text-blue-700 transition-transform dark:text-blue-500"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
              ></path>
            </svg>
            Persas de matemática
          </button>
        </div>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="cp-positive-peer">
          Por que a pontuação de pares da previsão comunitária é positiva?
        </h2>
        <p>
          O que é{" "}
          <Link href="/help/scores-faq/#peer-score">Pontuação de pares</Link>
          medidas sobre se um previsor era, em média, melhor do que outros
          analistas. É a diferença entre o previstonte
          <Link href="/help/scores-faq/#log-score">pontuação de log</Link>e a
          média de todos os outros pontuações de registro dos meteorologistas.
          Se você tem uma pontuação positiva de Peer, isso significa que sua
          pontuação de registro foi melhor do que a média de todas as pontuações
          de registro de outros meteorologistas.
        </p>
        <p>
          A <Link href="/faq/#community-prediction">previsão comunitária</Link>é
          uma mediana ponderada pelo tempo de todos os previsores sobre a
          questão. Como a maioria dos agregados, é melhor do que a maioria dos
          analistas que alimenta: é menos ruidoso, menos tendencioso e atualiza
          com mais frequência.
        </p>
        <p>
          Uma vez que a previsão comunitária é melhor do que a maioria dos
          analistas, segue-se que a sua pontuação deve ser superior à pontuação
          média de todos os preditores. E assim sua pontuação de Peer é
          positiva.
        </p>
        <div className="w-full" data-headlessui-state="">
          <button
            className="group flex w-full items-center gap-3 rounded bg-white p-3 text-left text-lg transition-all dark:bg-blue-900 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-800 md:dark:hover:bg-blue-700"
            id="headlessui-disclosure-button-:R2i4vfesul5j6:"
            type="button"
            aria-expanded="false"
            data-headlessui-state=""
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="chevron-down"
              className="svg-inline--fa fa-chevron-down fa-sm text-blue-700 transition-transform dark:text-blue-500"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
              ></path>
            </svg>
            Mais detalhes matemáticos para nerds
          </button>
        </div>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="time-averaging">
          Todas as minhas previsões em uma pergunta contam para a minha
          pontuação?
        </h2>
        <p>
          - Sim, sim. - Sim. Metaculus usa escores médios de tempo, então todas
          as suas previsões contam, proporcionais a quanto tempo elas estavam em
          pé. Um exemplo vai um longo caminho (vamos usar a pontuação Baseline
          para simplificar, mas a mesma lógica se aplica a qualquer pontuação):
        </p>
        <p>
          Uma questão binária está aberta 5 dias, depois fecha e resolve Sim.
          Você começa a prever no segundo dia, fazer essas previsões e obter
          essas pontuações:
        </p>
        <div className="w-full overflow-x-auto overflow-y-hidden">
          <table className="mx-auto table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2  text-xs font-bold md:text-sm"></th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Dia 1
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Dia 2
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Dia 3
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Dia 4
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Dia 5
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Média
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  Previsão
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">40%</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">70%</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm"></td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">80%</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  N/A (Em (Em (
                </td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  Pontuação de linha de base
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">0</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  - 32
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+49</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+49</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+68</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+27</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Algumas coisas a notar:</p>
        <ul className="ml-5 list-disc">
          <li>
            Antes de prever, sua pontuação é considerada 0 (isso é verdade para
            todas as pontuações com base na pontuação do log). Isso significa
            que, se você acredita que pode fazer melhor do que 0, você deve
            prever o mais cedo possível.
          </li>
          <li>
            Você tem uma pontuação para o Dia 4, apesar de não ter previsto
            naquele dia. Isso ocorre porque suas previsões permanecem de pé até
            que você as atualize, então no dia 4 você foi marcado na previsão do
            terceiro dia. No dia 5 você atualizou para 80%, então você foi
            marcado nisso.
          </li>
          <li>
            Este exemplo usa dias, mas suas pontuações do Metaculus são baseadas
            em previsões exatas com carimbo de data e hora, portanto, uma
            previsão deixada por 1 hora contará para 1/24 de uma previsão
            deixada em pé por um dia, etc.
          </li>
        </ul>
        <p>
          Por fim, observe que as pontuações são sempre calculadas para cada
          instante entre a data de abertura e (agendada) Data de fechamento da
          pergunta. Se uma pergunta for resolvida com antecedência (ou seja,
          antes da data de fechamento programada), as pontuações são definidas
          como 0 entre a data de resolução e a data de fechamento agendada e
          ainda contam na média. Isso garante o alinhamento dos incentivos,
          conforme explicado na seção
          <Link href="/help/scores-faq/#score-truncation">
            Por que eu tive uma pequena pontuação quando eu estava certo?
          </Link>
          Abaixo.
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="extremizing">
          Posso obter melhores pontuações prevendo valores extremos?
        </h2>
        <p>
          Metaculus usa pontuações adequadas (veja
          <Link href="/help/scores-faq/#proper-scoring">
            O que é uma regra de pontuação adequada?
          </Link>
          ), então você não pode obter uma pontuação melhor (em média) fazendo
          previsões mais extremas do que suas crenças. Em qualquer dúvida, se
          você quiser maximizar sua pontuação esperada, você deve prever
          exatamente o que você acredita.
        </p>
        <p>
          Vamos percorrer um exemplo simples usando a pontuação Baseline.
          Suponha que você esteja pensando em prever uma pergunta binária.
          Depois de algum pensamento, você conclui que a pergunta tem 80% de
          chance de resolver o Sim.
        </p>
        <p>
          Se você prever 80%, você obterá uma pontuação de +68 se a pergunta
          resolver Sim, e -132 se resolver Não. Desde que você acha que há uma
          chance de 80% de resolver Sim, você espera, em média, uma pontuação de
        </p>
        <p>
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">80%</span>
                  <span className="mspace"></span>
                  <span className="mbin">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">68</span>
                  <span className="mspace"></span>
                  <span className="mbin">+</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">20%</span>
                  <span className="mspace"></span>
                  <span className="mbin">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">?</span>
                  <span className="mord">132</span>
                  <span className="mspace"></span>
                  <span className="mrel">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">+</span>
                  <span className="mord">28</span>
                </span>
              </span>
            </span>
          </span>
        </p>
        <p>
          Se você prever 90%, você obterá uma pontuação de +85 se a pergunta
          resolver Sim, e -232 se ela resolver Não. Desde que você acha que há
          uma chance de 80% de resolver Sim, você espera, em média, uma
          pontuação de
        </p>
        <p>
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">80%</span>
                  <span className="mspace"></span>
                  <span className="mbin">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">85</span>
                  <span className="mspace"></span>
                  <span className="mbin">+</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">20%</span>
                  <span className="mspace"></span>
                  <span className="mbin">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">?</span>
                  <span className="mord">232</span>
                  <span className="mspace"></span>
                  <span className="mrel">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">+</span>
                  <span className="mord">21</span>
                </span>
              </span>
            </span>
          </span>
        </p>
        <p>
          Então, ao prever um valor mais extremo, você realmente diminui a
          pontuação que espera obter (em média!).
        </p>
        <p>Aqui estão mais alguns valores do mesmo exemplo, tabulados:</p>
        <div className="w-full overflow-x-auto">
          <table className="mx-auto table-auto">
            <thead>
              <tr>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Previsão
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Pontuação se sim
                </th>
                <th className="px-4 py-2  text-xs font-bold md:text-sm">
                  Pontuação se não
                </th>
                <th className="px-4 py-2 text-xs font-bold md:text-sm">
                  Pontuação esperada
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">70%</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+48</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">-74</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+24</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">80%</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+68</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  - 132
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+28</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">90%</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+85</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  -232
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+21</td>
              </tr>
              <tr>
                <td className="px-4 py-2 text-xs font-light md:text-sm">99%</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">+99</td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  -564
                </td>
                <td className="px-4 py-2 text-xs font-light md:text-sm">
                  - 34
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          A previsão de 99% obtém a pontuação mais alta quando a pergunta
          resolve Sim, mas também obtém a menor pontuação quando resolve Não. É
          por isso que, em média, a estratégia que maximiza sua pontuação é
          prever o que você acredita. Esta é uma das razões pelas quais olhar
          para as pontuações em questões individuais não é muito informativo;
          apenas agregar-se sobre muitas questões são interessantes!
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="score-truncation">
          Por que eu tive uma pequena pontuação quando eu estava certo?
        </h2>
        <p>
          Para garantir que os incentivos estejam alinhados, o Metaculus precisa
          garantir que nossas pontuações sejam adequadas. Também pontuações de
          tempo médio.
        </p>
        <p>
          Isso tem uma consequência contra-intuitiva: quando uma pergunta
          resolve antes de sua data de fechamento pretendida, os tempos entre a
          resolução e a data de fechamento precisam contar na média de tempo,
          com pontuações de 0. Chamamos isso de &quot;truncamento de
          pontuação&quot;.
        </p>
        <p>
          Um exemplo é melhor: imagine a pergunta “Será que uma nova terra
          humana na Lua antes de 2030?”. Pode resolver Sim antes de 2030 (porque
          alguém pousou na Lua) ou pode resolver o Não em 2030. Se não
          truncássemos pontuações, você poderia jogar essa pergunta prevendo
          cerca de 100% no início (já que só pode resolver positivo cedo) e
          diminuir mais tarde (já que só pode resolver negativo no final).
        </p>
        <p>
          Outra maneira de pensar sobre isso é que, se uma pergunta dura um ano,
          então cada dia (ou, de fato, a cada segundo) é marcado como uma
          questão separada. Para preservar a adequação, é imperativo que cada
          dia seja ponderado o mesmo na média final (ou pelo menos que os pesos
          sejam decididos com antecedência). Nessa perspectiva, não fazer
          truncação é equivalente a dar retroativamente muito mais peso aos dias
          antes que a questão se resolva, o que não é apropriado.
        </p>
        <p>
          Você pode ler um exemplo trabalhado com matemática expandindo a seção
          abaixo.
        </p>
        <div className="w-full" data-headlessui-state="">
          <button
            className="group flex w-full items-center gap-3 rounded bg-white p-3 text-left text-lg transition-all dark:bg-blue-900 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-800 md:dark:hover:bg-blue-700"
            id="headlessui-disclosure-button-:R2p4vfesul5j6:"
            type="button"
            aria-expanded="false"
            data-headlessui-state=""
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="chevron-down"
              className="svg-inline--fa fa-chevron-down fa-sm text-blue-700 transition-transform dark:text-blue-500"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
              ></path>
            </svg>
            Marque o exemplo de truncamento
          </button>
        </div>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="legacy-scores">
          Quais são os pontos legados?
        </h2>
        <h3 className="scroll-mt-nav" id="relative-score">
          Qual é a pontuação em série?
        </h3>
        <p>
          A pontuação relativa compara uma previsão com a mediana de todas as
          outras previsões sobre a mesma questão. Se for positivo, a previsão
          foi (em média) melhor do que a mediana. Se for negativo, foi pior do
          que a mediana.
        </p>
        <p>É baseado na pontuação do log, com a fórmula:</p>
        <span role="math" tabIndex={-1} className="!whitespace-normal">
          <span className="katex-display">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord text">
                    <span className="mord">Pontuação emlativa</span>
                  </span>
                  <span className="mspace"></span>
                  <span className="mrel">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">
                    <span className="mop">
                      lo <span>g</span>
                    </span>
                    <span className="msupsub">
                      <span className="vlist-t vlist-t2">
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="sizing reset-size6 size3 mtight">
                                <span className="mord mtight">2</span>
                              </span>
                            </span>
                          </span>
                          <span className="vlist-s">​</span>
                        </span>
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className=""></span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="mopen">(</span>
                  <span className="mord mathnormal">p</span>
                  <span className="mclose">)</span>
                  <span className="mspace"></span>
                  <span className="mbin">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mop">
                    <span className="mop">
                      lo <span>g</span>
                    </span>
                    <span className="msupsub">
                      <span className="vlist-t vlist-t2">
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="sizing reset-size6 size3 mtight">
                                <span className="mord mtight">2</span>
                              </span>
                            </span>
                          </span>
                          <span className="vlist-s">​</span>
                        </span>
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className=""></span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="mopen">(</span>
                  <span className="mord mathnormal">m</span>
                  <span className="mclose">)</span>
                </span>
              </span>
            </span>
          </span>
        </span>
        <p>
          Onde{" "}
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord mathnormal">p</span>
                </span>
              </span>
            </span>
          </span>
          é a previsão sendo pontuada e{" "}
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord mathnormal">m</span>
                </span>
              </span>
            </span>
          </span>
          é a mediana de todas as outras previsões sobre essa questão.
        </p>
        <p>
          A partir do final de 2023, a pontuação em Relative está em processo de
          ser substituída pela{" "}
          <Link href="/help/scores-faq/#peer-score">pontuação Peer</Link>, mas
          ainda é usada para muitos torneios abertos.
        </p>
        <h3 className="scroll-mt-nav" id="coverage">
          Qual é a cobertura?
        </h3>
        <p>
          A Cobertura mede para a proporção da vida de uma pergunta que você
          tinha uma previsão.
        </p>
        <p>
          Se você fizer sua primeira previsão quando a pergunta for aberta, sua
          cobertura será de 100%. Se você fizer sua primeira previsão um segundo
          antes que a pergunta se feche, sua cobertura será muito próxima de 0%.
        </p>
        <p>
          A cobertura é usada em torneios, para incentivar previsões iniciais.
        </p>
        <h3 className="scroll-mt-nav" id="old-points">
          O que são os pontos Metaculus?
        </h3>
        <p>
          Metaculus pontos foram utilizados como escore principal no Metaculus
          até o final de 2023.
        </p>
        <p>
          Você ainda pode encontrar os rankings com base em pontos
          <Link href="/legacy-points-rankings/">aqui e aqui</Link>( , . e
        </p>
        <p>
          Eles são uma pontuação adequada, com base na pontuação de log. Eles
          são uma mistura de uma pontuação semelhante à linha de base e uma
          pontuação semelhante a um peer, então eles recompensam ambos batendo
          uma linha de base imparcial e batendo outros meteorologistas.
        </p>
        <p>Para detalhes matemáticos completos, expanda a seção abaixo.</p>
        <div className="w-full" data-headlessui-state="">
          <button
            className="group flex w-full items-center gap-3 rounded bg-white p-3 text-left text-lg transition-all dark:bg-blue-900 md:bg-blue-300 md:hover:bg-blue-400 md:dark:bg-blue-800 md:dark:hover:bg-blue-700"
            id="headlessui-disclosure-button-:R2tkvfesul5j6:"
            type="button"
            aria-expanded="false"
            data-headlessui-state=""
          >
            <svg
              aria-hidden="true"
              focusable="false"
              data-prefix="fas"
              data-icon="chevron-down"
              className="svg-inline--fa fa-chevron-down fa-sm text-blue-700 transition-transform dark:text-blue-500"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="currentColor"
                d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"
              ></path>
            </svg>
            Metaculus pontos matemática
          </button>
        </div>
        {/* <hr className="mt-8"> */}
        <h1 className="scroll-mt-nav" id="tournaments-section">
          Torneios de Futebol
        </h1>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="tournament-scores">
          Como é calculada a minha pontuação de torneio, Take, Prize e Rank?
        </h2>
        <p>
          Este método de pontuação foi introduzido em março de 2024. É baseado
          no
          <Link href="/help/scores-faq/#peer-score">Pontuações dos pares</Link>
          descrito acima.
        </p>
        <p>
          Sua classificação no torneio é determinada pela soma de suas
          pontuações peer sobre todas as perguntas ponderadas pelo peso da
          pergunta no torneio (você recebe 0 para qualquer questão que você não
          tenha previsto). Perguntas que têm pesos diferentes de 1,0 são
          indicadas na barra lateral da página de detalhes da pergunta.
          Normalmente, um peso de pergunta é alterado se for determinado como
          altamente correlacionado com outras perguntas incluídas no mesmo
          torneio, especialmente grupos de perguntas.
        </p>
        <p>
          A parte do prêmio que você recebe é proporcional à mesma soma de
          resultados de Pares, ao quadrado. Se a soma de suas pontuações por
          pares for negativa, você não recebe nenhum prêmio.
        </p>
        <div className="w-full overflow-x-scroll">
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex-display">
              <span className="katex">
                <span className="katex-html" aria-hidden="true">
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mord text">
                      <span className="mord">sua pontuação total</span>
                    </span>
                    <span className="mspace"></span>
                    <span className="mrel">?</span>
                    <span className="mspace"></span>
                  </span>
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mop op-limits">
                      <span className="vlist-t vlist-t2">
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="sizing reset-size6 size3 mtight">
                                <span className="mord text mtight">
                                  <span className="mord mtight">questões</span>
                                </span>
                              </span>
                            </span>
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="">
                                <span className="mop op-symbol large-op">
                                  ?
                                </span>
                              </span>
                            </span>
                          </span>
                          <span className="vlist-s">​</span>
                        </span>
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className=""></span>
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="mspace"></span>
                    <span className="mord text">
                      <span className="mord">sua pontuação de par</span>
                    </span>
                    <span className="mspace"></span>
                    <span className="mbin">?</span>
                    <span className="mspace"></span>
                  </span>
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mord text">
                      <span className="mord">peso</span>
                    </span>
                  </span>
                  <span className="base"></span>
                  <span className="base"></span>
                </span>
              </span>
            </span>
          </span>
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex-display">
              <span className="katex">
                <span className="katex-html" aria-hidden="true">
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mord text">
                      <span className="mord">sua take</span>
                    </span>
                    <span className="mspace"></span>
                    <span className="mrel">?</span>
                    <span className="mspace"></span>
                  </span>
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mop">max</span>
                    <span className="mopen">(</span>
                    <span className="mord text">
                      <span className="mord">your score total</span>
                    </span>
                    <span className="mpunct">,</span>
                    <span className="mspace"></span>
                    <span className="mord">0</span>
                    <span className="mclose">
                      <span className="mclose">)</span>
                      <span className="msupsub">
                        <span className="vlist-t">
                          <span className="vlist-r">
                            <span className="vlist">
                              <span className="">
                                <span className="pstrut"></span>
                                <span className="sizing reset-size6 size3 mtight">
                                  <span className="mord mtight">2</span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </span>
          <span role="math" tabIndex={-1} className="!whitespace-normal">
            <span className="katex-display">
              <span className="katex">
                <span className="katex-html" aria-hidden="true">
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mord text">
                      <span className="mord">your %</span>
                    </span>
                    <span className="mspace"></span>
                    <span className="mrel">=</span>
                    <span className="mspace"></span>
                  </span>
                  <span className="base">
                    <span className="strut"></span>
                    <span className="mord">
                      <span className="mopen nulldelimiter"></span>
                      <span className="mfrac">
                        <span className="vlist-t vlist-t2">
                          <span className="vlist-r">
                            <span className="vlist">
                              <span className="">
                                <span className="pstrut"></span>
                                <span className="mord">
                                  <span className="mop">
                                    <span className="mop op-symbol small-op">
                                      ∑
                                    </span>
                                    <span className="msupsub">
                                      <span className="vlist-t vlist-t2">
                                        <span className="vlist-r">
                                          <span className="vlist">
                                            <span className="">
                                              <span className="pstrut"></span>
                                              <span className="sizing reset-size6 size3 mtight">
                                                <span className="mord text mtight">
                                                  <span className="mord mtight">
                                                    Todos os usuários
                                                  </span>
                                                </span>
                                              </span>
                                            </span>
                                          </span>
                                          <span className="vlist-s">​</span>
                                        </span>
                                        <span className="vlist-r">
                                          <span className="vlist">
                                            <span className=""></span>
                                          </span>
                                        </span>
                                      </span>
                                    </span>
                                  </span>
                                  <span className="mspace"></span>
                                  <span className="mord text">
                                    <span className="mord">levam</span>
                                  </span>
                                </span>
                              </span>
                              <span className="">
                                <span className="pstrut"></span>
                                <span className="frac-line"></span>
                              </span>
                              <span className="">
                                <span className="pstrut"></span>
                                <span className="mord">
                                  <span className="mord text">
                                    <span className="mord">sua tomada</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                            <span className="vlist-s">​</span>
                          </span>
                          <span className="vlist-r">
                            <span className="vlist">
                              <span className=""></span>
                            </span>
                          </span>
                        </span>
                      </span>
                      <span className="mclose nulldelimiter"></span>
                    </span>
                  </span>
                </span>
              </span>
            </span>
          </span>
          ​
        </div>
        <p>
          Para um torneio com um número suficientemente grande de perguntas
          independentes, este método de pontuação é efetivamente
          <a href="https://www.metaculus.com/help/scores-faq/#proper-scoring">
            apropriado
          </a>
          para o quartil superior dos meteorologistas. Embora existam pequenas
          imperfeições para os meteorologistas perto de uma pontuação de 0 peer
          para a qual eles podem ganhar um pouco de dinheiro ao superar suas
          previsões, acreditamos que este é um caso de borda que você pode
          ignorar com segurança. Em suma, você deve prever sua verdadeira crença
          em qualquer questão.
        </p>
        <p>
          Tomar o quadrado de suas pontuações peer em incentiva a previsão de
          todas as perguntas e previsões mais cedo. Não se esqueça de{" "}
          <b>seguir</b>
          um torneio para ser notificado sobre novas perguntas.
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="legacy-tournament-scores">
          Como é calculada a minha pontuação de torneio (legado), cobertura,
          Take, Prize e Rank?
        </h2>
        <p>
          <b>
            Este método de pontuação foi substituído em março de 2024 pelo New
            Tournament Score descrito acima. Ainda está em uso para torneios que
            foram concluídos antes de março de 2024 para alguns torneios que
            estavam em voo.
          </b>
        </p>
        <p>
          Sua pontuação de torneio é a soma de suas pontuações relativas a todas
          as perguntas do torneio. Se, em média, você fosse melhor do que a
          previsão da comunidade, então será positiva; caso contrário, será
          negativa.
        </p>
        <p>
          Sua cobertura de torneio é a média de sua cobertura em cada pergunta.
          Se você previu todas as perguntas quando elas abriram, sua Cobertura
          será de 100%. Se você previu todas as perguntas na metade do caminho,
          ou se você previu metade das perguntas quando elas abriram, sua
          Cobertura será de 50%.
        </p>
        <p>
          Seu torneio Take é o exponencial de sua pontuação, faz a sua
          cobertura:
        </p>
        <span role="math" tabIndex={-1} className="!whitespace-normal">
          <span className="katex-display">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord text">
                    <span className="mord">Take</span>
                  </span>
                  <span className="mspace"></span>
                  <span className="mrel">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord">
                    <span className="mord mathnormal">e</span>
                    <span className="msupsub">
                      <span className="vlist-t">
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="sizing reset-size6 size3 mtight">
                                <span className="mord text mtight">
                                  <span className="mord mtight">Score</span>
                                </span>
                              </span>
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                  </span>
                  <span className="mspace"></span>
                  <span className="mbin">?</span>
                  <span className="mspace"></span>
                </span>
                <span className="base">
                  <span className="strut"></span>
                  <span className="mord text">
                    <span className="mord">Cobertura</span>
                  </span>
                </span>
              </span>
            </span>
          </span>
        </span>
        <p>
          O seu prémio é quanto dinheiro ganhou nesse torneio. É proporcional à
          sua tomada e é igual ao seu Take dividido pela soma de todos os
          Previsores concorrentes.
        </p>
        <p>
          Seu Rank é simplesmente o quão alto você estava na tabela de
          classificação, classificado por Prêmio.
        </p>
        <p>
          Quanto maior a sua pontuação e cobertura, maior será o seu Take.
          Quanto maior a sua Take, mais o prêmio você receberá e maior será o
          seu Rank.
        </p>
        {/* <hr> */}
        <h2 className="scroll-mt-nav" id="hidden-period">
          Quais são os pesos ocultos e cobertura oculta?
        </h2>
        <p>
          A previsão comunitária é, em média, muito melhor do que a maioria dos
          meteorologistas. Isso significa que você pode obter pontuações
          decentes apenas copiando a previsão da comunidade em todos os
          momentos. Para evitar isso, muitas questões do torneio têm um período
          de tempo significativo no início, quando a previsão da comunidade está
          oculta. Nós chamamos esse tempo de período oculto.
        </p>
        <p>
          Para incentivar a previsão durante o período oculto, as perguntas às
          vezes também são configuradas para que a cobertura que você acumula
          durante o Período Oculto conte mais. Por exemplo, o Hidden Period pode
          contar para 50% da cobertura de perguntas, ou mesmo 100%. Nós chamamos
          essa porcentagem de peso de cobertura de período oculto.
        </p>
        <p>
          Se o peso da cobertura do período oculto for de 50%, então, se você
          não prever durante o período oculto, sua cobertura será no máximo 50%,
          independentemente de quanto tempo durou o período oculto.
        </p>
      </div>
    </PageWrapper>
  );
}
