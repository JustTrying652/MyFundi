import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '../../services/firebase';
import { COLORS, TRADES } from '../../constants';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [available, setAvailable] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string>('');
  const [workPhotos, setWorkPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingWork, setUploadingWork] = useState(false);
  const [showTradePicker, setShowTradePicker] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const docSnap = await getDoc(doc(db, 'artisans', uid));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || '');
        setTrade(data.trade || '');
        setBio(data.bio || '');
        setPhone(data.phone || '');
        setAddress(data.location?.address || '');
        setAvailable(data.available ?? true);
        setProfilePhoto(data.profilePhoto || '');
        setWorkPhotos(data.photos || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadProfilePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) return;

    setUploadingProfile(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const storageRef = ref(storage, `artisans/${uid}/profile.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      setProfilePhoto(downloadURL);
      await updateDoc(doc(db, 'artisans', uid), { profilePhoto: downloadURL });
      Alert.alert('Success', 'Profile photo updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploadingProfile(false);
    }
  };

  const pickAndUploadWorkPhoto = async () => {
    if (workPhotos.length >= 4) {
      Alert.alert('Limit reached', 'You can upload a maximum of 4 work photos');
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (result.canceled) return;

    setUploadingWork(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();

      const timestamp = Date.now();
      const storageRef = ref(storage, `artisans/${uid}/work_${timestamp}.jpg`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      const updatedPhotos = [...workPhotos, downloadURL];
      setWorkPhotos(updatedPhotos);
      await updateDoc(doc(db, 'artisans', uid), { photos: updatedPhotos });
      Alert.alert('Success', 'Work photo added!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setUploadingWork(false);
    }
  };

  const removeWorkPhoto = async (index: number) => {
    Alert.alert('Remove Photo', 'Are you sure you want to remove this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const uid = auth.currentUser?.uid;
            if (!uid) return;
            const updatedPhotos = workPhotos.filter((_, i) => i !== index);
            setWorkPhotos(updatedPhotos);
            await updateDoc(doc(db, 'artisans', uid), { photos: updatedPhotos });
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!name || !trade || !phone) {
      Alert.alert('Error', 'Name, trade and phone are required');
      return;
    }
    setSaving(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await updateDoc(doc(db, 'artisans', uid), {
        name,
        trade,
        bio,
        phone,
        available,
        location: { address, latitude: 0, longitude: 0 },
      });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
          <Text style={styles.subtitle}>Complete your profile to get hired</Text>
        </View>

        {/* Profile Photo */}
        <View style={styles.profilePhotoSection}>
          <TouchableOpacity onPress={pickAndUploadProfilePhoto} disabled={uploadingProfile}>
            <View style={styles.profilePhotoContainer}>
              {profilePhoto ? (
                <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.profilePhotoPlaceholder}>
                  <Text style={styles.profilePhotoEmoji}>📷</Text>
                </View>
              )}
              <View style={styles.profilePhotoBadge}>
                {uploadingProfile ? (
                  <ActivityIndicator color={COLORS.white} size="small" />
                ) : (
                  <Text style={styles.profilePhotoBadgeText}>✏️</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.profilePhotoHint}>Tap to change profile photo</Text>
        </View>

        {/* Availability Toggle */}
        <TouchableOpacity
          style={[styles.availabilityBar, available ? styles.availableOn : styles.availableOff]}
          onPress={() => setAvailable(!available)}
        >
          <Text style={styles.availabilityText}>
            {available ? '🟢 You are Available for Work' : '🔴 You are Unavailable'}
          </Text>
          <Text style={styles.availabilityToggle}>Tap to toggle</Text>
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            autoCapitalize="words"
          />

          <Text style={styles.label}>Phone Number *</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. 0712345678"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Trade / Skill *</Text>
          <TouchableOpacity
            style={styles.tradeSelector}
            onPress={() => setShowTradePicker(!showTradePicker)}
          >
            <Text style={trade ? styles.tradeSelectorText : styles.tradeSelectorPlaceholder}>
              {trade || 'Select your trade'}
            </Text>
            <Text>{showTradePicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showTradePicker && (
            <View style={styles.tradeDropdown}>
              {TRADES.map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tradeOption, trade === t && styles.tradeOptionActive]}
                  onPress={() => { setTrade(t); setShowTradePicker(false); }}
                >
                  <Text style={[styles.tradeOptionText, trade === t && styles.tradeOptionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell customers about yourself..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Location / Area</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="e.g. Meru Town, Kenyatta Avenue"
          />

          {/* Work Photos */}
          <Text style={styles.label}>Work Photos ({workPhotos.length}/4)</Text>
          <View style={styles.workPhotosGrid}>
            {workPhotos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                style={styles.workPhotoContainer}
                onLongPress={() => removeWorkPhoto(index)}
              >
                <Image source={{ uri: photo }} style={styles.workPhoto} />
                <TouchableOpacity
                  style={styles.removePhotoBadge}
                  onPress={() => removeWorkPhoto(index)}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
            {workPhotos.length < 4 && (
              <TouchableOpacity
                style={styles.addWorkPhoto}
                onPress={pickAndUploadWorkPhoto}
                disabled={uploadingWork}
              >
                {uploadingWork ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <>
                    <Text style={styles.addWorkPhotoIcon}>+</Text>
                    <Text style={styles.addWorkPhotoText}>Add Photo</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.workPhotoHint}>Long press a photo to remove it</Text>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.secondary },
  subtitle: { fontSize: 14, color: COLORS.subtext, marginTop: 4 },
  profilePhotoSection: { alignItems: 'center', marginBottom: 20 },
  profilePhotoContainer: { position: 'relative' },
  profilePhoto: { width: 100, height: 100, borderRadius: 50 },
  profilePhotoPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  profilePhotoEmoji: { fontSize: 40 },
  profilePhotoBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.primary,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  profilePhotoBadgeText: { fontSize: 14 },
  profilePhotoHint: { fontSize: 12, color: COLORS.subtext, marginTop: 8 },
  availabilityBar: {
    marginHorizontal: 24, borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  availableOn: { backgroundColor: '#E8F8F0' },
  availableOff: { backgroundColor: '#FDECEA' },
  availabilityText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  availabilityToggle: { fontSize: 12, color: COLORS.subtext },
  form: { paddingHorizontal: 24, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 12,
    padding: 14, fontSize: 15, color: COLORS.text,
  },
  textArea: { height: 100, paddingTop: 14 },
  tradeSelector: {
    backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 12,
    padding: 14, flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  tradeSelectorText: { fontSize: 15, color: COLORS.text },
  tradeSelectorPlaceholder: { fontSize: 15, color: COLORS.subtext },
  tradeDropdown: {
    backgroundColor: COLORS.white, borderWidth: 1,
    borderColor: COLORS.border, borderRadius: 12,
    marginTop: 4, overflow: 'hidden',
  },
  tradeOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tradeOptionActive: { backgroundColor: COLORS.primary },
  tradeOptionText: { fontSize: 15, color: COLORS.text },
  tradeOptionTextActive: { color: COLORS.white, fontWeight: 'bold' },
  workPhotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  workPhotoContainer: { position: 'relative' },
  workPhoto: { width: 80, height: 80, borderRadius: 10 },
  removePhotoBadge: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: COLORS.danger,
    width: 20, height: 20, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  removePhotoText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  addWorkPhoto: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 2, borderColor: COLORS.border,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  addWorkPhotoIcon: { fontSize: 24, color: COLORS.primary },
  addWorkPhotoText: { fontSize: 11, color: COLORS.subtext, marginTop: 2 },
  workPhotoHint: { fontSize: 12, color: COLORS.subtext, marginTop: 6 },
  saveButton: {
    backgroundColor: COLORS.primary, padding: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 28,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});