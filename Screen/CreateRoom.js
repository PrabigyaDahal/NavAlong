import react from "react";
import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
// import {styles} from "../styles/style"; // Assuming you have a styles.js file
import { LinearGradient } from "expo-linear-gradient";


import { generateOtp } from "../api/api";

import { supabase } from "../lib/supabase.js";

export default function CreateRoom(props) {
    const [generatedOtp, setGeneratedOtp] = useState("");

    const handleGenerateOtp = async () => {
        try{
            const otp = await generateOtp();
            setGeneratedOtp(otp);
            console.log("Generated OTP:", otp);
        }catch (error) {
            console.error("Error generating OTP:", error);
            // Handle error appropriately, e.g., show an alert
        }
    }
    const handleModalclose = () => {
        props.setModal(false);
    }
    const testConnection = async () => {
        const{data,error} = await supabase
        .from("profiles")
        .select("*")

        console.log("Data:", data);
        console.log("Error:", error);
    }

    return (
        <LinearGradient
            colors={["#00C6FF","#1A1F2B"]} 
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
          { props.modalVisible && <TouchableOpacity
                onPress={handleModalclose}
                style={styles.closeIcon}
            >
                <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    style={styles.closeIcon}
                />
            </TouchableOpacity>}
             <TouchableOpacity
                onPress={testConnection}
                style={styles.closeIcon}    >
                    <Text style={styles.buttonText}>Test Connection</Text>
                </TouchableOpacity>
             <Text style={styles.title}>Create Room</Text>
             
            <TextInput
                style={styles.textArea}
                placeholder="Enter your group name"
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

const styles = StyleSheet.create({
     textArea: {
    height: 50,
    borderColor: '#ccc',
    width: '90%',
    borderWidth: 1,
    padding: 10,
    textAlignVertical: 'top', // aligns text at the top in Android
    borderRadius: 6,
    backgroundColor: '#fff',
    marginLeft: 20, 
    marginTop: 10,
  },
  button: {
        backgroundColor: "#00C6FF",
        color: "white",
        borderRadius: 10,
        marginTop: 40,
        width: 200,
        alignSelf: "center",
},
buttonText: {
    color: "white",
    fontSize: 20,
    padding: 10,
    textAlign: "center",
    width: 200,
},  
closeIcon: {
    position:"right",
    justifyContent:"right",
    alignSelf: "flex-start",
    margin: 20,
    color: "#FFFFFF",
},
});