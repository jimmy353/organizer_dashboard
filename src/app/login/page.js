import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiFetch, safeJson } from "../services/api";

export default function OrganizerLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login-role/", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          role: "organizer",
        }),
      });

      const data = await safeJson(res);

      if (data?.raw) {
        Alert.alert("Server Error", "Invalid backend response");
        setLoading(false);
        return;
      }

      // ❌ Not verified
      if (data.status === "not_verified") {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email OTP first."
        );
        navigation.navigate("VerifyOTP", { email });
        setLoading(false);
        return;
      }

      // ❌ Under review
      if (data.status === "pending") {
        Alert.alert(
          "Under Review",
          "Your request is under review.\n\nYou will be able to login once approved."
        );
        setLoading(false);
        return;
      }

      // ❌ Rejected
      if (data.status === "rejected") {
        Alert.alert(
          "Request Rejected",
          "Your organizer request was rejected.\nPlease contact support."
        );
        setLoading(false);
        return;
      }

      if (!res.ok) {
        Alert.alert(
          "Login Failed",
          data.detail || data.error || "Invalid credentials"
        );
        setLoading(false);
        return;
      }

      // ✅ SUCCESS
      if (!data.access || !data.refresh) {
        Alert.alert("Error", "Invalid token response");
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem("access", data.access);
      await AsyncStorage.setItem("refresh", data.refresh);
      await AsyncStorage.setItem("role", "organizer");

      Alert.alert("Success", "Welcome to Organizer Dashboard!");

      // 🔥 Web Organizer Dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: "OrganizerDashboard" }],
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    }

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organizer Login</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.loginText}>Login</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 24,
    justifyContent: "center",
  },

  title: {
    color: "#7CFF00",
    fontSize: 34,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
  },

  input: {
    height: 55,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingHorizontal: 18,
    marginBottom: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    fontSize: 16,
  },

  loginBtn: {
    backgroundColor: "#7CFF00",
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  loginText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
});