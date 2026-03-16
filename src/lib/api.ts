// Configuration for the FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchWithConfig(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers as Record<string, string>,
  };

  // add auth token if exists in local storage (client side)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
       headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// === PUBLIC APIS ===
export const getSchedules = () => fetchWithConfig('/public/schedules');
export const searchSchedules = (from: string, to: string, date: string) => 
  fetchWithConfig(`/public/search?from_location=${encodeURIComponent(from)}&to_location=${encodeURIComponent(to)}&depart_date=${encodeURIComponent(date)}`);
export const createBooking = (bookingData: any) => 
  fetchWithConfig('/public/bookings', { method: 'POST', body: JSON.stringify(bookingData) });
export const getBooking = (code: string) => fetchWithConfig(`/public/bookings/${code}`);

// === ADMIN APIS ===
export const adminLogin = async (username: string, password: string) => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await fetch(`${API_BASE_URL}/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  });
  
  if (!response.ok) throw new Error("Login failed");
  const data = await response.json();
  if (data.access_token && typeof window !== 'undefined') {
    localStorage.setItem("admin_token", data.access_token);
  }
  return data;
};

export const adminLogout = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem("admin_token");
  }
};

export const getDashboardStats = () => fetchWithConfig('/admin/dashboard');
export const getReservations = (status?: string) => 
  fetchWithConfig(`/admin/reservations${status ? `?status=${status}` : ''}`);
export const getReservationDetails = (id: number) => fetchWithConfig(`/admin/reservations/${id}`);
export const updateReservation = (id: number, data: any) => 
  fetchWithConfig(`/admin/reservations/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const getVehicles = () => fetchWithConfig('/admin/vehicles');
export const createVehicle = (data: any) => fetchWithConfig('/admin/vehicles', { method: 'POST', body: JSON.stringify(data) });
export const updateVehicle = (id: number, data: any) => fetchWithConfig(`/admin/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteVehicle = (id: number) => fetchWithConfig(`/admin/vehicles/${id}`, { method: 'DELETE' });

export const getDrivers = () => fetchWithConfig('/admin/drivers');
export const createDriver = (data: any) => fetchWithConfig('/admin/drivers', { method: 'POST', body: JSON.stringify(data) });
export const updateDriver = (id: number, data: any) => fetchWithConfig(`/admin/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDriver = (id: number) => fetchWithConfig(`/admin/drivers/${id}`, { method: 'DELETE' });

export const getAdminSchedules = () => fetchWithConfig('/admin/schedules');
export const createAdminSchedule = (data: any) => fetchWithConfig('/admin/schedules', { method: 'POST', body: JSON.stringify(data) });
export const deleteAdminSchedule = (id: number) => fetchWithConfig(`/admin/schedules/${id}`, { method: 'DELETE' });

export const getAdminTrips = (date?: string) => fetchWithConfig(`/admin/trips${date ? `?date=${date}` : ''}`);
export const createAdminTrip = (data: any) => fetchWithConfig('/admin/trips', { method: 'POST', body: JSON.stringify(data) });
export const updateAdminTrip = (id: number, data: any) => fetchWithConfig(`/admin/trips/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteAdminTrip = (id: number) => fetchWithConfig(`/admin/trips/${id}`, { method: 'DELETE' });

export const getActiveFleet = () => fetchWithConfig('/admin/fleet/active');

// --- PAYMENTS ---
export const initializePayment = (booking_code: string, payment_method: string, payment_type: string) => 
  fetchWithConfig(`/payments/initialize?booking_code=${booking_code}&payment_method=${payment_method}&payment_type=${payment_type}`, { method: 'POST' });

export const getAdminPayments = () => fetchWithConfig('/admin/payments');
export const updateAdminPayment = (id: number, data: any) => 
  fetchWithConfig(`/admin/reservations/${id}/payment`, { method: 'PATCH', body: JSON.stringify(data) });
