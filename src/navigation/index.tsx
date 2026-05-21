import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import { RootStackParamList, CustomerTabParamList, ArtisanTabParamList } from '../types';
import { COLORS } from '../constants';

// Auth Screens (placeholders for now)
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Customer Screens (placeholders for now)
import HomeScreen from '../screens/customer/HomeScreen';
import SearchScreen from '../screens/customer/SearchScreen';
import MyBookingsScreen from '../screens/customer/MyBookingsScreen';
import ArtisanDetailScreen from '../screens/customer/ArtisanDetailScreen';
import BookingScreen from '../screens/customer/BookingScreen';

// Artisan Screens (placeholders for now)
import DashboardScreen from '../screens/artisan/DashboardScreen';
import ArtisanBookingsScreen from '../screens/artisan/ArtisanBookingsScreen';
import EditProfileScreen from '../screens/artisan/EditProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const CustomerTab = createBottomTabNavigator<CustomerTabParamList>();
const ArtisanTab = createBottomTabNavigator<ArtisanTabParamList>();

function CustomerTabs() {
  return (
    <CustomerTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarStyle: { backgroundColor: COLORS.white },
        headerShown: false,
      }}
    >
      <CustomerTab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color }}>🏠</Text> }}
      />
      <CustomerTab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Search', tabBarIcon: ({ color }) => <Text style={{ color }}>🔍</Text> }}
      />
      <CustomerTab.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{ tabBarLabel: 'Bookings', tabBarIcon: ({ color }) => <Text style={{ color }}>📋</Text> }}
      />
    </CustomerTab.Navigator>
  );
}

function ArtisanTabs() {
  return (
    <ArtisanTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.subtext,
        tabBarStyle: { backgroundColor: COLORS.white },
        headerShown: false,
      }}
    >
      <ArtisanTab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ color }) => <Text style={{ color }}>📊</Text> }}
      />
      <ArtisanTab.Screen
        name="Bookings"
        component={ArtisanBookingsScreen}
        options={{ tabBarLabel: 'Bookings', tabBarIcon: ({ color }) => <Text style={{ color }}>📋</Text> }}
      />
      <ArtisanTab.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color }}>👤</Text> }}
      />
    </ArtisanTab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="CustomerTabs" component={CustomerTabs} />
        <Stack.Screen name="ArtisanTabs" component={ArtisanTabs} />
        <Stack.Screen name="ArtisanDetail" component={ArtisanDetailScreen} />
        <Stack.Screen name="BookingScreen" component={BookingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}