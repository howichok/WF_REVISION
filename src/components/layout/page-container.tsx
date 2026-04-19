import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-[110rem]",
};

export function PageContainer({ children, className, size = "lg" }: PageContainerProps) {
  return (
    <main className={cn("mx-auto w-full px-4 py-10 sm:px-6 sm:py-12 lg:px-8", sizes[size], className)}>
      {children}
    </main>
  );
}
