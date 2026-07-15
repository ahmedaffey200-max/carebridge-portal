/* ============================================================
   Carebridge Portal — sample data
   ALL DATA IS ILLUSTRATIVE PLACEHOLDER CONTENT for design demo.
   Hospital names are fictional. Patient names/cases are samples.
   Never present these figures as real Carebridge statistics.
   ============================================================ */
(function () {
  const COUNTRIES = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
    "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
    "Cambodia", "Cameroon", "Canada", "Cape Verde", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czech Republic",
    "Democratic Republic of Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "East Timor", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
    "Fiji", "Finland", "France",
    "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
    "Haiti", "Honduras", "Hungary",
    "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan",
    "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
    "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
    "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
    "Oman",
    "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
    "Qatar",
    "Romania", "Russia", "Rwanda",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
    "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
    "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
    "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
    "Yemen",
    "Zambia", "Zimbabwe"
  ];

  const DESTINATIONS = [
    { code: "TR", country: "Türkiye", city: "Istanbul", flag: "🇹🇷", patients: 38, share: 31 },
    { code: "IN", country: "India", city: "Delhi · Chennai", flag: "🇮🇳", patients: 29, share: 24 },
    { code: "AE", country: "UAE", city: "Dubai · Abu Dhabi", flag: "🇦🇪", patients: 18, share: 15 },
    { code: "MY", country: "Malaysia", city: "Kuala Lumpur", flag: "🇲🇾", patients: 14, share: 11 },
    { code: "TH", country: "Thailand", city: "Bangkok", flag: "🇹🇭", patients: 13, share: 10 },
    { code: "KE", country: "Kenya", city: "Nairobi", flag: "🇰🇪", patients: 11, share: 9 },
    { code: "DE", country: "Germany", city: "Berlin", flag: "🇩🇪", patients: 0, share: 0 },
  ];

  // Fictional partner hospitals (sample names — not real institutions)
  const HOSPITALS = [
    { id: "h1", name: "Bosphorus International Medical Center", city: "Istanbul", country: "Türkiye", code: "TR", address: "Levent Mah. 18, Beşiktaş, Istanbul", phone: "+90 212 555 0118", email: "intl@bosphorus-med.example", website: "bosphorus-med.example",
      departments: ["Cardiology", "Oncology", "Neurosurgery", "Radiology"],
      specialists: [
        { id: "s1", name: "Dr. Mehmet Aydın", field: "Cardiac surgery", rating: 4.9, reviews: 41, cases: 38 },
        { id: "s2", name: "Dr. Selin Korkmaz", field: "Medical oncology", rating: 4.7, reviews: 33, cases: 24 },
        { id: "s3", name: "Dr. Emre Şahin", field: "Neurosurgery", rating: 4.6, reviews: 19, cases: 12 },
      ],
      services: [
        { id: "sv1", name: "Coronary bypass (CABG)", rating: 4.8, reviews: 28 },
        { id: "sv2", name: "International patient desk", rating: 4.5, reviews: 52 },
        { id: "sv3", name: "Airport-to-bedside transfer", rating: 4.4, reviews: 31 },
      ],
      improvements: ["Faster discharge-summary turnaround for traveling families.", "More Somali-language interpreters on weekends."],
      specialties: ["Oncology", "Cardiac surgery", "Neurosurgery"], accreditation: "JCI", rating: 4.8, cases: 38, active: true },
    { id: "h2", name: "Marmara Advanced Care Hospital", city: "Istanbul", country: "Türkiye", code: "TR", address: "Acıbadem Cd. 42, Kadıköy, Istanbul", phone: "+90 216 555 0042", email: "care@marmara-care.example", website: "marmara-care.example",
      departments: ["Orthopedics", "Reproductive medicine", "Transplant"],
      specialists: [
        { id: "s4", name: "Dr. Ayşe Demir", field: "IVF & fertility", rating: 4.8, reviews: 36, cases: 21 },
        { id: "s5", name: "Dr. Burak Yıldız", field: "Orthopedic surgery", rating: 4.6, reviews: 22, cases: 14 },
      ],
      services: [
        { id: "sv4", name: "IVF programme", rating: 4.7, reviews: 40 },
        { id: "sv5", name: "Joint replacement", rating: 4.5, reviews: 18 },
      ],
      improvements: ["Clearer written cost estimates before arrival."],
      specialties: ["Orthopedics", "IVF & fertility", "Transplant"], accreditation: "JCI", rating: 4.7, cases: 21, active: true },
    { id: "h3", name: "Yamuna Super-Speciality Institute", city: "Delhi", country: "India", code: "IN", address: "Sector 12, Dwarka, New Delhi", phone: "+91 11 5555 0190", email: "intl@yamuna-ssi.example", website: "yamuna-ssi.example",
      departments: ["Cardiology", "Hepatology", "Oncology", "Nephrology"],
      specialists: [
        { id: "s6", name: "Dr. Rajesh Menon", field: "Liver transplant", rating: 4.9, reviews: 47, cases: 19 },
        { id: "s7", name: "Dr. Priya Nair", field: "Medical oncology", rating: 4.8, reviews: 38, cases: 16 },
      ],
      services: [
        { id: "sv6", name: "Living-donor liver transplant", rating: 4.9, reviews: 22 },
        { id: "sv7", name: "Chemotherapy day-care", rating: 4.7, reviews: 30 },
      ],
      improvements: ["Reduce wait time for first specialist video call."],
      specialties: ["Cardiology", "Liver transplant", "Oncology"], accreditation: "NABH · JCI", rating: 4.9, cases: 19, active: true },
    { id: "h4", name: "Coromandel Heart & Cancer Centre", city: "Chennai", country: "India", code: "IN", address: "OMR Road, Thoraipakkam, Chennai", phone: "+91 44 5555 0076", email: "care@coromandel-hcc.example", website: "coromandel-hcc.example",
      departments: ["Pediatric cardiology", "Hematology", "Neurology"],
      specialists: [
        { id: "s8", name: "Dr. Anand Krishnan", field: "Pediatric cardiac", rating: 4.7, reviews: 25, cases: 10 },
      ],
      services: [
        { id: "sv8", name: "Bone-marrow transplant", rating: 4.6, reviews: 14 },
      ],
      improvements: ["More frequent updates to families during long admissions."],
      specialties: ["Bone marrow", "Cardiac", "Neurology"], accreditation: "NABH", rating: 4.6, cases: 10, active: true },
    { id: "h5", name: "Gulf Horizon Specialist Hospital", city: "Dubai", country: "UAE", code: "AE", address: "Healthcare City, Oud Metha, Dubai", phone: "+971 4 555 0150", email: "intl@gulfhorizon.example", website: "gulfhorizon.example",
      departments: ["Spine surgery", "Oncology", "Diagnostics"],
      specialists: [
        { id: "s9", name: "Dr. Omar Al-Farsi", field: "Spine surgery", rating: 4.7, reviews: 29, cases: 18 },
      ],
      services: [
        { id: "sv9", name: "Minimally-invasive spine surgery", rating: 4.7, reviews: 21 },
        { id: "sv10", name: "Full-body diagnostic package", rating: 4.5, reviews: 24 },
      ],
      improvements: ["Bundle diagnostics pricing for returning patients."],
      specialties: ["Spine surgery", "Oncology", "Diagnostics"], accreditation: "JCI", rating: 4.7, cases: 18, active: true },
    { id: "h6", name: "Klang Valley Medical Pavilion", city: "Kuala Lumpur", country: "Malaysia", code: "MY", address: "Jalan Pahang, Titiwangsa, Kuala Lumpur", phone: "+60 3 5555 0061", email: "intl@klangvalley.example", website: "klangvalley.example",
      departments: ["Cardiology", "Reproductive medicine", "Oncology"],
      specialists: [
        { id: "s10", name: "Dr. Lim Wei Sheng", field: "Cardiology", rating: 4.5, reviews: 18, cases: 14 },
      ],
      services: [
        { id: "sv11", name: "Cardiac catheterization", rating: 4.5, reviews: 16 },
      ],
      improvements: ["Complete partnership accreditation review.", "Confirm visa-support letter process."],
      specialties: ["Cardiology", "Fertility", "Oncology"], accreditation: "MSQH · JCI", rating: 4.5, cases: 14, active: false },
    { id: "h7", name: "Chao Phraya Wellness & Surgical", city: "Bangkok", country: "Thailand", code: "TH", address: "Sukhumvit Soi 49, Watthana, Bangkok", phone: "+66 2 555 0133", email: "intl@chaophraya-ws.example", website: "chaophraya-ws.example",
      departments: ["Orthopedics", "Plastic surgery", "Cardiology"],
      specialists: [
        { id: "s11", name: "Dr. Somchai Phongtanya", field: "Orthopedic surgery", rating: 4.6, reviews: 27, cases: 13 },
      ],
      services: [
        { id: "sv12", name: "Knee replacement", rating: 4.6, reviews: 19 },
        { id: "sv13", name: "Recovery & rehab stay", rating: 4.7, reviews: 23 },
      ],
      improvements: ["Add halal meal options across all wards."],
      specialties: ["Orthopedics", "Cosmetic", "Cardiac"], accreditation: "JCI", rating: 4.6, cases: 13, active: true },
    { id: "h8", name: "Savannah Regional Referral Hospital", city: "Nairobi", country: "Kenya", code: "KE", address: "Ngong Road, Nairobi", phone: "+254 20 555 0188", email: "referrals@savannah-rrh.example", website: "savannah-rrh.example",
      departments: ["Diagnostics", "Maternal care", "Oncology"],
      specialists: [
        { id: "s12", name: "Dr. Grace Wanjiru", field: "Maternal-fetal medicine", rating: 4.3, reviews: 15, cases: 11 },
      ],
      services: [
        { id: "sv14", name: "Maternal screening package", rating: 4.3, reviews: 17 },
      ],
      improvements: ["Improve report digitization speed."],
      specialties: ["Diagnostics", "Maternal care", "Oncology"], accreditation: "SafeCare L5", rating: 4.3, cases: 11, active: true },
  ];

  // Configurable option lists (admin-editable via Settings)
  const GENDERS = ["Male", "Female"].sort(function (a, b) { return a.localeCompare(b); });
  const PRIORITIES = ["Attention", "High", "Normal"];
  const SPECIALTIES = ["Cardiac surgery", "Oncology", "Orthopedics", "Spine surgery", "IVF & fertility", "Transplant", "Liver transplant", "Neurology", "Neurosurgery", "Diagnostics", "Maternal care", "Pediatric cardiac", "General consultation"].sort(function (a, b) { return a.localeCompare(b); });

  // Document status workflow — ordered pipeline (admin-editable order via Settings later)
  const DOC_STATUSES = ["Pending", "Waiting", "Waiting Coordinator", "Under Review", "Reviewed", "Processing", "Verified", "Client"];

  // Visa status (Documents)
  const VISA_DOC_STATUSES = ["Approved", "Rejected", "Pending"];

  // ---- Travel coordination ----
  const VISA_STATUSES = ["Not Started", "Submitted", "Under Review", "Approved", "Rejected", "In Mogadishu", "Other"];
  const FLIGHT_STATUSES = ["Not Booked", "Booked", "In Progress", "Completed"];
  const HOTEL_STATUSES = ["Not Reserved", "Reserved", "Waiting Confirmation", "Checked In", "Checked Out"];
  const PICKUP_STATUSES = ["Not Scheduled", "Scheduled", "Driver Assigned", "Airport Waiting", "Completed"];
  const LOGISTICS = ["Visa Submitted", "Visa Approved", "Flight Booked", "Flight In Progress", "Hotel Booked", "Hotel Waiting", "Airport Waiting", "Packed", "Arrived", "Completed"];
  const CHARGE_CATEGORIES = ["Service Charges", "Premium Care Fees", "Journey Completion Costs", "Additional Expenses", "Medication Costs", "Care & Treatment Costs", "Implementation/Procedure Costs", "Other Patient Expenses"];
  const PAYMENT_BUCKETS = [
    { key: "hospital", label: "Amount Paid to Hospital", icon: "hospital" },
    { key: "medicalCare", label: "Medical Care Payments", icon: "stethoscope" },
    { key: "medication", label: "Medication Payments", icon: "pill" },
    { key: "travel", label: "Travel Expenses", icon: "plane" },
    { key: "accommodation", label: "Accommodation Expenses", icon: "bed-double" },
  ];
  const REVIEW_STEPS = [
    { key: "coordination", label: "Coordination Review", icon: "route" },
    { key: "document", label: "Document Review", icon: "file-text" },
    { key: "financial", label: "Financial Review", icon: "wallet" },
    { key: "finalApproval", label: "Final Approval", icon: "badge-check" },
  ];
  const REVIEW_STATUSES = ["Pending", "In Review", "Approved", "Returned"];

  // ---- Company / operational expenses ----
  const EXPENSE_CATEGORIES = [
    "Staff Salaries & Wages", "Staff Advances", "Travel Expenses", "Flight Tickets", "Hotel & Accommodation",
    "Office Rent", "Office Utilities", "Office Supplies & Stationery", "Fuel", "Vehicle Maintenance",
    "Transportation", "Meals & Entertainment", "Marketing & Advertising", "Software & Subscriptions",
    "Medical Equipment & Supplies", "Insurance", "Bank Charges", "Government Fees & Licenses",
    "Training & Conferences", "Repairs & Maintenance", "Petty Cash", "Miscellaneous Expenses",
  ];
  const EXPENSE_CAT_ICONS = {
    "Staff Salaries & Wages": "users", "Staff Advances": "hand-coins", "Travel Expenses": "route", "Flight Tickets": "plane",
    "Hotel & Accommodation": "bed-double", "Office Rent": "building-2", "Office Utilities": "plug-zap",
    "Office Supplies & Stationery": "pencil-ruler", "Fuel": "fuel", "Vehicle Maintenance": "car-front",
    "Transportation": "bus", "Meals & Entertainment": "utensils", "Marketing & Advertising": "megaphone",
    "Software & Subscriptions": "monitor-smartphone", "Medical Equipment & Supplies": "stethoscope",
    "Insurance": "shield-check", "Bank Charges": "landmark", "Government Fees & Licenses": "scroll-text",
    "Training & Conferences": "graduation-cap", "Repairs & Maintenance": "wrench", "Petty Cash": "coins", "Miscellaneous Expenses": "ellipsis",
  };
  const EXPENSE_STATUSES = ["Pending", "Approved", "Paid", "Reimbursed"];
  const PAYMENT_METHODS = ["Bank transfer", "Cash", "Card", "Mobile money", "Cheque", "Petty cash"];
  const CURRENCIES = [
    { code: "USD", symbol: "$", rate: 1 },
    { code: "SOS", symbol: "Sh", rate: 571 },
    { code: "TRY", symbol: "\u20ba", rate: 39.2 },
    { code: "INR", symbol: "\u20b9", rate: 85.4 },
    { code: "AED", symbol: "\u062f.\u0625", rate: 3.67 },
    { code: "EUR", symbol: "\u20ac", rate: 0.92 },
    { code: "KES", symbol: "KSh", rate: 129 },
  ];
  const DEPARTMENTS = ["Coordination", "Medical review", "Travel desk", "Finance", "Administration", "Marketing", "Management", "IT"];

  function expenseStatusTone(s) {
    switch (s) {
      case "Paid": return "teal";
      case "Approved": return "navy";
      case "Reimbursed": return "sky";
      case "Pending": return "warn";
      default: return "muted";
    }
  }

  function travelStatusTone(s) {
    switch (s) {
      case "Approved": case "Completed": case "Checked Out": case "Checked In": return "teal";
      case "Booked": case "In Progress": case "Under Review": case "In Review": case "Reserved": case "Scheduled": case "Driver Assigned": return "navy";
      case "Submitted": case "Waiting Confirmation": case "Airport Waiting": case "In Mogadishu": case "Pending": return "warn";
      case "Rejected": case "Returned": return "danger";
      case "Not Started": case "Not Booked": case "Not Reserved": case "Not Scheduled": return "muted";
      default: return "sky";
    }
  }

  const STAGES = ["Consultation", "Accepted", "Medical Review", "Diagnosis", "Visa Processing", "Approved", "Departure", "Arrival", "Treatment & Recovery", "Follow-up", "Completed"];
  const STAGE_ICONS = ["clipboard-list", "badge-check", "file-search", "microscope", "stamp", "shield-check", "plane-takeoff", "plane-landing", "heart-pulse", "calendar-check", "check-check"];
  const STAGE_STATUS = ["New inquiry", "Case accepted", "Medical review", "Diagnosis", "Visa processing", "Visa approved", "Departure", "Arrival", "Treatment & recovery", "Follow-up", "Completed"];
  const STAGE_PROGRESS = [8, 16, 26, 38, 48, 53, 58, 68, 82, 92, 100];

  // Coordinators — populated from real staff accounts (Security → Staff accounts)
  const COORDINATORS = [];

  // Patients — start empty; add real patients via the admin portal
  const PATIENTS = [];

  // Trend — populated from real data as patients and revenue are entered
  const TREND = [];

  // Medical reports queue — populated as reports are uploaded
  const REPORTS = [];

  // Communication threads — populated as messages are sent
  const THREADS = [];

  // Financial invoices — populated from real patient records
  const INVOICES = [];

  // Travel itinerary — populated from real patient travel records
  const TRAVEL = [];

  // Expense records — populated as expenses are entered
  const EXPENSES = [];

  // Budget — populated as budget entries are created
  const BUDGET = [];

  // Roles for permissions demo
  const ROLES = [
    { id: "admin", name: "Administrator", caps: ["all"] },
    { id: "coordinator", name: "Coordinator", caps: ["patients", "hospitals", "messages", "travel", "expenses"] },
    { id: "finance", name: "Finance officer", caps: ["financial", "reports"] },
    { id: "viewer", name: "Read-only", caps: [] },
  ];

  window.CB_DATA = {
    COUNTRIES, DESTINATIONS, HOSPITALS, STAGES, STAGE_ICONS, STAGE_STATUS, STAGE_PROGRESS, COORDINATORS, PATIENTS,
    TREND, REPORTS, THREADS, INVOICES, TRAVEL, EXPENSES, BUDGET, ROLES,
    GENDERS, PRIORITIES, SPECIALTIES, DOC_STATUSES, VISA_DOC_STATUSES,
    VISA_STATUSES, FLIGHT_STATUSES, HOTEL_STATUSES, PICKUP_STATUSES,
    LOGISTICS, CHARGE_CATEGORIES, PAYMENT_BUCKETS, REVIEW_STEPS, REVIEW_STATUSES,
    EXPENSE_CATEGORIES, EXPENSE_CAT_ICONS, EXPENSE_STATUSES, PAYMENT_METHODS, CURRENCIES, DEPARTMENTS,
    travelStatusTone, expenseStatusTone,
    money(n) {
      if (n >= 1000) return "$" + n.toLocaleString("en-US");
      return "$" + n;
    },
    hospitalById(id) { return HOSPITALS.find((h) => h.id === id); },
    destByCode(code) {
      return DESTINATIONS.find((d) => d.code === code)
        || { code: code || "OT", country: code === "OT" ? "Other" : (code || "—"), city: "", flag: "🌍" };
    },
    destShort(p) {
      if (p && p.dest === "OT") return "🌍 " + (p.destOther || "Other");
      var d = this.destByCode(p ? p.dest : "");
      return d.flag + " " + (p && p.destCity ? p.destCity : (d.city || d.country));
    },
    destCountry(p) {
      if (p && p.dest === "OT") return p.destOther || "Other";
      return this.destByCode(p ? p.dest : "").country;
    },
    coordById(id) {
      return COORDINATORS.find(function(c) { return c.id === id; })
        || (id && id !== "c1" ? { id: id, name: id, role: "", initials: id.split(" ").map(function(w){ return w[0] || ""; }).slice(0,2).join("").toUpperCase() || "CO", color: "var(--navy-600)" } : { id: "?", name: "—", role: "", initials: "—", color: "var(--navy-600)" });
    },
    coordinatorsSorted() { return COORDINATORS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }); },
  };
})();
