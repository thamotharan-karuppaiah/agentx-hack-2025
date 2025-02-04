import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";


import { SidebarInset } from "../ui/sidebar";
import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "../Sidebar/AppSidebar";
import { registerWorkspaceContext, unregisterWorkspaceContext } from "@/utils/analytics";

const WorkspaceMainLayout = () => {
	const { workspaceId = "1" } = useParams();

	// set the active workspace id in the local storage, required for the access out of react router context
	useEffect(() => {
		if (workspaceId) {
			sessionStorage.setItem("ACTIVE_WORKSPACE_ID", workspaceId);
			// Register workspace context in PostHog with properties
			const workspace =  {
				name: "AgentX",
				id: "1"
			}
			if (workspace) {
				registerWorkspaceContext(workspaceId, {
					name: workspace.name,
                    id: workspace.id
				});
			}
		}

		return () => {
			sessionStorage.removeItem("ACTIVE_WORKSPACE_ID");
			unregisterWorkspaceContext();
		};
	}, [workspaceId]);

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset className="min-w-0 max-h-0">
				<div className="flex flex-col min-h-full [&>*:not(.ignore-layout-padding)]:p-4 [&>*:not(.ignore-layout-padding)]:md:p-8 [&>*:not(.ignore-layout-padding)]:md:pb-0">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default WorkspaceMainLayout;
