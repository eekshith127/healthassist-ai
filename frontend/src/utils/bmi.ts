export interface BMIEvaluation {
  bmi: number
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese'
  colorClass: string
  bgClass: string
  borderClass: string
  description: string
}

/**
 * Computes Body Mass Index (BMI = weight_kg / (height_m ^ 2))
 */
export function calculateBMI(
  heightCm?: number | null,
  weightKg?: number | null
): BMIEvaluation | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
    return null
  }

  const heightM = heightCm / 100
  const bmiValue = Number((weightKg / (heightM * heightM)).toFixed(1))

  if (bmiValue < 18.5) {
    return {
      bmi: bmiValue,
      category: 'Underweight',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/50',
      borderClass: 'border-amber-200 dark:border-amber-900/50',
      description: 'Below standard reference range. Consider nutrition consultation.',
    }
  } else if (bmiValue < 25.0) {
    return {
      bmi: bmiValue,
      category: 'Normal weight',
      colorClass: 'text-emerald-600 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/50',
      borderClass: 'border-emerald-200 dark:border-emerald-900/50',
      description: 'Optimal health reference range.',
    }
  } else if (bmiValue < 30.0) {
    return {
      bmi: bmiValue,
      category: 'Overweight',
      colorClass: 'text-amber-600 dark:text-amber-400',
      bgClass: 'bg-amber-50 dark:bg-amber-950/50',
      borderClass: 'border-amber-200 dark:border-amber-900/50',
      description: 'Slightly above reference range.',
    }
  } else {
    return {
      bmi: bmiValue,
      category: 'Obese',
      colorClass: 'text-rose-600 dark:text-rose-400',
      bgClass: 'bg-rose-50 dark:bg-rose-950/50',
      borderClass: 'border-rose-200 dark:border-rose-900/50',
      description: 'Above recommended clinical thresholds.',
    }
  }
}

/**
 * Calculates exact age from Date of Birth string (YYYY-MM-DD)
 */
export function calculateAge(dobStr?: string | null): number | null {
  if (!dobStr) return null
  try {
    const cleanStr = dobStr.trim().split('T')[0]
    const parts = cleanStr.split('-')
    if (parts.length < 3) return null

    const birthDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    if (isNaN(birthDate.getTime())) return null

    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return Math.max(0, age)
  } catch {
    return null
  }
}

/**
 * Formats height in cm to dual format (e.g. "180 cm (5' 11\")")
 */
export function formatHeight(cm?: number | null): string {
  if (!cm || cm <= 0) return '—'
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${cm} cm (${feet}' ${inches}")`
}

/**
 * Formats weight in kg to dual format (e.g. "75 kg (165.3 lbs)")
 */
export function formatWeight(kg?: number | null): string {
  if (!kg || kg <= 0) return '—'
  const lbs = (kg * 2.20462).toFixed(1)
  return `${kg} kg (${lbs} lbs)`
}
