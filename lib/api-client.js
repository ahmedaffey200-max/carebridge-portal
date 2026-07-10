/* ============================================================
   Carebridge Portal — API Client
   Replaces localStorage-based CBStore with HTTP API calls.
   ============================================================ */

(function () {
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : 'https://fastapi-python-boilerplate-3lks-git-main-ahmed-afey-s-projects.vercel.app';

  let token = localStorage.getItem('cb_token');

  window.CBApi = {
    setToken(t) { token = t; localStorage.setItem('cb_token', t); },
    getToken() { return token; },

    async request(method, path, body = null) {
      const opts = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (token) opts.headers.Authorization = `Bearer ${token}`;
      if (body) opts.body = JSON.stringify(body);

      try {
        const res = await fetch(`${API_URL}${path}`, opts);
        if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
        return await res.json();
      } catch (err) {
        console.error(`API error [${method} ${path}]:`, err);
        throw err;
      }
    },

    // Auth
    async login(pin, role) {
      const data = await this.request('POST', '/api/login', { pin, role });
      this.setToken(data.token);
      return data;
    },

    // Patients
    async getPatients() {
      return this.request('GET', '/api/patients');
    },

    async addPatient(patient) {
      return this.request('POST', '/api/patients', patient);
    },

    async updatePatient(id, patient) {
      return this.request('PATCH', `/api/patients/${id}`, { ...patient, id });
    },

    async deletePatient(id) {
      return this.request('DELETE', `/api/patients/${id}`);
    },

    // Hospitals
    async getHospitals() {
      return this.request('GET', '/api/hospitals');
    },

    async addHospital(hospital) {
      return this.request('POST', '/api/hospitals', hospital);
    },

    async updateHospital(id, hospital) {
      return this.request('PATCH', `/api/hospitals/${id}`, { ...hospital, id });
    },

    async deleteHospital(id) {
      return this.request('DELETE', `/api/hospitals/${id}`);
    },

    // Invoices
    async getInvoices() {
      return this.request('GET', '/api/invoices');
    },

    async addInvoice(invoice) {
      return this.request('POST', '/api/invoices', invoice);
    },

    // Expenses
    async getExpenses() {
      return this.request('GET', '/api/expenses');
    },

    async addExpense(expense) {
      return this.request('POST', '/api/expenses', expense);
    },

    async updateExpense(id, expense) {
      return this.request('PATCH', `/api/expenses/${id}`, { ...expense, id });
    },

    // Health check
    async ping() {
      return this.request('GET', '/api/health');
    }
  };

  // Backward-compat wrapper: expose as CBStore for existing code
  window.CBStore = {
    async login(pin, role) { return window.CBApi.login(pin, role); },
    getToken() { return window.CBApi.getToken(); },
    async getPatients() { return window.CBApi.getPatients(); },
    async patientById(id) {
      const ps = await window.CBApi.getPatients();
      return ps.find(p => p.id === id);
    },
    async addPatient(p) { return window.CBApi.addPatient(p); },
    async updatePatient(id, p) { return window.CBApi.updatePatient(id, p); },
    async deletePatient(id) { return window.CBApi.deletePatient(id); },

    async getHospitals() { return window.CBApi.getHospitals(); },
    async hospitalById(id) {
      const hs = await window.CBApi.getHospitals();
      return hs.find(h => h.id === id);
    },
    async addHospital(h) { return window.CBApi.addHospital(h); },
    async updateHospital(id, h) { return window.CBApi.updateHospital(id, h); },
    async deleteHospital(id) { return window.CBApi.deleteHospital(id); },

    async getInvoices() { return window.CBApi.getInvoices(); },
    async addInvoice(inv) { return window.CBApi.addInvoice(inv); },

    async getExpenses() { return window.CBApi.getExpenses(); },
    async addExpense(ex) { return window.CBApi.addExpense(ex); },
    async updateExpense(id, ex) { return window.CBApi.updateExpense(id, ex); },

    can(perm) { return true; }, // Role checks happen server-side now
    ping() { return window.CBApi.ping(); }
  };

  console.log('✓ API client loaded');
})();
