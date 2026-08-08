import {
  LayoutDashboard, ShieldCheck, AlertTriangle, ListChecks,
  Users, Banknote, Receipt, Settings,
} from "lucide-react";

export const NAV_SECTIONS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/verification", label: "Verification", icon: ShieldCheck },
  { href: "/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/errands", label: "Errands", icon: ListChecks },
  { href: "/accounts", label: "Accounts", icon: Users },
  { href: "/payouts", label: "Payouts", icon: Banknote },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;
