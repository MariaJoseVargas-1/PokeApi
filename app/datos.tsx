import { FontAwesome } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { usePokemon } from "../context/PokemonContext";

// Traducir los nombres de las estadísticas
const nombresEstadisticas: Record<string, string> = {
  hp: "Vida",
  attack: "Ataque",
  defense: "Defensa",
  "special-attack": "Ataque especial",
  "special-defense": "Defensa especial",
  speed: "Velocidad",
};

// Traducir los movimientos más comunes
const traducirMovimiento = (movimiento: string) => {
  return movimiento
    .split("-")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");
};

export default function Datos() {
  const { pokemonData } = usePokemon();

  return (
    <ScrollView
      style={estilos.fondo}
      contentContainerStyle={estilos.contenedor}
    >
      {/* Encabezado */}
      <View style={estilos.encabezado}>
        <Image
          source={{
            uri: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png",
          }}
          style={estilos.pokebola}
        />

        <Text style={estilos.titulo}>Datos del Pokémon</Text>
        <Text style={estilos.subtitulo}>
          Información y estadísticas
        </Text>
      </View>

      {/* Cuando todavía no se ha buscado un Pokémon */}
      {!pokemonData && (
        <View style={estilos.mensajeInicial}>
          <FontAwesome
            name="search"
            size={45}
            color="#91A8C4"
          />

          <Text style={estilos.textoInicial}>
            Busca un Pokémon en la pestaña Principal para ver sus datos.
          </Text>
        </View>
      )}

      {/* Información del Pokémon */}
      {pokemonData && (
        <>
          {/* Tarjeta de información general */}
          <View style={estilos.tarjeta}>
            <Text style={estilos.nombrePokemon}>
              {pokemonData.nombre}
            </Text>

            {pokemonData.imagen && (
              <Image
                source={{ uri: pokemonData.imagen }}
                style={estilos.imagenPokemon}
                resizeMode="contain"
              />
            )}

            <Text style={estilos.especie}>
              {pokemonData.especie}
            </Text>

            {/* Altura y peso */}
            <View style={estilos.filaInformacion}>
              <View style={estilos.dato}>
                <FontAwesome
                  name="arrows-v"
                  size={22}
                  color="#2878D0"
                />

                <Text style={estilos.etiqueta}>Altura</Text>

                <Text style={estilos.valor}>
                  {(pokemonData.altura / 10).toFixed(1)} m
                </Text>
              </View>

              <View style={estilos.dato}>
                <FontAwesome
                  name="balance-scale"
                  size={22}
                  color="#2878D0"
                />

                <Text style={estilos.etiqueta}>Peso</Text>

                <Text style={estilos.valor}>
                  {(pokemonData.peso / 10).toFixed(1)} kg
                </Text>
              </View>
            </View>
          </View>

          {/* Estadísticas */}
          <View style={estilos.tarjeta}>
            <Text style={estilos.tituloSeccion}>
              <FontAwesome name="bar-chart" size={18} color="#2878D0" />
              {"  "}Estadísticas
            </Text>

            {pokemonData.estadisticas.map((estadistica, index) => {
              // Limitar el ancho de la barra para que no se desborde
              const porcentaje = Math.min(
                (estadistica.valor / 255) * 100,
                100
              );

              return (
                <View
                  key={`${estadistica.nombre}-${index}`}
                  style={estilos.estadistica}
                >
                  <View style={estilos.filaEstadistica}>
                    <Text style={estilos.nombreEstadistica}>
                      {nombresEstadisticas[estadistica.nombre] ||
                        estadistica.nombre}
                    </Text>

                    <Text style={estilos.valorEstadistica}>
                      {estadistica.valor}
                    </Text>
                  </View>

                  <View style={estilos.fondoBarra}>
                    <View
                      style={[
                        estilos.barra,
                        { width: `${porcentaje}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          {/* Movimientos */}
          <View style={estilos.tarjeta}>
            <Text style={estilos.tituloSeccion}>
              <FontAwesome name="bolt" size={18} color="#2878D0" />
              {"  "}Movimientos
            </Text>

            {pokemonData.movimientos.map((movimiento, index) => (
              <View
                key={`${movimiento}-${index}`}
                style={estilos.movimiento}
              >
                <FontAwesome
                  name="circle"
                  size={7}
                  color="#2878D0"
                />

                <Text style={estilos.textoMovimiento}>
                  {traducirMovimiento(movimiento)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "#EAF3FF",
  },

  contenedor: {
    padding: 20,
    paddingBottom: 35,
  },

  encabezado: {
    alignItems: "center",
    marginBottom: 22,
  },

  pokebola: {
    width: 45,
    height: 45,
    marginBottom: 5,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2878D0",
    textAlign: "center",
  },

  subtitulo: {
    fontSize: 14,
    color: "#7189A8",
    marginTop: 4,
  },

  tarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#D2E5FA",
    elevation: 3,
  },

  nombrePokemon: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#2878D0",
    textAlign: "center",
  },

  imagenPokemon: {
    width: 150,
    height: 150,
    alignSelf: "center",
  },

  especie: {
    fontSize: 15,
    color: "#7189A8",
    textAlign: "center",
    marginBottom: 18,
  },

  filaInformacion: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },

  dato: {
    flex: 1,
    backgroundColor: "#F0F7FF",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
  },

  etiqueta: {
    fontSize: 14,
    color: "#7189A8",
    marginTop: 8,
  },

  valor: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2878D0",
    marginTop: 4,
  },

  tituloSeccion: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2878D0",
    marginBottom: 18,
  },

  estadistica: {
    marginBottom: 16,
  },

  filaEstadistica: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  nombreEstadistica: {
    fontSize: 14,
    color: "#425A78",
    fontWeight: "500",
  },

  valorEstadistica: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2878D0",
  },

  fondoBarra: {
    height: 10,
    backgroundColor: "#DCEBFA",
    borderRadius: 10,
    overflow: "hidden",
  },

  barra: {
    height: "100%",
    backgroundColor: "#3198E8",
    borderRadius: 10,
  },

  movimiento: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F7FF",
    borderRadius: 9,
    padding: 11,
    marginBottom: 8,
    gap: 10,
  },

  textoMovimiento: {
    flex: 1,
    fontSize: 14,
    color: "#425A78",
  },

  mensajeInicial: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },

  textoInicial: {
    fontSize: 15,
    color: "#7189A8",
    textAlign: "center",
    marginTop: 18,
    lineHeight: 22,
  },
});