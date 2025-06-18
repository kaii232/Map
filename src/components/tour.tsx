"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverAnchor } from "@radix-ui/react-popover";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { X } from "lucide-react";
import {
  ComponentProps,
  createContext,
  memo,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

const stepAtom = atom(0);
const tourHighlightDimsAtom = atom<{
  width: number;
  height: number;
  left: number;
  top: number;
}>();

export type Steps = {
  /** `dialog` displays the step in a dialog, while `tooltip` displays the tour step over a highlighted component */
  type: "dialog" | "tooltip";
  /** Title to show in the dialog or tooltip */
  title: string;
  /** Description of the dialog or tooltip */
  description: string;
  /** Function to run when before the current step */
  beforeStep?: () => void;
  /** Function to run before moving on to the next step */
  afterStep?: () => void;
  /** Function to run when moving to the previous step */
  goBackStep?: () => void;
}[];

// Using context instead of atom so the steps is set to the prop when the component is rendered. Is it cursed to mix the two? Yes. Does it also work? Yes.
const TourContext = createContext<{
  steps: Steps;
  onComplete?: () => void;
}>({ steps: [] });

const TourRoot = memo(
  ({
    steps,
    tourId,
    children,
    shouldRememberCompletion = true,
  }: {
    steps: Steps;
    tourId: string;
    children: ReactNode;
    shouldRememberCompletion?: boolean;
  }) => {
    // This uses 1 based indexing
    // When step is 0 tour is not active
    const [step, setStep] = useAtom(stepAtom);
    const dimensions = useAtomValue(tourHighlightDimsAtom);

    const onComplete = useCallback(() => {
      setStep(0);
      if (shouldRememberCompletion)
        localStorage.setItem(`tour-complete-${tourId}`, "true");
    }, [setStep, shouldRememberCompletion, tourId]);

    // Start tour automatically if the user has not completed the tour yet
    useEffect(() => {
      if (!shouldRememberCompletion) {
        setStep(1);
        return;
      }

      if (!localStorage.getItem(`tour-complete-${tourId}`)) {
        setStep(1);
      }
    }, [setStep, shouldRememberCompletion, tourId]);

    // Only run the beforeStep function for dialog types as the TourStep component runs it for tooltip types
    useEffect(() => {
      if (step <= 0 || step >= steps.length) return;
      if (steps[step].type === "dialog" && steps[step].beforeStep) {
        steps[step].beforeStep();
      }
    }, [step, steps]);

    const value = useMemo(
      () => ({
        steps,
        onComplete,
      }),
      [onComplete, steps],
    );

    return (
      <TourContext.Provider value={value}>
        {children}
        {steps[step - 1] && steps[step - 1].type === "dialog" && (
          <Dialog open={steps[step - 1].type === "dialog"} modal>
            <DialogContent
              overlay={false}
              closeButton={false}
              className="data-[state=closed]:duration-0"
            >
              <DialogHeader>
                <span className="text-sm text-neutral-400">
                  {step} of {steps.length}
                </span>
                <DialogTitle>{steps[step - 1].title}</DialogTitle>
                <DialogDescription>
                  {steps[step - 1].description}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                {step > 1 && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (steps[step - 1].goBackStep)
                        steps[step - 1].goBackStep!();
                      setStep((prev) => prev - 1);
                    }}
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={() => {
                    if (steps[step - 1].afterStep) steps[step - 1].afterStep!();
                    if (step < steps.length) setStep((prev) => prev + 1);
                    else onComplete();
                  }}
                >
                  {step === steps.length ? "End Tour" : "Next"}
                </Button>
              </DialogFooter>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 size-6"
                    aria-label="Skip tour"
                    onClick={onComplete}
                  >
                    <X />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Skip tour</TooltipContent>
              </Tooltip>
            </DialogContent>
          </Dialog>
        )}
        {steps[step - 1] &&
          createPortal(
            <div
              className="fixed inset-0 z-50 bg-neutral-800/80"
              style={
                dimensions && steps[step - 1].type === "tooltip" // Paste into https://yqnn.github.io/svg-path-editor/ for a visualisation of what this is doing
                  ? {
                      clipPath: `path("M ${window.innerWidth} ${window.innerHeight} H 0 V 0 H ${window.innerWidth} V ${window.innerHeight} Z M ${dimensions.left} ${dimensions.top - 8} a 8 8 0 0 0 -8 8 v ${dimensions.height} a 8 8 0 0 0 8 8 h ${dimensions.width} a 8 8 0 0 0 8 -8 v ${-dimensions.height} a 8 8 0 0 0 -8 -8 Z")`,
                    }
                  : undefined
              }
            ></div>,
            document.body,
          )}
      </TourContext.Provider>
    );
  },
);

TourRoot.displayName = "TourRoot";

/** Displays a tooltip around a child element */
const TourStep = ({
  children,
  step,
  localBeforeStep,
  localAfterStep,
  localGoBackStep,
}: {
  /** Step of the tour to show tooltip */
  step: number;
  /** Element to highlight for this step */
  children: ReactNode;
  /** Function to run before the current step */
  localBeforeStep?: () => void;
  /** Function to run before the next step */
  localAfterStep?: () => void;
  /** Function to run when moving to the previous step */
  localGoBackStep?: () => void;
}) => {
  const [currentStep, setStep] = useAtom(stepAtom);
  const { steps, onComplete } = useContext(TourContext);
  const setDimensions = useSetAtom(tourHighlightDimsAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  const ticking = useRef<boolean>(false);
  const frameId = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const onResize = () => {
      if (ticking.current) return;
      if (!container) return;
      setDimensions(container.getBoundingClientRect());
      // This throttles the event so less calls are fired at about 60fps (16.67ms per frame)
      setTimeout(() => (ticking.current = false), 16.67);
      ticking.current = true;
    };

    // This function constantly runs to update the position of the highlight
    const frameLoop = () => {
      onResize();
      frameId.current = requestAnimationFrame(frameLoop);
    };

    if (currentStep === step) {
      // Scroll the element to vertical center of the screen
      container.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      frameLoop();
      // Run before steps if any
      if (steps[step - 1].beforeStep) steps[step - 1].beforeStep!();
      if (localBeforeStep) localBeforeStep();
    }

    return () => {
      cancelAnimationFrame(frameId.current); // Stop running the frameLoop function
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  if (!steps[step - 1]) throw new Error("Step is not defined!");

  return (
    <Popover open={step === currentStep} modal>
      <PopoverAnchor asChild ref={containerRef}>
        {children}
      </PopoverAnchor>
      <PopoverContent
        className="flex flex-col gap-2 data-[side=left]:-translate-x-[min(0px,var(--radix-popover-content-available-width)-18rem)] data-[side=right]:translate-x-[min(0px,var(--radix-popover-content-available-width)-18rem)]"
        sideOffset={12}
        side="right"
        sticky="always"
        avoidCollisions
      >
        <span className="text-sm text-neutral-400">
          {step} of {steps.length}
        </span>
        <h1
          className={
            "text-lg font-semibold leading-none tracking-tight text-neutral-50"
          }
        >
          {steps[step - 1].title}
        </h1>
        <p className={"text-sm text-neutral-300"}>
          {steps[step - 1].description}
        </p>
        <div className="flex flex-row justify-end pt-2 sm:space-x-2">
          {step > 1 && (
            <Button
              variant="ghost"
              onClick={() => {
                if (steps[step - 1].goBackStep) steps[step - 1].goBackStep!();
                if (localGoBackStep) localGoBackStep();
                setStep((prev) => prev - 1);
              }}
            >
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={() => {
              if (steps[step - 1].afterStep) steps[step - 1].afterStep!();
              if (localAfterStep) localAfterStep();
              if (step < steps.length) setStep((prev) => prev + 1);
              else if (onComplete) onComplete();
            }}
          >
            {step === steps.length ? "End Tour" : "Next"}
          </Button>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 size-6"
              aria-label="Skip tour"
              onClick={onComplete}
            >
              <X />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Skip tour</TooltipContent>
        </Tooltip>
      </PopoverContent>
    </Popover>
  );
};

/** Button to start the tour. Using a raw button instead of button component because it's easier to make it into the map control style */
const TourStart = (props: ComponentProps<"button">) => {
  const setStep = useSetAtom(stepAtom);
  return (
    <button
      {...props}
      onClick={() => {
        setStep(1);
      }}
    />
  );
};

export { TourRoot, TourStart, TourStep };
