export interface Movie {
  id: number;
  name: string; // API uses 'name' instead of 'title'
  posterUrl: string; // API uses 'posterUrl' instead of 'poster'
  backdrop?: string;
  duration: number; // API returns duration in minutes
  rating?: number; // Optional since API doesn't include rating
  totalRatings?: number; // Optional since API doesn't include totalRatings
  releaseDate: string; // API format: "2025-09-19"
  categoryNames: string[]; // API uses 'categoryNames' instead of 'genres'
  description: string;
  tagline?: string;
  cast?: CastMember[]; // Optional since API doesn't include cast
  trailer: string; // API uses 'trailer' instead of 'trailerUrl'
  director: string;
  actor: string;
  isComingSoon: boolean;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profileImage: string;
}

export interface ShowTime {
  id: number;
  time: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
}

export interface Cinema {
  id: number;
  name: string;
  location: string;
  showtimes: ShowTime[];
}