export const firstVisible = (sel: string) => {
  return (
    [...document.querySelectorAll(sel)].find((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return (
        r.width &&
        r.height &&
        s.display !== "none" &&
        s.visibility === "visible"
      );
    }) || null
  );
};
