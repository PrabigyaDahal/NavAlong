
import { View, Text, TouchableOpacity,  } from "react-native";
import {styles} from "../styles/style.js"; // Assuming you have a styles.js file
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from "expo-linear-gradient";
import AnimatedComponent from "../animation/AnimatedComponent.js";

export default function Login({ navigation }) {
    return (
        <LinearGradient 
            style={styles.container}
            colors={["#1A1F2B", "#00C6FF"]}
        >
            <Text style={styles.title}>DriveMates</Text>
            
            <MaterialCommunityIcons
                name="car"
                size={70}
                color="black"
                style={styles.icon} />
            <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate("CreateRoom")}
            >
                <Text style={styles.buttonText}>Create Room</Text>
            </TouchableOpacity>
             <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate("joinRoom")}
            >
                <Text style={styles.buttonText}>Join Room</Text>
            </TouchableOpacity>
            
        </LinearGradient>
    );
}
