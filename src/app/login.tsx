import { useState } from "react";

import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { router } from "expo-router";

import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";

import { supabase } from "../services/supabase";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ============================================================
  // EMAIL SIGN IN
  // ============================================================

  const signIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing details",
        "Please enter your email and password."
      );
      return;
    }

    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        Alert.alert(
          "Sign in failed",
          error.message
        );
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error(
        "❌ Sign in error:",
        error
      );

      Alert.alert(
        "Sign in failed",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // CREATE ACCOUNT
  // ============================================================

  const signUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Missing details",
        "Please enter your email and password."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password too short",
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (error) {
        Alert.alert(
          "Sign up failed",
          error.message
        );
        return;
      }

      if (data.session) {
        Alert.alert(
          "Account created",
          "Welcome to Priya Companion!"
        );

        router.replace("/");
      } else {
        Alert.alert(
          "Check your email",
          "Your account was created. Please check your email to verify your account."
        );
      }
    } catch (error) {
      console.error(
        "❌ Sign up error:",
        error
      );

      Alert.alert(
        "Sign up failed",
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // GOOGLE SIGN IN
  // ============================================================

  const signInWithGoogle = async () => {
    setGoogleLoading(true);

    try {
      const redirectTo =
        Linking.createURL("auth/callback");

      console.log(
        "🔗 Google redirect URL:",
        redirectTo
      );

      const { data, error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",

          options: {
            redirectTo,
            skipBrowserRedirect: true,
          },
        });

      if (error) {
        console.error(
          "❌ Google OAuth error:",
          error
        );

        Alert.alert(
          "Google Sign-In failed",
          error.message
        );

        return;
      }

      if (!data?.url) {
        Alert.alert(
          "Google Sign-In failed",
          "Supabase did not return an authentication URL."
        );

        return;
      }

      const result =
        await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectTo
        );

      console.log(
        "🔐 Google OAuth result:",
        result
      );

      if (result.type === "success") {
        console.log(
          "✅ Google authentication completed."
        );

        router.replace("/");
      }
    } catch (error) {
      console.error(
        "❌ Google Sign-In error:",
        error
      );

      Alert.alert(
        "Google Sign-In failed",
        "Something went wrong. Please try again."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>
          💜
        </Text>

        <Text style={styles.title}>
          Priya Companion
        </Text>

        <Text style={styles.subtitle}>
          Your personal AI companion
        </Text>

        {/* GOOGLE */}

        <Pressable
          style={[
            styles.googleButton,
            googleLoading &&
              styles.disabledButton,
          ]}
          onPress={signInWithGoogle}
          disabled={
            loading || googleLoading
          }
        >
          {googleLoading ? (
            <ActivityIndicator
              color="#222"
            />
          ) : (
            <Text
              style={
                styles.googleButtonText
              }
            >
              Continue with Google
            </Text>
          )}
        </Pressable>

        {/* DIVIDER */}

        <View style={styles.dividerRow}>
          <View
            style={styles.divider}
          />

          <Text
            style={styles.dividerText}
          >
            OR
          </Text>

          <View
            style={styles.divider}
          />
        </View>

        {/* EMAIL FORM */}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            editable={
              !loading &&
              !googleLoading
            }
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            editable={
              !loading &&
              !googleLoading
            }
          />

          <Pressable
            style={[
              styles.primaryButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={signIn}
            disabled={
              loading ||
              googleLoading
            }
          >
            {loading ? (
              <ActivityIndicator
                color="#fff"
              />
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Sign In
              </Text>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              loading &&
                styles.disabledButton,
            ]}
            onPress={signUp}
            disabled={
              loading ||
              googleLoading
            }
          >
            <Text
              style={
                styles.secondaryButtonText
              }
            >
              Create Account
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  emoji: {
    fontSize: 54,
    textAlign: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#222",
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#777",
    marginTop: 8,
    marginBottom: 36,
  },

  googleButton: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },

  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#222",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e5e5",
  },

  dividerText: {
    marginHorizontal: 14,
    fontSize: 12,
    color: "#999",
    fontWeight: "600",
  },

  form: {
    width: "100%",
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#222",
    marginBottom: 14,
    backgroundColor: "#fafafa",
  },

  primaryButton: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6C4AB6",
    marginTop: 6,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#6C4AB6",
    marginTop: 12,
  },

  secondaryButtonText: {
    color: "#6C4AB6",
    fontSize: 16,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.6,
  },
});