import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { PokemonProvider } from "../context/PokemonContext";

export default function Layout() {
  return (
    <PokemonProvider>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor: "#2878D0",
          tabBarInactiveTintColor: "#91A8C4",

          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopWidth: 2,
            borderTopColor: "#D2E5FA",
            height: 65,
            paddingBottom: 8,
            paddingTop: 7,
          },

          tabBarLabelStyle: {
            fontSize: 13,
            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Principal",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome
                name="home"
                size={size}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="datos"
          options={{
            title: "Datos",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome
                name="bar-chart"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </PokemonProvider>
  );
}