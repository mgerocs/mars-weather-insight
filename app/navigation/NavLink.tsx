import Link from "next/link";
import { usePathname } from "next/navigation";

import styles from "./Navlink.module.scss";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={`${isActive ? styles.active : ""}`}>
      {children}
    </Link>
  );
}
