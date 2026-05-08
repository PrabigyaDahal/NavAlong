import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { createRoom, joinRoom } from "../lib/roomService";
import { supabase } from "../lib/supabase";

export default function RoomScreen({ navigation }) {
  const [mode, setMode] = useState("create"); // "create" | "join"

  // Create mode
  const [groupName, setGroupName] = useState("");
  const [createdRoom, setCreatedRoom] = useState(null); // { id, short_code, group_name }

  // Join mode
  const [codeInput, setCodeInput] = useState("");

  const [loading, setLoading] = useState(false);

  const [currentUserId, setCurrentUserId] = useState(null);
  const getCurrentUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setGroupName("");
    setCreatedRoom(null);
    setCodeInput("");
  };

  const handleCreateRoom = async () => {
    if (!groupName.trim()) {
      Alert.alert("Missing name", "Please enter a group name.");
      return;
    }

    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      if (!userId) {
        Alert.alert("Not signed in", "Please sign in first.");
        return;
      }

      // Supabase creates the UUID — trigger derives short_code from it
      const { data } = await createRoom(groupName.trim(), userId);
    //   if (error) throw error;

      // Show the short_code for the host to share — don't navigate yet
      setCreatedRoom(data);
    } catch (err) {
      Alert.alert("Error", err.message ?? "Could not create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnterRoom = () => {
    
    navigation.navigate("locationScreen", {
      roomId:    createdRoom.id,
      roomCode:  createdRoom.short_code,
      groupName: createdRoom.group_name,
      userId:    currentUserId,
      isHost:    true,
    });
  };

  const handleJoinRoom = async () => {
    const code = codeInput;
    if (!code) {
      Alert.alert("Enter code", "Please enter the room code shared by your group.");
      return;
    }

    setLoading(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Alert.alert("Not signed in", "Please sign in first.");
        return;
      }

      // joinRoom validates the code AND adds user to room_members
      const { data, error } = await joinRoom(code, userId);
      if (error || !data) {
        Alert.alert("Not found", "No room with that code. Double-check with your group.");
        return;
      }
      const isHosting = data.created_by === userId;
      navigation.navigate("locationScreen", {
        roomId:    data.id,
        roomCode:  data.short_code,
        groupName: data.group_name,
        userId:    userId,
        isHost:    isHosting,
      });
    } catch (err) {
      Alert.alert("Error", err.message ?? "Could not join room.");
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.title}>
          {mode === "create" ? "Create Room" : "Join Room"}
        </Text>

        {/* ── Tab toggle ── */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === "create" && styles.tabActive]}
            onPress={() => switchMode("create")}
          >
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={18}
              color={mode === "create" ? "#1A1F2B" : "#fff"}
            />
            <Text style={[styles.tabText, mode === "create" && styles.tabTextActive]}>
              Create
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, mode === "join" && styles.tabActive]}
            onPress={() => switchMode("join")}
          >
            <MaterialCommunityIcons
              name="account-multiple-plus-outline"
              size={18}
              color={mode === "join" ? "#1A1F2B" : "#fff"}
            />
            <Text style={[styles.tabText, mode === "join" && styles.tabTextActive]}>
              Join
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── CREATE panel ── */}
        {mode === "create" && (
          <View style={styles.panel}>
            {!createdRoom ? (
              // Step 1 — enter name and create
              <>
                <Text style={styles.label}>Group name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Sydney Road Trip"
                  placeholderTextColor="rgba(255,255,255,0.45)"
                  value={groupName}
                  onChangeText={setGroupName}
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCreateRoom}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#1A1F2B" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Create Room</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              // Step 2 — room created, show code to share
              <>
                <View style={styles.successBadge}>
                  <MaterialCommunityIcons name="check-circle" size={22} color="#00C6FF" />
                  <Text style={styles.successText}>Room created!</Text>
                </View>

                <Text style={styles.shareHint}>
                  Share this code with your group
                </Text>

                {/* Code display — split into individual character boxes */}
                <View style={styles.codeRow}>
                  {createdRoom.short_code.split("").map((char, i) => (
                    <View key={i} style={styles.codeBox}>
                      <Text style={styles.codeChar}>{char}</Text>
                    </View>
                  ))}
                </View>

                <Text style={styles.uuidHint}>
                  Room ID: {createdRoom.id}
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEnterRoom}
                >
                  <Text style={styles.primaryButtonText}>Enter Room →</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── JOIN panel ── */}
        {mode === "join" && (
          <View style={styles.panel}>
            <Text style={styles.label}>Room code</Text>
            <TextInput
              style={[styles.textInput, styles.codeTextInput]}
              placeholder="e.g. 3F8A1C2B"
              placeholderTextColor="rgba(255,255,255,0.45)"
              value={codeInput}
              onChangeText={(e) => setCodeInput(e.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
              autoFocus
            />
            <Text style={styles.joinHint}>
              The room code is 8 characters and shared by the group host
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleJoinRoom}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1A1F2B" />
              ) : (
                <Text style={styles.primaryButtonText}>Join Room</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 28,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 4,
    width: "100%",
    marginBottom: 32,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabActive: { backgroundColor: "#fff" },
  tabText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  tabTextActive: { color: "#1A1F2B" },

  // Panel
  panel: { width: "100%", alignItems: "center" },
  label: {
    alignSelf: "flex-start",
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  textInput: {
    width: "100%",
    height: 52,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    marginBottom: 16,
  },
  codeTextInput: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 6,
    textAlign: "center",
  },

  // Buttons
  primaryButton: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  primaryButtonText: {
    color: "#1A1F2B",
    fontSize: 17,
    fontWeight: "700",
  },

  // Success state
  successBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  successText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  shareHint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    marginBottom: 16,
  },

  // Code display boxes
  codeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 16,
  },
  codeBox: {
    width: 38,
    height: 48,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  codeChar: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  uuidHint: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    marginBottom: 4,
    letterSpacing: 0.3,
  },

  // Join hints
  joinHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    textAlign: "center",
    marginTop: -8,
  },
});