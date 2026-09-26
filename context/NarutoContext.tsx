
import React, {
    createContext,
    ReactNode,
    useContext,
    useState,
} from "react";

export interface PersonajeNaruto {
  id: number | string;
  name: string;
  images: string[];

  clan: string;
  village: string;
  jutsu: string[];
  natureType: string[];

  rank: string;
  description: string;
  affiliation: string[];

  family?: Record<string, any>;
  personal?: Record<string, any>;
  debut?: Record<string, any>;
  tools?: string[];
  uniqueTraits?: string[];
  kekkeiGenkai?: string[];
  classification?: string;
}

interface NarutoContextType {
  personaje: PersonajeNaruto | null;
  setPersonaje: (personaje: PersonajeNaruto | null) => void;
}

const NarutoContext = createContext<NarutoContextType | undefined>(
  undefined
);

export function NarutoProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [personaje, setPersonaje] =
    useState<PersonajeNaruto | null>(null);

  return (
    <NarutoContext.Provider value={{ personaje, setPersonaje }}>
      {children}
    </NarutoContext.Provider>
  );
}

export function useNaruto() {
  const contexto = useContext(NarutoContext);

  if (!contexto) {
    throw new Error(
      "useNaruto debe utilizarse dentro de NarutoProvider"
    );
  }

  return contexto;
}