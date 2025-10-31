import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, View as RNView, Text as RNText } from "react-native";
import { useEffect } from "react";
import { connectSocket, resolvePatientId } from "./src/lib/api";
import { navigationRef, navigate } from "./src/lib/navigation";

import DashboardScreen from "./src/screens/DashboardScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import MessagesScreen from "./src/screens/MessagesScreen";
import PromotionsScreen from "./src/screens/PromotionsScreen";
import TreatmentScreen from "./src/screens/TreatmentScreen";
import { BottomNavigation } from "./src/components/BottomNavigation";
import { View } from "react-native";
import Toast from "react-native-toast-message";

const Stack = createNativeStackNavigator();

function MainNavigator() {
  return (
    <View style={styles.appContainer}>
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Messages" component={MessagesScreen} />
        <Stack.Screen name="Promotions" component={PromotionsScreen} />
        <Stack.Screen name="Treatment" component={TreatmentScreen} />
      </Stack.Navigator>
      <BottomNavigation />
    </View>
  );
}

export default function App() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Notifications.requestPermissionsAsync();
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
      } catch {}
      const patientId = await resolvePatientId();
      if (!mounted) return;
      const socket: any = connectSocket({ patientId: patientId || undefined });
      socket.on("message:new", ({ message: m }: any) => {
        try {
          void Notifications.scheduleNotificationAsync({
            content: {
              title: m?.sender === "doctor" ? "New message" : "Message sent",
              body: m?.content || "",
            },
            trigger: null,
          });
        } catch {}
      });
      socket.on("appointment:update", ({ appointment, by }: any) => {
        try {
          const when = new Date(appointment?.datetime).toLocaleString();

          try {
            void Notifications.scheduleNotificationAsync({
              content: {
                title:
                  by === "patient"
                    ? "Appointment updated"
                    : "Appointment updated by doctor",
                body: when,
              },
              trigger: null,
            });
          } catch {}
        } catch {}
      });
    })();
    return () => {
      mounted = false;
    };
  }, []);
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <MainNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
        <Toast
          position="top"
          config={{
            app_info: ({ text1, text2 }) => (
              <RNView
                style={{
                  alignSelf: "flex-end",
                  backgroundColor: "#111827",
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  marginTop: 8,
                  marginRight: 12,
                  maxWidth: 360,
                }}
              >
                {text1 ? (
                  <RNText style={{ color: "#fff", fontWeight: "600" }}>
                    {text1}
                  </RNText>
                ) : null}
                {text2 ? (
                  <RNText style={{ color: "#D1D5DB", marginTop: 2 }}>
                    {text2}
                  </RNText>
                ) : null}
              </RNView>
            ),
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appContainer: {
    flex: 1,
  },
});
