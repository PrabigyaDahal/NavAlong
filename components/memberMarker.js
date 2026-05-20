import {View,StyleSheet} from "react-native";
import MaterialCommunityIcon from "@expo/vector-icons/MaterialCommunityIcons";
import { Marker } from "react-native-maps";

export function MemberMarker({members}){
    return Object.entries(members).map(([uid, pos]) => (
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
        ));
    
};
const styles = StyleSheet.create({
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
});