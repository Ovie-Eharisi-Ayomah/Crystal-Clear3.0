import { DivideIcon as LucideIcon } from 'lucide-react';

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

export type UserType = 'homeowner' | 'cleaner';