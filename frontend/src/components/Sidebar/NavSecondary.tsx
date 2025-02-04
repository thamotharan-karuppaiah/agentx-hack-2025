import { NavLink, useMatch, useResolvedPath } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
}: {
  items: {
    name: string
    url: string
    icon: any
    external?: boolean
  }[]
}) {
  return (
    <SidebarGroup className='pl-0'>
      <SidebarMenu>
        {items.map((item) => {
          // Only use route matching for internal links
          const resolved = !item.external ? useResolvedPath(item.url) : null;
          const match = resolved ? useMatch({ path: resolved.pathname + '/*', end: false }) : false;

          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton className="h-9" isActive={!!match} asChild>
                {item.external ? (
                  <a href={item.url} target="_blank">
                    <item.icon />
                    <span>{item.name}</span>
                    <ArrowUpRight className="ml-auto" />
                  </a>
                ) : (
                  <NavLink to={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </NavLink>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
