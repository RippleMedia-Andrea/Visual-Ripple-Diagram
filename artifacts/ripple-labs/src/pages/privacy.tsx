import { PublicPageLayout, Section } from "@/components/PublicPageLayout";

export default function PrivacyPage() {
  return (
    <PublicPageLayout eyebrow="Ripple Labs" title="Privacy Policy">
      <p><strong>Effective date: September 21, 2026</strong></p>
      <p>Ripple Labs ("we," "us") is a ministry of Ripple Media LLC. This policy explains what we collect in the Ripple Labs website and the Purpose Lab app, and how we use it.</p>
      <Section title="What we collect">
        <p>Account information: your first name, email address, and password (stored securely in encrypted form; we cannot see it).</p>
        <p>Your journey: the story prompts you choose, the messages you write to the Purpose Lab guide and its replies, and the discoveries saved from them (story cards, themes, purpose statement, season, and next steps).</p>
        <p>Basic technical information needed to run the service, such as sign-in sessions and error logs.</p>
      </Section>
      <Section title="How we use it"><p>To provide your Purpose Lab journey, save your progress, and show your discoveries and summary.</p><p>To keep the service secure and working, including preventing misuse. We do not sell your information, and we do not use it for advertising.</p></Section>
      <Section title="AI processing"><p>The Purpose Lab guide is powered by Anthropic's Claude AI models, accessed through Replit. When you use the guide, your messages and saved discoveries are sent to these services to generate responses and organize your discoveries. They are used only to provide the Purpose Lab experience.</p></Section>
      <Section title="Who else handles your data"><p>We use trusted service providers to host and run the app (Replit for hosting and database, Anthropic for AI, and Resend for account emails). They process data only on our behalf.</p></Section>
      <Section title="Your choices"><p>You can review and edit your discoveries at any time in the app.</p><p>You can delete your account at any time from the account menu. This permanently deletes your account and all of your journey data.</p><p>You can contact us at <a className="text-[#2F7F7B] underline" href="mailto:admin@ripplemedia.space">admin@ripplemedia.space</a> with questions or requests.</p></Section>
      <Section title="Children"><p>The Purpose Lab is not intended for children under 13, and we do not knowingly collect information from them.</p></Section>
      <Section title="Security"><p>We use reasonable measures to protect your information, but no online service can guarantee perfect security.</p></Section>
      <Section title="Changes"><p>If we make meaningful changes to this policy, we will update the effective date and let you know in the app.</p></Section>
      <Section title="Contact"><p><a className="text-[#2F7F7B] underline" href="mailto:admin@ripplemedia.space">admin@ripplemedia.space</a></p></Section>
    </PublicPageLayout>
  );
}