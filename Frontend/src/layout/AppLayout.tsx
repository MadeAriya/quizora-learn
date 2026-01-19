import { SidebarProvider, useSidebar } from "../context/SidebarContext";
import { Navigate, Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/loading/LoadingScreen";

const LayoutContent: React.FC = () => {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-4xl) md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};


const AppLayout: React.FC = () => {
  const { currentUser, loading } = useAuth();

  // show loading state while checking authentication
  if (loading) {
    return <LoadingScreen />
  }

  // check if user is authenticated
  if (!currentUser) {
    return <Navigate to={"/signin"} />
  }

  // return to element
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
