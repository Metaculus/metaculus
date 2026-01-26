import { processMarkdown } from "../helpers";

jest.mock("../embedded_question", () => ({
  EMBEDDED_QUESTION_COMPONENT_NAME: "EmbeddedQuestion",
}));

jest.mock("../embedded_twitter", () => ({
  EMBEDDED_TWITTER_COMPONENT_NAME: "Tweet",
}));

describe("processMarkdown", () => {
  describe("blockquote formatting", () => {
    it("should format blockquote newlines with encoded spaces", () => {
      // Given
      const input = "> This is a blockquote\n>\n> With multiple paragraphs";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("> &#x20;\n");
    });

    it("should handle consecutive empty blockquote lines", () => {
      // Given
      const input = "> Line 1\n>\n>\n> Line 4";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("> &#x20;\n> &#x20;\n");
    });
  });

  describe("mathJax transformation", () => {
    it("should transform inline MathJax expressions to markdown math syntax", () => {
      // Given
      const input = "Inline math: \\(a^2 + b^2 = c^2\\)";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("$a^2 + b^2 = c^2$");
    });

    it("should transform block MathJax expressions to markdown math syntax", () => {
      // Given
      const input = "Block math: \\[E = mc^2\\]";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("$$\nE = mc^2\n$$");
    });

    it("should transform complex MathJax expressions with environments", () => {
      // Given
      const input = "\\begin{aligned}a &= b + c\\\\d &= e + f\\end{aligned}";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toBe(
        "\n$$\n\\begin{aligned}a &= b + c\\\\d &= e + f\\end{aligned}\n$$\n"
      );
    });

    it("should preserve existing markdown links during MathJax transformation", () => {
      // Given
      const input = `See [equation](https://example.com). Inline math: \\(a^2 + b^2 = c^2\\). Block math: \\[E = mc^2\\]`;

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("[equation](https://example.com)");
      expect(result).toContain("$a^2 + b^2 = c^2$");
      expect(result).toContain("\n$$\nE = mc^2\n$$\n");
    });

    it("should handle nested math expressions correctly", () => {
      // Given
      const input = "\\[\\begin{matrix} a & b \\\\ c & d \\end{matrix}\\]";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain(
        "$$\n\\begin{matrix} a & b \\\\ c & d \\end{matrix}\n$$"
      );
    });
  });

  describe("dollar sign escaping", () => {
    it("should escape dollar signs in plain text", () => {
      // Given
      const input = "The cost is $10";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("The cost is \\$10");
    });

    it("should not escape dollar signs in math expressions", () => {
      // Given
      const input = "The formula is $x + y$";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("The formula is $x + y$");
    });

    it("should handle mixed dollar signs correctly", () => {
      // Given
      const input = "The cost is $10 and formula is $x + y$";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("The cost is \\$10");
      expect(result).toContain("formula is $x + y$");
    });

    it("should preserve block math expressions when escaping dollar signs", () => {
      // Given
      const input = "Cost: $5 and equation: $$\nx^2 + y^2 = z^2\n$$";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("Cost: \\$5");
      expect(result).toContain("$$\nx^2 + y^2 = z^2\n$$");
    });

    it("should handle multiple dollar signs in one line", () => {
      // Given
      const input = "Prices: $5, $10, and $15";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("Prices: \\$5, \\$10, and \\$15");
    });
  });

  describe("plain text symbols escaping", () => {
    it("should escape standalone less-than symbols", () => {
      // Given
      const input = "a < b";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toBe("a \\< b");
    });

    it("should not escape less-than symbols in HTML tags", () => {
      // Given
      const input = "<span>test</span>";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toBe("<span>test</span>");
    });

    it("should escape less-than symbols inside HTML tags content", () => {
      // Given
      const input = "<div>a < b</div>";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("<div>a \\< b</div>");
    });

    it("should escape unpaired curly braces", () => {
      // Given
      const input = "Curly brace { without closing";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("Curly brace \\{");
    });

    it("should not escape properly paired curly braces", () => {
      // Given
      const input = "Properly {paired} braces";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("{paired}");
    });

    it("should handle multiple unpaired and paired braces correctly", () => {
      // Given
      const input = "{ unpaired and {paired} and another { unpaired";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("\\{ unpaired");
      expect(result).toContain("{paired}");
      expect(result).toContain("another \\{");
    });

    it("should not escape symbols in math expressions", () => {
      // Given
      const input = "$$\nx < y\n$$ and $a < b$";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("$$\nx < y\n$$");
      expect(result).toContain("$a < b$");
    });

    it("should correctly render ampersand", () => {
      // Given
      const input = "This is a & b\n New line with another ampersane S&P";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("This is a & b");
      expect(result).toContain("New line with another ampersane S&P");
    });

    it("should correctly render ampersand when html tags are in the markdown", () => {
      // Given
      const input =
        "This is a & b\n New line with another ampersane S&P\n another line with <u>html</u> tags";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("This is a & b");
      expect(result).toContain("New line with another ampersane S&P");
    });
  });

  describe("Twitter links transformation", () => {
    it("should transform Twitter links when withTwitterPreview is true", () => {
      // Given
      const input =
        "Check out this tweet https://twitter.com/user/status/123456789";

      // When
      const result = processMarkdown(input, { withTwitterPreview: true });

      // Then
      expect(result).toContain('<Tweet id="123456789" />');
    });

    it("should transform x.com links when withTwitterPreview is true", () => {
      // Given
      const input = "Check out this tweet https://x.com/user/status/123456789";

      // When
      const result = processMarkdown(input, { withTwitterPreview: true });

      // Then
      expect(result).toContain('<Tweet id="123456789" />');
    });

    it("should transform vxtwitter.com links when withTwitterPreview is true", () => {
      // Given
      const input =
        "Check out this tweet https://vxtwitter.com/user/status/123456789";

      // When
      const result = processMarkdown(input, { withTwitterPreview: true });

      // Then
      expect(result).toContain('<Tweet id="123456789" />');
    });

    it("should deduplicate Twitter links with the same ID", () => {
      // Given
      const input =
        "Tweet 1: https://twitter.com/user/status/123456789 and " +
        "Tweet 2: https://twitter.com/otheruser/status/123456789";

      // When
      const result = processMarkdown(input, { withTwitterPreview: true });

      // Then
      const matches = result.match(/<Tweet id="123456789" \/>/g);
      expect(matches?.length).toBe(1);
    });

    it("should handle multiple unique Twitter links", () => {
      // Given
      const input =
        "Tweet 1: https://twitter.com/user/status/123456789 and " +
        "Tweet 2: https://twitter.com/user/status/987654321";

      // When
      const result = processMarkdown(input, { withTwitterPreview: true });

      // Then
      expect(result).toContain('<Tweet id="123456789" />');
      expect(result).toContain('<Tweet id="987654321" />');
    });

    it("should not transform Twitter links when withTwitterPreview is false", () => {
      // Given
      const input =
        "Check out this tweet https://twitter.com/user/status/123456789";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).not.toContain('<Tweet id="123456789" />');
    });
  });

  describe("sanitization", () => {
    it("should preserve EmbeddedQuestion components", () => {
      // Given
      const input = "Text with <EmbeddedQuestion id={123} /> component";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("<EmbeddedQuestion id={123} />");
    });

    it("should preserve Tweet components", () => {
      // Given
      const input = 'Text with <Tweet id="123456789" /> component';

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain('<Tweet id="123456789" />');
    });

    it("should preserve self-closing HTML tags", () => {
      // Given
      const input = `<img src="image.jpg" alt="Image" /> <br /> <hr />`;

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toMatch(/<img src="image.jpg" alt="Image".*\/>/);
      expect(result).toMatch(/<br.*\/>/);
      expect(result).toMatch(/<hr.*\/>/);
    });

    it("should properly handle self-closing iframes", () => {
      // Given
      const input =
        '<iframe src="https://example.com" width="560" height="315" />';

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("<iframe");
      expect(result).toContain('src="https://example.com"');
      expect(result).toContain('width="560"');
      expect(result).toContain('height="315"');
      expect(result).toContain("</iframe>");
    });

    it("should preserve allowed custom attributes on HTML elements", () => {
      // Given
      const input = '<div toggle-details="true">Content</div>';

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain('toggle-details="true"');
    });

    it("should preserve allowed iframe attributes", () => {
      // Given
      const input =
        '<iframe src="https://example.com" allowfullscreen="true" frameborder="0" style="width:100%"></iframe>';

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain('src="https://example.com"');
      expect(result).toContain('allowfullscreen="true"');
      expect(result).toContain('style="width:100%"');
    });

    it("should handle ng-show attribute correctly", () => {
      // Given
      const input = '<div ng-show="isVisible">Conditional content</div>';

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain('ng-show="isVisible"');
    });

    it("should remove disallowed tags and attributes", () => {
      // Given
      const input =
        '<script>alert("xss")</script><div onclick="evil()">Content</div>';

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).not.toContain("<script>");
      expect(result).not.toContain('onclick="evil()"');
      expect(result).toContain("<div>Content</div>");
    });
  });

  describe("revert option", () => {
    it("should skip MathJax transformation when revert is true", () => {
      // Given
      const input =
        "Inline math: \\(a^2 + b^2 = c^2\\). Block math: \\[E = mc^2\\]";

      // When
      const result = processMarkdown(input, { revert: true });

      // Then
      expect(result).toContain("\\(a^2 + b^2 = c^2\\)");
      expect(result).toContain("\\[E = mc^2\\]");
      expect(result).not.toContain("$a^2 + b^2 = c^2$");
      expect(result).not.toContain("$$\nE = mc^2\n$$");
    });

    it("should skip dollar sign escaping when revert is true", () => {
      // Given
      const input = "The cost is $10";

      // When
      const result = processMarkdown(input, { revert: true });

      // Then
      expect(result).toContain("$10");
      expect(result).not.toContain("\\$10");
    });

    it("should still apply other transformations when revert is true", () => {
      // Given
      const input = "> Blockquote\n>\n> With newline and a < b";

      // When
      const result = processMarkdown(input, { revert: true });

      // Then
      expect(result).toContain("> &#x20;\n"); // Blockquote formatting
      expect(result).toContain("a \\< b"); // Symbol escaping
    });
  });

  describe("complex cases", () => {
    it("should handle a combination of multiple transformations", () => {
      // Given
      const input =
        "Math \\(a^2\\) with <span>HTML</span> and $price is $10 with comparison a < b";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("Math $a^2$");
      expect(result).toContain("<span>HTML</span>");
      expect(result).toContain("price is \\$10");
      expect(result).toContain("comparison a \\< b");
    });

    it("should correctly process markdown with both Twitter links and JSX components", () => {
      // Given
      const input =
        "Here's a question <EmbeddedQuestion id={456} /> and a tweet https://twitter.com/user/status/123456789";

      // When
      const result = processMarkdown(input, { withTwitterPreview: true });

      // Then
      expect(result).toContain("<EmbeddedQuestion id={456} />");
      expect(result).toContain('<Tweet id="123456789" />');
    });

    it("should handle complex math expressions with special characters", () => {
      // Given
      const input =
        "$$\nf(x) = \\sum_{i=0}^{n} \\binom{n}{i} x^i (1-x)^{n-i}\n$$";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain(
        "$$\nf(x) = \\sum_{i=0}^{n} \\binom{n}{i} x^i (1-x)^{n-i}\n$$"
      );
    });

    it("should handle multiple blockquotes with different content", () => {
      // Given
      const input =
        "> Blockquote 1\n\nNormal text\n\n> Blockquote 2\n>\n> With multiple lines";

      // When
      const result = processMarkdown(input);

      // Then
      expect(result).toContain("> Blockquote 1");
      expect(result).toContain("Normal text");
      expect(result).toContain("> Blockquote 2");
      expect(result).toContain("> &#x20;\n");
    });
  });
});
