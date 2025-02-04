import { NavLink, useMatch, useResolvedPath } from 'react-router-dom';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LucideIcon } from 'lucide-react';

interface NavMainItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  disabled?: boolean
  disabledMessage?: string
  items?: {
    title: string
    url: string
  }[]
}

function NavMainItem({ item }: { item: NavMainItem }) {
  const resolved = useResolvedPath(item.url);
  const match = useMatch({ path: resolved.pathname + '/*', end: false });

  return (
    <SidebarMenuItem>
      <SidebarMenuButton 
        className='h-9' 
        isActive={!!match} 
        tooltip={item.title} 
        asChild
      >
        <NavLink 
          to={item.url} 
          className={item.disabled ? 'cursor-default opacity-70' : undefined}
          title={item.disabled ? (item.disabledMessage || 'Coming soon') : undefined}
          onClick={item.disabled ? (e) => {e.preventDefault(); e.stopPropagation();} : undefined}
        >
          {item.icon && <item.icon />}
          <span>{item.title}</span>
          {item.disabled && (
            <span className="ml-auto text-[10px] font-medium bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
              Coming Soon
            </span>
          )}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function NavMain({ items }: { items: NavMainItem[] }) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <NavMainItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
