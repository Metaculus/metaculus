import { replaceEmbedsWithLinks } from "../markdown";

const ORIGIN = "https://www.metaculus.com";

describe("replaceEmbedsWithLinks", () => {
  it("turns embedded questions into absolute question URLs", () => {
    expect(
      replaceEmbedsWithLinks(
        'Before\n\n<EmbeddedQuestion id={123} />\n\n<EmbeddedQuestion id="456" />',
        ORIGIN
      )
    ).toBe(
      "Before\n\nhttps://www.metaculus.com/questions/123/\n\nhttps://www.metaculus.com/questions/456/"
    );
  });

  it("turns tweet embeds into tweet URLs", () => {
    expect(replaceEmbedsWithLinks('<Tweet id="789" />', ORIGIN)).toBe(
      "https://x.com/i/status/789"
    );
  });

  it("leaves malformed embeds untouched", () => {
    const markdown = '<EmbeddedQuestion id={1" onload="alert(1)} />';

    expect(replaceEmbedsWithLinks(markdown, ORIGIN)).toBe(markdown);
  });
});
