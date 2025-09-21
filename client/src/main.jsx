import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import {
  ThemeProvider,
  AuthProvider,
  DropdownProvider,
  CartProvider,
  ReservationProvider,
  ToastProvider,
  ProductsProvider,
  InstallmentsProvider,
  StocksProvider,
  OrdersProvider,
  CheckoutProvider,
  CategoriesProvider,
  WishlistProvider,
  SettingsProvider,
  CMSProvider,
  NotificationsProvider
} from '@contexts';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DropdownProvider>
          <ToastProvider>
            <AuthProvider>
              <NotificationsProvider>
                <CMSProvider>
                  <SettingsProvider>
                    <CategoriesProvider>
                      <ProductsProvider>
                        <ReservationProvider>
                          <OrdersProvider>
                            <WishlistProvider>
                              <CartProvider>
                                <CheckoutProvider>
                                  <InstallmentsProvider>
                                    <StocksProvider>
                                      <App />
                                    </StocksProvider>
                                  </InstallmentsProvider>
                                </CheckoutProvider>
                              </CartProvider>
                            </WishlistProvider>
                          </OrdersProvider>
                        </ReservationProvider>
                      </ProductsProvider>
                    </CategoriesProvider>
                  </SettingsProvider>
                </CMSProvider>
              </NotificationsProvider>
            </AuthProvider>
          </ToastProvider>
        </DropdownProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);