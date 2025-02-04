import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom";
import WorkspaceMainLayout from "./components/Layout/WorkspaceMainLayout";
import HomeRedirect from "@/components/Auth/HomeRedirect";
import NotFound from "@/components/Error/NotFound";
import WorkflowMain from "./features/Workflow/WorkflowList";
import WorkflowDetails from "@/features/Workflow/WorkflowDetails/WorkflowDetails";
import RunOnce from "@/features/Workflow/WorkflowDetails/WorkflowRun/RunOnce";
import RunSchedule from "@/features/Workflow/WorkflowDetails/WorkflowRun/RunSchedule";
import WorkflowHistory from "@/features/Workflow/WorkflowDetails/WorkflowHistory";
import WorkflowAnalytics from "@/features/Workflow/WorkflowDetails/WorkflowAnalytics";
import WorkflowIntegrate from "@/features/Workflow/WorkflowDetails/WorkflowIntegrate";
import { WorkflowEdit } from "./features/Workflow/WorkflowEdit";
import AgentHome from "./features/Agents/AgentHome";
import AgentDetails from "./features/Agents/AgentDetails";

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/" element={<Outlet />}>
        <Route path="" element={<HomeRedirect />} />
        <Route path="ws/:workspaceId" element={<WorkspaceMainLayout />}>
          <Route path="" element={<Navigate to="workflows" replace />} />
          <Route path="workflows" element={<WorkflowMain />} />
          <Route path="workflows/:workflowId/edit" element={<WorkflowEdit />} />
          <Route path="workflows/:workflowId" element={<WorkflowDetails />}>
            <Route index element={<Navigate to="run/once" replace />} />
            <Route path="run">
              <Route index element={<Navigate to="once" replace />} />
              <Route path="once" element={<RunOnce />} />
              <Route path="schedule" element={<RunSchedule />} />
            </Route>
            <Route path="history" element={<WorkflowHistory />} />
            <Route path="analytics" element={<WorkflowAnalytics />} />
            <Route path="integrate" element={<WorkflowIntegrate />} />
          </Route>
          <Route path="agents" element={<AgentHome />} />
          <Route path="agents/:agentId" element={<AgentDetails />} />
          {/* <Route path="*" element={<Navigate to="/404" replace />} /> */}
        </Route>
        {/* <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} /> */}
      </Route>
    </Routes>
  </Router>
);

export default AppRoutes;
