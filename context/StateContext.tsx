"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type StateType = {
  isPlaying: boolean;
  audioURL: string;
  tracks: any[];
  spotifyAccessToken: string;
  session: any;
  likedSongs: any[];
  track: object;
};

type StateContextType = {
  state: StateType;
  setState: React.Dispatch<React.SetStateAction<StateType>>;
};

const initialState: StateType = {
  isPlaying: false,
  audioURL: "",
  tracks: [],
  spotifyAccessToken: "",
  session: {},
  likedSongs: [],
  track: {},
};

const StateContext = createContext<StateContextType | undefined>(undefined);

type StateProviderProps = {
  children: ReactNode;
};

const StateProvider: React.FC<StateProviderProps> = ({ children }) => {
  const [state, setState] = useState<StateType>(initialState);

  return (
    <StateContext.Provider value={{ state, setState }}>
      {children}
    </StateContext.Provider>
  );
};

const useStateContext = (): StateContextType => {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useStateContext must be used within a StateProvider");
  }
  return context;
};

export { StateProvider, useStateContext };
