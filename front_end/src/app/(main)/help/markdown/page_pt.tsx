import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Markdown Syntax | Metaculus",
  description:
    "Learn how to use Markdown and MathJax on Metaculus. Discover syntax for links, headers, lists, tables, code, and equations to enhance your comments and questions.",
};

export default function MedalsFAQ() {
  return (
    <PageWrapper>
      <div className="prose [&amp;_a:hover]:text-blue-800 [&amp;_a:hover]:underline [&amp;_a:hover]:dark:text-blue-200 [&amp;_a]:text-blue-700 [&amp;_a]:dark:text-blue-400 [&amp;_code]:rounded [&amp;_code]:border [&amp;_code]:border-blue-400 [&amp;_code]:bg-white [&amp;_code]:p-0.5 [&amp;_code]:dark:border-blue-700 [&amp;_code]:dark:bg-blue-900 [&amp;_code]:md:bg-blue-200 [&amp;_code]:dark:md:bg-blue-800 [&amp;_h1]:mb-4 [&amp;_hr]:border-gray-300 [&amp;_hr]:dark:border-blue-700 [&amp;_li]:text-sm [&amp;_li]:md:text-base [&amp;_p]:text-sm [&amp;_p]:text-gray-700 [&amp;_p]:dark:text-gray-400 [&amp;_p]:md:text-base [&amp;_pre]:overflow-x-auto [&amp;_pre]:rounded [&amp;_pre]:border [&amp;_pre]:border-blue-400 [&amp;_pre]:bg-white [&amp;_pre]:p-3 [&amp;_pre]:dark:border-blue-700 [&amp;_pre]:dark:bg-blue-900 [&amp;_pre]:md:bg-blue-200 [&amp;_pre]:dark:md:bg-blue-800 container mx-auto my-0 max-w-4xl rounded bg-transparent p-3.5 pt-2 dark:bg-blue-900 dark:bg-transparent md:my-10 md:bg-white md:px-6 md:py-4 dark:md:bg-blue-900">
        <h1>Sintaxe de Markdown</h1>
        <p>
          Ao adicionar comentários ou sugerir perguntas, você pode aproveitar{" "}
          <a href="http://daringfireball.net/projects/markdown/">
            Markdown Tragress do
          </a>
          sintaxe para adicionar links, ênfase e cabeçalhos. Além disso, você
          pode adicionar equações matemáticas via{" "}
          <a href="https://www.mathjax.org">MathJax (tradução)</a>, que vai
          converter{" "}
          <a href="https://en.wikibooks.org/wiki/LaTeX/Mathematics">
            Sintiga de LaTeX
          </a>
          em equações de tipo muito bem. Nós seguimos de perto o{" "}
          <a href="http://daringfireball.net/projects/markdown/syntax">
            Sintaxe oficial do Markdown
          </a>
          , então esse é o melhor lugar para procurar uma explicação completa de
          como o sistema funciona. Nós fornecemos uma breve visão geral dos usos
          mais comuns aqui.
        </p>
        <div className="table-of-contents">
          <ul className="space-y-1">
            <li>
              <a href="#inline-elements">Elementos em linha</a>
            </li>
            <li>
              <a href="#math">Matemática</a>
            </li>
            <li>
              <a href="#headers">Cabeçalhos</a>
            </li>
            <li>
              <a href="#code">Código</a>
            </li>
            <li>
              <a href="#quotes">Citação de</a>
            </li>
            <li>
              <a href="#lists">Listas</a>
            </li>
            <li>
              <a href="#tables">Tabelas de mesas</a>
            </li>
            <li>
              <a href="#embeds">Embeds (Embeds)</a>
            </li>
            <li>
              <a href="#images">As imagens</a>
            </li>
            <li>
              <a href="#limitations">Diferenças e limitações</a>
            </li>
          </ul>
        </div>

        <h2 className="scroll-mt-nav" id="inline-elements">
          Elementos em linha
        </h2>
        <p>
          Os links podem ser produzidos usando um{" "}
          <code>[link title](http://and-link-address.com)</code>
          ou ao redor de um link com <code>&lt;</code>E a <code>&gt;</code>,
          como <code>&lt;http://www.example.com&gt;</code>- A . (í a , , , , ,
          ínte , . Há uma série de atalhos para tornar sua vida mais fácil se
          você continuar repetindo o mesmo link (veja o{" "}
          <a href="http://daringfireball.net/projects/markdown/syntax">doscs</a>
          ), mas estes irão cobrir 90% dos casos de uso.
        </p>
        <p>
          Os asteriscos (?) e sublinhados (_) serão ambos <em>_italicizar_</em>
          texto, e dois asteriscos farão o texto <strong>?bold?</strong>- A . (í
          a , , , Back-ticks denotar <code>fixed-width text</code>- A . (í a , ,
          , , , í , . Se você quiser um texto pequeno, você pode envolvê-lo em
          um texto literal <small>?small?html tag?/small?</small>( , . e.
          Personagens especiais (<code>*_#+-.!\</code>) pode ser escapado usando
          uma barra insu fundo, como <code>\*</code>, se eles seriam convertidos
          em um elemento markdown.
        </p>
        <p>
          Também permitimos um subconjunto limitado de tags HTML, que você pode
          misturar com sintaxe de marcação, se quiser. Estes incluem:{" "}
          <code>&lt;a&gt;</code>
          ,, , - <code>&lt;p&gt;</code>
          ,, , - <code>&lt;em&gt;</code>
          ,, , - <code>&lt;strong&gt;</code>
          ,, , - <code>&lt;small&gt;</code>
          ,, , - <code>&lt;ol&gt;</code>
          ,, , - <code>&lt;ul&gt;</code>
          ,, , - <code>&lt;li&gt;</code>
          ,, , - <code>&lt;br&gt;</code>
          ,, , - <code>&lt;code&gt;</code>
          ,, , - <code>&lt;pre&gt;</code>
          ,, , - <code>&lt;blockquote&gt;</code>
          ,, , - <code>&lt;aside&gt;</code>
          ,, , - <code>&lt;div&gt;</code>
          ,, , - <code>&lt;h1&gt;</code>
          ,, , - <code>&lt;h2&gt;</code>
          ,, , - <code>&lt;h3&gt;</code>
          ,, , - <code>&lt;h4&gt;</code>
          ,, , - <code>&lt;h5&gt;</code>
          ,, , - <code>&lt;h6&gt;</code>
          ,, , - <code>&lt;math-inline&gt;</code>
          ,, , - <code>&lt;math-display&gt;</code>
          ,, , - <code>&lt;hr&gt;</code>
          ,, , - <code>&lt;table&gt;</code>
          ,, , - <code>&lt;thead&gt;</code>
          ,, , - <code>&lt;tbody&gt;</code>
          ,, , - <code>&lt;tr&gt;</code>
          ,, , - <code>&lt;th&gt;</code>
          ,, , - <code>&lt;td&gt;</code>
          ,, , - <code>&lt;del&gt;</code>
          ,, , - <code>&lt;sup&gt;</code>
          ,, , - <code>&lt;sub&gt;</code>( , . e
        </p>

        <h2 className="scroll-mt-nav" id="math">
          Matemática
        </h2>
        <p>
          Nós complementamos Markdown com <a href="https://katex.org/">Látex</a>
          processamento de equações. A formatação matemática funciona colocando
          sua equação entre <code>$</code>E a <code>$</code>
          (para equações em linha) ou <code>$$</code>E a <code>$$</code>
          (para as equações exibidas). Equações mais complicadas podem ser
          colocadas em um <code>align</code>O ambiente, como
        </p>
        <pre>
          &quot;begin align ?log_2 ? esquerda ( ?frac?p 0.5 ? ? ??? &amp;amp;
          ?log_2 ? esquerda ( p ? ? ? ? ? ? ?log_2 ?left ( ?frac?p?0.5? ? ?right
          ) &amp;amp;? ?frac?log(p) - ?log(0.5)?log(0.5)?log(0.5) - ?log(0.5)?
          En align
        </pre>
        <p>a produção</p>
        <span role="math" tabIndex={-1} className="!whitespace-normal">
          <span className="katex-display">
            <span className="katex">
              <span className="katex-html" aria-hidden="true">
                <span className="base">
                  <span className="strut"></span>
                  <span className="mtable">
                    <span className="col-align-r">
                      <span className="vlist-t vlist-t2">
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="mord">
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
                                              <span className="mord mtight">
                                                2
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
                                <span className="minner">
                                  <span className="mopen delimcenter">
                                    <span className="delimsizing size2">
                                      (0
                                    </span>
                                  </span>
                                  <span className="mord">
                                    <span className="mopen nulldelimiter"></span>
                                    <span className="mfrac">
                                      <span className="vlist-t vlist-t2">
                                        <span className="vlist-r">
                                          <span className="vlist">
                                            <span className="">
                                              <span className="pstrut"></span>
                                              <span className="mord">
                                                <span className="mord">,5</span>
                                              </span>
                                            </span>
                                            <span className="">
                                              <span className="pstrut"></span>
                                              <span className="frac-line"></span>
                                            </span>
                                            <span className="">
                                              <span className="pstrut"></span>
                                              <span className="mord">
                                                <span className="mord mathnormal">
                                                  p
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
                                  <span className="mclose delimcenter">
                                    <span className="delimsizing size2">)</span>
                                  </span>
                                </span>
                              </span>
                            </span>
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="mord">
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
                                              <span className="mord mtight">
                                                2
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
                                <span className="minner">
                                  <span className="mopen delimcenter">
                                    <span className="delimsizing size2">
                                      (0
                                    </span>
                                  </span>
                                  <span className="mord">
                                    <span className="mopen nulldelimiter"></span>
                                    <span className="mfrac">
                                      <span className="vlist-t vlist-t2">
                                        <span className="vlist-r">
                                          <span className="vlist">
                                            <span className="">
                                              <span className="pstrut"></span>
                                              <span className="mord">
                                                <span className="mord">,5</span>
                                              </span>
                                            </span>
                                            <span className="">
                                              <span className="pstrut"></span>
                                              <span className="frac-line"></span>
                                            </span>
                                            <span className="">
                                              <span className="pstrut"></span>
                                              <span className="mord">
                                                <span className="mord mathnormal">
                                                  p
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
                                  <span className="mclose delimcenter">
                                    <span className="delimsizing size2">)</span>
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
                    <span className="col-align-l">
                      <span className="vlist-t vlist-t2">
                        <span className="vlist-r">
                          <span className="vlist">
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="mord">
                                <span className="mord"></span>
                                <span className="mspace"></span>
                                <span className="mrel">?</span>
                                <span className="mspace"></span>
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
                                              <span className="mord mtight">
                                                2
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
                                <span className="minner">
                                  <span className="mopen delimcenter">(</span>
                                  <span className="mord mathnormal">p</span>
                                  <span className="mclose delimcenter">)</span>
                                </span>
                                <span className="mspace"></span>
                                <span className="mbin">+</span>
                                <span className="mspace"></span>
                                <span className="mord">1</span>
                              </span>
                            </span>
                            <span className="">
                              <span className="pstrut"></span>
                              <span className="mord">
                                <span className="mord"></span>
                                <span className="mspace"></span>
                                <span className="mrel">?</span>
                                <span className="mspace"></span>
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
                                                lo <span>g</span>
                                              </span>
                                              <span className="mopen">(</span>
                                              <span className="mord">1</span>
                                              <span className="mclose">
                                                (1)
                                              </span>
                                              <span className="mspace"></span>
                                              <span className="mbin">?</span>
                                              <span className="mspace"></span>
                                              <span className="mop">
                                                lo <span>g</span>
                                              </span>
                                              <span className="mopen">(</span>
                                              <span className="mord">0.5</span>
                                              <span className="mclose">)</span>
                                            </span>
                                          </span>
                                          <span className="">
                                            <span className="pstrut"></span>
                                            <span className="frac-line"></span>
                                          </span>
                                          <span className="">
                                            <span className="pstrut"></span>
                                            <span className="mord">
                                              <span className="mop">
                                                lo <span>g</span>
                                              </span>
                                              <span className="mopen">(</span>
                                              <span className="mord mathnormal">
                                                p
                                              </span>
                                              <span className="mclose">)</span>
                                              <span className="mspace"></span>
                                              <span className="mbin">? lo</span>
                                              <span className="mspace"></span>
                                              <span className="mop">
                                                <span>g</span>
                                              </span>
                                              <span className="mopen">(</span>
                                              <span className="mord">0.5</span>
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
                <span className="tag">
                  <span className="vlist-t vlist-t2">
                    <span className="vlist-r">
                      <span className="vlist">
                        <span className="">
                          <span className="pstrut"></span>
                          <span className="eqn-num"></span>
                        </span>
                        <span className="">
                          <span className="pstrut"></span>
                          <span className="eqn-num"></span>
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
          ​ ​ ​
        </span>

        <h2 className="scroll-mt-nav" id="headers">
          Cabeçalhos
        </h2>
        <p>
          Os cabeçalhos são mais fáceis de adicionar usando marcas de hash, por
          exemplo
        </p>
        <pre>
          - Cabeça de cabeçalho primário ? Cabeça de secundário ? Cabeça de
          quinto nível
        </pre>
        <p>Por favor, use cabeçalhos em comentários com moderação!</p>

        <h2 className="scroll-mt-nav" id="code">
          Código
        </h2>
        <p>
          Grandes pedaços de código podem ser embrulhados em três back-ticks.
          Por exemplo:
        </p>
        <pre>
          ) ) def hello_world() ( imprimir(&quot;hello!&quot;)
          <br />) )
        </pre>

        <h2 className="scroll-mt-nav" id="quotes">
          Citação de
        </h2>
        <p>
          Se você quiser citar alguém, preceda cada linha com um{" "}
          <code>&gt;</code>:
        </p>
        <pre>
          - Este é um blockquote com dois parágrafos. Lorem ipsum dolor sit
          amet, Consectetuer adipiscing elit. Aliquam hendrerit mi posuere
          lectus. Vestibulum enim wisi, viverra nec, fringilla in, laoreet
          vitae, risus. Donec sit amet nisl. Aliquam semper ipsum senta-se amet
          velit. Suspendisse id sem consectetuer libero luctus adipiscing.
        </pre>
        <p>que iria produzir:</p>
        <blockquote className="ml-4 border-l border-gray-500/50 pl-4 opacity-75">
          <p>
            Trata-se de uma blockquote com dois parágrafos. Lorem ipsum dolor
            sit amet, consectetuer adipiscing elit. Aliquam hendrerit mi posuere
            lectus. Vestibulum enim wisi, viverra nec, fringilla in, laoreet
            vitae, risus.
          </p>
          <p>
            Donec senta-se amet nisl. Aliquam semper ipsum senta-se amet velit.
            Suspendisse id sem consectetuer libero luctus adipiscing.
          </p>
        </blockquote>

        <h2 className="scroll-mt-nav" id="lists">
          Listas
        </h2>
        <p>
          O Markdown pode lidar com listas ordenadas e não ordenadas. Por
          exemplo,
        </p>
        <pre>
          1. Primeiro item 2. O segundo item Outro parágrafo do segundo ponto.
          (Observe o indentation de 4 espaços.) - Sublista item 1. (Observe o
          indentation de 4 espaços.) - Sublista item 2. 3. Terceiro item.
        </pre>
        <p>produz:</p>
        <ol className="list-inside list-decimal space-y-3">
          <li>Primeiro item</li>
          <li>
            O segundo item
            <p className="pl-8">
              Outro parágrafo do segundo ponto. (Observe o indentation de 4
              espaços.)
            </p>
            <ul className="list-inside list-disc pl-8">
              <li>Sublista item 1. (Observe o indentation de 4 espaços.)</li>
              <li>Sublista item 2.</li>
            </ul>
          </li>
          <li>Terceiro item.</li>
        </ol>
        <p>
          Listas não ordenadas se comportam de forma semelhante, mas usam{" "}
          <code>*</code>
          ou a <code>+</code>
          ou a <code>-</code>
          para denotar novos itens.
        </p>

        <h2 className="scroll-mt-nav" id="tables">
          Tabelas de mesas
        </h2>
        <p>Nós apoiamos tabelas simples do formulário:</p>
        <pre>
          | Cabeçalho 1 | Cabeçalho 2 | ? cabeçalhos |---------|-------------| ?
          separador de cabeçalho obrigatório | Cell 1 | Cell 2 | ? linha 1 |
          Cell 3 | Cell 4 | ? linha 2
        </pre>
        <p>
          As colunas são separadas pelo personagem do tubo <code>|</code>
          Cada linha é uma linha. Por exemplo, o seguinte:
        </p>
        <pre>
          |Year | Previsões | Total |-------------------------------------|--- |
          2015 | 500 | 500 | Brasil |2016 | 25500 | 26000 | |2017 | 21000 |
          47000 | |2018 | 63000 | 110000 | | 2019 | 50000 | 160000 | |2020 |
          220000 | 380000 |
        </pre>
        <p>Vai renderizar como:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white dark:border-blue-700 dark:bg-blue-900 md:dark:bg-blue-800">
            <thead className="bg-gray-100 dark:bg-blue-950">
              <tr>
                <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  Ano de exercício
                </th>
                <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold  text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  As previsões de
                </th>
                <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400 ">
                  2015
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  500
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  500
                </td>
              </tr>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  2016 em Julho de
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  25500 em (&quot;)
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  26000
                </td>
              </tr>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  2017 em 2017
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  21000
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  47000 pessoas
                </td>
              </tr>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  de 2018
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  63000 (&quot;)
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  110000 (&quot;)
                </td>
              </tr>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  2019
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  50000
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  160000
                </td>
              </tr>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  2020
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  220000 (220000)
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  380000 (890000)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2 className="scroll-mt-nav" id="embeds">
          Embeds (Embeds)
        </h2>
        <p>
          Nós permitimos <code>&lt;iframe&gt;</code>
          incorpora uma lista limitada de sites confiáveis, incluindo
          atualmente:
        </p>
        <ul className="ml-5 list-disc">
          <li>afdc.energy.gov</li>
          <li>data.worldbank.org (em inglês)</li>
          <li>fred.stlouisfed.org (em inglês)</li>
          <li>de nós.org ourworldindata.org</li>
          <li>www.eia.gov (us)</li>
          <li>metaculus.com (&quot;)</li>
        </ul>
        <p>
          Observe que isso significa que você pode incorporar perguntas do
          Metaculus:
        </p>
        <pre>
          ?iframe src?&quot;https://www.metaculus.com/questions/embed/&quot;
          height-&quot;320&quot; width?&quot;550&quot; ?/iframe?
        </pre>
        <p>vai render como:</p>
        <div className="w-full overflow-x-auto">
          <iframe
            src="https://www.metaculus.com/questions/embed/8/"
            height="320"
            width="550"
          ></iframe>
        </div>
        <p>
          Note que, por enquanto, isso só é possível em órgãos de perguntas, não
          em comentários.
        </p>

        <h2 className="scroll-mt-nav" id="images">
          As imagens
        </h2>
        <p>
          Nós também permitimos <code>&lt;img&gt;</code>
          Imagens:
        </p>
        <pre>
          ?img
          src?&quot;https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg&quot;
          alt?&quot;markdown logo&quot;
        </pre>
        <p>vai render como:</p>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg"
          alt="markdown logo"
        />

        <h2 className="scroll-mt-nav" id="limitations">
          Diferenças e limitações
        </h2>
        <p>
          A especificação oficial Markdown permite aos usuários inserir HTML
          bruto, mas limitamos os usuários aos elementos descritos acima. Por
          exemplo, se você tentar inserir uma imagem usando{" "}
          <code>![Alt text](/path/to/img.jpg)</code>a saída vai olhar como
          &quot;img alt&quot;Alt text&quot; src&quot;/path/to/img.jpg&quot;/) ),
          e algo como{" "}
          <code>&lt;script&gt;doSomethingEvil()&lt;/script&gt;</code>
          Certamente não vai funcionar. Também empregamos algumas extensões de
          markdown que manipulam blocos de código cercados (descritos acima) e
          fazem{" "}
          <a href="https://python-markdown.github.io/extensions/sane_lists/">
            listas
          </a>
          e texto em negrito um pouco mais fácil de gerenciar.
        </p>
      </div>
    </PageWrapper>
  );
}
