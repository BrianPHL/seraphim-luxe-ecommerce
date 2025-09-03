import { useEffect } from 'react';
import { useLocation, BrowserRouter as Router, Routes, Route } from 'react-router';
import { Header, Footer, OTPModal } from '@components';
import { useAuth } from '@contexts';
import { ProtectedRoute } from '@routes';
import { Home, SignIn, SignUp, AboutUs, Reservations, Cart, Profile, Orders, Checkout, NotFound } from '@pages';
import { Store as CollectionsStore, ProductPage as CollectionsProductPage } from '@pages/Collections';
import { Store as PartsAndAccessoriesStore, ProductPage as PartsAndAccessoriesProductPage } from '@pages/PartsAndAccessories';
import { AdminLayout, AdminSignIn, AdminSignUp, AdminDashboard, AdminOrders, AdminProducts, AdminStocks, AdminCategories } from '@pages/Admin';

const PAGE_TITLES = {
	"/": "Seraphim Luxe | Style Without Boundaries",
	"/sign-in": "Seraphim Luxe | Sign In",
	"/sign-up": "Seraphim Luxe | Sign Up",
	"/about-us": "Seraphim Luxe | About Us",
	"/collections": "Seraphim Luxe | Collections",
	"/parts-and-accessories": "Seraphim Luxe | Parts & Accessories",
	"/reservations": "Seraphim Luxe | Reservations",
	"/cart": "Seraphim Luxe | Cart",
	"/profile": "Seraphim Luxe | Profile",
    "/orders": "Seraphim Luxe | Orders",
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

            <Routes>

                <Route path="/" element={
                    <ProtectedRoute>
                        <Header />
                            <Home />
                        <Footer />
                    </ProtectedRoute>
                } />
                
                <Route path="/about-us" element={
                    <ProtectedRoute>
                        <Header />
                            <AboutUs />
                        <Footer />
                    </ProtectedRoute>
                } />
                
                <Route path="/collections" element={
                    <ProtectedRoute>
                        <Header />
                            <CollectionsStore />
                        <Footer />
                    </ProtectedRoute>
                } />
                
                <Route path="/collections/:product_id" element={
                    <ProtectedRoute>
                        <Header />
                            <CollectionsProductPage />
                        <Footer />
                    </ProtectedRoute>
                } />

                <Route path="/sign-in/*" element={
                    <ProtectedRoute>
                        <Header />
                            <SignIn />
                        <Footer />
                    </ProtectedRoute>
                } />

                <Route path="/sign-up/*" element={
                    <ProtectedRoute>
                        <Header />
                            <SignUp />
                        <Footer />
                    </ProtectedRoute>
                } />

                <Route path="/profile" element={
                    <ProtectedRoute>
                        <Header />
                            <Profile />
                        <Footer />
                    </ProtectedRoute>
                } />

                <Route path="/orders" element={
                    <ProtectedRoute>
                        <Header />
                            <Orders />
                        <Footer />
                    </ProtectedRoute>
                } />

                <Route path="/cart" element={
                    <ProtectedRoute>
                        <Header />
                            <Cart />
                        <Footer />
                    </ProtectedRoute>
                } />

                <Route path="/checkout" element={
                    <ProtectedRoute>
                        <Header />
                            <Checkout />
                        <Footer />
                    </ProtectedRoute>
                } />

                <Route path="/admin/sign-in" element={
                    <ProtectedRoute>
                        <AdminSignIn />
                    </ProtectedRoute>
                } />

                <Route path="/admin/sign-up" element={
                    <ProtectedRoute>
                        <AdminSignUp />
                    </ProtectedRoute>
                } />

                <Route path="/admin/*" element={
                    <ProtectedRoute>
                        <Header />
                            <AdminLayout />
                        <Footer />
                    </ProtectedRoute>
                }>
                    <Route path="dashboard" element={ <AdminDashboard /> } />
                    <Route path="products" element={ <AdminProducts /> } />
                    <Route path="orders" element={ <AdminOrders /> } />
                    <Route path="stocks" element={ <AdminStocks /> } />
                    <Route path="categories" element={ <AdminCategories /> } />
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

        </>
      );
};

export default App;
