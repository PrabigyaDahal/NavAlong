import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import Login from './Screen/Login.js';
import CreateRoom from './Screen/CreateRoom.js';
import LocationScreen from './Screen/LocationScreen.js';
import { LinearGradient } from 'expo-linear-gradient';

const Stack = createNativeStackNavigator();

function AppHeader(){
  return(
    <Text>
      DriveMates
    </Text>
  );
};
function NavHeader(){
  return(
    <LinearGradient
      colors={["#1A1F2B","#00C6FF"]}
      style={{ flex : 5}}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    />
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Login"
        screenOptions={{
            headerBackground: () => <NavHeader />,
            headerTitle:  <AppHeader />,
            headerTintColor: "#FFFFFF",
            headerShown: false,
            headerTitleAlign: "center",
          }}
      >
        <Stack.Screen
          name="Login" 
          component={Login} 
          
         
         />
        <Stack.Screen 
          name="CreateRoom" 
          component={CreateRoom}
          options={{
            headerShown: true,
            headerTitleAlign: "center",
            headerTintColor: "#FFFFFF",
          }}
                 
        />
        <Stack.Screen 
          name='joinRoom'
          component={LocationScreen}
          options={{
            headerShown: true,
            headerTitleAlign: "center",
            headerTintColor: "#FFFFFF",
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
