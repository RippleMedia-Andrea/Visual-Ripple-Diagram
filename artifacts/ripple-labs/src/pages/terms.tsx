import { PublicPageLayout, Section } from "@/components/PublicPageLayout";

export default function TermsPage() {
  return (
    <PublicPageLayout eyebrow="Ripple Labs" title="Terms of Use">
      <p><strong>Effective date: September 21, 2026</strong></p>
      <p>By creating an account or using Ripple Labs and the Purpose Lab, you agree to these terms.</p>
      <Section title="What the Purpose Lab is"><p>The Purpose Lab is a guided, faith-based reflection experience. Its AI guide offers observations and questions based on what you share. It is not counseling, therapy, medical, legal, or financial advice, and it does not speak for God. Please bring what you discover into prayer, Scripture, and conversation with people you trust.</p></Section>
      <Section title="If you are in crisis"><p>If you are thinking about harming yourself or are in danger, contact local emergency services right away. In the U.S., call or text 988 to reach the Suicide &amp; Crisis Lifeline.</p></Section>
      <Section title="Your account"><p>You must be at least 13 years old to use the Purpose Lab. Keep your password private. You are responsible for activity on your account.</p></Section>
      <Section title="Your content"><p>What you write belongs to you. You give us permission to store and process it only to provide the service to you, as described in the Privacy Policy.</p></Section>
      <Section title="Acceptable use"><p>Please don't misuse the service, attempt to access other people's accounts, or use it to harm others.</p></Section>
      <Section title="Changes and availability"><p>We may update the service or these terms. We will update the effective date when we do. We may suspend accounts that misuse the service.</p></Section>
      <Section title="Limitation"><p>The service is provided "as is." To the extent allowed by law, Ripple Media LLC is not liable for decisions you make based on your use of the Purpose Lab.</p></Section>
      <Section title="Contact"><p><a className="text-[#2F7F7B] underline" href="mailto:admin@ripplemedia.space">admin@ripplemedia.space</a></p></Section>
    </PublicPageLayout>
  );
}