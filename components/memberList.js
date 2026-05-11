import { useEffect, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
} from "react-native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { getRoomMembers } from "../lib/roomService";

export function MemberList({
    roomId,
    roomCode,
    groupName,
    isHost,
    userId,
    members,       
    destination,
    location,       
    setIsVisible,
}) {
    const [profiles, setProfiles] = useState([]);

    useEffect(() => {
        if (!roomId) return;
        getRoomMembers(roomId).then(({ data }) => {
            if (data) setProfiles(data);
        });
    }, [roomId]);

    const mergedMembers = profiles.map((profile) => {
        const isCurrentUser = profile.user_id === userId;
        const realtimeData = isCurrentUser
            ? {
                latitude: location?.coords?.latitude,
                longitude: location?.coords?.longitude,
                speed: location?.coords?.speed,
              }
            : members?.[profile.user_id];

        const isNavigating = (realtimeData?.speed ?? 0) > 0.5;

        // Distance calculation
        let distance = null;
        if (destination && realtimeData?.latitude) {
            const R = 6371;
            const dLat = (destination.latitude - realtimeData.latitude) * Math.PI / 180;
            const dLon = (destination.longitude - realtimeData.longitude) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(realtimeData.latitude * Math.PI / 180) *
                Math.cos(destination.latitude * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        }

        // ETA calculation
        let eta = null;
        if (distance !== null && realtimeData?.speed > 0.5) {
            const mins = Math.ceil((distance / (realtimeData.speed * 3.6)) * 60);
            eta = mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
        }

        return {
            ...profile,
            isNavigating,
            isCurrentUser,
            distance,
            eta,
        };
    });

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.handleBar} />
                <View style={styles.headerContent}>
                    <View style={styles.headerLeft}>
                        <MaterialCommunityIcon
                            name="account-group"
                            size={20}
                            color="#00C6FF"
                        />
                        <Text style={styles.headerTitle}>
                            {groupName}
                        </Text>
                        <View style={styles.countBadge}>
                            <Text style={styles.countText}>
                                {mergedMembers.length}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setIsVisible(false)}
                    >
                        <MaterialCommunityIcon name="close" size={20} color="#70757A" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Column */}
            <View style={styles.columnLabels}>
                <Text style={[styles.columnLabel, { flex: 1 }]}>Member</Text>
                <Text style={[styles.columnLabel, styles.columnRight]}>Distance</Text>
                <Text style={[styles.columnLabel, styles.columnRight]}>ETA</Text>
            </View>

            {/* Members */}
            <ScrollView
                style={styles.list}
                showsVerticalScrollIndicator={false}
            >
                {mergedMembers.map((member) => (
                    <View key={member.user_id} style={styles.memberRow}>

                        {/* Avatar + status dot */}
                        <View style={styles.avatarWrapper}>
                            {member.profiles?.avatar_url ? (
                                <Image
                                    source={{ uri: member.profiles.avatar_url }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatarFallback}>
                                    <Text style={styles.avatarLetter}>
                                        {member.profiles?.username?.[0]?.toUpperCase() ?? "?"}
                                    </Text>
                                </View>
                            )}
                            <View style={[
                                styles.statusDot,
                                member.isNavigating
                                    ? styles.dotActive
                                    : styles.dotIdle,
                            ]} />
                        </View>

                        {/* Name + status */}
                        <View style={styles.memberInfo}>
                            <View style={styles.nameRow}>
                                <Text style={styles.username} numberOfLines={1}>
                                    {member.profiles?.username ?? "Unknown"}
                                </Text>
                                {member.isCurrentUser && (
                                    <View style={styles.youBadge}>
                                        <Text style={styles.youBadgeText}>You</Text>
                                    </View>
                                )}
                                {isHost && member.isCurrentUser && (
                                    <View style={styles.hostBadge}>
                                        <Text style={styles.hostBadgeText}>Host</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[
                                styles.statusText,
                                member.isNavigating
                                    ? styles.statusActive
                                    : styles.statusIdle,
                            ]}>
                                {member.isNavigating ? "● Navigating" : "● Stopped"}
                            </Text>
                        </View>

                        {/* Distance */}
                        <View style={styles.metaBox}>
                            <Text style={styles.metaValue}>
                                {destination
                                    ? member.distance != null
                                        ? `${member.distance.toFixed(1)}`
                                        : "--"
                                    : "--"}
                            </Text>
                            {destination && (
                                <Text style={styles.metaUnit}>km</Text>
                            )}
                        </View>

                        {/* ETA */}
                        <View style={styles.metaBox}>
                            <Text style={styles.metaValue}>
                                {destination
                                    ? member.eta ?? "--"
                                    : "--"}
                            </Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            {/* Footer — room code */}
            <View style={styles.footer}>
                <MaterialCommunityIcon
                    name="key-variant"
                    size={16}
                    color="rgba(255,255,255,0.7)"
                />
                <Text style={styles.footerCode} selectable={true}>
                    Room Code: {roomCode}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: "hidden",
        maxHeight: 420,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 16,
    },

    // Header
    header: {
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F3F4",
    },
    handleBar: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#E0E0E0",
        alignSelf: "center",
        marginBottom: 12,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#202124",
    },
    countBadge: {
        backgroundColor: "#E8F5FF",
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    countText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#00C6FF",
    },
    closeButton: {
        padding: 4,
    },

    // Column labels
    columnLabels: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: "#F8F9FA",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F3F4",
    },
    columnLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: "#9AA0A6",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    columnRight: {
        width: 64,
        textAlign: "right",
    },

    // Member rows
    list: {
        maxHeight: 240,
    },
    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F3F4",
        gap: 12,
    },

    // Avatar
    avatarWrapper: {
        position: "relative",
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarFallback: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#00C6FF",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarLetter: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    statusDot: {
        width: 11,
        height: 11,
        borderRadius: 6,
        position: "absolute",
        bottom: 0,
        right: 0,
        borderWidth: 2,
        borderColor: "#fff",
    },
    dotActive: { backgroundColor: "#34A853" },
    dotIdle:   { backgroundColor: "#FFA500" },

    // Member info
    memberInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 2,
    },
    username: {
        fontSize: 14,
        fontWeight: "600",
        color: "#202124",
        flexShrink: 1,
    },
    youBadge: {
        backgroundColor: "#E8F5FF",
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    youBadgeText: {
        color: "#00C6FF",
        fontSize: 10,
        fontWeight: "700",
    },
    hostBadge: {
        backgroundColor: "#FFF3E0",
        borderRadius: 6,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    hostBadgeText: {
        color: "#FF9800",
        fontSize: 10,
        fontWeight: "700",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
    },
    statusActive: { color: "#34A853" },
    statusIdle:   { color: "#FFA500" },

    // Meta (distance + ETA)
    metaBox: {
        width: 64,
        alignItems: "flex-end",
    },
    metaValue: {
        fontSize: 14,
        fontWeight: "700",
        color: "#202124",
    },
    metaUnit: {
        fontSize: 11,
        color: "#9AA0A6",
        marginTop: 1,
    },

    // Footer
    footer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        backgroundColor: "#1A1F2B",
        paddingVertical: 14,
    },
    footerCode: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 1,
    },
});