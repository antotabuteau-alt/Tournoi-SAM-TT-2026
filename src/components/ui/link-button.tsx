import Link from "next/link";
import { buttonClasses, type BUTTON_SIZES, type BUTTON_VARIANTS } from "./button";

interface LinkButtonProps extends React.ComponentProps<typeof Link> {
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: keyof typeof BUTTON_SIZES;
}

/** Comme <Button>, mais rend un <a> (via next/link) — jamais imbriquer <Button> dans <Link>. */
export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: LinkButtonProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
