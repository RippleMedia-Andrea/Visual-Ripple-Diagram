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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAuth } from '@/providers/AuthProvider';
import { useColors } from '@/hooks/useColors';

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

  async function submit() {
    setError('');
    if (!email.trim() || password.length < 8 || (mode === 'sign-up' && !name.trim())) {
      setError('Enter a valid email and a password of at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (mode === 'sign-up') await signUp(name.trim(), email.trim(), password);
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
        <Image
          source={require('@/assets/images/purpose-lab-icon.png')}
          style={styles.logo}
          accessibilityLabel="Purpose Lab ripple mark"
        />
        <Text style={[styles.eyebrow, { color: colors.accent }]}>RIPPLE LABS</Text>
        <Text style={[styles.title, { color: colors.primaryForeground }]}>Purpose Lab</Text>
        <Text style={[styles.subtitle, { color: colors.softAqua }]}>
          Six stages to name what is already within you.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>
          {mode === 'sign-in' ? 'Welcome back' : 'Begin your journey'}
        </Text>
        {mode === 'sign-up' ? (
          <TextInput
            testID="name-input"
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { borderColor: colors.input, color: colors.foreground }]}
          />
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
        {error ? <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text> : null}
        <Pressable
          testID="auth-submit"
          disabled={isSubmitting}
          onPress={submit}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: pressed || isSubmitting ? 0.7 : 1 },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.primaryLabel, { color: colors.primaryForeground }]}>
                {mode === 'sign-in' ? 'Continue' : 'Create account'}
              </Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            setError('');
            setMode((current) => current === 'sign-in' ? 'sign-up' : 'sign-in');
          }}
          style={styles.switchButton}
        >
          <Text style={[styles.switchLabel, { color: colors.primary }]}>
            {mode === 'sign-in' ? 'New here? Create an account' : 'Already have an account? Sign in'}
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
  input: {
    height: 54,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
  },
  error: { fontFamily: 'Poppins_400Regular', fontSize: 13, lineHeight: 19 },
  primaryButton: {
    height: 54,
    borderRadius: 27,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 15 },
  switchButton: { paddingVertical: 8, alignItems: 'center' },
  switchLabel: { fontFamily: 'Poppins_500Medium', fontSize: 13, textAlign: 'center' },
});