import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

export function PageContainer({ children, className, size = "lg" }: PageContainerProps) {
  return (
    <main className={cn("mx-auto w-full py-12", sizes[size], className)}>
      {children}
    </main>
  );
}
