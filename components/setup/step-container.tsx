import { FC, useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

interface StepContainerProps {
  stepDescription: string
  stepNum: number
  totalSteps: number
  stepTitle: string
  onShouldProceed: (shouldProceed: boolean) => void
  children?: React.ReactNode
  showBackButton?: boolean
  showNextButton?: boolean
}

export const StepContainer: FC<StepContainerProps> = ({
  stepDescription,
  stepNum,
  totalSteps,
  stepTitle,
  onShouldProceed,
  children,
  showBackButton = false,
  showNextButton = true
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (buttonRef.current) {
        buttonRef.current.click()
      }
    }
  }

  return (
    <Card
      className="w-full overflow-auto sm:mx-3 sm:w-[600px]"
      onKeyDown={handleKeyDown}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex justify-between text-lg sm:text-2xl">
          <div>{stepTitle}</div>

          <div className="text-sm">
            {stepNum} / {totalSteps}
          </div>
        </CardTitle>

        <CardDescription>{stepDescription}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">{children}</CardContent>

      <CardFooter className="flex justify-between">
        <div>
          {showBackButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onShouldProceed(false)}
            >
              Back
            </Button>
          )}
        </div>

        <div>
          {showNextButton && (
            <Button
              ref={buttonRef}
              size="sm"
              onClick={() => onShouldProceed(true)}
            >
              Next
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}
