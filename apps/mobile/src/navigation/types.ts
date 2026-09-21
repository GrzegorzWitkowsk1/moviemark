import type { NavigatorScreenParams } from "@react-navigation/native";
import type { TmdbMediaType } from "shared";

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Collection: undefined;
  WantToWatch: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  Details: { id: number; mediaType: TmdbMediaType };
};
