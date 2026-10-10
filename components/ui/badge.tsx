import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-foreground",
        accent: "border-transparent bg-accent text-accent-foreground",
        stage: "border-white/15 bg-white/10 text-stage-foreground",
        moss: "border-transparent bg-moss text-white",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
