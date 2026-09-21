import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from "react-native-paper";

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#4F6BED",
    secondaryContainer: "#DDE3FF",
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#9DB1FF",
    secondaryContainer: "#2A3566",
  },
};
