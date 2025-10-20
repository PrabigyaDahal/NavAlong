
import React, { useState, useEffect,useRef } from "react";
import { StyleSheet, View, Alert ,Text} from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import polyline from "@mapbox/polyline";

const UserID = "JohnSmith";

export default function LocationScreen() {
    const [location, setLocation] = useState();
    const [destination, setDestination] = useState(null);
    const [route, setRoute] = useState([]);

    useEffect(() => {
        
        (async () => {
            //requesting location permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission to access location was denied");
                return;
            }
            //getting initial location 
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc.coords);

            
        })();
    }, []);

    useEffect(() => {
        if (location && destination) {
            getDirections(location, destination);
        }
    },[destination])

    const getDirections = async(origin,dest) => {
        const originString = `${origin.latitude},${origin.longitude}`;
        const destString = `${dest.latitude},${dest.longitude}`;    
       try {
        // Fetch directions from Google Directions API
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/directions/json?origin=${originString}&destination=${destString}&key=AIzaSyBiwb17DJjc3LFgUOtSgJMaUhNfqc4xcoA`
            );
            const data = await response.json();

            if (!data.routes || data.routes.length === 0) {
                console.warn("No routes found",data);
                Alert.alert("No routes found","Please try different locations.");
                return;
            }

            const encoded = data.routes[0]?.overview_polyline?.points;
            if(!encoded) {
                console.warn("No encoded points found in response",data.routes[0]);
                Alert.alert("No route found","Please try different locations.");
                return;
            }
            const points = polyline.decode(encoded);
            const coords = points.map(([lat,lng]) => ({
                latitude: lat,
                longitude: lng,
            }));
            setRoute(coords);
        } catch (error) {
        console.error("Error fetching directions:", error);
        Alert.alert("Error fetching directions", "Please try again later.");
    }
}

   return (
    <View style = {styles.container}>
        <GooglePlacesAutocomplete
            placeholder="Search"
            fetchDetails={true}
            onFail={(error) => {
                console.error("Google Places Autocomplete error:", error);} }
            onPress={(data, details = null) => {
                if (!details || !details.geometry || !details.geometry.location) {
                    Alert.alert("Location not found", "Please select a valid location.");
                    return;
                }
                const loc =details.geometry.location;
                setDestination({
                    latitude: loc.lat,
                    longitude: loc.lng,
                });
            }}
            query={{
                key: "AIzaSyBiwb17DJjc3LFgUOtSgJMaUhNfqc4xcoA",
                language: "en",
            }}
            styles={{
                container: {
                    position: "absolute",
                    top: 10,
                    width: "100%",
                    zIndex: 1,
                },
                textInput: {
                    backgroundColor:"#fff",
                    height: 44,
                },
            }}
        />
        {location ? (
            <MapView
                style = {styles.map}
                region = {{
                   latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            >
                <Marker
                    coordinate={location}
                    title={UserID}
                    description="Your Location"
                    pinColor="red"
                />
                {destination && <Marker coordinate={destination} title="Destination"/>}
                {route.length > 0 && <Polyline coordinates={route} strokeColor="black" strokeWidth={4} />}
            </MapView>
        ) : <Text>Location lodaing...</Text>}
    </View>
   );
}

const styles = StyleSheet.create({
    container: {flex :1},
    map: {flex : 1},
    loadingText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 18,
    },
});