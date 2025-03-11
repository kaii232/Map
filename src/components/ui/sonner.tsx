"use client";

import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={"dark"}
      gap={8}
      duration={5000}
      expand
      toastOptions={{
        classNames: {
          title: "font-sans text-sm leading-none",
          description:
            "font-sans text-sm text-neutral-300 group-data-[type='success']:text-green-600 group-data-[type='error']:text-red-600 group-data-[type='warning']:text-orange-600 group-data-[type='info']:text-blue-600",
          toast:
            "border-neutral-600 text-neutral-50 bg-neutral-950 shadow-lg rounded-xl p-4 group border",
          actionButton:
            "bg-neutral-700 text-neutral-50 hover:bg-neutral-700/90 font-sans text-xs border border-neutral-600",
          cancelButton:
            "hover:bg-neutral-100 text-neutral-200 font-sans text-xs",
          error: "!bg-rose-50 !border-rose-200 !text-red-700",
          success: "!bg-emerald-50 !border-emerald-200 !text-green-700",
          warning: "!bg-amber-50 !border-amber-200 !text-orange-700",
          info: "!bg-sky-50 !border-sky-200 !text-blue-700",
          icon: "size-5 [&_svg]:size-5 mr-0",
        },
      }}
      icons={{
        error: <CircleAlert />,
        success: <CircleCheck />,
        warning: <TriangleAlert />,
        info: <Info />,
      }}
      {...props}
    />
  );
};

export { Toaster };
