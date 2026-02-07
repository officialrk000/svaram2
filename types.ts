
export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl: string;
  duration: number; // in seconds
  audioUrl: string;
  genre: string;
  category?: string; // e.g., 'Boliwood', 'Holiwood', etc.
  playlistIds?: string[]; // Associate songs with multiple custom playlists
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  songs?: Song[]; // Optional for mock playlists, custom ones might use playlistIds mapping
}

export interface AIRecommendation {
  reason: string;
  suggestedGenre: string;
  mood: string;
}
