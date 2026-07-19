// Static bundled exercise catalog for Quick Select (FEAT-01) — ported
// verbatim from the design reference's window.OC_DATA.exerciseLib. No
// Supabase table: front-end only, no v1 requirement for runtime
// editability (see docs/architecture.md's Quick Select section).

export const EXERCISE_CATEGORIES = ['Legs', 'Core', 'Cardio', 'Arms', 'Shoulders']

export const EXERCISE_CATALOG = [
  // Legs
  { id: 'broad-jump', name: 'Broad Jump', category: 'Legs' },
  { id: 'goblet-squat', name: 'Goblet Squat', category: 'Legs' },
  { id: 'walking-lunge', name: 'Walking Lunge', category: 'Legs' },
  { id: 'box-jump', name: 'Box Jump', category: 'Legs' },
  { id: 'bulgarian-split-squat', name: 'Bulgarian Split Squat', category: 'Legs' },
  { id: 'step-up', name: 'Step-up', category: 'Legs' },

  // Core
  { id: 'bridge', name: 'Bridge', category: 'Core' },
  { id: 'plank', name: 'Plank', category: 'Core' },
  { id: 'mountain-climbers', name: 'Mountain Climbers', category: 'Core' },
  { id: 'russian-twist', name: 'Russian Twist', category: 'Core' },
  { id: 'hollow-hold', name: 'Hollow Hold', category: 'Core' },
  { id: 'dead-bug', name: 'Dead Bug', category: 'Core' },

  // Cardio
  { id: 'run', name: 'Run', category: 'Cardio' },
  { id: 'burpees', name: 'Burpees', category: 'Cardio' },
  { id: 'jumping-jacks', name: 'Jumping Jacks', category: 'Cardio' },
  { id: 'high-knees', name: 'High Knees', category: 'Cardio' },
  { id: 'kettlebell-swing', name: 'Kettlebell Swing', category: 'Cardio' },
  { id: 'skipping', name: 'Skipping', category: 'Cardio' },

  // Arms
  { id: 'banded-curls', name: 'Banded Curls', category: 'Arms' },
  { id: 'overhead-tricep-extension', name: 'Overhead Tricep Extension', category: 'Arms' },
  { id: 'push-up', name: 'Push-up', category: 'Arms' },
  { id: 'diamond-push-up', name: 'Diamond Push-up', category: 'Arms' },

  // Shoulders
  { id: 'pike-push-up', name: 'Pike Push-up', category: 'Shoulders' },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'Shoulders' },
  { id: 'arnold-press', name: 'Arnold Press', category: 'Shoulders' },
  { id: 'front-raise', name: 'Front Raise', category: 'Shoulders' },
]
