import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/queries";
import * as AppleAuthentication from "expo-apple-authentication";
import { initiateGoogleAuth, initiateAppleAuth, getAuthBase } from "../lib/api";
import { colors } from "../lib/colors";
import { Logo } from "../components/Logo";

const screenWidth = Dimensions.get("window").width;

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const queryClient = useQueryClient();
  const { data: authData } = useAuth();

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (authData?.role === "patient") {
      console.log("[LoginScreen] User authenticated, redirecting to dashboard");
      // User is already logged in, redirect to dashboard
      if (typeof window !== "undefined" && window.location) {
        // Use window location to preserve localhost
        const currentHost = window.location.hostname;
        const currentPort = window.location.port
          ? `:${window.location.port}`
          : "";
        const protocol = window.location.protocol;
        window.location.href = `${protocol}//${currentHost}${currentPort}/dashboard`;
      } else {
        // On native, use navigation
        const { navigate } = require("../lib/navigation");
        if (navigate) {
          console.log("[LoginScreen] Navigating to Dashboard (native)");
          navigate("Dashboard");
        }
      }
    }
  }, [authData]);

  // Handle OAuth errors from URL
  useEffect(() => {
    if (typeof window === "undefined" || !window.location) return;

    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error === "apple_oauth_not_configured") {
      Alert.alert(
        "Apple Sign In Not Configured",
        "Apple Sign In requires server configuration. Please use Google Sign In for now."
      );
      // Clean URL
      if (window.history && window.location.pathname) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, []);

  // Check if Apple Authentication is available (not in Expo Go)
  useEffect(() => {
    if (Platform.OS === "ios") {
      try {
        // Try to check if module is available
        if (AppleAuthentication && AppleAuthentication.isAvailableAsync) {
          AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
        } else {
          // If method doesn't exist, assume it's available (will fail gracefully in catch)
          setAppleAuthAvailable(true);
        }
      } catch {
        // Module not available (Expo Go)
        setAppleAuthAvailable(false);
      }
    }
  }, []);

  const handleGoogleLogin = async () => {
    // Don't login if already authenticated
    if (authData?.role === "patient") {
      return;
    }
    setIsLoading(true);
    try {
      await initiateGoogleAuth("patient");
    } catch (error) {
      console.error("Google login error:", error);
      Alert.alert("Sign In Failed", "Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    // Don't login if already authenticated
    if (authData?.role === "patient") {
      return;
    }

    // On web, always use web-based Apple Sign In (works in browser)
    if (Platform.OS === "web") {
      setIsLoading(true);
      try {
        await initiateAppleAuth("patient");
      } catch (error) {
        console.error("Apple login error:", error);
        Alert.alert("Sign In Failed", "Please try again");
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // On iOS native: try native first, fallback to web
    if (Platform.OS !== "ios") {
      // For other platforms (Android), use web version
      initiateAppleAuth("patient");
      return;
    }

    try {
      setIsLoading(true);

      // Try to use native Apple Sign In
      // This will fail in Expo Go (module not available), but we'll catch and handle it
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Send credential to backend
      const authBase = getAuthBase();
      const response = await fetch(`${authBase}/api/auth/apple`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          identityToken: credential.identityToken,
          authorizationCode: credential.authorizationCode,
          user: {
            email: credential.email,
            name: {
              firstName: credential.fullName?.givenName,
              lastName: credential.fullName?.familyName,
            },
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Handle token (cross-domain or same-domain)
        if (data.token) {
          // Cross-domain: save token and redirect
          try {
            if (typeof window !== "undefined" && window.localStorage) {
              localStorage.setItem("auth_token", data.token);
              if (window.sessionStorage) {
                sessionStorage.setItem("auth_token_temp", data.token);
              }
            }
          } catch {}

          // Only use window.location on web platform
          if (Platform.OS === "web" && typeof window !== "undefined") {
            if (data.redirectUrl && window.location) {
              window.location.href = data.redirectUrl;
            } else if (window.location) {
              window.location.reload();
            }
          } else {
            // On native, invalidate queries to trigger refetch
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          }
        } else {
          // Same-domain: cookie was set, reload
          if (
            Platform.OS === "web" &&
            typeof window !== "undefined" &&
            window.location
          ) {
            window.location.reload();
          } else {
            // On native, invalidate queries
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          }
        }
      } else {
        Alert.alert("Sign In Failed", data.error || "Please try again");
      }
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        // User canceled - do nothing
        return;
      }

      // Check if error is because module is not available (Expo Go case)
      const errorMessage = error?.message || "";
      const errorCode = error?.code || "";

      if (
        errorMessage.includes("Native module") ||
        errorMessage.includes("expo-apple-authentication") ||
        errorCode === "ERR_MODULE_NOT_FOUND" ||
        errorMessage.includes("Cannot find module") ||
        errorMessage.includes("is not available")
      ) {
        // Fallback to web-based Apple Sign In (works in Expo Go!)
        console.log("Native Apple Sign In not available, using web version");
        try {
          await initiateAppleAuth("patient");
        } catch (webError) {
          console.error("Web Apple Sign In error:", webError);
          Alert.alert("Sign In Failed", "Please try again");
        }
        return;
      }

      // Other errors - log and show message
      console.error("Apple Sign In error:", errorMessage, errorCode);
      Alert.alert(
        "Sign In Failed",
        errorMessage || "Please try again or use Google Sign In"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size={80} />
        </View>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>
            Sign in to access your patient portal
          </Text>
        </View>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
          disabled={isLoading}
        >
          <View style={styles.buttonContent}>
            <Text style={{ fontSize: 20, marginRight: 8 }}>🔐</Text>
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </View>
        </TouchableOpacity>

        {/* Apple Sign In - show on iOS if native available, or show custom button for web/fallback */}
        {Platform.OS === "ios" && appleAuthAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={8}
            style={styles.appleButton}
            onPress={handleAppleLogin}
          />
        ) : (
          <TouchableOpacity
            style={styles.appleButtonWeb}
            onPress={handleAppleLogin}
            disabled={isLoading}
          >
            <View style={styles.buttonContent}>
              <Text style={{ fontSize: 18, marginRight: 8 }}>🍎</Text>
              <Text style={styles.appleButtonText}>Sign in with Apple</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our{" "}
            <Text
              style={styles.linkText}
              onPress={() => {
                const termsUrl =
                  require("../../app.json").expo.extra?.termsOfServiceUrl ||
                  "https://your-domain.com/terms";
                Linking.openURL(termsUrl);
              }}
            >
              Terms of Service
            </Text>{" "}
            and{" "}
            <Text
              style={styles.linkText}
              onPress={() => {
                const privacyUrl =
                  require("../../app.json").expo.extra?.privacyPolicyUrl ||
                  "https://your-domain.com/privacy";
                Linking.openURL(privacyUrl);
              }}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryWhite,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
  },
  googleButton: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.primaryWhite,
    borderWidth: 1,
    borderColor: colors.greyscale200,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    shadowColor: colors.greyscale900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  appleButton: {
    width: "100%",
    maxWidth: 320,
    height: 50,
    marginTop: 16,
  },
  appleButtonWeb: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    shadowColor: colors.greyscale900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appleButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.primaryWhite,
  },
  footer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: "center",
  },
  linkText: {
    color: colors.textPrimary,
    textDecorationLine: "underline",
  },
});
