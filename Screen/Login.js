import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { supabase } from "../lib/supabase";
 
export default function Login({ navigation }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
 
  // ── Sign Up ───────────────────────────────────────────────────────────────
  // Supabase automatically generates a UUID for the new user.
  // Our DB trigger (handle_new_user) then creates a matching profiles row.
  const handleSignUp = async () => {
    if (!email || !password || !username) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
 
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
            data:{
                username,
                display_name: username,
            }
        }
     });
 
    if (error) {
      Alert.alert("Sign up failed", error.message);
      setLoading(false);
      return;
    }
 
    // Update the auto-created profile with the chosen username
    const userId = data.user.id;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", userId);
 
    if (profileError) {
      console.warn("Profile update failed:", profileError.message);
    }
 
    setLoading(false);
    // Supabase sends a confirmation email by default.
    // If you've disabled that in your project, the user is signed in immediately
    // and onAuthStateChange in App.js will navigate them to LocationScreen.
    Alert.alert(
      "Account created!",
      "Check your email to confirm your account, then sign in."
    );
    setMode("signin");
  };
 
  // ── Sign In ───────────────────────────────────────────────────────────────
  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
 
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
 
    if (error) {
      Alert.alert("Sign in failed", error.message);
      setLoading(false);
      return;
    }
 
    // onAuthStateChange in App.js will handle navigation automatically
    setLoading(false);
    const { data: { user } } = await supabase.auth.getUser();
    navigation.navigate("locationScreen", { userId: user.id })

  };
 
  return (
    <LinearGradient
      colors={["#00C6FF", "#1A1F2B"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inner}
      >
        {/* Logo */}
        <MaterialCommunityIcons name="car" size={64} color="#fff" style={styles.logo} />
        <Text style={styles.title}>Nav Along</Text>
        <Text style={styles.subtitle}>
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </Text>
 
        {/* Username — sign up only */}
        {mode === "signup" && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        )}
 
        {/* Email */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(255,255,255,0.5)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
 
        {/* Password */}
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Password"
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword((v) => !v)}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off" : "eye"}
              size={22}
              color="rgba(255,255,255,0.6)"
            />
          </TouchableOpacity>
        </View>
 
        {/* Primary action button */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={mode === "signin" ? handleSignIn : handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {mode === "signin" ? "Sign In" : "Sign Up"}
            </Text>
          )}
        </TouchableOpacity>
 
        {/* Toggle mode */}
        <TouchableOpacity
          onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {mode === "signin"
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
 
const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logo: { marginBottom: 8 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 36,
  },
  input: {
    width: "100%",
    height: 52,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  passwordRow: {
    width: "100%",
    position: "relative",
    marginBottom: 14,
  },
  passwordInput: {
    width: "100%",
    marginBottom: 0,
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: 14,
    top: 14,
  },
  primaryButton: {
    width: "100%",
    height: 52,
    backgroundColor: "#fff",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#1A1F2B",
    fontSize: 17,
    fontWeight: "700",
  },
  toggleButton: { marginTop: 20 },
  toggleText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
  },
});