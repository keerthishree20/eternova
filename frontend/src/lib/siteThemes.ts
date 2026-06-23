export interface SiteTheme {
  id: string;
  name: string;
  description: string;
  preview: string;
  fontFamily: string;
  bodyBg: string;
  cardBg: string;
  cardBorder: string;
  textColor: string;
  mutedColor: string;
  headerTextColor: string;
  useGradientHeader: boolean;
}

export const SITE_THEMES: Record<string, SiteTheme> = {
  romantic: {
    id: "romantic",
    name: "Romantic",
    description: "Warm purples and soft pinks",
    preview: "linear-gradient(135deg, #7c3aed, #ec4899)",
    fontFamily: "'Inter', sans-serif",
    bodyBg: "#fef7f0",
    cardBg: "#ffffff",
    cardBorder: "#f3e8ff",
    textColor: "#1a0a2e",
    mutedColor: "#9b8ab8",
    headerTextColor: "#ffffff",
    useGradientHeader: true,
  },
  minimal: {
    id: "minimal",
    name: "Minimal",
    description: "Clean white with subtle type",
    preview: "linear-gradient(135deg, #f8f8f8, #e8e8e8)",
    fontFamily: "'Inter', sans-serif",
    bodyBg: "#ffffff",
    cardBg: "#fafafa",
    cardBorder: "#eeeeee",
    textColor: "#111111",
    mutedColor: "#888888",
    headerTextColor: "#111111",
    useGradientHeader: false,
  },
  vintage: {
    id: "vintage",
    name: "Vintage",
    description: "Sepia tones with serif fonts",
    preview: "linear-gradient(135deg, #d4a574, #c4956a)",
    fontFamily: "Georgia, 'Times New Roman', serif",
    bodyBg: "#faf0e6",
    cardBg: "#fff8f0",
    cardBorder: "#d7ccc8",
    textColor: "#3e2723",
    mutedColor: "#8d6e63",
    headerTextColor: "#ffffff",
    useGradientHeader: true,
  },
  neon: {
    id: "neon",
    name: "Neon",
    description: "Dark with glowing accents",
    preview: "linear-gradient(135deg, #0a0a1a, #1a0a2e)",
    fontFamily: "'Inter', sans-serif",
    bodyBg: "#0a0a1a",
    cardBg: "#1a1a2e",
    cardBorder: "#2a2a4e",
    textColor: "#e0e0ff",
    mutedColor: "#7c7c9b",
    headerTextColor: "#ffffff",
    useGradientHeader: true,
  },
};
