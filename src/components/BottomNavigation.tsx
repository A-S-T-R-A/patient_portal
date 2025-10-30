import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const menuItems = [
  { title: "Dashboard", screen: "Dashboard", icon: "home" as const },
  { title: "Treatment", screen: "Treatment", icon: "activity" as const },
  { title: "Messages", screen: "Messages", icon: "message-square" as const },
  { title: "Promotions", screen: "Promotions", icon: "tag" as const },
  { title: "Profile", screen: "Profile", icon: "user" as const },
];

export function BottomNavigation() {
  const navigation = useNavigation<any>();
  const [currentRoute, setCurrentRoute] = useState("Dashboard");

  useEffect(() => {
    const unsubscribe = navigation.addListener("state", () => {
      const state = navigation.getState();
      if (state) {
        const route = state.routes[state.index];
        setCurrentRoute(route?.name || "Dashboard");
      }
    });

    const state = navigation.getState();
    if (state) {
      const route = state.routes[state.index];
      setCurrentRoute(route?.name || "Dashboard");
    }

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      {menuItems.map((item) => {
        const isActive = currentRoute === item.screen;
        return (
          <TouchableOpacity
            key={item.screen}
            style={styles.menuItem}
            onPress={() => navigation.navigate(item.screen)}
          >
            <Feather
              name={item.icon}
              size={20}
              color={isActive ? "#007AFF" : "#666"}
            />
            <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    paddingVertical: 8,
    paddingHorizontal: 4,
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  menuText: {
    fontSize: 10,
    color: "#666",
  },
  menuTextActive: {
    color: "#007AFF",
    fontWeight: "500",
  },
});
