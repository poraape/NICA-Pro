import React, { useState } from "react";

import { NutriIcon, NutriInput } from "@/components/atoms";
import { BottomSheet } from "@/components/molecules/BottomSheet";
import { useFoodSearch } from "@/hooks/useFoodSearch";

import { FoodItemData } from "../MealTimeline/MealTimeline";

import "./FoodSearchSheet.styles.css";

interface FoodSearchSheetProps {
  onSelect: (food: FoodItemData) => void;
  onClose: () => void;
}

export const FoodSearchSheet: React.FC<FoodSearchSheetProps> = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState("");
  const { results, loading } = useFoodSearch(query);

  return (
    <BottomSheet isOpen onClose={onClose} title="Adicionar alimento" ariaLabelledby="food-search-title">
      <div className="food-search-input-wrapper">
        <NutriIcon name="magnifyingglass" aria-hidden />
        <NutriInput
          type="search"
          placeholder="Buscar por nome, marca ou código"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label="Buscar alimento"
        />
        <button className="barcode-scanner-btn" aria-label="Escanear código de barras">
          <NutriIcon name="barcode.viewfinder" />
        </button>
      </div>

      <div className="search-results">
        {loading && <p className="search-status">Buscando...</p>}

        {!loading && results.length === 0 && query.length >= 2 && (
          <p className="search-status">Nenhum resultado encontrado</p>
        )}

        {results.map((food) => (
          <button
            key={food.id}
            className="search-result-item"
            onClick={() => onSelect(food)}
            aria-label={`${food.name} com ${food.calories} calorias`}
          >
            <div className="result-info">
              <h4>{food.name}</h4>
              <p className="result-source">{food.source}</p>
            </div>
            <div className="result-calories">{food.calories} kcal</div>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
};
