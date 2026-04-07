import Image from "next/image";

import PageWrapper from "../../components/pagewrapper";

export const metadata = {
  title: "Markdown Syntax | Metaculus",
  description:
    "Aprenda a usar Markdown e LaTeX no Metaculus. Descubra a sintaxe para links, cabeçalhos, listas, tabelas, código, equações, menções e incorporações para melhorar seus comentários e perguntas.",
};

export default function MedalsFAQ() {
  return (
    <PageWrapper>
      <div className="prose [&amp;_a:hover]:text-blue-800 [&amp;_a:hover]:underline [&amp;_a:hover]:dark:text-blue-200 [&amp;_a]:text-blue-700 [&amp;_a]:dark:text-blue-400 [&amp;_code]:rounded [&amp;_code]:border [&amp;_code]:border-blue-400 [&amp;_code]:bg-white [&amp;_code]:p-0.5 [&amp;_code]:dark:border-blue-700 [&amp;_code]:dark:bg-blue-900 [&amp;_code]:md:bg-blue-200 [&amp;_code]:dark:md:bg-blue-800 [&amp;_h1]:mb-4 [&amp;_hr]:border-gray-300 [&amp;_hr]:dark:border-blue-700 [&amp;_li]:text-sm [&amp;_li]:md:text-base [&amp;_p]:text-sm [&amp;_p]:text-gray-700 [&amp;_p]:dark:text-gray-400 [&amp;_p]:md:text-base [&amp;_pre]:overflow-x-auto [&amp;_pre]:rounded [&amp;_pre]:border [&amp;_pre]:border-blue-400 [&amp;_pre]:bg-white [&amp;_pre]:p-3 [&amp;_pre]:dark:border-blue-700 [&amp;_pre]:dark:bg-blue-900 [&amp;_pre]:md:bg-blue-200 [&amp;_pre]:dark:md:bg-blue-800 container mx-auto my-0 max-w-4xl rounded bg-transparent p-3.5 pt-2 dark:bg-blue-900 dark:bg-transparent md:my-10 md:bg-white md:px-6 md:py-4 dark:md:bg-blue-900">
        <h1>Sintaxe de Markdown</h1>
        <p>
          Ao escrever comentários ou perguntas, você pode usar a sintaxe{" "}
          <a href="https://daringfireball.net/projects/markdown/">Markdown</a>{" "}
          para adicionar links, ênfase e cabeçalhos. Você também pode adicionar
          equações matemáticas via <a href="https://katex.org/">LaTeX</a>{" "}
          (renderizado com KaTeX), que converterá a{" "}
          <a href="https://en.wikibooks.org/wiki/LaTeX/Mathematics">
            sintaxe LaTeX
          </a>{" "}
          em equações formatadas. Seguimos de perto a sintaxe padrão do
          Markdown, então a{" "}
          <a href="https://daringfireball.net/projects/markdown/syntax">
            documentação oficial
          </a>{" "}
          é o melhor lugar para uma explicação completa. Abaixo está uma breve
          visão geral dos recursos mais comuns.
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
              <a href="#quotes">Citações</a>
            </li>
            <li>
              <a href="#lists">Listas</a>
            </li>
            <li>
              <a href="#tables">Tabelas</a>
            </li>
            <li>
              <a href="#horizontal-rules">Linhas horizontais</a>
            </li>
            <li>
              <a href="#mentions">Menções</a>
            </li>
            <li>
              <a href="#embeds">Incorporações</a>
            </li>
            <li>
              <a href="#images">Imagens</a>
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
          Links podem ser criados usando{" "}
          <code>[título do link](http://endereco-do-link.com)</code> ou
          colocando uma URL entre <code>&lt;</code> e <code>&gt;</code>, como{" "}
          <code>&lt;http://www.example.com&gt;</code>. Há vários atalhos para
          facilitar sua vida se você repetir o mesmo link (veja a{" "}
          <a href="https://daringfireball.net/projects/markdown/syntax">
            documentação
          </a>
          ), mas esses cobrirão 90% dos casos de uso.
        </p>
        <p>
          Asteriscos (*) e sublinhados (_) vão <em>_italicizar_</em> o texto, e
          dois asteriscos tornarão o texto <strong>**negrito**</strong>. A barra
          de ferramentas do editor também suporta formatação{" "}
          <span style={{ textDecoration: "underline" }}>sublinhado</span>.
          Crases denotam <code>texto de largura fixa</code>. Se você quiser
          texto pequeno, pode envolvê-lo em uma tag HTML literal{" "}
          <small>&lt;small&gt;tag html&lt;/small&gt;</small>. Caracteres
          especiais (<code>*_{}#+-.!\</code>) podem ser escapados usando uma
          barra invertida, como <code>\*</code>, se de outra forma seriam
          convertidos em um elemento markdown.
        </p>
        <p>
          Também permitimos um subconjunto limitado de tags HTML, que você pode
          misturar com a sintaxe markdown. Estes incluem: <code>&lt;a&gt;</code>
          , <code>&lt;p&gt;</code>, <code>&lt;em&gt;</code>,{" "}
          <code>&lt;strong&gt;</code>, <code>&lt;small&gt;</code>,{" "}
          <code>&lt;ol&gt;</code>, <code>&lt;ul&gt;</code>,{" "}
          <code>&lt;li&gt;</code>, <code>&lt;br&gt;</code>,{" "}
          <code>&lt;code&gt;</code>, <code>&lt;pre&gt;</code>,{" "}
          <code>&lt;blockquote&gt;</code>, <code>&lt;aside&gt;</code>,{" "}
          <code>&lt;div&gt;</code>, <code>&lt;h1&gt;</code>,{" "}
          <code>&lt;h2&gt;</code>, <code>&lt;h3&gt;</code>,{" "}
          <code>&lt;h4&gt;</code>, <code>&lt;h5&gt;</code>,{" "}
          <code>&lt;h6&gt;</code>, <code>&lt;math-inline&gt;</code>,{" "}
          <code>&lt;math-display&gt;</code>, <code>&lt;hr&gt;</code>,{" "}
          <code>&lt;table&gt;</code>, <code>&lt;thead&gt;</code>,{" "}
          <code>&lt;tbody&gt;</code>, <code>&lt;tr&gt;</code>,{" "}
          <code>&lt;th&gt;</code>, <code>&lt;td&gt;</code>,{" "}
          <code>&lt;del&gt;</code>, <code>&lt;sup&gt;</code>,{" "}
          <code>&lt;sub&gt;</code>.
        </p>

        <h2 className="scroll-mt-nav" id="math">
          Matemática
        </h2>
        <p>
          Complementamos o Markdown com processamento de equações{" "}
          <a href="https://katex.org/">LaTeX</a> (renderizado via KaTeX). A
          formatação matemática funciona colocando sua equação entre{" "}
          <code>$</code> e <code>$</code> (para equações em linha) ou{" "}
          <code>$$</code> e <code>$$</code> (para equações em destaque). Você
          também pode inserir equações usando o botão de equação na barra de
          ferramentas do editor. Equações mais complexas podem ser colocadas em
          um ambiente <code>align</code>, assim:
        </p>
        <pre>
          {`\\begin{align}
  \\log_2 \\left ( \\frac{p}{0.5} \\right ) &amp;= \\log_2 \\left ( p \\right ) + 1 \\\\
  \\log_2 \\left ( \\frac{p}{0.5} \\right ) &amp;= \\frac{\\log(p) - \\log(0.5)}{\\log(1) - \\log(0.5)}
\\end{align}`}
        </pre>
        <h2 className="scroll-mt-nav" id="headers">
          Cabeçalhos
        </h2>
        <p>
          Os cabeçalhos são mais fáceis de adicionar usando marcas de hash, por
          exemplo:
        </p>
        <pre>
          {`# Cabeçalho primário
## Cabeçalho secundário
##### Cabeçalho de quinto nível`}
        </pre>
        <p>
          Você também pode selecionar níveis de cabeçalho no menu suspenso de
          tipo de bloco na barra de ferramentas do editor. Por favor, use
          cabeçalhos em comentários com moderação!
        </p>

        <h2 className="scroll-mt-nav" id="code">
          Código
        </h2>
        <p>
          Código em linha pode ser envolvido em crases simples, como{" "}
          <code>`código`</code>. Blocos maiores de código podem ser envolvidos
          em três crases, opcionalmente seguidos por um nome de linguagem para
          destaque de sintaxe. Por exemplo:
        </p>
        <pre>
          {`\`\`\`python
def hello_world():
    print('hello!')
\`\`\``}
        </pre>
        <p>
          Linguagens suportadas para destaque de sintaxe incluem: Texto simples,
          TypeScript, TSX, JavaScript, JSX, Bash, Python, JSON e SQL.
        </p>

        <h2 className="scroll-mt-nav" id="quotes">
          Citações
        </h2>
        <p>
          Se você quiser citar alguém, preceda cada linha com um{" "}
          <code>&gt;</code>:
        </p>
        <pre>
          {`> Esta é uma citação com dois parágrafos. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
> Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.

> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
> id sem consectetuer libero luctus adipiscing.`}
        </pre>
        <p>que produziria:</p>
        <blockquote className="ml-4 border-l border-gray-500/50 pl-4 opacity-75">
          <p>
            Esta é uma citação com dois parágrafos. Lorem ipsum dolor sit amet,
            consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
            Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae,
            risus.
          </p>
          <p>
            Donec sit amet nisl. Aliquam semper ipsum sit amet velit.
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
          {`1. Primeiro item
2. Segundo item

    Outro parágrafo no segundo item. (Note a indentação de 4 espaços.)

    - Subitem 1. (Note a indentação de 4 espaços.)
    - Subitem 2.

3. Terceiro item.`}
        </pre>
        <p>produz:</p>
        <ol className="list-inside list-decimal space-y-3">
          <li>Primeiro item</li>
          <li>
            Segundo item
            <p className="pl-8">
              Outro parágrafo no segundo item. (Note a indentação de 4 espaços.)
            </p>
            <ul className="list-inside list-disc pl-8">
              <li>Subitem 1. (Note a indentação de 4 espaços.)</li>
              <li>Subitem 2.</li>
            </ul>
          </li>
          <li>Terceiro item.</li>
        </ol>
        <p>
          Listas não ordenadas se comportam de forma semelhante, mas usam{" "}
          <code>*</code> ou <code>+</code> ou <code>-</code> para denotar novos
          itens.
        </p>

        <h2 className="scroll-mt-nav" id="tables">
          Tabelas
        </h2>
        <p>Suportamos tabelas simples no formato:</p>
        <pre>
          {`| Cabeçalho 1 | Cabeçalho 2 |   ← cabeçalhos
|-------------|-------------|   ← separador obrigatório
| Célula 1    | Célula 2    |   ← linha 1
| Célula 3    | Célula 4    |   ← linha 2`}
        </pre>
        <p>
          As colunas são separadas pelo caractere pipe <code>|</code>, e cada
          linha é uma linha da tabela. Por exemplo:
        </p>
        <pre>
          {`|Ano  | Previsões   |  Total |
|-----|-------------|--------|
|2015 |         500 |    500 |
|2016 |       25500 |  26000 |
|2017 |       21000 |  47000 |
|2018 |       63000 | 110000 |
|2019 |       50000 | 160000 |
|2020 |      220000 | 380000 |`}
        </pre>
        <p>Será renderizado como:</p>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 bg-white dark:border-blue-700 dark:bg-blue-900 md:dark:bg-blue-800">
            <thead className="bg-gray-100 dark:bg-blue-950">
              <tr>
                <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  Ano
                </th>
                <th className="border-b border-gray-300 px-4 py-2 text-left text-sm font-semibold  text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  Previsões
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
                  2016
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  25500
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  26000
                </td>
              </tr>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  2017
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  21000
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  47000
                </td>
              </tr>
              <tr>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  2018
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  63000
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  110000
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
                  220000
                </td>
                <td className="border-b border-gray-300 px-4 py-2 text-sm text-gray-700 dark:border-blue-700 dark:text-gray-400">
                  380000
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Você também pode inserir tabelas usando o botão de tabela na barra de
          ferramentas do editor.
        </p>

        <h2 className="scroll-mt-nav" id="horizontal-rules">
          Linhas horizontais
        </h2>
        <p>
          Você pode criar uma linha horizontal digitando três ou mais hifens em
          uma linha:
        </p>
        <pre>{`---`}</pre>
        <p>
          Isso renderizará uma linha horizontal na página. Você também pode
          inserir uma usando o botão na barra de ferramentas.
        </p>

        <h2 className="scroll-mt-nav" id="mentions">
          Menções
        </h2>
        <p>
          Em comentários, você pode mencionar outros usuários digitando{" "}
          <code>@</code> seguido do nome de usuário. Enquanto você digita, um
          menu de autocompletar aparecerá com usuários correspondentes. As
          seguintes menções de grupo também estão disponíveis:
        </p>
        <ul className="ml-5 list-disc">
          <li>
            <code>@moderators</code> — notificar a equipe de moderação
          </li>
          <li>
            <code>@admins</code> — notificar a equipe de administração
          </li>
          <li>
            <code>@predictors</code> — notificar os preditores (disponível para
            curadores e administradores)
          </li>
        </ul>

        <h2 className="scroll-mt-nav" id="embeds">
          Incorporações
        </h2>
        <h3>Perguntas incorporadas</h3>
        <p>
          Você pode incorporar perguntas do Metaculus diretamente em seu
          conteúdo usando o botão &quot;+ Question&quot; na barra de ferramentas
          do editor. Isso permite pesquisar e selecionar uma pergunta, que será
          exibida como uma incorporação interativa.
        </p>
        <h3>Incorporações do Twitter / X</h3>
        <p>
          Links para tweets são automaticamente renderizados como tweets
          incorporados. Basta colar uma URL de tweet (de twitter.com ou x.com) e
          ela será exibida como uma incorporação quando visualizada.
        </p>
        <h3>Incorporações iframe</h3>
        <p>
          Também permitimos incorporações <code>&lt;iframe&gt;</code> de uma
          lista limitada de sites confiáveis, incluindo atualmente:
        </p>
        <ul className="ml-5 list-disc">
          <li>afdc.energy.gov</li>
          <li>data.worldbank.org</li>
          <li>fred.stlouisfed.org</li>
          <li>ourworldindata.org</li>
          <li>www.eia.gov</li>
          <li>metaculus.com</li>
        </ul>
        <p>
          Por exemplo, você pode incorporar uma pergunta do Metaculus via
          iframe:
        </p>
        <pre>
          {`<iframe src="https://www.metaculus.com/questions/embed/8/" height="320" width="550"></iframe>`}
        </pre>
        <p>será renderizado como:</p>
        <div className="w-full overflow-x-auto">
          <iframe
            title="Incorporação da pergunta #8 do Metaculus"
            src="https://www.metaculus.com/questions/embed/8/"
            height="320"
            width="550"
          ></iframe>
        </div>

        <h2 className="scroll-mt-nav" id="images">
          Imagens
        </h2>
        <p>
          Você pode fazer upload de imagens diretamente usando o botão de imagem
          na barra de ferramentas do editor. Imagens de até 3 MB são suportadas.
        </p>
        <p>
          Alternativamente, você pode usar uma tag HTML <code>&lt;img&gt;</code>
          :
        </p>
        <pre>
          {`<img src="https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg" alt="markdown logo">`}
        </pre>
        <p>será renderizado como:</p>
        <Image
          src="https://upload.wikimedia.org/wikipedia/commons/4/48/Markdown-mark.svg"
          alt="markdown logo"
          width={208}
          height={208}
          unoptimized
        />

        <h2 className="scroll-mt-nav" id="limitations">
          Diferenças e limitações
        </h2>
        <p>
          A especificação oficial do Markdown permite aos usuários inserir HTML
          bruto, mas limitamos os usuários aos elementos descritos acima. Por
          razões de segurança, algo como{" "}
          <code>&lt;script&gt;doSomethingEvil()&lt;/script&gt;</code> certamente
          não funcionará. Também empregamos algumas extensões de markdown que
          lidam com blocos de código cercados (descritos acima) e tornam{" "}
          <a href="https://python-markdown.github.io/extensions/sane_lists/">
            listas
          </a>{" "}
          e texto em negrito um pouco mais fáceis de gerenciar.
        </p>
        <p>
          O editor oferece tanto o modo rich-text quanto o modo fonte. No modo
          fonte, você pode escrever Markdown diretamente. Um link para esta
          página de ajuda está disponível no topo do editor quando no modo
          fonte.
        </p>
      </div>
    </PageWrapper>
  );
}
