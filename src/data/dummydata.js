export const projects = [
  {
    id: 1,
    name: "Raj Nagar Villa",
    client: "Priya Krishnamurthy",
    supervisor: "Ramesh Kumar",
    phase: "Carpentry",
    progress: 68,
    status: "On Track",
    budget: "₹8,50,000",
  },
  {
    id: 2,
    name: "Tidel Park Office",
    client: "TechSoft Solutions",
    supervisor: "Karthik Rajan",
    phase: "Painting",
    progress: 82,
    status: "On Track",
    budget: "₹12,00,000",
  },
  {
    id: 3,
    name: "RS Puram Apartment",
    client: "Suresh Balaji",
    supervisor: "Ramesh Kumar",
    phase: "Civil",
    progress: 35,
    status: "Delayed",
    budget: "₹5,20,000",
  },
  {
    id: 4,
    name: "Avinashi Rd Bungalow",
    client: "Meena Subramanian",
    supervisor: "Vijay S",
    phase: "False Ceiling",
    progress: 55,
    status: "On Track",
    budget: "₹15,00,000",
  },
  {
    id: 5,
    name: "Peelamedu Clinic",
    client: "Dr. Anand Kumar",
    supervisor: "Karthik Rajan",
    phase: "Electrical",
    progress: 20,
    status: "Critical",
    budget: "₹3,80,000",
  },
  {
    id: 6,
    name: "Ganapathy Flat Reno",
    client: "Lakshmi Venkat",
    supervisor: "Vijay S",
    phase: "Handover",
    progress: 95,
    status: "On Track",
    budget: "₹4,50,000",
  },
]

export const team = [
  { name: "Akash R",       role: "Admin",      isPresent: true  },
  { name: "Ramesh Kumar",  role: "Supervisor", projects: [1, 3], isPresent: true  },
  { name: "Karthik Rajan", role: "Supervisor", projects: [2, 5], isPresent: true  },
  { name: "Vijay S",       role: "Supervisor", projects: [4, 6], isPresent: false },
  { name: "Kavitha M",     role: "Designer",   isPresent: true  },
  { name: "Deepa R",       role: "Designer",   isPresent: false },
]

export const financeSummary = {
  revenue:         "₹42,00,000",
  expenses:        "₹28,50,000",
  profit:          "₹13,50,000",
  pendingInvoices: 3,
  revenueRaw:      4200000,
  expensesRaw:     2850000,
  profitRaw:       1350000,
}

export const expenseBreakdown = [
  { category: "Labour",        amount: 140000 },
  { category: "Material",      amount: 98000  },
  { category: "Transport",     amount: 28000  },
  { category: "Miscellaneous", amount: 19000  },
]

export const financeChart = [
  { project: "Raj Nagar",  budget: 850000,  actual: 612000 },
  { project: "Tidel Park", budget: 1200000, actual: 986000 },
  { project: "RS Puram",   budget: 520000,  actual: 285000 },
  { project: "Avinashi",   budget: 1500000, actual: 824000 },
  { project: "Peelamedu",  budget: 380000,  actual: 96000  },
  { project: "Ganapathy",  budget: 450000,  actual: 427000 },
]

export const projectDetails = {
  1: {
    id: 1,
    name: "Raj Nagar Villa",
    client: "Priya Krishnamurthy",
    address: "14B, Raj Nagar Extension, Coimbatore – 641 045",
    startDate: "15 Jan 2025",
    endDate: "30 Jun 2025",
    supervisor: "Ramesh Kumar",
    budget: "₹8,50,000",
    spent: "₹5,78,000",
    status: "On Track",
    progress: 68,
    phases: [
      { id: "demolition",    label: "Demolition",    status: "done"    },
      { id: "civil",         label: "Civil",         status: "done"    },
      { id: "electrical",    label: "Electrical",    status: "done"    },
      { id: "plumbing",      label: "Plumbing",      status: "done"    },
      { id: "false-ceiling", label: "False Ceiling", status: "done"    },
      { id: "carpentry",     label: "Carpentry",     status: "active"  },
      { id: "painting",      label: "Painting",      status: "pending" },
      { id: "cleaning",      label: "Cleaning",      status: "pending" },
      { id: "handover",      label: "Handover",      status: "pending" },
    ],
    tasks: [
      { id: "t1", name: "Kitchen cabinet installation",      assignedTo: "Karthik Rajan", dueDate: "20 Apr 2025", dependsOn: null, status: "Completed"   },
      { id: "t2", name: "Master bedroom wardrobe frame",     assignedTo: "Ramesh Kumar",  dueDate: "25 Apr 2025", dependsOn: null, status: "In Progress" },
      { id: "t3", name: "TV unit woodwork — living room",    assignedTo: "Vijay S",       dueDate: "28 Apr 2025", dependsOn: "t2", status: "Pending"     },
      { id: "t4", name: "False ceiling paint touch-ups",     assignedTo: "Karthik Rajan", dueDate: "02 May 2025", dependsOn: "t3", status: "Pending"     },
      { id: "t5", name: "Bathroom vanity carpentry",         assignedTo: "Ramesh Kumar",  dueDate: "05 May 2025", dependsOn: null, status: "In Progress" },
      { id: "t6", name: "Bedroom 1 & 2 painting prep",      assignedTo: "Vijay S",       dueDate: "15 May 2025", dependsOn: "t2", status: "Pending"     },
    ],
    dailyReports: [
      { id: "dr1", date: "18 Apr 2025", supervisor: "Ramesh Kumar",  summary: "Kitchen cabinet installation completed on the left wall. 3 workers present. Material delivery for wardrobe frames received and stored on site.", hasPhoto: true  },
      { id: "dr2", date: "17 Apr 2025", supervisor: "Ramesh Kumar",  summary: "Started wardrobe frame for master bedroom. Resolved minor measurement discrepancy with design team. Work on track.",                              hasPhoto: false },
      { id: "dr3", date: "16 Apr 2025", supervisor: "Ramesh Kumar",  summary: "Bathroom vanity measurements taken and shared with carpenter. Ordered additional hardware from vendor. No issues.",                               hasPhoto: true  },
      { id: "dr4", date: "15 Apr 2025", supervisor: "Karthik Rajan", summary: "False ceiling completion verified for living room. Electrical points confirmed per layout. Cleared for carpentry phase.",                         hasPhoto: false },
    ],
  },
  2: {
    id: 2,
    name: "Tidel Park Office",
    client: "TechSoft Solutions",
    address: "Block C, Tidel Park, Elnet Nagar, Chennai – 600 113",
    startDate: "10 Nov 2024",
    endDate: "15 May 2025",
    supervisor: "Karthik Rajan",
    budget: "₹12,00,000",
    spent: "₹9,84,000",
    status: "On Track",
    progress: 82,
    phases: [
      { id: "demolition",    label: "Demolition",    status: "done"    },
      { id: "civil",         label: "Civil",         status: "done"    },
      { id: "electrical",    label: "Electrical",    status: "done"    },
      { id: "plumbing",      label: "Plumbing",      status: "done"    },
      { id: "false-ceiling", label: "False Ceiling", status: "done"    },
      { id: "carpentry",     label: "Carpentry",     status: "done"    },
      { id: "painting",      label: "Painting",      status: "active"  },
      { id: "cleaning",      label: "Cleaning",      status: "pending" },
      { id: "handover",      label: "Handover",      status: "pending" },
    ],
    tasks: [
      { id: "t1", name: "Conference room 1st coat",         assignedTo: "Karthik Rajan", dueDate: "22 Apr 2025", dependsOn: null, status: "Completed"   },
      { id: "t2", name: "Open office area 2nd coat",        assignedTo: "Vijay S",       dueDate: "25 Apr 2025", dependsOn: "t1", status: "In Progress" },
      { id: "t3", name: "Reception feature wall painting",  assignedTo: "Karthik Rajan", dueDate: "28 Apr 2025", dependsOn: "t2", status: "Pending"     },
      { id: "t4", name: "Touch-up all surfaces",            assignedTo: "Vijay S",       dueDate: "02 May 2025", dependsOn: "t3", status: "Pending"     },
      { id: "t5", name: "Final inspection & snag list",     assignedTo: "Karthik Rajan", dueDate: "10 May 2025", dependsOn: "t4", status: "Pending"     },
    ],
    dailyReports: [
      { id: "dr1", date: "18 Apr 2025", supervisor: "Karthik Rajan", summary: "Completed 1st coat in conference room and two cabins. Paint quality approved by client PM. 4 painters on site.", hasPhoto: true  },
      { id: "dr2", date: "17 Apr 2025", supervisor: "Karthik Rajan", summary: "Open office primer coat finished. Doors and windows masked. Sample approved for feature wall colour.",              hasPhoto: true  },
      { id: "dr3", date: "16 Apr 2025", supervisor: "Karthik Rajan", summary: "Carpentry punch list cleared. All workstations installed. Site handed to painting team. No pending carpentry.",     hasPhoto: false },
    ],
  },
  3: {
    id: 3,
    name: "RS Puram Apartment",
    client: "Suresh Balaji",
    address: "Flat 4B, Lotus Residency, RS Puram, Coimbatore – 641 002",
    startDate: "01 Feb 2025",
    endDate: "31 Aug 2025",
    supervisor: "Ramesh Kumar",
    budget: "₹5,20,000",
    spent: "₹1,82,000",
    status: "Delayed",
    progress: 35,
    phases: [
      { id: "demolition",    label: "Demolition",    status: "done"    },
      { id: "civil",         label: "Civil",         status: "active"  },
      { id: "electrical",    label: "Electrical",    status: "pending" },
      { id: "plumbing",      label: "Plumbing",      status: "pending" },
      { id: "false-ceiling", label: "False Ceiling", status: "pending" },
      { id: "carpentry",     label: "Carpentry",     status: "pending" },
      { id: "painting",      label: "Painting",      status: "pending" },
      { id: "cleaning",      label: "Cleaning",      status: "pending" },
      { id: "handover",      label: "Handover",      status: "pending" },
    ],
    tasks: [
      { id: "t1", name: "Bedroom wall breaking & debris clearance",  assignedTo: "Ramesh Kumar",  dueDate: "12 Mar 2025", dependsOn: null, status: "Completed"   },
      { id: "t2", name: "Kitchen beam repair & reinforcement",        assignedTo: "Ramesh Kumar",  dueDate: "28 Mar 2025", dependsOn: "t1", status: "Completed"   },
      { id: "t3", name: "Master bedroom wall levelling",              assignedTo: "Karthik Rajan", dueDate: "15 Apr 2025", dependsOn: "t2", status: "In Progress" },
      { id: "t4", name: "Bathroom waterproofing",                     assignedTo: "Ramesh Kumar",  dueDate: "20 Apr 2025", dependsOn: "t3", status: "Pending"     },
      { id: "t5", name: "Floor tile base preparation — all rooms",    assignedTo: "Vijay S",       dueDate: "30 Apr 2025", dependsOn: "t4", status: "Pending"     },
    ],
    dailyReports: [
      { id: "dr1", date: "18 Apr 2025", supervisor: "Ramesh Kumar", summary: "Wall levelling in progress for master bedroom. Cement shortage delayed morning session. Resumed after 2 PM with new stock delivery.", hasPhoto: false },
      { id: "dr2", date: "16 Apr 2025", supervisor: "Ramesh Kumar", summary: "Kitchen beam reinforcement completed and inspected. Structural engineer signed off. Moving to wall levelling next.",                   hasPhoto: true  },
    ],
  },
  4: {
    id: 4,
    name: "Avinashi Rd Bungalow",
    client: "Meena Subramanian",
    address: "23, Avinashi Road, Peelamedu, Coimbatore – 641 004",
    startDate: "01 Dec 2024",
    endDate: "31 Jul 2025",
    supervisor: "Vijay S",
    budget: "₹15,00,000",
    spent: "₹8,25,000",
    status: "On Track",
    progress: 55,
    phases: [
      { id: "demolition",    label: "Demolition",    status: "done"    },
      { id: "civil",         label: "Civil",         status: "done"    },
      { id: "electrical",    label: "Electrical",    status: "done"    },
      { id: "plumbing",      label: "Plumbing",      status: "done"    },
      { id: "false-ceiling", label: "False Ceiling", status: "active"  },
      { id: "carpentry",     label: "Carpentry",     status: "pending" },
      { id: "painting",      label: "Painting",      status: "pending" },
      { id: "cleaning",      label: "Cleaning",      status: "pending" },
      { id: "handover",      label: "Handover",      status: "pending" },
    ],
    tasks: [
      { id: "t1", name: "Living room false ceiling grid",     assignedTo: "Vijay S",       dueDate: "20 Apr 2025", dependsOn: null, status: "In Progress" },
      { id: "t2", name: "Master bedroom ceiling board",       assignedTo: "Karthik Rajan", dueDate: "23 Apr 2025", dependsOn: "t1", status: "Pending"     },
      { id: "t3", name: "Dining cove lighting cutouts",       assignedTo: "Vijay S",       dueDate: "26 Apr 2025", dependsOn: "t2", status: "Pending"     },
      { id: "t4", name: "Ceiling finishing & skim coat",      assignedTo: "Karthik Rajan", dueDate: "05 May 2025", dependsOn: "t3", status: "Pending"     },
    ],
    dailyReports: [
      { id: "dr1", date: "18 Apr 2025", supervisor: "Vijay S", summary: "Living room ceiling grid completed. 70% of boards placed. Cove channel measurement done for lighting. 3 workers on site.", hasPhoto: true  },
      { id: "dr2", date: "17 Apr 2025", supervisor: "Vijay S", summary: "Grid installation started for living room. MS angles fixed and levelled. No issues with ceiling height clearance.",         hasPhoto: false },
    ],
  },
  5: {
    id: 5,
    name: "Peelamedu Clinic",
    client: "Dr. Anand Kumar",
    address: "Shop 12, Meenakshi Complex, Peelamedu Main Road, Coimbatore – 641 004",
    startDate: "15 Mar 2025",
    endDate: "15 Jul 2025",
    supervisor: "Karthik Rajan",
    budget: "₹3,80,000",
    spent: "₹76,000",
    status: "Critical",
    progress: 20,
    phases: [
      { id: "demolition",    label: "Demolition",    status: "done"    },
      { id: "civil",         label: "Civil",         status: "done"    },
      { id: "electrical",    label: "Electrical",    status: "active"  },
      { id: "plumbing",      label: "Plumbing",      status: "pending" },
      { id: "false-ceiling", label: "False Ceiling", status: "pending" },
      { id: "carpentry",     label: "Carpentry",     status: "pending" },
      { id: "painting",      label: "Painting",      status: "pending" },
      { id: "cleaning",      label: "Cleaning",      status: "pending" },
      { id: "handover",      label: "Handover",      status: "pending" },
    ],
    tasks: [
      { id: "t1", name: "Main panel installation",          assignedTo: "Karthik Rajan", dueDate: "05 Apr 2025", dependsOn: null, status: "Completed"   },
      { id: "t2", name: "Conduit laying — treatment rooms", assignedTo: "Vijay S",       dueDate: "15 Apr 2025", dependsOn: "t1", status: "In Progress" },
      { id: "t3", name: "MCB & distribution board wiring",  assignedTo: "Karthik Rajan", dueDate: "22 Apr 2025", dependsOn: "t2", status: "Pending"     },
      { id: "t4", name: "Earthing & load testing",          assignedTo: "Karthik Rajan", dueDate: "28 Apr 2025", dependsOn: "t3", status: "Pending"     },
    ],
    dailyReports: [
      { id: "dr1", date: "18 Apr 2025", supervisor: "Karthik Rajan", summary: "Conduit laying delayed — contractor absent. Work partially done by remaining crew. Issue escalated to admin. 3-day delay expected.", hasPhoto: false },
      { id: "dr2", date: "16 Apr 2025", supervisor: "Karthik Rajan", summary: "Main panel installed and inspected. Load calculation sheet shared with client. Conduit material partially received on site.",        hasPhoto: true  },
    ],
  },
  6: {
    id: 6,
    name: "Ganapathy Flat Reno",
    client: "Lakshmi Venkat",
    address: "Flat 2A, Sri Sai Apartments, Ganapathy, Coimbatore – 641 006",
    startDate: "01 Sep 2024",
    endDate: "30 Apr 2025",
    supervisor: "Vijay S",
    budget: "₹4,50,000",
    spent: "₹4,27,500",
    status: "On Track",
    progress: 95,
    phases: [
      { id: "demolition",    label: "Demolition",    status: "done"   },
      { id: "civil",         label: "Civil",         status: "done"   },
      { id: "electrical",    label: "Electrical",    status: "done"   },
      { id: "plumbing",      label: "Plumbing",      status: "done"   },
      { id: "false-ceiling", label: "False Ceiling", status: "done"   },
      { id: "carpentry",     label: "Carpentry",     status: "done"   },
      { id: "painting",      label: "Painting",      status: "done"   },
      { id: "cleaning",      label: "Cleaning",      status: "done"   },
      { id: "handover",      label: "Handover",      status: "active" },
    ],
    tasks: [
      { id: "t1", name: "Final snag list walkthrough",              assignedTo: "Vijay S",       dueDate: "20 Apr 2025", dependsOn: null, status: "Completed"   },
      { id: "t2", name: "Touch-up painting — 3 areas",              assignedTo: "Vijay S",       dueDate: "22 Apr 2025", dependsOn: "t1", status: "Completed"   },
      { id: "t3", name: "Deep cleaning — all rooms",                assignedTo: "Karthik Rajan", dueDate: "24 Apr 2025", dependsOn: "t2", status: "In Progress" },
      { id: "t4", name: "Photo documentation & handover kit",       assignedTo: "Vijay S",       dueDate: "27 Apr 2025", dependsOn: "t3", status: "Pending"     },
      { id: "t5", name: "Client handover & key handoff",            assignedTo: "Vijay S",       dueDate: "30 Apr 2025", dependsOn: "t4", status: "Pending"     },
    ],
    dailyReports: [
      { id: "dr1", date: "18 Apr 2025", supervisor: "Vijay S",   summary: "Touch-up painting completed. Cleaning team started today. 3D renders reviewed with client — final approval received.",              hasPhoto: true  },
      { id: "dr2", date: "17 Apr 2025", supervisor: "Vijay S",   summary: "Snag list cleared. 4 minor touch-ups identified and assigned to painter. Client visit scheduled for 20th. Quality is excellent.",     hasPhoto: false },
      { id: "dr3", date: "16 Apr 2025", supervisor: "Kavitha M", summary: "3D render walkthrough done with client. Client requested one change to TV unit finish — approved and noted. No structural changes.", hasPhoto: true  },
    ],
  },
}

export const projectPnL = [
  { id: 1, name: "Raj Nagar Villa",      client: "Priya Krishnamurthy", budget: 850000,  spent: 578000,  collected: 510000  },
  { id: 2, name: "Tidel Park Office",    client: "TechSoft Solutions",  budget: 1200000, spent: 1240000, collected: 1200000 },
  { id: 3, name: "RS Puram Apartment",   client: "Suresh Balaji",       budget: 520000,  spent: 182000,  collected: 104000  },
  { id: 4, name: "Avinashi Rd Bungalow", client: "Meena Subramanian",   budget: 1500000, spent: 825000,  collected: 750000  },
  { id: 5, name: "Peelamedu Clinic",     client: "Dr. Anand Kumar",     budget: 380000,  spent: 76000,   collected: 0       },
  { id: 6, name: "Ganapathy Flat Reno",  client: "Lakshmi Venkat",      budget: 450000,  spent: 427500,  collected: 450000  },
]

export const invoices = [
  { id: "INV-042", client: "Priya Krishnamurthy", project: "Raj Nagar Villa",      amount: 85000,  date: "15 May 2026", status: "Pending" },
  { id: "INV-041", client: "TechSoft Solutions",  project: "Tidel Park Office",    amount: 240000, date: "05 May 2026", status: "Paid"    },
  { id: "INV-040", client: "Meena Subramanian",   project: "Avinashi Rd Bungalow", amount: 150000, date: "28 Apr 2026", status: "Overdue" },
  { id: "INV-039", client: "TechSoft Solutions",  project: "Tidel Park Office",    amount: 360000, date: "10 Apr 2026", status: "Paid"    },
  { id: "INV-038", client: "Lakshmi Venkat",      project: "Ganapathy Flat Reno",  amount: 45000,  date: "02 Apr 2026", status: "Paid"    },
  { id: "INV-037", client: "Suresh Balaji",       project: "RS Puram Apartment",   amount: 52000,  date: "20 Mar 2026", status: "Overdue" },
  { id: "INV-036", client: "Dr. Anand Kumar",     project: "Peelamedu Clinic",     amount: 38000,  date: "01 Mar 2026", status: "Overdue" },
  { id: "INV-035", client: "Priya Krishnamurthy", project: "Raj Nagar Villa",      amount: 170000, date: "01 Feb 2026", status: "Paid"    },
]

export const pendingMilestones = [
  { id: "m1", client: "Meena Subramanian", project: "Avinashi Rd Bungalow", milestone: "False Ceiling Completion", amount: 150000, dueDate: "30 Apr 2026", daysOverdue: 21 },
  { id: "m2", client: "Suresh Balaji",     project: "RS Puram Apartment",   milestone: "Civil Phase Completion",   amount: 52000,  dueDate: "10 May 2026", daysOverdue: 11 },
  { id: "m3", client: "Dr. Anand Kumar",   project: "Peelamedu Clinic",     milestone: "Site Mobilisation",        amount: 38000,  dueDate: "01 May 2026", daysOverdue: 20 },
]

export const attendanceRecords = [
  { id: 1,  name: "Akash R",       role: "Admin",       type: "staff",  present: 18, absent: 1, leaves: 1, todayStatus: "Present", initials: "AR"                          },
  { id: 2,  name: "Ramesh Kumar",  role: "Supervisor",  type: "staff",  present: 17, absent: 1, leaves: 2, personalLeavesTaken: 1, todayStatus: "Present", initials: "RK", projectIds: [1, 3] },
  { id: 3,  name: "Karthik Rajan", role: "Supervisor",  type: "staff",  present: 16, absent: 2, leaves: 2, todayStatus: "Absent",  initials: "KR", projectIds: [2, 5]      },
  { id: 4,  name: "Vijay S",       role: "Supervisor",  type: "staff",  present: 15, absent: 3, leaves: 2, todayStatus: "Present", initials: "VS", projectIds: [4, 6]      },
  { id: 5,  name: "Kavitha M",     role: "Designer",    type: "staff",  present: 18, absent: 1, leaves: 1, todayStatus: "Present", initials: "KM"                          },
  { id: 6,  name: "Deepa R",       role: "Designer",    type: "staff",  present: 14, absent: 3, leaves: 3, todayStatus: "Absent",  initials: "DR"                          },
  { id: 7,  name: "Murugan K",     role: "Carpenter",   type: "worker", present: 19, absent: 0, leaves: 1, todayStatus: "Present", initials: "MK", projectId: 1            },
  { id: 8,  name: "Selvam R",      role: "Mason",       type: "worker", present: 17, absent: 2, leaves: 1, todayStatus: "Present", initials: "SR", projectId: 1            },
  { id: 9,  name: "Balamurugan",   role: "Electrician", type: "worker", present: 14, absent: 4, leaves: 2, todayStatus: "Absent",  initials: "BG", projectId: 1            },
  { id: 10, name: "Arumugam",      role: "Helper",      type: "worker", present: 20, absent: 0, leaves: 0, todayStatus: "Present", initials: "AG", projectId: 1            },
  { id: 11, name: "Saravanan",     role: "Painter",     type: "worker", present: 16, absent: 2, leaves: 2, todayStatus: "Present", initials: "SV", projectId: 1            },
  { id: 12, name: "Pandi R",       role: "Carpenter",   type: "worker", present: 15, absent: 3, leaves: 2, todayStatus: "Present", initials: "PR", projectId: 3            },
  { id: 13, name: "Manikandan",    role: "Mason",       type: "worker", present: 13, absent: 5, leaves: 2, todayStatus: "Absent",  initials: "MN", projectId: 3            },
]

export const leaveRequests = [
  {
    id: "lr1", name: "Balamurugan", role: "Electrician", type: "worker", projectId: 1,
    from: "22 May 2026", to: "23 May 2026", days: 2,
    reason: "Sister's wedding ceremony at hometown",
    leaveType: "Casual", contact: "Murugan K (site foreman)", notes: "Will return by 24th morning",
    proof: null,
  },
  {
    id: "lr2", name: "Karthik Rajan", role: "Supervisor", type: "staff", projectIds: [2, 5],
    from: "25 May 2026", to: "26 May 2026", days: 2,
    reason: "Follow-up consultation at Apollo Hospital",
    leaveType: "Medical", contact: "Vijay S (alternate supervisor)", notes: "Site handover notes shared with Vijay",
    proof: { name: "apollo_appointment_letter.pdf", fileType: "pdf" },
  },
  {
    id: "lr3", name: "Manikandan", role: "Mason", type: "worker", projectId: 3,
    from: "27 May 2026", to: "27 May 2026", days: 1,
    reason: "Personal family matter",
    leaveType: "Personal", contact: "Pandi R", notes: "",
    proof: null,
  },
  {
    id: "lr4", name: "Deepa R", role: "Designer", type: "staff",
    from: "28 May 2026", to: "29 May 2026", days: 2,
    reason: "Fever and throat infection, doctor advised rest",
    leaveType: "Sick", contact: "Kavitha M", notes: "Handoff files sent to Kavitha",
    proof: { name: "prescription_deepa_may26.jpg", fileType: "image" },
  },
]

export const calendarAttendance = {
  1: 'high', 4: 'high', 5: 'medium', 6: 'high', 7: 'high', 8: 'high',
  11: 'high', 12: 'low', 13: 'high', 14: 'high', 15: 'high',
  18: 'high', 19: 'medium', 20: 'high',
}

export const supervisorData = {
  name: "Ramesh Kumar",
  role: "Supervisor",
  initials: "RK",
  projectIds: [1, 3],
  workers: [
    { id: "w1", name: "Murugan K",   role: "Carpenter",  present: true  },
    { id: "w2", name: "Selvam R",    role: "Mason",       present: true  },
    { id: "w3", name: "Balamurugan", role: "Electrician", present: false },
    { id: "w4", name: "Arumugam",    role: "Helper",      present: true  },
    { id: "w5", name: "Saravanan",   role: "Painter",     present: true  },
  ],
  todayTasks: [
    { id: "st1", task: "Inspect wardrobe frame progress",          project: "Raj Nagar Villa",    projectId: 1, priority: "high",   done: false },
    { id: "st2", task: "Verify morning material delivery",          project: "Raj Nagar Villa",    projectId: 1, priority: "medium", done: true  },
    { id: "st3", task: "Check master bedroom wall levelling",       project: "RS Puram Apartment", projectId: 3, priority: "high",   done: false },
    { id: "st4", task: "Submit yesterday's daily report",           project: "RS Puram Apartment", projectId: 3, priority: "medium", done: false },
    { id: "st5", task: "Coordinate with plumber re: waterproofing", project: "RS Puram Apartment", projectId: 3, priority: "low",    done: false },
  ],
  alerts: [
    { id: "a1", text: "Cement stock low — RS Puram site needs replenishment",  time: "2h ago",    type: "warning" },
    { id: "a2", text: "Client visit scheduled — Raj Nagar Villa on 22 Apr",    time: "Yesterday", type: "info"    },
    { id: "a3", text: "Balamurugan absent today — reassign electrical tasks",   time: "8h ago",    type: "warning" },
  ],
}

export const recentActivity = [
  {
    id: 1,
    type: "task",
    actor: "Ramesh Kumar",
    action: "updated task in",
    target: "Raj Nagar Villa",
    detail: "Carpentry phase marked 68% complete",
    time: "10m ago",
  },
  {
    id: 2,
    type: "invoice",
    actor: "Akash R",
    action: "sent invoice to",
    target: "Priya Krishnamurthy",
    detail: "₹85,000 — Invoice #INV-042",
    time: "1h ago",
  },
  {
    id: 3,
    type: "task",
    actor: "Karthik Rajan",
    action: "completed task in",
    target: "Tidel Park Office",
    detail: "Flooring phase marked done",
    time: "2h ago",
  },
  {
    id: 4,
    type: "finance",
    actor: "Akash R",
    action: "approved budget for",
    target: "Avinashi Rd Bungalow",
    detail: "₹15,00,000 budget approved",
    time: "3h ago",
  },
  {
    id: 5,
    type: "alert",
    actor: "Vijay S",
    action: "raised issue on",
    target: "Peelamedu Clinic",
    detail: "Electrical delay — estimated 3 days",
    time: "5h ago",
  },
  {
    id: 6,
    type: "payment",
    actor: "System",
    action: "payment received from",
    target: "TechSoft Solutions",
    detail: "₹2,40,000 — 2nd milestone cleared",
    time: "Yesterday",
  },
  {
    id: 7,
    type: "design",
    actor: "Kavitha M",
    action: "uploaded renders for",
    target: "Ganapathy Flat Reno",
    detail: "3D renders — final walkthrough ready",
    time: "Yesterday",
  },
]

export const notifications = {
  Admin: [
    { id: 'n1', type: 'leave',   title: 'Leave Request Pending',  body: 'Balamurugan requested 2-day casual leave',            time: '10 min ago', unread: true  },
    { id: 'n2', type: 'leave',   title: 'Leave Request Pending',  body: 'Karthik Rajan submitted medical leave with proof',    time: '2 hrs ago',  unread: true  },
    { id: 'n3', type: 'delay',   title: 'Project Delayed',        body: 'RS Puram Apartment is behind schedule',               time: '3 hrs ago',  unread: true  },
    { id: 'n4', type: 'invoice', title: 'Invoice Overdue',        body: 'INV-040 · Meena Subramanian · ₹1,50,000 overdue',    time: '1 day ago',  unread: true  },
    { id: 'n5', type: 'task',    title: 'Daily Report Received',  body: 'Ramesh Kumar submitted Raj Nagar site report',        time: '2 days ago', unread: false },
    { id: 'n6', type: 'payment', title: 'Payment Received',       body: 'Priya Krishnamurthy paid ₹1,70,000 (Raj Nagar)',     time: '3 days ago', unread: false },
  ],
  Supervisor: [
    { id: 's1', type: 'task',    title: 'Daily Report Due',       body: 'Submit your daily report for RS Puram Apartment',    time: '1 hr ago',   unread: true  },
    { id: 's2', type: 'delay',   title: 'Site Alert',             body: 'RS Puram civil phase is 3 days behind schedule',     time: '3 hrs ago',  unread: true  },
    { id: 's3', type: 'leave',   title: 'Leave Pending Approval', body: 'Your leave request is under review by Admin',        time: '4 hrs ago',  unread: true  },
    { id: 's4', type: 'task',    title: 'Worker Absent',          body: 'Balamurugan is marked absent today',                 time: '8 hrs ago',  unread: false },
    { id: 's5', type: 'task',    title: 'Delivery Confirmed',     body: 'Morning material delivery for Raj Nagar confirmed',  time: '1 day ago',  unread: false },
  ],
  Designer: [
    { id: 'd1', type: 'task',    title: 'Design Review Due',      body: 'RS Puram interior design review is pending',         time: '2 hrs ago',  unread: true  },
    { id: 'd2', type: 'task',    title: 'Client Feedback',        body: 'Priya Krishnamurthy reviewed Raj Nagar concept',     time: '1 day ago',  unread: false },
  ],
  Client: [
    { id: 'c1', type: 'task',    title: 'Project Update',         body: 'Raj Nagar Villa reached 68% completion',             time: '1 hr ago',   unread: true  },
    { id: 'c2', type: 'invoice', title: 'Invoice Due',            body: 'Payment of ₹1,50,000 due for Raj Nagar Villa',      time: '2 days ago', unread: false },
  ],
}

export const calendarEvents = [
  { id: 'e1',  date: '2026-05-21', title: 'Daily Standup',                    type: 'meeting',  time: '8:30 AM',  projectId: null, roles: ['Admin','Supervisor','Designer'] },
  { id: 'e2',  date: '2026-05-22', title: 'Raj Nagar — Client Review',        type: 'meeting',  time: '10:00 AM', projectId: 1,    roles: ['Admin','Supervisor']            },
  { id: 'e3',  date: '2026-05-23', title: 'RS Puram Civil Phase Deadline',    type: 'deadline', time: 'All day',  projectId: 3,    roles: ['Admin','Supervisor']            },
  { id: 'e4',  date: '2026-05-25', title: 'Team Weekly Meeting',              type: 'meeting',  time: '9:00 AM',  projectId: null, roles: ['Admin','Supervisor','Designer'] },
  { id: 'e5',  date: '2026-05-26', title: 'Tidel Park Painting Completion',   type: 'deadline', time: 'All day',  projectId: 2,    roles: ['Admin']                         },
  { id: 'e6',  date: '2026-05-27', title: 'Material Procurement Review',      type: 'task',     time: '4:00 PM',  projectId: 1,    roles: ['Supervisor']                    },
  { id: 'e7',  date: '2026-05-28', title: 'Client Payment Follow-up',         type: 'task',     time: '2:00 PM',  projectId: null, roles: ['Admin']                         },
  { id: 'e8',  date: '2026-05-28', title: 'Design Concept Presentation',      type: 'meeting',  time: '11:00 AM', projectId: 4,    roles: ['Admin','Designer']              },
  { id: 'e9',  date: '2026-05-30', title: 'Avinashi Rd False Ceiling Review', type: 'meeting',  time: '11:30 AM', projectId: 4,    roles: ['Admin','Supervisor']            },
  { id: 'e10', date: '2026-06-01', title: 'New Project Kickoff',              type: 'meeting',  time: '3:00 PM',  projectId: null, roles: ['Admin']                         },
  { id: 'e11', date: '2026-06-05', title: 'Peelamedu Electrical Deadline',    type: 'deadline', time: 'All day',  projectId: 5,    roles: ['Admin','Supervisor']            },
  { id: 'e12', date: '2026-06-10', title: 'Q2 Financial Review',              type: 'meeting',  time: '2:00 PM',  projectId: null, roles: ['Admin']                         },
]

export const quotations = [
  { id: 'Q-2026-008', client: 'Nandini Sharma',    project: 'Anna Nagar Flat',       amount: 380000, date: '15 May 2026', status: 'Sent',     validUntil: '15 Jun 2026' },
  { id: 'Q-2026-007', client: 'Arun Prabhu',        project: 'Coimbatore Villa',      amount: 920000, date: '10 May 2026', status: 'Approved', validUntil: '10 Jun 2026' },
  { id: 'Q-2026-006', client: 'Rekha Mohan',        project: 'Peelamedu Office Reno', amount: 450000, date: '02 May 2026', status: 'Sent',     validUntil: '02 Jun 2026' },
  { id: 'Q-2026-005', client: 'TechSoft Solutions', project: 'Conference Room Setup', amount: 280000, date: '28 Apr 2026', status: 'Rejected', validUntil: '28 May 2026' },
  { id: 'Q-2026-004', client: 'Dr. Anand Kumar',    project: 'Clinic Reception Area', amount: 180000, date: '15 Apr 2026', status: 'Approved', validUntil: '15 May 2026' },
]

export const payments = [
  { id: 'PAY-050', client: 'Priya Krishnamurthy', project: 'Raj Nagar Villa',      amount: 170000, date: '01 May 2026', method: 'Bank Transfer', invoiceId: 'INV-035', status: 'Cleared' },
  { id: 'PAY-049', client: 'TechSoft Solutions',  project: 'Tidel Park Office',    amount: 360000, date: '20 Apr 2026', method: 'NEFT',          invoiceId: 'INV-039', status: 'Cleared' },
  { id: 'PAY-048', client: 'Lakshmi Venkat',      project: 'Ganapathy Flat Reno',  amount: 45000,  date: '05 Apr 2026', method: 'UPI',           invoiceId: 'INV-038', status: 'Cleared' },
  { id: 'PAY-047', client: 'Priya Krishnamurthy', project: 'Raj Nagar Villa',      amount: 200000, date: '15 Mar 2026', method: 'Bank Transfer', invoiceId: 'INV-033', status: 'Cleared' },
  { id: 'PAY-046', client: 'Meena Subramanian',   project: 'Avinashi Rd Bungalow', amount: 150000, date: '—',           method: '—',             invoiceId: 'INV-040', status: 'Pending' },
  { id: 'PAY-045', client: 'Suresh Balaji',       project: 'RS Puram Apartment',   amount: 52000,  date: '—',           method: '—',             invoiceId: 'INV-037', status: 'Overdue' },
]

export const chatUsers = [
  { id: 1,  name: 'Akash R',            role: 'Admin',      initials: 'AR', online: true  },
  { id: 2,  name: 'Ramesh Kumar',        role: 'Supervisor', initials: 'RK', online: true  },
  { id: 3,  name: 'Karthik Rajan',       role: 'Supervisor', initials: 'KJ', online: false },
  { id: 4,  name: 'Vijay S',             role: 'Supervisor', initials: 'VS', online: false },
  { id: 5,  name: 'Kavitha M',           role: 'Designer',   initials: 'KM', online: true  },
  { id: 6,  name: 'Deepa R',             role: 'Designer',   initials: 'DR', online: false },
  { id: 7,  name: 'Priya Krishnamurthy', role: 'Client',     initials: 'PK', online: true  },
  { id: 8,  name: 'Suresh Balaji',       role: 'Client',     initials: 'SB', online: false },
  { id: 9,  name: 'Meena Subramanian',   role: 'Client',     initials: 'MS', online: false },
  { id: 10, name: 'Dr. Anand Kumar',     role: 'Client',     initials: 'AK', online: true  },
  { id: 11, name: 'Lakshmi Venkat',      role: 'Client',     initials: 'LV', online: false },
  { id: 12, name: 'Murugan K',           role: 'Worker',     initials: 'MK', online: true  },
  { id: 13, name: 'Selvam R',            role: 'Worker',     initials: 'SR', online: true  },
  { id: 14, name: 'Arumugam',            role: 'Worker',     initials: 'AG', online: false },
  { id: 15, name: 'Saravanan',           role: 'Worker',     initials: 'SN', online: true  },
]

export const chatHistory = {
  '1-2': [
    { id: 'm1', from: 2, text: 'Sir, RS Puram civil phase is running 3 days behind.', time: '09:15 AM', date: '2026-05-21' },
    { id: 'm2', from: 1, text: 'How much delay are we looking at? Is it recoverable?', time: '09:18 AM', date: '2026-05-21' },
    { id: 'm3', from: 2, text: 'Yes sir, deploying 2 extra masons from tomorrow should recover it in 2 days.', time: '09:20 AM', date: '2026-05-21' },
    { id: 'm4', from: 1, text: 'Okay, coordinate with procurement and get them on site by tomorrow morning.', time: '09:22 AM', date: '2026-05-21' },
  ],
  '1-5': [
    { id: 'm5', from: 5, text: 'Akash sir, the 3D renders for Raj Nagar are ready. Share with client directly?', time: '11:00 AM', date: '2026-05-20' },
    { id: 'm6', from: 1, text: 'Yes, go ahead. CC me on the email too.', time: '11:05 AM', date: '2026-05-20' },
    { id: 'm7', from: 5, text: 'Done sir, email sent to Priya.', time: '11:20 AM', date: '2026-05-20' },
  ],
  '1-7': [
    { id: 'm8',  from: 7, text: 'Hi, wanted to check on the Raj Nagar Villa progress. Any updates?', time: '02:00 PM', date: '2026-05-20' },
    { id: 'm9',  from: 1, text: 'Hi Priya! Carpentry is at 68%, on track for the June 15 handover.', time: '02:10 PM', date: '2026-05-20' },
    { id: 'm10', from: 7, text: 'Great, can we schedule a site visit next week?', time: '02:15 PM', date: '2026-05-20' },
    { id: 'm11', from: 1, text: 'Absolutely — how about May 26 at 10 AM?', time: '02:18 PM', date: '2026-05-20' },
    { id: 'm12', from: 7, text: 'Perfect, confirmed!', time: '02:20 PM', date: '2026-05-20' },
  ],
  '1-3': [
    { id: 'm13', from: 3, text: 'Sir, Tidel Park painting is almost done. Expecting completion by 26 May.', time: '10:00 AM', date: '2026-05-19' },
    { id: 'm14', from: 1, text: 'Good work Karthik. Get the punch list ready before the final inspection.', time: '10:05 AM', date: '2026-05-19' },
  ],
  '2-5': [
    { id: 'm15', from: 2, text: 'Kavitha, client wants changes to the master bedroom — warmer tones, less grey.', time: '10:30 AM', date: '2026-05-19' },
    { id: 'm16', from: 5, text: 'Sure, I will revise the palette with beige and cream tones.', time: '10:35 AM', date: '2026-05-19' },
    { id: 'm17', from: 2, text: 'Great, share the updated concept by tomorrow.', time: '10:38 AM', date: '2026-05-19' },
  ],
  '1-9': [
    { id: 'm18', from: 9, text: 'Hello, I have a concern about the budget overrun on the Avinashi project.', time: '03:00 PM', date: '2026-05-18' },
    { id: 'm19', from: 1, text: 'Hi Meena, the overrun is about 8%. I will send you a detailed breakdown today.', time: '03:15 PM', date: '2026-05-18' },
  ],
  '1-12': [
    { id: 'm20', from: 12, text: 'Sir, wardrobe frame for bedroom 2 is complete.', time: '08:45 AM', date: '2026-05-21' },
    { id: 'm21', from: 1, text: 'Good Murugan. Start on the kitchen cabinets next.', time: '09:00 AM', date: '2026-05-21' },
  ],
}

export const revenueTimeSeries = {
  day: [
    { time: '8 AM',  revenue: 8000,  expenses: 4500  },
    { time: '10 AM', revenue: 22000, expenses: 13000 },
    { time: '12 PM', revenue: 31000, expenses: 18500 },
    { time: '2 PM',  revenue: 43000, expenses: 26000 },
    { time: '4 PM',  revenue: 57000, expenses: 34000 },
    { time: '6 PM',  revenue: 68000, expenses: 41000 },
  ],
  week: [
    { time: 'Mon', revenue: 95000,  expenses: 58000  },
    { time: 'Tue', revenue: 128000, expenses: 79000  },
    { time: 'Wed', revenue: 84000,  expenses: 52000  },
    { time: 'Thu', revenue: 155000, expenses: 94000  },
    { time: 'Fri', revenue: 112000, expenses: 68000  },
    { time: 'Sat', revenue: 73000,  expenses: 44000  },
    { time: 'Sun', revenue: 28000,  expenses: 16000  },
  ],
  month: [
    { time: 'Week 1', revenue: 520000, expenses: 315000 },
    { time: 'Week 2', revenue: 680000, expenses: 418000 },
    { time: 'Week 3', revenue: 595000, expenses: 362000 },
    { time: 'Week 4', revenue: 705000, expenses: 435000 },
  ],
}

export const attendanceTrend = {
  day: [
    { time: '8 AM', present: 9,  absent: 6  },
    { time: '9 AM', present: 13, absent: 2  },
    { time: '10 AM',present: 14, absent: 1  },
    { time: '12 PM',present: 14, absent: 1  },
    { time: '2 PM', present: 12, absent: 3  },
    { time: '5 PM', present: 11, absent: 4  },
  ],
  week: [
    { time: 'Mon', present: 13, absent: 2 },
    { time: 'Tue', present: 14, absent: 1 },
    { time: 'Wed', present: 12, absent: 3 },
    { time: 'Thu', present: 15, absent: 0 },
    { time: 'Fri', present: 11, absent: 4 },
    { time: 'Sat', present: 9,  absent: 6 },
    { time: 'Sun', present: 4,  absent: 11},
  ],
  month: [
    { time: 'Week 1', present: 68, absent: 17 },
    { time: 'Week 2', present: 72, absent: 13 },
    { time: 'Week 3', present: 65, absent: 20 },
    { time: 'Week 4', present: 71, absent: 14 },
  ],
}

export const taskCompletionTrend = {
  day: [
    { time: '8 AM',  completed: 0,  pending: 11 },
    { time: '10 AM', completed: 2,  pending: 9  },
    { time: '12 PM', completed: 5,  pending: 6  },
    { time: '2 PM',  completed: 7,  pending: 4  },
    { time: '4 PM',  completed: 9,  pending: 2  },
    { time: '6 PM',  completed: 10, pending: 1  },
  ],
  week: [
    { time: 'Mon', completed: 8,  pending: 14 },
    { time: 'Tue', completed: 12, pending: 10 },
    { time: 'Wed', completed: 9,  pending: 13 },
    { time: 'Thu', completed: 15, pending: 7  },
    { time: 'Fri', completed: 11, pending: 9  },
    { time: 'Sat', completed: 6,  pending: 5  },
    { time: 'Sun', completed: 2,  pending: 3  },
  ],
  month: [
    { time: 'Week 1', completed: 42, pending: 18 },
    { time: 'Week 2', completed: 58, pending: 12 },
    { time: 'Week 3', completed: 49, pending: 21 },
    { time: 'Week 4', completed: 63, pending: 9  },
  ],
}

export const svRevenueTimeSeries = {
  day: [
    { time: '8 AM',  budget: 12000, actual: 8500  },
    { time: '10 AM', budget: 12000, actual: 11000 },
    { time: '12 PM', budget: 12000, actual: 9500  },
    { time: '2 PM',  budget: 12000, actual: 13000 },
    { time: '4 PM',  budget: 12000, actual: 10500 },
    { time: '6 PM',  budget: 12000, actual: 11500 },
  ],
  week: [
    { time: 'Mon', budget: 80000, actual: 62000 },
    { time: 'Tue', budget: 80000, actual: 75000 },
    { time: 'Wed', budget: 80000, actual: 58000 },
    { time: 'Thu', budget: 80000, actual: 88000 },
    { time: 'Fri', budget: 80000, actual: 71000 },
    { time: 'Sat', budget: 80000, actual: 45000 },
    { time: 'Sun', budget: 80000, actual: 18000 },
  ],
  month: [
    { time: 'Week 1', budget: 342000, actual: 285000 },
    { time: 'Week 2', budget: 342000, actual: 318000 },
    { time: 'Week 3', budget: 342000, actual: 296000 },
    { time: 'Week 4', budget: 342000, actual: 329000 },
  ],
}

export const svAttendanceTrend = {
  day: [
    { time: '8 AM', present: 3, absent: 2 },
    { time: '9 AM', present: 4, absent: 1 },
    { time: '10 AM',present: 4, absent: 1 },
    { time: '12 PM',present: 4, absent: 1 },
    { time: '2 PM', present: 3, absent: 2 },
    { time: '5 PM', present: 4, absent: 1 },
  ],
  week: [
    { time: 'Mon', present: 4, absent: 1 },
    { time: 'Tue', present: 5, absent: 0 },
    { time: 'Wed', present: 4, absent: 1 },
    { time: 'Thu', present: 5, absent: 0 },
    { time: 'Fri', present: 3, absent: 2 },
    { time: 'Sat', present: 4, absent: 1 },
    { time: 'Sun', present: 2, absent: 3 },
  ],
  month: [
    { time: 'Week 1', present: 24, absent: 6  },
    { time: 'Week 2', present: 28, absent: 2  },
    { time: 'Week 3', present: 22, absent: 8  },
    { time: 'Week 4', present: 26, absent: 4  },
  ],
}

export const svTaskTrend = {
  day: [
    { time: '8 AM',  completed: 0, pending: 5 },
    { time: '10 AM', completed: 1, pending: 4 },
    { time: '12 PM', completed: 2, pending: 3 },
    { time: '2 PM',  completed: 3, pending: 2 },
    { time: '4 PM',  completed: 4, pending: 1 },
    { time: '6 PM',  completed: 4, pending: 1 },
  ],
  week: [
    { time: 'Mon', completed: 3, pending: 7 },
    { time: 'Tue', completed: 5, pending: 5 },
    { time: 'Wed', completed: 4, pending: 6 },
    { time: 'Thu', completed: 6, pending: 4 },
    { time: 'Fri', completed: 5, pending: 5 },
    { time: 'Sat', completed: 2, pending: 3 },
    { time: 'Sun', completed: 1, pending: 2 },
  ],
  month: [
    { time: 'Week 1', completed: 18, pending: 7 },
    { time: 'Week 2', completed: 22, pending: 3 },
    { time: 'Week 3', completed: 19, pending: 6 },
    { time: 'Week 4', completed: 24, pending: 1 },
  ],
}

export const clients = [
  { id: 1, name: 'Priya Krishnamurthy', phone: '+91 98400 12345', email: 'priya.k@email.com',   city: 'Coimbatore', activeProjects: [1],    totalValue: 850000,  lastContact: '2026-05-20' },
  { id: 2, name: 'TechSoft Solutions',  phone: '+91 97800 56789', email: 'info@techsoft.in',    city: 'Coimbatore', activeProjects: [2],    totalValue: 1200000, lastContact: '2026-05-18' },
  { id: 3, name: 'Suresh Balaji',       phone: '+91 94430 23456', email: 'suresh.b@gmail.com',  city: 'Coimbatore', activeProjects: [3],    totalValue: 520000,  lastContact: '2026-05-15' },
  { id: 4, name: 'Meena Subramanian',   phone: '+91 98765 34567', email: 'meena.s@email.com',   city: 'Coimbatore', activeProjects: [4],    totalValue: 1500000, lastContact: '2026-05-10' },
  { id: 5, name: 'Dr. Anand Kumar',     phone: '+91 90000 45678', email: 'anand.k@clinic.in',   city: 'Peelamedu',  activeProjects: [5],    totalValue: 380000,  lastContact: '2026-05-08' },
  { id: 6, name: 'Lakshmi Venkat',      phone: '+91 87654 56789', email: 'lakshmi.v@gmail.com', city: 'Ganapathy',  activeProjects: [6],    totalValue: 450000,  lastContact: '2026-05-19' },
  { id: 7, name: 'Nandini Sharma',      phone: '+91 93456 67890', email: 'nandini.s@email.com', city: 'Anna Nagar', activeProjects: [],     totalValue: 380000,  lastContact: '2026-05-14' },
  { id: 8, name: 'Arun Prabhu',         phone: '+91 91234 78901', email: 'arun.p@email.com',    city: 'Coimbatore', activeProjects: [],     totalValue: 920000,  lastContact: '2026-05-11' },
  { id: 9, name: 'Rekha Mohan',         phone: '+91 96780 89012', email: 'rekha.m@email.com',   city: 'Peelamedu',  activeProjects: [],     totalValue: 450000,  lastContact: '2026-05-02' },
]

export const vendors = [
  { id: 1,  name: 'Kumar Carpentry Works',   trade: 'Carpentry',     contact: '+91 98400 11111', email: 'kumar.carp@email.com',    rating: 4.5, usedProjects: 3, paymentOutstanding: 25000  },
  { id: 2,  name: 'Selvam Masonry',           trade: 'Masonry',       contact: '+91 97800 22222', email: 'selvam.masons@email.com', rating: 4.0, usedProjects: 5, paymentOutstanding: 0      },
  { id: 3,  name: 'Bala Electricals',         trade: 'Electrical',    contact: '+91 94430 33333', email: 'bala.elec@email.com',     rating: 3.5, usedProjects: 4, paymentOutstanding: 42000  },
  { id: 4,  name: 'Arumugam Painters',        trade: 'Painting',      contact: '+91 98765 44444', email: 'arumugam.p@email.com',    rating: 4.8, usedProjects: 6, paymentOutstanding: 0      },
  { id: 5,  name: 'Chennai Plumbing Co.',     trade: 'Plumbing',      contact: '+91 90000 55555', email: 'cpc@email.com',           rating: 4.2, usedProjects: 3, paymentOutstanding: 18000  },
  { id: 6,  name: 'RS Fabrication',           trade: 'Fabrication',   contact: '+91 87654 66666', email: 'rs.fab@email.com',        rating: 3.8, usedProjects: 2, paymentOutstanding: 35000  },
  { id: 7,  name: 'Modern False Ceiling',     trade: 'False Ceiling', contact: '+91 93456 77777', email: 'modernfc@email.com',      rating: 4.6, usedProjects: 4, paymentOutstanding: 0      },
  { id: 8,  name: 'GK Flooring Solutions',    trade: 'Flooring',      contact: '+91 91234 88888', email: 'gkfloor@email.com',       rating: 4.1, usedProjects: 5, paymentOutstanding: 12000  },
  { id: 9,  name: 'Vijay Tiles & Marbles',    trade: 'Tiling',        contact: '+91 95678 99000', email: 'vijaytiles@email.com',    rating: 4.3, usedProjects: 4, paymentOutstanding: 8000   },
  { id: 10, name: 'AK Waterproofing',         trade: 'Waterproofing', contact: '+91 99001 10101', email: 'akwp@email.com',          rating: 3.9, usedProjects: 3, paymentOutstanding: 0      },
]

export const adminTodayTasks = [
  { id: 'at1', task: 'Review and approve 2 pending leave requests',        priority: 'high',   done: false, category: 'HR'            },
  { id: 'at2', task: 'Follow up on overdue invoices — INV-040, INV-037',   priority: 'high',   done: false, category: 'Finance'        },
  { id: 'at3', task: 'Raj Nagar — Client review meeting at 10 AM',        priority: 'high',   done: false, category: 'Meeting'        },
  { id: 'at4', task: 'Check RS Puram civil phase progress report',        priority: 'medium', done: false, category: 'Site Visit'     },
  { id: 'at5', task: 'Review Peelamedu Clinic delay escalation',          priority: 'medium', done: true,  category: 'Site Visit'     },
  { id: 'at6', task: 'Approve material procurement request — Raj Nagar',  priority: 'medium', done: false, category: 'Procurement'    },
  { id: 'at7', task: 'Send weekly status update emails to all clients',   priority: 'low',    done: false, category: 'Communication'  },
]

export const adminWeekTasks = [
  { id: 'aw1',  date: '2026-05-22', task: 'Review leave requests',                  priority: 'high',   category: 'HR'          },
  { id: 'aw2',  date: '2026-05-22', task: 'Raj Nagar — Client review meeting',      priority: 'high',   category: 'Meeting'     },
  { id: 'aw3',  date: '2026-05-22', task: 'Overdue invoice follow-up calls',        priority: 'high',   category: 'Finance'     },
  { id: 'aw4',  date: '2026-05-23', task: 'RS Puram civil phase deadline check',    priority: 'high',   category: 'Site Visit'  },
  { id: 'aw5',  date: '2026-05-23', task: 'Vendor payment clearance review',        priority: 'medium', category: 'Finance'     },
  { id: 'aw6',  date: '2026-05-25', task: 'Team Weekly Meeting at 9 AM',            priority: 'medium', category: 'Meeting'     },
  { id: 'aw7',  date: '2026-05-25', task: 'Client payment follow-up — Meena',      priority: 'high',   category: 'Finance'     },
  { id: 'aw8',  date: '2026-05-26', task: 'Tidel Park Painting completion review',  priority: 'medium', category: 'Site Visit'  },
  { id: 'aw9',  date: '2026-05-27', task: 'RS Puram Progress Meeting',              priority: 'medium', category: 'Meeting'     },
  { id: 'aw10', date: '2026-05-27', task: 'Client payment follow-up — Suresh',     priority: 'medium', category: 'Finance'     },
  { id: 'aw11', date: '2026-05-28', task: 'Avinashi Rd False Ceiling Review',       priority: 'medium', category: 'Site Visit'  },
  { id: 'aw12', date: '2026-05-28', task: 'Design concept presentation — prep',     priority: 'medium', category: 'Design'      },
]

export const svWeekTasks = [
  { id: 'sw1', date: '2026-05-22', task: 'Check master bedroom wall levelling',      priority: 'high',   category: 'Site Visit'   },
  { id: 'sw2', date: '2026-05-22', task: 'Coordinate with plumber — waterproofing',  priority: 'medium', category: 'Site Visit'   },
  { id: 'sw3', date: '2026-05-22', task: 'Submit daily report for RS Puram',         priority: 'medium', category: 'Reporting'    },
  { id: 'sw4', date: '2026-05-23', task: 'RS Puram material restocking order',       priority: 'high',   category: 'Procurement'  },
  { id: 'sw5', date: '2026-05-23', task: 'Inspect wardrobe frame — Raj Nagar',      priority: 'high',   category: 'Site Visit'   },
  { id: 'sw6', date: '2026-05-25', task: 'Team Weekly Meeting at 9 AM',              priority: 'medium', category: 'Meeting'      },
  { id: 'sw7', date: '2026-05-25', task: 'Material procurement review — Raj Nagar', priority: 'medium', category: 'Procurement'  },
  { id: 'sw8', date: '2026-05-27', task: 'RS Puram Weekly Progress Review Meeting',  priority: 'high',   category: 'Meeting'      },
  { id: 'sw9', date: '2026-05-28', task: 'Submit weekly summary report to admin',    priority: 'low',    category: 'Reporting'    },
]

export const seedReminders = [
  { id: 'r1', title: 'Client Visit — Raj Nagar Villa',          datetime: '2026-05-26T10:00', notes: 'Priya Krishnamurthy site visit. Prepare progress report.', done: false },
  { id: 'r2', title: 'Invoice Follow-up — Meena Subramanian',   datetime: '2026-05-28T09:00', notes: 'INV-040 ₹1,50,000 overdue. Call before 10 AM.',           done: false },
  { id: 'r3', title: 'RS Puram Civil Phase Deadline',           datetime: '2026-05-23T08:00', notes: 'Confirm recovery plan with Ramesh.',                       done: false },
  { id: 'r4', title: 'Team Weekly Meeting',                     datetime: '2026-05-25T09:00', notes: 'Review project status updates from all supervisors.',      done: false },
]

// ─────────────────────────────────────────────────────────────────────────────
// DESIGNER DATA
// ─────────────────────────────────────────────────────────────────────────────

export const designerProjects = [
  { id:1, name:'Raj Nagar Villa',      client:'Priya Krishnamurthy', status:'In Progress',     phase:'3D Visualization',  budget:850000,  spent:485000,  progress:48, style:'Contemporary',  area:'2400 sqft', versions:3, pendingApproval:false, startDate:'2026-04-01', deadline:'2026-07-30' },
  { id:2, name:'RS Puram Apartment',   client:'Suresh Balaji',       status:'Pending Approval', phase:'Material Selection', budget:520000,  spent:210000,  progress:35, style:'Minimalist',    area:'1100 sqft', versions:2, pendingApproval:true,  startDate:'2026-03-15', deadline:'2026-06-30' },
  { id:3, name:'Avinashi Rd Bungalow', client:'Meena Subramanian',   status:'Design Complete',  phase:'Handover Prep',      budget:1500000, spent:1100000, progress:72, style:'Classic',       area:'3800 sqft', versions:5, pendingApproval:false, startDate:'2025-11-01', deadline:'2026-08-15' },
  { id:4, name:'Peelamedu Clinic',     client:'Dr. Anand Kumar',     status:'In Progress',     phase:'Mood Board',         budget:380000,  spent:95000,   progress:20, style:'Modern Clinical',area:'800 sqft',  versions:1, pendingApproval:false, startDate:'2026-05-01', deadline:'2026-09-30' },
]

export const furnitureCatalog = [
  { id:1,  name:'L-Shaped Sectional Sofa', category:'Seating',  price:58000, brand:'Urban Living',    color:'#C4A882', w:220, d:160, icon:'sofa'     },
  { id:2,  name:'Dining Table (6-seater)', category:'Dining',   price:42000, brand:'Woodcraft India', color:'#8B6347', w:180, d:90,  icon:'table'    },
  { id:3,  name:'King Bed Frame',          category:'Bedroom',  price:32000, brand:'SleepWell',       color:'#D4B896', w:200, d:200, icon:'bed'      },
  { id:4,  name:'3-Door Wardrobe',         category:'Storage',  price:28000, brand:'WoodWorks',       color:'#A0856A', w:180, d:60,  icon:'wardrobe' },
  { id:5,  name:'TV Unit',                 category:'Living',   price:22000, brand:'ModHome',         color:'#5C4033', w:200, d:40,  icon:'tv'       },
  { id:6,  name:'Coffee Table',            category:'Living',   price:14000, brand:'Urban Living',    color:'#C4A882', w:120, d:60,  icon:'coffee'   },
  { id:7,  name:'Bookshelf',               category:'Storage',  price:18000, brand:'WoodWorks',       color:'#6B4226', w:100, d:35,  icon:'shelf'    },
  { id:8,  name:'Accent Chair',            category:'Seating',  price:12000, brand:'LivingSpace',     color:'#8B7355', w:80,  d:80,  icon:'chair'    },
  { id:9,  name:'Study Desk',              category:'Office',   price:16000, brand:'WorkSpace',       color:'#A0856A', w:140, d:60,  icon:'desk'     },
  { id:10, name:'Floor Lamp',              category:'Lighting', price:6500,  brand:'LightCraft',      color:'#B8860B', w:30,  d:30,  icon:'lamp'     },
  { id:11, name:'Pendant Light (set of 3)',category:'Lighting', price:9000,  brand:'LightCraft',      color:'#FFD700', w:20,  d:20,  icon:'pendant'  },
  { id:12, name:'Side Table',             category:'Bedroom',  price:8000,  brand:'ModHome',         color:'#D4B896', w:50,  d:50,  icon:'side'     },
]

export const designVersions = [
  { id:1, projectId:1, version:'v1', date:'2026-04-15', status:'Rejected',          designer:'Kavitha M', changes:'Initial concept — open plan layout with neutral palette',                       note:'Client prefers more defined spaces', image:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&h=420&q=80&auto=format&fit=crop' },
  { id:2, projectId:1, version:'v2', date:'2026-05-01', status:'Changes Requested', designer:'Kavitha M', changes:'Added partition walls, updated color scheme to warm tones',                    note:'Sofa placement needs revision',      image:'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=700&h=420&q=80&auto=format&fit=crop' },
  { id:3, projectId:1, version:'v3', date:'2026-05-18', status:'Pending Review',    designer:'Kavitha M', changes:'Revised seating, added accent lighting, updated kitchen island',               note:null,                                 image:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&h=420&q=80&auto=format&fit=crop'  },
  { id:4, projectId:2, version:'v1', date:'2026-04-20', status:'Approved',          designer:'Kavitha M', changes:'Minimalist layout with light wood and white palette',                         note:null,                                 image:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&h=420&q=80&auto=format&fit=crop' },
  { id:5, projectId:2, version:'v2', date:'2026-05-10', status:'Pending Review',    designer:'Kavitha M', changes:'Added built-in storage, revised bedroom layout',                              note:null,                                 image:'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=700&h=420&q=80&auto=format&fit=crop'  },
  { id:6, projectId:3, version:'v5', date:'2026-05-15', status:'Approved',          designer:'Kavitha M', changes:'Final material selections confirmed, lighting plan complete',                  note:null,                                 image:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=700&h=420&q=80&auto=format&fit=crop'  },
  { id:7, projectId:4, version:'v1', date:'2026-05-20', status:'Pending Review',    designer:'Kavitha M', changes:'Initial clinical design — clean, professional, accessible layout',            note:null,                                 image:'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=700&h=420&q=80&auto=format&fit=crop' },
]

export const designComments = [
  { id:1, versionId:3, projectId:1, author:'Priya Krishnamurthy', initials:'PK', role:'Client',   date:'2026-05-19 10:30 AM', comment:'The sofa placement looks good now. Can we try a darker shade for the accent wall?', resolved:false },
  { id:2, versionId:3, projectId:1, author:'Kavitha M',           initials:'KM', role:'Designer', date:'2026-05-19 11:45 AM', comment:'Sure! Ill try charcoal grey or deep teal. Will update in next revision.',           resolved:false },
  { id:3, versionId:3, projectId:1, author:'Priya Krishnamurthy', initials:'PK', role:'Client',   date:'2026-05-20 3:00 PM',  comment:'Love the lighting fixtures you chose. Please proceed with those.',                  resolved:true  },
  { id:4, versionId:5, projectId:2, author:'Suresh Balaji',       initials:'SB', role:'Client',   date:'2026-05-11 2:15 PM',  comment:'The wardrobe in the master bedroom looks too bulky. Can we slim it down?',           resolved:false },
  { id:5, versionId:5, projectId:2, author:'Kavitha M',           initials:'KM', role:'Designer', date:'2026-05-12 9:00 AM',  comment:'I can replace it with a sliding wardrobe — same storage, less visual weight.',       resolved:false },
]

export const moodBoards = [
  { id:1, projectId:1, title:'Living Room — Warm Contemporary', image:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=360&q=80&auto=format&fit=crop', colors:['#D4A574','#8B6F47','#F5F0E8','#2C3E50','#E8D5B7'], style:'Contemporary',  keywords:['Warm','Cozy','Modern','Earthy'],        materials:['Oak Wood','Linen','Travertine','Brass']     },
  { id:2, projectId:1, title:'Master Bedroom — Serene Retreat', image:'https://images.unsplash.com/photo-1505693314120-0d443867891c?w=600&h=360&q=80&auto=format&fit=crop', colors:['#B8D4CE','#7CA9A3','#F8F4EF','#4A4A4A','#D4C4B0'], style:'Transitional',  keywords:['Calm','Luxurious','Neutral','Soft'],     materials:['Walnut','Velvet','Marble','Matte White']    },
  { id:3, projectId:2, title:'Apartment — Nordic Minimalism',   image:'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&h=360&q=80&auto=format&fit=crop', colors:['#FFFFFF','#F0EDE8','#C8C0B4','#3D3D3D','#E8E4DF'], style:'Minimalist',    keywords:['Clean','Simple','Light','Functional'],   materials:['Birch','Concrete','White Linen','Steel']    },
  { id:4, projectId:3, title:'Bungalow — Classic Heritage',     image:'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=360&q=80&auto=format&fit=crop', colors:['#8B1A1A','#D4A017','#F5DEB3','#4A3728','#FFFAF0'], style:'Classic',       keywords:['Heritage','Royal','Rich','Traditional'], materials:['Teak','Brass','Jali Work','Antique Stone']  },
]

export const colorPalettes = [
  { id:1,  name:'Warm Contemporary',   tags:['Earthy','Modern'],     colors:['#D4A574','#8B6F47','#F5F0E8','#2C3E50','#E8D5B7','#C4956A'],  description:'Grounded warmth with teak, linen and muted amber tones for contemporary living spaces.' },
  { id:2,  name:'Nordic Serenity',      tags:['Minimal','Calm'],      colors:['#FFFFFF','#E8E4DF','#B8C4C8','#4A5568','#D4CFC8','#8E9BAE'],  description:'Pure Scandinavian simplicity — bone white, dove grey, and cool slate for airy, clutter-free interiors.' },
  { id:3,  name:'Biophilic Greens',     tags:['Natural','Fresh'],     colors:['#4A7C59','#7FAF84','#D4EAD4','#F5F0E8','#C4956A','#2D4A38'],  description:'Sage, moss and forest greens paired with warm neutrals — brings the outdoors in.' },
  { id:4,  name:'Moody Luxe',           tags:['Bold','Dramatic'],     colors:['#1A1A2E','#2E4057','#C4956A','#E8D5B7','#7C5C3A','#F0EBE3'],  description:'Deep navy and midnight backdrops with champagne gold accents — opulent and sophisticated.' },
  { id:5,  name:'Indian Heritage',      tags:['Traditional','Rich'],  colors:['#8B1A1A','#C4840A','#F5DEB3','#4A3728','#D4A017','#FFFAF0'],  description:'Rich jaipur reds, turmeric gold and ivory inspired by traditional Indian royal interiors.' },
  { id:6,  name:'Coastal Luxe',         tags:['Beach','Serene'],      colors:['#1B6CA8','#5B9BBD','#B8D4E0','#F5F5F0','#C4956A','#E8E0D4'],  description:'Deep ocean blue through cerulean to sandy beige — relaxed luxury for coastal-inspired spaces.' },
  { id:7,  name:'Urban Industrial',     tags:['Edgy','Raw'],          colors:['#2D2D2D','#4A4A4A','#8B7355','#C4956A','#E8E4DF','#1A1A1A'],  description:'Exposed concrete grey, burnished steel and warm copper for industrial-chic loft spaces.' },
  { id:8,  name:'Bohemian Sunset',      tags:['Warm','Eclectic'],     colors:['#C4522A','#E07B20','#F5C842','#8B4513','#D4796A','#F5E6D0'],  description:'Terracotta, rust and saffron layered with earthy ochre — vibrant bohemian energy.' },
  { id:9,  name:'Japandi Zen',          tags:['Minimal','Wabi-Sabi'], colors:['#F5F0E8','#E0D8CC','#A89880','#5C4F3D','#3D3530','#8B7B6B'],  description:'Japanese minimalism meets Scandinavian function — warm greige, wabi-sabi imperfection, stillness.' },
  { id:10, name:'Classic Monotone',     tags:['Timeless','Elegant'],  colors:['#F8F8F8','#E0E0E0','#C0C0C0','#808080','#404040','#101010'],  description:'All-white to charcoal greyscale gradient — enduringly elegant, letting form and light speak.' },
  { id:11, name:'Tropical Retreat',     tags:['Vibrant','Holiday'],   colors:['#2D6A4F','#52B788','#A8D8C8','#F9C74F','#F4A261','#E9C46A'],  description:'Lush botanical greens, golden yellow and warm coral — a permanent tropical holiday mood.' },
  { id:12, name:'Dusty Rose & Sage',    tags:['Soft','Feminine'],     colors:['#D4A5A5','#B5838D','#A8C5B4','#6B8F71','#F5EEE8','#8B6F6F'],  description:'Muted pink and sage green in equal harmony — soft, romantic, and beautifully balanced.' },
]

export const materialCatalog = [
  { id:1,  name:'Italian Carrara Marble',    category:'Flooring',   price:850,  unit:'sqft', color:'#F5F0EB', brand:'Rajasthan Marbles', durability:'High',   maintenance:'Medium', inStock:true,  description:'Iconic white marble with subtle grey veining. Heat-resistant, timeless luxury finish.' },
  { id:2,  name:'Vitrified Tiles 60×60',    category:'Flooring',   price:120,  unit:'sqft', color:'#E8E4DF', brand:'Kajaria',           durability:'High',   maintenance:'Low',    inStock:true,  description:'Full-body vitrified, low water absorption, scratch-resistant. Ideal for high-traffic areas.' },
  { id:3,  name:'Oak Engineered Wood',      category:'Flooring',   price:280,  unit:'sqft', color:'#C4A882', brand:'Pergo',             durability:'Medium', maintenance:'Medium', inStock:true,  description:'Multi-layer engineered wood with oak veneer. Natural warmth with improved stability vs solid.' },
  { id:4,  name:'SPC Vinyl Plank',          category:'Flooring',   price:95,   unit:'sqft', color:'#D4C4A8', brand:'Karndean',          durability:'High',   maintenance:'Low',    inStock:true,  description:'Stone polymer composite — 100% waterproof, dimensionally stable, ideal for kitchens/bathrooms.' },
  { id:5,  name:'Bamboo Flooring',          category:'Flooring',   price:180,  unit:'sqft', color:'#C8B89A', brand:'EcoBamboo',         durability:'High',   maintenance:'Low',    inStock:true,  description:'Rapidly renewable, eco-certified. Harder than most hardwoods, suitable for all rooms.' },
  { id:6,  name:'Porcelain Large Slab',     category:'Flooring',   price:320,  unit:'sqft', color:'#EDE9E4', brand:'Nitco',             durability:'High',   maintenance:'Low',    inStock:true,  description:'1200×600mm large-format porcelain slab. Near-zero grout lines, seamless luxurious finish.' },
  { id:7,  name:'Cement Plaster Texture',   category:'Wall',       price:45,   unit:'sqft', color:'#D4CFC8', brand:'Asian Paints',      durability:'High',   maintenance:'Low',    inStock:true,  description:'Smooth or textured cement render. Low-VOC, durable base for paint or overlays.' },
  { id:8,  name:'Acrylic Wall Panels',      category:'Wall',       price:220,  unit:'sqft', color:'#F0EDE8', brand:'AcrylicArt',        durability:'Medium', maintenance:'Low',    inStock:true,  description:'Sleek, high-gloss acrylic panels. UV resistant, moisture-proof, ideal for modern kitchens.' },
  { id:9,  name:'Teak Wood Panels',         category:'Wall',       price:650,  unit:'sqft', color:'#8B6347', brand:'WoodWorks',         durability:'High',   maintenance:'Medium', inStock:false, description:'Solid teak wall cladding. Natural oils make it naturally resistant to rot and insects.' },
  { id:10, name:'Textured Wallpaper',       category:'Wall',       price:180,  unit:'sqft', color:'#E8D5B7', brand:'Graham & Brown',    durability:'Medium', maintenance:'Low',    inStock:true,  description:'Non-woven substrate with raised texture. Breathable, paste-the-wall, easy to hang.' },
  { id:11, name:'Venetian Microcement',     category:'Wall',       price:380,  unit:'sqft', color:'#C8C0B8', brand:'Tadelakt India',    durability:'High',   maintenance:'Medium', inStock:true,  description:'Seamless polished microcement finish inspired by ancient Venetian plaster technique.' },
  { id:12, name:'Laminate Wall Panels',     category:'Wall',       price:85,   unit:'sqft', color:'#D4C8BA', brand:'Greenlam',          durability:'High',   maintenance:'Low',    inStock:true,  description:'Scratch-resistant, moisture-repellent HPL laminate. 200+ colour/texture options available.' },
  { id:13, name:'Gypsum False Ceiling',     category:'Ceiling',    price:95,   unit:'sqft', color:'#FFFFFF', brand:'Saint-Gobain',      durability:'High',   maintenance:'Low',    inStock:true,  description:'Lightweight gypsum board suspended ceiling. Fire-resistant, excellent for concealed lighting.' },
  { id:14, name:'POP False Ceiling',        category:'Ceiling',    price:65,   unit:'sqft', color:'#FFFAF5', brand:'Local',             durability:'Medium', maintenance:'Low',    inStock:true,  description:'Plaster of Paris — highly workable for ornate patterns, cornices, and decorative mouldings.' },
  { id:15, name:'Fiberglass Panels',        category:'Ceiling',    price:145,  unit:'sqft', color:'#F8F8F8', brand:'FRP India',         durability:'High',   maintenance:'Low',    inStock:true,  description:'Lightweight, moisture-proof FRP. Ideal for bathrooms, kitchens, and humid environments.' },
  { id:16, name:'Stretch Ceiling',          category:'Ceiling',    price:280,  unit:'sqft', color:'#F0F0F0', brand:'Barrisol',          durability:'High',   maintenance:'Low',    inStock:false, description:'PVC membrane ceiling with integrated LED backlit translucent or metallic finishes.' },
]

export const marketplaceItems = [
  { id:1,  name:'Teak Dining Table (6-seater)',  category:'Furniture',  sub:'Dining',   price:42000, originalPrice:52000, vendor:'Woodcraft India',   rating:4.7, reviews:38,  availability:'In Stock',      delivery:'5-7 days',  image:'https://plus.unsplash.com/premium_photo-1679520112257-f868838fc2ae?w=400&h=220&q=80&auto=format&fit=crop', color:'#8B6347', isNew:false, isBestseller:true,  store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=teak+wood+dining+table+6+seater' },
  { id:2,  name:'L-Shaped Sectional Sofa',       category:'Furniture',  sub:'Seating',  price:58000, originalPrice:75000, vendor:'Urban Living',      rating:4.5, reviews:62,  availability:'In Stock',      delivery:'7-10 days', image:'https://plus.unsplash.com/premium_photo-1683141389818-77fd3485334b?w=400&h=220&q=80&auto=format&fit=crop', color:'#C4A882', isNew:false, isBestseller:true,  store:'Flipkart', buyUrl:'https://www.flipkart.com/search?q=l+shaped+sectional+sofa' },
  { id:3,  name:'King Platform Bed',             category:'Furniture',  sub:'Bedroom',  price:32000, originalPrice:38000, vendor:'SleepWell',         rating:4.3, reviews:25,  availability:'In Stock',      delivery:'5-7 days',  image:'https://plus.unsplash.com/premium_photo-1671269704807-5479855d03fe?w=400&h=220&q=80&auto=format&fit=crop', color:'#D4B896', isNew:true,  isBestseller:false, store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=king+size+platform+bed+frame' },
  { id:4,  name:'Pendant Lights (Set of 3)',     category:'Lighting',   sub:'Ceiling',  price:12000, originalPrice:15000, vendor:'LightCraft',        rating:4.8, reviews:94,  availability:'In Stock',      delivery:'3-5 days',  image:'https://plus.unsplash.com/premium_photo-1670914333012-f4093b108aa1?w=400&h=220&q=80&auto=format&fit=crop', color:'#FFD700', isNew:false, isBestseller:true,  store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=pendant+ceiling+lights+set+of+3' },
  { id:5,  name:'LED Strip Lighting Kit',        category:'Lighting',   sub:'Accent',   price:3500,  originalPrice:4500,  vendor:'LightCraft',        rating:4.6, reviews:142, availability:'In Stock',      delivery:'2-3 days',  image:'https://plus.unsplash.com/premium_photo-1681400751087-2340425a65ae?w=400&h=220&q=80&auto=format&fit=crop', color:'#FFFACD', isNew:false, isBestseller:false, store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=led+strip+light+kit+rgb+home' },
  { id:6,  name:'Industrial Floor Lamp',         category:'Lighting',   sub:'Floor',    price:8500,  originalPrice:10000, vendor:'DesignLights',      rating:4.4, reviews:31,  availability:'Limited Stock', delivery:'5-7 days',  image:'https://plus.unsplash.com/premium_photo-1705169535887-54ff230a76b2?w=400&h=220&q=80&auto=format&fit=crop', color:'#B8860B', isNew:true,  isBestseller:false, store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=industrial+floor+lamp+living+room' },
  { id:7,  name:'Italian Marble Tiles (Box)',    category:'Materials',  sub:'Flooring', price:18000, originalPrice:22000, vendor:'Rajasthan Marbles', rating:4.9, reviews:17,  availability:'In Stock',      delivery:'7-14 days', image:'https://plus.unsplash.com/premium_photo-1706838707088-e3b4170054e6?w=400&h=220&q=80&auto=format&fit=crop', color:'#F5F0EB', isNew:false, isBestseller:false, store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=marble+floor+tiles+white+italian' },
  { id:8,  name:'Textured Wallpaper Roll',       category:'Materials',  sub:'Wall',     price:2800,  originalPrice:3500,  vendor:'WallArt India',     rating:4.2, reviews:53,  availability:'In Stock',      delivery:'3-5 days',  image:'https://images.unsplash.com/photo-1550895030-823330fc2551?w=400&h=220&q=80&auto=format&fit=crop', color:'#E8D5B7', isNew:false, isBestseller:false, store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=textured+wallpaper+roll+wall+covering' },
  { id:9,  name:'Oak Engineered Wood (Box)',     category:'Materials',  sub:'Flooring', price:14000, originalPrice:18000, vendor:'Pergo India',       rating:4.6, reviews:29,  availability:'In Stock',      delivery:'7-10 days', image:'https://plus.unsplash.com/premium_photo-1676636551471-bb6aeaf8af1c?w=400&h=220&q=80&auto=format&fit=crop', color:'#C4A882', isNew:false, isBestseller:true,  store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=oak+engineered+hardwood+flooring' },
  { id:10, name:'Brass Door Handle Set',         category:'Hardware',   sub:'Handles',  price:4500,  originalPrice:5500,  vendor:'BrassCraft',        rating:4.5, reviews:44,  availability:'In Stock',      delivery:'3-5 days',  image:'https://plus.unsplash.com/premium_photo-1661301038585-28b480e04612?w=400&h=220&q=80&auto=format&fit=crop', color:'#B8860B', isNew:false, isBestseller:false, store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=brass+door+handle+set+cabinet' },
  { id:11, name:'Velvet Accent Chair',           category:'Furniture',  sub:'Seating',  price:15000, originalPrice:18000, vendor:'LivingSpace',       rating:4.4, reviews:36,  availability:'In Stock',      delivery:'7-10 days', image:'https://plus.unsplash.com/premium_photo-1705169538590-d1a4cecf7bd8?w=400&h=220&q=80&auto=format&fit=crop', color:'#8B7355', isNew:true,  isBestseller:false, store:'Flipkart', buyUrl:'https://www.flipkart.com/search?q=velvet+accent+chair+living+room' },
  { id:12, name:'Atomberg Smart Ceiling Fan',    category:'Lighting',   sub:'Fan',      price:9500,  originalPrice:11000, vendor:'Atomberg',          rating:4.7, reviews:208, availability:'In Stock',      delivery:'3-5 days',  image:'https://plus.unsplash.com/premium_photo-1663126298656-33616be83c32?w=400&h=220&q=80&auto=format&fit=crop', color:'#FFFFFF', isNew:false, isBestseller:true,  store:'Amazon',   buyUrl:'https://www.amazon.in/s?k=atomberg+smart+ceiling+fan' },
]

export const costEstimateData = [
  { projectId:1, projectName:'Raj Nagar Villa', budget:850000, spent:485000,
    items:[
      { id:1, category:'Furniture', item:'L-Shaped Sofa',    qty:1,    unit:'nos',  unitCost:58000, actual:58000,  alternative:'3-seater sofa at ₹28,000',           altSaving:30000  },
      { id:2, category:'Furniture', item:'Dining Table Set', qty:1,    unit:'nos',  unitCost:42000, actual:42000,  alternative:'MDF dining set at ₹18,000',           altSaving:24000  },
      { id:3, category:'Furniture', item:'King Bed Frame',   qty:1,    unit:'nos',  unitCost:32000, actual:32000,  alternative:'Queen platform bed at ₹18,000',       altSaving:14000  },
      { id:4, category:'Flooring',  item:'Italian Marble',   qty:1200, unit:'sqft', unitCost:850,   actual:null,   alternative:'Premium vitrified tiles at ₹180/sqft',altSaving:804000 },
      { id:5, category:'Lighting',  item:'Pendant Lights',   qty:6,    unit:'nos',  unitCost:12000, actual:72000,  alternative:'Budget pendants at ₹4,000/set',       altSaving:48000  },
      { id:6, category:'Wall',      item:'Teak Wood Panels', qty:500,  unit:'sqft', unitCost:650,   actual:null,   alternative:'Textured wallpaper at ₹180/sqft',     altSaving:235000 },
    ],
    laborCost:180000, contingency:50000 },
]

export const ganttData = [
  { id:1,  projectId:1, task:'Project Kickoff',        type:'milestone', date:'2026-04-01', status:'done',        label:'Project Started'       },
  { id:2,  projectId:1, task:'Concept Design',          type:'task',      start:'2026-04-01', end:'2026-04-20', status:'done',        assignee:'Kavitha M'   },
  { id:3,  projectId:1, task:'Design Approval (v1)',    type:'milestone', date:'2026-04-21', status:'done',        label:'Design Approved ✓'     },
  { id:4,  projectId:1, task:'Material Selection',      type:'task',      start:'2026-04-22', end:'2026-05-15', status:'done',        assignee:'Kavitha M'   },
  { id:5,  projectId:1, task:'3D Visualization',        type:'task',      start:'2026-05-05', end:'2026-05-30', status:'in-progress', assignee:'Kavitha M'   },
  { id:6,  projectId:1, task:'Materials Ordered',       type:'milestone', date:'2026-05-25', status:'upcoming',    label:'Materials Locked'      },
  { id:7,  projectId:1, task:'Client Presentation',     type:'task',      start:'2026-06-01', end:'2026-06-10', status:'upcoming',    assignee:'Kavitha M'   },
  { id:8,  projectId:1, task:'Final Approval',          type:'milestone', date:'2026-06-12', status:'upcoming',    label:'Final Approval'        },
  { id:9,  projectId:1, task:'Execution Handover',      type:'task',      start:'2026-06-15', end:'2026-07-30', status:'upcoming',    assignee:'Ramesh Kumar' },
  { id:10, projectId:1, task:'Project Handover',        type:'milestone', date:'2026-07-30', status:'upcoming',    label:'Handover 🎉'            },
  { id:11, projectId:2, task:'Contract Signed',         type:'milestone', date:'2026-03-15', status:'done',        label:'Project Started'       },
  { id:12, projectId:2, task:'Concept Design',          type:'task',      start:'2026-03-16', end:'2026-04-10', status:'done',        assignee:'Kavitha M'   },
  { id:13, projectId:2, task:'Design Approval (v1)',    type:'milestone', date:'2026-04-20', status:'done',        label:'Design Approved ✓'     },
  { id:14, projectId:2, task:'3D & Visualization',      type:'task',      start:'2026-04-22', end:'2026-05-25', status:'in-progress', assignee:'Kavitha M'   },
  { id:15, projectId:2, task:'Client Review',           type:'milestone', date:'2026-05-30', status:'upcoming',    label:'Client Review'         },
  { id:16, projectId:2, task:'Execution',               type:'task',      start:'2026-06-05', end:'2026-06-25', status:'upcoming',    assignee:'Ramesh Kumar' },
  { id:17, projectId:2, task:'Final Handover',          type:'milestone', date:'2026-06-30', status:'upcoming',    label:'Move In Ready 🎉'       },
]

export const designerDocuments = [
  { id:1, type:'Quotation',    number:'QT-2026-018', project:'Raj Nagar Villa',      client:'Priya Krishnamurthy', date:'2026-04-20', amount:'₹8,50,000',  status:'Accepted', items:12  },
  { id:2, type:'Quotation',    number:'QT-2026-019', project:'RS Puram Apartment',   client:'Suresh Balaji',       date:'2026-04-25', amount:'₹5,20,000',  status:'Pending',  items:8   },
  { id:3, type:'Quotation',    number:'QT-2026-021', project:'Peelamedu Clinic',     client:'Dr. Anand Kumar',     date:'2026-05-02', amount:'₹3,80,000',  status:'Pending',  items:6   },
  { id:4, type:'Invoice',      number:'INV-2026-031',project:'Raj Nagar Villa',      client:'Priya Krishnamurthy', date:'2026-05-01', amount:'₹2,12,500',  status:'Paid',     dueDate:'2026-05-15' },
  { id:5, type:'Invoice',      number:'INV-2026-032',project:'Avinashi Rd Bungalow', client:'Meena Subramanian',   date:'2026-05-10', amount:'₹3,75,000',  status:'Overdue',  dueDate:'2026-05-20' },
  { id:6, type:'Contract',     number:'CTR-2026-007',project:'Avinashi Rd Bungalow', client:'Meena Subramanian',   date:'2025-11-01', amount:'₹15,00,000', status:'Active',   endDate:'2026-08-15'  },
  { id:7, type:'Contract',     number:'CTR-2026-009',project:'Peelamedu Clinic',     client:'Dr. Anand Kumar',     date:'2026-05-01', amount:'₹3,80,000',  status:'Active',   endDate:'2026-09-30'  },
  { id:8, type:'Design Report',number:'RPT-2026-011',project:'Raj Nagar Villa',      client:'Priya Krishnamurthy', date:'2026-05-18', pages:24, status:'Sent',  version:'v3' },
  { id:9, type:'Design Report',number:'RPT-2026-012',project:'RS Puram Apartment',   client:'Suresh Balaji',       date:'2026-05-10', pages:18, status:'Draft', version:'v2' },
]

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT DATA
// ─────────────────────────────────────────────────────────────────────────────

export const clientProjectData = {
  project:{ id:1, name:'Raj Nagar Villa', designer:'Kavitha M', designerInitials:'KM', designerPhone:'+91 98400 00003', supervisor:'Ramesh Kumar', status:'In Progress', phase:'3D Visualization', progress:48, budget:850000, spent:485000, versions:3, pendingApproval:true, startDate:'2026-04-01', deadline:'2026-07-30', style:'Contemporary', area:'2400 sqft' },
  pendingApprovals: 1,
  completedVersions: 1,
  nextMilestone: 'Client Review — 30 May 2026',
}

export const clientTimeline = [
  { id:1,  task:'Contract Signed',        type:'milestone', date:'2026-04-01', status:'done',        label:'Project Started'    },
  { id:2,  task:'Site Measurement',       type:'task',      start:'2026-04-02', end:'2026-04-07', status:'done',        assignee:'Kavitha M'   },
  { id:3,  task:'Concept Presentation',   type:'task',      start:'2026-04-10', end:'2026-04-25', status:'done',        assignee:'Kavitha M'   },
  { id:4,  task:'Design v1 Approved',     type:'milestone', date:'2026-04-26', status:'done',        label:'First Review Done'  },
  { id:5,  task:'3D Visualization',       type:'task',      start:'2026-05-01', end:'2026-06-01', status:'in-progress', assignee:'Kavitha M'   },
  { id:6,  task:'Client Review',          type:'milestone', date:'2026-05-30', status:'upcoming',    label:'Your Review Needed' },
  { id:7,  task:'Materials Finalized',    type:'milestone', date:'2026-06-10', status:'upcoming',    label:'Materials Locked'   },
  { id:8,  task:'Site Execution',         type:'task',      start:'2026-06-15', end:'2026-07-20', status:'upcoming',    assignee:'Ramesh Kumar' },
  { id:9,  task:'Final Handover',         type:'milestone', date:'2026-07-30', status:'upcoming',    label:'Move In Ready'      },
]

export const clientDocuments = [
  { id:1, type:'Quotation',    number:'QT-2026-018', project:'Raj Nagar Villa', date:'2026-04-20', amount:'₹8,50,000',  status:'Pending Your Approval' },
  { id:2, type:'Invoice',      number:'INV-2026-031',project:'Raj Nagar Villa', date:'2026-05-01', amount:'₹2,12,500',  status:'Paid'                  },
  { id:3, type:'Contract',     number:'CTR-2026-007',project:'Raj Nagar Villa', date:'2026-04-01', amount:'₹8,50,000',  status:'Active'                },
  { id:4, type:'Design Report',number:'RPT-2026-011',project:'Raj Nagar Villa', date:'2026-05-18', pages:24, status:'Available', version:'v3' },
]

export const meetingRequests = [
  {
    id: 'mr1',
    title: 'RS Puram Weekly Progress Review',
    requestedBy: 2,
    type: 'offline',
    location: 'RS Puram Site Office',
    date: '2026-05-27',
    time: '10:00 AM',
    invitees: [1, 5],
    purpose: 'Weekly site progress review and material planning for the delayed civil phase.',
    status: 'pending',
    createdAt: '2026-05-21',
  },
  {
    id: 'mr2',
    title: 'Design Concept Discussion',
    requestedBy: 5,
    type: 'online',
    location: 'Google Meet',
    date: '2026-05-29',
    time: '3:00 PM',

    invitees: [1, 2],
    purpose: 'Present updated color palette for Raj Nagar master bedroom to admin and supervisor.',
    status: 'approved',
    createdAt: '2026-05-20',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// DESIGNER TASKS
// ─────────────────────────────────────────────────────────────────────────────

export const designerAllTasks = [
  { id:'da1',  name:'Complete v3 revision — Raj Nagar Villa',            projectId:1, project:'Raj Nagar Villa',      priority:'high',   dueDate:'26 May 2026', status:'In Progress', assignedTo:'Kavitha M', category:'Design'         },
  { id:'da2',  name:'Prepare mood board — Living Room (Raj Nagar)',       projectId:1, project:'Raj Nagar Villa',      priority:'high',   dueDate:'28 May 2026', status:'Pending',     assignedTo:'Kavitha M', category:'Design'         },
  { id:'da3',  name:'3D visualization — RS Puram Apartment',             projectId:2, project:'RS Puram Apartment',  priority:'high',   dueDate:'25 May 2026', status:'In Progress', assignedTo:'Kavitha M', category:'Design'         },
  { id:'da4',  name:'Material selection finalize — RS Puram',            projectId:2, project:'RS Puram Apartment',  priority:'high',   dueDate:'30 May 2026', status:'Pending',     assignedTo:'Kavitha M', category:'Materials'      },
  { id:'da5',  name:'Client presentation prep — Raj Nagar Villa',        projectId:1, project:'Raj Nagar Villa',      priority:'medium', dueDate:'01 Jun 2026', status:'Pending',     assignedTo:'Kavitha M', category:'Meeting'        },
  { id:'da6',  name:'Finalize lighting plan — Avinashi Rd Bungalow',     projectId:3, project:'Avinashi Rd Bungalow', priority:'medium', dueDate:'24 May 2026', status:'Completed',   assignedTo:'Kavitha M', category:'Design'         },
  { id:'da7',  name:'Submit v1 design report — Peelamedu Clinic',        projectId:4, project:'Peelamedu Clinic',     priority:'high',   dueDate:'27 May 2026', status:'Pending',     assignedTo:'Kavitha M', category:'Design'         },
  { id:'da8',  name:'Review client feedback — RS Puram Apartment',       projectId:2, project:'RS Puram Apartment',  priority:'high',   dueDate:'25 May 2026', status:'Completed',   assignedTo:'Kavitha M', category:'Communication'  },
  { id:'da9',  name:'Update material procurement list — Raj Nagar',      projectId:1, project:'Raj Nagar Villa',      priority:'medium', dueDate:'28 May 2026', status:'In Progress', assignedTo:'Kavitha M', category:'Procurement'    },
  { id:'da10', name:'Design brief revision — Avinashi Rd Bungalow',      projectId:3, project:'Avinashi Rd Bungalow', priority:'low',    dueDate:'02 Jun 2026', status:'Pending',     assignedTo:'Kavitha M', category:'Reporting'      },
  { id:'da11', name:'Color palette selection — Peelamedu Clinic',        projectId:4, project:'Peelamedu Clinic',     priority:'medium', dueDate:'29 May 2026', status:'Pending',     assignedTo:'Kavitha M', category:'Design'         },
  { id:'da12', name:'Handover design files — Avinashi Rd Bungalow v5',   projectId:3, project:'Avinashi Rd Bungalow', priority:'high',   dueDate:'22 May 2026', status:'Completed',   assignedTo:'Kavitha M', category:'Design'         },
]

export const designerTodayTasks = [
  { id: 'dt1', task: 'Upload v3 design revision — Raj Nagar Villa',         priority: 'high',   done: false, category: 'Design'     },
  { id: 'dt2', task: 'Prepare mood board — Peelamedu Clinic (v1)',          priority: 'high',   done: false, category: 'Design'     },
  { id: 'dt3', task: 'Client call — Suresh Balaji (RS Puram feedback)',     priority: 'high',   done: true,  category: 'Meeting'    },
  { id: 'dt4', task: 'Finalise material selection — Raj Nagar kitchen',     priority: 'medium', done: false, category: 'Materials'  },
  { id: 'dt5', task: 'Review contractor quote for Avinashi Rd flooring',    priority: 'medium', done: false, category: 'Review'     },
  { id: 'dt6', task: 'Update 3D visualization — RS Puram bedroom',          priority: 'low',    done: false, category: 'Design'     },
]

export const designerWeekTasks = [
  { id: 'dw1',  date: '2026-05-22', task: 'Raj Nagar v3 revisions — client feedback incorporated',  priority: 'high',   category: 'Design'    },
  { id: 'dw2',  date: '2026-05-22', task: 'Material sample order — Raj Nagar marble & teak',        priority: 'high',   category: 'Materials' },
  { id: 'dw3',  date: '2026-05-23', task: 'Peelamedu Clinic mood board presentation',               priority: 'high',   category: 'Design'    },
  { id: 'dw4',  date: '2026-05-23', task: 'Colour palette finalisation — RS Puram Apartment',       priority: 'medium', category: 'Design'    },
  { id: 'dw5',  date: '2026-05-25', task: 'Team weekly sync — design updates',                      priority: 'medium', category: 'Meeting'   },
  { id: 'dw6',  date: '2026-05-25', task: 'Marketplace order — pendant lights for Raj Nagar',       priority: 'medium', category: 'Procurement'},
  { id: 'dw7',  date: '2026-05-26', task: 'Avinashi Bungalow — final handover documentation',       priority: 'high',   category: 'Docs'      },
  { id: 'dw8',  date: '2026-05-27', task: '3D visualization milestone — RS Puram client review',    priority: 'high',   category: 'Design'    },
  { id: 'dw9',  date: '2026-05-28', task: 'Invoice preparation — Raj Nagar milestone 2',            priority: 'medium', category: 'Finance'   },
  { id: 'dw10', date: '2026-05-28', task: 'Update design timeline — all active projects',            priority: 'low',    category: 'Admin'     },
]
