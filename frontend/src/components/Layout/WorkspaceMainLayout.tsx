import { useEffect } from "react";
import { Outlet, useParams, useNavigate, useLocation } from "react-router-dom";
import { Brain, WorkflowIcon } from "lucide-react";

import { SidebarInset } from "../ui/sidebar";
import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "../Sidebar/AppSidebar";
import { registerWorkspaceContext, unregisterWorkspaceContext } from "@/utils/analytics";

const TabNavigation = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const currentPath = location.pathname; // Get the first segment of the path

	const tabs = [
		{
			title: "Agents",
			url: "ws/1/agents",
			icon: Brain
		},
		{
			title: "Workflows",
			url: "ws/1/workflows",
			icon: WorkflowIcon
		}
	];

	return (
		<div className="flex items-center border-b border-gray-200 px-4 md:px-8 sticky top-0 bg-white z-10">
			{tabs.map((tab) => {
				const Icon = tab.icon;
				const isActive = currentPath.includes(tab.url);
				return (
					<button
						key={tab.url}
						onClick={() => navigate(`/${tab.url}`)}
						className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${isActive
								? 'border-blue-500 text-blue-600'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
							}`}
					>
						<Icon className="w-4 h-4" />
						{tab.title}
					</button>
				);
			})}
		</div>
	);
};

const WorkspaceMainLayout = () => {
	const { workspaceId = "1" } = useParams();
	const isInIframe = window.self !== window.top;

	// set the active workspace id in the local storage, required for the access out of react router context
	useEffect(() => {
		if (workspaceId) {
			sessionStorage.setItem("ACTIVE_WORKSPACE_ID", workspaceId);
			// Register workspace context in PostHog with properties
			const workspace = {
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
			{!isInIframe && <AppSidebar />}
			<SidebarInset className={`min-w-0 max-h-0 ${isInIframe ? 'ml-0' : ''}`}>
				{isInIframe && <TabNavigation />}
				<div className={`flex flex-col [&>*:not(.ignore-layout-padding)]:p-4 [&>*:not(.ignore-layout-padding)]:md:p-8 [&>*:not(.ignore-layout-padding)]:md:pb-0 
					${isInIframe ? 'ml-0 min-h-[calc(100%-48px)]' : 'min-h-full '}`}>
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	);
};

export default WorkspaceMainLayout;
