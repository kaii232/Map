import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2.5 w-full grow overflow-hidden rounded-full bg-neutral-800">
      <SliderPrimitive.Range className="absolute h-full bg-neutral-300" />
    </SliderPrimitive.Track>

    {props.defaultValue?.map((_, index) => (
      <SliderPrimitive.Thumb
        key={index}
        className="ring-offset-background block h-5 w-5 rounded-full border-2 border-neutral-300 bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
      />
    ))}
    {!props.defaultValue &&
      props.value?.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          className="ring-offset-background block h-5 w-5 rounded-full border-2 border-neutral-300 bg-neutral-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
        />
      ))}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
