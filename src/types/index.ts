export type UserRole = 'customer' | 'artisan' | 'admin';

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
  profilePhoto: string;
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
  reviewed: boolean;
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
  ReviewScreen: { bookingId: string; artisanId: string; artisanName: string };
  MapScreen: undefined;
  ChatScreen: { bookingId: string; recipientName: string; recipientId: string };
  AdminTabs: undefined;
};

export type CustomerTabParamList = {
  Home: undefined;
  Search: undefined;
  Map: undefined;
  MyBookings: undefined;
  Profile: undefined;
};

export type ArtisanTabParamList = {
  Dashboard: undefined;
  Bookings: undefined;
  EditProfile: undefined;
  Profile: undefined;
};

export type AdminTabParamList = {
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminBookings: undefined;
};