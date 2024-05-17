import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import Home from "../views/Home";
import Dial from "../views/Dial"; 
import Error404 from "../views/Error404";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Home/>,
        errorElement: <Error404/>
    },
    {
        path: '/dial',
        element: <Dial/>,
    }
]);

const MyRoutes = () => {
    return (
        <RouterProvider router={router} />
    );
}

export default MyRoutes;