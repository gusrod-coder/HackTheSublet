/** Incoming lane wrapper. LANE: h2. Tokens and fonts come from app/globals.css + app/layout.tsx (h1). */
import styles from "@/components/incoming/incoming.module.css";

export default function IncomingLayout({ children }: { children: React.ReactNode }) {
  return <div className={styles.screen}>{children}</div>;
}
