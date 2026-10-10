import { FontAwesome } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useEffect } from "react";
import { Platform } from "react-native";

// Nuestra base de datos local SQLite
import { iniciarBaseDeDatos } from "../database_sqlite/database";

// Contextos de Pokemon y Naruto
import { NarutoProvider } from "../context/NarutoContext";
import { PokemonProvider } from "../context/PokemonContext";

export default function Layout() {

  // Preparamos SQLite cuando inicia la aplicación.
  useEffect(() => {
  // Por ahora inicializamos SQLite solamente en Expo Go.
  if (Platform.OS !== "web") {
    iniciarBaseDeDatos();
  }
}, []);

  return (
    <PokemonProvider>
      <NarutoProvider>
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
              fontSize: 12,
              fontWeight: "600",
            },
          }}
        >
          {/* Primera pestaña: Pokemon */}
          <Tabs.Screen
            name="index"
            options={{
              title: "Principal",
              tabBarIcon: ({ color, size }) => (
                <FontAwesome name="home" size={size} color={color} />
              ),
            }}
          />

          {/* Segunda pestaña: datos de Pokemon */}
          <Tabs.Screen
            name="datos"
            options={{
              title: "Datos",
              tabBarIcon: ({ color, size }) => (
                <FontAwesome name="bar-chart" size={size} color={color} />
              ),
            }}
          />

          {/* Tercera pestaña: Naruto */}
          <Tabs.Screen
            name="api2"
            options={{
              title: "API2",
              tabBarIcon: ({ color, size }) => (
                <FontAwesome name="leaf" size={size} color={color} />
              ),
            }}
          />

          {/* Cuarta pestaña: datos de Naruto */}
          <Tabs.Screen
            name="datos2"
            options={{
              title: "Datos 2",
              tabBarIcon: ({ color, size }) => (
                <FontAwesome name="address-card" size={size} color={color} />
              ),
            }}
          />

          {/* Quinta pestaña: docentes de UNINPAHU */}
          <Tabs.Screen
            name="docentes"
            options={{
              title: "Docentes",
              tabBarIcon: ({ color, size }) => (
                <FontAwesome
                  name="graduation-cap"
                  size={size}
                  color={color}
                />
              ),
            }}
          />

          {/*
            Pantalla para administrar docentes.
            No aparece como pestaña en la barra inferior.
            Se abrirá desde un botón en Docentes.
          */}
          <Tabs.Screen
            name="administrar-docentes"
            options={{
              href: null,
              title: "Administrar docentes",
            }}
          />
        </Tabs>
      </NarutoProvider>
    </PokemonProvider>
  );
}
