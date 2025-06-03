import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import api from "../../api";
import logo from "../../assets/logo.png";
import { BarChart3, Puzzle,Users, Edit3, Clock3,BarChart2 ,UserCheck,CalendarClock ,FileBarChart2   ,Footprints,UserPlus,Wallet,PackageSearch,Layers,Bot,Cylinder,Flame ,XCircle ,ListChecks ,PlayCircle  , Settings, FileText, Activity, Clipboard, BadgeCheck, LogOut, User, Bell,Folder , MessageSquare, Clock, Key, Package, CheckSquare, Database, Truck, Send, List, Calendar, Home, CalendarPlus, Hammer, Wrench, Factory, ClipboardList, Wind, Edit, ShieldCheck, PackageCheck, AlertCircle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

const departmentNavigation = {
  admin: [
    { name: "Add Customer Schedule", href: "/Forging_form_test", icon: CalendarPlus },
    { name: "Forging Planning", href: "/Schedule", icon: Hammer },
    { name: "Planning Analysis", href: "/ProductionAnalysis", icon: BarChart3 },
    { name: "CNC Planning", href: "/CncPlanningForm", icon: Clipboard },
    { name: "Cnc Planning Data ", href: "/CncPlanningList", icon: Database   },
    
    { name: "Master List ", href: "/Master_list_listcopy", icon: ListChecks   },
    { name: "NPD Part Tracking ", href: "/NpdTracking", icon: PackageSearch  },
    { name: "Steel Reconsilatation ", href: "/MaterialTrackingPage", icon: Layers   },
    
    {
      name: "Dispatch",
      href: "#",
      icon: Truck , // Represents security and verification
      submenu: [
        { name: "Dispatch Data", href: "/DispatchList", icon: List },
        { name: "Dispatch Dashboard", href: "/AnalyticsPage", icon: BarChart2 },
      ],
    },
    {
      name: "Traceability",
      href: "#",
      icon: Footprints , // Represents security and verification
      submenu: [
        { name: "By Batch", href: "/TraceabilityCard", icon: ClipboardList }, // Represents lists and records
        { name: "By Component", href: "/TraceabilityCard1", icon: Puzzle  }, // Represents tools and components
      ],
    },
    {
      name: "Rawmaterial",
      href: "#",
      icon: Cylinder   , // Represents security and verification
      submenu: [
        { name: "RM Inventory", href: "/BalanceAfterHold", icon: Package },
        { name: "Material Information System (MIS)", href: "/Raw_material_update", icon: FileText },
        { name: "Material Issuance List", href: "/Issu_list", icon: List },
        { name: "RM Order Management", href: "/Orders", icon: Clipboard },
        { name: "Supplier Complaint", href: "/Complant", icon: FileText },
        { name: "Supplier Performance", href: "/SupplierPerformanceChart", icon: TrendingUp  },
        { name: "Running Batches", href: "/PlanningUpdates", icon: Activity },
        { name: "Batch List", href: "/PlanningUpdates1", icon: List },
        { name: "Verify Signature", href: "/POVerificationPage", icon: ShieldCheck },
      ],
    },
    {
      name: "Calibration",
      href: "#",
      icon: Wrench,
      submenu: [
        { name: "Running Instruments", href: "/Calibration", icon: PlayCircle  },
        { name: "Rejected Instruments", href: "/RejectedCalibration", icon: XCircle  },
       
      ],
    },
    {
      name: "Quality",
      href: "#",
      icon: BadgeCheck,
      submenu: [
        { name: "Forging", href: "/Forging", icon: Hammer },
        { name: "CNC Rejection Report", href: "/Cnc_Rejection_Report", icon: FileText },
        { name: "Combine Rejection Report", href: "/Dashboard", icon: FileText },
        { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
        { name: "Customer Complaint ", href: "/CustomerComplaint", icon: AlertCircle   },
        { name: "SSB AI Assistant", href: "/TraceabilityChatbot", icon: Bot    },
      ],
    },
    {
      name: "Production",
      href: "#",
      icon: Factory,
      submenu: [
        { name: "Forging", href: "/Forging_Production", icon: Hammer },
        { name: "Heat Treatment", href: "/Heat_Treatment_Production", icon: Wind },
        { name: "Pre-Machining", href: "/Pre_mc_production", icon: Wrench },
        { name: "CNC", href: "/Cnc_production", icon: Settings },
        { name: "Marking", href: "/Marking_production", icon: Edit },
        { name: "Final Inspection", href: "/Fi_production", icon: ShieldCheck },
        { name: "Visual & Packing", href: "/Visual_production", icon: PackageCheck },
      ],
    },
    {
      name: "HR Functions",
      href: "#",
      icon: Users ,
      submenu: [
        { name: "Generate Attdence Report", href: "/Attdencelogs", icon: FileBarChart2    },
        { name: "Generate Salary", href: "/SalaryCalculationPage", icon: FileBarChart2    },
        { name: "Saved Attdence Report", href: "/AttendanceReport", icon: FileBarChart2    },
        { name: "Employee Management", href: "/EmployeeListPage", icon: Users    },
        { name: "Shift Assignment", href: "/ShiftAssignmentPage", icon: CalendarClock    },
        { name: "Manual Punching", href: "/ManualPunchPage", icon: Edit3    },
        { name: "Gate Pass", href: "/GatePassPage", icon: Edit3    },
        { name: "OD Slip", href: "/ODSlipPage", icon: Clock3     },
        { name: "Cheq. MissPunch", href: "/MissedPunchReport", icon: Clock3     },
      ],
    },
   
    { name: "Add New User", href: "/Signup", icon: UserPlus   },
  ],
  hr: [
    { name: "Generate Attdence Report", href: "/Attdencelogs", icon: FileBarChart2     },
    { name: "Generate Salary", href: "/SalaryCalculationPage", icon: FileBarChart2    },
    { name: "Saved Attdence Report", href: "/AttendanceReport", icon: FileBarChart2    },
    { name: "Employee Management", href: "/EmployeeListPage", icon: Users     },
    { name: "Shift Assignment", href: "/ShiftAssignmentPage", icon: CalendarClock     },
    { name: "Gate Pass", href: "/GatePassPage", icon: Edit3    },
    { name: "Manual Punching", href: "/ManualPunchPage", icon: Edit3    },
    { name: "OD Slip", href: "/ODSlipPage", icon: Clock3     },
    { name: "Cheq. MissPunch", href: "/MissedPunchReport", icon: Clock3     },
  ],
  rm: [
    { name: "Master Data Management", href: "/Masterdatrm", icon: Database },
    { name: "RM Inventory", href: "/BalanceAfterHold", icon: Package },
    { name: "Material Information System (MIS)", href: "/Raw_material_update", icon: FileText },
    { name: "RM Receiving", href: "/RawMaterialForm", icon: Truck },
    { name: "Material Issue", href: "/Issu", icon: Send },
    { name: "Material Issuance List", href: "/Issu_list", icon: List },
    { name: "RM Order Management", href: "/Orders", icon: Clipboard },
    { name: "Supplier Complaint", href: "/Complant", icon: FileText },
    { name: "Supplier Performance", href: "/SupplierPerformanceChart", icon: TrendingUp  },
    { name: "Customer Schedules", href: "/Ratingmain", icon: Calendar },
    { name: "Planning Cheq", href: "/BlockmtForm1", icon: CheckSquare },
    { name: "Running Batches", href: "/PlanningUpdates", icon: Activity },
    { name: "Batch List", href: "/PlanningUpdates1", icon: List },
    { name: "Master List", href: "/Master_list_list1", icon: FileText },
    { name: "Verify Signature", href: "/POVerificationPage", icon: ShieldCheck },
    {
      name: "Quality",
      href: "#",
      icon: BadgeCheck,
      submenu: [
        { name: "Forging", href: "/Forging", icon: Hammer },
        { name: "CNC Rejection Report", href: "/Cnc_Rejection_Report", icon: FileText },
        { name: "Combine Rejection Report", href: "/Dashboard", icon: FileText },
        { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
      ],
    },
  ],
  forging: [
    { name: "Add Forging Data", href: "/Forging_Form", icon: Database },
    { name: "Forging Data", href: "/Forging_List", icon: ListChecks  },
    { name: "Forging Production", href: "/Forging_Production", icon: Hammer  },
    { name: "Forging rejection", href: "/Forging", icon: XCircle  },
    { name: "Cheq Batch Id", href: "/Batch_Cheq", icon: Package  },
    { name: "Combine Rejection Report", href: "/Dashboard", icon: FileText },
    { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
  ],
  ht: [
    { name: "Add Heat Treatment Data", href: "/Heat_Treatment_form", icon: Database },
    { name: "Heat Treatment Production", href: "/Heat_Treatment_Production", icon: Flame  },
    { name: "Add Pre Machining Data", href: "/Pre_mc_form", icon: Database },
    { name: "Pre Machining Production", href: "/Pre_mc_production", icon: Wrench  },
    { name: "Cheq Batch Id", href: "/Batch_Cheq", icon: Package  },
    
  ],
  cnc: [
    { name: "Cnc Planning Data ", href: "/CncPlanningList", icon: Database   },
    { name: "Add Cnc Data", href: "/Cnc_form", icon: Database },
    { name: "Cnc Production", href: "/Cnc_Production", icon: Wrench },
    { name: "Cnc Data", href: "/Cnc_list", icon: ListChecks },
    { name: "Cheq Batch Id", href: "/Batch_Cheq", icon: Package  },
    { name: "CNC Rejection Report", href: "/Cnc_Rejection_Report", icon: FileText },
    { name: "Combine Rejection Report", href: "/Dashboard", icon: FileText },
    { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
    
  ],
  marking: [
    { name: "Add Marking Data", href: "/Marking_form", icon: Database },
    { name: "Marking Production", href: "/Marking_Production", icon: Edit  },
    { name: "Cheq Batch Id", href: "/Batch_Cheq", icon: Package  },
    
    
  ],
  fi: [
    { name: "Add Fi Data", href: "/Fi_form", icon: Database },
    { name: "Fi Production Production", href: "/Fi_Production", icon: Flame  },
    { name: "Cheq Batch Id", href: "/Batch_Cheq", icon: Package  },
    { name: "Combine Rejection Report", href: "/Dashboard", icon: FileText },
    { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
    { name: "Add Visual Data", href: "/Visual_Form", icon: Database },
    { name: "Visual Production", href: "/Visual_production", icon: Flame  },
    
  ],
  visual: [
    { name: "Add Visual Data", href: "/Visual_Form", icon: Database },
    { name: "Visual Production", href: "/Visual_production", icon: Flame  },
    { name: "Cheq Batch Id", href: "/Batch_Cheq", icon: Package  },
    { name: "Combine Rejection Report", href: "/Dashboard", icon: FileText },
    { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
    
  ],
  dispatch: [
    { name: "Add Dispatch Data", href: "/Dispatch_form", icon: Database },
    { name: "Dispatch", href: "/DispatchList", icon: Truck },
    { name: "Customer Schedules", href: "/Ratingmain", icon: Calendar },
    { name: "Cheq Batch Id", href: "/Batch_Cheq", icon: Package  },
    { name: "Dispatch Dashboard", href: "/AnalyticsPage", icon: BarChart2 },
    
  ],
  sos: [
    { name: "RM Inventory", href: "/BalanceAfterHold", icon: Package },
    { name: "Schedules Rating's", href: "/Ratingmain", icon: BarChart3 },
    {
      name: "Traceability",
      href: "#",
      icon: Footprints , // Represents security and verification
      submenu: [
        { name: "By Batch", href: "/TraceabilityCard", icon: ClipboardList }, // Represents lists and records
        { name: "By Component", href: "/TraceabilityCard1", icon: Puzzle  }, // Represents tools and components
      ],
    },
    {
      name: "Quality",
      href: "#",
      icon: BadgeCheck,
      submenu: [
        { name: "Forging", href: "/Forging", icon: Hammer },
        { name: "CNC Rejection Report", href: "/Cnc_Rejection_Report", icon: FileText },
        { name: "Combine Rejection Report", href: "/Dashboard", icon: FileText },
        { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
      ],
    },
    {
      name: "Production",
      href: "#",
      icon: Factory,
      submenu: [
        { name: "Forging", href: "/Forging_Production", icon: Hammer },
        { name: "Heat Treatment", href: "/Heat_Treatment_Production", icon: Wind },
        { name: "Pre-Machining", href: "/Pre_mc_production", icon: Wrench },
        { name: "CNC", href: "/Cnc_production", icon: Settings },
        { name: "Marking", href: "/Marking_production", icon: Edit },
        { name: "Final Inspection", href: "/Fi_production", icon: ShieldCheck },
        { name: "Visual & Packing", href: "/Visual_production", icon: PackageCheck },
      ],
    },
  ],
  engineering: [
    { name: "Master List ", href: "/Master_list_listcopy", icon: Folder  },       
    { name: "Add Customer Schedule", href: "/Forging_form_test", icon: CalendarPlus },
     { name: "Forging Planning", href: "/Schedule", icon: Hammer },
    { name: "PDF Extraction ", href: "/Pdfextrection", icon: Folder  },
    { name: "NPD Part Tracking ", href: "/NpdTracking", icon: PackageSearch  },
    { name: "Customer Complaint ", href: "/CustomerComplaint", icon: Folder  },
    {
      name: "Traceability",
      href: "#",
      icon: Footprints , // Represents security and verification
      submenu: [
        { name: "By Batch", href: "/TraceabilityCard", icon: ClipboardList }, // Represents lists and records
        { name: "By Component", href: "/TraceabilityCard1", icon: Puzzle  }, // Represents tools and components
      ],
    },
    {
      name: "Calibration",
      href: "#",
      icon: Wrench,
      submenu: [
        { name: "Running Instruments", href: "/Calibration", icon: PlayCircle  },
        { name: "Rejected Instruments", href: "/RejectedCalibration", icon: XCircle  },
       
      ],
    },
    {
      name: "Dispatch",
      href: "#",
      icon: Truck , // Represents security and verification
      submenu: [
        { name: "Dispatch Data", href: "/DispatchList", icon: List },
        { name: "Dispatch Dashboard", href: "/AnalyticsPage", icon: BarChart2 },
      ],
    },
    {
      name: "Quality",
      href: "#",
      icon: BadgeCheck,
      submenu: [
        { name: "Forging", href: "/Forging", icon: Hammer },
        { name: "Rejection Report", href: "/Dashboard", icon: FileText },
        { name: "Yearly Trend", href: "/FinancialTrends", icon: TrendingUp },
      ],
    },
    {
      name: "Production",
      href: "#",
      icon: Factory,
      submenu: [
        { name: "Forging", href: "/Forging_Production", icon: Hammer },
        { name: "Heat Treatment", href: "/Heat_Treatment_Production", icon: Wind },
        { name: "Pre-Machining", href: "/Pre_mc_production", icon: Wrench },
        { name: "CNC", href: "/Cnc_production", icon: Settings },
        { name: "Marking", href: "/Marking_production", icon: Edit },
        { name: "Final Inspection", href: "/Fi_production", icon: ShieldCheck },
        { name: "Visual & Packing", href: "/Visual_production", icon: PackageCheck },
      ],
    },
    {
      name: "Rawmaterial",
      href: "#",
      icon: Cylinder   , // Represents security and verification
      submenu: [
        { name: "RM Inventory", href: "/BalanceAfterHold", icon: Package },
        { name: "Material Information System (MIS)", href: "/Raw_material_update", icon: FileText },
        { name: "Material Issuance List", href: "/Issu_list", icon: List },
        { name: "RM Order Management", href: "/Orders", icon: Clipboard },
        { name: "Supplier Complaint", href: "/Complant", icon: FileText },
        { name: "Supplier Performance", href: "/SupplierPerformanceChart", icon: TrendingUp  },
        { name: "Running Batches", href: "/PlanningUpdates", icon: Activity },
        { name: "Batch List", href: "/PlanningUpdates1", icon: List },
        { name: "Verify Signature", href: "/POVerificationPage", icon: ShieldCheck },
      ],
    },
    {
      name: "Dispatch",
      href: "#",
      icon: Truck , // Represents security and verification
      submenu: [
        { name: "Dispatch Data", href: "/DispatchList", icon: List },
        { name: "Dispatch Dashboard", href: "/AnalyticsPage", icon: BarChart2 },
      ],
    },
  ],
};


export function Sidebar({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [department, setDepartment] = useState("admin");
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 });
  const submenuTimeout = useRef(null);
  const submenuRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get("http://192.168.1.199:8001/api/user-details/", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setUser(response.data);
        setDepartment(response.data.department.toLowerCase());
      } catch (err) {
        console.error("Failed to fetch user details:", err);
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-lg font-semibold">Loading...</div>;
  }

  const profilePhotoUrl = user?.profile_photo
    ? user.profile_photo.startsWith("http")
      ? user.profile_photo
      : `http://192.168.1.199:8001${user.profile_photo}`
    : null;
  const navigationItems = departmentNavigation[department] || [];
  const departmentTitle = department.charAt(0).toUpperCase() + department.slice(1);
  const handleHomeClick = () => {
    if (location.pathname !== `/department/${departmentTitle}`) {
      navigate(`/department/${departmentTitle}`);
    }
  };

  const handleMouseEnter = (event, item) => {
    if (submenuTimeout.current) clearTimeout(submenuTimeout.current);
    const rect = event.target.getBoundingClientRect();
    // Position the submenu slightly to the right to create a gap
    // Check if submenu would go off bottom of screen
    const submenuHeight = item.submenu.length * 40; // Approximate height per item
    const wouldGoOffBottom = rect.top + submenuHeight > window.innerHeight;
    setSubmenuPosition({
      left: rect.right,
      top: wouldGoOffBottom 
        ? window.innerHeight - submenuHeight - 20 // Adjust to stay on screen
        : rect.top
    });
    setHoveredItem(item.name);
  };

  const handleMouseLeave = () => {
    // Only hide if we're not hovering over the submenu
    if (!submenuRef.current || !submenuRef.current.contains(document.activeElement)) {
      submenuTimeout.current = setTimeout(() => setHoveredItem(null), 500); // Increased timeout to 500ms
    }
  };

  const handleSubmenuMouseEnter = () => {
    if (submenuTimeout.current) clearTimeout(submenuTimeout.current);
  };

  const handleSubmenuMouseLeave = () => {
    submenuTimeout.current = setTimeout(() => setHoveredItem(null), 300);
  };
  

  return (
    <div className="fixed h-screen z-50 w-64 bg-white border border-gray-300 border-b-gray-400 flex flex-col justify-between">
      <div className="flex-1 flex flex-col">
        <div className="border border-gray-300 border-b-gray-400 pt-2 pb-2 flex justify-center items-center">
          <img src={logo} alt="SAP Logo" className="h-12 w-15" />
        </div>

        <div className="p-2">
          <h2 className="mb-4 text-lg font-bold text-black">{departmentTitle} Navigation</h2>

          <nav>
            <ul>
              <motion.li
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 rounded-md py-1 text-sm font-medium text-gray-700 hover:bg-blue-50 cursor-pointer"
                onClick={handleHomeClick}
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </motion.li>
            </ul>
            <ul>
            {navigationItems.map((item) => (
                <motion.li
                  key={item.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 rounded-md py-1 text-sm font-medium text-gray-700 hover:bg-blue-50 relative ${
                    item.submenu ? "pr-10" : "" /* Adds right padding only if there's a submenu */
                  }`}
                  onMouseEnter={(e) => handleMouseEnter(e, item)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => !item.submenu && navigate(item.href)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                  {item.submenu?.length > 0 && <ChevronRight className="h-4 w-4 ml-auto" />}
                </motion.li>
              ))}

            </ul>
          </nav>
        </div>
      </div>

      {/* Render submenu outside the main menu container */}
      {hoveredItem && navigationItems.find((navItem) => navItem.name === hoveredItem)?.submenu?.length > 0 && (
          <ul
            ref={submenuRef}
            className="absolute z-50 bg-white shadow-lg rounded-md p-2 border border-gray-200 min-w-[200px]"
            style={{ top: submenuPosition.top, left: submenuPosition.left - 40 }}
            onMouseEnter={handleSubmenuMouseEnter}
            onMouseLeave={handleSubmenuMouseLeave}
          >
            {navigationItems
              .find((navItem) => navItem.name === hoveredItem)
              ?.submenu?.map((subItem) => (
                <motion.li
                  key={subItem.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 rounded-md py-1 text-sm font-medium text-gray-700 hover:bg-blue-50 px-2"
                  onClick={() => navigate(subItem.href)}
                >
                  <subItem.icon className="h-5 w-5" />
                  <span>{subItem.name}</span>
                </motion.li>
              ))}
          </ul>
        )}


      <div className="border border-gray-300 border-b-gray-400 p-2 flex items-center justify-between">
        {user && (
          <div className="flex items-center gap-3">
            {profilePhotoUrl && (
              <img
                src={profilePhotoUrl}
                alt="Profile"
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div className="flex flex-col justify-center h-12">
              <span className="text-base font-semibold text-black">
                {user.name} {user.lastname}
              </span>
              <span className="text-sm text-gray-500">Welcome!</span>
            </div>
          </div>
        )}

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-gray-200"
          >
            <Settings size={20} className="text-gray-600" />
          </button>

          {showMenu && (
            <div className="absolute right-0 bottom-full mb-2 bg-white shadow-lg text-black rounded-md w-60 flex flex-col gap-2 border border-gray-200 p-2">
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                onClick={() => navigate("/ChangePassword")}
              >
                <Key size={20} className="text-gray-600" />
                Change Password
              </button>
              <button
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-100 rounded-md"
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("user");
                  navigate("/");
                }}
              >
                <LogOut size={20} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}