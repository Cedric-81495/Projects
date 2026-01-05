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
import AdminLayout from "./components/Admin/AdminLayout";
import AdminHomePage from "./pages/AdminHomePage";
import UserManagement from "./components/Admin/UserManagement";
import ProductManagement from "./components/Admin/ProductManagement";
import EditProductPage from "./components/Admin/EditProductPage";
import OrderManagement from "./components/Admin/OrderManagement";
import ScrollToTop from "./components/Common/ScrollToTop";
import ProtectedRoute from "../src/components/Common/ProtectedRoute";

import { Provider } from "react-redux";
import store from "../redux/store";

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
       <ScrollToTop />
        <Toaster position="top-right" />
        <Routes>
          {/* User Layout */}
          <Route path="/" element={<UserLayout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />

            <Route path="profile" element={
               <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="collections/:collection" element={<CollectionPage />} />
            <Route path="product/:id" element={<ProductDetails />} />
            <Route path="checkout" element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>} />
            <Route path="order-confirmation" element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>} />
            <Route path="order/:id" element={
              <ProtectedRoute>
                <OrderDetailsPage />
              </ProtectedRoute>
              } />
            <Route path="my-orders" element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>} />
          </Route>

          {/* Admin Layout */}
          <Route path="/admin" element={ 
            <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>}>
            <Route index element={<AdminHomePage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="products/:id/edit" element={<EditProductPage />} />
            <Route path="orders" element={<OrderManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
 
  );
};

export default App;