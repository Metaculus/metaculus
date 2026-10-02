import { EDITIONS, getPreviousEdition } from "..";
import { DISEASE_IDS } from "../../config/diseases";
import { GHM_VALUES } from "../../config/questions";

const SLUG_PATTERN = /^\d{4}-\d{2}$/;

describe("editions", () => {
  it("uses unique month slugs, newest first", () => {
    const slugs = EDITIONS.map((edition) => edition.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((slug) => expect(slug).toMatch(SLUG_PATTERN));
    expect([...slugs].sort().reverse()).toEqual(slugs);
  });

  it("takes each edition's numbers within its month", () => {
    EDITIONS.forEach((edition) => {
      expect(Number.isNaN(Date.parse(edition.asOf))).toBe(false);
      expect(edition.asOf.startsWith(edition.slug)).toBe(true);
    });
  });

  it("has 1 to 6 takeaways with known leads and diseases", () => {
    EDITIONS.forEach((edition) => {
      expect(edition.takeaways.length).toBeGreaterThanOrEqual(1);
      expect(edition.takeaways.length).toBeLessThanOrEqual(6);
      edition.takeaways.forEach((takeaway) => {
        expect(GHM_VALUES).toHaveProperty(takeaway.lead);
        takeaway.diseases.forEach((disease) =>
          expect(DISEASE_IDS).toContain(disease)
        );
      });
    });
  });

  it("only freezes known values", () => {
    EDITIONS.forEach((edition) => {
      Object.entries(edition.frozen ?? {}).forEach(([key, frozen]) => {
        expect(GHM_VALUES).toHaveProperty(key);
        expect(typeof frozen?.value).toBe("number");
      });
      Object.keys(edition.sections).forEach((disease) =>
        expect(DISEASE_IDS).toContain(disease)
      );
    });
  });

  it("freezes every takeaway lead in past editions", () => {
    EDITIONS.slice(1).forEach((edition) => {
      edition.takeaways.forEach(({ lead }) =>
        expect(edition.frozen).toHaveProperty(lead)
      );
    });
  });

  it("links each edition to the one before it", () => {
    const [latest, previous] = EDITIONS;
    if (latest && previous) {
      expect(getPreviousEdition(latest)?.slug).toBe(previous.slug);
    }
    const oldest = EDITIONS.at(-1);
    if (oldest) {
      expect(getPreviousEdition(oldest)).toBeNull();
    }
  });
});
