import * as React from "react";
import {
  Frame,
  PieChart,
  Settings,
  WorkflowIcon,
  Brain,
} from "lucide-react";

import { NavMain } from "./NavMain";
import { NavSecondary } from "./NavSecondary";
import { NavUser } from "./NavUser";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";
import { SidebarToggle } from "./SidebarToggle";
import { useEffect } from "react";

const SIDEBAR_STATE_KEY = 'sidebar-state';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, toggleSidebar } = useSidebar();

  // Set initial state from localStorage on mount
  useEffect(() => {
    const storedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    if (storedState === 'collapsed' || storedState === 'expanded') {
      // Need to check if the current state is different to avoid unnecessary toggles
      if (storedState === 'collapsed' && state === 'expanded') {
        toggleSidebar();
      } else if (storedState === 'expanded' && state === 'collapsed') {
        toggleSidebar();
      }
    }
  }, []); // Run only on mount

  // Store state changes in localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, state);
  }, [state]);

  const navigation = {
    navMain: [
      
      {
        title: "Workflows",
        url: "workflows",
        icon: WorkflowIcon,
        isVisible: true
      },
      {
        title: "Agents",
        url: "agents",
        icon: Brain,
        isVisible: true
      }
    ],
    navSecondary: [
      {
        name: "What's new",
        url: "https://www.freshworks.com/product-launches/?tactic_id=6778534",
        icon: Frame,
        external: true,
        isVisible: () => true
      },
      {
        name: "Help and support",
        url: "https://www.freshworks.com/freshdesk/omni/freddy-ai-automation/",
        icon: PieChart,
        external: true,
        isVisible: () => true
      },
      {
        name: "Settings",
        url: "/",
        icon: Settings,
        external: false,
        isVisible: true
      }
    ]
  };

  return (
    <Sidebar
      className="border-none"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navigation.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavSecondary items={navigation.navSecondary} />
        <NavUser />
      </SidebarFooter>
      <SidebarRail>
        <SidebarToggle />
      </SidebarRail>
    </Sidebar>
  );
}
