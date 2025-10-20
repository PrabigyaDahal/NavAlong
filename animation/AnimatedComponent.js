import react, { useState, useEffect, useRef } from "react";
import { Animated, StyleSheet, View, Text, ImageBackground, Dimensions} from "react-native";
import { styles } from "../styles/style";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get("window");



export default function AnimatedComponent() {
    const carAnimation = useRef(new Animated.Value(0)).current;

     

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(carAnimation, {
                    toValue: 100,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(carAnimation, {
                    toValue: -100,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(carAnimation, {
                    toValue: 0,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return(
        <Animated.Image
            resizeMode = "contain"
            source={require("../assets/car.jpg")} // Replace with your car image path
            style={[
                ,
                styles.car,
                {
                    transform: [{ translateX: carAnimation }],
                },
            ]}
                    
        />   
    )

};