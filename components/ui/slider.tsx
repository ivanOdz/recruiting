'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value = [0], onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = [Number(e.target.value)]
      onValueChange?.(newValue)
    }

    return (
      <div className="relative flex w-full touch-none select-none items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleChange}
          className={cn(
            'relative h-2 w-full cursor-pointer appearance-none rounded-full bg-secondary',
            className
          )}
          style={{
            background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((value[0] - min) / (max - min)) * 100}%, var(--secondary) ${((value[0] - min) / (max - min)) * 100}%, var(--secondary) 100%)`
          }}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }

