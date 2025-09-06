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
  OrderProvider,
  CheckoutProvider,
  CategoriesProvider,
  SettingsProvider
} from '@contexts';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DropdownProvider>
          <ToastProvider>
            <AuthProvider>
              <SettingsProvider>
                <CategoriesProvider>
                  <ProductsProvider>
                    <ReservationProvider>
                      <OrderProvider>
                        <CartProvider>
                          <CheckoutProvider>
                            <InstallmentsProvider>
                              <StocksProvider>
                                <App />
                              </StocksProvider>
                            </InstallmentsProvider>
                          </CheckoutProvider>
                        </CartProvider>
                      </OrderProvider>
                    </ReservationProvider>
                  </ProductsProvider>
                </CategoriesProvider>
              </SettingsProvider>
            </AuthProvider>
          </ToastProvider>
        </DropdownProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);