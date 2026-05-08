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
  Write_To_DB_Interval,
  leaveRoom,
  broadcastDestination
} from "../lib/roomService";
import {NavigationPanal} from "../components/navigationPanal";
import { SearchBar } from "../components/searchBar";
import { Loading } from "../components/loading";
import { MemberMarker } from "../components/memberMarker";
import { DestinationPanal } from "../components/destinationPanal";

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

  //state for navigationPanal
  const [steps, setSteps] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);

  const channelRef = useRef(null);
  const mapRef     = useRef(null);
  const placesRef = useRef(null);
  const isNavigatingRef = useRef(false);

  const setNavigating = (val) => {
    isNavigatingRef.current = val;
    setIsNavigating(val);
  }

  
  // ── 1. GPS watch ──────────────────────────────────────────────────────────
  useEffect(() => {
    let watcher;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setIsLoading(false); return; }
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 1 },
        (pos) => { 
          setLocation(pos);
          setIsLoading(false);
          
          // adding navigation mode
          if(isNavigatingRef.current){
            animateDriving(pos.coords);

            setSteps((currentSteps) => {
              setStepIndex((currentIndex) => {
                if(currentIndex >= currentIndex.length -1) return currentIndex;

                const nextStep = currentSteps[currentIndex];
                if(!nextStep) return currentIndex;

                const stepLat = nextStep.end_location.lat;
                const stepLng = nextStep.end_location.lng;

                const dLat = Math.abs(pos.coords.latitude - stepLat);
                const dLng = Math.abs(pos.coords.longitude - stepLng);

                if(dLat < 0.003 && dLng < 0.003) return currentIndex +1;

                return currentIndex;
              });
              return currentSteps;
            });
          }
         }
      );
    })();
    return () => watcher?.remove();
  }, []);

  // ── 2. Realtime room channel ───────────────────────────────────────────────
  useEffect(() => {
    
    if (!roomId || !userId){
      
      return;
    } 
    
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
    },
    (destPayLoad) => {
      setDestination({
        latitude:      destPayLoad.latitude,
        longitude:     destPayLoad.longitude,
        latitudeDelta: 0.009,
        longitudeDelta: 0.009, 
      });
      setDestLabel(destPayLoad.destLabel ?? "Group destination");
    }
  );
    channelRef.current = channel;
    return () => channel.unsubscribe();
  }, [roomId, userId]);

  // ── 3. Broadcast + DB persist ──────────────────────────────────────────────
  useEffect(() => {
    
    if (!channelRef.current || !location) return;
    broadcastLocation(channelRef.current, userId, location.coords);
    saveLocation(userId, location.coords);

    const broadcastTimer = setInterval(() => {
      if (channelRef.current && location)
        broadcastLocation(channelRef.current, userId, location.coords);
    }, BROADCAST_INTERVAL_MS);

    const dbTimer = setInterval(() => {
      if (location) saveLocation(userId, location.coords);
    }, Write_To_DB_Interval);

    return () => { clearInterval(broadcastTimer); clearInterval(dbTimer); };
  }, [location, userId]);


  const region = location ? {
    latitude:      location.coords.latitude,
    longitude:     location.coords.longitude,
    pitch:         45,
    zoom:          16,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
    heading:       location.coords.heading,
  } : undefined;

  const memberCount = Object.keys(members).length  ;

  const handleMapClick = useCallback((e) => {
    setDestination({
      latitude:      e.nativeEvent.coordinate.latitude,
      longitude:     e.nativeEvent.coordinate.longitude,
      latitudeDelta: 0.009,
      longitudeDelta: 0.009,
    });
    setDestLabel(e.nativeEvent.name ?? "Dropped pin");
    setNavigating(false);
    setDistance(null);
    setDuration(null);
  }, []);

  const handleOnDirectionReady = (result) => {
    setDistance(result.distance);
    setDuration(result.duration);
    setSteps(result.legs[0].steps ?? []);
    setStepIndex(0);
    if(!isNavigating){
      mapRef.current?.fitToCoordinates(result.coordinates, {
      edgePadding: { right: 60, bottom: 240, left: 60, top: 160 },
      animated: true,
      });
    }
  };

  const formatDuration = (mins) => {
    if (mins < 60) return `${Math.ceil(mins)} min`;
    return `${Math.floor(mins / 60)}h ${Math.ceil(mins % 60)}m`;
  };

  const animateDriving = (coords) => {
    if (!mapRef.current || !coords) return;
    mapRef.current.animateCamera({
      center: {
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
      heading: coords.heading ?? 0,
      pitch: 45,
      zoom: 18,
    },{duration: 300})
  }

  return (
    <View style={styles.container}>

      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Loading Screen to load before fetching user location */}

      {isLoading && <Loading />}  

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
                onReady={handleOnDirectionReady(result) }
              />
            </>
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
          <MemberMarker members={members} />

        </MapView>
      )}

      {/* -- Search Bar --*/}
      <SearchBar 
        navigation = {navigation}
        region={region}
        route={route}
        isNavigating={isNavigating}
        setDestination={setDestination}
        setDestLabel={setDestLabel}
        setNavigating={setNavigating}
        setIsNavigating={setIsNavigating}
        setDistance={setDistance}
        setDuration={setDuration}
        channelRef={channelRef}
        placesRef={placesRef}
      />

      {/* Re-centre on my location */}
      <View style={styles.recenterLocationButton}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            if (region) mapRef.current?.animateToRegion(region, 300);
          }}
        >
          <MaterialCommunityIcon name="crosshairs-gps" size={22} color="#1A1F2B" />
        </TouchableOpacity>
      </View>

      {/* -- Bottom Destination Panel -- */}
      {destination && <DestinationPanal
        destLabel={destLabel}
        setDestLabel={setDestLabel}
        setDestination={setDestination}
        distance={distance}
        setDistance={setDistance}
        duration={duration}
        setDuration={setDuration}
        isNavigating ={isNavigating}
        setNavigating={setNavigating}
        location = {location}
        animateDriving = {animateDriving}
        setSteps={setSteps}
        setStepIndex={setStepIndex}
        formatDuration={formatDuration}
        mapRef={mapRef}
        placesRef={placesRef}
      />}

      {/* Needs UI changes for navifaation panal
       {isNavigating && steps.length > 0 && (
        <NavigationPanal 
          currentStep = {steps[stepIndex]}
          nextStep = {steps[stepIndex +1]}
          totalStep={steps.length}
          stepIndex={stepIndex}
        />
      )} */}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#E8EAF0" },

  // Recenter location button
  recenterLocationButton: {
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
});