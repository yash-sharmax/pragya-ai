export type PersonaId = "veda" | "neeti" | "ganita" | "sarathi";

export interface PersonaConfig {
  id: PersonaId;
  name: string;
  sanskritName: string;
  tagline: string;
  domain: string;
  provider: "gemini" | "groq";
  color: {
    primary: string;
    bg: string;
    border: string;
    badge: string;
    accent: string;
  };
  promptFilename: string;
}

export const PERSONAS: Record<PersonaId, PersonaConfig> = {
  veda: {
    id: "veda",
    name: "Pragya Veda",
    sanskritName: "प्रज्ञा वेद",
    tagline: "Science, Cosmology & Nature",
    domain: "Physics, Astronomy, Natural Sciences, and Ancient Scientific Thought",
    provider: "gemini",
    color: {
      primary: "from-blue-600 to-indigo-600",
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      border: "border-blue-200 dark:border-blue-900/50",
      badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      accent: "text-blue-600 dark:text-blue-400",
    },
    promptFilename: "pragya-veda-prompt.txt",
  },
  neeti: {
    id: "neeti",
    name: "Pragya Neeti",
    sanskritName: "प्रज्ञा नीति",
    tagline: "Business Strategy & Governance",
    domain: "Corporate Management, Entrepreneurship, Decision-Making & Ethics",
    provider: "gemini",
    color: {
      primary: "from-emerald-600 to-teal-700",
      bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
      border: "border-emerald-200 dark:border-emerald-900/50",
      badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      accent: "text-emerald-600 dark:text-emerald-400",
    },
    promptFilename: "pragya-niti-prompt.txt",
  },
  ganita: {
    id: "ganita",
    name: "Pragya Ganita",
    sanskritName: "प्रज्ञा गणित",
    tagline: "Mathematics & Computer Science",
    domain: "Algorithms, Vedic Maths, Number Systems & Computational Logic",
    provider: "groq",
    color: {
      primary: "from-violet-600 to-purple-700",
      bg: "bg-violet-50/50 dark:bg-violet-950/20",
      border: "border-violet-200 dark:border-violet-900/50",
      badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
      accent: "text-violet-600 dark:text-violet-400",
    },
    promptFilename: "pragya-ganit-prompt.txt",
  },
  sarathi: {
    id: "sarathi",
    name: "Pragya Sarathi",
    sanskritName: "प्रज्ञा सारथि",
    tagline: "Psychology & Emotional Well-being",
    domain: "Mindfulness, Emotional Balance, CBT Concepts & Personal Growth",
    provider: "gemini",
    color: {
      primary: "from-amber-600 to-rose-600",
      bg: "bg-amber-50/50 dark:bg-amber-950/20",
      border: "border-amber-200 dark:border-amber-900/50",
      badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      accent: "text-amber-600 dark:text-amber-400",
    },
    promptFilename: "pragya-sarathi-prompt.txt",
  },
};
