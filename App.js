import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PaymentsScreen from './src/screens/PaymentsScreen';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator();

// Simple Icon component placeholder since we don't have vector icons working perfectly yet
// Or we can rely on emoji for now if needed, but vector-icons usually works in Expo
import { Ionicons } from '@expo/vector-icons';

export default function App() {
    return (
        <AppProvider>
            <NavigationContainer>
                <Tab.Navigator
                    screenOptions={({ route }) => ({
                        headerShown: false,
                        tabBarIcon: ({ focused, color, size }) => {
                            let iconName;

                            if (route.name === 'Home') {
                                iconName = focused ? 'home' : 'home-outline';
                            } else if (route.name === 'Calendar') {
                                iconName = focused ? 'calendar' : 'calendar-outline';
                            } else if (route.name === 'Payments') {
                                iconName = focused ? 'wallet' : 'wallet-outline';
                            }

                            return <Ionicons name={iconName} size={size} color={color} />;
                        },
                        tabBarActiveTintColor: '#7E57C2', // Purple from screenshot
                        tabBarInactiveTintColor: 'gray',
                        tabBarStyle: { paddingBottom: 5, height: 60 }
                    })}
                >
                    <Tab.Screen name="Home" component={HomeScreen} />
                    <Tab.Screen name="Calendar" component={CalendarScreen} />
                    <Tab.Screen name="Payments" component={PaymentsScreen} />
                </Tab.Navigator>
            </NavigationContainer>
        </AppProvider>
    );
}
