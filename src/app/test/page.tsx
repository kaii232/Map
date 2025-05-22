"use client";

import { TourRoot, TourStart, TourStep } from "@/components/tour";
import { Button } from "@/components/ui/button";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-end gap-48">
      <TourRoot
        tourId="test"
        shouldRememberCompletion={false}
        steps={[
          {
            title: "Test",
            description: "test",
            type: "tooltip",
          },
          {
            title: "Test",
            description: "test",
            type: "tooltip",
          },
          {
            title: "Test",
            description: "test",
            type: "tooltip",
          },
          {
            title: "Test",
            description: "test",
            type: "tooltip",
          },
          {
            title: "Test",
            description: "test",
            type: "tooltip",
          },
          {
            title: "Test",
            description: "test",
            type: "tooltip",
          },
        ]}
      >
        <TourStart />
        <TourStep step={1}>
          <Button>Can I still click this</Button>
        </TourStep>
        <TourStep step={2}>
          <div className="size-10 bg-red-50"></div>
        </TourStep>
        <TourStep step={3}>
          <div className="size-10 bg-red-50"></div>
        </TourStep>
        <TourStep step={4}>
          <div className="size-10 bg-red-50"></div>
        </TourStep>
        <TourStep step={5}>
          <div className="size-10 bg-red-50"></div>
        </TourStep>
        <TourStep step={6}>
          <div className="size-10 bg-red-50"></div>
        </TourStep>
      </TourRoot>
    </main>
  );
}
