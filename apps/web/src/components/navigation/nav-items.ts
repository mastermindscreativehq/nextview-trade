import {
  LayoutDashboard,
  LineChart,
  CandlestickChart,
  Briefcase,
  Layers,
  History,
  ArrowLeftRight,
  Star,
  Settings,
  User,
  Bell,
  type LucideIcon,
} from "lucide-react";
import type { Route } from "next";

export interface NavItem {
  title: string;
  href: Route;
  icon: LucideIcon;
}

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Markets", href: "/markets", icon: LineChart },
  { title: "Trade", href: "/markets", icon: CandlestickChart },
  { title: "Portfolio", href: "/portfolio", icon: Briefcase },
  { title: "Positions", href: "/positions", icon: Layers },
  { title: "Orders", href: "/orders", icon: History },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { title: "Watchlist", href: "/watchlist", icon: Star },
];

export const accountNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Profile", href: "/profile", icon: User },
  { title: "Notifications", href: "/notifications", icon: Bell },
];