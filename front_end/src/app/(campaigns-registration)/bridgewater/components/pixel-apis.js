export const fbPixelTrackPage = () => {
  window.fbq("track", "PageView");
};

export const fbPixelTrackEvent = (name, options = {}) => {
  if (window.fbq) {
    window.fbq("trackCustom", name, options);
  }
};

export const fbPixelInit = (pixelID) => {
  if (window.fbPixelInitialized) {
    return;
  }
  window.fbq("init", pixelID);
  window.fbPixelInitialized = true;
};

export const fbPixelRevokeConsent = () => {
  window.fbq("consent", "revoke");
};

export const fbPixelGrantConsent = () => {
  window.fbq("consent", "grant");
};

export const lnkdnInitAndTrack = () => {
  if (window.lnkdInitAndTrackFn) {
    window.lnkdInitAndTrackFn(window.lintrk);
  }
};

export const lnkdTrack = () => {
  if (window.lintrk) {
    window.lintrk("track", { conversion_id: 18548052 });
  }
};

export const redditPixelInitAndTrack = (pixelId, eventName = "PageVisit") => {
  if (window.rdt) {
    window.rdt("init", pixelId);
    window.rdt("track", eventName);
  }
};
