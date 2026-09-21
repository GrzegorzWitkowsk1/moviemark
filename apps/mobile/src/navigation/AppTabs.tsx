import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import HomeScreen from "@/screens/HomeScreen";
import SearchScreen from "@/screens/SearchScreen";
import CollectionScreen from "@/screens/CollectionScreen";
import WantToWatchScreen from "@/screens/WantToWatchScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import type { MainTabParamList } from "./types";

const Tab = createBottomTabNavigator<MainTabParamList>();

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

const ICONS: Record<keyof MainTabParamList, IconName> = {
  Home: "home",
  Search: "magnify",
  Collection: "bookmark-multiple",
  WantToWatch: "clock-outline",
  Settings: "cog",
};

export function AppTabs() {
  const { t } = useTranslation();

  const labels: Record<keyof MainTabParamList, string> = {
    Home: t("nav.home"),
    Search: t("nav.search"),
    Collection: t("nav.collection"),
    WantToWatch: t("nav.wantToWatch"),
    Settings: t("nav.settings"),
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: labels[route.name],
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons
            name={ICONS[route.name]}
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Collection" component={CollectionScreen} />
      <Tab.Screen name="WantToWatch" component={WantToWatchScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
