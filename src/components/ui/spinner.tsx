import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Loader2Icon } from "lucide-react";

// 16, 20 or 24 px like the Figma Spinner set. The icon takes the text color of what it sits
// in. Inside a Button pass size="sm": a size class here wins over the Button's own icon size.
const spinnerVariants = cva("animate-spin", {
  variants: {
    size: {
      sm: "size-4",
      default: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function Spinner({
  className,
  size,
  ...props
}: Omit<React.ComponentProps<"svg">, "size"> &
  VariantProps<typeof spinnerVariants>) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Đang tải"
      className={cn(spinnerVariants({ size, className }))}
      {...props}
    />
  );
}

export { Spinner };
