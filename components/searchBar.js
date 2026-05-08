import { 
    View,
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Alert,
    Platform,
    StatusBar
} from "react-native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { leaveRoom, endRoom, broadcastDestination } from "../lib/roomService";
import { createRoom } from "../lib/roomService";

const STAT_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight ?? 24 : 50;;

export  function SearchBar({
    navigation,
    region,
    route,
    isNavigating,
    setDestination,
    setDestLabel,
    setNavigating,
    setIsNavigating,
    setDistance,
    setDuration,
    channelRef,
    placesRef,
}
){
    const GOOGLE_API_KEY = "AIzaSyB_FcPTryxK-i6Tw3AXaQNRhQJdsJeN7cM";
    
    const { roomId, roomCode, userId, groupName, isHost } = route?.params ?? {};
   
    const handleEndRoom = () => {
        Alert.alert(
          "End Session",
          "This will end the session for every one. Are you sure?",
          [
            {text: "Cancel", style: "cancel"},
            {text: "End",style: "destructive", onPress: async () => {
              await endRoom(roomId);
              channelRef.current?.unsubscribe();
              navigation.goBack();
            }
          }
          ]
        );
    };
    return (
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
                    textInputProps={{
                      editable : roomId ? isHost ? true : false : true
                    }}
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
                      setNavigating(false);
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
                        right: isNavigating ? -100 : -40,  // compensate for the group button
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
                    renderRow={(rowData) => 
                       (
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
                      </View>) 
                    }
                  />
                  
        
                  {/* Group button */}
                  {roomId && !isHost ? 
                    <TouchableOpacity
                      style={styles.endRoomButton}
                      onPress={async()=> {
                        await leaveRoom(roomId,userId);
                        channelRef.current?.unsubscribe();
                        navigation.goBack();
                      }}
                    >
                      <MaterialCommunityIcon 
                        name="door-open"
                        size={22}
                        color="#EA4335"        
                      />
                      <Text>Leave Room</Text>
        
                    </TouchableOpacity> 
                    : 
                     !roomId && <TouchableOpacity
                    style={styles.groupButton}
                    onPress={() => navigation.navigate("CreateRoom")}
                    >
                    <MaterialCommunityIcon
                      name={roomId ? "account-group" : "account-multiple-plus-outline"}
                      size={22}
                      color={roomId ? "#00C6FF" : "#5F6368"}
                      />
                    </TouchableOpacity>}
                    
        
                    {/* End room button, only visible to host */}
        
                    {roomId && isHost && (
                      <TouchableOpacity
                      style = {styles.endRoomButton}
                      onPress = {handleEndRoom}>
        
                        <MaterialCommunityIcon
                          name="door-open"   
                          size={22}
                          color="#EA4335"  />
        
                          <Text style={styles.endRoomText}>End</Text>
                        
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
        
    );
}

const styles = StyleSheet.create({
    topBar: {
    position: "absolute",
    top: STAT_HEIGHT,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    gap: 8,
    zIndex: 999,          // float above map
  },

  // Search Bar
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
    overflow: "visible",  // lets the dropdown escape the card height
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

  //Suggested places row
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
});