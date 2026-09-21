export interface StoryCard {
  id: string;
  journey_id: number;
  position: number;
  title: string;
  summary: string;
  prompt_id: string | null;
  is_difficult_experience: boolean;
  actions: string[];
  feelings: string[];
  people: string[];
  impact: string[];
  user_edited: boolean;
}

export interface PurposeTheme {
  id: string;
  journey_id: number;
  position: number;
  name: string;
  description: string;
  evidence: { storyTitle: string; detail: string }[];
  user_edited: boolean;
}

export interface Season {
  summary: string;
  roles: string[];
  capacity: string;
  constraints: string[];
  opportunities: string[];
  expressions: string[];
}

export interface ActionPlan {
  start: string[];
  stop: string[];
  continue: string[];
  oneStepThisWeek: string;
}

export interface JourneyResponse {
  id: number;
  status: string;
  currentStageIdx: number;
  selectedPrompts: string[];
  purposeOptions: string[];
  purposeStatement: string | null;
  messages: Record<string, any[]>;
  storyCards?: StoryCard[];
  themes?: PurposeTheme[];
  season?: Season | null;
  actionPlan?: ActionPlan | null;
}
