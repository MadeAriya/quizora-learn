import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function GuestRoute() {
    const { currentUser } = useAuth();

    // check if user is authenticated
    if (currentUser) {
        return <Navigate to={"/"} />
    }


    // return react outlet
    return <>
        <Outlet />
    </>
}