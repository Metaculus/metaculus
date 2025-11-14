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
          <h2 className="mb-4 mt-0 text-2xl font-semibold">Nociones básicas</h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatismetaculus">Qué es el Metaculus?</a>
            </li>
            <li>
              <a href="#whatisforecasting">Qué estás prediciendo?</a>
            </li>
            <li>
              <a href="#whenforecastingvaluable">Cuando se espera valioso?</a>
            </li>
            <li>
              <a href="#aim">Por qué debería ser meteorólogo?</a>
            </li>
            <li>
              <a href="#whocreated">Quién creó Metaculus?</a>
            </li>
            <li>
              <a href="#whattournaments">
                Qué son los torneos de Metaculus y las series de preguntas?
              </a>
            </li>
            <li>
              <a href="#predmarket">Metaculus es un mercado de previsión?</a>
            </li>
            <li>
              <a href="#justpolling">Se hacen problemas metabólicos?</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Preguntas de Metaculus
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatsort">
                Qué tipo de preguntas están permitidas y qué se hace una buena
                pregunta?
              </a>
            </li>
            <li>
              <a href="#whocreates">
                Quién crea las preguntas y quién decide quién se publica?
              </a>
            </li>
            <li>
              <a href="#whoedits">Quién puede editar las preguntas?</a>
            </li>
            <li>
              <a href="#question-submission">
                Cómo puedo hacer mi propia pregunta publicada?
              </a>
            </li>
            <li>
              <a href="#pending-question">
                Qué puedo hacerme si una pregunta que presenté ha estado
                pendiente durante mucho tiempo?
              </a>
            </li>
            <li>
              <a href="#admins-resolution">
                Qué puedo hacer si una pregunta se resuelve, pero no es así?
              </a>
            </li>
            <li>
              <a href="#question-private">
                Dónde están mis problemas privados?
              </a>
            </li>
            <li>
              <a href="#comments">
                Cuáles son las normas y directrices para los comentarios y
                discusiones?
              </a>
            </li>
            <li>
              <a href="#definitions">
                Qué significan &amp;&quot;creditable source &amp; &quot; y
                &amp;&quot;ans de la fecha X&amp;&quot; y tales frases?
              </a>
            </li>
            <li>
              <a href="#question-types">Qué tipo de preguntas hay?</a>
            </li>
            <li>
              <a href="#question-groups">Qué cuestionan los grupos?</a>
            </li>
            <li>
              <a href="#conditionals">Qué son los pares condicionales?</a>
            </li>
            <li>
              <a href="#navigation-and-filtering">
                Cómo puedo encontrar ciertas preguntas sobre Metaculus?
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Solución de cuestiones
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#closers">
                Qué son &amp;&quot;data open&amp;&quot;, &amp;&quot;data
                close&amp;&quot; y &amp;&quot; resolución de resolución?
                &amp;&quot;
              </a>
            </li>
            <li>
              <a href="#timezone">
                Qué zona horaria se utiliza para preguntas?
              </a>
            </li>
            <li>
              <a href="#who-resolves">
                Quién decide la resolución para una pregunta?
              </a>
            </li>
            <li>
              <a href="#ambiguous-annulled">
                Qué son las resoluciones de &amp;&quot;angiqua;&amp;&quot; y
                &amp;&quot;nuuladas&amp;&quot;?
              </a>
            </li>
            <li>
              <a href="#allres">Se resuelven todas las preguntas?</a>
            </li>
            <li>
              <a href="#whenresolve">Cuándo se resolverá una pregunta?</a>
            </li>
            <li>
              <a href="#resolvebackground">
                Se utiliza el material de fondo para la resolución de preguntas?
              </a>
            </li>
            <li>
              <a href="#unclearresolve">
                Qué sucede si los criterios para resolver una pregunta no son
                claros o subóptimos?
              </a>
            </li>
            <li>
              <a href="#reresolve">Se pueden resolver las preguntas?</a>
            </li>
            <li>
              <a href="#whatifres">
                Qué pasa si una pregunta se resuelve en el mundo real antes de
                la próxima vez?
              </a>
            </li>
            <li>
              <a href="#retroactive-closure">
                Cuándo se debe especificar una pregunta el cierre retroactivo?
              </a>
            </li>
            <li>
              <a href="#whatifres2">
                Qué pasa si se cumplen los criterios para resolver una pregunta
                antes de la hora de apertura?
              </a>
            </li>
            <li>
              <a href="#ressrc">
                Qué pasa si ya no hay una fuente de resolución?
              </a>
            </li>
            <li>
              <a href="#rescouncil">Qué son las Juntas de Resolución?</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Las previsiones de
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#tutorial">Hay un tutorial o un paso a paso?</a>
            </li>
            <li>
              <a href="#howpredict">
                Cómo hago un pronóstico? Puedo cambiar eso más tarde?
              </a>
            </li>
            <li>
              <a href="#howwithdraw">Cómo puedo retirar mi predicción?</a>
            </li>
            <li>
              <a href="#range-interface">Cómo uso la interfaz de intervalo?</a>
            </li>
            <li>
              <a href="#community-prediction">
                Cómo se calcula la previsión comunitaria?
              </a>
            </li>
            <li>
              <a href="#metaculus-prediction">
                Qué es el pronóstico de Metaculus?
              </a>
            </li>
            <li>
              <a href="#public-figure">
                Cuáles son las previsiones de las cifras públicas?
              </a>
            </li>
            <li>
              <a href="#reaffirming">Qué es una predicción?</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            Puntuaciones y medallas
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatscores">Qué son las puntuaciones?</a>
            </li>
            <li>
              <a href="#whatmedals">Qué son las medallas?</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">
            El Diario de Metaculus
          </h2>
          <ul className="space-y-1">
            <li>
              <a href="#whatisjournal">Qué es la revista Metaculus?</a>
            </li>
            <li>
              <a href="#fortifiedessay">Qué es un ensayo fortificado?</a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 mt-0 text-2xl font-semibold">Varios</h2>
          <ul className="space-y-1">
            <li>
              <a href="#what-are-pros">
                Qué son los meteorólogos Metaculus Pro?
              </a>
            </li>
            <li>
              <a href="#api">Tiene Metaculuso una API?</a>
            </li>
            <li>
              <a href="#change-name">
                Cómo puedo cambiar mi nombre de usuario?
              </a>
            </li>
            <li>
              <a href="#cant-comment">
                He registrado una cuenta. Por qué no puedo comentar una
                pregunta?
              </a>
            </li>
            <li>
              <a href="#suspensions">Entendiendo las suspensiones de cuentas</a>
            </li>
            <li>
              <a href="#cant-see">
                Por qué puedo ver el pronóstico de la comunidad sobre algunos
                temas, Metaculus predicción de otros, y sin predicciones sobre
                unos cuantos otros?
              </a>
            </li>
            <li>
              <a href="#related-news">Qué es NewsMatch?</a>
            </li>
            <li>
              <a href="#community-insights">
                Qué son las perspectivas de la Comunidad?
              </a>
            </li>
            <li>
              <a href="#domains">Puedo tener mi propio Metaculus?</a>
            </li>
            <li>
              <a href="#spreadword">
                Cómo puedo ayudar a difundir el Metaculus?
              </a>
            </li>
            <li>
              <a href="#closeaccount">
                Cómo puedo cerrar mi cuenta y eliminar mi información personal
                sobre Metaculus?
              </a>
            </li>
          </ul>
        </div>
        <h2 className="scroll-mt-nav text-2xl font-bold" id="basics">
          Nociones básicas
        </h2>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatismetaculus"
        >
          Qué es el Metaculus?
        </h3>
        <p>
          Metaculus es una plataforma de pronóstico en línea y un motor de
          agregación que reúne a una comunidad de razonamiento global y mantiene
          la puntuación de miles de meteorólogos, ofreciendo predicciones
          agregadas optimizadas para el aprendizaje automático sobre temas de
          importancia global. La comunidad de predicciones Metaculus a menudo se
          inspira en causas altruistas, y Metaculus tiene una larga historia de
          asociarse con organizaciones sin fines de lucro, investigadores
          universitarios y empresas para aumentar el impacto positivo de sus
          predicciones.
        </p>
        <p>
          Metaculus, por lo tanto, plantea preguntas sobre la ocurrencia de una
          variedad de eventos futuros, en muchas escalas de tiempo, a una
          comunidad de meteorólogos participantes - usted.
        </p>
        <p>
          El nombre &amp;&quot;Metaculus&amp;&quot; está inspirado en el
          Mentaculus, un mapa de probabilidad ficticio del universo, de la
          película de los hermanos Coen{" "}
          <a href="https://en.wikipedia.org/wiki/A_Serious_Man">
            A Serious Man
          </a>
          .
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whatisforecasting"
        >
          Qué estás prediciendo?
        </h3>
        <p>
          La previsión es una práctica sistemática de tratar de responder
          preguntas sobre eventos futuros. En Metaculus, seguimos algunos
          principios para elevar la predicción anterior de simples conjeturas:
        </p>
        <p>
          Primero, las preguntas se especifican cuidadosamente para que todo el
          mundo entienda de antemano y luego qué tipos de resultados se incluyen
          en la resolución y cuáles no. Los meteorólogos dan entonces
          probabilidades precisas que miden su incertidumbre sobre el resultado.
        </p>
        <p>
          En segundo lugar, Metaculus agrega las previsiones en un pronóstico
          comunitario basado en la
          <a href="https://en.wikipedia.org/wiki/Median">mediana</a> de las
          predicciones de los usuarios con peso actual. Sorprendentemente, la
          predicción de la comunidad es a menudo
          <Link href="/questions/track-record/">
            mejor que cualquier predictor individual.
          </Link>
          Este principio se conoce como
          <a href="https://en.wikipedia.org/wiki/Wisdom_of_the_crowd">
            la sabiduría de la multitud,
          </a>
          y ha sido demostrado en Metaculus y otros investigadores.
          Intuitivamente tiene sentido, porque cada individuo tiene información
          y prejuicios separados que, en general, se equilibran a sí mismos
          (siempre que todo el grupo no esté sesgado de la misma manera).
        </p>
        <p>
          Tercero, medimos la habilidad relativa de cada meteorólogo, usando sus
          predicciones cuantificadas. Cuando conocemos el resultado de la
          pregunta, la pregunta es &amp;Quolued&amp;&quot; y los pronosticadores
          reciben sus puntuaciones. Al rastrear estas puntuaciones de muchas
          predicciones sobre diferentes temas durante un largo período de
          tiempo, se convierten en una métrica cada vez mejor de lo bueno que es
          un predictor. Estas puntuaciones proporcionan a los aspirantes a
          meteorólogos una retroalimentación importante sobre cómo lo han hecho
          y dónde pueden mejorar.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whenforecastingvaluable"
        >
          Cuando se espera valioso?
        </h3>
        <p>
          La previsión es de valor exclusivo, especialmente en problemas
          complejos y multivariados, o en situaciones en las que la falta de
          datos dificulta la predicción de modelos explícitos o precisos.
        </p>
        <p>
          En estos y otros escenarios, las predicciones agregadas de
          meteorólogos fuertes ofrecen una de las mejores maneras de predecir
          eventos futuros. De hecho, el trabajo del politólogo Philip Tetlock
          demostró que las predicciones agregadas eran capaces de superar a los
          analistas de inteligencia profesional con acceso a información
          clasificada prediciendo varios resultados geopolíticos.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="aim">
          Por qué debería ser meteorólogo?
        </h3>
        <p>
          La investigación ha demostrado que los grandes meteorólogos provienen
          de varios orígenes y a menudo de campos que no tienen nada que ver con
          predecir el futuro. Como muchas habilidades mentales, la predicción es
          un talento que persiste con el tiempo y es una habilidad que se puede
          desarrollar. La retroalimentación práctica constante y regular puede
          mejorar en gran medida la precisión del pronosticador.
        </p>
        <p>
          Algunos eventos, como el tiempo de eclipse y las elecciones bien
          contaminadas, a menudo se pueden predecir con alta resolución, por
          ejemplo. 99,9% es probable o 3%. Otros -como el lanzamiento de una
          moneda o una carrera de caballos- no se pueden predecir con precisión;
          pero sus posibilidades todavía pueden ser. Metaculo apunta a ambos:
          proporcionar un punto central de generación y agregación para las
          previsiones. Con esto en la mano, creemos que individuos, grupos,
          corporaciones, gobiernos y humanidad en su conjunto tomarán mejores
          decisiones.
        </p>
        <p>
          Además de valer la pena, Metaculus pretende ser interesante y
          divertido, permitiendo a los participantes acumular sus hazañas de
          predicción acumular una historia para demostrarlo.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreated">
          Quién creó Metaculus?
        </h3>
        <p>
          Metaculeno se originó con dos científicos de investigación, Anthony
          Aguirre y Greg Laughlin. Aguirre, físico, es cofundador del
          <a href="https://fqxi.org/">Instituto de Preguntas Fundonitarias</a>,
          que cataliza la investigación innovadora sobre la física fundamental,
          y el
          <a href="https://futureoflife.org/">Instituto Futuro de la Vida</a>,
          que pretende aumentar el beneficio y la seguridad de tecnologías
          disruptivas como la IA. Laughlin, astrofísica, es un experto en
          predicciones de milisegundos relevantes para el comercio de alta
          frecuencia para la estabilidad a largo plazo del sistema solar.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="whattournaments"
        >
          Qué son los torneos de Metaculus y las series de preguntas?
        </h3>
        <h4 className="text-lg font-semibold">Torneos de fútbol</h4>
        <p>
          Los torneos Metaculus se organizan en torno a un tema o tema central.
          Los torneos suelen ser colaboraciones entre Metaculus y una
          organización sin fines de lucro, u otra organización que busca
          utilizar el pronóstico para apoyar la toma de decisiones efectiva.
          Puedes encontrar torneos actuales y archivados en nuestra
          <Link href="/tournaments/">página de Torneos</Link>.
        </p>
        <p>
          Los torneos son el lugar perfecto para demostrar sus habilidades de
          previsión, al tiempo que ayudan a mejorar nuestra capacidad colectiva
          de toma de decisiones. Los premios en efectivo y
          <Link href="/help/medals-faq/">las medallas</Link> se
          <Link href="/help/medals-faq/">otorgan</Link>a los analistas más
          precisos y a veces por otras contribuciones valiosas (como
          comentarios). Siga un Torneo (con el botón Seguir) para no perderse
          ninguna pregunta nueva.
        </p>
        <p>
          Después de que al menos una pregunta haya sido resuelta, una tabla de
          clasificación aparecerá en la página del torneo exhibiendo las
          puntuaciones y calificaciones actuales. También aparecerá un marcador
          personal (&amp;&quot; My Score&amp;&quot;), detallando su rendimiento
          para cada pregunta (ver
          <Link href="/help/scores-faq/#tournament-scores">
            Cómo están programados los torneos?
          </Link>
          ).
        </p>
        <p>
          Al final de un torneo, el premio se divide entre los meteorólogos de
          acuerdo a su actuación en la predicción. Cuanto más predijibas y más
          precisas eran tus predicciones, mayor era la proporción del premio que
          recibís.
        </p>
        <h4 className="text-lg font-semibold">
          Puedo donar mis ganancias en el torneo?
        </h4>
        <p>
          Si tienes excelentes ganancias de torneos, Metaculus estará encantado
          de facilitar donaciones a varias organizaciones sin fines de lucro,
          reescritas y organizaciones de fondos. Puedes encontrar la lista de
          organizaciones que facilitamos los pagos
          <Link href="/questions/11556/donating-tournament-prizes/">aquí</Link>.
        </p>
        <h4 className="text-lg font-semibold">Serie de preguntas</h4>
        <p>
          Al igual que los torneos, los juegos de preguntas se organizan en
          torno a un tema o tema central. A diferencia de los torneos, no tienen
          un grupo de premios.
        </p>
        <p>
          La serie de preguntas todavía muestra tablas de clasificación, para el
          interés y la diversión. Pero no <b>se dan cuenta</b> de que conceden
          medallas.
        </p>
        <p>
          Puedes encontrar toda una serie de preguntas en una sección especial
          <Link href="/tournaments/">de</Link> la{" "}
          <Link href="/tournaments/">página</Link>
          de <Link href="/tournaments/">torneos</Link>.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="predmarket">
          Metaculus es un mercado de previsión?
        </h3>
        <p>
          Metaculus tiene algunas similitudes con un mercado de predicciones,
          pero en última instancia no lo es. Metaculus busca agregar la
          información, la experiencia y el poder predictivo de muchas personas
          para generar pronósticos de alta calidad. Sin embargo, los mercados de
          predicciones generalmente operan con moneda real o virtual, donde los
          participantes compran (o venden) acciones si consideran que los
          precios actuales reflejan una probabilidad demasiado baja (o demasiado
          alta) de que ocurra un evento. Metaculus, en cambio, solicita
          directamente a sus usuarios las probabilidades predichas y luego las
          agrega. Creemos que este tipo de «agregador de predicciones» tiene
          ventajas y desventajas en comparación con un mercado de predicciones.
          Mercado de predicciones, y profundizamos en esto en nuestra entrada de
          blog{" "}
          <i>
            <a
              href="https://www.metaculus.com/notebooks/38198/metaculus-and-markets-whats-the-difference/"
              target="_blank"
            >
              Metaculus y los mercados: ¿Cuál es la diferencia?
            </a>
          </i>
          . Aquí tienes un gráfico de esa publicación con un breve resumen:
        </p>

        <Image
          src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/metac-vs-markets.jpg"
          alt="Comparación entre Metaculus y los mercados"
          className="my-4"
          width={700}
          height={207}
        />

        <h4 className="text-lg font-semibold">
          Ventajas de Metaculus en relación con las previsiones de los mercados
        </h4>
        <p>
          Metaculus tiene varias ventajas sobre los mercados de pronósticos,
          descritos a continuación, pero queremos prefaciar esto diciendo que a
          pesar de los posibles problemas con los mercados previstos que hemos
          esbozado aquí, pensamos que los mercados de previsión son valiosos,
          estamos satisfechos de que existen y estarían encantados de ver más
          uso de ellos.
        </p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            <b>Por lo general</b>, no es un buen uso de sus fondos para
            bloquearlos en un mercado de pronóstico a largo plazo, ya que por lo
            general puede obtener rendimientos mucho mejores invirtiendo, lo que
            significa que es probable que los mercados a largo plazo tengan poca
            liquidez. Por ejemplo, este
            <a href="https://wip.gatspress.com/wp-content/uploads/2024/05/thu9F-cumulative-traded-volume-on-the-2020-us-election-4-1024x897.png">
              gráfico
            </a>
            de un
            <a href="https://worksinprogress.co/issue/why-prediction-markets-arent-popular/">
              artículo de Works in Progress
            </a>
            que muestra el volumen de negociación en Betfair para las elecciones
            presidenciales de los EE.UU. de 2020. Hubo muy poco volumen mucho
            antes de las elecciones, con la mayor parte del volumen comercial
            ocurriendo sólo un mes fuera de las elecciones.
          </li>
          <li>
            <b>Problemas con las probabilidades bajas.</b> Los mercados de
            pronósticos tienen fricciones de mercado que los hacen menos útiles
            para las probabilidades bajas. El rendimiento del uso de su dinero
            para traer una probabilidad de 2% a 1% es insignificante, o
            potencialmente negativo si el mercado previsto extrae una tasa de
            los traders. Por eso se obtienen resultados extraños como Michelle
            Obama con un 6 por ciento de posibilidades de convertirse en la
            candidata demócrata para las elecciones presidenciales de 2024 de
            2024 en junio de 2024, como fue el caso
            <a href="https://polymarket.com/event/democratic-nominee-2024?tid=1724174308005">
              de Polymarket
            </a>
            .
          </li>
          <li>
            <b>El foco no siempre se pronostica.</b> Pronóstico incentivos del
            mercado no siempre están en línea con las previsiones más precisas.
            Considere que un posible uso para la previsión de los mercados es
            protegerse de los resultados riesgosos. Además, las personas que son
            irracionales pero dispuestas a poner una tonelada de dinero detrás
            de sus creencias pueden distorsionar el resultado. Por supuesto, lo
            ideal es que un mercado líquido corrija para estos sillones, pero es
            posible que puedan tener un efecto en el precio. Vea
            <a href="https://asteriskmag.com/issues/05/prediction-markets-have-an-elections-problem-jeremiah-johnson">
              esta pieza en la revista Asterisk
            </a>
            para obtener más información en &amp;&quot; burck money&amp;&quot;
            en los mercados de previsión.
          </li>
          <li>
            <b>Qué piensa la gente que va a pasar? </b> Los participantes del
            mercado de pronósticos están expresando si piensan que la
            probabilidad es mayor o menor que el precio de mercado, no haciendo
            una predicción. Si alguien piensa que el mercado es demasiado bajo
            en 35% y apuesta en consecuencia, no sabes si cree que la
            probabilidad real es del 40% u 80%. Esto no afecta realmente a la
            utilidad del agregado, pero hace que los datos sean menos ricos e
            informativos, y más difícil de ver la distribución completa de las
            previsiones como se puede con histogramas para preguntas binarias
            sobre Metaculus.
          </li>
          <li>
            <b>
              El rendimiento individual del mercado no siempre es una indicación
              clara de la capacidad predictiva.
            </b>
            Excelente desempeño individual del mercado sólo puede indicar
            competencia en operar en los mercados, o la capacidad de
            aprovecharse de las malas apuestas hechas por otros. Por ejemplo,
            vea
            <a href="https://www.cspicenter.com/p/salem-tournament-5-days-in#:~:text=The%20first%20problem%20we%20saw%20was%20that%20there%20were%20some%20individuals%20who%20made%20a%20killing%20by%20taking%20advantage%20of%20those%20who%20did%20not%20know%20how%20the%20markets%20work%20(see%20discussion%20here).">
              este post
            </a>
            sobre un torneo organizado en Manifold, donde los comerciantes
            tomaron una gran ventaja inicial sólo debido al uso inteligente de
            órdenes de límite. Dado que Metaculus causa probabilidades
            individuales de cada meteorólogo, podemos evaluar y reclutar
            excelentes meteorólogos.
          </li>
          <li>
            <b>
              Metaculus funciona de una manera comparable a los mercados sin
              necesidad de gestionar una cartera.
            </b>
            Sólo hay algunas comparaciones de manzanas para las manzanas entre
            plataformas, pero
            <a href="https://www.metaculus.com/notebooks/15359/predictive-performance-on-metaculus-vs-manifold-markets/">
              éstas
            </a>
            <a href="https://firstsigma.substack.com/p/midterm-elections-forecast-comparison-analysis">
              encuentran
            </a>
            una
            <a href="https://www.astralcodexten.com/p/who-predicted-2023">
              ventaja
            </a>
            para Metaculus sobre los mercados de previsión. Tenga en cuenta que
            los tamaños de la muestra tienden a ser pequeños. Sin embargo,
            también hay una comparación
            <a href="https://calibration.city/">indirecta</a> (indirectamente
            porque no considera las mismas preguntas entre plataformas) que
            encontró que los mercados de previsión están más calibrados.
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="justpolling">
          Son preguntas metabólicas investigaciones?
        </h3>
        <p>
          - No, no. La investigación de la opinión puede ser una manera útil de
          evaluar el sentimiento y los cambios en un grupo o cultura, pero a
          menudo no hay una sola respuesta &amp;&quot; correcta, como en una
          <a href="https://news.gallup.com/poll/391547/seven-year-stretch-elevated-environmental-concern.aspx">
            investigación de Gallup
          </a>
          &amp;&quot; está preocupada por el medio ambiente? &amp;&quot;
        </p>
        <p>
          En contraste, las preguntas de Metaculus están diseñadas para ser
          objetivamente solucionables (como en
          <Link href="/questions/9942/brent-oil-to-breach-140-before-may">
            Will Brent Crude Oil top $140/barrel antes de mayo de 2022?
          </Link>
          ), y a los meteorólogos no se les pregunta por sus preferencias, sino
          por sus predicciones. A diferencia de una encuesta, en muchas
          predicciones, los participantes acumulan un historial que indica su
          precisión de pronóstico. Estos registros se incorporan a
          <Link href="/faq/#metaculus-prediction">Metaculus Forecast</Link>. La
          precisión de la historia de Metaculus en sí se rastrea
          <Link href="/questions/track-record/">aquí</Link>.
        </p>
        <h2
          className="scroll-mt-nav text-2xl font-bold"
          id="metaculus-questions"
        >
          Preguntas de Metaculus
        </h2>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whatsort">
          Qué tipo de preguntas están permitidas y qué se hace una buena
          pregunta?
        </h3>
        <p>
          Las cuestiones deben centrarse en hechos tangibles y objetivos sobre
          el mundo que están bien definidos y no en una cuestión de opinión.
          Cuándo colapsar los Estados Unidos? es un tema pobre y ambiguo;
          <q>
            <Link href="/questions/8579/us-freedom-in-the-world-score-in-2050/">
              cuál será la puntuación de Estados Unidos en el Informe Mundial de
              la Libertad para 2050?
            </Link>
          </q>
          Por lo general toman la forma
          <q>de que sucederá la X por (fecha) Y? </q>O
          <q>cuando (el evento) X ocurrirá? </q>o
          <q>Cuál será el valor o la cantidad de X per (fecha) Y?</q>
        </p>
        <p>
          Una buena cuestión se resolverá inequívocamente. Una comunidad que lea
          los términos del asunto debe poder estar de acuerdo, antes y después
          del evento, si el resultado satisface los términos del asunto.
        </p>
        <p>Las preguntas también deberían seguir algunas reglas obvias:</p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            Las preguntas deben respetar la privacidad y no abordar la vida
            personal de figuras no públicas.
          </li>
          <li>
            Las preguntas no deben ser directamente potencialmente difamatorias
            o generalmente de mal gusto.
          </li>
          <li>
            Las preguntas nunca deben tener como objetivo predecir la mortalidad
            de personas individuales o incluso de grupos pequeños. En los casos
            de interés público (según lo designado por los tribunales y figuras
            políticas), el asunto debe ser formulado en otros términos más
            directamente relevantes, como $quot;cuando X ya no prestará servicio
            en los tribunales$quot; o $quot;no puede solicitar el cargo en la
            fecha X$quot;. Cuando el tema es muerte (o longevidad), las
            preguntas en sí mismas deben tratar a las personas en forma agregada
            o hipotéticamente.
          </li>
          <li>
            De manera más general, las preguntas deben evitar ser escritas de
            una manera que fomente actos ilegales o dañinos, es decir,
            hipotéticamente, si alguien estuviera lo suficientemente motivado
            por una pregunta Metaculum para influir en el mundo real y cambiar
            el resultado de la resolución de un problema, estas acciones no
            deberían ser inherentemente ilegales o dañinas.
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whocreates">
          Quién crea las preguntas y quién decide quién se publica?
        </h3>
        <p>
          Muchas preguntas son publicadas por el equipo de Metaculus, pero
          cualquier usuario registrado puede proponer una pregunta. Las
          preguntas propuestas serán analizadas por un grupo de moderadores
          nombrados por Metaculus. Los moderadores seleccionarán las mejores
          preguntas presentadas y ayudarán a editar la pregunta para ser claro,
          bien informado y
          <Link href="/question-writing/">
            alineado con nuestro estilo de escritura
          </Link>
          .
        </p>
        <p>
          Metaculus organiza preguntas sobre
          <Link href="/questions/categories/">muchos temas</Link>, pero nuestras
          principales áreas de enfoque son Ciencia,
          <Link href="/questions/?categories=technology">Tecnología</Link>,
          <Link href="/questions/?tags=effective-altruism">
            Metatruísismo Efectivo
          </Link>
          , <Link href="/questions/?topic=ai">Inteligencia Artificial</Link>,
          <Link href="/questions/?topic=biosecurity">Salud</Link>y
          <Link href="/questions/?categories=geopolitics">Geopolítica</Link>.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="whoedits">
          Quién puede editar las preguntas?
        </h3>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            Los administradores pueden editar todas las preguntas en cualquier
            momento (sin embargo, una vez que los pronósticos han comenzado, se
            cuida mucho no cambiar los términos de la resolución de una pregunta
            a menos que sea necesario).
          </li>
          <li>
            Los moderadores pueden editar preguntas cuando están pendientes y en
            la siguiente (antes de empezar las predicciones).
          </li>
          <li>
            Los autores pueden editar sus preguntas cuando están a borradores y
            pendientes.
          </li>
          <li>
            Los autores pueden invitar a otros usuarios a editar preguntas que
            están en Rascure o a la Pendiente.
          </li>
        </ul>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-submission"
        >
          Cómo puedo hacer mi propia pregunta publicada?
        </h3>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            Si usted tiene una idea básica para una pregunta, pero no tiene el
            tiempo / energía para elaborar los detalles, puede enviarlo,
            discutirlo en nuestro
            <Link href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              tema
            </Link>
            <Link href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              de idea
            </Link>
            <Link href="/questions/956/discussion-topic-what-are-some-suggestions-for-questions-to-launch/">
              de pregunta
            </Link>
            o en nuestro
            <a href="https://discord.gg/v2Bf5tppeT">canal Discord</a>.
          </li>
          <li>
            Si usted tiene una pregunta bastante completa, con al menos algunas
            referencias enlazadas y criterios de resolución bastante
            insignificantes e inequívocos, es probable que su pregunta sea
            revisada y publicada rápidamente.
          </li>
          <li>
            Metaculus organiza preguntas sobre
            <Link href="/questions/categories/">muchos temas</Link>, pero
            nuestras principales áreas de enfoque son Ciencia,
            <Link href="/questions/?categories=technology">Tecnología</Link>,
            <Link href="/questions/?tags=effective-altruism">
              Metatruísismo Efectivo
            </Link>
            , <Link href="/questions/?topic=ai">Inteligencia Artificial</Link>,
            <Link href="/questions/?topic=biosecurity">Salud</Link>y
            <Link href="/questions/?categories=geopolitics">Geopolítica</Link>.
            Las preguntas sobre otros temas, especialmente que requieren mucho
            esfuerzo moderador para ser lanzados, recibirán menor prioridad y
            pueden posponerse hasta más adelante.
          </li>
          <li>
            Consideramos las preguntas presentadas como sugerencias y tomamos la
            mano libre en la edición. Si usted está preocupado por tener su
            nombre en una pregunta que se cambia de lo que usted envía, o le
            gustaría ver la pregunta antes de que sea emitida, por favor tenga
            en cuenta esto en la propia pregunta; las preguntas están ocultas
            desde la vista pública hasta que se les da $quot;apropiaciones$quot;
            y se pueden publicar de forma anónima bajo petición.
          </li>
        </ol>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="pending-question"
        >
          Qué puedo hacerme si una pregunta que presenté ha estado pendiente
          durante mucho tiempo?
        </h3>
        <p>
          Actualmente, recibimos un gran volumen de preguntas de envío, muchas
          de las cuales son interesantes y bien escritas. Dicho esto, tratamos
          de aprobar suficientes preguntas para que cada una de ellas pueda
          recibir la atención que merecen de nuestros meteorólogos. Metaculus
          prioriza las preguntas sobre Ciencia,
          <Link href="/questions/?categories=technology">Tecnología</Link>,
          <Link href="/questions/?tags=effective-altruism">
            Metaísividad Efectiva
          </Link>
          , <Link href="/questions/?topic=ai">Inteligencia Artificial</Link>,
          <Link href="/questions/?topic=biosecurity">Salud</Link>y
          <Link href="/questions/?categories=geopolitics">Geopolítica</Link>. Si
          su pregunta cae en una de estas categorías, o es muy urgente o
          importante, puede etiquetarnos con los moderadores para llamar nuestra
          atención.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="admins-resolution"
        >
          Qué puedo hacer si una pregunta se resuelve, pero no es así?
        </h3>
        <p>
          Si una pregunta aún está esperando una resolución, asegúrese de que no
          ha habido comentarios del equipo explicando el motivo del retraso. Si
          no, puede marcar aadmins para alertar al equipo de Metaculus. Por
          favor, no uses la etiqueta? Adminizas más de una vez a la semana en
          una sola pregunta o resolución.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-private"
        >
          Dónde están mis problemas privados?
        </h3>
        <p>
          Los problemas privados se descontinúan, ya no es posible crear otros
          nuevos. Si usted tenía preguntas privadas, todavía puede encontrarlas
          yendo a la
          <Link href="/questions/">Página de inicio de la alimentación</Link>,
          seleccionando $quot;Mis preguntas y publicaciones$quot; en la barra
          lateral y usando el filtro especial $quot;Personal$quot;.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="comments">
          Cuáles son las normas y directrices para los comentarios y
          discusiones?
        </h3>
        <p>
          Tenemos un conjunto completo de{" "}
          <Link href="/help/guidelines/">pautas</Link>
          de <Link href="/help/guidelines/">etiqueta comunitaria</Link>, pero en
          resumen:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>Los usuarios son bienvenidos a comentar cualquier pregunta.</li>
          <li>
            Comentarios y preguntas pueden utilizar
            <Link href="/help/markdown/">formato de marcación</Link>
          </li>
          <li>
            Metaculeno apunta a un alto nivel de discurso. Las observaciones
            deben versarse sobre el tema, relevantes e interesantes. Los
            comentarios no deben sólo indicar la opinión del autor (con
            excepción de las previsiones cuantificadas). No se toleran los
            comentarios que son spam, agresivo, profano, ofensivo, despectivo o
            acosador, así como aquellos que son explícitamente publicidad
            comercial o aquellos que son de alguna manera ilegales. Ver
            Metaculus <Link href="/terms-of-use/">términos de uso</Link> para
            más
          </li>
          <li>
            Puedes hacer ping en otros usuarios usando $quot;? Nombre del
            usuario$quot;, quién enviará una notificación a ese usuario (si
            establece esta opción en su configuración de notificación).
          </li>
          <li>
            Le invitamos a apoyar los comentarios que contienen información
            relevante para la cuestión y pueden informar de comentarios que no
            apoyen nuestras <Link href="/help/guidelines/">directrices</Link>
            <Link href="/help/guidelines/">de etiqueta</Link>.
          </li>
          <li>
            Si un comentario es spam, inapropiado/ofensivo o rompe nuestras
            reglas, por favor envíenos un informe (bajo el &quot;menú&quot;...).
          </li>
        </ul>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="definitions">
          Qué significa $quot;fuente creíble$quot; y $quot;antes fecha X$quot; y
          tales frases?
        </h3>
        <p>
          Para reducir la ambiguedad de manera eficiente, aquí están algunas
          definiciones que se pueden utilizar en las preguntas, con un
          significado definido por esta FAQ:
        </p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>
            Se considerará una &#34;fuente creíble&#34; un artículo publicado en
            línea o impreso de una fuente periodística o académica, información
            publicada por una fuente autorizada con conocimiento o
            responsabilidad específica en el tema, o, en general, información de
            una fuente cuya preponderancia de la evidencia sugiera que la
            información es correcta, siempre que no exista controversia
            significativa en torno a su exactitud. Las fuentes creíbles
            generalmente no incluyen información sin fuentes, presente en blogs,
            publicaciones en redes sociales o sitios web de particulares.
          </li>
          <li>
            La frase $quot;Antes [fecha X] se tomará como resultado antes del
            primer momento [fecha X] se aplicaría, en UTC. Por ejemplo,
            $quot;Antes de 2010$quot; se entenderá antes de la medianoche del 1
            de enero de 2010; $quot;Antes del 30 de junio$quot; significaría
            antes de la medianoche (00:00:00) UTC 30 de junio.
            <ul className="ml-4 mt-2 list-inside list-disc space-y-2">
              <li>
                <strong>Anteriormente</strong>, esta sección se usaba $quot;para
                [fecha x]$quot; en lugar de $quot;antes [fecha x]$quot;, sin
                embargo, $quot;antes$quot; es mucho más claro y siempre debe ser
                utilizado en lugar de &quot;by&quot;, cuando sea posible.
              </li>
            </ul>
          </li>
        </ol>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="question-types">
          Qué tipo de preguntas hay?
        </h3>
        <h4 className="text-lg font-semibold">Preguntas binarias</h4>
        <p>
          Las cuestiones binarias se pueden resolver como <strong>Sí</strong>o
          <strong>No</strong> (a menos que los criterios de resolución sean
          subficilados o contorsionados de otra manera, en cuyo caso pueden
          resolverlo tan <strong>ambiguo</strong> ). Las preguntas binarias son
          apropiadas cuando un evento puede ocurrir o no ocurre. Por ejemplo, la
          pregunta
          <Link href="/questions/6296/us-unemployment-above-5-through-nov-2021/">
            $quot;La tasa de desempleo de los EE.UU. se mantendrá por encima del
            5% hasta noviembre de 2021?$quot;.
          </Link>
          No <strong>Não</strong> porque la tasa de desempleo cayó por debajo
          del 5% antes de la hora especificada.
        </p>
        <h4 className="text-lg font-semibold">Cuestiones de gamma</h4>
        <p>
          Las preguntas del alcance resuelven un cierto valor, y los analistas
          pueden especificar una distribución de probabilidad para estimar la
          probabilidad de que cada valor ocurra. Las preguntas intervalentes
          pueden tener límites abiertos o cerrados. Si los límites se cierran,
          la probabilidad solo puede asignarse a valores que se entren dentro de
          los límites. Si uno o más de los límites están abiertos, los
          meteorólogos pueden asignar probabilidad fuera del límite, y la
          pregunta puede resolver cómo salirse del límite.
          <a href="#out-of-bounds-resolution">Veja aqui</a>
        </p>
        <p>
          La interfaz de intervalo le permite introducir varias distribuciones
          de probabilidad con diferentes pesos.
          <a href="#range-interface">Vea aquí</a> para más detalles sobre el uso
          de la interfaz.
        </p>
        <p>
          Hay dos tipos de preguntas de rango, preguntas de intervalo nucleal y
          preguntas del rango de fecha.
        </p>
        <h5 className="text-lg font-semibold">El rango numérico</h5>
        <p>
          Las preguntas de rango numérico se pueden resolver como un valor
          numérico. Por ejemplo, la pregunta
          <Link href="/questions/7346/initial-jobless-claims-july-2021/">
            &quot;Cuál será el promedio de 4 semanas de solicitudes iniciales de
            desempleo (en miles) presentadas en julio de 2021?&quot;
          </Link>
          resuelto como <strong>395,</strong> porque la fuente subyacente
          reportó 395.000 solicitudes iniciales de desempleo para julio de 2021.
        </p>
        <p>
          Las preguntas también pueden resolver fuera del intervalo numérico.
          Por ejemplo, la pregunta
          <Link href="/questions/6645/highest-us-core-cpi-growth-in-2021/">
            $quot;Cuál será el nivel más alto de crecimiento anualizado del IPC
            de los Estados Unidos en 2021$quot;, según EE.UU. Los datos de la
            Oficina de Estadísticas Laborales se
          </Link>
          resolvieron como <strong>6.5</strong> porque la fuente subyacente
          reportó un crecimiento anualizado del IPC básico de 6.5% en los
          EE.UU., y 6.5 fue el límite superior.
        </p>
        <h5 className="text-lg font-semibold">Alcance de fechas</h5>
        <p>
          Las preguntas del intervalo de fecha se pueden resolver como una fecha
          determinada. Por ejemplo, la pregunta
          <Link href="/questions/8723/date-of-next-who-pheic-declaration/">
            &quot;Cuándo se declarará la próxima emergencia de salud pública de
            la preocupación internacional&quot; por la OMS?
          </Link>
          Resolución el <strong>23</strong> de <strong>julio de 2022</strong>,
          porque en esa fecha se declaró una emergencia de salud pública de
          preocupación internacional.
        </p>
        <p>
          Las preguntas también se pueden resolver fuera del rango de fechas.
          Por ejemplo, la pregunta
          <Link href="/questions/6947/first-super-heavy-flight/">
            Cuándo volará un SpaceX Super Heavy Booster?
          </Link>
          Resuelto el 29 de <strong>marzo de 2022</strong> porque un propulsor
          SpaceX Super Heavy no fue lanzado antes del 29 de marzo de 2022, que
          era el límite superior.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="question-groups"
        >
          Qué cuestionan los grupos?
        </h3>
        <p>
          Los grupos de preguntas son conjuntos de preguntas o resultados
          relacionados de preguntas estrechamente relacionadas, todas recogidas
          en una sola página. Los meteorólogos pueden predecir rápida y
          eficientemente estos resultados interconectados, confiados en que
          mantienen todas sus predicciones internamente consistentes.
        </p>
        <h4 className="text-lg font-semibold">
          Cómo facilitan los grupos de preguntas una previsión más eficiente y
          precisa?
        </h4>
        <p>
          Con los grupos de preguntas, es fácil predecir progresivamente
          distribuciones más amplias en el futuro que usted predice que
          reflejará una creciente incertidumbre. Un grupo de preguntas que
          recoge múltiples preguntas binarias sobre un conjunto limitado de
          resultados o sobre resultados mutuamente excluyentes hace más fácil
          ver qué predicciones están en tensión entre sí.
        </p>
        <h4 className="text-lg font-semibold">
          Qué sucede con las páginas de preguntas existentes cuando se combinan
          en un grupo de preguntas?
        </h4>
        <p>
          Cuando las preguntas regulares de predicción se convierten en
          &quot;sub-preguntas&quot; de un grupo de preguntas, las páginas
          originales se sustituyen por una sola página de grupo de preguntas.
          Los comentarios que alguna vez vivieron en las páginas de preguntas
          individuales se trasladan a la sección de comentarios de la página de
          grupo recién creada con una nota que indica el cambio.
        </p>
        <h4 className="text-lg font-semibold">
          Necesito predecir en cada resultado/sub-pregunta de un grupo de
          preguntas?
        </h4>
        <p>
          - No, no. Los grupos de preguntas comprenden varias subpreguntas
          <i>independientes</i>. Por esta razón, no hay ningún requisito de que
          prediga todos los resultados dentro de un grupo.
        </p>
        <h4 className="text-lg font-semibold">
          Cómo se puntúan los grupos de preguntas?
        </h4>
        <p>
          Cada resultado o sub-cuestión se puntúa de la misma manera que un
          problema independiente normal.
        </p>
        <h4 className="text-lg font-semibold">
          Por qué no cuestionar las probabilidades del resultado del grupo al
          100%?
        </h4>
        <p>
          Aunque sólo puede haber un resultado para un grupo determinado de
          preguntas, la prestación de la Comunidad funciona en cuanto a
          cuestiones normales independientes. La Predicción Comunitaria seguirá
          mostrando una mediana ponderada o agregado de las previsiones en cada
          subpregunte, respectivamente. Estas medianas y agregados ponderados no
          se limitan al 100%.
        </p>
        <p>
          La retroalimentación de los grupos de preguntas puede proporcionarse
          en el
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            post de
          </Link>
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            debate
          </Link>
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            del grupo
          </Link>
          <Link href="/questions/9861/2022-3-9-update-forecast-question-groups/">
            de preguntas
          </Link>
          .
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="conditionals">
          Qué son los pares condicionales?
        </h3>
        <p>
          Un Padre Acondicionado es un tipo especial de
          <Link href="/faq/#question-groups">Grupo</Link>
          <Link href="/faq/#question-groups">de</Link> Preguntas que causa
          <a href="https://en.wikipedia.org/wiki/Conditional_probability">
            probabilidades condicionales
          </a>
          . Cada Padre condicional se encuentra entre una pregunta de los padres
          y una pregunta del niño. Tanto el Padre como el Hijo deben tener
          preguntas <Link href="/faq/#question-types">binarias</Link> del
          metaculus.
        </p>
        <p>
          Los pares condicionales hacen dos Preguntas Concondicionales (o
          &quot;Condicionales&quot; para abreviar), cada una correspondiente a
          un posible resultado del Padre:
        </p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>Si papá resuelve Sí, cómo lo resolverá el hijo?</li>
          <li>Si el Padre resuelve el No, cómo lo resolverá el niño?</li>
        </ol>
        <p>
          El primer condicional asume que &quot;El padre resuelve el sí&quot; (o
          &quot;si sí&quot; pronto). La segunda condición hace lo mismo para No.
        </p>
        <p>
          Las probabilidades condicionales son probabilidades, por lo que la
          predicción es muy similar a las preguntas binarias. La principal
          diferencia es que presentamos los dos condicionales cercanos el uno al
          otro para mayor comodidad:
        </p>
        {/* <img alt="Los dos condicionales uno al lado del otro" loading="lazy" width="730" height="75" decoding="async" data-nimg="1" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_2.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_2.jpg&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_2.jpg&amp;w=1920&amp;q=75"> */}
        <Image
          src="https://cdn.metaculus.com/conditional_faq_2.jpg"
          alt="The two conditionals next to each other"
          width={730}
          height={75}
        />
        <p>
          Las preguntas condicionadas se resuelven automáticamente cuando sus
          padres y sus hijos resuelven:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            Cuando el padre decide el Sí, el &quot;si no&quot; condicional es
            <Link href="/faq/#ambiguous-annulled">anulado</Link>. (Y viceversa.)
          </li>
          <li>
            Cuando el niño se resuelve, la condición que no ha sido anulada
            resuelve la misma cantidad.
          </li>
        </ul>
        <p>Trabajemos con un ejemplo:</p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>Papá está $quot;Va a llover hoy?$quot;</li>
          <li>El niño es $quot;Lluvia de flotación mañana?$quot;</li>
        </ul>
        <p>Así, los dos Conlotarios en el Par Con condicional serán:</p>
        <ol className="mb-4 ml-4 list-inside list-decimal space-y-2">
          <li>$quot;Si llueve hoy, llovirá mañana?$quot;</li>
          <li>$quot;Si no llueve hoy, lloverá mañana?$quot;</li>
        </ol>
        <p>
          Para la simplicidad, Metaculus presenta preguntas gráficamente
          condicionales. En la interfaz de pronóstico, están en una tabla:
        </p>
        {/* <img alt="La interfaz de pronóstico de Pares condicionales" loading="lazy" width="754" height="253" decoding="async" data-nimg="1" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_3.jpg&amp;w=828&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_3.jpg&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_3.jpg&amp;w=1920&amp;q=75"> */}
        <Image
          src="https://cdn.metaculus.com/conditional_faq_3.jpg"
          alt="The Conditional Pair forecasting interface"
          width={754}
          height={253}
        />
        <p>
          Y en los piensos, todo resultado posible del Padre es una flecha, y
          toda probabilidad condicional es una barra:
        </p>
        {/* <img alt="La baldosa de alimentación de pared condicional" loading="lazy" width="746" height="142" decoding="async" data-nimg="1" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_1.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_1.jpg&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2Fconditional_faq_1.jpg&amp;w=1920&amp;q=75"> */}
        <Image
          src="https://cdn.metaculus.com/conditional_faq_1.jpg"
          alt="The Conditional Pair feed tile"
          width={746}
          height={142}
        />
        <p>Vuelve al ejemplo:</p>
        <p>
          Llueve hoy. Los padres resuelven. Esto desencadena que el segundo
          condicional (&quot;si no&quot;) sea anulado. No está marcado.
        </p>
        <p>
          Espera un día. Esta vez no llueve. El niño no decide. Esto desencadena
          el reposo condicional ($quot;si sí$quot;) para resolver No. Se puntúa
          como una pregunta binaria normal.
        </p>
        <h4 className="text-lg font-semibold">
          Cómo puedo crear pares condicionales?
        </h4>
        <p>
          Usted puede crear y enviar pares condicionales como cualquier otro
          tipo de pregunta. En
          <Link href="/questions/create/">la página &quot;Crear una</Link>{" "}
          pregunta&quot;, seleccione Tipo de pregunta &quot;condicional&quot; y
          seleccione Preguntas de Padre y Niño.
        </p>
        <p>
          Nota: Puede utilizar sub-preguntas grupales de preguntas como Padre o
          Hijo haciendo clic en el botón Padre o Niño, y luego buscando la
          sub-cuestión en el campo o pegando la URL para la sub-cuestión.
        </p>
        <p>
          Para copiar la URL de una sub-cuestión, simplemente visite una página
          de preguntas y haga clic en el menú &quot;.&quot;... para revelar la
          opción Copy Link.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="navigation-and-filtering"
        >
          Cómo puedo encontrar ciertas preguntas sobre Metaculus?
        </h3>
        <p>
          Las preguntas sobre Metaculus se clasifican por actividad por defecto.
          Las últimas preguntas, preguntas con nuevos comentarios, preguntas
          recientemente votadas, y preguntas con muchas nuevas predicciones
          aparecerán en la parte superior de la{" "}
          <Link href="/questions/">página</Link>
          de inicio de <Link href="/questions/">Metaculus</Link>. Sin embargo,
          hay varias maneras adicionales de encontrar problemas de interés y
          personalizar la forma en que interactúa con Metaculus.
        </p>
        <h4 className="scroll-mt-nav text-lg font-semibold" id="search-bar">
          Busca Barra
        </h4>
        <p>
          La barra de búsqueda se puede utilizar para encontrar preguntas usando
          palabras clave semánticas y correspondencias. En este momento, no se
          puede buscar comentarios o usuarios.
        </p>
        <h4 className="scroll-mt-nav text-lg font-semibold" id="filters">
          Filtros de filtros
        </h4>
        <p>
          Las preguntas se pueden ordenar y filtrar de manera diferente a la
          norma utilizando el menú de filtro. Las preguntas se pueden filtrar
          por tipo, estatus y participación. Las preguntas también se pueden
          ordenar, por ejemplo, $quot;más joven$quot;. Tenga en cuenta que las
          opciones disponibles cambian cuando se seleccionan diferentes filtros.
          Por ejemplo, si se filtra por preguntas $quot;Closed$quot;, se
          mostrará una opción a pedido por $quot;Soonest Resolve$quot;.
        </p>
        <h2
          className="scroll-mt-nav text-2xl font-bold"
          id="question-resolution"
        >
          Solución de cuestiones
        </h2>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="closers">
          Qué son la $quot;fecha de apertura$quot;, $quot;fecha de cierre$quot;
          y $quot;fecha de resolución$quot;?
        </h3>
        <p>
          Al enviar una pregunta, debe especificar la fecha de cierre (cuando la
          pregunta ya no está disponible para predecir) y la fecha de resolución
          (cuando se produce la resolución). La fecha en que la pregunta está
          fijada en vivo para que otros prediquen se conoce como la fecha de
          apertura.
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            La <strong>fecha de apertura</strong> es la fecha/hora en que la
            cuestión está abierta para las previsiones. Antes de este momento,
            si el tema está activo, tendrá estatus &quot;promado&quot; y
            potencialmente estará sujeto a cambios basados en la
            retroalimentación. Después de la fecha de apertura, el cambio de
            preguntas está altamente desalentado (ya que podría alterar los
            detalles que son relevantes para las predicciones que ya se han
            enviado) y estos cambios se notan generalmente en el cuerpo del tema
            y en los comentarios sobre el tema.
          </li>
          <li>
            La <strong>fecha de cierre</strong> es la fecha/hora posterior a la
            cual las previsiones ya no se pueden actualizar.
          </li>
          <li>
            La <strong>fecha</strong> de <strong>la resolución</strong> es la
            fecha en que el evento programado debe haber ocurrido
            definitivamente (o no). Esta fecha permite a Metaculus Admins saber
            cuándo la pregunta puede estar lista para ser resuelta. Sin embargo,
            esto suele ser sólo una conjetura y no es obligatorio en absoluto.
          </li>
        </ul>
        <p>
          En algunos casos, las preguntas deben resolverse en la fecha de la
          resolución de acuerdo con la mejor información disponible. En estos
          casos, es importante elegir cuidadosamente la fecha de la resolución.
          Trate de establecer fechas de resolución que hagan las preguntas
          interesantes y perspicaces. La fecha o el plazo que se está haciendo
          la pregunta debe ser siempre mencionado explícitamente en el texto
          (por ejemplo, &quot;esta pregunta se resuelve como el valor de X el 1
          de enero de 2040, según la fuente Y&quot; o &quot;esta cuestión
          resuelve cómo
          <strong>Sí</strong> si X sucede antes del 1 de enero de 2040)&quot;.
        </p>
        <p>
          La fecha límite <em>debería</em> ser al menos una hora antes de la
          fecha de la resolución, pero puede ser mucho más temprana dependiendo
          del contexto. Aquí están algunas pautas para especificar la fecha de
          cierre:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            Si el resultado de la cuestión es muy probable o seguramente se
            determina en un momento fijo conocido, el tiempo de cierre debe ser
            inmediatamente antes de este momento y el momento de la resolución
            justo después de eso. (Ejemplo: un concurso programado entre
            competidores o la divulgación de datos programados)
          </li>
          <li>
            Si el resultado de una pregunta está determinado por algún proceso
            que se producirá en un momento desconocido, pero es probable que el
            resultado sea independiente de ese tiempo, entonces debe
            especificarse que la cuestión
            <Link href="/faq/#retroactive-closure">
              cierra retroactivamente
            </Link>
            algún tiempo apropiado antes del comienzo del proceso. (Ejemplo:
            éxito de un lanzamiento de cohete en un momento desconocido)
          </li>
          <li>
            Si el resultado de una pregunta depende de un evento discreto que
            pueda o no ocurrir, la hora límite debe especificarse como justo
            antes de la hora de la resolución. El tiempo de resolución se elige
            en función de la discreción del autor del período de interés.
          </li>
        </ul>
        <p>
          <strong>Nota:</strong> Las directrices anteriores sugerían que una
          pregunta se cerrara entre 1/2 y 2/3 de la trayectoria entre el tiempo
          de apertura y el tiempo de resolución. Esto era necesario debido al
          sistema de puntuación en ese momento, pero fue reemplazado por las
          directrices anteriores debido a una
          <Link href="/questions/10801/discontinuing-the-final-forecast-bonus/">
            actualización del sistema de puntuación
          </Link>
          .
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="timezone">
          Qué zona horaria se utiliza para preguntas?
        </h3>
        <p>
          Para fechas y horarios escritos en la pregunta, como &quot;el evento X
          tendrá lugar antes del 1 de enero de 2030?&quot;, si no se especifica
          el tiempo
          <a href="https://en.wikipedia.org/wiki/Coordinated_Universal_Time">
            establecido Tiempo Universal Coordinado (UTC).
          </a>
          Los autores de la pregunta son libres de especificar un huso horario
          diferente en los criterios de resolución, y se utilizará cualquier
          huso horario especificado en el texto.
        </p>
        <p>
          Para preguntas del <Link href="/faq/#question-types">rango</Link> de
          <Link href="/faq/#question-types">fechas</Link>, las fechas en la
          interfaz están en UTC. Normalmente, la hora del día hace poca
          diferencia, ya que un día es diminuto en comparación con el rango
          completo, pero ocasionalmente para preguntas a corto plazo, la hora
          del día puede afectar materialmente las puntuaciones. Si no está claro
          qué punto en un plazo determinado se resolverá una cuestión de
          intervalo de fecha, se resolverá como punto
          <Link href="/faq/#whenresolve">medio de dicho período</Link>. Por
          ejemplo, si una pregunta dice que resolverá como un día en particular,
          pero no a la hora del día, se resolverá como UTC mediodía de ese día.
        </p>
        <h3 className="scroll-mt-nav text-xl font-semibold" id="who-resolves">
          Quién decide la resolución para una pregunta?
        </h3>
        <p>
          Sólo los administradores de Metaculus pueden resolver preguntas. Las
          preguntas binarias pueden resolver <strong>Sí</strong>,
          <strong>No</strong>,
          <Link href="/faq/#ambiguous-annulled">Imbig o Anguated</Link>. Las
          preguntas interval pueden resolver un valor específico, un valor fuera
          de los límites,{" "}
          <Link href="/faq/#ambiguous-annulled">capaz o anulado</Link>.
        </p>
        <h3
          className="scroll-mt-nav text-xl font-semibold"
          id="ambiguous-annulled"
        >
          Qué son las resoluciones de &quot;angectic&quot; y
          &quot;annulled&quot;?
        </h3>
        <p>
          A veces una pregunta no se puede resolver porque el estado del mundo,
          la <q>verdad del asunto</q>, es muy incierto. En estos casos, la
          cuestión se resuelve como ambigua.
        </p>
        <p>
          Otras veces, el estado del mundo es claro, pero una suposición
          fundamental de la cuestión ha sido derribada. En estos casos, la
          cuestión queda anulada.
        </p>
        <p>
          Del mismo modo, cuando un condicional resulta basarse en un resultado
          que no se produjo, se anula. Por ejemplo, cuando un padre de Par
          <Link href="/faq/#conditionals">conlational</Link> resuelve Sí, el{" "}
          <q>no</q>
          condicional es Cancelar.
        </p>
        <p>
          Cuando las preguntas se anulan o resuelven como ambiguas, ya no están
          abiertas a la previsión y no se puntúan.
        </p>
        <p>
          <em>
            Si quieres leer más sobre por qué se necesitan resoluciones ambiguas
            y anuladas, puedes ampliar la sección a continuación.
          </em>
        </p>
        <div>
          <p className="cursor-pointer font-semibold">
            Razones de resoluciones ambiguas y anuladas
          </p>
          <div className="mt-2">
            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="reason-annulled"
            >
              Por qué esta pregunta fue anulada o resuelta como ambigua?
            </h3>
            <p>
              Una resolución ambigua o anulada suele implicar que había alguna
              ambiguedad inherente en la cuestión, que los acontecimientos del
              mundo real subvirticiaban una de las suposiciones de la cuestión,
              o que no había un consenso claro sobre lo que realmente ocurrió.
              Metaculus se esfuerza por satisfacer las resoluciones de todas las
              cuestiones, y sabemos que las resoluciones ambiguas y anuladas son
              decepcionantes e insatisfactorias. Sin embargo, a la hora de
              resolver problemas, tenemos que considerar factores como la
              equidad a todos los analistas participantes y los incentivos
              subyacentes para previsiones precisas.
            </p>
            <p>
              Para evitar esta injusticia y proporcionar la información más
              precisa, resolvemos todas las preguntas de acuerdo con el texto
              escrito real de los criterios de resolución siempre que sea
              posible. Al adherir lo más posible a una interpretación razonable
              de lo que está escrito en los criterios de resolución, minimizamos
              el potencial de los predictores para idear diferentes
              interpretaciones de lo que se está haciendo la pregunta, lo que
              conduce a una puntuación más justa y mejores predicciones. En los
              casos en que el resultado de una cuestión no se corresponde
              claramente con la dirección o las hipótesis del texto de los
              criterios de resolución, la resolución ambigua o la cuestión nos
              permite preservar la equidad en la puntuación.
            </p>
            <h3
              className="scroll-mt-nav text-lg font-semibold"
              id="types-annulled"
            >
              Tipos de resoluciones ambiguas oulares
            </h3>
            <p>
              Los criterios para resolver un asunto pueden considerarse
              similares a un contrato legal. Los criterios de resolución crean
              una comprensión compartida de lo que los meteorólogos pretenden
              predecir y definir el método por el cual aceptan ser puntuados
              para obtener precisión al elegir participar. Cuando dos
              meteorólogos que han leído diligentemente los criterios para
              resolver una pregunta salen con percepciones significativamente
              diferentes de la importancia de este problema, crea injusticia
              para al menos uno de estos meteorólogos. Si ambas percepciones son
              interpretaciones razonables del texto, entonces uno de estos
              meteorólogos probablemente recibirá una mala puntuación en el
              momento de la resolución sin culpa propia. Además, la información
              proporcionada por las predicciones sobre el tema será mala debido
              a las diferentes interpretaciones.
            </p>
            <p>
              Las secciones siguientes proporcionan más detalles sobre las
              razones comunes por las que resolvemos cuestiones tales como
              ambiguos o anulados y algunos ejemplos. Algunos de estos ejemplos
              pueden clasificarse en varias categorías, pero los enumeramos en
              una categoría principal como ejemplos ilustrativos. Esta lista de
              tipos de resoluciones ambiguas o anuladas no es exhaustiva. Hay
              otras razones por las que un problema puede resolver ambiguos o
              anulados, pero estos abarcan algunos de los escenarios más comunes
              y algunos de los escenarios más complicados. Aquí hay una versión
              condensada, pero siga leyendo para más detalles:
            </p>
            <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
              <li>
                <a href="#ambiguous-details">
                  <strong>Resolución ambigua</strong>
                </a>
                <strong>.</strong> Reserviada para cuestiones en las que la
                realidad no está clara.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#no-clear-consensus">
                    <strong>No hay un consenso claro</strong>
                  </a>
                  <strong>,</strong> no hay suficiente información para llegar a
                  una resolución apropiada.
                </li>
              </ul>
              <li>
                <a href="#annulment-details">
                  <strong>A anulação</strong>
                </a>
                <strong>.</strong> Reservado para preguntas dónde la realidad es
                clara, pero la cuestión no lo es.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  <a href="#annulled-underspecified">
                    <strong>Subespección bajo especificación</strong>
                  </a>
                  <strong>.</strong> La cuestión no describe claramente un
                  método apropiado para resolver el problema.
                </li>
                <li>
                  <a href="#annulled-subverted">
                    <strong>La</strong>
                  </a>
                  <strong>.</strong> pregunta hizo que suposiciones sobre el
                  estado presente o futuro del mundo violaran.
                </li>
                <li>
                  <a href="#annulled-imbalanced">
                    <strong>La</strong>
                  </a>
                  <strong>.</strong> cuestión binaria no especificó
                  adecuadamente un medio para la resolución Sí o No, que dio
                  lugar a resultados desequilibrados e incentivos malos.
                </li>
              </ul>
            </ul>
            <p>
              <strong>Nota:</strong> Anteriormente Metaculuso tenía sólo un tipo
              de resolución - ambigua - para los casos en que una cuestión no
              podía resolverse de otra manera. Desde entonces, hemos separado
              esto en dos tipos ambiguos y anulados para proporcionar claridad
              sobre por qué una pregunta no podría resolverse de otra manera.
              Las preguntas denuncian se convirtieron en una opción en abril de
              2023.
            </p>
            <h4
              className="scroll-mt-nav text-lg font-semibold"
              id="ambiguous-details"
            >
              Resolución ambigua
            </h4>
            <p>
              La resolución ambigua se reserva para cuestiones en las que la
              realidad no está clara. Ya sea porque el informe sobre un evento
              es contradictorio o no está claro sobre lo que realmente sucedió,
              o el material disponible guarda silencio sobre la información que
              se busca. Describimos el tipo de cuestiones en las que la ambigua
              resolución es apropiada, para aquellos que
              <a href="#no-clear-consensus">no</a> tienen
              <a href="#no-clear-consensus">un consenso claro</a>.
            </p>
          </div>
        </div>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="no-clear-consensus"
        >
          Sin un consenso claro
        </h5>
        <p>
          Las cuestiones también pueden resolver ambiguas cuando no hay
          suficiente información disponible para llegar a una resolución
          apropiada. Esto puede deberse a informes contradictorios u oscuros de
          los medios de comunicación, o porque una fuente de datos que debe
          proporcionar información de resolución ya no está disponible. A
          continuación se presentan algunos ejemplos en los que no hubo un
          consenso claro.
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/9459/russian-troops-in-kiev-in-2022/">
              <strong>
                <em>
                  Las tropas rusas entrarán en Kiev, Ucrania antes del 31 de
                  diciembre de 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta se hizo si al menos 100 soldados rusos entrarían
                en Ucrania antes de finales de 2022. Estaba claro que algunas
                tropas rusas entraron en Ucrania, e incluso probablemente hubo
                más de 100 tropas rusas en Ucrania. Sin embargo, no hay pruebas
                claras que puedan utilizarse para resolver la cuestión, por lo
                que es necesario resolverla como ambigua. Además de la falta de
                un consenso claro, esta cuestión es también un ejemplo de
                resultados desequilibrados y de la necesidad de preservar los
                incentivos.
                <Link href="/questions/9459/russian-troops-in-kiev-in-2022/#comment-93915">
                  Como explica un administrador aquí
                </Link>
                , debido a la incertidumbre que rodea los acontecimientos en
                febrero, la pregunta no podría permanecer abierta para ver si un
                evento de calificación tendría lugar antes de finales de 2022.
                Esto se debe a que la ambiguedad que rodea los acontecimientos
                de febrero requeriría que el tema sólo pudiera resolver cómo el
                Sí o Ambiguous, lo que crea un incentivo para predecir con
                confianza un resultado del Sí.
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
                  Cuál es el costo promedio de un kit de ransomware en 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta se basó en los datos publicados en un informe de
                Microsoft, sin embargo, el informe de Microsoft correspondiente
                al año en cuestión ya no contenía los datos pertinentes. La
                <Link href="/faq/#ressrc">política de Metaculus</Link> es que,
                por defecto, si no se dispone de una fuente de resolución,
                Metaculus puede utilizar una fuente funcionalmente equivalente
                en su lugar, a menos que se especifique otra cosa en el texto de
                resolución, pero para esa cuestión no apareció en absoluto una
                búsqueda de fuentes alternativas, lo que condujo a una
                resolución ambigua.
              </li>
            </ul>
          </li>
        </ul>
        <h4
          className="scroll-mt-nav text-lg font-semibold"
          id="annulment-details"
        >
          La anulación
        </h4>
        <p>
          Anotar una pregunta está reservada a situaciones en las que la
          realidad es clara, pero la cuestión no lo es. En otras palabras, la
          cuestión no logró capturar adecuadamente un método para una resolución
          clara.
        </p>
        <p>
          <strong>Nota:</strong> La anulación se introdujo en abril de 2023, así
          que mientras que los siguientes ejemplos describen la anulación, las
          cuestiones de la realidad se han resuelto como ambiguas.
        </p>
        <h5
          className="scroll-mt-nav text-lg font-semibold"
          id="annulled-underspecified"
        >
          El tema fue subspectivo
        </h5>
        <p>
          Escribir buenas preguntas de predicción es difícil, y sólo se hace más
          difícil cuanto más lejos la pregunta mira hacia el futuro. Para
          eliminar completamente el potencial de una pregunta anulada, los
          criterios de resolución deben anticipar todos los resultados posibles
          que puedan producirse en el futuro; en otras palabras, debe haber una
          dirección clara de cómo se resuelve la cuestión en todos los
          resultados posibles. La mayoría de las preguntas, incluso las bien
          elaboradas, no pueden considerar <em>todos los</em> resultados
          posibles. Cuando se produzca un resultado que no se corresponda con
          las instrucciones proporcionadas en los criterios para la resolución
          de la cuestión, entonces esta cuestión puede tener que ser anulada. En
          algunos casos, podemos encontrar una interpretación que se adapte
          claramente a los criterios de resolución, pero esto no siempre es
          posible.
        </p>
        <p>
          Aquí hay algunos ejemplos de anulación debido a preguntas
          subitificadas:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/12433/substacks-google-trends-at-end-of-2022/">
              <strong>
                <em>
                  Qué será el índice Substack de Google Trends a finales de
                  2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta no especificó claramente cómo se utilizarían las
                tendencias de Google para llegar al índice promedio de diciembre
                de 2022, porque el valor del índice depende del rango de fechas
                especificado en Google Trends. Un administrador ha proporcionado
                más detalles en este
                <Link href="/questions/12433/substacks-google-trends-at-end-of-2022/#comment-112592">
                  comentario
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/">
              <strong>
                <em>Cuándo se conseguirá un reactor de fusión la ignición?</em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta no definió claramente lo que se entiende por
                ignición. Como administrador descrito en este
                <Link href="/questions/3727/when-will-a-fusion-reactor-reach-ignition/#comment-110164">
                  comentario
                </Link>
                , la definición de ignición puede variar dependiendo de los
                investigadores que la usan y el método de fusión, así como el
                marco de referencia para lo que cuenta como entrada y salida de
                energía.
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/12532/russia-general-mobilization-before-2023/">
              <strong>
                <em>
                  Rusia ordenará una movilización general antes del 1 de enero
                  de 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta se hizo acerca de que Rusia ordenó una
                movilización general, pero la difícil tarea de determinar que se
                ordenó una movilización general no se abordó adecuadamente en
                los criterios de resolución. El texto de la pregunta se preguntó
                acerca de una movilización general, pero las definiciones
                utilizadas en los criterios de resolución difirieron de la
                comprensión común de una movilización general y no explicaron
                adecuadamente la movilización parcial real que finalmente se
                ordenó, como
                <Link href="/questions/12532/russia-general-mobilization-before-2023/">
                  explica un administrador aquí
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
          Las suposiciones de la pregunta se subvertyen
        </h5>
        <p>
          Las preguntas suelen contener suposiciones en sus criterios de
          resolución, muchos de los cuales no se declaran. Por ejemplo,
          suponiendo que la metodología subyacente de una fuente de datos
          seguirá siendo la misma, suponiendo que una organización proporcione
          información sobre un evento o suponiendo que un evento se desarrolle
          de cierta manera. La mejor práctica es especificar lo que sucede en
          caso de que se violen ciertas suposiciones (incluyendo especificar que
          el tema será anulado en ciertas situaciones), pero debido a la
          dificultad para anticipar estos resultados no siempre se hace.
        </p>
        <p>
          Aquí están algunos ejemplos de anulación debido a suposiciones
          subvertidas:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/10444/cause-of-flight-5735-crash/">
              <strong>
                <em>
                  Se identificará un problema técnico como la causa del
                  accidente del vuelo 535 de China Eastern Airlines?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta cuestión se basó en las conclusiones de un futuro informe
                de la Junta Nacional de Seguridad en el Transporte (NTSB). Sin
                embargo, fue un incidente chino, por lo que era poco probable
                que la NTSB publicara tal informe. Además, la cuestión no
                especificó una fecha en la que debía publicarse el informe, lo
                que dio lugar a una resolución del No. Como esto no fue
                especificado y se violó la suposición de un futuro informe de la
                NTSB, la cuestión fue edicto, como
                <Link href="/questions/10444/cause-of-flight-5735-crash/">
                  explicó un administrador aquí
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/6249/november-2021-production-of-semiconductors/">
              <strong>
                <em>
                  Cuál será el índice de producción industrial de la Reserva
                  Federal para noviembre de 2021 para semiconductores, placas de
                  circuitos impresos y productos relacionados?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta cuestión no proporcionó una descripción de cómo debía
                resolverse en caso de que la fuente subyacente haya cambiado su
                metodología. Predijo la posibilidad de que el período base
                cambiara, sin embargo, toda la metodología utilizada para
                construir la serie cambió antes de que se resolviera esta
                cuestión, no sólo el período base. Como se violó la asunción no
                escrita de una metodología coherente, se anuló la cuestión.
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/10048/russia-to-return-to-nuclear-level-1/">
              <strong>
                <em>
                  Cuándo volverá la escala de preparación nuclear de Rusia al
                  nivel 1?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                El informe de los medios de comunicación sobre el nivel de
                preparación nuclear de Rusia dio la impresión de que el nivel se
                había cambiado al nivel 2, que condujo a la creación de esta
                cuestión. Sin embargo, una investigación más exhaustiva encontró
                que la preparación nuclear de Rusia probablemente no cambió.
                Esto violó la asunción de la pregunta que llevó a la cuestión de
                ser anulada, como
                <Link href="/questions/10048/russia-to-return-to-nuclear-level-1/#comment-100275">
                  explica un administrador aquí
                </Link>
                .
              </li>
            </ul>
          </li>
          <li>
            <Link href="/questions/9000/us-social-cost-of-carbon-in-2022/">
              <strong>
                <em>
                  Cuál será el costo social de la administración de Bidenes de 1
                  tonelada de CO2 en 2022?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta especificaba que se resolvería de acuerdo con un
                informe publicado por el Grupo de Trabajo Interinstitucional de
                los Estados Unidos (IWG), sin embargo, el IWG no publicó una
                estimación antes de finales de 2022. Esta cuestión preveía este
                resultado y especificó adecuadamente que debía anularse si no se
                habían publicado informes antes de finales de 2022, y la
                cuestión se resolvió en consecuencia.
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
          A veces las preguntas implican resultados desequilibrados, por
          ejemplo, donde la carga de la prueba para que un evento se considere
          que ha ocurrido es alta y inclina la balanza a un problema binario que
          resuelve el No, o donde la cuestión requeriría una cantidad sustancial
          de investigación para mostrar que ocurrió un evento, lo que también
          favorece una resolución de No. En ciertas circunstancias, este tipo de
          preguntas son buenas, siempre y cuando haya un mecanismo claro para
          que la cuestión se resuelva como Sí y resuelva como No. Sin embargo, a
          veces se hacen preguntas de tal manera que no hay un mecanismo claro
          para que una cuestión que se resuelva como No, lo que lleva a que los
          únicos resultados realistas sean una resolución Sim o Anulado. Esto
          crea un sesgo en la cuestión y también produce malos incentivos si el
          tema no es anulado.
        </p>
        <p>
          El caso de resultados desequilibrados e incentivos coherentes se
          explica mejor con ejemplos como los siguientes:
        </p>
        <ul className="mb-4 ml-4 list-inside list-disc space-y-2">
          <li>
            <Link href="/questions/6047/1m-lost-in-prediction-market/">
              <strong>
                <em>
                  Cualquier mercado pronosticada hará que los usuarios pierdan
                  al menos $1 millón antes de 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta se pregunta si ciertos incidentes como hackeo,
                estafas o resolución incorrecta llevan a los usuarios a perder
                $1 millón o más de un mercado previsto. Sin embargo, no hay un
                mecanismo claro especificado para encontrar información al
                respecto, ya que los mercados de previsión no son comúnmente
                objeto de informes de los medios de comunicación. Demostrar
                concretamente que esto no ocurrió requeriría una investigación
                exhaustiva. Esto crea un desequilibrio en los criterios de
                resolución. La pregunta se resolvería como Sí si hubiera un
                informe claro de fuentes creíbles de que esto ocurrió. Sin
                embargo, para resolver cómo no, se necesitaría una investigación
                extensa para confirmar que no ha ocurrido y un conocimiento de
                los acontecimientos en los mercados de previsión que la mayoría
                de la gente no lo hace. Resolver cómo no Metaculus tendría que
                hacer una cantidad absurda de investigación, o asumir que la
                falta de informes prominentes sobre el tema es suficiente para
                resolver como No. En este caso, la cuestión tuvo que ser
                anulada.
              </li>
              <ul className="ml-4 list-inside list-disc space-y-2">
                <li>
                  Ahora considere si ha habido un informe claro de que esto
                  realmente ocurrió. En un mundo donde esto sucedió, la pregunta
                  podría haberse resuelto como sí. Sin embargo, los usuarios
                  experimentados que siguen nuestros métodos en Metaculus pueden
                  darse cuenta de que cuando un mecanismo para una resolución
                  Sin que no esté claro, esta pregunta resolverá cómo se anula
                  el Sí o será anulado. Esto crea malos incentivos, ya que estos
                  experimentados analistas pueden comenzar a aumentar la
                  probabilidad de resolver Sim en pronósticos futuros similares,
                  ya que predicen cómo Metacula maneja estos problemas. Por esta
                  razón, las preguntas binarias deben tener un mecanismo claro
                  de cómo se resuelven como Sí y No. Si el mecanismo no está
                  claro, puede crear malos incentivos. Cualquier duda sin un
                  mecanismo claro para resolver cómo deben anularse ambos
                  posibles resultados, incluso si un evento de clasificación
                  resolvería el problema como Sí.
                </li>
              </ul>
            </ul>
          </li>
          <li>
            <Link href="/questions/13521/any-ftx-depositor-to-get-anything-out-by-2023/">
              <strong>
                <em>
                  Cualquier depositante restante de FTX retirará cualquier
                  cantidad de activos negociables de FTX antes de 2023?
                </em>
              </strong>
            </Link>
            <ul className="ml-4 list-inside list-disc space-y-2">
              <li>
                Esta pregunta es si un depositante de FTX retiraría los activos
                donde la retirada fue liquidada por FTX. Desafortunadamente,
                esta pregunta requería un conocimiento de los detalles de los
                retiros de FTX que no estaban disponibles para los
                Administradores, resultando en que no había un mecanismo real
                para resolver el problema como No. Esto condujo a un
                desequilibrio en los posibles resultados, en los que la cuestión
                sólo podía resolver realmente cómo el sí o ser anulado. El
                desequilibrio exige que la cuestión se resuelva como ambigua
                para preservar los incentivos coherentes para la previsión.
              </li>
            </ul>
          </li>
        </ul>
        <div>
          <h3 id="allres" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            Se resuelven todas las preguntas?
          </h3>
          <p>Todas las preguntas se resolverán.</p>
        </div>
        <div>
          <h3
            id="whenresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cuándo se resolverá una pregunta?
          </h3>
          <p>
            Las preguntas se resolverán cuando haya cumplido los criterios
            especificados en la sección de resolución del asunto (o, a la
            inversa, cuando estos criterios no se hayan cumplido de manera
            concluyente). Cada pregunta también tiene una $quot;Fecha de
            Resolución$quot; listada en nuestro sistema para fines de
            clasificación de preguntas; sin embargo, esta fecha lista no suele
            ser más que una aproximación, y la fecha real de resolución no se
            puede conocer de antemano.
          </p>
          <p>
            Para las preguntas que se hagan cuándo sucederá algo (como
            <q>
              <Link href="/questions/3515/when-will-the-first-humans-land-successfully-on-mars/">
                cuando los primeros humanos aterrizarán con éxito en Marte?
              </Link>
            </q>
            ), se pide a los meteorólogos que prediquen la fecha/hora en que se
            han cumplido los criterios (aunque el tema puede decidirse y los
            puntos adjudicados en algún momento posterior cuando la evidencia es
            concluyente). Algunas preguntas predicen intervalos de tiempo
            general, como &quot;qué mes el desempleo pasará por debajo del
            4%?&quot; ; Cuando se especifique la fecha/hora que se utilizará, se
            utilizarán estos términos. Si no se dan estos términos, la política
            de impago será resolverla como{" "}
            <strong>punto medio de ese periodo</strong>
            (por ejemplo, si el informe de enero es el primer mes de desempleo
            por debajo del 4%, la fecha de la resolución será incumplida para el
            15 de enero).
          </p>
        </div>
        <div>
          <h3
            id="resolvebackground"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Se utiliza el material de fondo para la resolución de preguntas?
          </h3>
          <p>
            No, sólo los criterios de resolución son pertinentes para resolver
            una cuestión, la sección de antecedentes sólo tiene por objeto
            proporcionar información y contexto potencialmente útiles para los
            analistas. En una pregunta bien especificada, los criterios de
            resolución deben permanecer por sí solos como una serie de
            instrucciones autosuficientes para resolver la cuestión. En casos
            raros o preguntas más antiguas sobre Metaculus, puede ser necesario
            material de antecedentes para informar la resolución, pero la
            información en los criterios de resolución reemplaza información
            contradictoria en el material de antecedentes.
          </p>
          <p>
            Sin embargo, queremos que el material de fondo sea lo más útil
            posible y capture con precisión el contexto y la información
            pertinente disponibles en el momento en que se escribió la pregunta,
            así que si ve errores o información engañosa en el contexto de una
            pregunta, por favor informe a los Administradores etiquetando a los
            administradores en un comentario.
          </p>
        </div>
        <div>
          <h3
            id="unclearresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué sucede si los criterios para resolver una pregunta no son claros
            o subóptimos?
          </h3>
          <p>
            Nos encargamos de formular preguntas que estén lo más claramente
            especificadas posible. Sin embargo, escribir preguntas claras y
            objetivamente solucionables es un desafío, y en algunos casos, los
            criterios para resolver una cuestión pueden permitir
            involuntariamente múltiples interpretaciones diferentes o no pueden
            representar con precisión la pregunta que se le hace. Al decidir
            cómo abordar las cuestiones que se han arrojado con estas
            deficiencias, los Administradores consideran principalmente la
            equidad para los meteorólogos. Emitir aclaraciones o ediciones a
            preguntas abiertas puede perjudicar algunas de las puntuaciones del
            pronosticador cuando la aclaración cambia significativamente el
            significado del asunto. Sobre la base de una evaluación de la
            equidad y otros factores, los administradores pueden aclarar una
            pregunta abierta para especificar mejor el significado. Esto suele
            ser más apropiado cuando una pregunta no ha estado abierta durante
            mucho tiempo (y por lo tanto las predicciones pueden actualizarse
            con un impacto insignificante para las puntuaciones), cuando una
            pregunta contiene criterios inconsistentes o contradictorios, o
            cuando la aclaración añade especificidad cuando antes no había
            ninguna de una manera que evitara cambios sustanciales en el
            significado.
          </p>
          <p>
            En muchos casos, estas cuestiones deben resolverse como
            <a href="#ambiguous-annulled">ambiguas o anuladas</a> para preservar
            la equidad en la puntuación. Si usted cree que hay ambiguedades o
            conflictos en los criterios de resolución para una pregunta, por
            favor hágales a los Administradores marcando los amputs en un
            comentario. Esperamos que las inconstras se puedan identificar lo
            antes posible en la vida de un tema para que puedan abordarse. Las
            alegaciones de criterios de resolución poco claros hechos para las
            cuestiones que ya se han cerrado o a las reclamaciones que resuelvan
            incorrectamente por cuestiones que ya se han resuelto se mantendrán
            a un nivel de prueba más alto si la cuestión con los criterios de
            resolución no se ha mencionado antes, mientras que la cuestión
            estaba abierta a la previsión.
          </p>
        </div>
        <div>
          <h3
            id="reresolve"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Se pueden resolver las preguntas?
          </h3>
          <p>
            Sí, a veces las preguntas se resuelven y descubren más tarde, estas
            resoluciones se equivocaron dada la información disponible en ese
            momento. Algunas preguntas pueden incluso especificar que se
            resolverán de acuerdo con los informes o resultados iniciales, pero
            especifican la re-solución en caso de que los resultados finales no
            estén de acuerdo con los resultados iniciales (por ejemplo, las
            preguntas sobre las elecciones pueden utilizar este mecanismo para
            permitir una retroalimentación rápida a los analistas, pero llegar a
            la respuesta correcta en el caso de que la llamada electoral inicial
            estaba equivocada). Las preguntas pueden resolverse en tales casos
            si Metaculus determina que la re-resolución es apropiada.
          </p>
        </div>
        <div>
          <h3
            id="whatifres"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué pasa si una pregunta se resuelve en el mundo real antes de la
            próxima vez?
          </h3>
          <p>
            Al resolver una cuestión, el Moderador tiene la opción de cambiar el
            tiempo de cierre efectivo de una cuestión, de modo que si la
            cuestión se resuelve inequívocamente antes de la hora de cierre, la
            hora de cierre se puede cambiar a un momento ante el cual la
            resolución es incierta.
          </p>
          <p>
            Cuando una pregunta se cierra temprano, los puntos adjudicados son
            <em>sólo</em> los acumulados hasta la (nueva) hora de cierre. Esto
            es necesario para seguir anotando &quot;adeto&quot; (es decir,
            recompensando el máximo para predecir la probabilidad correcta) y
            evitar el juego de puntos, pero esto significa que los puntos
            generales (positivos o negativos) pueden terminar siendo más bajos
            de lo esperado.
          </p>
        </div>
        <div>
          <h3
            id="retroactive-closure"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cuándo se debe especificar una pregunta el cierre retroactivo?
          </h3>
          <p>
            En algunos casos, cuando se desconoce el momento de un evento, puede
            ser apropiado cambiar la fecha de cierre durante un tiempo antes de
            que se resuelva el problema, después de que se conozca la
            resolución. Esto se conoce como cierre retroactivo. No se permite el
            cierre retroactivo, excepto en el caso de un evento en el que se
            desconoce el momento del suceso y el resultado del evento es
            independiente del momento del evento descrito en las directrices de
            cierre de preguntas anteriores. Cuando el momento del evento impacta
            el resultado del evento, el cierre retroactivo violaría la
            puntuación apropiada. Para que la puntuación sea una cuestión
            adecuada, sólo debe cerrarse retroactivamente cuando el resultado es
            independiente del momento del evento. Estos son algunos ejemplos:
          </p>
          <ul className="ml-5 list-disc">
            <li>
              La fecha de lanzamiento de un cohete puede variar frecuentemente
              en base a ventanas de lanzamiento y clima, y el éxito o fracaso
              del lanzamiento es principalmente independiente de cuando se
              produce el lanzamiento.
              <strong>En este caso, el cierre retroactivo es apropiado</strong>,
              ya que el impulso del lanzamiento afectará las predicciones para
              el éxito de lanzamiento.
            </li>
            <li>
              En algunos países, se pueden convocar elecciones antes de lo
              previsto (estos se conocen como
              <a href="https://en.wikipedia.org/wiki/Snap_election">
                elecciones anticipadas
              </a>
              ). El calendario de las elecciones anticipadas suele estar a la
              altura del partido gobernante, y las elecciones suelen programadas
              en un momento en que el titular del partido lo considera favorable
              a sus perspectivas. <strong>En este caso</strong>,
              <strong>el cierre retroactivo es apropiado</strong>, ya que el
              momento de la elección afectará las predicciones para el resultado
              electoral, violando la puntuación adecuada.
            </li>
            <li>
              Anteriormente, algunas preguntas sobre Metaculus fueron aprobadas
              con cláusulas de cierre retroactiva inapropiada. Por ejemplo, la
              pregunta
              <Link href="/questions/6662/date-earth-functional-satellites-exceed-5000/">
                $quot;Cuándo superará el número de satélites artificiales
                funcionales en órbita más allá de 5.000?$quot;
              </Link>
              En
              <strong>
                este caso, <ins>el</ins> cierre retroactivo <ins>no</ins> era
                apropiado
              </strong>
              , ya que la resolución del asunto dependía de la fecha de cierre,
              ya que ambas se basaban en el número de satélites lanzados.
            </li>
          </ul>
          <p>
            A los meteorólogos a menudo les gusta el cierre retroactivo porque
            evita que los puntos se rompan cuando se produce un evento antes de
            la fecha de cierre programada originalmente. Pero para obtener las
            mejores predicciones, es importante seguir las reglas de puntuación
            adecuadas. Para obtener más información sobre
            <Link href="/help/scores-faq/#score-truncation">de</Link> puntos
            truncantes
            <Link href="/help/scores-faq/#score-truncation">
              , esta sección de preguntas frecuentes
            </Link>
            .
          </p>
          <p>
            Aunque Metaculus trata de no aprobar preguntas que especifican el
            cierre retroactivo inadecuado, a veces se especifican preguntas
            nuevas o existentes. Es política de Metaculus ignorar el cierre
            retroactivo inapropiado cuando se resuelven los problemas.
          </p>
        </div>
        <div>
          <h3
            id="whatifres2"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué pasa si se cumplen los criterios para resolver una pregunta
            antes de la hora de apertura?
          </h3>
          <p>
            Nuestros moderadores y autores cuestionan si se esfuerzan por ser lo
            más claros e informados posible sobre cada tema, pero los errores
            ocasionalmente ocurren y se decidirán por el mejor juicio de
            nuestros administradores. Para una pregunta hipotética como
            <q>
              Will, una detonación nuclear ocurrirá en una ciudad japonesa para
              2030?
            </q>
            puede ser comprendido por el sentido común que estamos preguntando
            sobre la <em>próxima</em> detonación después de las detonaciones en
            1945. En otros temas como
            <q>
              <Link href="/questions/8946/facebook-uses-explainable-news-feed-by-2026/)">
                Will, Facebook implementa un recurso para explicar las
                recomendaciones
              </Link>
            </q>
            del <q></q> uno<q></q>, estamos preguntando por la <em>primera</em>
            ocurrencia de este evento. Dado que este acontecimiento tuvo lugar
            antes de la apertura de la cuestión y esto no fue conocido por el
            autor de la cuestión, la cuestión se resolvió de manera ambigua.
          </p>
        </div>
        <div>
          <h3 id="ressrc" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            Qué pasa si ya no hay una fuente de resolución?
          </h3>
          <p>
            Hay momentos en que la intención de un tema es rastrear
            específicamente las acciones o declaraciones de organizaciones o
            personas específicas (como &quot;tal cómo muchos votos electorales
            ganarán en las elecciones presidenciales de los EE.UU&quot;. 2020
            <em>de acuerdo con el Colegio Electoral);</em> en otras ocasiones,
            nos interesan sólo la verdad real, y aceptamos una fuente de
            resolución como una aproximación aceptable (como, &quot;cuántas
            muertes de COVID-19&quot; estarán en los EE.UU. en 2021). Dicho
            esto, en muchos casos no está claro lo que se pretende.
          </p>
          <p>
            Idealmente, todas las preguntas se escribirían con un lenguaje
            maximalmente claro, pero algunas ambiguedades son inevitables. A
            menos que se especifique otra cosa, si la fuente de resolución es
            juzgada por los administradores de Metaculus como extintas,
            obsoletas o inapropiadas, los Administradores harán el mejor
            esfuerzo para reemplazarlo por un equivalente funcional. Las
            preguntas pueden exagerar esta política con un lenguaje como
            &quot;Si [esta fuente] ya no está disponible, la pregunta resolverá
            ambiguamente&quot; o &quot;Esta pregunta rastrea publicaciones de
            [esa fuente], independientemente de los mensajes de otras
            fuentes&quot;.
          </p>
        </div>
        <div>
          <h3
            id="rescouncil"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué son las Juntas de Resolución?
          </h3>
          <p>
            Metaculus utiliza las Juntas de Resolución para reducir la
            probabilidad de resoluciones ambiguas a cuestiones importantes -
            aquellas que creemos que tienen el potencial de estar en la parte
            superior del 1% de todas las cuestiones en la plataforma en términos
            de impacto.
          </p>
          <p>
            Una junta de resolución es una persona o grupo que se asigna para
            resolver un asunto. Las cuestiones de la resolución Junta se
            resuelven en la autoridad de la persona o las personas identificadas
            en los criterios de resolución. Estas personas identificarán la
            resolución que mejor se alinea con la cuestión y sus criterios de
            resolución.
          </p>
          <p>
            Si un miembro de la Junta de Resolución no está disponible para
            resolver una pregunta, Metaculus puede elegir un reemplazo adecuado.
          </p>
        </div>
        <div>
          <h2
            id="predictions"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Las previsiones de
          </h2>
        </div>
        <div>
          <h3
            id="tutorial"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Hay un tutorial o un paso a paso?
          </h3>
          <p>Estamos trabajando para recrear el tutorial.</p>
        </div>
        <div>
          <h3
            id="howpredict"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cómo hago un pronóstico? Puedo cambiar eso más tarde?
          </h3>
          <p>
            Usted hace una predicción simplemente deslizando el control
            deslizante en la página de pregunta para la probabilidad de que la
            mayoría de ellos capturen la probabilidad de que el evento ocurra.
          </p>
          <p>
            Puedes revisar tu predicción en cualquier momento hasta que el tema
            se cierre, y te animan a hacerlo: a medida que salga a la luz nueva
            información, es beneficioso tenerla en cuenta.
          </p>
        </div>
        <div>
          <h3
            id="howwithdraw"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cómo puedo retirar mi predicción?
          </h3>
          <p>
            Si usted ha hecho una predicción sobre una pregunta y todavía está
            abierto a predecir, puede retirar su predicción pulsando el botón
            $quot;retirar$quot;. Para preguntas grupales, el botón
            $quot;retirar$quot; se anida en el menú $quot;$quot;... junto a la
            opción que desea eliminar.
          </p>
          {/* <img alt="Interfaz de predicción" loading="lazy" width="700" height="400" decoding="async" data-nimg="1" className="my-4" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fwithdraw_button.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fwithdraw_button.jpg&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fwithdraw_button.jpg&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/withdraw_button.jpg"
            alt="Prediction Interface"
            className="my-4"
            width={700}
            height={400}
          />
          <p>
            Después de retirarte, ya no tienes una predicción para esta
            pregunta. Por supuesto, después de retirarte, puedes hacer una nueva
            predicción en cualquier momento y empezar a acumular puntuaciones de
            nuevo. Concretamente, esto significa que desde el momento en que te
            retiraste e incluso haces una nueva predicción:
          </p>
          <div className="text-gray-700 dark:text-gray-400">
            <ul className="list-disc pl-5">
              <li>
                Deja de acumular puntuaciones, incluyendo puntuaciones de pares,
                puntuaciones de referencia, etc.
              </li>
              <li>Deja de acumular cobertura para los rankings de pares.</li>
              <li>
                Usted no es parte de la previsión de la comunidad u otros
                agregados.
              </li>
            </ul>
          </div>
          <p>
            Ninguno de estos comportamientos es retroactivo: todavía obtienes
            puntuaciones y cobertura durante horas hasta que te hayas retirado,
            y tus predicciones pasadas no se eliminan del pronóstico de la
            comunidad.
          </p>
          <p>
            Trabajemos con un ejemplo. Una pregunta de 5 días tiene 3
            meteorólogos, Alex, Bailey y Cedar, que hacen estas predicciones:
          </p>
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  El día
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1 en (&quot;
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2 2
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
                  Alex (traducción
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80% del año
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80% del año
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80% del año
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80% del año
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  80% del año
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey (traducción
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
                  20% 20%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  20% 20%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  20% 20%
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  20% 20%
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Predicción de la comunidad
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  70% 70%
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
            Como puedes ver, Bailey se retira al final del tercer día, y Cedar
            sólo se une al segundo día. Esto cambia la previsión de la comunidad
            en el día 4: ahora es del 50%. Pero esto no cambia retroactivamente
            la previsión comunitaria el día 2: se mantiene en un 60% el día 2.
          </p>
          <p>
            Para completar el ejemplo, digamos que la pregunta resuelve Sí. Aquí
            están las puntuaciones y cobertura que cada meteorólogo recibirá por
            cada día:
          </p>
          <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-300-dark">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-100-dark">
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  El día
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  1 en (&quot;
                </th>
                <th className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  2 2
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
                  Alex (traducción
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 14</div> <div>Par de pares: 6</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 14</div> <div>Peer: 17</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 14</div> <div>Peer: 17</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 14</div> <div>Parer: 28 libras</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 14</div> <div>Parer: 28 libras</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 70</div> <div>Pared: 96</div>
                    <div>Cobertura: 1.0</div>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  Bailey (traducción
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 5</div> <div>Peer: -6</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 5</div> <div>Parer: 8</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 5</div> <div>Parer: 8</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 0</div> <div>Peer: 0 (En el juego)</div>
                    <div>Cobertura: 0</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 0</div> <div>Peer: 0 (En el juego)</div>
                    <div>Cobertura: 0</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea base: 15</div> <div>Peer: 10</div>
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
                    <div>Línea base: 0</div> <div>Peer: 0 (En el juego)</div>
                    <div>Cobertura: 0</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea de base: - 17</div> <div>Peer: - 25</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea de base: - 17</div> <div>Peer: - 25</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea de base: - 17</div> <div>Peer: -28</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea de base: - 17</div> <div>Peer: -28</div>
                    <div>Cobertura: 0,2</div>
                  </div>
                </td>
                <td className="border border-gray-300 p-2 dark:border-gray-300-dark">
                  <div className="flex flex-col gap-1">
                    <div>Línea de base: -68</div> <div>Peer: -106</div>
                    <div>Cobertura: 0,8</div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <p>
            Bailey no anotó en los días 4 y 5 cuando fue despegado, al igual que
            Cedar no anotó para el primer día antes de hacer su primera
            predicción.
          </p>
          <p>
            Para ver rápidamente qué preguntas ya ha predicho, retirado o
            incluso tener una previsión permanente, hay filtros en el menú de
            filtros:
          </p>
          {/* <img alt="Archivos de búsqueda" loading="lazy" width="700" height="500" decoding="async" data-nimg="1" className="my-4" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fsearch_filters.jpg&amp;w=750&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fsearch_filters.jpg&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Fsearch_filters.jpg&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://metaculus-web-media.s3.amazonaws.com/user_uploaded/search_filters.jpg"
            alt="Search Filters"
            className="my-4"
            width={700}
            height={500}
          />
          <p>
            Y los retiros aparecen como cruces en las listas de cronometrados:
          </p>
          {/* <img alt="Interfaz de predicción" loading="lazy" width="300" height="300" decoding="async" data-nimg="1" className="my-4" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Ftimeline_withdraw.jpg&amp;w=384&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Ftimeline_withdraw.jpg&amp;w=640&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fmetaculus-web-media.s3.amazonaws.com%2Fuser_uploaded%2Ftimeline_withdraw.jpg&amp;w=640&amp;q=75"> */}
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
            Cómo uso la interfaz de intervalo?
          </h3>
          <p>
            Algunas preguntas de Metaculus permiten entradas numéricas o de
            intervalo de fecha donde especifica la distribución de probabilidad
            que cree que es probable en una posible gama de resultados. Esta
            distribución de probabilidad se conoce como una
            <a href="https://en.wikipedia.org/wiki/Probability_density_function">
              función
            </a>
            de
            <a href="https://en.wikipedia.org/wiki/Probability_density_function">
              densidad
            </a>
            de
            <a href="https://en.wikipedia.org/wiki/Probability_density_function">
              probabilidad
            </a>
            y es la probabilidad por unidad de longitud. La función de densidad
            de probabilidad se puede utilizar para determinar la probabilidad de
            un valor que se cierne dentro de un rango de valores.
          </p>
          <p>
            Cuando se cuela sobre el gráfico, se ven las probabilidades en cada
            punto en la parte inferior del gráfico. Por ejemplo, en la imagen de
            abajo se puede ver la densidad de probabilidad en el valor de 136,
            denotada por &quot;P(x - 136) &quot;, y se puede ver la densidad de
            probabilidad que usted y la comunidad asignó a ese punto (en la
            imagen el usuario asignó una densidad de probabilidad de 1,40 a ese
            valor y la comunidad asignó una densidad de probabilidad de 2.97).
          </p>
          {/* <img alt="Interfaz de predicción" loading="lazy" width="769" height="773" decoding="async" data-nimg="1" className="my-4" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Finterface.png&amp;w=828&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Finterface.png&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Finterface.png&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://raw.githubusercontent.com/ryooan/faq/main/static/img/interface.png"
            alt="Prediction Interface"
            className="my-4"
            width={769}
            height={773}
          />
          <p>
            Cuando seleccione el menú desplegable &quot;Probabilidad de la
            densidad&quot; en la parte superior de la tabla, puede cambiar la
            vista a &quot;Probabilidad bucotuativa&quot;. Esta vista muestra la
            <a href="https://en.wikipedia.org/wiki/Cumulative_distribution_function">
              función de distribución acumulada
            </a>
            , o en otras palabras, para cualquier punto, muestra la probabilidad
            de que usted y la comunidad hayan asignado el problema resolviendo
            por debajo del valor indicado. Por ejemplo, en la imagen de abajo se
            puede ver la probabilidad de que usted y la comunidad hayan asignado
            al problema resolviendo por debajo del valor de 136, denotado por
            &quot;P(x - 136) &quot;. La probabilidad de que el usuario haya
            asignado es del 7% para el problema que se resuelve por debajo de
            este valor, mientras que la comunidad atribuyó un 83% de
            posibilidades al problema al resolver por debajo de ese valor.
          </p>
          {/* <img alt="Interfaz acumulada" loading="lazy" width="771" height="776" decoding="async" data-nimg="1" className="my-4" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Fcumulative.png&amp;w=828&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Fcumulative.png&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fraw.githubusercontent.com%2Fryooan%2Ffaq%2Fmain%2Fstatic%2Fimg%2Fcumulative.png&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://raw.githubusercontent.com/ryooan/faq/main/static/img/cumulative.png"
            alt="Cumulative Interface"
            className="my-4"
            width={771}
            height={776}
          />
          <p>
            Las líneas verticales mostradas en los gráficos indican las
            predicciones del percentil 25, la mediana y el percentil 75,
            respectivamente, del usuario y la comunidad. Estos valores también
            se muestran al usuario y a la comunidad en la tabla de abajo.
          </p>
        </div>
        <div>
          <h4
            id="out-of-bounds-resolution"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Resolución fuera de los límites
          </h4>
          <p>
            En la tabla que muestra las predicciones en la parte inferior de las
            imágenes de arriba, verás que además del percentil 25, mediana y
            probabilidades del percentil 75, también hay uno etiquetado como
            &quot;500&quot;. Esta pregunta tiene un límite superior abierto, lo
            que significa que los analistas pueden asignar una probabilidad de
            que el problema se resuelva como un valor por encima del extremo
            superior del rango especificado. Para la pregunta descrita
            anteriormente, la comunidad y el predictor atribuyen una
            probabilidad del 1% al problema que se resuelve por encima del
            límite superior.
          </p>
          <p>
            Las preguntas pueden tener límites abiertos o cerrados en un extremo
            del rango especificado.
          </p>
        </div>
        <div>
          <h4
            id="closed-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Límites cerrados
          </h4>
          <p>
            Un umbral cerrado significa que los analistas no pueden asignar una
            probabilidad más allá del rango especificado. Los límites cerrados
            son apropiados cuando una pregunta no se puede resolver fuera del
            rango. Por ejemplo, una pregunta que pregunta qué porción de votos
            tendrá un candidato con un rango de 0 a 100 debería tener límites
            cerrados, porque no es posible que el tema se resuelva fuera del
            rango. Los límites cerrados restringen a los meteorólogos a asignar
            probabilidades fuera del rango especificado.
          </p>
        </div>
        <div>
          <h4
            id="open-boundaries"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Límites abiertos
          </h4>
          <p>
            Un límite abierto permite resolver una cuestión fuera del intervalo.
            Por ejemplo, una pregunta que pregunta qué parte de la votación
            obtendrá un candidato con un rango de 30 a 70 debe tener límites
            abiertos, porque es posible que el candidato pueda obtener menos del
            30% de los votos o más del 70%. Los límites abiertos deben
            especificarse incluso si es poco probable que la votación esté fuera
            de su alcance porque es teóricamente posible que puedan producirse
            acciones de votación fuera del rango especificado.
          </p>
          <p>
            Los meteorólogos pueden asignar probabilidades fuera del rango
            cuando el límite está abierto moviendo el control deslizante hasta
            un lado. El peso también se puede reducir o aumentar para ajustar la
            probabilidad atribuida a una resolución fuera de los límites.
          </p>
        </div>
        <div>
          <h4
            id="multiple-components"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Componentes múltiples
          </h4>
          <p>
            En las imágenes mostradas arriba, se puede ver que el usuario asignó
            dos distribuciones de probabilidad. Se pueden añadir hasta cinco
            distribuciones logísticas utilizando el botón &quot;Añadir
            componente&quot;. El peso relativo de cada uno se puede ajustar
            usando el control deslizante &quot;peso&quot; por debajo de cada
            componente.
          </p>
        </div>
        <div>
          <h3
            id="community-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cómo se calcula la previsión comunitaria?
          </h3>
          <p>
            El pronóstico de la comunidad es un consenso de las previsiones
            recientes. Está diseñado para responder a cambios importantes en la
            opinión de los meteorólogos, aunque todavía bastante insensible a
            los valores atípicos.
          </p>
          <p>Aquí está el detalle matemático:</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>Mantenga sólo el último pronóstico de cada meteorólogo.</li>
            <li>
              Asignarlos un número
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
              , de los más viejos a los más jóvenes (el mayor es
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
              Peso cada uno por
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
                        <span className="mord mathnormal">y</span>
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
                                                    <path d="M95,702 c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14 c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54 c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10 s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429 c69,-144,104.5,-217.7,106.5,-221 l0 -0 c5.3,-9.3,12,-14,20,-14 H400000v40H845.2724 s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7 c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z M834 80h400000v40h-400000z"></path>
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
              ​ ​ antes de ser agregado.
            </li>
            <ul className="ml-5 list-disc">
              <li>
                Para <Link href="/faq/#question-types">asuntos binarios</Link>,
                el pronóstico de la comunidad es una
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  mediana mediana ponderada
                </a>
                de las posibilidades del pronosticador individual.
              </li>
              <li>
                Para
                <Link href="/faq/#question-types">
                  preguntas de opción múltiple
                </Link>
                , la previsión comunitaria es una
                <a href="https://en.wikipedia.org/wiki/Weighted_median">
                  mediana ponderada
                </a>
                de las probabilidades del pronosticador individual,
                renormalizada para la suma 1 y respeta los límites de
                <span role="math" tabIndex={-1} className="!whitespace-normal">
                  <span className="katex">
                    <span className="katex-html" aria-hidden="true">
                      <span className="base">
                        <span className="strut"></span>
                        <span className="mopen">[</span>
                        <span className="mord">0,001.</span>
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
                Para
                <Link href="/faq/#question-types">
                  las preguntas numéricas y de fecha
                </Link>
                , la previsión comunitaria es una
                <a href="https://en.wikipedia.org/wiki/Mixture_distribution">
                  media ponderada
                </a>
                de las distribuciones de los pronosticadores individuales.
              </li>
            </ul>
            <li>
              La forma particular de pesos significa que aproximadamente
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
                                    <path d="M95,702 c-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14 c0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54 c44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10 s173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429 c69,-144,104.5,-217.7,106.5,-221 l0 -0 c5.3,-9.3,12,-14,20,-14 H400000v40H845.2724 s-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7 c-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z M834 80h400000v40h-400000z"></path>
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
              ​ ​ Los analistas pronosticarán o actualizarán sus previsiones
              para modificar sustancialmente las previsiones comunitarias sobre
              una cuestión que ya tiene
              <span role="math" tabIndex={-1} className="!whitespace-normal">
                <span className="katex">
                  <span className="katex-html" aria-hidden="true">
                    <span className="base">
                      <span className="strut"></span>
                      <span className="mord mathnormal"></span>
                    </span>
                  </span>
                </span>
              </span>
              previsiones
              <span role="math" tabIndex={-1} className="!whitespace-normal">
                <span className="katex">
                  <span className="katex-html" aria-hidden="true">
                    <span className="base">
                      <span className="strut"></span>
                      <span className="mord mathnormal"></span>
                    </span>
                  </span>
                </span>
              </span>
              .
            </li>
          </ul>
          <p>
            Los usuarios pueden ocultar la predicción de la comunidad de la
            visualización de sus ajustes.
          </p>
          <h4
            id="include-bots"
            className="mb-4 scroll-mt-nav text-xl font-semibold"
          >
            Están los bots incluidos en el pronóstico de la comunidad?
          </h4>
          <p>
            Por defecto, los bots no están incluidos en ninguna agregación. Si
            lo son, se indica en la barra lateral como &quot;Incluye Bots&quot;.
          </p>
        </div>
        <div>
          <h3
            id="metaculus-prediction"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué es el pronóstico de Metaculus?
          </h3>
          <p>
            El pronóstico de Metaculus sólo se puede ver en el
            <Link href="/aggregation-explorer/">Explorer de Agregación</Link>.
            Ha estado obsoleto desde noviembre de 2024, pero muestra un registro
            de la mejor estimación del sistema Metaculus de cómo se resolverá un
            asunto. Se basa en las predicciones de los miembros de la comunidad,
            pero contrariamente a la previsión de la comunidad, no es un
            promedio simple o promedio. En cambio, Metaculus Forecast utiliza un
            modelo sofisticado para calibrar y pesar a cada usuario, lo
            idealmente resultando en una mejor predicción que la mejor de la
            comunidad.
          </p>
          <p>
            Para las preguntas resueltas en 2021, el Pronóstico Metaculus tiene
            una puntuación de Brier de 0.107. Las puntuaciones más bajas de
            Brier indican una mayor precisión, con el PM ligeramente inferior a
            la puntuación de Brier de la Predicción Comunitaria de 0,108.
          </p>
        </div>
        <div>
          <h2
            id="visibility-of-the-cp-and-mp"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Por qué no veo el PC?
          </h2>
          <p>
            Cuando una pregunta se abre por primera vez, nadie puede ver la
            predicción de la comunidad por un tiempo, para evitar dar un peso
            excesivo a las primeras predicciones, que pueden ser parciales de la
            isla o posterior.
          </p>
        </div>
        <div>
          <h3
            id="public-figure"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cuáles son las previsiones de las cifras públicas?
          </h3>
          <p>
            Las páginas de
            <Link href="/organization/public-figures/">predicción</Link> de
            <Link href="/organization/public-figures/">figuras</Link> públicas
            se dedican a recopilar y preservar importantes predicciones hechas
            por figuras públicas prominentes y a ponerlas en conversación con
            las predicciones de la comunidad Metaculus. Cada cifra presenta una
            lista de predicciones que hicieron junto con la fuente que registró
            el pronóstico, la fecha en la que se hizo el pronóstico y las
            preguntas relacionadas con Metaculus. Las previsiones públicas se
            presentan de manera transparente junto con las previsiones
            comunitarias de manera inspectora y comprensible por parte de todos,
            proporcionando responsabilidad pública y contexto adicional para los
            temas del Metaculuso vinculado.
          </p>
          <p>
            Una <em>figura pública</em> es alguien con cierta posición social
            dentro de una esfera particular de influencia, como un político,
            personalidad mediática, científico, periodista, economista,
            académico o líder empresarial.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Qué califica como un pronóstico?
          </h4>
          <p>
            Una predicción es una declaración o una declaración sobre lo que
            alguien piensa que sucederá en el futuro, donde lo predicho tiene
            alguna cantidad de incertidumbre asociada a ella.
          </p>
          <p>
            Una predicción de figura pública es una predicción hecha por la
            propia figura pública y no por números que pueden representarlos,
            como empleados, directores de campaña o portavoces.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Quién puede enviar figuras públicas?
          </h4>
          <p>
            Cuando las predicciones las hacen figuras públicas como funcionarios
            electos, funcionarios de salud pública, economistas, periodistas y
            líderes empresariales, se convierten en candidatos a su inclusión en
            el sistema de previsión del número público.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Cómo puedo enviar una previsión de figura pública?
          </h4>
          <p>
            En la página de una figura pública, haga clic en Reportar
            pronósticos y luego proporcionar
          </p>
          <ol className="ml-5 list-inside list-decimal">
            <li>Una cita directa de la fuente de noticias del pronóstico</li>
            <li>El nombre de la fuente de noticias</li>
            <li>Un enlace a la fuente de noticias</li>
            <li>Fecha de previsión</li>
            <li>Al menos una cuestión relacionada de Metaculus</li>
          </ol>
          <p>
            Si la Figura Pública no tiene ya una página dedicada, puede
            solicitar que crees comentando el post de
            <Link
              href="/questions/8198/public-figure-predictions/"
              target="_blank"
              rel="noopener"
            >
              de
            </Link>
            discusión de
            <Link
              href="/questions/8198/public-figure-predictions/"
              target="_blank"
              rel="noopener"
            >
              Predicciones de Figuras Públicas
            </Link>
            . Etiqueta - Cristiano para un proceso de moderación más rápido.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Cuáles son los criterios para seleccionar cuestiones relacionadas
            con Metaculus relacionadas con la Predicción de Figuras Públicas?
          </h4>
          <p>
            Dependiendo del nivel de especificidad y claridad de la predicción
            de la figura pública, un problema vinculado Metaculus puede resolver
            de acuerdo con los criterios exactos de la predicción. Por ejemplo,
            <Link
              href="/questions/8225/public-figure-prediction-by-joe-biden/"
              target="_blank"
              rel="noopener"
            >
              Joe Biden expresó que planea postularse para la reelección
            </Link>
            .
            <Link
              href="/questions/6438/will-joe-biden-run-for-reelection/"
              target="_blank"
              rel="noopener"
            >
              Esta pregunta de Metaculus pregunta directamente si se postulará
            </Link>
            .
          </p>
          <p>
            Las preguntas viles no son necesarias, sin embargo, para
            corresponder directamente a la predicción de la figura pública, y
            <Link
              href="/questions/5712/biden-2024-re-nomination/"
              target="_blank"
              rel="noopener"
            >
              esta pregunta de si Biden será el candidato demócrata en 2024
            </Link>
            es claramente relevante para la reivindicación de figuras públicas,
            aunque esté más lejos de la pretensión que preguntar si Biden se
            postulará. Las preguntas vinculadas pertinentes arrojan luz, crean
            un contexto adicional o proporcionan pruebas potenciales a favor o
            en contra de la reclamación de la figura pública. Tenga en cuenta
            que un problema que se está cerrando o resuelto no lo descalifica de
            estar vinculado a la previsión.
          </p>
          <p>
            Por otro lado, esta pregunta sobre si el
            <Link
              href="/questions/8523/irs-designates-crypto-miners-brokers-by-2025/"
              target="_blank"
              rel="noopener"
            >
              IRS designa a los mineros de criptomonedas como
              &quot;brokers&quot; hasta 2025
            </Link>
            sigue la Ley de Empleos de Inversión e Infraestructura de Biden,
            pero más allá de la conexión de Biden, no cumple con los criterios
            anteriores para una cuestión vinculada relevante.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Qué fuentes son aceptables?
          </h4>
          <p>
            Las fuentes de noticias que tienen autoridad y se sabe que son
            exactas son aceptables. Si varias fuentes noticiosas informan de la
            misma predicción, pero la predicción se originó a partir de una sola
            fuente, se prefiere el uso de la fuente original. Las cuentas de
            Twitter o los blogs personales son aceptables si son propiedad de la
            propia figura pública.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Quién decide qué pasa después?
          </h4>
          <p>
            Los moderadores revisarán y aprobarán su solicitud o proporcionarán
            retroalimentación.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Qué pasa si una figura pública actualiza su pronóstico?
          </h4>
          <p>
            En la página de vista previa, comente la actualización con la fuente
            y marque un moderador. El moderador revisará y realizará la
            actualización si es necesario.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xl font-semibold">
            Yo soy la figura pública que hizo la predicción. Cómo puedo reclamar
            esta página?
          </h4>
          <p>
            Envíenos un correo electrónico para obtener apoyo en metaculus.com.
          </p>
        </div>
        <div>
          <h3
            id="reaffirming"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué es una predicción?
          </h3>
          <p>
            A veces no has cambiado de opinión en una pregunta, pero todavía
            quieres registrar tu pronóstico actual. Esto se llama
            &quot;reafifirmación&quot;: predúne el mismo valor que predijiste
            antes, ahora.
          </p>
          <p>
            También es útil al clasificar las preguntas por la edad de su
            pronóstico más reciente. Reafirmando una pregunta que le envía al
            final de esa lista.
          </p>
          <p>
            Usted puede reafirmar una pregunta de la interfaz de predicción
            normal en la página de preguntas o mediante el uso de un botón
            especial en los feeds.
          </p>
          {/* <img alt="Reafirmando una predicción" loading="lazy" width="922" height="575" decoding="async" data-nimg="1" className="my-4" style="color:transparent" srcset="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2FScreen%2BShot%2B2023-02-14%2Bat%2B2.14.38%2BPM.png&amp;w=1080&amp;q=75 1x, /_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2FScreen%2BShot%2B2023-02-14%2Bat%2B2.14.38%2BPM.png&amp;w=1920&amp;q=75 2x" src="/_next/image/?url=https%3A%2F%2Fcdn.metaculus.com%2FScreen%2BShot%2B2023-02-14%2Bat%2B2.14.38%2BPM.png&amp;w=1920&amp;q=75"> */}
          <Image
            src="https://cdn.metaculus.com/Screen+Shot+2023-02-14+at+2.14.38+PM.png"
            alt="Reaffirming a prediction"
            className="my-4"
            width={922}
            height={575}
          />
          <p>
            Acerca de los grupos de preguntas, reafirmando impactos en todas las
            sub-cuestionas que tenías una predicción, pero no las otras.
          </p>
        </div>
        <div>
          <h2
            id="scores-and-medals"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            Puntuaciones y medallas
          </h2>
          <h3
            id="whatscores"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué son las puntuaciones?
          </h3>
          <p>
            Las puntuaciones miden el rendimiento de la previsión con muchas
            previsiones. Metaculus usa puntuaciones basales, que te comparan con
            una línea base imparcial, y las puntuaciones de pares, que te
            comparan con todos los demás meteorólogos. También utilizamos
            puntuaciones en relación a torneos. No utilizamos los puntos
            Metaculus ahora obsoletos, aunque todavía se calculan y se pueden
            encontrar en la página de preguntas.
          </p>
          <p>
            Más información en las
            <Link href="/help/scores-faq/">
              preguntas frecuentes de Puntuaciones dedicadas
            </Link>
            .
          </p>
          <h3
            id="whatmedals"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué son las medallas?
          </h3>
          <p>
            Las medallas premian a los usuarios de Metaculus por la excelencia
            en la predicción de precisión, la escritura de comentarios
            perspicaces y la redacción de preguntas atractivas. Le damos
            medallas para poner bien en cualquiera de las 4 tablas de
            clasificación: Precisión basal, Precisión de pares, comentarios y
            escritura de preguntas. Cada año se conceden medallas. También se
            otorgan medallas para el rendimiento del torneo.
          </p>
          <p>
            Más información en las
            <Link href="/help/medals-faq/">preguntas frecuentes sobre</Link>
            <Link href="/help/medals-faq/">las medallas</Link> dedicadas
            <Link href="/help/medals-faq/">.</Link>
          </p>
        </div>
        <div>
          <h2
            id="Metaculus Journal"
            className="mb-4 scroll-mt-nav text-3xl font-bold"
          >
            El Diario de Metaculus
          </h2>
          <h3
            id="whatisjournal"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué es la revista Metaculus?
          </h3>
          <p>
            <Link href="/project/journal/">Metaculus Journal</Link> publica
            ensayos educativos largos y educativos sobre temas críticos como la
            ciencia y la tecnología emergentes, la salud global, la
            bioseguridad, la economía y la econométrica, la ciencia ambiental y
            la geopolítica, todo fortificado con predicciones cuantificadas.
          </p>
          <p>
            Si desea escribir a Metaculus Journal, por favor envíe un correo
            electrónico a
            <a href="mailto:christian@metaculus.com">christian.metaculus.com</a>
            con un currículum o currículum, una muestra de escritura y dos
            lanzamientos de la historia.
          </p>
          <h3
            id="fortifiedessay"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué es un ensayo fortificado?
          </h3>
          <p>
            En noviembre de 2021, Metaculus presentó un nuevo proyecto de
            Ensayos Fortificados. Un ensayo fortificado es una prueba que se
            fortalece mediante la inclusión de previsiones cuantificadas que se
            justifican en el ensayo. El propósito de los ensayos fortificados es
            aprovechar y demostrar el conocimiento y el trabajo intelectual que
            iban a responder a las preguntas de las previsiones, al tiempo que
            colocaba las predicciones en un contexto más amplio.
          </p>
          <p>
            Metaculus planea dirigir el Concurso de Ensayo Fortificado
            regularmente como parte de algunos torneos. Este contexto adicional
            derivado de las pruebas es necesario porque una previsión
            cuantificada aisladamente puede no proporcionar la información
            necesaria para impulsar la toma de decisiones por parte de las
            partes interesadas. En ensayos fortificados, los escritores pueden
            explicar el razonamiento detrás de sus predicciones, discutir los
            factores que impulsan los resultados predichos, explorar las
            implicaciones de esos resultados y ofrecer sus propias
            recomendaciones. Al colocar predicciones en este contexto más
            amplio, estos ensayos son más capaces de ayudar a las partes
            interesadas a entender profundamente las predicciones relevantes y
            cuánto peso poner en ellas. Las mejores pruebas serán compartidas
            con una comunidad de altruismo eficaz y global de miles de
            individuos y docenas de organizaciones.
          </p>
        </div>
        <div>
          <h2 id="miscellany" className="mb-4 scroll-mt-nav text-3xl font-bold">
            Varios
          </h2>
          <h3
            id="what-are-pros"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué son los meteorólogos Metaculus Pro?
          </h3>
          <p>
            Para ciertos proyectos, Metaculus emplea
            <Link href="/pro-forecasters/">Procandeos Progres</Link> que han
            demostrado una excelente capacidad predictiva y que tienen un
            historial de describir claramente sus justificaciones. Los
            profesionales prevén conjuntos de preguntas privadas y públicas para
            producir predicciones bien calibradas y justificaciones descriptivas
            para nuestros socios. Reclutamos principalmente a miembros de la
            comunidad Metaculus con las mejores historias para nuestro equipo
            Pro, pero también se puede considerar a los meteorólogos que han
            demostrado una excelente capacidad predictiva en otros lugares.
          </p>
          <p>
            Si usted está interesado en contratar Metaculus Procasters para un
            proyecto, por favor contáctenos en
            <a href="mailto:support@metaculus.com">e-soco.com</a>.
            <a href="mailto:support@metaculus.com">com</a> con el tema 2306:73
            error `&quot;` can be escaped with `&quot;`, `&ldquo;`, `&#34;`,
            `&rdquo;` react/no-unescaped-entitiesInvestigación de proyectos
            2306:73 error `&quot;` can be escaped with `&quot;`, `&ldquo;`,
            `&#34;`, `&rdquo;` react/no-unescaped-entities.
          </p>
          <p>
            Metaculus selecciona a los individuos de acuerdo con los siguientes
            criterios:
          </p>
          <ol className="ml-5 list-inside list-decimal">
            <li>
              Decenas en el 2% superior de todos los meteorólogos de
              Metaculusos.
            </li>
            <li>Predijo un mínimo de 75 asuntos que se resolvieron.</li>
            <li>Espere experiencia durante un año o más.</li>
            <li>Ha previsto en varias esferas temáticas.</li>
            <li>
              Tenga un historial de proporcionar comentarios explicando sus
              pronósticos.
            </li>
          </ol>
          <h3 id="api" className="mb-4 scroll-mt-nav text-2xl font-semibold">
            Tiene Metaculuso una API?
          </h3>
          <p>La documentación de la API aún se está trabajando.</p>
          <h3
            id="change-name"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cómo puedo cambiar mi nombre de usuario?
          </h3>
          <p>
            Puede cambiar su nombre de forma gratuita en los primeros tres días
            de registro. Después de eso, puedes cambiarlo una vez cada 180 días.
          </p>
          <h3
            id="cant-comment"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Estoy registrado. Por qué no puedo comentar una pregunta?
          </h3>
          <p>
            En un esfuerzo por reducir el spam, los nuevos usuarios deben
            esperar 12 horas después de registrarse antes de que los comentarios
            se desbloqueen.
          </p>
          <h3
            id="suspensions"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Entender las suspensiones de la cuenta.
          </h3>
          <p>
            Metaculus puede, aunque esto, afortunadamente, ocurre muy raramente
            - emite las suspensiones temporales de una cuenta. Esto ocurre
            cuando un usuario ha actuado de una manera que consideramos
            inapropiada, como cuando se violan nuestros
            <Link href="/terms-of-use/">términos de uso</Link>. En este punto,
            el usuario recibirá una advertencia sobre la suspensión y se le
            informará de que continuar con este comportamiento es inaceptable.
            Las suspensiones temporales sirven de advertencia a los usuarios de
            que son algunos incumplimientos de recibir una prohibición
            permanente de su cuenta.
          </p>
          <h3
            id="cant-see"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Por qué puedo ver el pronóstico de la comunidad sobre algunos temas,
            Metaculus predicción de otros, y sin predicciones sobre unos cuantos
            otros?
          </h3>
          <p>
            Cuando una pregunta se abre por primera vez, nadie puede ver la
            predicción de la comunidad por un tiempo, para evitar dar un peso
            excesivo a las primeras predicciones, que pueden ser parciales de la
            isla o posterior. Una vez que la predicción de la comunidad es
            visible, la predicción de Metaculus se esconde hasta que el tema se
            cierra.
          </p>
        </div>
        <div>
          <h3
            id="related-news"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué es NewsMatch?
          </h3>
          <p>
            NewsMatch muestra una selección de artículos relevantes para la
            actual pregunta de Metaculus. Estos sirven como un recurso adicional
            para los meteorólogos mientras discuten y predicen el tema. Cada
            artículo aparece en la lista con su fuente y fecha de publicación.
            Haciendo clic en el título de un artículo navega por el propio
            artículo. La votación al alza le permite indicar si el artículo fue
            útil o no. Su entrada mejora la precisión y utilidad del modelo que
            corresponde a los artículos para las preguntas de Metaculus.
          </p>
          <p>
            El modelo de coincidencia de artículos es apoyado por
            <a href="https://www.improvethenews.org/">Improve the News</a>, un
            agregador de noticias desarrollado por un grupo de investigadores
            del MIT. Diseñado para dar a los lectores más control sobre el
            consumo de noticias, Improve the News ayuda a los lectores a
            mantenerse informados mientras encuentran una variedad más amplia de
            puntos de vista.
          </p>
          <p>
            Los artículos de la base de datos ITN se combinan con preguntas
            relevantes de Metaculus por un modelo de aprendizaje automático
            basado en transformadores capacitado para cartografiar pasajes
            semánticamente similares a regiones en &quot;espacio
            retrasado&quot;. Las adiciones se generan utilizando
            <a href="https://arxiv.org/abs/2004.09297">MPNet</a>.
          </p>
        </div>
        <div>
          <h3
            id="community-insights"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Qué son las perspectivas de la Comunidad?
          </h3>
          <p>
            Community Insights resume los comentarios del usuario de Metaculus
            sobre una pregunta particular usando GPT-4. Condensan las
            predicciones recientes, comentarios de fecha-tacados, y la
            predicción actual de la comunidad en resúmenes concisos de
            argumentos relevantes para diferentes predicciones sobre un tema
            dado. Los meteorólogos pueden usarlos para tomar decisiones más
            informadas y mantenerse al día con las últimas ideas de la
            comunidad.
          </p>
          <p>
            Community Insights está actualmente disponible en preguntas binarias
            y en curso con importantes temas de comentarios y se actualizará
            periódicamente a medida que surjan nuevos debates en los
            comentarios. Si tienes retroalimentación sobre estos resúmenes - o
            quieres verlos aparecer en una gama más amplia de preguntas -
            <a href="mailto:support@metaculus.com">email support.com</a>.
          </p>
          <p>
            Si encuentras un resumen de Community Insights incorrecto, ofensivo
            o engañoso, usa el botón en la parte inferior del resumen para
            &quot;Desplaza este resumen&quot; para que el equipo de Metaculus
            pueda resolverlo.
          </p>
        </div>
        <div>
          <h3
            id="domains"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Puedo tener mi propio Metaculus?
          </h3>
          <p>
            Sí, sí. Sí, sí. Metaculus tiene un sistema de dominio, donde cada
            dominio (como &quot;exemplople.metaculus.com&quot;) tiene un
            subconjunto de preguntas y usuarios asignados a él. Cada pregunta
            tiene un conjunto de dominios donde se publica y cada usuario tiene
            un conjunto de dominios de los que son miembros. Por lo tanto, un
            dominio es una forma flexible de definir un conjunto específico de
            preguntas que son privadas a un conjunto de usuarios, al tiempo que
            permite que algunas preguntas en el dominio se publiquen también
            para metaculus.com. Los dominios son un producto que Metaculus puede
            proporcionar con múltiples niveles de soporte por tarifa; por favor
            contáctenos para más detalles.
          </p>
        </div>
        <div>
          <h3
            id="spreadword"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Cómo puedo ayudar a difundir el Metaculus?
          </h3>
          <p>
            Metaculus se volverá más divertido e interesante, ya que crecerá
            para incluir más y más predictores, por lo que animamos a los
            participantes a correr la voz a las personas que piensan que les
            gustaría predecir, o simplemente estar interesados en cómo se
            desarrollan las preguntas. Algunos de los mecanismos más útiles son:
          </p>
          <ol className="ml-5 list-decimal">
            <li>
              Publica preguntas específicas como Twitter, Facebook y Reddit,
              usando el botón &quot;compartir&quot; en cada página, que
              establece un tuit/post predeterminado que puedes editar.
            </li>
            <li>
              <a href="https://www.twitter.com/metaculus/">
                Síguenos en Twitter
              </a>
              , luego retuitea los tuits de Metaculus a tus seguidores.
            </li>
            <li>
              <a href="https://www.facebook.com/metaculus/">
                Siga nuestra página de Facebook
              </a>
              y comparta publicaciones que te gusten.
            </li>
            <li>
              <a href="mailto:support@metaculus.com">Contacta con nosotros</a>
              para otras ideas.
            </li>
          </ol>
        </div>
        <div>
          <h3
            id="closeaccount"
            className="mb-4 scroll-mt-nav text-2xl font-semibold"
          >
            Puedo cerrar mi cuenta de Metaculus y borrar mi información?
          </h3>
          <p>
            Por supuesto, si desea cerrar su cuenta, por favor envíe un correo
            electrónico a su solicitud a
            <a href="mailto:closemyaccount@metaculus.com">
              closemyaccount.metaculus.com
            </a>
            . Dentro de cinco días hábiles, eliminaremos la información y los
            comentarios de su perfil de nuestra base de datos activa.
          </p>
        </div>
      </div>
    </PageWrapper>
  );
}
