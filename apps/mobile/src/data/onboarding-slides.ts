export interface OnboardingSlide {
  id: string;
  title: string;
  description: string;
  icon: "shopping-bag" | "run" | "wallet";
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: "1",
    title: "Need something?",
    description:
      "Post an errand — what you need, where to buy it, where to bring it. Pay upfront, we hold it safely.",
    icon: "shopping-bag",
  },
  {
    id: "2",
    title: "A Scout delivers",
    description:
      "A verified Scout nearby picks it up and brings it to you. Chat with them the whole way.",
    icon: "run",
  },
  {
    id: "3",
    title: "Or earn as a Scout",
    description:
      "Run errands for other students in your free time and get paid weekly for every delivery.",
    icon: "wallet",
  },
];