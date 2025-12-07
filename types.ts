
export interface UserProfile {
  name: string;
  age: number;
  height: number;
  gender: 'Male' | 'Female';
  activityLevel: string;
}

export interface Macro {
  current: number;
  target: number;
  unit: string;
}

export interface DailyStats {
  calories: Macro;
  protein: Macro;
  carbs: Macro;
  fat: Macro;
  burned: number;
}

export interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  time: string;
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  image?: string;
  itemType: 'meal';
}

export interface ActivityItem {
  id: string;
  name: string;
  caloriesBurned: number;
  duration: number; // minutes
  time: string;
  type: "Cardio" | "Strength" | "Flexibility" | "Sports";
  image?: string;
  itemType: 'exercise';
}

export type TimelineItem = MealItem | ActivityItem;

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  gramsPerUnit: number;
  image: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  caloriesPerUnit: number; // Calories burned per minute
  unit: string;
  image: string;
  category: "Cardio" | "Strength" | "Flexibility" | "Sports";
}

export interface WeightRecord {
    date: string;
    weight: number;
}
