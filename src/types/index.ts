
export type UserRole = 'customer' | 'artisan';

export interface User {
  uid: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

export interface Artisan {
  uid: string;
  name: string;
  phone: string;
  trade: string;
  bio: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  photos: string[];
  rating: number;
  totalReviews: number;
  available: boolean;
  createdAt: Date;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  artisanId: string;
  artisanName: string;
  trade: string;
  description: string;
  date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
}

export interface Review {
  id: string;
  customerId: string;
  customerName: string;
  artisanId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

// Navigation types
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: { role: UserRole };
  CustomerTabs: undefined;
  ArtisanTabs: undefined;
  ArtisanDetail: { artisanId: string };
  BookingScreen: {artisan: Artisan};
};

export type CustomerTabParamList = {
  Home: undefined;
  Search: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type ArtisanTabParamList = {
  Dashboard: undefined;
  Bookings: undefined;
  EditProfile: undefined;
  Profile: undefined;
};