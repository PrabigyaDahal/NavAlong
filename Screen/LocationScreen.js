import * as Location from 'expo-location';
import { useEffect, useState,useRef } from 'react';
import { StyleSheet, View,Image,TouchableOpacity,Modal } from 'react-native';
import MaterialCommunityIcon from '@expo/vector-icons/MaterialCommunityIcons';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import MapView, { Marker, Region } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
// import * as Speech from 'expo-speech';
import CreateRoom from './CreateRoom';
import Constants from 'expo-constants';

const GOOGLE_MAPS_API_KEY = Constants.expoConfig.googMapApiKey;


export default function HomeScreen() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [destination, setDestination] = useState(null);
  const [isLoading,setIsLoading] = useState(true);
  const[isModalVisible,setIsModalVisible] = useState(false);
  const mapRef = useRef(null);
  const [isnavigating,setIsNavigating] = useState(false);
  const [distance,setDistance] = useState(null);
  const [duration,setDuration] = useState(null);

  useEffect(()=> {
    async function getLocation(){ 
      let {status} = await Location.requestForegroundPermissionsAsync();
      if(status !== 'granted'){
        setErrorMsg("Permission to access location was denied");
        return;
      }
       let loc = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 1,
        },(position) => {
          setLocation(position);
          setIsLoading(false);
        }
      );
    }
    getLocation();
  },[]);
  let region = location
  ?{
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.009,
      longitudeDelta: 0.009,
      heading: location.coords.heading
  }
  : undefined;
  function handleFetchPlace(place){
    setDestination({
      latitude: place.details.location.latitude,
      longitude: place.details.location.longitude,
      latitudeDelta: 0.009,
      longitudeDelta: 0.009,  
    })
  }
  function handleMapCick(place){
    setDestination({
      latitude: place.nativeEvent.coordinate.latitude,
      longitude: place.nativeEvent.coordinate.longitude,
      latitudeDelta: 0.009,
      longitudeDelta: 0.009,
    })
  }
  
  return (
    <View style={styles.container}>
      {region && 
        <MapView 
        ref={mapRef}
        style={styles.map} 
        initialRegion ={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPoiClick= {(place) => handleMapCick(place)}
        mapPadding={{
          top:650,
          left:0,
          right:0,
          bottom:0,
        }}
        >
          {destination && isnavigating && (
            <>
              <Marker 
                coordinate={destination}
                title='destination'
              />     
              <MapViewDirections
                origin={region}
                destination={destination}
                apikey={GOOGLE_MAPS_API_KEY}
                strokeWidth={8}
                strokeColor="blue"
                onReady={result => {
                  setDistance(result.distance);
                  setDuration(result.duration);

                  mapRef.current.fitToCoordinates(result.coordinates,{
                    edgePadding:{
                      right:50,
                      bottom:50,
                      left:50,
                      top:50},
                    animated:true,
                  });
                  // Speech.speak(`Distance to destination is ${result.distance} kilometers and estimated time of arrival is ${Math.ceil(result.duration)} minutes`);
                }}
                />      
            </>
              
          )}

          <Marker
              coordinate={{
              latitude: region.latitude,
              longitude: region.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={region.heading}
            flat
          >
            <Image
              style={{ width: 40, height: 40 }}
              // source={require('../assets/icon.png')}
            />
          </Marker>
        </MapView>
       
      }
      { region &&
      <View style={styles.searchBox}>
        <GooglePlacesTextInput 
            style={styles.searchBar}
            apiKey={GOOGLE_MAPS_API_KEY}
            placeHolderText='Search destination...'
            fetchDetails={true}
            detailsFields={['formattedAddress','location','viewport','photos']}
            onPlaceSelect={(place) => handleFetchPlace(place)}
            
            locationBias ={{
              circle:{
                center:{
                  latitude: region.latitude,
                  longitude: region.longitude,  
                },
                radius : 500.0
              }
            }} 
        />
        {destination && <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
        >
          <MaterialCommunityIcon 
            name="account-multiple-plus" 
            size={30} 
            color="white"
            style ={styles.icon} 
          />
        </TouchableOpacity> 
        }
        {destination && !isnavigating && (
          <TouchableOpacity
            style = {styles.startButton}
            onPress={() => setIsNavigating(true) }
          >
            <MaterialCommunityIcon name="navigation" size={30} color="blue" />
          </TouchableOpacity>
        )}
      </View>
    } 
     <Modal
            animationType="fade"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => {
              setIsModalVisible(!isModalVisible);
            }}
            
      >
        <View style={styles.modalOverlay}>
          
            <CreateRoom 
              modalVisible={isModalVisible}
              setModal={setIsModalVisible}
            />
        </View>
      </Modal>
    </View>
);

}

const styles = StyleSheet.create({ 
  map:{
   flex:1,
  },
  container: {
    flex: 1,
  },

 /// CSS for the icon at the top right corner to add or join a room

   icon: {
   position:'absolute',
    right:35,
    top: 10,
    backgroundColor: 'grey',
    padding:5,
    borderRadius:50,
  },
  /// CSS for modal
    modalOverlay: {
    margin: 55,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },


/// CSS for Search bar and its elements
  searchBox: {
    position: 'absolute',
    top: 40,
    left: 20,  
    width: '90%',
    alignSelf: 'center',        
  },
  searchBar:{
    container: {
      position: 'absolute',
      width: '80%',
    },
    input:{
      backgroundColor: 'rgba(128,128,128,0.8)',
      borderRadius: 50,
      borderColor: '#DDD',
      fontSize: 16,
      color:'white',
    },
    placeholder:{
      color:'white',
    },
    suggestionsContainer:{
      backgroundColor: 'white',
      borderRadius: 8,
      marginTop: 2
    },
    suggestionItem:{
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    suggestionText: {
      main: { fontSize: 16, color: 'black' },
      secondary: { fontSize: 14, color: '#555' },
    },
    loadingIndicator: {
      color: '#00C6FF',
    },
  },
  startButton:{
    position:'absolute',
    top:100,
    // alignSelf:'center',
    // backgroundColor:'#007AFF',
    // padding:15,
    // borderRadius:30,
    // elevation:5,
  }
});
