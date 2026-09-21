export const STORY_PROMPTS = [
  {
    id: "alive",
    label: "A moment I felt most alive",
    description: "When were you most fully yourself? What were you doing, and who were you with?",
  },
  {
    id: "shaped",
    label: "An experience that quietly shaped me",
    description: "An early memory or moment — big or small — that made you who you are.",
  },
  {
    id: "challenge",
    label: "A challenge that revealed my strength",
    description: "A difficulty you walked through and what it showed you about yourself.",
  },
  {
    id: "difference",
    label: "A time I made a real difference",
    description: "When did you know your presence or action truly mattered to someone else?",
  },
  {
    id: "shifted",
    label: "A moment when everything shifted",
    description: "Before and after. What changed? What became possible that wasn't before?",
  },
  {
    id: "natural",
    label: "Something I do that comes naturally",
    description: "What do others ask you for or notice about you that feels effortless to you?",
  },
  {
    id: "care",
    label: "Something I've always cared about",
    description: "A cause, a person, a gap in the world that has always pulled at you.",
  },
  {
    id: "memory",
    label: "A memory I keep returning to",
    description: "One that still holds meaning — even if you can't fully explain why.",
  },
  {
    id: "determined",
    label: "Something I went through that I don't want others to experience",
    description: "A hard season that left you determined to make things different for someone else.",
  },
  {
    id: "needed",
    label: "What I needed that I now give others",
    description: "Something you longed for in a difficult time that you now find yourself offering people.",
  },
] as const;

export type StoryPrompt = (typeof STORY_PROMPTS)[number];
export type StoryPromptId = StoryPrompt["id"];

export const STORY_PROMPT_LABELS: Readonly<Record<string, string>> = Object.fromEntries(
  STORY_PROMPTS.map(({ id, label }) => [id, label]),
);