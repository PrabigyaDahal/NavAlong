import react from "react";
import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {styles} from "../styles/style"; // Assuming you have a styles.js file
import { LinearGradient } from "expo-linear-gradient";

import { generateOtp } from "../api/api";

export default function CreateRoom() {
    const [generatedOtp, setGeneratedOtp] = useState("");

    const handleGenerateOtp = async () => {
        try{
            const otp = await generateOtp();
            setGeneratedOtp(otp);
        }catch (error) {
            console.error("Error generating OTP:", error);
            // Handle error appropriately, e.g., show an alert
        }
    }

    return (
        <LinearGradient
            colors={["#00C6FF","#1A1F2B"]} 
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >

            <MaterialCommunityIcons 
                name="motorbike" 
                size={70} 
                color="black"
                style ={styles.icon} 
            />

            <Text style={styles.text}>Group Name</Text>

            <TextInput
                style={styles.textArea}
                placeholder="Group name"
                multiline={true}
                numberOfLines={1}
            />

            <TouchableOpacity style={styles.button}>
                <Text 
                    style={styles.buttonText}
                    onPress={handleGenerateOtp}
                >Generate OTP
                </Text> 
            </TouchableOpacity>

            <View>
                { generatedOtp && 
                <Text
                    style={styles.text}>
                    {generatedOtp.split("").map((digit) => (
                        <Text style={styles.digit}> {digit} </Text>
                    ))}
                </Text>
                }
            </View>

            <View>
                {generatedOtp && 
                    <TouchableOpacity 
                        style={styles.button}
                        onPress={() => console.log("Create Room Pressed")}
                    >
                        <Text style={styles.buttonText}>Create Room</Text>
                    </TouchableOpacity>
                }
            </View>

            

        </LinearGradient>
    )
}
