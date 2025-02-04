import { Navigate } from "react-router-dom";

const HomeRedirect = () => {


  let activeWorkspaceId = 1;
  if (activeWorkspaceId) {
    return <Navigate to={`ws/${activeWorkspaceId}`} replace />;
  }
  
  return <Navigate to="create-workspace" replace />;
};

export default HomeRedirect; 