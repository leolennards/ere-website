export interface NavItem {
  href: string;
  label: string;
  description?: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/buy", label: "Buy" },
  { href: "/rent", label: "Rent" },
  {
    href: "/sell",
    label: "Sell",
    children: [
      { href: "/sell", label: "Sell your property", description: "How ERE takes you from mandate to registration" },
      { href: "/valuation", label: "Property valuation", description: "Ask an agent to assess your home" },
      { href: "/bond-calculator", label: "Bond calculator", description: "Estimate monthly home-loan repayments" },
    ],
  },
  { href: "/about", label: "About ERE" },
  { href: "/contact", label: "Contact" },
];

export function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
