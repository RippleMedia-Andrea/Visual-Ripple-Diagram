import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';
import { PUBLIC_APP_ORIGIN, requestPasswordReset } from '@/lib/mobile-api';
import { useGetPasswordResetAvailability } from '@workspace/api-client-react';

export function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const resetAvailability = useGetPasswordResetAvailability();

  function openPublicPage(path: string) {
    if (PUBLIC_APP_ORIGIN) void WebBrowser.openBrowserAsync(`${PUBLIC_APP_ORIGIN}${path}`);
  }

  async function submit() {
    setError('');
    if (forgotMode) {
      if (!email.trim()) {
        setError('Enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        await requestPasswordReset(email.trim());
      } catch {
        // Always show the same outcome to avoid account enumeration.
      } finally {
        setResetSent(true);
        setIsSubmitting(false);
      }
      return;
    }
    if (!email.trim() || password.length < 8 || (mode === 'sign-up' && !name.trim())) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }
    if (mode === 'sign-up' && !aiConsent) {
      setError('Please review and accept the AI processing consent before creating your account.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'sign-up') await signUp(name.trim(), email.trim(), password, true);
      else await signIn(email.trim(), password);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAwareScrollViewCompat
      style={{ backgroundColor: colors.deepTeal }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 0) + 28,
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0) + 28,
        },
      ]}
      bottomOffset={64}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.brand}>
        <Image source={require('@/assets/images/purpose-lab-icon.png')} style={styles.logo} accessibilityLabel="Purpose Lab ripple mark" />
        <Text style={[styles.eyebrow, { color: colors.accent }]}>RIPPLE LABS</Text>
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Purpose Lab</Text>
        <Text style={[styles.subtitle, { color: colors.softAqua }]}>Six stages to name what is already within you.</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {forgotMode ? 'Reset your password' : mode === 'sign-in' ? 'Welcome back' : 'Begin your journey'}
        </Text>
        {forgotMode ? (
          <Text style={[styles.forgotCopy, { color: colors.mutedForeground }]}>
            Enter your email and we’ll send a reset link if an account exists.
          </Text>
        ) : null}
        {resetSent ? (
          <Text testID="reset-success" style={[styles.success, { color: colors.primary }]}>
            If an account exists for that email, we sent a password reset link. You can use it on the website or in the app.
          </Text>
        ) : null}
        {mode === 'sign-up' && !forgotMode ? (
          <TextInput testID="name-input" value={name} onChangeText={setName} placeholder="Name" placeholderTextColor={colors.mutedForeground} style={[styles.input, { borderColor: colors.input, color: colors.foreground }]} />
        ) : null}
        <TextInput
          testID="email-input"
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          style={[styles.input, { borderColor: colors.input, color: colors.foreground }]}
        />
        {!forgotMode ? (
          <TextInput
            testID="password-input"
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor={colors.mutedForeground}
            secureTextEntry
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            style={[styles.input, { borderColor: colors.input, color: colors.foreground }]}
            onSubmitEditing={submit}
          />
        ) : null}
        {mode === 'sign-up' && !forgotMode ? (
          <View style={styles.consentBlock}>
            <Pressable
              testID="ai-consent-checkbox"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: aiConsent }}
              onPress={() => setAiConsent((current) => !current)}
              style={styles.consentRow}
            >
              <Feather name={aiConsent ? 'check-square' : 'square'} size={22} color={colors.primary} />
              <Text style={[styles.consentText, { color: colors.foreground }]}>
                I understand my answers are processed by a third-party AI service (Anthropic's Claude) to guide my Purpose Lab journey, as described in the{' '}
                <Text testID="privacy-link" onPress={() => openPublicPage('/privacy')} style={{ color: colors.primary }}>Privacy Policy</Text>.
              </Text>
            </Pressable>
            <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
              By creating an account you agree to the{' '}
              <Text testID="terms-link" onPress={() => openPublicPage('/terms')} style={{ color: colors.primary }}>Terms of Use</Text>.
            </Text>
          </View>
        ) : null}
        {mode === 'sign-in' && !forgotMode && resetAvailability.data?.available ? (
          <Pressable testID="forgot-password" onPress={() => { setForgotMode(true); setError(''); setResetSent(false); }}>
            <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot password?</Text>
          </Pressable>
        ) : null}
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable testID="auth-submit" disabled={isSubmitting} onPress={submit} style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary, opacity: pressed || isSubmitting ? 0.7 : 1 }]}>
          {isSubmitting ? <ActivityIndicator color={colors.primaryForeground} /> : (
            <>
              <Text style={[styles.primaryLabel, { color: colors.primaryForeground }]}>
                {forgotMode ? 'Send reset link' : mode === 'sign-in' ? 'Continue' : 'Create account'}
              </Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
        <Pressable
          testID="auth-mode-switch"
          onPress={() => {
            setError('');
            if (forgotMode) setForgotMode(false);
            else setMode((current) => current === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
          style={styles.switchButton}
        >
          <Text style={[styles.switchLabel, { color: colors.primary }]}>
            {forgotMode ? 'Back to sign in' : mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, gap: 28 },
  brand: { alignItems: 'center' },
  logo: { width: 76, height: 76, borderRadius: 18, marginBottom: 18 },
  eyebrow: { fontFamily: 'Poppins_600SemiBold', fontSize: 12, letterSpacing: 3 },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 42, marginTop: 8 },
  subtitle: { fontFamily: 'Poppins_400Regular', fontSize: 15, textAlign: 'center', marginTop: 8 },
  card: { borderRadius: 24, padding: 22, gap: 14 },
  cardTitle: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 27, marginBottom: 2 },
  input: { height: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, fontFamily: 'Poppins_400Regular', fontSize: 15 },
  error: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19 },
  success: { fontFamily: 'Poppins_500Medium', fontSize: 13, lineHeight: 19 },
  forgotCopy: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19 },
  primaryButton: { height: 54, borderRadius: 27, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  switchButton: { paddingVertical: 8, alignItems: 'center' },
  switchLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
  forgotLink: { fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'right' },
  consentBlock: { gap: 10, marginTop: 2 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  consentText: { flex: 1, fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  termsText: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
});