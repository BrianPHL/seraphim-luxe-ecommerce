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
  CheckoutProvider
} from '@contexts';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DropdownProvider>
          <ToastProvider>
            <AuthProvider>
              <ProductsProvider>
                <ReservationProvider>
                  <CartProvider>
                    <CheckoutProvider>
                      <InstallmentsProvider>
                        <StocksProvider>
                          <App />
                        </StocksProvider>
                      </InstallmentsProvider>
                    </CheckoutProvider>
                  </CartProvider>
                </ReservationProvider>
              </ProductsProvider>
            </AuthProvider>
          </ToastProvider>
        </DropdownProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);