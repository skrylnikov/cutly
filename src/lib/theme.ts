import { createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'indigo',
  colors: {
    indigo: [
      '#eef2ff',
      '#e0e7ff',
      '#c7d2fe',
      '#a5b4fc',
      '#818cf8',
      '#6366f1',
      '#4F46E5', // Основной цвет из favicon
      '#4338ca',
      '#3730a3',
      '#312e81',
    ],
    violet: [
      '#f5f3ff',
      '#ede9fe',
      '#ddd6fe',
      '#c4b5fd',
      '#a78bfa',
      '#8b5cf6',
      '#7C3AED', // Вторичный цвет из favicon
      '#6d28d9',
      '#5b21b6',
      '#4c1d95',
    ],
  },
  defaultRadius: 'md',
})

