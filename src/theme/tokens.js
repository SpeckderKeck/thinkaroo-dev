(function createThinkarooTheme(global) {
  const cardCategoryColors = {
    Zeichnen: "#6B4E8A",
    Erklären: "#4F86A6",
    Quizfrage: "#E3B23C",
    Singlechoice: "#2A9D8F",
    Pantomime: "#C76A2A",
    Start: "#3F6B3A",
    Ziel: "#3F6B3A",
  };

  const tokens = {
    background: "#1F2A1E",
    surface: "#F3E9D3",
    textPrimary: "#1E1E1E",
    textOnDark: "#FFFFFF",
    border: "#8B5E34",
    mutedText: "#5C6A5A",
    overlay: "rgba(20, 26, 20, 0.55)",
    primary: "#3F6B3A",
    primaryHover: "#4B7E46",
    secondary: "#4F86A6",
    secondaryHover: "#629DBD",
    accent: "#E3B23C",
    warning: "#C76A2A",
    success: "#3F6B3A",
    info: "#4F86A6",
    disabledBg: "rgba(255,255,255,0.35)",
    disabledText: "rgba(30,30,30,0.45)",
  };

  function hexToRgb(hexColor) {
    const hex = hexColor.replace("#", "").trim();
    const normalized = hex.length === 3 ? hex.split("").map((char) => `${char}${char}`).join("") : hex;
    const value = Number.parseInt(normalized, 16);
    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255,
    };
  }

  function getCardColor(category) {
    return cardCategoryColors[category] ?? tokens.surface;
  }

  function getReadableTextColor(bgColor) {
    if (!bgColor || typeof bgColor !== "string") {
      return tokens.textPrimary;
    }
    if (bgColor.startsWith("rgb")) {
      const matches = bgColor.match(/[\d.]+/g) ?? [];
      const [r = 243, g = 233, b = 211] = matches.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.58 ? tokens.textPrimary : tokens.textOnDark;
    }
    const { r, g, b } = hexToRgb(bgColor);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.58 ? tokens.textPrimary : tokens.textOnDark;
  }

  const api = { tokens, cardCategoryColors, getCardColor, getReadableTextColor };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  global.THINKAROO_THEME = api;
})(globalThis);
