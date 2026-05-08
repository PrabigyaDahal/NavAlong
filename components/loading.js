import {View, Text, StyleSheet} from "react-native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";

export function Loading(){
    return(
        <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
                <MaterialCommunityIcon name="map-marker-radius" size={32} color="#00C6FF" />
                <Text style={styles.loadingTitle}>Finding your location</Text>
                <Text style={styles.loadingSubtitle}>This will only take a moment</Text>
            </View>
        </View>
    );

};

const styles = StyleSheet.create({
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(232,234,240,0.92)",
        justifyContent: "center",
        alignItems: "center",
      },
      loadingCard: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 32,
        alignItems: "center",
        gap: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
      },
      loadingTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#202124",
      },
      loadingSubtitle: {
        fontSize: 14,
        color: "#70757A",
      },
});