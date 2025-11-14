import Image from "next/image";
import Link from "next/link";

import PageWrapper from "../components/pagewrapper";

export const metadata = {
  title: "Metaculus FAQ",
  description:
    "Frequently asked questions about Metaculus, including basics, question types, resolution processes, predictions, scoring, and more.",
};

export default function FAQ() {
  return (
    <PageWrapper>
      <div className="flex flex-col">
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">Noções básicas</h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatismetaculus">O que é o Metaculus?</a>
            </li>
            <li>
              <a href="#whatisforecasting">O que está prevendo?</a>
            </li>
            <li>
              <a href="#whenforecastingvaluable">
                Quando é que se prevê valioso?
              </a>
            </li>
            <li>
              <a href="#aim">Por que eu deveria ser um meteorologista?</a>
            </li>
            <li>
              <a href="#whocreated">Quem criou o Metaculus?</a>
            </li>
            <li>
              <a href="#whattournaments">
                O que são torneios e séries de perguntas do Metaculus?
              </a>
            </li>
            <li>
              <a href="#predmarket">Metaculus é um mercado de previsão?</a>
            </li>
            <li>
              <a href="#justpolling">As questões metabólicas são feitas?</a>
            </li>
          </ul>
        </div>
        {/* <hr> */}

        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Perguntas do Metaculus
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatsort">
                Que tipo de perguntas são permitidas e o que faz uma boa
                pergunta?
              </a>
            </li>
            <li>
              <a href="#whocreates">
                Quem cria as perguntas e quem decide quem é publicado?
              </a>
            </li>
            <li>
              <a href="#whoedits">Quem pode editar as perguntas?</a>
            </li>
            <li>
              <a href="#question-submission">
                Como posso colocar minha própria pergunta postada?
              </a>
            </li>
            <li>
              <a href="#pending-question">
                O que posso fazer se uma pergunta que apresentei estiver
                pendente há muito tempo?
              </a>
            </li>
            <li>
              <a href="#admins-resolution">
                O que posso fazer se uma pergunta for resolvida, mas não é?
              </a>
            </li>
            <li>
              <a href="#question-private">
                Onde estão minhas questões privadas?
              </a>
            </li>
            <li>
              <a href="#comments">
                Quais são as regras e diretrizes para comentários e discussões?
              </a>
            </li>
            <li>
              <a href="#definitions">
                O que significam &Quot;fonte credível&Quot; e &Quot;antes da
                data X&Quot; e tais frases?
              </a>
            </li>
            <li>
              <a href="#question-types">Que tipos de perguntas existem?</a>
            </li>
            <li>
              <a href="#question-groups">O que são grupos questionados?</a>
            </li>
            <li>
              <a href="#conditionals">O que são pares condicionais?</a>
            </li>
            <li>
              <a href="#navigation-and-filtering">
                Como posso encontrar certas perguntas sobre o Metaculus?
              </a>
            </li>
          </ul>
        </div>
        {/* <hr> */}

        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Resolução de perguntas
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#closers">
                O que são a &Quot;data aberta&Quot;, &Quot;data próxima&Quot; e
                &Quot;data de resolução?&Quot;
              </a>
            </li>
            <li>
              <a href="#timezone">A que fuso horário é usado para perguntas?</a>
            </li>
            <li>
              <a href="#who-resolves">
                Quem decide a resolução para uma pergunta?
              </a>
            </li>
            <li>
              <a href="#ambiguous-annulled">
                O que são resoluções &Quot;angíquas&Quot; e
                &Quot;anuladas&Quot;?
              </a>
            </li>
            <li>
              <a href="#allres">Todas as perguntas são resolvidas?</a>
            </li>
            <li>
              <a href="#whenresolve">Quando uma pergunta será resolvida?</a>
            </li>
            <li>
              <a href="#resolvebackground">
                O material de fundo é usado para resolução de perguntas?
              </a>
            </li>
            <li>
              <a href="#unclearresolve">
                O que acontece se os critérios de resolução de uma pergunta não
                forem claros ou subótimos?
              </a>
            </li>
            <li>
              <a href="#reresolve">Perguntas podem ser resolvidas?</a>
            </li>
            <li>
              <a href="#whatifres">
                O que acontece se uma pergunta for resolvida no mundo real antes
                do horário próximo?
              </a>
            </li>
            <li>
              <a href="#retroactive-closure">
                Quando uma pergunta deve especificar o fechamento retroativo?
              </a>
            </li>
            <li>
              <a href="#whatifres2">
                O que acontece se os critérios de resolução de uma pergunta
                forem cumpridos antes do horário de abertura?
              </a>
            </li>
            <li>
              <a href="#ressrc">
                O que acontece se uma fonte de resolução não estiver mais
                disponível?
              </a>
            </li>
            <li>
              <a href="#rescouncil">O que são os Conselhos de Resolução?</a>
            </li>
          </ul>
        </div>
        {/* <hr> */}

        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">As previsões de</h2>
          <ul className="space-y-1">
            <li>
              <a href="#tutorial">Existe um tutorial ou um passo a passo?</a>
            </li>
            <li>
              <a href="#howpredict">
                Como faço uma previsão? Posso mudar isso mais tarde?
              </a>
            </li>
            <li>
              <a href="#howwithdraw">Como posso retirar a minha previsão?</a>
            </li>
            <li>
              <a href="#range-interface">
                Como eu uso a interface de intervalo?
              </a>
            </li>
            <li>
              <a href="#community-prediction">
                Como é calculada a previsão comunitária?
              </a>
            </li>
            <li>
              <a href="#metaculus-prediction">
                O que é a previsão do Metaculus?
              </a>
            </li>
            <li>
              <a href="#public-figure">
                O que são previsões de figuras públicas?
              </a>
            </li>
            <li>
              <a href="#reaffirming">O que é “reafirmar” uma previsão?</a>
            </li>
          </ul>
        </div>
        {/* <hr> */}

        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Pontuações e Medalhas
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatscores">O que são pontuações?</a>
            </li>
            <li>
              <a href="#whatmedals">O que são medalhas?</a>
            </li>
          </ul>
        </div>
        {/* <hr> */}

        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Jornal do Metaculus
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatisjournal">O que é o Metaculus Journal?</a>
            </li>
            <li>
              <a href="#fortifiedessay">O que é um ensaio fortificado?</a>
            </li>
          </ul>
        </div>
        {/* <hr> */}

        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">Miscelânea</h2>
          <ul className="space-y-1">
            <li>
              <a href="#what-are-pros">
                O que são os Meteorologistas Metaculus Pro?
              </a>
            </li>
            <li>
              <a href="#api">Metaculus tem uma API?</a>
            </li>
            <li>
              <a href="#change-name">Como posso alterar meu nome de usuário?</a>
            </li>
            <li>
              <a href="#cant-comment">
                Registei uma conta. Por que não posso comentar sobre uma
                pergunta?
              </a>
            </li>
            <li>
              <a href="#suspensions">Entendendo as suspensões de contas</a>
            </li>
            <li>
              <a href="#cant-see">
                Por que posso ver a previsão da comunidade sobre algumas
                questões, a previsão do Metaculus sobre outros, e nenhuma
                previsão sobre alguns outros?
              </a>
            </li>
            <li>
              <a href="#related-news">O que é o NewsMatch?</a>
            </li>
            <li>
              <a href="#community-insights">O que são Insights Comunitários?</a>
            </li>
            <li>
              <a href="#domains">Posso ter o meu próprio Metaculus?</a>
            </li>
            <li>
              <a href="#spreadword">
                Como posso ajudar a divulgar o Metaculus?
              </a>
            </li>
            <li>
              <a href="#closeaccount">
                Como posso fechar minha conta e excluir minhas informações
                pessoais no Metaculus?
              </a>
            </li>
          </ul>
        </div>
        {/* <hr> */}

        <h2 className="scroll-mt-nav text-2xl font-bold" id="basics">
          Noções básicas
        </h2>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatismetaculus"
        >
          O que é o Metaculus?
        </h3>
        <p>
          O Metaculus é uma plataforma de previsão on-line e mecanismo de
          agregação que reúne uma comunidade de raciocínio global e mantém a
          pontuação de milhares de meteorologistas, oferecendo previsões
          agregadas otimizadas para aprendizado de máquina sobre tópicos de
          importância global. A comunidade de previsão Metaculus é muitas vezes
          inspirada por causas altruístas, e o Metaculus tem uma longa história
          de parcerias com organizações sem fins lucrativos, pesquisadores
          universitários e empresas para aumentar o impacto positivo de suas
          previsões.
        </p>
        <p>
          Metaculus, portanto, coloca questões sobre a ocorrência de uma
          variedade de eventos futuros, em muitas escalas de tempo, para uma
          comunidade de meteorologistas participantes - você!
        </p>
        <p>
          O nome &Quot;Metaculus&Quot; é inspirado no Mentaculus, um mapa de
          probabilidade fictício do universo, do filme dos irmãos Coen{" "}
          <a href="https://en.wikipedia.org/wiki/A_Serious_Man">
            A Serious Man
          </a>
          .
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatisforecasting"
        >
          O que está prevendo?
        </h3>
        <p>
          A previsão é uma prática sistemática de tentar responder perguntas
          sobre eventos futuros. No Metaculus, seguimos alguns princípios para
          elevar a previsão acima de adivinhação simples:
        </p>
        <p>
          Primeiro, as perguntas são cuidadosamente especificadas para que todos
          entendam de antemão e depois quais tipos de resultados estão incluídos
          na resolução e quais não estão. Os meteorologistas então dão
          probabilidades precisas que medem sua incerteza sobre o resultado.
        </p>
        <p>
          Em segundo lugar, o Metaculus agrega as previsões em uma previsão da
          comunidade com base na{""}
          <a href="https://en.wikipedia.org/wiki/Median">mediana</a>
          das previsões de usuários ponderadas pela atualidade.
          Surpreendentemente, a previsão comunitária é muitas vezes{""}
          <Link href="/questions/track-record/">
            melhor do que qualquer preditor individual!
          </Link>
          Este princípio é conhecido como{""}
          <a href="https://en.wikipedia.org/wiki/Wisdom_of_the_crowd">
            a sabedoria da multidão,
          </a>
          e tem sido demonstrado em Metaculus e por outros pesquisadores.
          Intuitivamente faz sentido, pois cada indivíduo tem informações e
          preconceitos separados que, em geral, se equilibram (desde que todo o
          grupo não seja tendencioso da mesma maneira).
        </p>
        <p>
          Em terceiro lugar, medimos a habilidade relativa de cada
          meteorologista, usando suas previsões quantificadas. Quando sabemos o
          resultado da pergunta, a questão é &Quot;resolvido&Quot;, e os
          previsores recebem suas pontuações. Ao rastrear essas pontuações de
          muitas previsões sobre diferentes tópicos durante um longo período de
          tempo, eles se tornam uma métrica cada vez melhor de quão bom é um
          determinado previsor. Essas pontuações fornecem aos aspirantes a
          meteorologistas um feedback importante sobre como eles fizeram e onde
          podem melhorar.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whenforecastingvaluable"
        >
          Quando é que se prevê valioso?
        </h3>
        <p>
          A previsão é de valor exclusivo, principalmente em problemas complexos
          e multivariáveis, ou em situações em que a falta de dados dificulta a
          previsão de modelos explícitos ou exatos.
        </p>
        <p>
          Nestes e outros cenários, as previsões agregadas de meteorologistas
          fortes oferecem uma das melhores maneiras de prever eventos futuros.
          De fato, o trabalho do cientista político Philip Tetlock demonstrou
          que as previsões agregadas foram capazes de superar os analistas de
          inteligência profissional com acesso a informações classificadas ao
          prever vários resultados geopolíticos.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="aim">
          Por que eu deveria ser um meteorologista?
        </h3>
        <p>
          A pesquisa mostrou que grandes meteorologistas vêm de várias origens –
          e muitas vezes de campos que não têm nada a ver com a previsão do
          futuro. Como muitas capacidades mentais, a previsão é um talento que
          persiste ao longo do tempo e é uma habilidade que pode ser
          desenvolvida. Feedback quantitativo constante e prática regular podem
          melhorar muito a precisão do previsor.
        </p>
        <p>
          Alguns eventos – como o tempo de eclipse e as eleições bem poluídas,
          muitas vezes podem ser previstos com alta resolução, por exemplo.
          99,9% é provável ou 3%. Outros – como o lançamento de uma moeda ou uma
          corrida de cavalos – não podem ser previstos com precisão; mas suas
          chances ainda podem ser. Metaculus visa tanto: fornecer uma geração
          central e ponto de agregação para previsões. Com isso em mãos,
          acreditamos que indivíduos, grupos, corporações, governos e humanidade
          como um todo tomarão decisões melhores.
        </p>
        <p>
          Além de valer a pena, o Metaculus pretende ser interessante e
          divertido, permitindo que os participantes acumulem suas proezas de
          previsão ecumulem um histórico para provar isso.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreated">
          Quem criou o Metaculus?
        </h3>
        <p>
          Metaculus se originou com dois cientistas pesquisadores, Anthony
          Aguirre e Greg Laughlin. Aguirre, um físico, é co-fundador do{""}
          <a href="https://fqxi.org/">The Foundational Questions Institute</a>,
          que catalisa pesquisas inovadoras em física fundamental, e do{""}
          <a href="https://futureoflife.org/">The Future of Life Institute</a>,
          que visa aumentar o benefício e a segurança de tecnologias disruptivas
          como a IA. Laughlin, um astrofísico, é um especialista em previsões
          dos milissegundos relevantes para a negociação de alta frequência para
          a estabilidade de longo prazo do sistema solar.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whattournaments"
        >
          O que são torneios e séries de perguntas do Metaculus?
        </h3>
        <h4 className="text-lg font-semibold">Torneios de Futebol</h4>
        <p>
          Os torneios Metaculus são organizados em torno de um tópico ou tema
          central. Os torneios são muitas vezes colaborações entre o Metaculus e
          uma organização sem fins lucrativos, ou outra organização que procura
          usar a previsão para apoiar a tomada de decisões efetiva. Você pode
          encontrar torneios atuais e arquivados em nossa{""}
          <Link href="/tournaments/">página Torneios</Link>.
        </p>
        <p>
          Os torneios são o lugar perfeito para provar suas habilidades de
          previsão, ao mesmo tempo em que ajudam a melhorar nossa capacidade de
          tomada de decisão coletiva. Prêmios em dinheiro e{""}
          <Link href="/help/medals-faq/">medalhas</Link>
          são <Link href="/help/medals-faq/">concedidos</Link>
          aos analistas mais precisos e, às vezes, para outras contribuições
          valiosas (como comentários). Siga um Torneio (com o botão Seguir) para
          nunca perder novas perguntas.
        </p>
        <p>
          Depois que pelo menos uma pergunta for resolvida, uma tabela de
          classificação aparecerá na página do torneio exibindo pontuações e
          classificações atuais. Um quadro de pontuação pessoal (&Quot;Minha
          Pontuação&Quot;) também aparecerá, detalhando seu desempenho para cada
          pergunta (veja{""}
          <Link href="/help/scores-faq/#tournament-scores">
            Como os torneios são marcados?
          </Link>
          ).
        </p>
        <p>
          No final de um torneio, o prêmio é dividido entre os meteorologistas
          de acordo com seu desempenho de previsão. Quanto mais você previsse e
          quanto mais precisas fossem suas previsões, maior a proporção do
          prêmio que você recebe.
        </p>
        <h4 className="text-lg font-semibold">
          Posso doar meus ganhos no torneio?
        </h4>
        <p>
          Se você tem excelentes ganhos em torneios, a Metaculus terá prazer em
          facilitar doações para várias organizações sem fins lucrativos,
          organizações de regratizações e fundos. Você pode encontrar a lista de
          organizações que facilitamos os pagamentos{""}
          <Link href="/questions/11556/donating-tournament-prizes/">aqui</Link>.
        </p>
        <h4 className="text-lg font-semibold">Série de perguntas</h4>
        <p>
          Como os torneios, as séries de perguntas são organizadas em torno de
          um tópico ou tema central. Ao contrário dos torneios, eles não têm uma
          premiação.
        </p>
        <p>
          A série de perguntas ainda mostra tabelas de classificação, para
          interesse e diversão. Mas não <b>not</b>
          concedem medalhas.
        </p>
        <p>
          Você pode encontrar todas as séries de perguntas em uma seção especial
          da <Link href="/tournaments/">página de torneios</Link>.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="predmarket">
          Metaculus é um mercado de previsão?
        </h3>
        <p>
          O Metaculus tem algumas semelhanças com um mercado de previsão, mas,
          em última análise, não é um. O Metaculus visa agregar informações,
          expertise e poder preditivo de muitas pessoas em previsões de alta
          qualidade. No entanto, os mercados de previsão geralmente operam
          usando moeda real ou virtual, onde os participantes compram (ou
          vendem) ações se acharem que os preços vigentes refletem uma
          probabilidade muito baixa (ou alta) de um evento ocorrer. O Metaculus,
          por outro lado, solicita diretamente probabilidades previstas de seus
          usuários e, em seguida, agrega essas probabilidades. Acreditamos que
          esse tipo de &#34;agregador de previses&#34; tem vantagens e
          desvantagens em relação a um mercado de previsões. mercado de
          previsão, e entraremos em detalhes sobre isso em nossa postagem do
          blog{" "}
          <i>
            <Link
              href="https://www.metaculus.com/notebooks/38198/metaculus-and-markets-whats-the-difference/"
              target="_blank"
            >
              Metaculus e Mercados: Qual a Diferença?
            </Link>
          </i>
          . Aqui está um gráfico dessa postagem com uma rápida visão geral:
        </p>

        <Image
          src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/metac-vs-markets.jpg"
          alt="Comparação de Metaculus e Mercados"
          className="my-4"
          width={700}
          height={207}
        />

        <h4 className="text-lg font-semibold">
          Vantagens do Metaculus em relação aos mercados de previsão
        </h4>
        <p>
          Metaculus tem várias vantagens sobre os mercados de previsão,
          descritos abaixo, mas queremos prefaciar isso dizendo que, apesar dos
          potenciais problemas com os mercados de previsão que descrevemos aqui,
          achamos que os mercados de previsão são valiosos, estamos satisfeitos
          que eles existem e ficariam felizes em ver mais uso deles.
        </p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            <b>Pobres incentivos para previsões de longo prazo.</b>
            Geralmente não é um bom uso de seus fundos para bloqueá-los em um
            mercado de previsão a longo prazo, uma vez que você geralmente pode
            obter retornos muito melhores investindo, o que significa que os
            mercados de longo prazo provavelmente terão baixa liquidez. Para um
            exemplo, veja{""}
            <a href="https://wip.gatspress.com/wp-content/uploads/2024/05/thu9F-cumulative-traded-volume-on-the-2020-us-election-4-1024x897.png">
              este gráfico
            </a>
            de um{""}
            <a href="https://worksinprogress.co/issue/why-prediction-markets-arent-popular/">
              artigo da Works in Progress
            </a>
            mostrando o volume de negociação na Betfair para a eleição
            presidencial dos EUA em 2020. Houve muito pouco volume muito antes
            da eleição, com a maior parte do volume de negociação ocorrendo
            apenas um mês fora da eleição.
          </li>
          <li>
            <b>Problemas com baixas probabilidades.</b>
            Os mercados de previsão têm atritos de mercado que os tornam menos
            úteis para baixas probabilidades. O retorno sobre o uso de seu
            dinheiro para trazer uma probabilidade de 2% a 1% é insignificante,
            ou potencialmente negativo se o mercado de previsão extrair uma taxa
            dos comerciantes. É por isso que você obtém resultados estranhos
            como Michelle Obama com 6% de chance de se tornar o candidato
            democrata para a eleição presidencial dos EUA de 2024 em junho de
            2024, como foi o caso{""}
            <a href="https://polymarket.com/event/democratic-nominee-2024?tid=1724174308005">
              da Polymarket
            </a>
            .
          </li>
          <li>
            <b>O foco nem sempre é a previsão.</b>
            Os incentivos de mercado de previsão nem sempre estão alinhados com
            as previsões mais precisas. Considere que um uso potencial para os
            mercados de previsão é proteger contra resultados arriscados. Além
            disso, as pessoas que são irracionais, mas dispostas a colocar uma
            tonelada de dinheiro por trás de suas crenças, podem distorcer o
            resultado. Claro, idealmente, um mercado líquido irá corrigir para
            estes smews, mas é possível que eles possam ter um efeito sobre o
            preço. Veja{""}
            <a href="https://asteriskmag.com/issues/05/prediction-markets-have-an-elections-problem-jeremiah-johnson">
              esta peça na revista Asterisk
            </a>
            para mais em &Quot;dinheiro burro&Quot; nos mercados de previsão.
          </li>
          <li>
            <b>O que as pessoas pensam que vai acontecer?</b>
            Os participantes dos mercados de previsão estão expressando se eles
            acham que a probabilidade é maior ou menor do que o preço de
            mercado, não fazendo uma previsão. Se alguém acha que o mercado é
            muito baixo em 35% e aposta em conformidade, você não sabe se eles
            acham que a probabilidade real é de 40% ou 80%. Isso realmente não
            afeta a utilidade do agregado, mas torna os dados menos ricos e
            informativos, e mais difícil ver a distribuição completa de
            previsões como você pode com os histogramas para perguntas binárias
            sobre Metaculus.
          </li>
          <li>
            <b>
              O desempenho individual do mercado nem sempre é uma indicação
              clara da habilidade de previsão.
            </b>
            Excelente desempenho do mercado individual pode apenas sinalizar
            proficiência em operar em mercados, ou capacidade de tirar proveito
            de apostas ruins feitas por outros. Por exemplo, veja{""}
            <a href="https://www.cspicenter.com/p/salem-tournament-5-days-in#:~:text=The%20first%20problem%20we%20saw%20was%20that%20there%20were%20some%20individuals%20who%20made%20a%20killing%20by%20taking%20advantage%20of%20those%20who%20did%20not%20know%20how%20the%20markets%20work%20(see%20discussion%20here).">
              este post
            </a>
            sobre um torneio organizado no Manifold, onde os comerciantes
            assumiram uma grande liderança inicial apenas devido ao uso
            inteligente de ordens de limite. Uma vez que o Metaculus provoca
            probabilidades individuais de cada meteorologista, podemos avaliar e
            recrutar excelentes meteorologistas.
          </li>
          <li>
            <b>
              O Metaculus funciona de forma comparável aos mercados sem a
              necessidade de gerenciar um portfólio.
            </b>
            Existem apenas algumas comparações de maçãs para maçãs entre
            plataformas, mas{""}
            <a href="https://www.metaculus.com/notebooks/15359/predictive-performance-on-metaculus-vs-manifold-markets/">
              estas
            </a>
            <a href="https://firstsigma.substack.com/p/midterm-elections-forecast-comparison-analysis">
              encontram
            </a>
            uma{""}
            <a href="https://www.astralcodexten.com/p/who-predicted-2023">
              vantagem
            </a>
            para o Metaculus sobre os mercados de previsão. Note que os tamanhos
            das amostras tendem a ser pequenos. No entanto, há também uma{""}
            <a href="https://calibration.city/">comparação indireta</a>
            (indireta porque não considera as mesmas perguntas entre
            plataformas) que descobriu que os mercados de previsão são mais
            calibrados.
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="justpolling">
          As questões metabólicas são as pesquisas?
        </h3>
        <p>
          - Não. - Não. A pesquisa de opinião pode ser uma maneira útil de
          avaliar o sentimento e as mudanças em um grupo ou cultura, mas muitas
          vezes não há uma única &Quot;resposta certa&Quot;, como em uma{""}
          <a href="https://news.gallup.com/poll/391547/seven-year-stretch-elevated-environmental-concern.aspx">
            pesquisa da Gallup
          </a>
          &Quot;Quão está preocupada com o meio ambiente?&Quot;
        </p>
        <p>
          Em contraste, as perguntas do Metaculus são projetadas para serem
          objetivamente resolúveis (como em{""}
          <Link href="/questions/9942/brent-oil-to-breach-140-before-may">
            Will Brent Crude Oil top $ 140 / barril antes de maio de 2022?
          </Link>
          ), e os meteorologistas não são solicitados por suas preferências, mas
          por suas previsões. Ao contrário de uma pesquisa, sobre muitas
          previsões, os participantes acumulam um histórico indicando sua
          precisão de previsão. Estes registros são incorporados na{""}
          <Link href="/faq/#metaculus-prediction">Previsão do Metaculus</Link>.
          A precisão do histórico do Metaculus em si é rastreada{""}
          <Link href="/questions/track-record/">aqui</Link>.
        </p>
        <h2
          className="scroll-mt-nav text-2xl font-bold"
          id="metaculus-questions"
        >
          Perguntas do Metaculus
        </h2>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whatsort">
          Que tipo de perguntas são permitidas e o que faz uma boa pergunta?
        </h3>
        <p>
          As perguntas devem centrar-se em factos tangíveis e objectivos sobre o
          mundo que são bem definidos e não uma questão de opinião. &quot;Quando
          os Estados Unidos entrarão em colapso?&quot; é uma questão pobre e
          ambígua;{""}
          <q>
            <Link href="/questions/8579/us-freedom-in-the-world-score-in-2050/">
              Qual será a pontuação dos EUA no Relatório Mundial da Liberdade
              para 2050?
            </Link>
          </q>
          Eles geralmente assumem a forma{""}
          <q>Será que X acontecerá por (data) Y?</q>
          ou <q>Quando ocorrerá (evento) X?</q>
          ou <q>Qual será o valor ou quantidade de X por (data) Y?</q>
        </p>
        <p>
          Uma boa pergunta será inequivocamente resolvida. Uma comunidade que
          leia os termos da questão deve ser capaz de concordar, antes e depois
          do evento, se o resultado satisfaz os termos da questão.
        </p>
        <p>As perguntas também devem seguir algumas regras óbvias:</p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            As perguntas devem respeitar a privacidade e não abordar a vida
            pessoal de figuras não públicas.
          </li>
          <li>
            As perguntas não devem ser diretamente potencialmente difamatórias
            ou geralmente de mau gosto.
          </li>
          <li>
            As perguntas nunca devem ter como objetivo prever a mortalidade de
            pessoas individuais ou mesmo de pequenos grupos. Em casos de
            interesse público (como nomeados por tribunais e figuras políticas),
            a questão deve ser formulada em outros termos mais diretamente
            relevantes, como &quot;quando X não servirá mais no tribunal&quot;
            ou &quot;não poderá concorrer ao cargo na data X&quot;. Quando o
            tópico é a morte (ou longevidade), as próprias perguntas devem
            tratar as pessoas de forma agregada ou hipoteticamente.
          </li>
          <li>
            De forma mais geral, as perguntas devem evitar ser escritas de uma
            forma que incentive atos ilegais ou prejudiciais – isto é,
            hipoteticamente, se alguém fosse motivado o suficiente por uma
            Questão Metaculo para influenciar o mundo real e mudar o resultado
            da resolução de uma questão, essas ações não devem ser inerentemente
            ilegais ou prejudiciais.
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreates">
          Quem cria as perguntas e quem decide quem é publicado?
        </h3>
        <p>
          Muitas perguntas são lançadas pela equipe do Metaculus, mas qualquer
          usuário logado pode propor uma pergunta. As questões propostas serão
          analisadas por um grupo de moderadores nomeados pelo Metaculus. Os
          moderadores selecionarão as melhores perguntas enviadas e ajudarão a
          editar a questão para serem claras, bem de origem e{""}
          <Link href="/question-writing/">
            alinhadas com nosso estilo de escrita
          </Link>
          .
        </p>
        <p>
          O Metaculus organiza questões sobre{""}
          <Link href="/questions/categories/">muitos tópicos</Link>, mas nossas
          principais áreas de foco são Ciência,{""}
          <Link href="/questions/?categories=technology">Tecnologia</Link>,{""}
          <Link href="/questions/?tags=effective-altruism">
            Altruísmo Eficaz
          </Link>
          ,{""}
          <Link href="/questions/?topic=ai">Inteligência Artificial</Link>,{""}
          <Link href="/questions/?topic=biosecurity">Saúde</Link>e{""}
          <Link href="/questions/?categories=geopolitics">Geopolítica</Link>.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whoedits">
          Quem pode editar as perguntas?
        </h3>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            Os Administradores podem editar todas as perguntas a qualquer
            momento (no entanto, uma vez que as previsões tenham começado, muito
            cuidado é tomado para não alterar os termos de resolução de uma
            pergunta, a menos que necessário).
          </li>
          <li>
            Os moderadores podem editar perguntas quando estão sendo pendência e
            na próxima (antes de começar as previsões).
          </li>
          <li>
            Os autores podem editar suas perguntas quando são rascunhos e
            pendentes.
          </li>
          <li>
            Os autores podem convidar outros usuários para editar perguntas que
            estão em Rascunho ou Pendente.
          </li>
        </ul>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-submission"
        >
          Como posso colocar minha própria pergunta postada?
        </h3>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            Se você tem uma ideia básica para uma pergunta, mas não tem tempo /
            energia para elaborar os detalhes, você pode enviá-lo, discuti-lo em
            nosso{""}
            <Link href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              tópico
            </Link>
            de{""}
            <Link href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              ideia
            </Link>
            de{""}
            <Link href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              pergunta
            </Link>
            ou em nosso{""}
            <a href="https://discord.gg/v2Bf5tppeT">canal Discord</a>.
          </li>
          <li>
            Se você tiver uma pergunta bastante completa, com pelo menos algumas
            referências vinculadas e critérios de resolução bastante esprecois e
            inequívocos, é provável que sua pergunta seja revisada e lançada
            rapidamente.
          </li>
          <li>
            O Metaculus organiza questões sobre{""}
            <Link href="/questions/categories/">muitos tópicos</Link>, mas
            nossas principais áreas de foco são Ciência,{""}
            <Link href="/questions/?categories=technology">Tecnologia</Link>,
            {""}
            <Link href="/questions/?tags=effective-altruism">
              Altruísmo Eficaz
            </Link>
            ,{""}
            <Link href="/questions/?topic=ai">Inteligência Artificial</Link>,
            {""}
            <Link href="/questions/?topic=biosecurity">Saúde</Link>e{""}
            <Link href="/questions/?categories=geopolitics">Geopolítica</Link>.
            Perguntas sobre outros tópicos, especialmente que exigem muito
            esforço de moderador para serem lançadas, receberão menor prioridade
            e podem ser adiadas até mais tarde.
          </li>
          <li>
            Consideramos as perguntas submetidas como sugestões e tomamos a mão
            livre na edição. Se você está preocupado em ter seu nome em uma
            pergunta que é alterada a partir do que você envia, ou gostaria de
            ver a pergunta antes de ser lançada, por favor, note isso na questão
            em si; as perguntas são escondidas da vista do público até que eles
            são dados &quot;apropostas&quot; e podem ser postadas anonimamente a
            pedido.
          </li>
        </ol>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="pending-question"
        >
          O que posso fazer se uma pergunta que apresentei estiver pendente há
          muito tempo?
        </h3>
        <p>
          Atualmente, recebemos um grande volume de envios de perguntas, muitas
          das quais são interessantes e bem escritas. Dito isto, tentamos
          aprovar perguntas suficientes para que cada um deles possa receber a
          atenção que merece de nossos meteorologistas. Metaculus prioriza
          questões sobre Ciência,{""}
          <Link href="/questions/?categories=technology">Tecnologia</Link>,{""}
          <Link href="/questions/?tags=effective-altruism">
            Altruísmo Eficaz
          </Link>
          ,{""}
          <Link href="/questions/?topic=ai">Inteligência Artificial</Link>,{""}
          <Link href="/questions/?topic=biosecurity">Saúde</Link>e{""}
          <Link href="/questions/?categories=geopolitics">Geopolítica</Link>. Se
          a sua pergunta se enquadra em uma dessas categorias, ou é de outra
          forma muito urgente ou importante, você pode nos marcar com os
          moderadores para chamar nossa atenção.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="admins-resolution"
        >
          O que posso fazer se uma pergunta for resolvida, mas não é?
        </h3>
        <p>
          Se uma pergunta ainda estiver esperando por uma resolução, verifique
          se não houve um comentário da equipe explicando o motivo do atraso. Se
          não tiver, você pode marcar a aadmins para alertar a equipe do
          Metaculus. Por favor, não use a tag ?admins mais de uma vez por semana
          sobre uma única pergunta ou resolução.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-private"
        >
          Onde estão minhas questões privadas?
        </h3>
        <p>
          As questões privadas estão descontinuadas, não é mais possível criar
          novas. Se você tinha questões privadas, ainda pode encontrá-las indo
          para a <Link href="/questions/">Página Inicial do Feed</Link>,
          selecionando &quot;Minhas questões e posts&quot; na barra lateral e
          usando o filtro especial &quot;Pessoal&quot;.
        </p>

        <h3 className="scroll-mt-nav text-xl font-semibold" id="comments">
          Quais são as regras e diretrizes para comentários e discussões?
        </h3>
        <p>
          Temos um conjunto completo de{""}
          <Link href="/help/guidelines/">diretrizes</Link>
          de <Link href="/help/guidelines/">etiqueta comunitária</Link>, mas em
          resumo:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>Os usuários são bem-vindos comentar sobre qualquer pergunta.</li>
          <li>
            Comentários e perguntas podem usar{""}
            <Link href="/help/markdown/">a formatação de markdown</Link>
          </li>
          <li>
            O Metaculus visa um alto nível de discurso. Os comentários devem ser
            sobre o tema, relevante e interessante. Os comentários não devem
            apenas indicar a opinião do autor (com exceção das previsões
            quantificadas). Comentários que são spam, agressivos, profanos,
            ofensivos, depreciativos ou assediadores não são tolerados, bem como
            aqueles que são explicitamente publicidade comercial ou aqueles que
            são de alguma forma ilegais. Veja os{""}
            <Link href="/terms-of-use/">termos de uso do</Link>
            Metaculus para mais
          </li>
          <li>
            Você pode fazer ping em outros usuários usando &quot;?nome de
            usuário&quot;, que enviará uma notificação a esse usuário (se eles
            definirem essa opção em suas configurações de notificação).
          </li>
          <li>
            Você está convidado a apoiar os comentários que contêm informações
            relevantes para a pergunta e pode relatar comentários que não
            defendem nossas <Link href="/help/guidelines/">diretrizes</Link>
            de <Link href="/help/guidelines/">etiqueta</Link>.
          </li>
          <li>
            Se um comentário for spam, inapropriado/ofensivo ou quebrar nossas
            regras, envie-nos um relatório (sob o &quot;...”menu).
          </li>
        </ul>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="definitions">
          O que significam &quot;fonte credível&quot; e &quot;antes da data
          X&quot; e tais frases?
        </h3>
        <p>
          Para reduzir a ambiguidade de forma eficiente, aqui estão algumas
          definições que podem ser usadas em perguntas, com um significado
          definido por este FAQ:
        </p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            Uma &#34;fonte credível&#34; será considerada um artigo publicado
            online ou impresso de uma fonte jornalística ou acadêmica,
            informações publicadas publicamente por uma fonte autorizada com
            conhecimento ou responsabilidade específica sobre o assunto ou, em
            geral, informações de uma fonte em que a preponderância de
            evidências sugere que a informação está correta — desde que, em
            todos os casos, não haja controvérsia significativa em torno de sua
            correção. Fontes confiáveis geralmente não incluem informações sem
            fontes encontradas em blogs, postagens em mídias sociais ou sites de
            indivíduos.
          </li>
          <li>
            A frase &quot;Antes [data X] será tomada como significando antes do
            primeiro momento em que [data X] se aplicaria, em UTC. Por exemplo,
            &quot;Antes de 2010&quot; será levado a significar antes da
            meia-noite de 1o de janeiro de 2010; &quot;Antes 30 de junho&quot;
            significaria antes da meia-noite (00:00:00) UTC 30 de junho.
            <ul className="ml-4 mt-2 list-inside list-disc space-y-2">
              <li>
                <strong>Nota:</strong>
                Anteriormente, esta seção era usada &quot;por [data x]&quot; em
                vez de &quot;antes de [data x]&quot;, no entanto,
                &quot;antes&quot; é muito mais clara e sempre deve ser usada em
                vez de &quot;por&quot;, quando possível.
              </li>
            </ul>
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="question-types">
          Que tipos de perguntas existem?
        </h3>
        <h4 className="text-lg font-semibold">Perguntas binárias</h4>
        <p>
          As perguntas binárias podem ser resolvidas como <strong>Sim</strong>
          ou <strong>No</strong>
          (a menos que os critérios de resolução estejam subespecificados ou de
          outra forma contorcidos, caso em que eles podem resolver como{""}
          <strong>ambíguos</strong>
          ). Perguntas binárias são apropriadas quando um evento pode ocorrer ou
          não ocorrer. Por exemplo, a questão{""}
          <Link href="/questions/6296/us-unemployment-above-5-through-nov-2021/">
            &quot;A taxa de desemprego dos EUA permanecerá acima de 5% até
            novembro de 2021?&quot;
          </Link>
          resolvido como <strong>Não</strong>
          porque a taxa de desemprego caiu abaixo de 5% antes do tempo
          especificado.
        </p>
        <h4 className="text-lg font-semibold">Perguntas de gama</h4>
        <p>
          As perguntas de intervalo resolvem um determinado valor e os analistas
          podem especificar uma distribuição de probabilidade para estimar a
          probabilidade de cada valor ocorrer. Perguntas de intervalo podem ter
          limites abertos ou fechados. Se os limites estiverem fechados, a
          probabilidade só pode ser atribuída a valores que se enquadram nos
          limites. Se um ou mais dos limites estiverem abertos, os
          meteorologistas podem atribuir probabilidade fora do limite, e a
          questão pode resolver como fora do limite.{""}
          <a href="#out-of-bounds-resolution">Veja aqui</a>
          para mais detalhes sobre os limites das perguntas do intervalo.
        </p>
        <p>
          A interface de intervalo permite que você insira várias distribuições
          de probabilidade com diferentes pesos.{""}
          <a href="#range-interface">Veja aqui</a>
          para mais detalhes sobre o uso da interface.
        </p>
        <p>
          Existem dois tipos de perguntas de alcance, perguntas numéricas de
          intervalo e perguntas de intervalo de datas.
        </p>
        <h5 className="text-lg font-semibold">Faixa numérica</h5>
        <p>
          Perguntas de alcance numérico podem ser resolvidas como um valor
          numérico. Por exemplo, a pergunta{""}
          <Link href="/questions/7346/initial-jobless-claims-july-2021/">
            &quot;O que será a média de 4 semanas de reclamações iniciais de
            desemprego (em milhares) arquivadas em julho de 2021?&quot;
          </Link>
          resolvida como <strong>395</strong>, porque a fonte subjacente relatou
          395 mil pedidos iniciais de desemprego para julho de 2021.
        </p>
        <p>
          As perguntas também podem resolver fora do intervalo numérico. Por
          exemplo, a questão{""}
          <Link href="/questions/6645/highest-us-core-cpi-growth-in-2021/">
            “O que será o mais alto nível de crescimento anualizado do IPC dos
            EUA, em 2021, de acordo com os EUA. Os dados do Bureau of Labor
            Statistics foram
          </Link>
          resolvidos como <strong>6,5</strong>
          porque a fonte subjacente relatou um crescimento de CPI de núcleo
          anualizado de 6,5% nos EUA, e 6,5 foi o limite superior.
        </p>
        <h5 className="text-lg font-semibold">Gama de data</h5>
        <p>
          Perguntas de intervalo de data podem ser resolvidas como uma
          determinada data. Por exemplo, a pergunta{""}
          <Link href="/questions/8723/date-of-next-who-pheic-declaration/">
            “Quando a próxima Emergência de Saúde Pública da Preocupação
            Internacional será declarada pela OMS?”
          </Link>
          resolvida como <strong>23 de julho de 2022</strong>, porque uma
          Emergência de Saúde Pública de Preocupação Internacional foi declarada
          nessa data.
        </p>
        <p>
          As perguntas também podem ser resolvidas fora do intervalo de datas.
          Por exemplo, a pergunta{""}
          <Link href="/questions/6947/first-super-heavy-flight/">
            “Quando um SpaceX Super Heavy Booster voará?”
          </Link>
          resolvido como 29 <strong>de março de 2022</strong>
          porque um propulsor Super Heavy da SpaceX não foi lançado antes de 29
          de março de 2022, que era o limite superior.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-groups"
        >
          O que são grupos questionados?
        </h3>
        <p>
          Os grupos de perguntas são conjuntos de perguntas relacionadas ou
          resultados de perguntas estreitamente relacionados, todos coletados em
          uma única página. Os meteorologistas podem prever de forma rápida e
          eficiente esses resultados interconectados, confiantes de que estão
          mantendo todas as suas previsões internamente consistentes.
        </p>
        <h4 className="text-lg font-semibold">
          Como os grupos de perguntas facilitam uma previsão mais eficiente e
          precisa?
        </h4>
        <p>
          Com os grupos de perguntas, é fácil prever distribuições
          progressivamente mais amplas no futuro que você prevê para refletir a
          crescente incerteza. Um grupo de perguntas que coleta várias questões
          binárias sobre um conjunto limitado de resultados ou sobre resultados
          mutuamente exclusivos torna mais fácil ver quais previsões estão em
          tensão umas com as outras.
        </p>
        <h4 className="text-lg font-semibold">
          O que acontece com as páginas de perguntas existentes quando elas são
          combinadas em um grupo de perguntas?
        </h4>
        <p>
          Quando as perguntas de previsão regulares são convertidas em
          &quot;subperguntas&quot; de um grupo de perguntas, as páginas
          originais são substituídas por uma única página de grupo de perguntas.
          Os comentários que antes viviam nas páginas de perguntas individuais
          são movidos para a seção de comentários da página de grupo
          recém-criada com uma nota indicando a mudança.
        </p>
        <h4 className="text-lg font-semibold">
          Preciso prever em cada resultado/subpergunta de um grupo de perguntas?
        </h4>
        <p>
          - Não. - Não. Os grupos de perguntas compreendem várias subquestões
          {""}
          <i>independentes</i>. Por essa razão, não há exigência de que você
          preveja todos os resultados dentro de um grupo.
        </p>
        <h4 className="text-lg font-semibold">
          Como são pontuados os grupos de perguntas?
        </h4>
        <p>
          Cada resultado ou subquestão é pontuada da mesma maneira que uma
          questão independente normal.
        </p>
        <h4 className="text-lg font-semibold">
          Por que não questionar as probabilidades de resultado do grupo em
          100%?
        </h4>
        <p>
          Mesmo que só possa haver um resultado para um determinado grupo de
          perguntas, a previsão da Comunidade funciona como para questões
          normais independentes. A Previsão da Comunidade ainda exibirá uma
          mediana ou um agregado ponderado das previsões em cada subpergunta,
          respectivamente. Essas medianas e agregados ponderados não são
          limitados a somar a 100%.
        </p>
        <p>
          O feedback dos grupos de perguntas pode ser fornecido no{""}
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            post
          </Link>
          de{""}
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            discussão
          </Link>
          do{""}
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            grupo
          </Link>
          de{""}
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            perguntas
          </Link>
          .
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="conditionals">
          O que são pares condicionais?
        </h3>
        <p>
          Um Pai Condicional é um tipo especial de{""}
          <Link href="/faq/#question-groups">Grupo</Link>
          de <Link href="/faq/#question-groups">Perguntas</Link>
          que provoca{""}
          <a href="https://en.wikipedia.org/wiki/Conditional_probability">
            probabilidades condicionais
          </a>
          . Cada Pair Condicional senta-se entre uma pergunta dos pais e uma
          pergunta da criança. Tanto o Pai quanto o Filho devem existir questões
          metaculus <Link href="/faq/#question-types">binárias</Link>.
        </p>
        <p>
          Os Pairs Condicionais fazem duas Perguntas Condicionais (ou
          &quot;Condicionais&quot; para abreviar), cada uma correspondendo a um
          possível resultado do Pai:
        </p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>Se o Pai resolver Sim, como o filho resolverá?</li>
          <li>Se o Pai resolver Não, como a criança resolverá?</li>
        </ol>
        <p>
          O primeiro condicional assume que &quot;O pai resolve o sim&quot; (ou
          &quot;se sim&quot; para breve). A segunda condição faz o mesmo para o
          No.
        </p>
        <p>
          Probabilidades condicionais são probabilidades, portanto, a previsão é
          muito semelhante às perguntas binárias. A principal diferença é que
          apresentamos ambos os condicionais próximos um do outro por
          conveniência:
        </p>
        {/* <img alt="The two conditionals next to each other"loading="lazy"width="730"height="75"decoding="async"data-nimg="1"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_2.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_2.jpg&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_2.jpg&amp;w=1920&amp;q=75"> */}
        <Image
          src="https://cdn.metaculus.com/conditional_faq_2.jpg"
          alt="The two conditionals next to each other"
          width={730}
          height={75}
        />
        <p>
          As perguntas condicionais são resolvidas automaticamente quando seus
          pais e filhos resolvem:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            Quando o pai resolve Sim, o condicional &quot;se não&quot; é{""}
            <Link href="/faq/#ambiguous-annulled">anulado</Link>. (E
            vice-versa.)
          </li>
          <li>
            Quando a criança se resolve, o condicional que não foi anulado
            resolve o mesmo valor.
          </li>
        </ul>
        <p>Vamos trabalhar com um exemplo:</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>O pai é &quot;vai chover hoje?&quot;.</li>
          <li>A criança é &quot;Voa chover amanhã?&quot;.</li>
        </ul>
        <p>Assim, os dois Condicionais no Par Condicional serão:</p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>&quot;Se chover hoje, vai chover amanhã?&quot;</li>
          <li>&quot;Se não chover hoje, vai chover amanhã?&quot;</li>
        </ol>
        <p>
          Para simplificar, o Metaculus apresenta questões condicionais
          graficamente. Na interface de previsão, eles estão em uma tabela:
        </p>
        {/* <img alt="The Conditional Pair forecasting interface"loading="lazy"width="754"height="253"decoding="async"data-nimg="1"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_3.jpg&amp;w=828&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_3.jpg&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_3.jpg&amp;w=1920&amp;q=75"> */}
        <Image
          src="https://cdn.metaculus.com/conditional_faq_3.jpg"
          alt="The Conditional Pair forecasting interface"
          width={754}
          height={253}
        />
        <p>
          E nos feeds, cada resultado possível do Pai é uma seta, e cada
          probabilidade condicional é uma barra:
        </p>
        {/* <img alt="The Conditional Pair feed tile"loading="lazy"width="746"height="142"decoding="async"data-nimg="1"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_1.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_1.jpg&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_1.jpg&amp;w=1920&amp;q=75"> */}
        <Image
          src="https://cdn.metaculus.com/conditional_faq_1.jpg"
          alt="The Conditional Pair feed tile"
          width={746}
          height={142}
        />
        <p>De volta ao exemplo:</p>
        <p>
          Chove hoje. Os pais resolvem sim. Isso desencadeia o segundo
          condicional (&quot;se Não&quot;) a ser anulado. Não é marcado.
        </p>
        <p>
          Você espera um dia. Desta vez não chove. A criança resolve não. Isso
          desencadeia o restante condicional (&quot;se sim&quot;) para resolver
          Não. É pontuado como uma pergunta binária normal.
        </p>
        <h4 className="text-lg font-semibold">
          Como faço para criar pares condicionais?
        </h4>
        <p>
          Você pode criar e enviar pares condicionais como qualquer outro tipo
          de pergunta. Na <Link href="/questions/create/">&quot;Criar uma</Link>
          pergunta &quot;página, selecione Tipo de pergunta &quot;par
          condicionado&quot; e selecione Perguntas de pais e filhos.
        </p>
        <p>
          Observação: Você pode usar subquestionagens de grupo de perguntas como
          Pai ou Filho clicando no botão Pai ou Criança e, em seguida,
          pesquisando a subpergunta no campo ou colando o URL para a
          subpergunta.
        </p>
        <p>
          Para copiar o URL de uma subpergunta, basta visitar uma página de
          grupo de perguntas e clicar no menu &quot;...&quot; para revelar a
          opção Copiar Link.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="navigation-and-filtering"
        >
          Como posso encontrar certas perguntas sobre o Metaculus?
        </h3>
        <p>
          As perguntas sobre Metaculus são classificadas por atividade por
          padrão. Perguntas mais recentes, perguntas com novos comentários,
          perguntas recentemente votadas e perguntas com muitas novas previsões
          aparecerão no topo da <Link href="/questions/">página inicial</Link>
          do <Link href="/questions/">Metaculus</Link>. No entanto, existem
          várias maneiras adicionais de encontrar questões de interesse e
          personalizar a maneira como você interage com o Metaculus.
        </p>
        <h4 className="scroll-mt-nav text-lg font-semibold" id="search-bar">
          Barra de pesquisa
        </h4>
        <p>
          A barra de pesquisa pode ser usada para encontrar perguntas usando
          palavras-chave e correspondências semânticas. Neste momento, não pode
          pesquisar comentários ou usuários.
        </p>
        <h4 className="scroll-mt-nav text-lg font-semibold" id="filters">
          Filtros de filtro
        </h4>
        <p>
          As perguntas podem ser classificadas e filtradas de maneira diferente
          do padrão usando o menu de filtros. As perguntas podem ser filtradas
          por tipo, status e participação. Perguntas também podem ser
          encomendadas, por exemplo, por &quot;mais novo&quot;. Observe que as
          opções disponíveis mudam quando filtros diferentes são selecionados.
          Por exemplo, se você filtrar por perguntas &quot;Fechado&quot;, será
          mostrado uma opção para encomendar por &quot;Soonest Resolve&quot;.
        </p>
        <h2
          className="scroll-mt-nav text-2xl font-bold"
          id="question-resolution"
        >
          Resolução de perguntas
        </h2>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="closers">
          O que são a &quot;data aberta&quot;, &quot;data próxima&quot; e
          &quot;data de resolução?&quot;
        </h3>
        <p>
          Ao enviar uma pergunta, você deve especificar a data de encerramento
          (quando a pergunta não estiver mais disponível para prever) e a data
          de resolução (quando a resolução ocorrer). A data em que a pergunta
          está definida ao vivo para que outros prevejam é conhecida como data
          de abertura.
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            A <strong>data de abertura</strong>é a data/hora em que a pergunta
            está aberta para previsões. Antes deste momento, se a questão
            estiver ativa, ela terá o status de &quot;prógrado&quot; e estará
            potencialmente sujeita a alterações com base no feedback. Após a
            data de abertura, a mudança de perguntas é altamente desencorajada
            (como poderia alterar os detalhes que são relevantes para as
            previsões que já foram enviadas) e essas mudanças são normalmente
            anotadas no corpo da questão e nos comentários sobre a questão.
          </li>
          <li>
            A <strong>data de fechamento</strong>é a data/tempo após o qual as
            previsões não podem mais ser atualizadas.
          </li>
          <li>
            A <strong>data de resolução</strong>é a data em que o evento
            previsto deve ter ocorrido definitivamente (ou não). Esta data
            permite que o Metaculus Admins saiba quando a pergunta pode estar
            pronta para ser resolvida. No entanto, isso geralmente é apenas um
            palpite e não é obrigatório de forma alguma.
          </li>
        </ul>
        <p>
          Em alguns casos, as perguntas devem ser resolvidas na data da
          resolução de acordo com as melhores informações disponíveis. Nesses
          casos, torna-se importante escolher cuidadosamente a data de
          resolução. Tente definir datas de resolução que tornam questões
          interessantes e perspicazes! A data ou período de tempo que a pergunta
          está fazendo deve ser sempre explicitamente mencionada no texto (por
          exemplo, &quot;esta questão resolve como o valor de X em 1o de janeiro
          de 2040, de acordo com a fonte Y&quot; ou &quot;esta pergunta resolve
          como{""}
          <strong>Sim</strong>
          se X acontecer antes de 1o de janeiro de 2040)&quot;.
        </p>
        <p>
          A data de encerramento <em>deve</em>
          ser pelo menos uma hora antes da data de resolução, mas pode ser muito
          mais cedo, dependendo do contexto. Aqui estão algumas diretrizes para
          especificar a data de fechamento:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            Se o resultado da questão for muito provável ou seguramente
            determinado em um horário fixo conhecido, o horário de fechamento
            deve ser imediatamente antes deste momento e o tempo de resolução
            logo após isso. (Exemplo: um concurso agendado entre concorrentes ou
            a divulgação de dados programados)
          </li>
          <li>
            Se o resultado de uma pergunta for determinado por algum processo
            que ocorrerá em um momento desconhecido, mas o resultado
            provavelmente será independente desse tempo, então deve ser
            especificado que a questão{""}
            <Link href="/faq/#retroactive-closure">fecha retroativamente</Link>
            algum tempo apropriado antes do início do processo. (Exemplo:
            sucesso de um lançamento de foguete ocorrendo em um momento
            desconhecido)
          </li>
          <li>
            Se o resultado de uma pergunta depende de um evento discreto que
            pode ou não acontecer, o tempo de fechamento deve ser especificado
            como logo antes do tempo de resolução. O tempo de resolução é
            escolhido com base na discrição do autor do período de interesse.
          </li>
        </ul>
        <p>
          <strong>Nota:</strong>A orientação anterior sugeriu que uma pergunta
          deve fechar entre 1/2 a 2/3 do caminho entre o tempo de abertura e o
          tempo de resolução. Isso foi necessário devido ao sistema de pontuação
          na época, mas foi substituído pelas diretrizes acima devido a uma{""}
          <Link href="/questions/10801/discontinuing-the-final-forecast-bonus/">
            atualização do sistema de pontuação
          </Link>
          .
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="timezone">
          A que fuso horário é usado para perguntas?
        </h3>
        <p>
          Para datas e horários escritos na pergunta, como &quot;o evento X
          acontecerá antes de 1o de janeiro de 2030?&quot;, se o fuso horário
          não for especificado{""}
          <a href="https://en.wikipedia.org/wiki/Coordinated_Universal_Time">
            Tempo Universal Coordenado (UTC)
          </a>
          será usado. Os autores da pergunta são livres para especificar um fuso
          horário diferente nos critérios de resolução, e qualquer fuso horário
          especificado no texto será usado.
        </p>
        <p>
          Para perguntas do <Link href="/faq/#question-types">intervalo</Link>
          de <Link href="/faq/#question-types">datas</Link>, as datas na
          interface estão em UTC. Normalmente, a hora do dia faz pouca
          diferença, pois um dia é minúsculo em comparação com a faixa completa,
          mas ocasionalmente para perguntas de curto prazo, a hora do dia pode
          afetar materialmente as pontuações. Se não estiver claro qual ponto em
          um período especificado uma questão de intervalo de data será
          resolvida, ela será resolvida como o{""}
          <Link href="/faq/#whenresolve">ponto médio desse período</Link>. Por
          exemplo, se uma pergunta diz que vai resolver como um determinado dia,
          mas não a que hora do dia, ele vai resolver como meio-dia UTC naquele
          dia.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="who-resolves">
          Quem decide a resolução para uma pergunta?
        </h3>
        <p>
          Somente os administradores do Metaculus podem resolver perguntas.
          Perguntas binárias podem resolver <strong>Sim</strong>,{""}
          <strong>Não</strong>,{""}
          <Link href="/faq/#ambiguous-annulled">Imbíguo ou Anugado</Link>. As
          perguntas de intervalo podem resolver um valor específico, um valor
          fora dos limites,{""}
          <Link href="/faq/#ambiguous-annulled">ambíguo ou anulado</Link>.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="ambiguous-annulled"
        >
          O que são resoluções &quot;angíquas&quot; e &quot;anuladas&quot;?
        </h3>
        <p>
          Algumas vezes uma questão não pode ser resolvida porque o estado do
          mundo, a <q>verdade da questão</q>, é muito incerto. Nesses casos, a
          questão é resolvida como ambígua.
        </p>
        <p>
          Outras vezes, o estado do mundo é claro, mas uma suposição fundamental
          da questão foi derrubada. Nestes casos, a questão é anulada.
        </p>
        <p>
          Da mesma forma, quando um condicional acaba por ser baseado em um
          resultado que não ocorreu, é anulado. Por exemplo, quando um pai do
          {""}
          <Link href="/faq/#conditionals">Par Condicional</Link>
          resolve Sim, o <q>se não</q>
          Condicional é Anular.
        </p>
        <p>
          Quando as perguntas são anuladas ou resolvidas como ambíguas, elas não
          estão mais abertas para previsão e não são pontuadas.
        </p>
        <p>
          <em>
            Se você quiser ler mais sobre por que resoluções ambíguas e anuladas
            são necessárias, você pode expandir a seção abaixo.
          </em>
        </p>
        <div>
          <p className="cursor-pointer font-semibold">
            Razões para resoluções ambíguas e anuladas
          </p>
          <div className="mt-2">
            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="reason-annulled"
            >
              Por que essa pergunta foi anulada ou resolvida como ambígua?
            </h3>
            <p>
              Uma resolução ambígua ou anulada geralmente implica que havia
              alguma ambiguidade inerente na questão, que eventos do mundo real
              subverteram uma das suposições da questão, ou que não há um
              consenso claro sobre o que de fato ocorreu. O Metaculus se esforça
              para satisfazer as resoluções de todas as questões, e sabemos que
              as resoluções ambíguas e anuladas são decepcionantes e
              insatisfatórias. No entanto, ao resolver questões, temos que
              considerar fatores como justiça a todos os analistas participantes
              e os incentivos subjacentes para previsões precisas.
            </p>
            <p>
              Para evitar essa injustiça e fornecer as informações mais
              precisas, resolvemos todas as perguntas de acordo com o texto
              escrito real dos critérios de resolução sempre que possível. Ao
              aderir o mais próximo possível de uma interpretação razoável do
              que está escrito nos critérios de resolução, minimizamos o
              potencial para os previsores chegarem a diferentes interpretações
              do que a pergunta está fazendo, o que leva a uma pontuação mais
              justa e melhores previsões. Nos casos em que o resultado de uma
              pergunta não corresponde claramente à direção ou suposições do
              texto dos critérios de resolução, a resolução ambígua ou a
              pergunta nos permite preservar a equidade na pontuação.
            </p>
            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="types-annulled"
            >
              Tipos de Resoluções Ambíguas ou Anulares
            </h3>
            <p>
              Os critérios de resolução de uma questão podem ser considerados
              semelhantes a um contrato legal. Os critérios de resolução criam
              um entendimento compartilhado do que os meteorologistas pretendem
              prever e definem o método pelo qual concordam em ser pontuados
              para precisão ao optar por participar. Quando dois meteorologistas
              que leram diligentemente os critérios de resolução de uma pergunta
              saem com percepções significativamente diferentes sobre o
              significado dessa questão, isso cria injustiça para pelo menos um
              desses meteorologistas. Se ambas as percepções são interpretações
              razoáveis do texto, então um desses meteorologistas provavelmente
              receberá uma pontuação ruim no momento da resolução sem culpa
              própria. Além disso, as informações fornecidas pelas previsões
              sobre a questão serão ruins devido às diferentes interpretações.
            </p>
            <p>
              As seções a seguir fornecem mais detalhes sobre as razões comuns
              pelas quais resolvemos as perguntas como ambíguas ou anuladas e
              alguns exemplos. Alguns desses exemplos podem se encaixar em
              várias categorias, mas nós os listamos em uma categoria principal
              como exemplos ilustrativos. Esta lista de tipos de resoluções
              ambíguas ou anuladas não é exaustiva - há outras razões pelas
              quais uma questão pode resolver ambígua ou anulada - mas estas
              cobrem alguns dos cenários mais comuns e alguns dos cenários mais
              complicados. Aqui está uma versão condensada, mas continue lendo
              para mais detalhes:
            </p>
            <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
              <li>
                <a href="#ambiguous-details">
                  <strong>Resolução ambígua</strong>
                </a>
                <strong>.</strong>
                Reservado para perguntas onde a realidade não é clara.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#no-clear-consensus">
                    <strong>Não há consenso claro</strong>
                  </a>
                  <strong>.</strong>
                  Não há informações suficientes para chegar a uma resolução
                  apropriada.
                </li>
              </ul>
              <li>
                <a href="#annulment-details">
                  <strong>A anulação</strong>
                </a>
                <strong>.</strong>
                Reservado para perguntas onde a realidade é clara, mas a questão
                não é.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#annulled-underspecified">
                    <strong>Subspecção sob especificação</strong>
                  </a>
                  <strong>.</strong>A questão não descrevia claramente um método
                  apropriado para resolver a questão.
                </li>
                <li>
                  <a href="#annulled-subverted">
                    <strong>Suposições subvertidas</strong>
                  </a>
                  <strong>.</strong>A questão fez com que suposições sobre o
                  estado presente ou futuro do mundo fossem violadas.
                </li>
                <li>
                  <a href="#annulled-imbalanced">
                    <strong>
                      Resultados desequilibrados e incentivos consistentes
                    </strong>
                  </a>
                  <strong>.</strong>A questão binária não especificou
                  adequadamente um meio para a resolução Sim ou Não, levando a
                  resultados desequilibrados e incentivos ruins.
                </li>
              </ul>
            </ul>
            <p>
              <strong>Nota:</strong>
              Anteriormente Metaculus tinha apenas um tipo de resolução -
              ambíguo - para casos em que uma pergunta não poderia ser resolvida
              de outra forma. Desde então, separamos isso em dois tipos –
              ambíguos e anulados – para fornecer clareza sobre a razão pela
              qual uma questão não poderia ser resolvida de outra forma. As
              perguntas denunciam tornou-se uma opção em abril de 2023.
            </p>
            <h4
              className="scroll-mt-nav text-lg font-semibold"
              id="ambiguous-details"
            >
              Resolução ambígua
            </h4>
            <p>
              A resolução ambígua é reservada para questões em que a realidade
              não é clara. Ou porque a reportagem sobre um evento é conflitante
              ou não está claro sobre o que realmente aconteceu, ou o material
              disponível é silencioso sobre as informações que estão sendo
              procuradas. Descrevemos os tipos de perguntas em que a resolução
              ambígua é apropriada, pois aquelas com{""}
              <a href="#no-clear-consensus">nenhum consenso claro</a>.
            </p>
          </div>
        </div>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="no-clear-consensus"
        >
          Sem consenso claro
        </h5>
        <p>
          As perguntas também podem resolver ambígua quando não há informações
          suficientes disponíveis para chegar a uma resolução apropriada. Isso
          pode ser devido a relatos conflitantes ou obscuros da mídia, ou porque
          uma fonte de dados que deveria fornecer informações de resolução não
          está mais disponível. A seguir estão alguns exemplos em que não houve
          consenso claro.
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/9459/russian-troops-in-kiev-in-2022/">
              <strong>
                <em>
                  Tropas russas entrarão em Kiev, Ucrânia antes de 31 de
                  dezembro de 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pergunta foi feita se pelo menos 100 soldados russos
                entrariam na Ucrânia antes do final de 2022. Era claro que
                algumas tropas russas entraram na Ucrânia, e até mesmo provável
                que houvesse mais de 100 tropas russas na Ucrânia. No entanto,
                não havia evidências claras que pudessem ser usadas para
                resolver a questão, por isso era necessário resolver como
                ambígua. Além da falta de um consenso claro, esta questão é
                também um exemplo de resultados desequilibrados e a necessidade
                de preservar os incentivos.{""}
                <Link href="/questions/9459/russian-troops-in-kiev-in-2022/#comment-93915">
                  Como um administrador explica aqui
                </Link>
                , devido à incerteza em torno dos eventos em fevereiro, a
                questão não poderia permanecer aberta para ver se um evento de
                qualificação aconteceria antes do final de 2022. Isso ocorre
                porque a ambiguidade em torno dos eventos em fevereiro exigiria
                que a questão só pudesse resolver como Sim ou Ambíguo, o que
                cria um incentivo para prever com confiança em um resultado do
                Sim.
              </li>
            </ul>
          </li>
          <li>
            <Link
              href="/questions/10134/average-ransomware-kit-cost-in-2022/"
              target="_blank"
              rel="noopener"
            >
              <strong>
                <em>
                  Qual será o custo médio de um kit de ransomware em 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta questão baseou-se em dados publicados num relatório da
                Microsoft, no entanto, o relatório da Microsoft para o ano em
                questão já não continha os dados relevantes. É{""}
                <Link href="/faq/#ressrc">a política do Metaculus</Link>
                que, por padrão, se uma fonte de resolução não estiver
                disponível, o Metaculus pode usar uma fonte funcionalmente
                equivalente em seu lugar, a menos que especificado de outra
                forma no texto da resolução, mas para essa questão uma pesquisa
                de fontes alternativas não apareceu em nada, levando à resolução
                ambígua.
              </li>
            </ul>
          </li>
        </ul>
        <h4
          className="scroll-mt-nav text-lg font-semibold"
          id="annulment-details"
        >
          A anulação
        </h4>
        <p>
          Anular uma pergunta é reservado para situações em que a realidade é
          clara, mas a questão não. Em outras palavras, a questão não conseguiu
          capturar adequadamente um método para uma resolução clara.
        </p>
        <p>
          <strong>Nota:</strong>A anulação foi introduzida em abril de 2023,
          então, enquanto os seguintes exemplos descrevem a anulação, as
          questões da realidade foram resolvidas como ambíguas.
        </p>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-underspecified"
        >
          A questão foi subespecitada
        </h5>
        <p>
          Escrever boas perguntas de previsão é difícil, e só fica mais difícil
          quanto mais longe a questão olha para o futuro. Para eliminar
          completamente o potencial de uma pergunta anulada, os critérios de
          resolução devem antecipar todos os resultados possíveis que possam
          ocorrer no futuro; em outras palavras, deve haver uma direção clara de
          como a questão se resolve em todos os resultados possíveis. A maioria
          das perguntas, mesmo as muito bem trabalhadas, não pode considerar{""}
          <em>todos os</em>
          resultados possíveis. Quando ocorre um resultado que não corresponde
          às instruções fornecidas nos critérios de resolução da questão, então
          essa questão pode ter que ser anulada. Em alguns casos, podemos ser
          capazes de encontrar uma interpretação que seja claramente adequada
          para os critérios de resolução, mas isso nem sempre é possível.
        </p>
        <p>
          Aqui estão alguns exemplos de anulação devido a perguntas
          subespecificadas:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/12433/substacks-google-trends-at-end-of-2022/">
              <strong>
                <em>
                  O que o índice Google Trends da Substack será no final de
                  2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Essa questão não especificou claramente como as tendências do
                Google seriam usadas para chegar ao índice médio para dezembro
                de 2022, porque o valor do índice depende do intervalo de datas
                especificado no Google Trends. Um administrador forneceu mais
                detalhes neste{""}
                <Link href="/questions/12433/substacks-google-trends-at-end-of-2022/#comment-112592">
                  comentário
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/">
              <strong>
                <em>Quando um reator de fusão vai atingir a ignição?</em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta questão não definiu claramente o que se entende por
                “ignição”. Como um administrador descrito neste{""}
                <Link href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/#comment-110164">
                  comentário
                </Link>
                , a definição de ignição pode variar dependendo dos
                pesquisadores que a utilizam e do método de fusão, bem como do
                quadro de referência para o que conta como entrada e saída de
                energia.
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/12532/russia-general-mobilization-before-2023/">
              <strong>
                <em>
                  A Rússia ordenará uma mobilização geral até 1o de janeiro de
                  2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pergunta feita sobre a Rússia ordenar uma mobilização
                geral, mas a difícil tarefa de determinar que uma mobilização
                geral foi ordenada não foi adequadamente abordada nos critérios
                de resolução. O texto da pergunta foi questionado sobre uma
                “mobilização geral”, mas as definições utilizadas nos critérios
                de resolução diferiam do entendimento comum de uma “mobilização
                geral” e não explicaram adequadamente a mobilização parcial real
                que acabou sendo ordenada, como{""}
                <Link href="/questions/12532/russia-general-mobilization-before-2023/">
                  explicado por um administrador aqui
                </Link>
                .
              </li>
            </ul>
          </li>
        </ul>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-subverted"
        >
          As suposições da pergunta são subvertidas
        </h5>
        <p>
          As perguntas muitas vezes contêm suposições em seus critérios de
          resolução, muitos dos quais não são declarados. Por exemplo, supondo
          que a metodologia subjacente de uma fonte de dados permanecerá a
          mesma, assumindo que uma organização fornecerá informações sobre um
          evento ou assumindo que um evento se desenrolaria de uma certa
          maneira. A melhor prática é especificar o que acontece no caso de
          certas suposições serem violadas (inclusive especificando que a
          questão será anulada em certas situações), mas devido à dificuldade em
          antecipar esses resultados nem sempre é feito.
        </p>
        <p>
          Aqui estão alguns exemplos de anulação devido a suposições
          subvertidas:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/10444/cause-of-flight-5735-crash/">
              <strong>
                <em>
                  Será que um problema técnico será identificado como a causa do
                  acidente do voo 5735 da China Eastern Airlines?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta questão baseou-se nas conclusões de um futuro relatório do
                National Transportation Safety Board (NTSB). No entanto, foi um
                incidente chinês, por isso era improvável que o NTSB publicasse
                tal relatório. Além disso, a questão não especificou uma data em
                que o relatório deve ser publicado, resultando numa resolução de
                No. Uma vez que isso não foi especificado e a suposição de um
                futuro relatório do NTSB foi violada, a questão foi oununciada,
                como{""}
                <Link href="/questions/10444/cause-of-flight-5735-crash/">
                  explicado por um administrador aqui
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/6249/november-2021-production-of-semiconductors/">
              <strong>
                <em>
                  Qual será o índice de produção industrial do Federal Reserve
                  para novembro de 2021, para semicondutores, placas de circuito
                  impresso e produtos relacionados?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta questão não forneceu uma descrição de como deve ser
                resolvida no caso de a fonte subjacente ter mudado a sua
                metodologia. Previa a possibilidade de o período base mudar, no
                entanto, toda a metodologia usada para construir a série mudou
                antes que essa questão fosse resolvida, não apenas o período
                base. Como a suposição não escrita de uma metodologia
                consistente foi violada, a questão foi anulada.
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/10048/russia-to-return-to-nuclear-level-1/">
              <strong>
                <em>
                  Quando a escala de prontidão nuclear da Rússia retornará ao
                  Nível 1?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                A reportagem da mídia sobre o nível de prontidão nuclear da
                Rússia deu a impressão de que o nível havia sido alterado para o
                nível 2, levando à criação dessa questão. No entanto, uma
                investigação mais completa descobriu que a prontidão nuclear da
                Rússia provavelmente não mudou. Isso violou a suposição da
                questão que levou à questão de ser anulada, como{""}
                <Link href="/questions/10048/russia-to-return-to-nuclear-level-1/#comment-100275">
                  explicado por um administrador aqui
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/9000/us-social-cost-of-carbon-in-2022/">
              <strong>
                <em>
                  Qual será o custo social da administração de Biden de 1
                  tonelada de CO2 em 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta questão especificava que resolveria de acordo com um
                relatório publicado pelo Grupo de Trabalho Interagency dos EUA
                (IWG), no entanto, o IWG não publicou uma estimativa antes do
                final de 2022. Esta questão antecipou este resultado e
                especificou adequadamente que deveria ser anulada se nenhum
                relatório foi publicado antes do final de 2022, e a questão foi
                resolvida em conformidade.
              </li>
            </ul>
          </li>
        </ul>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-imbalanced"
        >
          Resultados desequilibrados e incentivos consistentes
        </h5>
        <p>
          Por vezes, as perguntas implicam resultados desequilibrados, por
          exemplo, onde o ônus da prova para um evento a ser considerado como
          tendo ocorrido é alto e inclina as escalas para uma questão binária
          resolvendo Não, ou onde a questão exigiria uma quantidade substancial
          de pesquisa para mostrar que um evento ocorreu, o que também favorece
          uma resolução de No. Em certas circunstâncias, esses tipos de
          perguntas são boas, desde que haja um mecanismo claro para a questão
          resolver como Sim e resolver como Não. No entanto, às vezes as
          perguntas são formuladas de tal forma que não há mecanismo claro para
          uma questão resolver como Não, levando os únicos resultados realistas
          a ser uma resolução de Sim ou Anulado. Isso cria um viés na questão e
          também produz incentivos ruins se a questão não for anulada.
        </p>
        <p>
          O caso de resultados desequilibrados e incentivos consistentes é
          melhor explicado com exemplos, como os seguintes:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/6047/1m-lost-in-prediction-market/">
              <strong>
                <em>
                  Algum mercado de previsão fará com que os usuários percam pelo
                  menos US $ 1 milhão antes de 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Essa pergunta pergunta pergunta se certos incidentes como
                hacking, golpes ou resolução incorreta levam os usuários a
                perder US $ 1 milhão ou mais de um mercado de previsão. No
                entanto, não há um mecanismo claro especificado para encontrar
                informações sobre isso, já que os mercados de previsão não são
                comumente objeto de relatórios da mídia. Provar concretamente
                que isso não ocorreu exigiria uma extensa pesquisa. Isso cria um
                desequilíbrio nos critérios de resolução. A questão resolveria
                como Sim se houvesse um relatório claro de fontes credíveis de
                que isso ocorreu. No entanto, para resolver como não, seria
                necessária uma extensa pesquisa para confirmar que não ocorreu e
                um conhecimento dos acontecimentos nos mercados de previsão que
                a maioria das pessoas não possui. Resolver como Não Metaculus
                teria que fazer uma quantidade absurda de pesquisa, ou assumir
                que a falta de relatórios proeminentes sobre o tema é suficiente
                para resolver como Não. Neste caso, a questão tinha que ser
                anulada.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  Agora considere se houve um relatório claro de que isso
                  realmente ocorreu. Em um mundo onde isso aconteceu, a questão
                  poderia ter sido resolvida como Sim. No entanto, os usuários
                  experientes que seguem nossos métodos no Metaculus podem
                  perceber que quando um mecanismo para uma resolução Sem não é
                  claro, essa questão resolverá como Sim ou será anulada. Isso
                  cria incentivos ruins, já que esses analistas experientes
                  podem começar a aumentar a probabilidade de resolução do Sim
                  em previsões semelhantes futuras, à medida que meta-prevem
                  como o Metaculo lida com essas questões. Por esta razão, as
                  perguntas binárias devem ter um mecanismo claro de como elas
                  se resolvem como Sim e Não. Se o mecanismo não for claro, pode
                  criar incentivos ruins. Qualquer dúvida sem um mecanismo claro
                  para resolver como ambos os resultados possíveis deve ser
                  anulada, mesmo que ocorra um evento de qualificação que
                  resolveria a questão como Sim.
                </li>
              </ul>
            </ul>
          </li>
          <li>
            <Link href="/questions/13521/any-ftx-depositor-to-get-anything-out-by-2023/">
              <strong>
                <em>
                  Algum depositante restante do FTX retirará qualquer quantidade
                  de ativos negociáveis da FTX antes de 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pergunta se um depositante FTX retiraria os ativos onde a
                retirada foi liquidada pelo FTX. Infelizmente, essa questão
                exigia um conhecimento dos detalhes das retiradas do FTX que não
                estavam disponíveis para os Admins, resultando em não haver
                mecanismo real para resolver a questão como No. Isso levou a um
                desequilíbrio nos possíveis resultados, onde a questão só
                poderia realmente resolver como sim ou ser anulada. O
                desequilíbrio exigiu que a questão fosse resolvida como ambígua
                para preservar incentivos consistentes para a previsão.
              </li>
            </ul>
          </li>
        </ul>
        <div>
          <h3 id="allres" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            Todas as perguntas são resolvidas?
          </h3>
          <p>Atualmente, todas as perguntas serão resolvidas.</p>
        </div>
        <div>
          <h3
            id="whenresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Quando uma pergunta será resolvida?
          </h3>
          <p>
            As perguntas serão resolvidas quando tiverem satisfeito os critérios
            especificados na seção de resolução da questão (ou, inversamente,
            quando esses critérios não foram cumpridos de forma conclusiva).
            Cada pergunta também tem uma &quot;Data de Resolução&quot; listada
            em nosso sistema para fins como classificação de perguntas; no
            entanto, esta data listada geralmente não é mais do que uma
            aproximação, e a data real da resolução pode não ser conhecida com
            antecedência.
          </p>
          <p>
            Para perguntas que perguntam quando algo acontecerá (como{""}
            <q>
              <Link href="/questions/3515/when-will-the-first-humans-land-successfully-on-mars/">
                Quando os primeiros humanos pousarão com sucesso em Marte?
              </Link>
            </q>
            ), Os meteorologistas são solicitados a prever a data / hora em que
            os critérios foram satisfeitos (embora a questão possa ser decidida
            e os pontos concedidos em algum momento posterior, quando a
            evidência é conclusiva). Algumas perguntas predizem intervalos de
            tempo gerais, como &quot;Em qual mês o desemprego passará abaixo de
            4%?&quot;; Quando tal pergunta especificou a data / hora que será
            usada, esses termos serão usados. Se esses termos não forem dados, a
            política de inadimplência será resolvê-la como ponto{""}
            <strong>médio desse período</strong>
            (por exemplo, se o relatório de janeiro for o primeiro mês de
            desemprego abaixo de 4%, a data da resolução será inadimplência para
            15 de janeiro).
          </p>
        </div>
        <div>
          <h3
            id="resolvebackground"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O material de fundo é usado para resolução de perguntas?
          </h3>
          <p>
            Não, apenas os critérios de resolução são relevantes para resolver
            uma pergunta, a seção de fundo destina-se apenas a fornecer
            informações e contexto potencialmente úteis para os analistas. Numa
            pergunta bem especificada, os critérios de resolução devem manter-se
            por si próprios como um conjunto de instruções auto-suficientes para
            resolver a questão. Em casos raros ou perguntas mais antigas sobre o
            Metaculus, o material de fundo pode ser necessário para informar a
            resolução, mas as informações nos critérios de resolução substituem
            informações conflitantes no material de fundo.
          </p>
          <p>
            Ainda assim, queremos que o material de fundo seja o mais útil
            possível e capture com precisão o contexto e as informações
            relevantes disponíveis no momento em que a pergunta foi escrita,
            então, se você ver erros ou informações enganosas no contexto de uma
            pergunta, por favor, informe os Administradores marcando os aadmins
            em um comentário!
          </p>
        </div>
        <div>
          <h3
            id="unclearresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que acontece se os critérios de resolução de uma pergunta não
            forem claros ou subótimos?
          </h3>
          <p>
            Nós tomamos o cuidado de lançar perguntas que são tão claramente
            especificadas quanto possível. Ainda assim, escrever perguntas
            claras e objetivamente resolúveis é um desafio e, em alguns casos,
            os critérios de resolução de uma pergunta podem involuntariamente
            permitir múltiplas interpretações diferentes ou podem não
            representar com precisão a pergunta que está sendo feita. Ao decidir
            como abordar questões que foram lançadas com essas deficiências, os
            Administradores consideram principalmente a justiça aos
            meteorologistas. Emitir esclarecimentos ou edições para questões
            abertas pode prejudicar algumas pontuações do previsor quando o
            esclarecimento altera significativamente o significado da questão.
            Com base em uma avaliação da equidade e outros fatores, os
            Administradores podem emitir um esclarecimento para uma pergunta
            aberta para melhor especificar o significado. Isso geralmente é mais
            apropriado quando uma pergunta não está aberta há muito tempo (e,
            portanto, as previsões podem ser atualizadas com impacto
            insignificante para as pontuações), quando uma pergunta contém
            critérios inconsistentes ou conflitantes, ou quando o esclarecimento
            adiciona especificidade quando anteriormente não havia nenhuma de
            uma maneira que evita mudanças substanciais no significado.
          </p>
          <p>
            Em muitos casos, essas questões devem ser resolvidas como{""}
            <a href="#ambiguous-annulled">ambíguas ou anuladas</a>
            para preservar a equidade na pontuação. Se você acredita que há
            ambiguidades ou conflitos nos critérios de resolução para uma
            pergunta, por favor, deixe os Administradores saberem, marcando os
            aadmins em um comentário. Esperamos que as inconsistências possam
            ser identificadas o mais cedo possível na vida de uma questão para
            que possam ser abordadas. As alegações de critérios de resolução
            pouco claras feitas para questões que já tenham sido encerradas ou
            reivindicações de resolução incorreta para questões que já tenham
            sido resolvidas serão mantidas em um padrão mais alto de evidência
            se a(s) questão(s) com os critérios de resolução não foi mencionada
            anteriormente, enquanto a questão estava aberta à previsão.
          </p>
        </div>
        <div>
          <h3
            id="reresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Perguntas podem ser resolvidas?
          </h3>
          <p>
            Sim, às vezes as perguntas são resolvidas e descobertas
            posteriormente, essas resoluções estavam erradas, dadas as
            informações disponíveis no momento. Algumas perguntas podem até
            especificar que elas serão resolvidas de acordo com relatórios
            iniciais ou resultados, mas especificam a re-resolução no caso de os
            resultados finais discordarem dos resultados iniciais (por exemplo,
            perguntas sobre eleições podem usar esse mecanismo para permitir
            feedback rápido para os analistas, mas chegar à resposta correta no
            caso raro de que a chamada eleitoral inicial estava errada). As
            perguntas podem ser resolvidas em tais casos se o Metaculus
            determinar que a re-resolução é apropriada.
          </p>
        </div>
        <div>
          <h3
            id="whatifres"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que acontece se uma pergunta for resolvida no mundo real antes do
            horário próximo?
          </h3>
          <p>
            Ao resolver uma pergunta, o Moderador tem a opção de alterar o tempo
            de fechamento efetivo de uma pergunta, de modo que, se a questão for
            resolvida inequivocamente antes do horário de fechamento, o horário
            de fechamento pode ser alterado para um tempo antes da qual a
            resolução é incerta.
          </p>
          <p>
            Quando uma pergunta se fecha cedo, os pontos atribuídos são{""}
            <em>apenas</em>
            aqueles acumulados até o (novo) horário de fechamento. Isso é
            necessário para continuar marcando &quot;adeto&quot; (ou seja,
            recompensar ao máximo prever a probabilidade certa) e evitar o jogo
            de pontos, mas isso significa que os pontos gerais (positivos ou
            negativos) podem acabar sendo menores do que o esperado.
          </p>
        </div>
        <div>
          <h3
            id="retroactive-closure"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Quando uma pergunta deve especificar o fechamento retroativo?
          </h3>
          <p>
            Em alguns casos, quando o momento de um evento é desconhecido, pode
            ser apropriado alterar a data de encerramento para um horário antes
            da questão ser resolvida, após o conhecimento da resolução. Isso é
            conhecido como fechamento retroativo. O encerramento retroativo não
            é permitido, exceto no caso de um evento em que o momento do evento
            é desconhecido e o resultado do evento é independente do momento do
            evento, conforme descrito nas diretrizes de fechamento de perguntas
            acima. Quando o momento do evento impacta o resultado do evento, o
            fechamento retroativo violaria a pontuação adequada. Para que a
            pontuação seja uma questão adequada só deve fechar retroativamente
            quando o resultado for independente do momento do evento. Aqui estão
            alguns exemplos:
          </p>
          <ul className="ml-5 list-disc">
            <li>
              A data de um lançamento de foguete pode variar frequentemente com
              base nas janelas de lançamento e no clima, e o sucesso ou fracasso
              do lançamento é principalmente independente de quando o lançamento
              ocorre.{""}
              <strong>Neste caso, o encerramento retroactivo é adequado</strong>
              , uma vez que é muito improvável que o momento do lançamento afete
              as previsões para o sucesso do lançamento.
            </li>
            <li>
              Em alguns países, as eleições podem ser convocadas antes do
              previsto (estes são conhecidos como{""}
              <a href="https://en.wikipedia.org/wiki/Snap_election">
                eleições antecipadas
              </a>
              ). O momento das eleições antecipadas é muitas vezes até o partido
              no poder, e as eleições são muitas vezes agendadas em um momento
              em que o partido em exercício considera favorável às suas
              perspectivas. <strong>Neste caso</strong>,{""}
              <strong>o fechamento retroativo é apropriado</strong>, pois o
              momento da eleição afetará as previsões para o resultado da
              eleição, violando a pontuação adequada.
            </li>
            <li>
              Anteriormente, algumas perguntas sobre o Metaculus foram aprovadas
              com cláusulas de fechamento retroativas inapropriadas. Por
              exemplo, a pergunta{""}
              <Link href="/questions/6662/date-earth-functional-satellites-exceed-5000/">
                &quot;Quando o número de satélites artificiais funcionais em
                órbita excederá 5.000?&quot;
              </Link>
              especifica o fechamento retroativo até a data em que o satélite
              5.001 é lançado.{""}
              <strong>
                Neste caso, <ins>o</ins>
                fechamento retroativo <ins>não</ins>
                era apropriado
              </strong>
              , porque a resolução da questão dependia da data de fechamento,
              uma vez que ambos se baseavam no número de satélites lançados.
            </li>
          </ul>
          <p>
            Os meteorologistas geralmente gostam de fechamento retroativo porque
            impede que os pontos sejam truncados quando um evento ocorre antes
            da data de fechamento originalmente agendada. Mas, para obter as
            melhores previsões, é importante seguir as regras de pontuação
            adequadas. Para mais informações sobre truncamento{""}
            <Link href="/help/scores-faq/#score-truncation">de</Link>
            pontos
            <Link href="/help/scores-faq/#score-truncation">
              , esta seção do FAQ
            </Link>
            .
          </p>
          <p>
            Embora o Metaculus tente não aprovar perguntas que especifiquem o
            fechamento retroativo inadequado, às vezes as perguntas novas ou
            existentes especificam. É política do Metaculus ignorar o fechamento
            retroativo inadequado ao resolver questões.
          </p>
        </div>
        <div>
          <h3
            id="whatifres2"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que acontece se os critérios de resolução de uma pergunta forem
            cumpridos antes do horário de abertura?
          </h3>
          <p>
            Nossos moderadores e autores questionam se esforçam para ser o mais
            claro e informado possível sobre cada questão, mas os erros
            ocasionalmente acontecem e serão decididos pelo melhor julgamento de
            nossos Admins. Para uma pergunta hipotética como{""}
            <q>
              Will, uma detonação nuclear ocorrerá em uma cidade japonesa até
              2030?
            </q>
            pode ser entendido pelo senso comum que estamos perguntando sobre a
            {""}
            <em>próxima</em>
            detonação após as detonações em 1945. Em outras questões como{""}
            <q>
              <Link href="/questions/8946/facebook-uses-explainable-news-feed-by-2026/)">
                Will, o Facebook implementa um recurso para explicar as
                recomendações
              </Link>
            </q>
            do <q></q>
            de <q></q>, estamos perguntando sobre a <em>primeira</em>
            ocorrência deste evento. Uma vez que esse evento ocorreu antes da
            abertura da questão e isso não era conhecido pelo autor da pergunta,
            a questão se resolveu de forma ambígua.
          </p>
        </div>
        <div>
          <h3 id="ressrc" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            O que acontece se uma fonte de resolução não estiver mais
            disponível?
          </h3>
          <p>
            Há momentos em que a intenção de uma questão é rastrear
            especificamente as ações ou declarações de organizações ou pessoas
            específicas (como “quantos Votos Eleitorais vencerão na Eleição
            Presidencial dos EUA 2020 de{""}
            <em>acordo com o Colégio Eleitoral”</em>
            ); em outros momentos, estamos interessados apenas na verdade real,
            e aceitamos uma fonte de resolução como sendo uma aproximação
            aceitável (como, “quantas mortes por COVID-19 haverá nos EUA em
            2021). Dito isto, em muitos casos não está claro o que se pretende.
          </p>
          <p>
            Idealmente, todas as perguntas seriam escritas com linguagem
            maximamente clara, mas algumas ambiguidades são inevitáveis. Salvo
            indicação específica em contrário, se uma fonte de resolução for
            julgada pelos Admins do Metaculus como extinta, obsoleta ou
            inadequada, os Administradores farão o melhor esforço para
            substituí-la por um equivalente funcional. As perguntas podem
            exagerar essa política com linguagem como &quot;Se [essa fonte] não
            estiver mais disponível, a questão resolverá ambiguamente&quot; ou
            &quot;Esta pergunta rastreia publicações por [essa fonte],
            independentemente de publicações de outras fontes&quot;.
          </p>
        </div>
        <div>
          <h3
            id="rescouncil"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que são os Conselhos de Resolução?
          </h3>
          <p>
            O Metaculus usa Conselhos de Resolução para reduzir a probabilidade
            de resoluções ambíguas para questões importantes – aquelas que
            sentimos que têm o potencial de estar no 1% superior de todas as
            questões na plataforma em termos de impacto.
          </p>
          <p>
            Um Conselho de Resolução é um indivíduo ou grupo que é designado
            para resolver uma questão. As questões do Conselho de resolução são
            resolvidas na autoridade do indivíduo ou indivíduos identificados
            nos critérios de resolução. Esses indivíduos identificarão a
            resolução que melhor se alinha com a questão e seus critérios de
            resolução.
          </p>
          <p>
            Se um membro do Conselho de Resolução não estiver disponível para
            resolver uma pergunta, o Metaculus pode escolher uma substituição
            adequada.
          </p>
        </div>
        {/* <hr> */}

        <div>
          <h2
            id="predictions"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            As previsões de
          </h2>
        </div>
        <div>
          <h3
            id="tutorial"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Existe um tutorial ou um passo a passo?
          </h3>
          <p>Estamos trabalhando para recriar o tutorial.</p>
        </div>
        <div>
          <h3
            id="howpredict"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Como faço uma previsão? Posso mudar isso mais tarde?
          </h3>
          <p>
            Você faz uma previsão simplesmente deslizando o controle deslizante
            na página da pergunta para a probabilidade de a maioria capturar a
            probabilidade de que o evento ocorra.
          </p>
          <p>
            Você pode revisar sua previsão a qualquer momento até que a questão
            se feche, e você é encorajado a fazê-lo: à medida que novas
            informações vêm à tona, é benéfico levá-la em conta.
          </p>
        </div>
        <div>
          <h3
            id="howwithdraw"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Como posso retirar a minha previsão?
          </h3>
          <p>
            Se você fez uma previsão sobre uma pergunta e ela ainda está aberta
            para prever, você pode retirar sua previsão pressionando o botão
            &quot;retirar&quot;. Para perguntas de grupo, o botão
            &quot;retirar&quot; está aninhado no menu &quot;...&quot; ao lado da
            opção que você deseja retirar.
          </p>
          {/* <img alt="Prediction Interface"loading="lazy"width="700"height="400"decoding="async"data-nimg="1"className="my-4"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fwithdraw_button.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fwithdraw_button.jpg&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fwithdraw_button.jpg&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/withdraw_button.jpg"
            alt="Prediction Interface"
            className="my-4"
            width={700}
            height={400}
          />
          <p>
            Depois de se retirar, você não tem mais uma previsão para essa
            pergunta. Claro, depois de se retirar, você pode fazer uma nova
            previsão a qualquer momento e começar a acumular pontuações
            novamente. Concretamente, isso significa que, a partir do momento em
            que você se retirou e até fazer uma nova previsão:
          </p>
          <div className="text-gray-700 dark:text-gray-400">
            <ul className="list-disc pl-5">
              <li>
                Você para de acumular pontuações, incluindo escores de pares,
                pontuações de linha de base, etc.
              </li>
              <li>
                Você para de acumular Cobertura para os rankings de Pares.
              </li>
              <li>
                Você não faz parte da previsão comunitária ou de outros
                agregados.
              </li>
            </ul>
          </div>
          <p>
            Nenhum desses comportamentos é retroativo: você ainda obtém
            pontuações e cobertura por horas até que você se retirou, e suas
            previsões passadas não são removidas da previsão da comunidade.
          </p>
          <p>
            Vamos trabalhar com um exemplo. Uma pergunta de 5 dias tem 3
            meteorologistas, Alex, Bailey e Cedar, que fazem essas previsões:
          </p>
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  O dia
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1 em (&quot;
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  3
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  4
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  5
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Alex (tradução
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey (tradução
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  60%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  60%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  60%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark"></td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark"></td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Ceddro
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark"></td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  20%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  20%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  20%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  20%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Previsão da comunidade
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  70%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  60%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  60%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  50%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  50%
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            Como você pode ver, Bailey se retira no final do terceiro dia, e
            Cedar só se junta ao segundo dia. Isso muda a previsão da comunidade
            no dia 4: agora é de 50%. Mas isso não altera retroativamente a
            previsão da Comunidade no dia 2: continua a ser 60% no dia 2.
          </p>
          <p>
            Para completar o exemplo, digamos que a questão resolve Sim. Aqui
            estão as pontuações e coberturas que cada meteorologista receberá
            para cada dia:
          </p>
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  O dia
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1 em (&quot;
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  3
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  4
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  5
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Alex (tradução
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +14</div>
                    <div>Par de pares: +6</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +14</div>
                    <div>Peer: +17</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +14</div>
                    <div>Peer: +17</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +14</div>
                    <div>Peer: +28</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +14</div>
                    <div>Peer: +28</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +70</div>
                    <div>Par: +96</div>
                    <div>Cobertura: 1.0</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey (tradução
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +5</div>
                    <div>Peer: -6</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +5</div>
                    <div>Peer: +8</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +5</div>
                    <div>Peer: +8</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: 0</div>
                    <div>Peer: 0 (Em jogo)</div>
                    <div>Cobertura: 0</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: 0</div>
                    <div>Peer: 0 (Em jogo)</div>
                    <div>Cobertura: 0</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: +15</div>
                    <div>Peer: +10</div>
                    <div>Cobertura: 0,6</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Ceddro
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: 0</div>
                    <div>Peer: 0 (Em jogo)</div>
                    <div>Cobertura: 0</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: - 17</div>
                    <div>Peer: - 25</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: - 17</div>
                    <div>Peer: - 25</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: - 17</div>
                    <div>Peer: -28</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: - 17</div>
                    <div>Peer: -28</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Linha de base: -68</div>
                    <div>Peer: -106</div>
                    <div>Cobertura: 0.8</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            Bailey não obteve nenhuma pontuação nos dias 4 e 5 quando foi
            retirado, assim como Cedar não obteve nenhum placar para o primeiro
            dia antes de fazer sua primeira previsão.
          </p>
          <p>
            Para ver rapidamente quais perguntas você já previu, retirou ou
            ainda tem uma previsão permanente, há filtros no menu de filtro:
          </p>
          {/* <img alt="Search Filters"loading="lazy"width="700"height="500"decoding="async"data-nimg="1"className="my-4"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fsearch_filters.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fsearch_filters.jpg&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fsearch_filters.jpg&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/search_filters.jpg"
            alt="Search Filters"
            className="my-4"
            width={700}
            height={500}
          />
          <p>
            E as retiradas aparecem como cruzamentos nos gráficos da linha do
            tempo:
          </p>
          {/* <img alt="Prediction Interface"loading="lazy"width="300"height="300"decoding="async"data-nimg="1"className="my-4"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Ftimeline_withdraw.jpg&amp;w=384&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Ftimeline_withdraw.jpg&amp;w=640&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Ftimeline_withdraw.jpg&amp;w=640&amp;q=75"> */}
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/timeline_withdraw.jpg"
            alt="Prediction Interface"
            className="my-4"
            width={300}
            height={300}
          />
        </div>
        <div>
          <h3
            id="range-interface"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Como eu uso a interface de intervalo?
          </h3>
          <p>
            Algumas perguntas do Metaculus permitem entradas numéricas ou de
            intervalo de data, onde você especifica a distribuição de
            probabilidade que você acha que provavelmente está em uma possível
            gama de resultados. Esta distribuição de probabilidade é conhecida
            como uma{""}
            <a href="https://en.wikipedia.org/wiki/Probability_density_function">
              função
            </a>
            de{""}
            <a href="https://en.wikipedia.org/wiki/Probability_density_function">
              densidade de probabilidade
            </a>
            e é a probabilidade por unidade de comprimento. A função de
            densidade de probabilidade pode ser usada para determinar a
            probabilidade de um valor cair dentro de um intervalo de valores.
          </p>
          <p>
            Quando você paira sobre o gráfico, você vê as probabilidades em cada
            ponto na parte inferior do gráfico. Por exemplo, na imagem abaixo
            você pode ver a densidade de probabilidade no valor 136, denotado
            por &quot;P(x - 136)&quot;, e você pode ver a densidade de
            probabilidade que você e a comunidade atribuíram a esse ponto (na
            imagem o usuário atribuiu uma densidade de probabilidade de 1,40 a
            esse valor e a comunidade atribuiu uma densidade de probabilidade de
            2,97).
          </p>
          {/* <img alt="Prediction Interface"loading="lazy"width="769"height="773"decoding="async"data-nimg="1"className="my-4"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Finterface.png&amp;w=828&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Finterface.png&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Finterface.png&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://raw.githubusercontent.com/ryooan/faq/main/static/img/interface.png"
            alt="Prediction Interface"
            className="my-4"
            width={769}
            height={773}
          />
          <p>
            Ao selecionar o menu suspenso &quot;Probabilidade de Densidade&quot;
            no topo do gráfico, você pode alterar a exibição para
            &quot;Probabilidade cumulativa&quot;. Esta exibição mostra a{""}
            <a href="https://en.wikipedia.org/wiki/Cumulative_distribution_function">
              função de distribuição cumulativa
            </a>
            , ou em outras palavras, para qualquer ponto, mostra a probabilidade
            de você e a comunidade terem atribuído à questão resolvendo abaixo o
            valor indicado. Por exemplo, na imagem abaixo você pode ver a
            probabilidade de que você e a comunidade tenham atribuído à questão
            resolvendo abaixo do valor de 136, denotado por &quot;P(x -
            136)&quot;. A probabilidade de o usuário ter atribuído é de 7% para
            a questão que resolve abaixo desse valor, enquanto a comunidade
            atribuiu uma chance de 83% à questão resolvendo abaixo desse valor.
          </p>
          {/* <img alt="Cumulative Interface"loading="lazy"width="771"height="776"decoding="async"data-nimg="1"className="my-4"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Fcumulative.png&amp;w=828&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Fcumulative.png&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Fcumulative.png&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://raw.githubusercontent.com/ryooan/faq/main/static/img/cumulative.png"
            alt="Cumulative Interface"
            className="my-4"
            width={771}
            height={776}
          />
          <p>
            As linhas verticais mostradas nos gráficos indicam as previsões do
            percentil 25, mediana e do percentil 75, respectivamente, do usuário
            e da comunidade. Esses valores também são mostrados para o usuário e
            a comunidade na tabela na parte inferior.
          </p>
        </div>
        <div>
          <h4
            id="out-of-bounds-resolution"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Resolução Fora dos Limites
          </h4>
          <p>
            Na tabela mostrando as previsões na parte inferior das imagens
            acima, você verá que, além do percentil 25, mediana e probabilidades
            do percentil 75, há também um rotulado como &quot;500&quot;. Esta
            questão tem um limite superior aberto, o que significa que os
            analistas podem atribuir uma probabilidade de que a questão será
            resolvida como um valor acima da extremidade superior do intervalo
            especificado. Para a pergunta descrita acima, a comunidade e o
            previsor atribuem uma probabilidade de 1% à questão que resolve
            acima do limite superior.
          </p>
          <p>
            As perguntas podem ter limites abertos ou fechados em uma das
            extremidades do intervalo especificado.
          </p>
        </div>
        <div>
          <h4
            id="closed-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Limites fechados
          </h4>
          <p>
            Um limite fechado significa que os analistas são impedidos de
            atribuir uma probabilidade além do intervalo especificado. Limites
            fechados são apropriados quando uma pergunta não pode ser resolvida
            fora do intervalo. Por exemplo, uma pergunta perguntando qual a
            parcela de votos que um candidato terá com um intervalo de 0 a 100
            deve ter limites fechados, porque não é possível que a questão seja
            resolvida fora do intervalo. Os limites fechados restringem os
            meteorologistas de atribuir probabilidades fora do intervalo
            especificado.
          </p>
        </div>
        <div>
          <h4
            id="open-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Limites abertos
          </h4>
          <p>
            Um limite aberto permite que uma pergunta seja resolvida fora do
            intervalo. Por exemplo, uma pergunta perguntando qual parte do voto
            um candidato obterá com uma faixa de 30 a 70 deve ter limites
            abertos, porque é possível que o candidato possa obter menos de 30%
            dos votos ou mais de 70%. Limites abertos devem ser especificados
            mesmo que seja improvável que a participação de votos esteja fora do
            intervalo, porque é teoricamente possível que as ações de voto fora
            do intervalo especificado possam ocorrer.
          </p>
          <p>
            Os meteorologistas podem atribuir probabilidades fora do intervalo
            quando o limite está aberto movendo o controle deslizante todo o
            caminho para um lado. O peso também pode ser reduzido ou aumentado
            para ajustar a probabilidade atribuída a uma resolução fora dos
            limites.
          </p>
        </div>
        <div>
          <h4
            id="multiple-components"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Múltiplos componentes
          </h4>
          <p>
            Nas imagens mostradas acima, você pode ver que o usuário atribuiu
            duas distribuições de probabilidade. Até cinco distribuições
            logísticas podem ser adicionadas usando o botão &quot;Adicionar
            componente&quot;. O peso relativo de cada um pode ser ajustado
            usando o controle deslizante &quot;peso&quot; abaixo de cada
            componente.
          </p>
        </div>
        <div>
          <h3
            id="community-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Como é calculada a previsão comunitária?
          </h3>
          <p>
            A previsão da comunidade é um consenso das previsões recentes. Ele é
            projetado para responder a grandes mudanças na opinião do
            meteorologista, enquanto ainda é bastante insensível a outliers.
          </p>
          <p>Aqui está o detalhe matemático:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              Mantenha apenas a previsão mais recente de cada meteorologista.
            </li>
            <li>
              Atribuir-lhes um número{""}
              <span role="math" tabIndex={-1} className="!whitespace-normal">
                <span className="katex">
                  <span className="katex-html" aria-hidden="true">
                    <span className="base">
                      <span className="strut"></span>
                      <span className="mord mathnormal">n</span>
                    </span>
                  </span>
                </span>
              </span>
              , do mais antigo ao mais novo (o mais antigo é{""}
              <span role="math" tabIndex={-1} className="!whitespace-normal">
                <span className="katex">
                  <span className="katex-html" aria-hidden="true">
                    <span className="base">
                      <span className="strut"></span>
                      <span className="mord">1</span>
                    </span>
                  </span>
                </span>
              </span>
              1).
            </li>
            <li>
              Peso cada um por{""}
              <span role="math" tabIndex={-1} className="!whitespace-normal">
                <span className="katex">
                  <span className="katex-html" aria-hidden="true">
                    <span className="base">
                      <span className="strut"></span>
                      <span className="mord mathnormal">w</span>
                      <span className="mopen">(</span>
                      <span className="mord mathnormal">n</span>
                      <span className="mclose">)</span>
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
                                    <span className="mord mtight">
                                      <span className="mord sqrt mtight">
                                        <span className="vlist-t vlist-t2">
                                          <span className="vlist-r">
                                            <span className="vlist">
                                              <span className="svg-align">
                                                <span className="pstrut"></span>
                                                <span className="mord mtight">
                                                  <span className="mord mathnormal mtight">
                                                    n
                                                  </span>
                                                </span>
                                              </span>
                                              <span className="">
                                                <span className="pstrut"></span>
                                                <span className="hide-tail mtight">
                                                  <svg
                                                    width="400em"
                                                    height="1.08em"
                                                    viewBox="0 0 400000 1080"
                                                    preserveAspectRatio="xMinYMin slice"
                                                  >
                                                    <path
                                                      d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"
                                                    ></path>
                                                  </svg>
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
              ​ antes de ser agregada.
            </li>
            <ul className="ml-5 list-disc">
              <li>
                Para <Link href="/faq/#question-types">questões binárias</Link>,
                a previsão comunitária é uma{""}
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  mediana ponderada
                </a>
                das probabilidades do previsor individual.
              </li>
              <li>
                Para{""}
                <Link href="/faq/#question-types">
                  questões de múltipla escolha
                </Link>
                , a previsão comunitária é uma{""}
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  mediana ponderada
                </a>
                das probabilidades do previsor individual, renormalizada para a
                soma 1 e respeita os limites de{""}
                <span role="math" tabIndex={-1} className="!whitespace-normal">
                  <span className="katex">
                    <span className="katex-html" aria-hidden="true">
                      <span className="base">
                        <span className="strut"></span>
                        <span className="mopen">[</span>
                        <span className="mord">0.001</span>
                        <span className="mpunct">0,001,</span>
                        <span className="mspace"></span>
                        <span className="mord">0.999</span>
                        <span className="mclose">]</span>
                      </span>
                    </span>
                  </span>
                </span>
                ].
              </li>
              <li>
                Para{""}
                <Link href="/faq/#question-types">
                  as perguntas numéricas e data
                </Link>
                , a previsão comunitária é uma{""}
                <a href="https://en.wikipedia.org/wiki/Mixture_distribution">
                  média ponderada
                </a>
                das distribuições de previsores individuais.
              </li>
            </ul>
            <li>
              A forma particular dos pesos significa que aproximadamente{""}
              <span role="math" tabIndex={-1} className="!whitespace-normal">
                <span className="katex">
                  <span className="katex-html" aria-hidden="true">
                    <span className="base">
                      <span className="strut"></span>
                      <span className="mord sqrt">
                        <span className="vlist-t vlist-t2">
                          <span className="vlist-r">
                            <span className="vlist">
                              <span className="svg-align">
                                <span className="pstrut"></span>
                                <span className="mord">
                                  <span className="mord mathnormal">N</span>
                                </span>
                              </span>
                              <span className="">
                                <span className="pstrut"></span>
                                <span className="hide-tail">
                                  <svg
                                    width="400em"
                                    height="1.08em"
                                    viewBox="0 0 400000 1080"
                                    preserveAspectRatio="xMinYMin slice"
                                  >
                                    <path
                                      d="M95,702
c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14
c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54
c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10
s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429
c69,-144,104.5,-217.7,106.5,-221
l0 -0
c5.3,-9.3,12,-14,20,-14
H400000v40H845.2724
s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7
c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z
M834 80h400000v40h-400000z"
                                    ></path>
                                  </svg>
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
                  </span>
                </span>
              </span>
              ​ Os analistas devem prever ou atualizar a sua previsão, a fim de
              alterar substancialmente a previsão da Comunidade sobre uma
              questão que já tem{""}
              <span role="math" tabIndex={-1} className="!whitespace-normal">
                <span className="katex">
                  <span className="katex-html" aria-hidden="true">
                    <span className="base">
                      <span className="strut"></span>
                      <span className="mord mathnormal">N</span>
                    </span>
                  </span>
                </span>
              </span>
              previsões.
            </li>
          </ul>
          <p>
            Os usuários podem ocultar a previsão da comunidade a partir da
            exibição de suas configurações.
          </p>
          <h4
            id="include-bots"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Os bots estão incluídos na previsão da comunidade?
          </h4>
          <p>
            Por padrão, os bots não estão incluídos em nenhuma agregação. Se
            forem, é indicado na barra lateral como &quot;Incluir Bots&quot;.
          </p>
        </div>
        <div>
          <h3
            id="metaculus-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que é a previsão do Metaculus?
          </h3>
          <p>
            A previsão do Metaculus só pode ser visualizada no{""}
            <Link href="/aggregation-explorer/">Explorador de Agregação</Link>.
            Está obsocada desde novembro de 2024, mas mostra um registro da
            melhor estimativa do sistema Metaculus sobre como uma questão será
            resolvida. É baseado em previsões de membros da comunidade, mas ao
            contrário da previsão da comunidade, não é uma média simples ou
            mediana. Em vez disso, a Previsão do Metaculus usa um modelo
            sofisticado para calibrar e pesar cada usuário, idealmente
            resultando em uma previsão melhor do que a melhor da comunidade.
          </p>
          <p>
            Para perguntas resolvidas em 2021, a Previsão do Metaculus tem uma
            pontuação Brier de 0,107. Os escores inferiores de Brier indicam
            maior acurácia, com o MP ligeiramente inferior ao escore Brier da
            Predição Comunitária de 0,108.
          </p>
        </div>
        {/* <hr> */}

        <div>
          <h2
            id="visibility-of-the-cp-and-mp"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Por que não vejo o PC?
          </h2>
          <p>
            Quando uma pergunta se abre pela primeira vez, ninguém pode ver a
            previsão da comunidade por um tempo, para evitar dar peso excessivo
            às primeiras previsões, que podem &quot;terrar&quot; ou viés
            posteriores.
          </p>
        </div>
        <div>
          <h3
            id="public-figure"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que são previsões de figura pública?
          </h3>
          <p>
            As páginas de{" "}
            <Link href="/organization/public-figures/">previsão</Link>
            de <Link href="/organization/public-figures/">figuras</Link>
            públicas são dedicadas a coletar e preservar previsões importantes
            feitas por figuras públicas proeminentes e colocá-las em conversa
            com as previsões da comunidade Metaculus. Cada figura apresenta uma
            lista de previsões que eles fizeram junto com a fonte que registrou
            a previsão, a data em que a previsão foi feita e perguntas
            relacionadas ao Metaculus. As previsões públicas são apresentadas de
            forma transparente juntamente com as previsões da comunidade de
            forma inspecionável e compreensível por todos, fornecendo
            responsabilidade pública e contexto adicional para as questões do
            Metaculus vinculado.{""}
          </p>
          <p>
            Uma <em>figura pública</em>é alguém com uma certa posição social
            dentro de uma esfera particular de influência, como um político,
            personalidade da mídia, cientista, jornalista, economista, acadêmico
            ou líder de negócios.{""}
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            O que é qualifica como previsão?
          </h4>
          <p>
            Uma previsão é uma afirmação ou uma declaração sobre o que alguém
            pensa que vai acontecer no futuro, onde a coisa prevista tem alguma
            quantidade de incerteza associada a ela.{""}
          </p>
          <p>
            Uma previsão de figura pública é uma previsão feita pela própria
            figura pública e não por números que possam representá-los, como
            funcionários, gerentes de campanha ou porta-vozes.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Quem pode enviar previsões de figura pública?
          </h4>
          <p>
            Quando as previsões são feitas por figuras públicas, como políticos
            eleitos, autoridades de saúde pública, economistas, jornalistas e
            líderes empresariais, eles se tornam candidatos à inclusão no
            sistema de previsão de números públicos.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Como posso enviar uma previsão de figura pública?
          </h4>
          <p>
            Na página de uma figura pública, clique em Previsões de relatório e,
            em seguida, fornecer
          </p>
          <ol className="ml-5 list-inside list-decimal">
            <li>Uma citação direta da fonte de notícias de previsão</li>
            <li>O nome da fonte de notícias</li>
            <li>Um link para a fonte de notícias</li>
            <li>A data de previsão</li>
            <li>Pelo menos uma questão relacionada do Metaculus</li>
          </ol>
          <p>
            Se a Figura Pública ainda não tiver uma página dedicada, você pode
            solicitar que seja criada comentando o post{""}
            <Link
              href="/questions/8198/public-figure-predictions/"
              target="_blank"
              rel="noopener"
            >
              de
            </Link>
            discussão{""}
            <Link
              href="/questions/8198/public-figure-predictions/"
              target="_blank"
              rel="noopener"
            >
              Public Figures Predictions
            </Link>
            . Tag - Cristão para um processo de moderação mais rápido.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Quais são os critérios para selecionar questões relacionadas ao
            Metaculus relacionadas à Predição de Figuras Públicas?
          </h4>
          <p>
            Dependendo do nível de especificidade e clareza da previsão da
            figura pública, uma questão de Metaculus vinculada pode resolver de
            acordo com os mesmos critérios exatos da previsão. Por exemplo,{""}
            <Link
              href="/questions/8225/public-figure-prediction-by-joe-biden/"
              target="_blank"
              rel="noopener"
            >
              Joe Biden expressou que planeja concorrer à reeleição
            </Link>
            .{""}
            <Link
              href="/questions/6438/will-joe-biden-run-for-reelection/"
              target="_blank"
              rel="noopener"
            >
              Esta pergunta do Metaculus pergunta diretamente se ele vai correr
            </Link>
            .{""}
          </p>
          <p>
            Perguntas vinculadas não são necessárias, no entanto, para
            corresponder diretamente à previsão da figura pública, e{""}
            <Link
              href="/questions/5712/biden-2024-re-nomination/"
              target="_blank"
              rel="noopener"
            >
              essa questão sobre se Biden será o candidato democrata em 2024
            </Link>
            é claramente relevante para a reivindicação de figuras públicas,
            mesmo que esteja mais longe da alegação do que perguntar se Biden
            concorrerá. Perguntas vinculadas relevantes lançam luz, criam
            contexto adicional ou fornecem evidências potenciais a favor ou
            contra a alegação da figura pública. Observe que uma questão sendo
            fechada ou resolvida não a desqualifica de estar vinculada à
            previsão.
          </p>
          <p>
            Por outro lado, essa questão sobre se o{""}
            <Link
              href="/questions/8523/irs-designates-crypto-miners-brokers-by-2025/"
              target="_blank"
              rel="noopener"
            >
              IRS designa os mineradores de criptomoedas como “corretores” até
              2025
            </Link>
            segue a Lei de Investimento e Empregos de Infraestrutura de Biden,
            mas além da conexão Biden, não satisfaz os critérios acima para uma
            questão vinculada relevante.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Quais fontes são aceitáveis?
          </h4>
          <p>
            Fontes de notícias que têm autoridade e são conhecidas por serem
            precisas são aceitáveis. Se uma série de fontes de notícias
            relatarem a mesma previsão, mas a previsão se originou de uma única
            fonte, o uso da fonte original é preferido. Contas do Twitter ou
            blogs pessoais são aceitáveis se eles são de propriedade da própria
            figura pública.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Quem decide o que acontece a seguir?
          </h4>
          <p>
            Os moderadores irão analisar e aprovar a sua solicitação ou fornecer
            feedback.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            O que acontece se uma figura pública atualizar sua previsão?
          </h4>
          <p>
            Na página da previsão, comente a atualização com a fonte e marque um
            moderador. O moderador irá rever e executar a atualização, se
            necessário.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Eu sou a figura pública que fez a previsão. Como posso reivindicar
            esta página?
          </h4>
          <p>Envie-nos um e-mail para suporte em metaculus.com.</p>
        </div>
        <div>
          <h3
            id="reaffirming"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que é “reafirmar” uma previsão?
          </h3>
          <p>
            Algumas vezes você não mudou de ideia em uma pergunta, mas ainda
            quer registrar sua previsão atual. Isso é chamado de
            &quot;reafirmação&quot;: prever o mesmo valor que você previu antes,
            agora.
          </p>
          <p>
            Também é útil ao classificar as perguntas pela idade da sua previsão
            mais recente. Reafirmar uma pergunta o envia para o final dessa
            lista.
          </p>
          <p>
            Você pode reafirmar uma pergunta da interface de previsão normal na
            página de perguntas ou usando um botão especial em feeds.
          </p>
          {/* <img alt="Reaffirming a prediction"loading="lazy"width="922"height="575"decoding="async"data-nimg="1"className="my-4"style="color: transparent;"srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2FScreen%2BShot%2B2023-02-14%2Bat%2B2.14.38%2BPM.png&amp;w=1080&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2FScreen%2BShot%2B2023-02-14%2Bat%2B2.14.38%2BPM.png&amp;w=1920&amp;q=75 2x"src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2FScreen%2BShot%2B2023-02-14%2Bat%2B2.14.38%2BPM.png&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://cdn.metaculus.com/Screen+Shot+2023-02-14+at+2.14.38+PM.png"
            alt="Reaffirming a prediction"
            className="my-4"
            width={922}
            height={575}
          />
          <p>
            Sobre os grupos de perguntas, reafirmando impactos em todas as
            subquestões sobre as quais você tinha uma previsão, mas não as
            outras.
          </p>
        </div>
        {/* <hr> */}

        <div>
          <h2
            id="scores-and-medals"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Pontuações e Medalhas
          </h2>
          <h3
            id="whatscores"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que são pontuações?
          </h3>
          <p>
            As pontuações medem o desempenho de previsão em relação a muitas
            previsões. O Metaculus usa as pontuações da linha de base, que
            comparam você a uma linha de base imparcial, e as pontuações de
            pares, que comparam você a todos os outros meteorologistas. Também
            usamos pontuações em relação aos torneios. Nós não usamos os pontos
            Metaculus agora obsoletos, embora eles ainda sejam computados e você
            possa encontrá-los na página de perguntas.
          </p>
          <p>
            Saiba mais nas{""}
            <Link href="/help/scores-faq/">Pontuações dedicadas FAQ</Link>.
          </p>
          <h3
            id="whatmedals"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que são medalhas?
          </h3>
          <p>
            Medalhas recompensam os usuários do Metaculus pela excelência na
            previsão de precisão, redação de comentários perspicazes e escrita
            de perguntas envolventes. Damos medalhas para colocar bem em
            qualquer uma das 4 tabelas de classificação: Precisão de Linha de
            Base, Precisão dos Pares, Comentários e Escrita de Perguntas. As
            medalhas são concedidas todos os anos. Medalhas também são
            concedidas para o desempenho do torneio.
          </p>
          <p>
            Saiba mais no <Link href="/help/medals-faq/">FAQ</Link>
            de <Link href="/help/medals-faq/">Medalhas</Link>
            dedicado<Link href="/help/medals-faq/">.</Link>
          </p>
        </div>
        {/* <hr> */}

        <div>
          <h2
            id="Metaculus Journal"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Jornal do Metaculus
          </h2>
          <h3
            id="whatisjournal"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que é o Metaculus Journal?
          </h3>
          <p>
            O <Link href="/project/journal/">Metaculus Journal</Link>
            publica ensaios educacionais longos e educacionais sobre temas
            críticos como ciência e tecnologia emergentes, saúde global,
            biossegurança, economia e econometria, ciência ambiental e
            geopolítica – todos fortificados com previsões quantificadas.
          </p>
          <p>
            Se você quiser escrever para o Metaculus Journal, envie um e-mail
            para{""}
            <a href="mailto:christian@metaculus.com">christian.metaculus.com</a>
            com um currículo ou currículo, uma amostra de escrita e dois
            arremessos da história.
          </p>
          <h3
            id="fortifiedessay"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que é um ensaio fortificado?
          </h3>
          <p>
            Em novembro de 2021, a Metaculus apresentou um novo projeto –
            Ensaios Fortificados. Um ensaio fortificado é um ensaio que é
            “fortificado” pela inclusão de previsões quantificadas que são
            justificadas no ensaio. O objetivo dos ensaios fortificados é
            alavancar e demonstrar o conhecimento e o trabalho intelectual que
            foram para responder às questões de previsão, ao mesmo tempo em que
            colocavam as previsões em um contexto maior.
          </p>
          <p>
            Metaculus planeja executar Concursos de Ensaio Fortificado
            regularmente como parte de alguns torneios. Este contexto adicional
            derivado de ensaios é necessário, porque uma previsão quantificada
            isoladamente pode não fornecer as informações necessárias para
            impulsionar a tomada de decisões pelas partes interessadas. Em
            ensaios fortificados, os escritores podem explicar o raciocínio por
            trás de suas previsões, discutir os fatores que impulsionam os
            resultados previstos, explorar as implicações desses resultados e
            oferecer suas próprias recomendações. Ao colocar previsões nesse
            contexto maior, esses ensaios são mais capazes de ajudar as partes
            interessadas a entender profundamente as previsões relevantes e
            quanto peso colocar nelas. Os melhores ensaios serão compartilhados
            com uma comunidade de altruísmo eficaz e global de milhares de
            indivíduos e dezenas de organizações.
          </p>
        </div>
        {/* <hr> */}

        <div>
          <h2 id="miscellany" className="mb-4 scroll-mt-nav text-3xl font-bold">
            Miscelânea
          </h2>
          <h3
            id="what-are-pros"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que são os Meteorologistas Metaculus Pro?
          </h3>
          <p>
            Para certos projetos, o Metaculus emprega{""}
            <Link href="/pro-forecasters/">Pro Forecasters</Link>
            que demonstraram excelente capacidade de previsão e que têm um
            histórico de descrever claramente suas justificativas. Prós preveem
            conjuntos de perguntas privados e públicos para produzir previsões
            bem calibradas e justificativas descritivas para nossos parceiros.
            Recrutamos principalmente membros da comunidade Metaculus com os
            melhores históricos para nossa equipe Pro, mas os meteorologistas
            que demonstraram excelente capacidade de previsão em outros lugares
            também podem ser considerados.
          </p>
          <p>
            Se você estiver interessado em contratar o Metaculus Pro Forecasters
            para um projeto, entre em contato conosco pelo{""}
            <a href="mailto:support@metaculus.com">e-soco.com</a>.
            <a href="mailto:support@metaculus.com">com</a>
            com o assunto &quot;Project Inquiry&quot;.
          </p>
          <p>
            Metaculus seleciona indivíduos de acordo com os seguintes critérios:
          </p>
          <ol className="ml-5 list-inside list-decimal">
            <li>
              Tem pontuação no top 2% de todos os meteorologistas Metaculus.
            </li>
            <li>Previu um mínimo de 75+ questões que foram resolvidas.</li>
            <li>Tenha previsão de experiência por um ano ou mais.</li>
            <li>Tem previsto em várias áreas temáticas.</li>
            <li>
              Tenha um histórico de fornecer comentários explicando suas
              previsões.
            </li>
          </ol>
          <h3 id="api" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            Metaculus tem uma API?
          </h3>
          <p>A documentação da API ainda está sendo trabalhada.</p>
          <h3
            id="change-name"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Como posso alterar meu nome de usuário?
          </h3>
          <p>
            Você pode alterar seu nome gratuitamente nos primeiros três dias de
            registro. Depois disso, você poderá alterá-lo uma vez a cada 180
            dias.
          </p>
          <h3
            id="cant-comment"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Estou registado. Por que não posso comentar sobre uma pergunta?
          </h3>
          <p>
            Em um esforço para reduzir o spam, os novos usuários devem esperar
            12 horas após a inscrição antes que os comentários sejam
            desbloqueados.
          </p>
          <h3
            id="suspensions"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Compreender as suspensões da conta.
          </h3>
          <p>
            Metaculus pode – embora isso, felizmente, ocorra muito raramente –
            emitir as suspensões temporárias de uma conta. Isso ocorre quando um
            usuário agiu de uma maneira que consideramos inadequada, como quando
            nossos <Link href="/terms-of-use/">termos de uso</Link>
            são violados. Neste ponto, o usuário receberá um aviso sobre a
            suspensão e será informado de que continuar esse comportamento é
            inaceitável. As suspensões temporárias servem como um aviso aos
            usuários de que eles estão a algumas infrações de receber uma
            proibição permanente de sua conta.
          </p>
          <h3
            id="cant-see"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Por que posso ver a previsão da comunidade sobre algumas questões, a
            previsão do Metaculus sobre outros, e nenhuma previsão sobre alguns
            outros?
          </h3>
          <p>
            Quando uma pergunta se abre pela primeira vez, ninguém pode ver a
            previsão da comunidade por um tempo, para evitar dar peso excessivo
            às primeiras previsões, que podem &quot;terrar&quot; ou viés
            posteriores. Uma vez que a previsão da comunidade é visível, a
            previsão do Metaculus é oculta até que a questão se feche.
          </p>
        </div>
        <div>
          <h3
            id="related-news"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que é o NewsMatch?
          </h3>
          <p>
            NewsMatch exibe uma seleção de artigos relevantes para a questão
            atual do Metaculus. Estes servem como um recurso adicional para os
            meteorologistas enquanto discutem e preveem sobre a questão. Cada
            artigo é listado com sua fonte e sua data de publicação. Clicar no
            título de um artigo navega até o próprio artigo. O up e downvoting
            permite que você indique se o artigo foi útil ou não. Sua entrada
            melhora a precisão e a utilidade do modelo que corresponde aos
            artigos para questões do Metaculus.
          </p>
          <p>
            O modelo de correspondência de artigos é apoiado pelo{""}
            <a href="https://www.improvethenews.org/">Improve the News</a>, um
            agregador de notícias desenvolvido por um grupo de pesquisadores do
            MIT. Projetado para dar aos leitores mais controle sobre o consumo
            de notícias, o Improve the News ajuda os leitores a se manterem
            informados enquanto encontram uma variedade maior de pontos de
            vista.
          </p>
          <p>
            Os artigos no banco de dados da ITN são combinados com perguntas
            relevantes do Metaculus por um modelo de aprendizado de máquina
            baseado em transformador treinado para mapear passagens
            semanticamente semelhantes para regiões em &quot;espaço de
            incorporação&quot;. As próprias incorporações são geradas usando{""}
            <a href="https://arxiv.org/abs/2004.09297">MPNet</a>.
          </p>
        </div>
        <div>
          <h3
            id="community-insights"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            O que são Insights Comunitários?
          </h3>
          <p>
            O Community Insights resume os comentários do usuário do Metaculus
            sobre uma determinada pergunta usando o GPT-4. Eles condensam
            previsões recentes, comentários com carimbo de data e a previsão
            atual da comunidade em resumos concisos de argumentos relevantes
            para diferentes previsões sobre uma determinada questão. Os
            meteorologistas podem usá-los para tomar decisões mais informadas e
            manter-se atualizados com os insights mais recentes da comunidade.
          </p>
          <p>
            O Community Insights está atualmente disponível em perguntas
            binárias e contínuas com grandes tópicos de comentários e será
            atualizado regularmente à medida que novas discussões surgirem nos
            comentários. Se você tiver feedback sobre esses resumos - ou quiser
            vê-los aparecer em uma variedade maior de perguntas - e-mail{""}
            <a href="mailto:support@metaculus.com">support.com</a>.
          </p>
          <p>
            Se você encontrar um resumo do Community Insights incorreto,
            ofensivo ou enganoso, use o botão na parte inferior do resumo para
            &quot;Desloque este resumo&quot; para que a equipe do Metaculus
            possa resolvê-lo.
          </p>
        </div>
        <div>
          <h3
            id="domains"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Posso ter o meu próprio Metaculus?
          </h3>
          <p>
            Sim! Sim! O Metaculus tem um sistema de domínio, onde cada domínio
            (como &quot;exempple.metaculus.com&quot;) tem um subconjunto de
            perguntas e usuários que lhe são atribuídas. Cada pergunta tem um
            conjunto de domínios em que é postada e cada usuário tem um conjunto
            de domínios dos quais é membro. Assim, um domínio é uma maneira
            flexível de definir um conjunto específico de perguntas que são
            privadas para um conjunto de usuários, ao mesmo tempo em que permite
            que algumas perguntas no domínio sejam postadas também para
            metaculus.com. Domínios são um produto que o Metaculus pode fornecer
            com vários níveis de suporte por uma taxa; por favor, entre em
            contato para mais detalhes.
          </p>
        </div>
        <div>
          <h3
            id="spreadword"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Como posso ajudar a divulgar o Metaculus?
          </h3>
          <p>
            O Metaculus ficará mais divertido e mais interessante na medida em
            que crescerá para incluir mais e mais preditores, por isso
            incentivamos os participantes a espalhar a palavra para pessoas que
            eles acham que podem gostar de prever, ou apenas estar interessado
            em como as perguntas se desenvolvem. Alguns dos mecanismos mais
            úteis são:
          </p>
          <ol className="ml-5 list-decimal">
            <li>
              Publique perguntas específicas que você gosta de Twitter, Facebook
              e Reddit, usando o botão &quot;compartilhar&quot; em cada página,
              que configura um tweet/post padrão que você pode editar.
            </li>
            <li>
              <a href="https://www.twitter.com/metaculus/">
                Siga-nos no Twitter
              </a>
              , depois retweet Metaculus tweets para seus seguidores.
            </li>
            <li>
              <a href="https://www.facebook.com/metaculus/">
                Siga nossa página no Facebook
              </a>
              e compartilhe postagens que você gosta.
            </li>
            <li>
              <a href="mailto:support@metaculus.com">Contacte-nos</a>
              para outras ideias.
            </li>
          </ol>
        </div>
        <div>
          <h3
            id="closeaccount"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Posso fechar minha conta do Metaculus e excluir minhas informações?
          </h3>
          <p>
            Claro, se você deseja fechar sua conta, por favor envie um e-mail
            para o seu pedido para{""}
            <a href="mailto:closemyaccount@metaculus.com">
              closemyaccount.metaculus.com
            </a>
            . Dentro de cinco dias úteis, removeremos suas informações de perfil
            e comentários de nosso banco de dados ativo.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
