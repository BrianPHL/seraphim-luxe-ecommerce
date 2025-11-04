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
  StocksProvider,
  OrdersProvider,
  CheckoutProvider,
  CategoriesProvider,
  WishlistProvider,
  SettingsProvider,
  CMSProvider,
  NotificationsProvider,
  BannersProvider,
  AuditTrailProvider,
  PromotionsProvider,
  GeminiAIProvider,
  LiveChatProvider,
  SSEProvider,
  useAuditTrail,

} from '@contexts';
import App from './App';

// Wrapper component to connect AuditTrail and Auth
const AuthWithAuditWrapper = ({ children }) => {
  const auditLoggers = useAuditTrail();
  
  return (
    <AuthProvider auditLoggers={auditLoggers}>
      {children}
    </AuthProvider>
  );
};

const CartWithAuditWrapper = ({ children }) => {
  const auditLoggers = useAuditTrail();

  return (
    <CartProvider auditLoggers={auditLoggers}>
      {children}
    </CartProvider>
  );
};

const WishlistWithAuditWrapper = ({ children }) => {
  const auditLoggers = useAuditTrail();

  return (
    <WishlistProvider auditLoggers={auditLoggers}>
      {children}
    </WishlistProvider>
  );
};

const CheckoutWithAuditWrapper = ({ children }) => {
  const auditLoggers = useAuditTrail();

  return (
    <CheckoutProvider auditLoggers={auditLoggers}>
      {children}
    </CheckoutProvider>
  );
};

const OrdersWithAuditWrapper = ({ children }) => {
  const auditLoggers = useAuditTrail();

  return (
    <OrdersProvider auditLoggers={auditLoggers}>
      { children }
    </OrdersProvider>
  );
};

const SettingsWithAuditWrapper = ({ children }) => {
  const auditLoggers = useAuditTrail();

  return (
    <SettingsProvider auditLoggers={auditLoggers}>
      {children}
    </SettingsProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DropdownProvider>
          <ToastProvider>
            <AuditTrailProvider>
              <AuthWithAuditWrapper>
                <SSEProvider>
                  <NotificationsProvider>
                    <CMSProvider>
                      <PromotionsProvider>
                        <BannersProvider>
                          <SettingsProvider>
                            <SettingsWithAuditWrapper>
                              <CategoriesProvider>
                                <ProductsProvider>
                                  <OrdersProvider>
                                    <OrdersWithAuditWrapper>
                                      <WishlistProvider>
                                        <WishlistWithAuditWrapper>
                                          <CartProvider>
                                            <CartWithAuditWrapper>
                                              <CheckoutProvider>
                                                <CheckoutWithAuditWrapper>
                                                  <StocksProvider>
                                                    <GeminiAIProvider>
                                                      <LiveChatProvider>
                                                        <App />
                                                      </LiveChatProvider>
                                                    </GeminiAIProvider>
                                                  </StocksProvider>
                                                </CheckoutWithAuditWrapper>
                                              </CheckoutProvider>
                                            </CartWithAuditWrapper>
                                          </CartProvider>
                                        </WishlistWithAuditWrapper>
                                      </WishlistProvider>
                                    </OrdersWithAuditWrapper>
                                  </OrdersProvider>
                                </ProductsProvider>
                              </CategoriesProvider>
                            </SettingsWithAuditWrapper>
                          </SettingsProvider>
                        </BannersProvider>
                      </PromotionsProvider>
                    </CMSProvider>
                  </NotificationsProvider>
                </SSEProvider>
              </AuthWithAuditWrapper>
            </AuditTrailProvider>
          </ToastProvider>
        </DropdownProvider>
      </ThemeProvider>
    </BrowserRouter>
    </StrictMode>,
);
