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

  const COORDINATORS = [
    { id: "c1", name: "Amina Yusuf", role: "Lead coordinator", initials: "AY", color: "#1B3A6B" },
    { id: "c2", name: "Khadija Omar", role: "Travel coordinator", initials: "KO", color: "#19938A" },
    { id: "c3", name: "Hassan Aden", role: "Case manager", initials: "HA", color: "#2C5089" },
    { id: "c4", name: "Fatima Noor", role: "Medical liaison", initials: "FN", color: "#157E74" },
  ];

  // Patients — sample cases
  const PATIENTS = [
    { id: "CB-2041", name: "Abdullahi Mohamed", age: 54, gender: "Male", condition: "Coronary artery disease", specialty: "Cardiac surgery", dest: "TR", hospital: "h1", stage: 8, status: "Treatment & recovery", coordinator: "c1", estimate: 18400, paid: 12000, progress: 62, updated: "2h ago", initials: "AM", priority: "High", visa: "Approved", flight: "Booked", started: "May 28, 2026", phone: "+252 61 555 2041", email: "a.mohamed@example.com", emergencyName: "Khadija Mohamed", emergencyPhone: "+252 61 555 7012", emergencyCountry: "Somalia", emergencyRelation: "Spouse" },
    { id: "CB-2039", name: "Hodan Ali", age: 33, gender: "Female", condition: "Breast carcinoma (Stage II)", specialty: "Oncology", dest: "IN", hospital: "h3", stage: 2, status: "Medical review", coordinator: "c4", estimate: 14200, paid: 6000, progress: 38, updated: "5h ago", initials: "HA", priority: "Attention", visa: "In process", flight: "Pending", started: "Jun 02, 2026", phone: "+252 61 555 2039", email: "h.ali@example.com", emergencyName: "Ahmed Ali", emergencyPhone: "+252 61 555 7039", emergencyCountry: "Somalia", emergencyRelation: "Sibling" },
    { id: "CB-2036", name: "Yusuf Warsame", age: 47, gender: "Male", condition: "Lumbar disc herniation", specialty: "Spine surgery", dest: "AE", hospital: "h5", stage: 9, status: "Follow-up", coordinator: "c3", estimate: 11800, paid: 11800, progress: 81, updated: "1d ago", initials: "YW", priority: "Normal", visa: "Approved", flight: "Completed", started: "May 14, 2026", phone: "+252 61 555 2036", email: "y.warsame@example.com" },
    { id: "CB-2034", name: "Sahra Ibrahim", age: 28, gender: "Female", condition: "Primary infertility", specialty: "IVF & fertility", dest: "TR", hospital: "h2", stage: 6, status: "Departure", coordinator: "c1", estimate: 9300, paid: 4500, progress: 55, updated: "1d ago", initials: "SI", priority: "Normal", visa: "Approved", flight: "Booked", started: "May 30, 2026", phone: "+252 61 555 2034", email: "s.ibrahim@example.com" },
    { id: "CB-2031", name: "Mohamed Farah", age: 61, gender: "Male", condition: "Chronic kidney disease", specialty: "Transplant", dest: "IN", hospital: "h3", stage: 0, status: "New inquiry", coordinator: "c4", estimate: 0, paid: 0, progress: 12, updated: "3h ago", initials: "MF", priority: "Attention", visa: "Not started", flight: "Not started", started: "Jun 10, 2026", phone: "+252 61 555 2031", email: "m.farah@example.com" },
    { id: "CB-2029", name: "Asha Diriye", age: 41, gender: "Female", condition: "Thyroid nodule", specialty: "Diagnostics", dest: "AE", hospital: "h5", stage: 3, status: "Diagnosis", coordinator: "c3", estimate: 5200, paid: 1500, progress: 30, updated: "2d ago", initials: "AD", priority: "Normal", visa: "In process", flight: "Pending", started: "Jun 04, 2026", phone: "+252 61 555 2029", email: "a.diriye@example.com" },
    { id: "CB-2025", name: "Omar Sheikh", age: 9, gender: "Male", condition: "Congenital heart defect", specialty: "Pediatric cardiac", dest: "IN", hospital: "h4", stage: 9, status: "Follow-up", coordinator: "c1", estimate: 16700, paid: 16700, progress: 96, updated: "3d ago", initials: "OS", priority: "Normal", visa: "Approved", flight: "Completed", started: "Apr 18, 2026", phone: "+252 61 555 2025", email: "o.sheikh@example.com" },
    { id: "CB-2022", name: "Maryan Hersi", age: 37, gender: "Female", condition: "Knee osteoarthritis", specialty: "Orthopedics", dest: "TH", hospital: "h7", stage: 7, status: "Arrival", coordinator: "c2", estimate: 8900, paid: 8900, progress: 78, updated: "4d ago", initials: "MH", priority: "Normal", visa: "Approved", flight: "Completed", started: "May 09, 2026", phone: "+252 61 555 2022", email: "m.hersi@example.com" },
    { id: "CB-2018", name: "Ahmed Nur", age: 52, gender: "Male", condition: "Liver cirrhosis", specialty: "Liver transplant", dest: "IN", hospital: "h3", stage: 4, status: "Visa processing", coordinator: "c4", estimate: 24500, paid: 15000, progress: 58, updated: "5d ago", initials: "AN", priority: "High", visa: "Approved", flight: "Booked", started: "May 22, 2026", phone: "+252 61 555 2018", email: "a.nur@example.com" },
    { id: "CB-2014", name: "Ifrah Abdi", age: 24, gender: "Female", condition: "Routine maternal screening", specialty: "Maternal care", dest: "KE", hospital: "h8", stage: 1, status: "Case accepted", coordinator: "c2", estimate: 3100, paid: 3100, progress: 92, updated: "6d ago", initials: "IA", priority: "Normal", visa: "Approved", flight: "Completed", started: "Apr 30, 2026", phone: "+252 61 555 2014", email: "i.abdi@example.com" },
  ];

  // Monthly trend (last 8 months) — sample
  const TREND = [
    { m: "Nov", inquiries: 21, active: 44, revenue: 142 },
    { m: "Dec", inquiries: 18, active: 47, revenue: 151 },
    { m: "Jan", inquiries: 26, active: 52, revenue: 168 },
    { m: "Feb", inquiries: 24, active: 58, revenue: 176 },
    { m: "Mar", inquiries: 31, active: 63, revenue: 198 },
    { m: "Apr", inquiries: 28, active: 69, revenue: 214 },
    { m: "May", inquiries: 35, active: 78, revenue: 247 },
    { m: "Jun", inquiries: 33, active: 84, revenue: 263 },
  ];

  // Medical reports queue — sample
  const REPORTS = [
    { id: "R-5512", patient: "CB-2031", patientName: "Mohamed Farah", type: "Renal panel + ultrasound", pages: 14, status: "Needs review", uploaded: "3h ago", reviewer: "—" },
    { id: "R-5509", patient: "CB-2039", patientName: "Hodan Ali", type: "Biopsy histopathology", pages: 8, status: "AI organized", uploaded: "5h ago", reviewer: "Dr. Salah" },
    { id: "R-5505", patient: "CB-2029", patientName: "Asha Diriye", type: "Thyroid FNAC + bloods", pages: 6, status: "Under review", uploaded: "1d ago", reviewer: "Dr. Salah" },
    { id: "R-5498", patient: "CB-2018", patientName: "Ahmed Nur", type: "MRI abdomen + LFT", pages: 22, status: "Recommendation ready", uploaded: "2d ago", reviewer: "Dr. Mire" },
    { id: "R-5491", patient: "CB-2041", patientName: "Abdullahi Mohamed", type: "Angiogram + ECG", pages: 11, status: "Recommendation ready", uploaded: "4d ago", reviewer: "Dr. Mire" },
  ];

  // Communication threads — sample
  const THREADS = [
    { id: "t1", name: "Abdullahi Mohamed", patient: "CB-2041", channel: "WhatsApp", last: "Thank you, we received the flight details.", time: "12:40", unread: 2, initials: "AM" },
    { id: "t2", name: "Hodan Ali", patient: "CB-2039", channel: "Secure chat", last: "When will the biopsy results be ready?", time: "11:18", unread: 1, initials: "HA" },
    { id: "t3", name: "Bosphorus Intl. (Coordinator)", patient: "h1", channel: "Email", last: "Admission confirmed for May 28. Bed reserved.", time: "09:55", unread: 0, initials: "BI" },
    { id: "t4", name: "Mohamed Farah", patient: "CB-2031", channel: "WhatsApp", last: "I have uploaded my passport copy.", time: "Yesterday", unread: 0, initials: "MF" },
    { id: "t5", name: "Sahra Ibrahim", patient: "CB-2034", channel: "Secure chat", last: "Coordinator: Your next cycle starts Monday.", time: "Yesterday", unread: 0, initials: "SI" },
  ];

  // Financial invoices — sample
  const INVOICES = [
    { id: "INV-3088", patient: "Abdullahi Mohamed", amount: 18400, paid: 12000, status: "Partial", due: "Jun 20", dest: "TR" },
    { id: "INV-3085", patient: "Ahmed Nur", amount: 24500, paid: 15000, status: "Partial", due: "Jun 18", dest: "IN" },
    { id: "INV-3081", patient: "Sahra Ibrahim", amount: 9300, paid: 4500, status: "Partial", due: "Jun 25", dest: "TR" },
    { id: "INV-3076", patient: "Yusuf Warsame", amount: 11800, paid: 11800, status: "Paid", due: "—", dest: "AE" },
    { id: "INV-3072", patient: "Omar Sheikh", amount: 16700, paid: 16700, status: "Paid", due: "—", dest: "IN" },
    { id: "INV-3069", patient: "Hodan Ali", amount: 14200, paid: 6000, status: "Partial", due: "Jun 22", dest: "IN" },
  ];

  // Travel itinerary items — sample
  const TRAVEL = [
    { id: "CB-2041", name: "Abdullahi Mohamed", dest: "Istanbul, Türkiye", visa: "Approved", flight: "May 28 · TK604", hotel: "Booked · 14 nights", pickup: "Scheduled", phase: "In country" },
    { id: "CB-2039", name: "Hodan Ali", dest: "Delhi, India", visa: "In process", flight: "Awaiting visa", hotel: "Held", pickup: "Pending", phase: "Pre-departure" },
    { id: "CB-2031", name: "Mohamed Farah", dest: "Delhi, India", visa: "Not started", flight: "Not started", hotel: "—", pickup: "—", phase: "Planning" },
    { id: "CB-2034", name: "Sahra Ibrahim", dest: "Istanbul, Türkiye", visa: "Approved", flight: "May 30 · TK604", hotel: "Booked · 9 nights", pickup: "Scheduled", phase: "In country" },
    { id: "CB-2018", name: "Ahmed Nur", dest: "Delhi, India", visa: "Approved", flight: "May 22 · 6E12", hotel: "Booked · 28 nights", pickup: "Completed", phase: "In country" },
  ];

  // Expense records — sample
  const EXPENSES = [
    { id: "EX-410", category: "Hospital settlements", vendor: "Yamuna Super-Speciality", amount: 38500, date: "Jun 08", status: "Paid" },
    { id: "EX-409", category: "Travel & flights", vendor: "Skyline Travel", amount: 9200, date: "Jun 06", status: "Paid" },
    { id: "EX-408", category: "Accommodation", vendor: "Marmara Guest Residence", amount: 6400, date: "Jun 05", status: "Pending" },
    { id: "EX-407", category: "Coordination & staff", vendor: "Payroll — June", amount: 14800, date: "Jun 01", status: "Paid" },
    { id: "EX-406", category: "Visa & documentation", vendor: "Consular services", amount: 2100, date: "May 30", status: "Paid" },
  ];

  // Budget by category — sample (annual, USD)
  const BUDGET = [
    { category: "Hospital settlements", planned: 520000, spent: 388000 },
    { category: "Travel & flights", planned: 140000, spent: 96400 },
    { category: "Accommodation", planned: 90000, spent: 61200 },
    { category: "Coordination & staff", planned: 210000, spent: 162000 },
    { category: "Visa & documentation", planned: 40000, spent: 21800 },
    { category: "Marketing & outreach", planned: 60000, spent: 33500 },
  ];

  // Roles for permissions demo
  const ROLES = [
    { id: "admin", name: "Administrator", caps: ["all"] },
    { id: "coordinator", name: "Coordinator", caps: ["patients", "hospitals", "messages", "travel"] },
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
      return d.flag + " " + (d.city || d.country);
    },
    destCountry(p) {
      if (p && p.dest === "OT") return p.destOther || "Other";
      return this.destByCode(p ? p.dest : "").country;
    },
    coordById(id) { return COORDINATORS.find((c) => c.id === id); },
    coordinatorsSorted() { return COORDINATORS.slice().sort(function (a, b) { return a.name.localeCompare(b.name); }); },
  };
})();
