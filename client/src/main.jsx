import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import {
  ThemeProvider,
  AuthProvider,
  DropdownProvider,
  CartProvider,
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
                        <OrdersProvider>
                          <WishlistProvider>
                            <CartProvider>
                              <CheckoutProvider>
                                <StocksProvider>
                                  <App />
                                </StocksProvider>
                              </CheckoutProvider>
                            </CartProvider>
                          </WishlistProvider>
                        </OrdersProvider>
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