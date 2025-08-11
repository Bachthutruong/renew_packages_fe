import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DataWithPercentage } from '../types';

interface DataSelectionContextType {
  // Selection states
  selectedB1: string;
  selectedB2: string;
  selectedB3: string;
  
  // Data states
  b2Data: DataWithPercentage[];
  b3Data: DataWithPercentage[];
  
  // Setters
  setSelectedB1: (value: string) => void;
  setSelectedB2: (value: string) => void;
  setSelectedB3: (value: string) => void;
  setB2Data: (data: DataWithPercentage[]) => void;
  setB3Data: (data: DataWithPercentage[]) => void;
  
  // Helper functions
  resetFlow: () => void;
}

const DataSelectionContext = createContext<DataSelectionContextType | undefined>(undefined);

interface DataSelectionProviderProps {
  children: ReactNode;
}

export const DataSelectionProvider: React.FC<DataSelectionProviderProps> = ({ children }) => {
  const [selectedB1, setSelectedB1] = useState<string>('');
  const [selectedB2, setSelectedB2] = useState<string>('');
  const [selectedB3, setSelectedB3] = useState<string>('');
  const [b2Data, setB2Data] = useState<DataWithPercentage[]>([]);
  const [b3Data, setB3Data] = useState<DataWithPercentage[]>([]);

  const resetFlow = () => {
    setSelectedB1('');
    setSelectedB2('');
    setSelectedB3('');
    setB2Data([]);
    setB3Data([]);
  };

  const value: DataSelectionContextType = {
    selectedB1,
    selectedB2,
    selectedB3,
    b2Data,
    b3Data,
    setSelectedB1,
    setSelectedB2,
    setSelectedB3,
    setB2Data,
    setB3Data,
    resetFlow,
  };

  return (
    <DataSelectionContext.Provider value={value}>
      {children}
    </DataSelectionContext.Provider>
  );
};

export const useDataSelection = (): DataSelectionContextType => {
  const context = useContext(DataSelectionContext);
  if (!context) {
    throw new Error('useDataSelection must be used within a DataSelectionProvider');
  }
  return context;
}; 