"use client";

import { useEffect, useState } from "react";
import styles from "./Navigation.module.scss";
import { AppContext } from "../context";
import { usePathname } from "next/navigation";
import { NavLink } from "./NavLink";

export default function Navigation({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isNavExpanded, setNavExpanded] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setNavExpanded(false);
  }, [pathname]);

  const handleExpand = () => {
    setNavExpanded(!isNavExpanded);
  };

  return (
    <AppContext.Provider value={{ isNavExpanded }}>
      <div
        className={`${styles.navigationContainer} ${
          isNavExpanded ? styles.expanded : ""
        }`}
      >
        <nav>
          <ul>
            <li>
              <NavLink href="/">3D</NavLink>
            </li>
            <li>
              <NavLink href="/weather">Charts</NavLink>
            </li>
          </ul>
          <div className={styles.hamburgerMenu}>
            <input
              type="checkbox"
              id="menu-toggle"
              className={styles.toggle}
              onChange={handleExpand}
            />

            <label
              htmlFor="menu-toggle"
              className={`${styles.hamburger} ${
                isNavExpanded ? styles.checked : ""
              }`}
            >
              <span></span>
              <span></span>
              <span></span>
            </label>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    </AppContext.Provider>
  );
}
