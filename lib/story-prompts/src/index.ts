export const STORY_PROMPTS = [
  {
    id: "alive",
    label: "Moments of aliveness",
    description: "When were you most fully yourself? What were you doing, and who were you with?",
  },
  {
    id: "shaped",
    label: "Early experiences",
    description: "An early memory, big or small, when you felt most like yourself.",
  },
  {
    id: "challenge",
    label: "Defining challenges",
    description: "A challenge you choose to share. You decide how much to tell.",
  },
  {
    id: "shifted",
    label: "Turning points",
    description: "A moment something shifted. What changed for you or someone else?",
  },
] as const;

export type StoryPrompt = (typeof STORY_PROMPTS)[number];
export type StoryPromptId = StoryPrompt["id"];

export const STORY_PROMPT_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  STORY_PROMPTS.map(({ id, label }) => [id, label]),
);