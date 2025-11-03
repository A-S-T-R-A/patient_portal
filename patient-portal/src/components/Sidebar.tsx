import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";

const menuItems = [
  { title: "Dashboard", screen: "Dashboard", icon: "🏠" },
  { title: "Treatment", screen: "Treatment", icon: "🩺" },
  { title: "Messages", screen: "Messages", icon: "💬" },
  { title: "Promotions", screen: "Promotions", icon: "🏷️" },
  { title: "Profile", screen: "Profile", icon: "👤" },
];

export function Sidebar() {
  const navigation = useNavigation<any>();
  const [currentRoute, setCurrentRoute] = React.useState("Dashboard");

  React.useEffect(() => {
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
      <View style={styles.header}>
        <Text style={styles.logo}>🏥</Text>
        <Text style={styles.title}>Patient Portal</Text>
      </View>
      <View style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = currentRoute === item.screen;
          return (
            <TouchableOpacity
              key={item.screen}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.screen)}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text
                style={[styles.menuText, isActive && styles.menuTextActive]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 240,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
    height: "100vh",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  logo: {
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  menu: {
    gap: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: "#E3F2FD",
  },
  menuIcon: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 15,
    color: "#666",
  },
  menuTextActive: {
    color: "#007AFF",
    fontWeight: "500",
  },
});
