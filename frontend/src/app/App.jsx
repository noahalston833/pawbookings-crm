import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { queryClient } from './queryClient'
import { AuthProvider } from '../auth/AuthContext'
import { RequireAuth } from '../auth/RequireAuth'
import { RequireRole } from '../auth/RequireRole'
import { LoginPage } from '../auth/LoginPage'
import { MyBusinessesPage } from '../businesses/MyBusinessesPage'
import { BusinessSignupPage } from '../businesses/BusinessSignupPage'
import { CustomerRegistrationPage } from '../businesses/CustomerRegistrationPage'
import { BusinessSettingsPage } from '../businesses/BusinessSettingsPage'
import { BusinessLayout } from '../layout/BusinessLayout'
import { PetsPage } from '../pets/PetsPage'
import { NewPetPage } from '../pets/NewPetPage'
import { ServicesPage } from '../services/ServicesPage'
import { ServiceFormPage } from '../services/ServiceFormPage'
import { ManageAvailabilitySlotsPage } from '../availability/ManageAvailabilitySlotsPage'
import { BookingRequestPage } from '../bookings/BookingRequestPage'
import { BookingsPage } from '../bookings/BookingsPage'
import { MembershipsPage } from '../memberships/MembershipsPage'
import { AuditLogPage } from '../audit/AuditLogPage'

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
              <Route
                path="services/new"
                element={<RequireRole roles={[ 'owner', 'admin' ]}><ServiceFormPage /></RequireRole>}
              />
              <Route
                path="services/:serviceOfferingId/edit"
                element={<RequireRole roles={[ 'owner', 'admin' ]}><ServiceFormPage /></RequireRole>}
              />
              <Route
                path="services/:serviceOfferingId/slots"
                element={<RequireRole roles={[ 'owner', 'admin' ]}><ManageAvailabilitySlotsPage /></RequireRole>}
              />
              <Route path="services/:serviceOfferingId/book" element={<BookingRequestPage />} />
              <Route path="bookings" element={<BookingsPage />} />
              <Route
                path="members"
                element={<RequireRole roles={[ 'owner', 'admin' ]}><MembershipsPage /></RequireRole>}
              />
              <Route
                path="audit-log"
                element={<RequireRole roles={[ 'owner', 'admin' ]}><AuditLogPage /></RequireRole>}
              />
              <Route
                path="settings"
                element={<RequireRole roles={[ 'owner' ]}><BusinessSettingsPage /></RequireRole>}
              />
            </Route>

            <Route path="*" element={<p>Page not found.</p>} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
