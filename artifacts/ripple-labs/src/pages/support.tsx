import { PublicPageLayout, Section } from "@/components/PublicPageLayout";

export default function SupportPage() {
  return (
    <PublicPageLayout eyebrow="Purpose Lab" title="Need help?">
      <p>Email <a className="text-[#2F7F7B] underline" href="mailto:admin@ripplemedia.space">admin@ripplemedia.space</a> and we’ll help you get unstuck.</p>
      <Section title="How do I reset my password?"><p>Password reset isn&apos;t available yet. Please contact <a className="text-[#2F7F7B] underline" href="mailto:admin@ripplemedia.space">admin@ripplemedia.space</a></p></Section>
      <Section title="How do I delete my account?"><p>Open the account menu in Purpose Lab and choose the delete-account option. This permanently deletes your account and all of your journey data.</p></Section>
      <Section title="Is my journey private?"><p>Your journey is private to your account. We don’t sell your information or use it for advertising, though messages and discoveries are processed by the service providers described in our Privacy Policy.</p></Section>
      <Section title="Can I use the app and website with the same account?"><p>Yes. Sign in with the same email and password on either the Purpose Lab app or the Ripple Labs website, and your progress will sync across devices.</p></Section>
      <p className="text-xs md:text-sm">The Purpose Lab guide is not counseling. If you are in crisis or danger, call or text <strong>988</strong> in the U.S. or contact local emergency services.</p>
    </PublicPageLayout>
  );
}