export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  gender?: string;
  skinTone?: string;
  photoURL?: string;
}

export interface FavoriteItem {
  id?: string;
  userId: string;
  title: string;
  brand: string;
  platform: string;
  price: string;
  link: string;
  imageUrl?: string;
  category: 'outfit' | 'makeup';
  savedAt: string;
}

export interface OrderItem {
  id?: string;
  userId: string;
  orderNumber: string;
  itemTitle: string;
  status: string;
  deliveryDate: string;
  platform: string;
}
