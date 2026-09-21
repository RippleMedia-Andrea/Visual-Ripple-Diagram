import { StoryCard, PurposeTheme, Season, ActionPlan } from "../lib/types";
import { StoryCardView, ThemeCardView, SeasonFormView, ActionPlanFormView } from "./Discoveries";

interface MyDiscoveriesProps {
  isOpen: boolean;
  onClose: () => void;
  storyCards: StoryCard[];
  themes: PurposeTheme[];
  season: Season | null;
  actionPlan: ActionPlan | null;
  purposeStatement: string | null;
  onUpdateStoryCard: (card: StoryCard) => void;
  onDeleteStoryCard: (id: string) => void;
  onUpdateTheme: (theme: PurposeTheme) => void;
  onDeleteTheme: (id: string) => void;
  onUpdateSeason: (season: Season) => void;
  onUpdateActionPlan: (plan: ActionPlan) => void;
}

export function MyDiscoveries({
  isOpen,
  onClose,
  storyCards,
  themes,
  season,
  actionPlan,
  purposeStatement,
  onUpdateStoryCard,
  onDeleteStoryCard,
  onUpdateTheme,
  onDeleteTheme,
  onUpdateSeason,
  onUpdateActionPlan,
}: MyDiscoveriesProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" data-testid="my-discoveries-drawer">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md h-full bg-[#0F2A36] text-[#D7ECEB] shadow-2xl overflow-y-auto border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 z-10 bg-[#0F2A36]/90 backdrop-blur-md px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-serif text-2xl" style={{ color: "#C8A96A" }}>My Discoveries</h2>
          <button onClick={onClose} className="p-2 opacity-60 hover:opacity-100 transition-opacity">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-10">

          {/* Purpose Statement */}
          {purposeStatement && (
            <section>
              <h3 className="text-[10px] font-sans uppercase tracking-widest mb-4 opacity-50">Purpose Statement</h3>
              <div className="bg-[#2F7F7B]/20 border border-[#2F7F7B]/40 rounded-xl p-5">
                <p className="font-script text-xl leading-relaxed">{purposeStatement}</p>
              </div>
            </section>
          )}

          {/* Themes */}
          {themes.length > 0 && (
            <section>
              <h3 className="text-[10px] font-sans uppercase tracking-widest mb-4 opacity-50">Purpose Themes</h3>
              <div className="space-y-4">
                {themes.map((theme) => (
                  <ThemeCardView
                    key={theme.id}
                    theme={theme}
                    onUpdate={onUpdateTheme}
                    onDelete={() => onDeleteTheme(theme.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Season */}
          {season && (
            <section>
              <h3 className="text-[10px] font-sans uppercase tracking-widest mb-4 opacity-50">Current Season</h3>
              <SeasonFormView season={season} onUpdate={onUpdateSeason} />
            </section>
          )}

          {/* Action Plan */}
          {actionPlan && (
            <section>
              <h3 className="text-[10px] font-sans uppercase tracking-widest mb-4 opacity-50">Next Steps</h3>
              <ActionPlanFormView actionPlan={actionPlan} onUpdate={onUpdateActionPlan} />
            </section>
          )}

          {/* Story Cards */}
          {storyCards.length > 0 && (
            <section>
              <h3 className="text-[10px] font-sans uppercase tracking-widest mb-4 opacity-50">Story Cards</h3>
              <div className="space-y-4">
                {storyCards.map((card) => (
                  <StoryCardView
                    key={card.id}
                    card={card}
                    onUpdate={onUpdateStoryCard}
                    onDelete={() => onDeleteStoryCard(card.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {storyCards.length === 0 && themes.length === 0 && !season && !actionPlan && !purposeStatement && (
            <div className="text-center py-12 opacity-50 text-sm font-sans">
              Nothing saved yet. Discoveries will appear here as you journey through the stages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
