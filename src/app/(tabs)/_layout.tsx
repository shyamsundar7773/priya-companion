import { Tabs } from "expo-router";
import { Platform, Text } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          height:
            Platform.OS === "android"
              ? 58
              : 70,

          paddingTop: 6,

          paddingBottom:
            Platform.OS === "android"
              ? 8
              : 10,

          backgroundColor: "#FFFFFF",

          borderTopWidth: 1,
          borderTopColor: "#E5E5E5",

          elevation: 8,

          // IMPORTANT
          position: "relative",
        },

        tabBarActiveTintColor: "#7B2CBF",
        tabBarInactiveTintColor: "#888888",

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",

          tabBarIcon: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 24,
                color,
                opacity: focused ? 1 : 0.65,
              }}
            >
              💬
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",

          tabBarIcon: ({ color, focused }) => (
            <Text
              style={{
                fontSize: 24,
                color,
                opacity: focused ? 1 : 0.65,
              }}
            >
              ✨
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}