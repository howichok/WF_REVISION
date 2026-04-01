import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
};

export function PageContainer({ children, className, size = "lg" }: PageContainerProps) {
  return (
    <main className={cn("mx-auto px-6 py-10", sizes[size], className)}>
      {children}
    </main>
  );
}
