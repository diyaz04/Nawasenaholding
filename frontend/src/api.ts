// Gunakan localhost saat development, dan Worker URL saat production
const API_URL = import.meta.env.DEV ? 'http://localhost:8787/api' : (import.meta.env.VITE_API_URL || 'https://nawasena-backend.diyazsriwulan.workers.dev/api');

export const fetchApi = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

export const getPageSection = (key: string) => fetchApi(`/page_sections/${key}`);
export const getSubsidiaries = () => fetchApi('/subsidiaries');
export const getProducts = (category?: string) => {
  const query = category && category !== 'all' ? `?category=${category}` : '';
  return fetchApi(`/products${query}`);
};
export const submitInquiry = (data: { product_id: string; name: string; contact: string; message: string }) => {
  return fetchApi('/product_inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
};

// --- AUTH API ---
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
  options.credentials = 'include'; // Send cookies
  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Error ${response.status}`);
  }
  return response.json();
};

export const loginAdmin = (data: any) => authFetch('/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
});
export const registerAdmin = (data: any) => authFetch('/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
});
export const logoutAdmin = () => authFetch('/auth/logout', { method: 'POST' });
export const getAdminProfile = () => authFetch('/auth/me');

// --- ADMIN CMS API ---
export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/admin/upload`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Upload failed');
  return response.json();
};

export const createSubsidiary = (data: any) => authFetch('/admin/subsidiaries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateSubsidiary = (id: string, data: any) => authFetch(`/admin/subsidiaries/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteSubsidiary = (id: string) => authFetch(`/admin/subsidiaries/${id}`, { method: 'DELETE' });

export const createProduct = (data: any) => authFetch('/admin/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateProduct = (id: string, data: any) => authFetch(`/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteProduct = (id: string) => authFetch(`/admin/products/${id}`, { method: 'DELETE' });

export const getPageSections = () => authFetch('/admin/page_sections');
export const updatePageSection = (key: string, content: string) => authFetch(`/admin/page_sections/${key}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) });

export const getInquiries = () => authFetch('/admin/inquiries');
export const updateInquiryStatus = (id: string, status: string) => authFetch(`/admin/inquiries/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });

// --- POS API (Phase 5) ---
export const getPosList = () => authFetch('/admin/pos');
export const createPos = (data: any) => authFetch('/admin/pos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updatePos = (id: string, data: any) => authFetch(`/admin/pos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deletePos = (id: string) => authFetch(`/admin/pos/${id}`, { method: 'DELETE' });
export const seedPos = () => authFetch('/admin/pos/seed', { method: 'POST' });

// --- DISTRIBUTION PATTERNS API (Phase 6) ---
export const getPatternsList = () => authFetch('/admin/patterns');
export const getPatternDetail = (id: string) => authFetch(`/admin/patterns/${id}`);
export const createPattern = (data: any) => authFetch('/admin/patterns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updatePattern = (id: string, data: any) => authFetch(`/admin/patterns/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updatePatternStatus = (id: string, is_active: boolean) => authFetch(`/admin/patterns/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active }) });
export const deletePattern = (id: string) => authFetch(`/admin/patterns/${id}`, { method: 'DELETE' });
export const seedPattern = () => authFetch('/admin/patterns/seed', { method: 'POST' });

// --- Phase 7: Shopee API ---
export const getShopeeAuthUrl = () => authFetch('/admin/shopee/auth-url');
export const getShopeeAccounts = () => authFetch('/admin/shopee/accounts');
export const deleteShopeeAccount = (id: string) => authFetch(`/admin/shopee/accounts/${id}`, { method: 'DELETE' });
export const testFetchShopee = () => authFetch('/admin/shopee/test-fetch', { method: 'POST' });

// --- Phase 8: Closing Config & Engine ---
export const getClosingConfig = () => authFetch('/admin/closing-config');
export const updateClosingConfig = (data: any) => authFetch('/admin/closing-config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const runClosingNow = () => authFetch('/admin/run-closing', { method: 'POST' });
export const submitManualAds = (data: { closing_id: string, manual_ads_cost: number }) => authFetch('/admin/submit-ads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const getClosingHistory = () => authFetch('/admin/daily-closings');
export const getClosingAllocations = (id: string) => authFetch(`/admin/daily-closings/${id}/allocations`);

// --- Phase 9: Expenses ---
export const getExpenses = (filters: { pos_id?: string, date?: string } = {}) => {
  const params = new URLSearchParams()
  if (filters.pos_id) params.append('pos_id', filters.pos_id)
  if (filters.date) params.append('date', filters.date)
  const query = params.toString() ? `?${params.toString()}` : ''
  return authFetch(`/admin/expenses${query}`)
}
export const createExpense = (data: any) => authFetch('/admin/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

// --- Phase 10: Dashboard ---
export const getDashboardMetrics = () => authFetch('/admin/dashboard/metrics');
export const getDashboardCharts = (filters: { start_date?: string, end_date?: string } = {}) => {
  const params = new URLSearchParams()
  if (filters.start_date) params.append('start_date', filters.start_date)
  if (filters.end_date) params.append('end_date', filters.end_date)
  const query = params.toString() ? `?${params.toString()}` : ''
  return authFetch(`/admin/dashboard/charts${query}`)
}

// --- Phase 13: Reports ---
export const getMonthlyReport = (month: string, year: string) => authFetch(`/admin/reports/monthly?month=${month}&year=${year}`)
export const getMonthlyReportExcelUrl = (month: string, year: string) => `/api/admin/reports/monthly/export/excel?month=${month}&year=${year}`

// --- Phase 14: Payroll ---
export const getEmployees = () => authFetch('/admin/employees')
export const createEmployee = (data: any) => authFetch('/admin/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const updateEmployee = (id: string, data: any) => authFetch(`/admin/employees/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const deleteEmployee = (id: string) => authFetch(`/admin/employees/${id}`, { method: 'DELETE' })

export const getPayrollRuns = () => authFetch('/admin/payroll')
export const getPayrollDetail = (id: string) => authFetch(`/admin/payroll/${id}`)
export const createPayrollDraft = (data: { period_month: number, period_year: number }) => authFetch('/admin/payroll/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
export const savePayrollItems = (id: string, items: any[]) => authFetch(`/admin/payroll/${id}/items`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
export const processPayroll = (id: string, fallback_pos_id?: string) => authFetch(`/admin/payroll/${id}/process`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fallback_pos_id }) })

