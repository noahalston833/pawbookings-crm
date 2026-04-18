import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from './queryClient'
import { AuthProvider } from '../auth/AuthContext'
import { RequireAuth } from '../auth/RequireAuth'
import { LoginPage } from '../auth/LoginPage'
import { MyBusinessesPage } from '../businesses/MyBusinessesPage'
import { BusinessSignupPage } from '../businesses/BusinessSignupPage'
import { CustomerRegistrationPage } from '../businesses/CustomerRegistrationPage'
import { BusinessLayout } from '../layout/BusinessLayout'
import { PetsPage } from '../pets/PetsPage'
import { NewPetPage } from '../pets/NewPetPage'
import { ServicesPage } from '../services/ServicesPage'
import { BookingRequestPage } from '../bookings/BookingRequestPage'
import { BookingsPage } from '../bookings/BookingsPage'

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<BusinessSignupPage />} />
            <Route path="/:businessSlug/signup" element={<CustomerRegistrationPage />} />

            <Route
              path="/"
              element={
                <RequireAuth>
                  <MyBusinessesPage />
                </RequireAuth>
              }
            />

            <Route
              path="/:businessSlug"
              element={
                <RequireAuth>
                  <BusinessLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="services" replace />} />
              <Route path="pets" element={<PetsPage />} />
              <Route path="pets/new" element={<NewPetPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="services/:serviceOfferingId/book" element={<BookingRequestPage />} />
              <Route path="bookings" element={<BookingsPage />} />
            </Route>

            <Route path="*" element={<p>Page not found.</p>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
