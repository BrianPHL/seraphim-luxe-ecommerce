import { useEffect } from 'react';
import { useLocation, BrowserRouter as Router, Routes, Route } from 'react-router';
import { Header, Footer, OTPModal } from '@components';
import { useAuth } from '@contexts';
import { ProtectedRoute } from '@routes';
import { Home, SignIn, SignUp, AboutUs, Reservations, Cart, Profile, NotFound } from '@pages';
import { Store as MotorcyclesStore, ProductPage as MotorcyclesProductPage } from '@pages/Motorcycles';
import { Store as PartsAndAccessoriesStore, ProductPage as PartsAndAccessoriesProductPage } from '@pages/PartsAndAccessories';
import { AdminLayout, AdminDashboard, AdminProducts, AdminReservations, AdminStocks, AdminInstallments } from '@pages/Admin';

const PAGE_TITLES = {
	"/": "Seraphim Luxe | Style Without Boundaries",
	"/sign-in": "Seraphim Luxe | Sign In",
	"/sign-up": "Seraphim Luxe | Sign Up",
	"/about-us": "Seraphim Luxe | About Us",
	"/motorcycles": "Seraphim Luxe | Motorcycles",
	"/parts-and-accessories": "Seraphim Luxe | Parts & Accessories",
	"/reservations": "Seraphim Luxe | Reservations",
	"/cart": "Seraphim Luxe | Cart",
	"/profile": "Seraphim Luxe | Profile",
	"/admin": "Seraphim Luxe | Admin Dashboard",
	"/admin/products": "Seraphim Luxe | Admin Products",
	"/admin/reservations": "Seraphim Luxe | Admin Reservations",
	"/admin/stocks": "Seraphim Luxe | Admin Stocks",
	"/admin/installments": "Seraphim Luxe | Admin Installments",
};

const App = () => {

    const { user, otpModalData, handleOTPSuccess, hideOTP, loading } = useAuth();
    const location = useLocation();	
    
    useEffect(() => {
      document.title = PAGE_TITLES[location.pathname] || PAGE_TITLES["/"];
      window.scrollTo(0, 0);
    }, [ location.pathname ]);

    if (loading)
        return <div>Loading...</div>;

    return (
        <>
            <Header />
            <Routes>

                <Route path="/" element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } />
                
                <Route path="/about-us" element={
                    <ProtectedRoute>
                        <AboutUs />
                    </ProtectedRoute>
                } />
                
                <Route path="/motorcycles" element={
                    <ProtectedRoute>
                        <MotorcyclesStore />
                    </ProtectedRoute>
                } />
                
                <Route path="/motorcycles/:product_id" element={
                    <ProtectedRoute>
                        <MotorcyclesProductPage />
                    </ProtectedRoute>
                } />
                
                <Route path="/parts-and-accessories" element={
                    <ProtectedRoute>
                        <PartsAndAccessoriesStore />
                    </ProtectedRoute>
                } />
                
                <Route path="/parts-and-accessories/:product_id" element={
                    <ProtectedRoute>
                        <PartsAndAccessoriesProductPage />
                    </ProtectedRoute>
                } />

                <Route path="/sign-in/*" element={
                    <ProtectedRoute>
                        <SignIn />
                    </ProtectedRoute>
                } />

                <Route path="/sign-up/*" element={
                    <ProtectedRoute>
                        <SignUp />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
                
                <Route path="/reservations" element={
                    <ProtectedRoute>
                        <Reservations />
                    </ProtectedRoute>
                } />

                <Route path="/cart" element={
                    <ProtectedRoute>
                        <Cart />
                    </ProtectedRoute>
                } />

                <Route path="/admin" element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="reservations" element={<AdminReservations />} />
                    <Route path="stocks" element={<AdminStocks />} />
                    <Route path="installments" element={<AdminInstallments />} />
                </Route>

                <Route path="*" element={
                    <ProtectedRoute>
                        <NotFound />
                    </ProtectedRoute>
                } />

            </Routes>

            <OTPModal
                isOpen={ otpModalData.show }
                onClose={ hideOTP }
                type={ otpModalData.type }
                email={ otpModalData.email }
                onSuccess={ handleOTPSuccess }
            />

            <Footer />
        </>
      );
};

export default App;
