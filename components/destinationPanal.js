import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
export function DestinationPanal({
    destLabel,
    setDestLabel,
    setDestination,
    distance,
    setDistance,
    duration,
    setDuration,
    isNavigating,
    setNavigating,
    location,
    animateDriving,
    setSteps,
    setStepIndex,
    formatDuration,
    mapRef,
    placesRef,
}){
    const clearDestination = () => {
        setDestination(null);
        setDestLabel("");
        setNavigating(false);
        setDistance(null);
        setDuration(null);
        setSteps([]);
        setStepIndex(0);
        placesRef.current?.setAddressText('');
  };

    return (
        <View style={styles.bottomDestinationPanal}>
        
                  {/* Destination label row */}
                  <View style={styles.destRow}>
                    <View style={styles.destIconBox}>
                      <MaterialCommunityIcon name="map-marker-radius" size={20} color="#00C6FF" />
                    </View>
                    <View style={styles.destInfo}>
                      <Text style={styles.destLabel} numberOfLines={1}>{destLabel}</Text>
                      {distance && duration ? (
                        <Text style={styles.destMeta}>
                          {distance.toFixed(1)} km · {formatDuration(duration)}
                        </Text>
                      ) : (
                        <Text style={styles.destMeta}>Tap Navigate to get directions</Text>
                      )}
                    </View>
                    <TouchableOpacity style={styles.clearButton} onPress={clearDestination}>
                      <MaterialCommunityIcon name="close" size={18} color="#9AA0A6" />
                    </TouchableOpacity>
                  </View>
        
                  {/* Action buttons */}
                  <View style={styles.actionRow}>
                    {!isNavigating ? (
                      <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={() => {
                          setNavigating(true)
                          if(location){
                            animateDriving(location.coords);
                          }
                        }}
                      >
                        <MaterialCommunityIcon name="navigation" size={20} color="#fff" />
                        <Text style={styles.navigateButtonText}>Navigate</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.stopButton}
                        onPress={() => {
                          setNavigating(false)
                          setSteps([]);
                          setStepIndex(0);
                          if(location && mapRef.current){
                            mapRef.current.animateToRegion({
                              latitude: location.coords.latitude,
                              longitude: location.coords.longitude,
                              latitudeDelta: 0.009,
                              longitudeDelta: 0.009,
                            },300)
                          }
                        }}
                      >
                        <MaterialCommunityIcon name="stop-circle-outline" size={20} color="#fff" />
                        <Text style={styles.navigateButtonText}>Stop</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
    );
};
const styles = StyleSheet.create({
  bottomDestinationPanal: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  destRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  destIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  destInfo: {
    flex: 1,
  },
  destLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#202124",
  },
  destMeta: {
    fontSize: 13,
    color: "#70757A",
    marginTop: 2,
  },
  clearButton: {
    padding: 6,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  navigateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00C6FF",
    borderRadius: 14,
    paddingVertical: 14,
  },
  stopButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EA4335",
    borderRadius: 14,
    paddingVertical: 14,
  },
  navigateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});