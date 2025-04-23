"use client";

import { Button, ButtonProps } from "@/components/ui/button";
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
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { createPortal } from "react-dom";

const stepAtom = atom(0);
const tourHighlightDimsAtom = atom<{
  width: number;
  height: number;
  left: number;
  top: number;
}>();
const tourCompletedAtom = atom(false);

export type Steps = {
  /** `dialog` displays the step in a dialog, while `tooltip` displays the tour step over a highlighted component */
  type: "dialog" | "tooltip";
  /** Title to show in the dialog or tooltip */
  title: string;
  /** Description of the dialog or tooltip */
  description: string;
  /** Callback to run when during the current step */
  actions?: () => void;
}[];

const TourContext = createContext<{
  steps: Steps;
  onComplete?: () => void;
}>({ steps: [] });

const TourRoot = ({
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
  const [step, setStep] = useAtom(stepAtom);
  const [completed, setCompleted] = useAtom(tourCompletedAtom);
  const dimensions = useAtomValue(tourHighlightDimsAtom);

  const onComplete = useCallback(() => {
    setCompleted(true);
    setStep(0);
    if (shouldRememberCompletion)
      localStorage.setItem(`tourComplete-${tourId}`, "true");
  }, [setCompleted, setStep, shouldRememberCompletion, tourId]);

  // Start tour automatically if the user has not completed the tour yet
  useEffect(() => {
    if (!shouldRememberCompletion) {
      setStep(1);
      setCompleted(false);
      return;
    }
    const pastCompletion = localStorage.getItem(`tourComplete-${tourId}`);
    setCompleted(!!pastCompletion);
    if (!pastCompletion) {
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      steps,
      onComplete,
    }),
    [onComplete, steps],
  );

  if (completed) return children;

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
                  onClick={() => setStep((prev) => prev - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                onClick={
                  step < steps.length
                    ? () => setStep((prev) => prev + 1)
                    : onComplete
                }
              >
                {step === steps.length ? "End Tour" : "Next"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {steps[step - 1] &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-neutral-800/80"
            style={
              dimensions && steps[step - 1].type === "tooltip"
                ? {
                    clipPath: `path("M ${window.innerWidth} ${window.innerHeight} H 0 V 0 H ${window.innerWidth} V ${window.innerHeight} Z M ${dimensions.left} ${dimensions.top - 4} a 4 4 0 0 0 -4 4 v ${dimensions.height} a 4 4 0 0 0 4 4 h ${dimensions.width} a 4 4 0 0 0 4 -4 v ${-dimensions.height} a 4 4 0 0 0 -4 -4 Z")`,
                  }
                : undefined
            }
          ></div>,
          document.body,
        )}
    </TourContext.Provider>
  );
};

const TourStep = ({
  children,
  step,
}: {
  step: number;
  children: ReactNode;
}) => {
  const [currentStep, setStep] = useAtom(stepAtom);
  const { steps, onComplete } = useContext(TourContext);
  const completed = useAtomValue(tourCompletedAtom);
  const setDimensions = useSetAtom(tourHighlightDimsAtom);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!containerRef.current) return;
    const onResize = () => {
      if (!containerRef.current) return;
      console.log("Setting");
      setDimensions(containerRef.current.getBoundingClientRect());
    };
    if (currentStep === step) {
      containerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setDimensions(containerRef.current.getBoundingClientRect());
      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", onResize);
      if (steps[step - 1].actions) steps[step - 1].actions!();
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  if (completed) return children;

  if (!steps[step - 1]) throw new Error("Step is not defined!");

  return (
    <Popover open={step === currentStep} modal>
      <PopoverAnchor asChild ref={containerRef}>
        {children}
      </PopoverAnchor>
      <PopoverContent className="space-y-2" sideOffset={8} align="center">
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
            <Button variant="ghost" onClick={() => setStep((prev) => prev - 1)}>
              Back
            </Button>
          )}
          <Button
            type="button"
            onClick={
              step < steps.length
                ? () => setStep((prev) => prev + 1)
                : onComplete
            }
          >
            {step === steps.length ? "End Tour" : "Next"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const TourStart = (props: ButtonProps) => {
  const setStep = useSetAtom(stepAtom);
  const setCompleted = useSetAtom(tourCompletedAtom);
  return (
    <Button
      {...props}
      onClick={() => {
        setStep(1);
        setCompleted(false);
      }}
    >
      Start Tour
    </Button>
  );
};

export { TourRoot, TourStart, TourStep };
