import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, UserRole } from '../../types';
import { COLORS } from '../../constants';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export default function OnboardingScreen({ navigation }: Props) {
  const handleRoleSelect = (role: UserRole) => {
    navigation.navigate('Register', { role });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>🔧 MyFundi</Text>
        <Text style={styles.tagline}>Connect with skilled artisans near you</Text>
      </View>

      {/* Illustration */}
      <View style={styles.illustration}>
        <Text style={styles.illustrationEmoji}>🏗️</Text>
      </View>

      {/* Role Selection */}
      <View style={styles.roleSection}>
        <Text style={styles.roleTitle}>Get started as</Text>

        <TouchableOpacity
          style={[styles.roleCard, styles.customerCard]}
          onPress={() => handleRoleSelect('customer')}
        >
          <Text style={styles.roleEmoji}>🙋</Text>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleCardTitle}>Customer</Text>
            <Text style={styles.roleCardSubtitle}>Find and hire skilled fundis near you</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, styles.artisanCard]}
          onPress={() => handleRoleSelect('artisan')}
        >
          <Text style={styles.roleEmoji}>🔨</Text>
          <View style={styles.roleTextContainer}>
            <Text style={styles.roleCardTitle}>Fundi</Text>
            <Text style={styles.roleCardSubtitle}>Offer your skills and get hired</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Login Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 60,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.subtext,
    marginTop: 8,
    textAlign: 'center',
  },
  illustration: {
    alignItems: 'center',
    marginVertical: 40,
  },
  illustrationEmoji: {
    fontSize: 100,
  },
  roleSection: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customerCard: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  artisanCard: {
    backgroundColor: COLORS.white,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary,
  },
  roleEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  roleCardSubtitle: {
    fontSize: 13,
    color: COLORS.subtext,
    marginTop: 4,
  },
  arrow: {
    fontSize: 20,
    color: COLORS.subtext,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  loginText: {
    color: COLORS.subtext,
    fontSize: 14,
  },
  loginLink: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
});