import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { RootStackParamList } from '../../types';
import { COLORS } from '../../constants';
import { registerForPushNotifications } from '../../services/notifications';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
  route: RouteProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation, route }: Props) {
  const { role } = route.params;
  const isArtisan = role === 'artisan';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
  if (!name || !email || !phone || !password) {
    Alert.alert('Error', 'Please fill in all fields');
    return;
  }
  if (password.length < 6) {
    Alert.alert('Error', 'Password must be at least 6 characters');
    return;
  }

  setLoading(true);

  const timeout = setTimeout(() => {
    setLoading(false);
    Alert.alert('Timeout', 'Request timed out. Check your internet connection.');
  }, 40000);

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, 'users', uid), {
      uid,
      name,
      email,
      phone,
      role,
      createdAt: new Date(),
    });

    if (isArtisan) {
      await setDoc(doc(db, 'artisans', uid), {
        uid,
        name,
        phone,
        trade: '',
        bio: '',
        location: { latitude: 0, longitude: 0, address: '' },
        photos: [],
        profilePhoto: '',
        rating: 0,
        totalReviews: 0,
        available: true,
        verified: false,
        createdAt: new Date(),
      });
    }

    registerForPushNotifications(uid);
    clearTimeout(timeout);

    // Navigate directly to the right tab
    if (isArtisan) {
      navigation.reset({ index: 0, routes: [{ name: 'ArtisanTabs' }] });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'CustomerTabs' }] });
    }
  } catch (error: any) {
    clearTimeout(timeout);
    setLoading(false);
    Alert.alert('Registration Failed', `${error.code}: ${error.message}`);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {isArtisan ? '🔨 Join as Fundi' : '🙋 Join as Customer'}
          </Text>
          <Text style={styles.subtitle}>
            {isArtisan
              ? 'Create your profile and start getting hired'
              : 'Find skilled fundis near you'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. John Kamau"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. john@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 0712345678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
  },
  backButton: {
    marginTop: 16,
  },
  backText: {
    color: COLORS.primary,
    fontSize: 16,
  },
  header: {
    marginTop: 24,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.subtext,
    marginTop: 8,
  },
  form: {
    gap: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingBottom: 40,
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