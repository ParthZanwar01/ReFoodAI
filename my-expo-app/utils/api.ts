const API_URL = 'http://localhost:4000/api';

let token: string | null = null;

export function setToken(newToken: string) {
  token = newToken;
}

function getHeaders(isJson = true) {
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (isJson) headers['Content-Type'] = 'application/json';
  return headers;
}

export async function apiFetch(path: string, options: any = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(options.body !== undefined), ...(options.headers || {}) },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Auth
export async function signUp(email: string, password: string) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
export async function signIn(email: string, password: string) {
  return apiFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// Dashboard
export async function getDashboard() {
  return apiFetch('/dashboard');
}

// Upload
export async function getUploads() {
  return apiFetch('/upload');
}
export async function uploadFile(file: File | Blob) {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/upload', {
    method: 'POST',
    body: form,
    headers: { Authorization: `Bearer ${token}` },
  });
}

// Forecast
export async function getForecasts() {
  return apiFetch('/forecast');
}
export async function runForecast(input: any) {
  return apiFetch('/forecast', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Planner
export async function getPlans() {
  return apiFetch('/planner');
}
export async function runPlanner(input: any) {
  return apiFetch('/planner', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

// Pickups
export async function getPickups() {
  return apiFetch('/pickups');
}
export async function createPickup(data: any) {
  return apiFetch('/pickups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
export async function updatePickup(id: number, data: any) {
  return apiFetch(`/pickups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// Impact
export async function getImpact() {
  return apiFetch('/impact');
}
export async function addImpact(data: any) {
  return apiFetch('/impact', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

// Settings
export async function getSettings() {
  return apiFetch('/settings');
}
export async function updateSettings(data: any) {
  return apiFetch('/settings', {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
} 