import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import UserLayout from "./components/Layout/UserLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import CollectionPage from "./pages/CollectionPage";
import ProductDetails from "./components/Products/ProductDetails";
import Checkout from "./components/Cart/Checkout";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import MyOrdersPage from "./pages/MyOrdersPage";

const App = () => {
  return (
   <BrowserRouter>
   <Toaster position="top-right"/>
   <Routes>
  
    {/* User Layout */}
    <Route path="/" element={<UserLayout /> }>
      <Route index element={<Home />} />
      <Route path="login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="profile" element={<Profile />} />
      <Route path="collection/:collection" element={<CollectionPage />} />
      <Route path="product/:id" element={<ProductDetails />} />
      <Route path="checkout" element={<Checkout />} />
      <Route path="order-confirmation" element={<OrderConfirmationPage />} />
      <Route path="order/:id" element={<OrderDetailsPage />} />
      <Route path="my-orders" element={<MyOrdersPage />} />
     </Route>
    <Route>{/* Admin Layout */}</Route>
   </Routes>
   </BrowserRouter>
  );
};

export default App;