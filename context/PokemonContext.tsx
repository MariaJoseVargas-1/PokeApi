import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

// Estructura de los datos de un tipo de Pokémon
export type TipoPokemon = {
  nombre: string;
  imagen: string | null;
};

// Estructura de los datos de una evolución
export type EvolucionPokemon = {
  nombre: string;
  imagen: string | null;
};

// Estructura completa de un Pokémon
export type Pokemon = {
  nombre: string;
  altura: number;
  peso: number;
  imagen: string | null;
  especie: string;
  movimientos: string[];

  estadisticas: {
    nombre: string;
    valor: number;
  }[];

  tipos: TipoPokemon[];

  evolucion: EvolucionPokemon | null;
};

// Estructura del contexto
type PokemonContextType = {
  pokemonData: Pokemon | null;
  setPokemonData: (pokemon: Pokemon | null) => void;
};

// Crear el contexto
const PokemonContext = createContext<PokemonContextType | undefined>(
  undefined
);

// Proveedor del contexto
export function PokemonProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [pokemonData, setPokemonData] = useState<Pokemon | null>(null);

  return (
    <PokemonContext.Provider
      value={{
        pokemonData,
        setPokemonData,
      }}
    >
      {children}
    </PokemonContext.Provider>
  );
}

// Hook para utilizar el contexto
export function usePokemon() {
  const context = useContext(PokemonContext);

  if (!context) {
    throw new Error(
      "usePokemon debe utilizarse dentro de PokemonProvider"
    );
  }

  return context;
}