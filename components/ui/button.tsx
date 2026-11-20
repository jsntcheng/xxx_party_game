import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-pink-300/70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 text-white shadow-lg shadow-pink-500/25 hover:brightness-110",
        gold: "bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500 text-white shadow-lg shadow-orange-500/25 hover:brightness-110",
        secondary: "border border-white/12 bg-white/8 text-white/90 hover:bg-white/14",
        ghost: "text-white/75 hover:bg-white/10 hover:text-white",
        danger: "bg-rose-500/15 text-rose-200 hover:bg-rose-500/25",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-9",
        "icon-sm": "size-8 rounded-lg",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
