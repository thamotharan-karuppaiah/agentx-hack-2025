
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useParams } from "react-router-dom";
import Logo from "@/assets/images/logo.svg";



export function WorkspaceSwitcher() {
  const { isMobile } = useSidebar();
  const allWorkspaces = [{
    name: "AgentX",
    id: "1"
  }];
  const { workspaceId = "1" } = useParams();
  const activeWorkspace = allWorkspaces?.find((workspace) => workspace.id.toString() === workspaceId);



  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
            <span className="text-sm font-medium">
              <img src={Logo} alt="Logo" className="w-6 h-6" />
            </span>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">
              {activeWorkspace?.name}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
