import * as Location from "expo-location";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {
  subscribeToRoom,
  broadcastLocation,
  saveLocation,
  endRoom,
  DB_WRITE_INTERVAL_MS,
  leaveRoom
} from "../lib/roomService";

const GOOGLE_API_KEY = "AIzaSyB_FcPTryxK-i6Tw3AXaQNRhQJdsJeN7cM";
const BROADCAST_INTERVAL_MS = 3000;
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 50;

export default function LocationScreen({ navigation, route }) {
  const { roomId, roomCode, userId, groupName, isHost } = route?.params ?? {};

  const [location, setLocation]       = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [destination, setDestination] = useState(null);
  const [destLabel, setDestLabel]     = useState("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [distance, setDistance]       = useState(null);
  const [duration, setDuration]       = useState(null);
  const [members, setMembers]         = useState({});

  const channelRef = useRef(null);
  const mapRef     = useRef(null);
  const placesRef = useRef(null);

  // ── 1. GPS watch ──────────────────────────────────────────────────────────
  useEffect(() => {
    let watcher;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setIsLoading(false); return; }
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
        (pos) => { setLocation(pos); setIsLoading(false); }
      );
    })();
    return () => watcher?.remove();
  }, []);

  // ── 2. Realtime room channel ───────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !userId) return;
    const channel = subscribeToRoom(roomId, userId, (payload) => {
      setMembers((prev) => ({
        ...prev,
        [payload.userId]: {
          latitude:  payload.latitude,
          longitude: payload.longitude,
          heading:   payload.heading,
          timestamp: payload.timestamp,
        },
      }));
    });
    channelRef.current = channel;
    return () => channel.unsubscribe();
  }, [roomId, userId]);

  // ── 3. Broadcast + DB persist ──────────────────────────────────────────────
  useEffect(() => {
    if (!channelRef.current || !location) return;
    broadcastLocation(channelRef.current, userId, location.coords);
    saveLocation(userId, location.coords);

    broadcastLocation(channelRef.current, userId, location.coords);
    saveLocation(userId, location.coords);

    const broadcastTimer = setInterval(() => {
      if (channelRef.current && location)
        broadcastLocation(channelRef.current, userId, location.coords);
    }, BROADCAST_INTERVAL_MS);

    const dbTimer = setInterval(() => {
      if (location) saveLocation(userId, location.coords);
    }, DB_WRITE_INTERVAL_MS);

    return () => { clearInterval(broadcastTimer); clearInterval(dbTimer); };
  }, [location, userId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const region = location ? {
    latitude:      location.coords.latitude,
    longitude:     location.coords.longitude,
    latitudeDelta: 0.009,
    longitudeDelta: 0.009,
    heading:       location.coords.heading,
  } : undefined;

  const memberCount = Object.keys(members).length  ;

  const handleFetchPlace = useCallback((place) => {
    setDestination({
      latitude:      place.details.location.latitude,
      longitude:     place.details.location.longitude,
      latitudeDelta: 0.009,
      longitudeDelta: 0.009,
    });
    setDestLabel(place.details.formattedAddress ?? "Selected destination");
    setIsNavigating(false);
    setDistance(null);
    setDuration(null);
  }, []);

  const handleMapClick = useCallback((e) => {
    setDestination({
      latitude:      e.nativeEvent.coordinate.latitude,
      longitude:     e.nativeEvent.coordinate.longitude,
      latitudeDelta: 0.009,
      longitudeDelta: 0.009,
    });
    setDestLabel("Dropped pin");
    setIsNavigating(false);
    setDistance(null);
    setDuration(null);
  }, []);

  const clearDestination = () => {
    setDestination(null);
    setDestLabel("");
    setIsNavigating(false);
    setDistance(null);
    setDuration(null);
    
    placesRef.current?.setAddressText('');
  };

  const formatDuration = (mins) => {
    if (mins < 60) return `${Math.ceil(mins)} min`;
    return `${Math.floor(mins / 60)}h ${Math.ceil(mins % 60)}m`;
  };

  const handleEndRoom = () => {
    Alert.alert(
      "End Session",
      "This will end the session for every one. Are you sure?",
      [
        {text: "Cancel", style: "cancel"},
        {text: "End",style: "destructive", onPress: async () => {
          await endRoom(roomId);
          channelRef.current?.unsubscribe();
          navigation.navigate("locationScreen",{userId} );
        }
      }
      ]
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* ── Full-screen map ── */}
      {region && (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onPoiClick={handleMapClick}
          onLongPress={handleMapClick}
          showsCompass={false}
          showsTraffic={false}
        >
          {/* Directions */}
          {destination && (
            <>
              <Marker coordinate={destination}>
                <View style={styles.destMarker}>
                  <MaterialCommunityIcon name="map-marker" size={25} color="red" />
                </View>
              </Marker>
              <MapViewDirections
                origin={region}
                destination={destination}
                apikey={GOOGLE_API_KEY}
                strokeWidth={5}
                strokeColor="#00C6FF"
                onReady={(result) => {
                  setDistance(result.distance);
                  setDuration(result.duration);
                  mapRef.current?.fitToCoordinates(result.coordinates, {
                    edgePadding: { right: 60, bottom: 240, left: 60, top: 160 },
                    animated: true,
                  });
                }}
              />
            </>
          )}

          {/* Destination pin (not navigating yet) */}
          {destination && !isNavigating && (
            <Marker coordinate={destination}>
              <View style={styles.destMarker}>
                <MaterialCommunityIcon name="map-marker" size={25} color="red" />
              </View>
            </Marker>
          )}

          {/* Own position */}
          <Marker
            coordinate={{ latitude: region.latitude, longitude: region.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={region.heading ?? 0}
            flat
          >
            <View style={styles.ownMarker}>
              <View style={styles.ownMarkerInner} />
            </View>
          </Marker>

          {/* Room members */}
          {Object.entries(members).map(([uid, pos]) => (
            <Marker
              key={uid}
              coordinate={{ latitude: pos.latitude, longitude: pos.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
              rotation={pos.heading ?? 0}
              flat
            >
              <View style={styles.memberMarker}>
                <MaterialCommunityIcon name="car" size={16} color="#000" />
              </View>
            </Marker>
          ))}
        </MapView>
      )}

      {/* ── TOP BAR ── */}
      {/* zIndex must be very high so the suggestion list floats above the map */}
      <View style={styles.topBar}>

        {/* Google-style search card */}
        <View style={styles.searchCard}>
          <MaterialCommunityIcon
            name="magnify"
            size={22}
            color="#5F6368"
            style={styles.searchIcon}
          />
          <GooglePlacesAutocomplete
            ref={placesRef}
            placeholder="Destination"
            minLength={1}
            fetchDetails={true}
            numberOfResults={5}
            listViewDisplayed="auto"
            onPress={(data, details = null) => {
              if (!details) return;
              const newDest = {
                latitude:      details.geometry.location.lat,
                longitude:     details.geometry.location.lng,
                latitudeDelta: 0.009,
                longitudeDelta: 0.009,
              }
              setDestination(newDest) 
              const label = data.description ?? details.formatted_address      
              setDestLabel(label);
              setIsNavigating(false);
              setDistance(null);
              setDuration(null);

              if(isHost && channelRef.current){
                broadcastDestination(channelRef.current,userId,newDest,label)
              }
            }}
            query={{
              key:      GOOGLE_API_KEY,
              language: "en",
              location: region ? `${region.latitude},${region.longitude}` : undefined,
              radius:   region ? 5000 : undefined,
            }}
            GooglePlacesSearchQuery={{ rankby: "distance" }}
            enablePoweredByContainer={false}
            keyboardShouldPersistTaps="handled"
            styles={{
              container: {
                flex: 1,
                // Allow the list to overflow the card's height
                overflow: "visible",
              },
              textInputContainer: {
                backgroundColor: "transparent",
                borderTopWidth: 0,
                borderBottomWidth: 0,
                height: 48,
              },
              textInput: {
                height: 48,
                backgroundColor: "transparent",
                fontSize: 16,
                color: "#202124",
                paddingHorizontal: 0,
                marginLeft: 0,
                marginRight: 0,
              },
              listView: {
                // Position absolute so it breaks OUT of the card's height
                position: "absolute",
                top: 52,
                left: -44,   // compensate for the magnify icon + padding
                right: -50,  // compensate for the group button
                backgroundColor: "#fff",
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.13,
                shadowRadius: 16,
                elevation: 10,
                zIndex: 9999,
                overflow: "hidden",
              },
              row: {
                paddingVertical: 0,
                paddingHorizontal: 0,
                backgroundColor: "transparent",
              },
              separator: { height: 0 },
              powered:   { display: "none" },
            }}
            renderRow={(rowData) => (
              <View style={styles.suggestionRow}>
                {/* DriveMates branded icon */}
                <View style={styles.suggestionIconBox}>
                  <MaterialCommunityIcon name="car" size={17} color="#00C6FF" />
                </View>
                <View style={styles.suggestionTexts}>
                  <Text style={styles.suggestionMain} numberOfLines={1}>
                    {rowData.structured_formatting?.main_text ?? rowData.description}
                  </Text>
                  {rowData.structured_formatting?.secondary_text ? (
                    <Text style={styles.suggestionSub} numberOfLines={1}>
                      {rowData.structured_formatting.secondary_text}
                    </Text>
                  ) : null}
                </View>
                <MaterialCommunityIcon name="chevron-right" size={18} color="#C4C7CC" />
              </View>
            )}
          />

          {/* Group button */}
          {roomId ? 
            <TouchaleOpacity
              style={styles.groupButton}
              onPress={()=> leaveRoom(roomId,userId)}
            >
              <MaterialCommunityIcon 
                name="door-open"
                size={22}
                color="#EA4335"        
              />
              <Text>Leave Room</Text>

            </TouchaleOpacity> 
            : 
            <TouchableOpacity
            style={styles.groupButton}
            onPress={() => navigation.navigate("CreateRoom")}
            >
            <MaterialCommunityIcon
              name={roomId ? "account-group" : "account-multiple-plus-outline"}
              size={22}
              color={roomId ? "#00C6FF" : "#5F6368"}
              />
            </TouchableOpacity>
            }
            {/* End room button, only visible to host */}

            {roomId && isHost && (
              <TouchableOpacity
              style = {styles.endRoomButton}
              onPress = {handleEndRoom}>

                <MaterialCommunityIcon
                  name="door-open"   
                  size={22}
                  color="#EA4335"  />

                  <Text style={styles.endRoomButtonText}>End</Text>
                
              </TouchableOpacity>
            )}
        </View>

        {/* Room badge — shown when inside a room */}
        {roomId && (
          <TouchableOpacity
           style={styles.roomBadge}
           onPress = {() => 
            Alert.alert(
              groupName ?? "Your Room",
              `Room Code : ${roomCode} \n\n Share this with your group to let them join.`
            )
           }>
            <View style={styles.roomBadgeDot} />
            <Text style={styles.roomBadgeText}>
              {groupName ?? roomCode}
            </Text>
            <Text style={styles.roomBadgeSep}>·</Text>
            <Text style={styles.roomBadgeCount}>
              {memberCount +1} online
            </Text>
            <MaterialCommunityIcon name = "information-outline" size={16} color="#70757A" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── RIGHT FAB COLUMN ── */}
      <View style={styles.fabColumn}>
        {/* Re-centre on my location */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (region) mapRef.current?.animateToRegion(region, 600);
          }}
        >
          <MaterialCommunityIcon name="crosshairs-gps" size={22} color="#1A1F2B" />
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM SHEET ── */}
      {destination && (
        <View style={styles.bottomSheet}>

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
                onPress={() => {setIsNavigating(true)}}
              >
                <MaterialCommunityIcon name="navigation" size={20} color="#fff" />
                <Text style={styles.navigateButtonText}>Navigate</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.stopButton}
                onPress={() => {
                  setIsNavigating(false)
                  
                  // placesRef.current?.setAddressText('');
                }}
              >
                <MaterialCommunityIcon name="stop-circle-outline" size={20} color="#fff" />
                <Text style={styles.navigateButtonText}>Stop</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* ── LOADING OVERLAY ── */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <MaterialCommunityIcon name="map-marker-radius" size={32} color="#00C6FF" />
            <Text style={styles.loadingTitle}>Finding your location</Text>
            <Text style={styles.loadingSubtitle}>This will only take a moment</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8EAF0" },

  // ── Top bar ──
  topBar: {
    position: "absolute",
    top: STATUS_BAR_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 8,
    zIndex: 999,          // float above map
  },

  // Google-style search card
  searchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    overflow: "visible",  // let the dropdown escape the card height
    zIndex: 999,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInputWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  groupButton: {
    padding: 6,
    marginLeft: 4,
  },

  // ── Suggestion rows ──
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F4",
    gap: 12,
  },
  suggestionIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E8F5FF",
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionTexts: {
    flex: 1,
  },
  suggestionMain: {
    fontSize: 14,
    fontWeight: "500",
    color: "#202124",
  },
  suggestionSub: {
    fontSize: 12,
    color: "#70757A",
    marginTop: 2,
  },

  // Room badge below search
  roomBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginLeft: 4,
  },
  roomBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34A853",
  },
  roomBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#202124",
  },
  roomBadgeSep: {
    color: "#9AA0A6",
    fontSize: 13,
  },
  roomBadgeCount: {
    fontSize: 13,
    color: "#70757A",
  },

  // ── FAB column ──
  fabColumn: {
    position: "absolute",
    right: 14,
    bottom: 200,
    gap: 10,
  },
  fab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // ── Markers ──
  ownMarker: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 122, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  ownMarkerInner: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#007AFF",
    borderWidth: 2,
    borderColor: "#fff",
  },
  memberMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  destMarker: {
    width: 38,
    height: 38,
    borderRadius: 19,
    // backgroundColor: "#",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  // end room
  endRoomButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 6,
  gap: 4,
  marginLeft: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
},
endRoomText: {
  color: "#EA4335",
  fontSize: 12,
  fontWeight: "700",
},

  // ── Bottom sheet ──
  bottomSheet: {
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

  // ── Loading ──
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