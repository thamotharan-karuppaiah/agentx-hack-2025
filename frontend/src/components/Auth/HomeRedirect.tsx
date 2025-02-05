import { Navigate } from "react-router-dom";

const HomeRedirect = () => {

  // read query parma wsId
  const searchParams = new URLSearchParams(window.location.search);
  const wsId = searchParams.get('wsId');

  let activeWorkspaceId = wsId || 1;
  if (activeWorkspaceId) {
    return <Navigate to={`ws/${activeWorkspaceId}`} replace />;
  }
  
  return <Navigate to="create-workspace" replace />;
};

export default HomeRedirect; 