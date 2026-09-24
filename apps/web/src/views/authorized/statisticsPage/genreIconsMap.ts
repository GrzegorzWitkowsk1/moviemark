import {
  Cctv,
  Drama,
  Heart,
  Helicopter,
  Kayak,
  Key,
  Music,
  Rabbit,
  Rocket,
  Scroll,
  Sparkles,
  Sword,
  Tv,
} from "lucide-react";
import {
  FaceGrinning,
  Horse,
  Knife,
  QuestionIcon,
  Shocked,
  UserGroup,
  type GenreIcon,
} from "./genreIcons";

export const GENRE_ICON_BY_ID: Record<number, GenreIcon> = {
  28: Sword, // Action
  12: Kayak, // Adventure
  16: Rabbit, // Animation
  35: FaceGrinning, // Comedy
  80: Cctv, // Crime
  99: Scroll, // Documentary
  18: Drama, // Drama
  10751: UserGroup, // Family
  14: Sparkles, // Fantasy
  27: Knife, // Horror
  10402: Music, // Music
  9648: Key, // Mystery
  10749: Heart, // Romance
  878: Rocket, // Science Fiction
  10770: Tv, // TV Movie
  53: Shocked, // Thriller
  10752: Helicopter, // War
  37: Horse, // Western
  10759: Sword, // Action & Adventure (tv)
  10765: Rocket, // Sci-Fi & Fantasy (tv)
  10768: Helicopter, // War & Politics (tv)
};

export const DEFAULT_GENRE_ICON: GenreIcon = QuestionIcon;