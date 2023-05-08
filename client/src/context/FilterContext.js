import { createContext, useState } from 'react';

export const FilterContext = createContext();

const initial_state = {
  spread: {
    bets: {
      min: 0,
      max: 100,
    },
    handled: {
      min: 0,
      max: 100,
    },
  },
  moneyline: {
    bets: {
      min: 0,
      max: 100,
    },
    handled: {
      min: 0,
      max: 100,
    },
  },
  total: {
    bets: {
      min: 0,
      max: 100,
    },
    handled: {
      min: 0,
      max: 100,
    },
  },
};

export const FilterContextProvider = (props) => {
  const [filters, setFilters] = useState(initial_state);

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {props.children}
    </FilterContext.Provider>
  );
};