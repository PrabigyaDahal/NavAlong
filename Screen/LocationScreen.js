import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { styles } from '../styles/style.js';

export default function LocationScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  <View>
    <MapView style={styles.map}/>
  </View>
    
}
