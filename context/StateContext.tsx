"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type StateType = {
  isPlaying: boolean;
  audioURL: string;
  tracks: any[];
  devCredentials: string;
  session: any;
  likedSongs: any[];
  track: {
    preview_url: string;
  };
  previewURL: string;
  expiresAt: number;
  newTracks: any[];
  userAuthorizationCode: string;
  deviceID: any;
  refreshToken: string;
  progress: number;
};

type StateContextType = {
  state: StateType;
  setState: React.Dispatch<React.SetStateAction<StateType>>;
};

const initialState: StateType = {
  isPlaying: false,
  audioURL: "",
  tracks: [],
  devCredentials: "",
  session: {},
  likedSongs: [],
  track: { preview_url: "" },
  previewURL: "",
  expiresAt: 0,
  newTracks: [],
  deviceID: "",
  userAuthorizationCode: "",
  refreshToken: "",
  progress: 0,
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
