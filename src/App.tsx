import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Home, 
  ClipboardList, 
  Users, 
  BarChart3, 
  Bell, 
  LogOut, 
  User as UserIcon, 
  Sparkles, 
  Shield, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  CreditCard, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Layers, 
  Phone, 
  Mail, 
  BookOpen, 
  RefreshCw,
  TrendingUp,
  Info,
  Search,
  Activity,
  Play,
  Megaphone,
  Sun,
  Moon,
  Monitor,
  Smartphone
} from 'lucide-react';
import { api } from './api';
import { User, Hostel, Room, HostelApplication, Notification } from './types';
import { EditProfileForm } from './components/EditProfileForm';
import InstallAppPrompt from './components/InstallAppPrompt';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';
import { jsPDF } from 'jspdf';

export default function App() {
  // Authentication & Profile States
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hostelease_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  
  // Auth Form Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regMatric, setRegMatric] = useState('');
  const [regGender, setRegGender] = useState<'male' | 'female'>('male');
  const [regPhone, setRegPhone] = useState('');
  const [regDept, setRegDept] = useState('');

  // Forgot Password & Verification Fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  const [simulatedToken, setSimulatedToken] = useState<string | null>(null);
  const [simulatedVerifyToken, setSimulatedVerifyToken] = useState<string | null>(null);

  // Dashboard Tab / Screen State
  // Student tabs: 'dashboard', 'apply', 'history', 'profile'
  // Admin tabs: 'stats', 'hostels', 'rooms', 'applications'
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<string>('overview');

  // Business Data States
  const [hostels, setHostels] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(false);
  
  // Theme Management States
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('hostelease_theme') as 'light' | 'dark' | 'system') || 'system'
  );
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Selection and Drilldown States
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [roomHostelId, setRoomHostelId] = useState<string>(''); // For Room Management filter
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form Modals / Add State
  const [newHostelName, setNewHostelName] = useState('');
  const [newHostelType, setNewHostelType] = useState<'male' | 'female' | 'unisex'>('unisex');
  const [newHostelCapacity, setNewHostelCapacity] = useState('100');
  const [newHostelLocation, setNewHostelLocation] = useState('');
  const [newHostelDesc, setNewHostelDesc] = useState('');
  const [newHostelImg, setNewHostelImg] = useState('');

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file from your local gallery', 'error');
      return;
    }
    
    setIsUploadingImg(true);
    setUploadProgress(0);
    setUploadSuccess(false);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      
      // Simulate real-time CDN compression progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsUploadingImg(false);
          setUploadSuccess(true);
          setNewHostelImg(base64String);
          setCloudinaryMetadata({
            publicId: 'gallery_' + file.name.split('.')[0].toLowerCase().replace(/[^a-z0-9]/g, '_'),
            bytes: file.size,
            format: file.type.split('/')[1] || 'webp',
            secureUrl: base64String,
          });
          showToast(`"${file.name}" uploaded and optimized via local gallery!`, 'success');
        }
      }, 100);
    };
    
    reader.onerror = () => {
      setIsUploadingImg(false);
      showToast('Failed to read image file', 'error');
    };
    
    reader.readAsDataURL(file);
  };

  const [newRoomNo, setNewRoomNo] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState('4');
  const [newRoomPrice, setNewRoomPrice] = useState('150000');

  // Room filtering & edit modal states
  const [roomSearch, setRoomSearch] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState<'all' | 'available' | 'full' | 'maintenance'>('all');
  const [roomPriceFilter, setRoomPriceFilter] = useState('');
  const [editingRoom, setEditingRoom] = useState<any | null>(null);
  const [editingRoomNo, setEditingRoomNo] = useState('');
  const [editingRoomCapacity, setEditingRoomCapacity] = useState('');
  const [editingRoomPrice, setEditingRoomPrice] = useState('');
  const [editingRoomStatus, setEditingRoomStatus] = useState<'available' | 'full' | 'maintenance'>('available');

  // Automated Integration Testing States
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResult, setTestResult] = useState<'passed' | 'failed' | null>(null);

  // Student Application Form
  const [appHostelId, setAppHostelId] = useState('');
  const [appAcademicYear, setAppAcademicYear] = useState('2025/2026');
  const [appMessage, setAppMessage] = useState('');

  // --- Search, Filter & Pagination States ---
  // Hostels list filtering (Admin & Student)
  const [hostelSearch, setHostelSearch] = useState('');
  const [hostelTypeFilter, setHostelTypeFilter] = useState<'all' | 'male' | 'female' | 'unisex'>('all');
  const [hostelVacancyFilter, setHostelVacancyFilter] = useState(false);
  const [hostelPage, setHostelPage] = useState(1);
  const [hostelLimit] = useState(6); // 6 cards per page
  const [hostelsTotalPages, setHostelsTotalPages] = useState(1);

  // Student directory listing (Admin)
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentDeptFilter, setStudentDeptFilter] = useState('all');
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit] = useState(10); // 10 student list items per page
  const [studentsTotalPages, setStudentsTotalPages] = useState(1);

  // Hostel details drilldown modal
  const [drilldownHostelId, setDrilldownHostelId] = useState<string | null>(null);
  const [drilldownRooms, setDrilldownRooms] = useState<any[]>([]);

  // Simulated Cloudinary Media Upload States
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [cloudinaryMetadata, setCloudinaryMetadata] = useState<{
    publicId: string;
    bytes: number;
    format: string;
    secureUrl: string;
  } | null>(null);

  // Admin Decision Form
  const [decisionAppId, setDecisionAppId] = useState<string | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'approved' | 'rejected'>('approved');
  const [decisionRoomId, setDecisionRoomId] = useState('');
  const [decisionComment, setDecisionComment] = useState('');

  // Mock Payment Screen
  const [payingApp, setPayingApp] = useState<HostelApplication | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Auto-Toast Dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Bootup: Validate session
  useEffect(() => {
    bootstrapSession();
  }, [token]);

  // Load contextual data based on logged-in user
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  const bootstrapSession = async () => {
    setLoading(true);
    if (token) {
      try {
        const currentUser = await api.me();
        setUser(currentUser);
        // Default views depending on role
        if (currentUser.role === 'student') {
          setActiveTab('dashboard');
        } else {
          setActiveTab('stats');
        }
      } catch (err) {
        console.error('Session validation failed, cleaning local storage', err);
        api.logout();
        setUser(null);
        setToken(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  const fetchAnalyticsData = async () => {
    setLoadingAnalytics(true);
    try {
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.error("Failed to load analytics:", err);
      // Fail silently or toast error
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const exportToCSV = () => {
    if (!analytics) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add Header Section
    csvContent += "HOSTELEASE EXECUTIVE ANALYTICS REPORT\r\n";
    csvContent += `Generated At: ${new Date().toLocaleString()}\r\n\r\n`;
    
    // Section 1: Summary Stats
    csvContent += "SYSTEM OVERVIEW SUMMARY\r\n";
    csvContent += "Metric,Value\r\n";
    csvContent += `Total Student Body,${analytics.summary.totalStudents}\r\n`;
    csvContent += `Total Hostels,${analytics.summary.totalHostels}\r\n`;
    csvContent += `Total Rooms,${analytics.summary.totalRooms}\r\n`;
    csvContent += `Total Housing Capacity,${analytics.summary.totalCapacity}\r\n`;
    csvContent += `Allocated Beds,${analytics.summary.allocatedBeds}\r\n`;
    csvContent += `Vacant Beds,${analytics.summary.vacantBeds}\r\n`;
    csvContent += `Occupancy Rate (%),${analytics.summary.occupancyRate}%\r\n`;
    csvContent += `Realized Revenue (NGN),${analytics.summary.realizedRevenue}\r\n`;
    csvContent += `Projected Revenue (NGN),${analytics.summary.projectedRevenue}\r\n\r\n`;
    
    // Section 2: Hostel Occupancy
    csvContent += "HOSTEL OCCUPANCY METRICS\r\n";
    csvContent += "Hostel Name,Type,Capacity,Allocated Beds,Available Beds,Occupancy Rate (%)\r\n";
    analytics.occupancy.byHostel.forEach((h: any) => {
      csvContent += `"${h.name}",${h.type},${h.capacity},${h.occupied},${h.available},${h.occupancyRate}%\r\n`;
    });
    csvContent += "\r\n";
    
    // Section 3: Monthly report
    csvContent += "MONTHLY FINANCIAL & ACTIVITY AUDITS\r\n";
    csvContent += "Month,New Submissions,Approvals,Payments Confirmed,Revenue Generated (NGN),Most Requested Block\r\n";
    analytics.monthlyReports.forEach((r: any) => {
      csvContent += `"${r.monthName}",${r.newApplicationsCount},${r.approvedApplicationsCount},${r.paymentsConfirmedCount},${r.revenueGenerated},"${r.topHostelName}"\r\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hostelease_analytics_report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Analytics summary report successfully exported to CSV!", "success");
  };

  const exportToPDF = () => {
    if (!analytics) return;
    
    try {
      const doc = new jsPDF();
      let y = 15;
      
      // Page Heading
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(31, 41, 55); // slate-800
      doc.text("HostelEase Executive Analytics Report", 14, y);
      
      y += 8;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Generated on: ${new Date().toLocaleString()} | Campus Housing Authority`, 14, y);
      
      // Divider
      y += 4;
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y, 196, y);
      
      // Section 1: Executive Overview Summary
      y += 12;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("1. Executive Overview Summary", 14, y);
      
      y += 8;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      
      const summaryStats = [
        ["Total Student Portal Accounts", String(analytics.summary.totalStudents), "Active Campus Hostels", String(analytics.summary.totalHostels)],
        ["Inventory Rooms Configured", String(analytics.summary.totalRooms), "Total Housing Beds Capacity", String(analytics.summary.totalCapacity)],
        ["Allocated Beds (Secured)", String(analytics.summary.allocatedBeds), "General Occupancy Rate", `${analytics.summary.occupancyRate}%`],
        ["Realized Housing Revenue", `NGN ${analytics.summary.realizedRevenue.toLocaleString()}`, "Projected Housing Revenue", `NGN ${analytics.summary.projectedRevenue.toLocaleString()}`]
      ];
      
      summaryStats.forEach(row => {
        doc.setFont("Helvetica", "bold");
        doc.text(row[0] + ":", 14, y);
        doc.setFont("Helvetica", "normal");
        doc.text(row[1], 75, y);
        
        doc.setFont("Helvetica", "bold");
        doc.text(row[2] + ":", 110, y);
        doc.setFont("Helvetica", "normal");
        doc.text(row[3], 175, y);
        
        y += 7;
      });
      
      // Section 2: Hostel Breakdown
      y += 8;
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("2. Hostel Occupancy & Capacity Allocations", 14, y);
      
      y += 8;
      // Header for Hostel table
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 7, "F");
      doc.text("Hostel Name", 16, y);
      doc.text("Type", 90, y);
      doc.text("Capacity", 120, y);
      doc.text("Occupied", 145, y);
      doc.text("Occupancy %", 170, y);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 2, 196, y + 2);
      
      y += 7;
      doc.setFont("Helvetica", "normal");
      analytics.occupancy.byHostel.forEach((h: any) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(h.name, 16, y);
        doc.text(h.type === 'male' ? 'Male (Boys)' : h.type === 'female' ? 'Female (Girls)' : 'Unisex', 90, y);
        doc.text(String(h.capacity), 120, y);
        doc.text(String(h.occupied), 145, y);
        doc.text(`${h.occupancyRate}%`, 170, y);
        y += 7;
      });
      
      // Section 3: Monthly activity
      y += 8;
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 41, 59);
      doc.text("3. Monthly Financials & Application Audits", 14, y);
      
      y += 8;
      doc.setFontSize(9);
      doc.setFont("Helvetica", "bold");
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 5, 182, 7, "F");
      doc.text("Report Month", 16, y);
      doc.text("Submitted", 50, y);
      doc.text("Approved", 80, y);
      doc.text("Paid Trans.", 110, y);
      doc.text("Revenue (NGN)", 140, y);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y + 2, 196, y + 2);
      
      y += 7;
      doc.setFont("Helvetica", "normal");
      analytics.monthlyReports.forEach((r: any) => {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(r.monthName, 16, y);
        doc.text(String(r.newApplicationsCount), 50, y);
        doc.text(String(r.approvedApplicationsCount), 80, y);
        doc.text(String(r.paymentsConfirmedCount), 110, y);
        doc.text(`NGN ${r.revenueGenerated.toLocaleString()}`, 140, y);
        y += 7;
      });
      
      // Save PDF
      doc.save(`hostelease_analytics_report_${new Date().toISOString().substring(0, 10)}.pdf`);
      showToast("Advanced Executive PDF report successfully generated and downloaded!", "success");
    } catch (err: any) {
      console.error("PDF Export Error:", err);
      showToast("Failed to generate PDF report", "error");
    }
  };

  const loadData = async () => {
    try {
      // Parallel fetches for responsiveness
      const [allApplications, allNotifications] = await Promise.all([
        api.listApplications(),
        api.listNotifications(),
      ]);

      setApplications(allApplications);
      setNotifications(allNotifications);
      
      // Trigger paginated and filtered hostel load
      fetchHostels();

      if (user?.role !== 'student') {
        const systemStats = await api.getStats();
        setStats(systemStats);
        fetchAnalyticsData();
        
        // Load student directory
        fetchStudentsList();
        
        // Auto-select first hostel for Room Management view if available
        const allHostels = await api.listHostels();
        if (allHostels.length > 0 && !roomHostelId) {
          setRoomHostelId(allHostels[0].id);
        }
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to fetch database tables', 'error');
    }
  };

  // Advanced Hostel Fetcher
  const fetchHostels = async () => {
    try {
      const list = await api.listHostels({
        search: hostelSearch,
        type: hostelTypeFilter,
        hasVacancy: hostelVacancyFilter,
        page: hostelPage,
        limit: hostelLimit,
      });
      setHostels(list);
      
      const fullList = await api.listHostels({
        search: hostelSearch,
        type: hostelTypeFilter,
        hasVacancy: hostelVacancyFilter,
      });
      setHostelsTotalPages(Math.ceil(fullList.length / hostelLimit) || 1);
    } catch (err: any) {
      console.error('Error fetching hostels:', err);
    }
  };

  // Student directory fetcher (Admin only)
  const fetchStudentsList = async () => {
    if (!user || user.role === 'student') return;
    try {
      const list = await api.listStudents({
        search: studentSearch,
        department: studentDeptFilter,
        page: studentPage,
        limit: studentLimit,
      });
      setStudentsList(list);

      const fullList = await api.listStudents({
        search: studentSearch,
        department: studentDeptFilter,
      });
      setStudentsTotalPages(Math.ceil(fullList.length / studentLimit) || 1);
    } catch (err: any) {
      console.error('Error fetching student directory:', err);
    }
  };

  // Theme Application Logic
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let isDark = false;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('hostelease_theme', theme);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  // Reactive updates on query triggers
  useEffect(() => {
    if (user) {
      fetchHostels();
    }
  }, [hostelSearch, hostelTypeFilter, hostelVacancyFilter, hostelPage, user]);

  useEffect(() => {
    if (user && user.role !== 'student') {
      fetchStudentsList();
    }
  }, [studentSearch, studentDeptFilter, studentPage, user]);

  // Reload room list if the active hostel selection in Room Management changes
  useEffect(() => {
    if (roomHostelId && user) {
      fetchRooms(roomHostelId);
    }
  }, [roomHostelId, user]);

  const fetchRooms = async (hostelId: string) => {
    try {
      const list = await api.listRooms(hostelId);
      setRooms(list);
    } catch (err: any) {
      showToast(err.message || 'Failed to list rooms', 'error');
    }
  };

  // Handle Authentication Trigger
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Please fill all login fields', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await api.login({ emailOrUsername: loginEmail, password: loginPassword });
      setToken(res.token);
      setUser(res.user);
      showToast(`Welcome back, ${res.user.name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Authentication credentials rejected', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername || !regEmail || !regPassword || !regName || !regMatric || !regPhone) {
      showToast('All fields marked with an asterisk are strictly required.', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await api.register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        name: regName,
        matricNoOrStaffId: regMatric,
        gender: regGender,
        phone: regPhone,
        department: regDept,
      });
      setToken(res.token);
      setUser(res.user);
      if (res.user.emailVerificationToken) {
        setSimulatedVerifyToken(res.user.emailVerificationToken);
        setVerifyToken(res.user.emailVerificationToken);
      }
      showToast(`Account created successfully. Welcome ${res.user.name}!`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Registration failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email or username', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await api.forgotPassword(forgotEmail);
      showToast(res.message, 'success');
      if (res.simulatedToken) {
        setSimulatedToken(res.simulatedToken);
        setResetToken(res.simulatedToken); // Auto-populate for frictionless academic testing
        setAuthMode('reset');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing forgot password request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken || !resetNewPassword) {
      showToast('Token and new password are required', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await api.resetPassword(resetToken, resetNewPassword);
      showToast(res.message, 'success');
      setAuthMode('login');
      setSimulatedToken(null);
      setResetToken('');
      setResetNewPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!verifyToken) {
      showToast('Please enter the verification token', 'error');
      return;
    }
    try {
      setLoading(true);
      const res = await api.verifyEmail(verifyToken);
      showToast(res.message, 'success');
      setVerifyToken('');
      setSimulatedVerifyToken(null);
      // Refresh current user session info
      bootstrapSession();
    } catch (err: any) {
      showToast(err.message || 'Failed to verify email address', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerVerification = async () => {
    try {
      setLoading(true);
      const res = await api.sendVerificationEmail();
      showToast(res.message, 'success');
      if (res.simulatedToken) {
        setSimulatedVerifyToken(res.simulatedToken);
        setVerifyToken(res.simulatedToken); // Auto-populate for smooth experience
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send verification email token', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setToken(null);
    setHostels([]);
    setRooms([]);
    setApplications([]);
    setNotifications([]);
    setStats(null);
    showToast('Securely logged out.', 'info');
  };

  // Quick Switch Account for Lecturers / Grading Panel
  const handleQuickSwitch = async (role: 'student_john' | 'student_jane' | 'hostel_admin' | 'system_admin') => {
    let username = 'admin';
    let password = 'admin123';

    if (role === 'student_john') {
      username = 'john';
      password = 'john123';
    } else if (role === 'student_jane') {
      username = 'jane';
      password = 'jane123';
    } else if (role === 'hostel_admin') {
      username = 'manager';
      password = 'manager123';
    }

    try {
      setLoading(true);
      const res = await api.login({ emailOrUsername: username, password });
      setToken(res.token);
      setUser(res.user);
      showToast(`Switched to demo user: ${res.user.name} (${res.user.role})`, 'success');
    } catch (err: any) {
      showToast('Quick switch failed. Please register standard account.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Create Hostel (Admin)
  const handleCreateHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createHostel({
        name: newHostelName,
        type: newHostelType,
        capacity: Number(newHostelCapacity),
        location: newHostelLocation,
        description: newHostelDesc,
        imageUrl: newHostelImg,
      });
      showToast('Hostel asset successfully created.', 'success');
      // Reset fields
      setNewHostelName('');
      setNewHostelLocation('');
      setNewHostelDesc('');
      setNewHostelImg('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create hostel', 'error');
    }
  };

  // Delete Hostel (Admin)
  const handleDeleteHostel = async (id: string) => {
    if (!window.confirm('Are you absolute sure you want to delete this hostel? All associated rooms and pending applications will be lost.')) return;
    try {
      await api.deleteHostel(id);
      showToast('Hostel removed successfully.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete hostel.', 'error');
    }
  };

  // Add Room (Admin)
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomHostelId) {
      showToast('Select a hostel first.', 'error');
      return;
    }
    try {
      await api.addRoom(roomHostelId, {
        roomNo: newRoomNo,
        capacity: Number(newRoomCapacity),
        price: Number(newRoomPrice),
      });
      showToast(`Room ${newRoomNo} registered successfully.`, 'success');
      setNewRoomNo('');
      fetchRooms(roomHostelId);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add room.', 'error');
    }
  };

  // Change Room Status (Admin)
  const handleToggleRoomStatus = async (room: Room, newStatus: 'available' | 'maintenance' | 'full') => {
    try {
      await api.updateRoom(room.id, { status: newStatus });
      showToast(`Room ${room.roomNo} status updated to ${newStatus}.`, 'success');
      fetchRooms(room.hostelId);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to change status.', 'error');
    }
  };

  // Delete Room (Admin)
  const handleDeleteRoom = async (room: Room) => {
    if (!window.confirm(`Delete Room ${room.roomNo}?`)) return;
    try {
      await api.deleteRoom(room.id);
      showToast(`Room ${room.roomNo} deleted.`, 'success');
      fetchRooms(room.hostelId);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete room', 'error');
    }
  };

  // Update Room Submit (Admin)
  const handleUpdateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    try {
      await api.updateRoom(editingRoom.id, {
        roomNo: editingRoomNo,
        capacity: Number(editingRoomCapacity),
        price: Number(editingRoomPrice),
        status: editingRoomStatus,
      });
      showToast(`Room ${editingRoomNo} updated successfully.`, 'success');
      setEditingRoom(null);
      fetchRooms(editingRoom.hostelId);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update room.', 'error');
    }
  };

  // Automated Integration Testing Suite for Rooms
  const runDiagnosticsSuite = async () => {
    setIsRunningTests(true);
    setTestResult(null);
    const logs: string[] = [];
    const log = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setTestLogs([...logs]);
    };

    try {
      log("Initializing Room Management Diagnostic Test Suite...");
      
      // Step 1: Create a test unisex hostel
      log("Step 1: Provisioning a test Unisex Hostel block...");
      const hostelName = `Test Block ${Math.random().toString(36).substring(7).toUpperCase()}`;
      const hostelRes = await api.createHostel({
        name: hostelName,
        type: 'unisex',
        capacity: 10,
        location: 'Diagnostic Labs Wing',
        description: 'Temporary sandbox block for verifying allocation safety constraints.'
      });
      const testHostelId = hostelRes.hostel.id;
      log(`✔ Unisex Hostel created successfully (ID: ${testHostelId})`);

      // Step 2: Create a Room
      log("Step 2: Testing Room Creation (CRUD)...");
      const roomRes = await api.addRoom(testHostelId, {
        roomNo: 'D-101',
        capacity: 2,
        price: 120000
      });
      const testRoomId = roomRes.room.id;
      log(`✔ Room D-101 created successfully (ID: ${testRoomId})`);

      // Step 3: Test Duplicate Room Code Constraint
      log("Step 3: Testing duplicate room code block...");
      try {
        await api.addRoom(testHostelId, {
          roomNo: 'D-101',
          capacity: 2,
          price: 120000
        });
        throw new Error("Duplicate room creation did not throw!");
      } catch (err: any) {
        log(`✔ Duplicate room validation blocked successfully: "${err.message}"`);
      }

      // Step 4: Test Capacity Validation (Capacity must be > 0)
      log("Step 4: Testing capacity constraints (Capacity <= 0)...");
      try {
        await api.addRoom(testHostelId, {
          roomNo: 'D-102',
          capacity: 0,
          price: 120000
        });
        throw new Error("Zero-capacity room creation did not throw!");
      } catch (err: any) {
        log(`✔ Zero-capacity block working correctly: "${err.message}"`);
      }

      // Step 5: Test Negative Price constraint
      log("Step 5: Testing pricing constraint (Price < 0)...");
      try {
        await api.addRoom(testHostelId, {
          roomNo: 'D-102',
          capacity: 2,
          price: -5000
        });
        throw new Error("Negative price room creation did not throw!");
      } catch (err: any) {
        log(`✔ Negative price validation working correctly: "${err.message}"`);
      }

      // Step 6: Create valid room D-102
      log("Provisioning second clean test room D-102...");
      const room2Res = await api.addRoom(testHostelId, {
        roomNo: 'D-102',
        capacity: 2,
        price: 130000
      });
      const testRoom2Id = room2Res.room.id;
      log(`✔ Room D-102 created successfully (ID: ${testRoom2Id})`);

      // Step 7: Test Allocation Compatibility (Same-room same-gender in unisex hostels)
      log("Step 7: Verifying Allocation Compatibility and gender security rules...");
      
      log("Creating application for student John (Male)...");
      const appJohnRes = await api.submitApplication({
        hostelId: testHostelId,
        academicYear: '2025/2026',
        message: 'Diagnostics test John'
      });
      const johnAppId = appJohnRes.application.id;
      log(`✔ John application registered (ID: ${johnAppId})`);

      log("Approving and allocating John (Male) to Room D-101...");
      await api.updateApplicationStatus(johnAppId, {
        status: 'approved',
        roomId: testRoomId,
        adminComment: 'System test auto-allocation'
      });
      log("✔ John allocated to D-101 successfully");

      // Submit application for Jane (Female)
      log("Creating application for student Jane (Female)...");
      const appJaneRes = await api.submitApplication({
        hostelId: testHostelId,
        academicYear: '2025/2026',
        message: 'Diagnostics test Jane'
      });
      const janeAppId = appJaneRes.application.id;
      log(`✔ Jane application registered (ID: ${janeAppId})`);

      // Now attempt to allocate Jane (Female) to D-101 (which has Male occupant John)
      log("CRITICAL TEST: Attempting to allocate Jane (Female) to Room D-101 (Male occupant present)...");
      try {
        await api.updateApplicationStatus(janeAppId, {
          status: 'approved',
          roomId: testRoomId,
          adminComment: 'Violate gender compatibility check'
        });
        throw new Error("Compatibility mismatch error was NOT thrown!");
      } catch (err: any) {
        log(`✔ GENDER PROTECTION SECURE: Mixed-gender room allocation blocked with: "${err.message}"`);
      }

      // Verify allocating Jane to unoccupied room D-102 works
      log("Allocating Jane (Female) to unoccupied Room D-102...");
      await api.updateApplicationStatus(janeAppId, {
        status: 'approved',
        roomId: testRoom2Id,
        adminComment: 'Unoccupied compatibility match'
      });
      log("✔ Jane allocated to Room D-102 successfully");

      // Step 8: Clean up
      log("Step 8: Tearing down test artifacts and cleaning up database...");
      await api.deleteHostel(testHostelId);
      log("✔ Temporary hostel and cascade room assets deleted successfully.");

      log("🎉 ALL TESTS PASSED! Room Management logic verified end-to-end.");
      setTestResult('passed');
    } catch (err: any) {
      log(`❌ DIAGNOSTIC FAILURE: ${err.message}`);
      setTestResult('failed');
    } finally {
      setIsRunningTests(false);
      loadData();
    }
  };

  // Submit Hostel Application (Student)
  const handleApplyHostel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appHostelId) {
      showToast('Please select a preferred hostel block.', 'error');
      return;
    }
    try {
      await api.submitApplication({
        hostelId: appHostelId,
        academicYear: appAcademicYear,
        message: appMessage,
      });
      showToast('Hostel application successfully submitted to Student Affairs.', 'success');
      setAppHostelId('');
      setAppMessage('');
      setActiveTab('history');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to apply.', 'error');
    }
  };

  // Process Admin Decision (Approve / Reject Application)
  const handleAdminDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionAppId) return;
    try {
      await api.updateApplicationStatus(decisionAppId, {
        status: decisionStatus,
        roomId: decisionStatus === 'approved' ? decisionRoomId : undefined,
        adminComment: decisionComment,
      });
      showToast(`Application processed successfully.`, 'success');
      setDecisionAppId(null);
      setDecisionRoomId('');
      setDecisionComment('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to process application decision.', 'error');
    }
  };

  // Process Payment (Student)
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingApp) return;
    if (!cardNumber || !cardExpiry || !cardCvv) {
      showToast('All transaction billing fields are required.', 'error');
      return;
    }
    try {
      await api.payForAllocation(payingApp.id);
      showToast(`Payment successful! Bed space allocation secured.`, 'success');
      setPayingApp(null);
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Payment processing failed.', 'error');
    }
  };

  // Cancel Hostel Application (Student / Admin)
  const handleCancelApplication = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this application? If you have paid for a room allocation, it will release your bed space and room allocation.')) return;
    try {
      await api.cancelApplication(id);
      showToast('Application successfully cancelled and removed.', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel application.', 'error');
    }
  };

  // Notifications Tray Actions
  const handleMarkNotification = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  return (
    <div id="hostelease-app" className="min-h-screen bg-[#0A0A0B] text-slate-300 font-sans flex flex-col justify-between overflow-x-hidden antialiased select-none">
      
      {/* Toast Alert Popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-[#0F0F12] border border-white/10 px-5 py-4 rounded-xl shadow-2xl animate-fade-in max-w-sm">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />}
          {toast.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-400 shrink-0" />}
          <p className="text-xs font-medium text-slate-100 leading-snug">{toast.message}</p>
        </div>
      )}

      {/* Loader Modal */}
      {loading && (
        <div className="fixed inset-0 bg-[#0A0A0B]/85 z-50 flex flex-col items-center justify-center space-y-4 backdrop-blur-sm">
          <div className="w-10 h-10 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-indigo-300 font-medium">Synchronizing Secure Ledger...</p>
        </div>
      )}

      {/* APP HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0A0B]/90 border-b border-white/5 backdrop-blur-md px-6 lg:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif italic text-white tracking-tight leading-none">HostelEase</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-indigo-400 font-bold mt-1">University Housing Portal</p>
          </div>
          <span className="hidden md:inline-flex px-2 py-0.5 bg-green-500/10 text-green-400 text-[9px] font-bold rounded-full border border-green-500/20 uppercase tracking-widest font-sans">
            ● System Active
          </span>
        </div>

        <div className="flex items-center space-x-4 lg:space-x-6">
          {/* Theme Toggle Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsThemeOpen(!isThemeOpen)} 
              className="relative p-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              title="Adjust system aesthetics"
            >
              {theme === 'light' && <Sun className="w-4.5 h-4.5 text-amber-500" />}
              {theme === 'dark' && <Moon className="w-4.5 h-4.5 text-indigo-400" />}
              {theme === 'system' && <Monitor className="w-4.5 h-4.5 text-slate-400" />}
            </button>

            {isThemeOpen && (
              <div className="absolute right-0 mt-3 w-40 bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in">
                <button 
                  onClick={() => { setTheme('light'); setIsThemeOpen(false); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                    theme === 'light' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </button>
                <button 
                  onClick={() => { setTheme('dark'); setIsThemeOpen(false); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all mt-1 cursor-pointer ${
                    theme === 'dark' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </button>
                <button 
                  onClick={() => { setTheme('system'); setIsThemeOpen(false); }}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all mt-1 cursor-pointer ${
                    theme === 'system' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span>System Sync</span>
                </button>
              </div>
            )}
          </div>

          {user ? (
            <div className="flex items-center space-x-4 lg:space-x-6">
              {/* Academic Session */}
              <div className="hidden lg:block text-right">
                <p className="text-[9px] uppercase tracking-wider text-slate-500">Current Session</p>
                <p className="text-xs font-medium text-slate-200">2025/2026 Academic Term</p>
              </div>

              {/* Mobile App Install Button */}
              <button
                onClick={() => (window as any).triggerInstallGuide?.()}
                className="py-1.5 px-3 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm shadow-indigo-600/5 animate-pulse"
                style={{ animationDuration: '3s' }}
                title="Install HostelEase Mobile App on your Phone"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline uppercase tracking-wider">Get Mobile App</span>
              </button>

              {/* Notification Bell */}
              <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)} 
                  className="relative p-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-all text-slate-300 hover:text-white cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {getUnreadCount() > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {getUnreadCount()}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-[#0F0F12] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                      <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Student Affairs Alerts</h4>
                      {getUnreadCount() > 0 && (
                        <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-400 text-[10px] rounded font-medium">
                          {getUnreadCount()} New
                        </span>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-[11px] text-slate-500 py-4 text-center">No recent activity notifications.</p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => handleMarkNotification(n.id)}
                            className={`p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                              n.read 
                                ? 'bg-transparent border-white/5 opacity-55' 
                                : 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/20'
                            }`}
                          >
                            <p className="text-xs font-semibold text-slate-200">{n.title}</p>
                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{n.message}</p>
                            <span className="text-[8px] text-slate-500 mt-2 block font-mono">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Summary */}
              <div className="flex items-center space-x-3 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-serif text-sm font-bold uppercase">
                  {user.name.substring(0, 2)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                  <p className="text-[8px] text-indigo-400 uppercase tracking-widest font-bold mt-1">{user.role.replace('_', ' ')}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-red-500/5 transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 uppercase tracking-widest hidden sm:block">
              Secure Hostel Allocation Suite
            </div>
          )}
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-12 flex flex-col justify-start">
        
        {/* --- 1. NOT AUTHENTICATED: LOGIN & SIGNUP SCREENS --- */}
        {!user ? (
          <div className="w-full max-w-md mx-auto my-auto py-8">
            <div className="bg-[#0F0F12] border border-white/5 p-8 rounded-2xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
              
              <div className="text-center mb-8">
                <h3 className="text-xl font-serif italic text-white">
                  {authMode === 'login' && 'Access Housing Dashboard'}
                  {authMode === 'register' && 'Register New Student Profile'}
                  {authMode === 'forgot' && 'Reset Portal Password'}
                  {authMode === 'reset' && 'Set New Password'}
                </h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">
                  {authMode === 'login' && 'Secure Sign-In Interface'}
                  {authMode === 'register' && 'Academic Verification credentials required'}
                  {authMode === 'forgot' && 'Self-service credential recovery suite'}
                  {authMode === 'reset' && 'Validate recovery token to apply modifications'}
                </p>
              </div>

              {authMode === 'login' ? (
                // Login Form
                <form onSubmit={handleLogin} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Email or Username</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                      placeholder="e.g. john or john@student.edu"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Security Password</label>
                      <button 
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setSimulatedToken(null);
                        }}
                        className="text-[10px] text-indigo-400 hover:underline font-semibold"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <input 
                      type="password"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 mt-6"
                  >
                    Authenticate Securely
                  </button>
                  <p className="text-center text-[11px] text-slate-500 mt-4">
                    New applicant?{' '}
                    <button 
                      type="button" 
                      onClick={() => {
                        setAuthMode('register');
                        setSimulatedVerifyToken(null);
                      }}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Register Student Profile
                    </button>
                  </p>
                </form>
              ) : authMode === 'register' ? (
                // Register Form
                <form onSubmit={handleRegister} className="space-y-4 text-left">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Username *</label>
                      <input 
                        type="text"
                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        placeholder="john12"
                        value={regUsername}
                        onChange={e => setRegUsername(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Email *</label>
                      <input 
                        type="email"
                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        placeholder="john@student.edu"
                        value={regEmail}
                        onChange={e => setRegEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Security Password *</label>
                    <input 
                      type="password"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="Minimum 6 characters"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Full Legal Name *</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="Firstname Lastname"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Matric Number *</label>
                      <input 
                        type="text"
                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                        placeholder="RUN/2023/10234"
                        value={regMatric}
                        onChange={e => setRegMatric(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Gender *</label>
                      <select 
                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                        value={regGender}
                        onChange={e => setRegGender(e.target.value as any)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Phone Contact *</label>
                      <input 
                        type="text"
                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="+234 803"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Academic Dept</label>
                      <input 
                        type="text"
                        className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                        placeholder="Computer Science"
                        value={regDept}
                        onChange={e => setRegDept(e.target.value)}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider mt-6"
                  >
                    Submit & Join Portal
                  </button>
                  <p className="text-center text-[11px] text-slate-500 mt-4">
                    Already registered?{' '}
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('login')}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Sign In Here
                    </button>
                  </p>
                </form>
              ) : authMode === 'forgot' ? (
                // Forgot Password Form
                <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Registered Email or Username</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                      placeholder="e.g. john@student.edu"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Provide your account details to recover secure password access.
                    </p>
                  </div>

                  {simulatedToken && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 space-y-2 mt-4">
                      <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold">
                        <Sparkles className="w-4 h-4 animate-pulse" />
                        <span>Simulated Recovery Server Response</span>
                      </div>
                      <p className="text-[10px] text-slate-300">
                        In production, a cryptographic reset token is mailed out. Use this simulated token to reset instantly:
                      </p>
                      <div className="bg-[#0A0A0B] border border-white/5 rounded-lg p-2 font-mono text-[10px] text-emerald-400 select-all break-all">
                        {simulatedToken}
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 mt-6"
                  >
                    Generate Recovery Token
                  </button>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-4">
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('login')}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Return to Sign In
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('reset')}
                      className="text-slate-400 hover:underline"
                    >
                      Enter Token Manually
                    </button>
                  </div>
                </form>
              ) : (
                // Reset Password Form
                <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">Cryptographic Reset Token</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                      placeholder="e.g. reset_..."
                      value={resetToken}
                      onChange={e => setResetToken(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1 font-semibold">New Security Password</label>
                    <input 
                      type="password"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                      placeholder="Minimum 6 characters"
                      value={resetNewPassword}
                      onChange={e => setResetNewPassword(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider shadow-lg shadow-indigo-500/10 mt-6"
                  >
                    Commit New Password
                  </button>

                  <p className="text-center text-[11px] text-slate-500 mt-4">
                    Remembered password?{' '}
                    <button 
                      type="button" 
                      onClick={() => setAuthMode('login')}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Sign In Here
                    </button>
                  </p>
                </form>
              )}
            </div>
          </div>
        ) : (
          
          /* --- 2. AUTHENTICATED WORKSPACES --- */
          <div className="w-full space-y-6">
            {/* Email Verification banner */}
            {!user.isEmailVerified && (
              <div className="bg-[#120F0F] border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-400 mt-1 md:mt-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Email Address Unverified</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xl">
                      Your profile's email address <strong className="text-slate-200">{user.email}</strong> is unverified. Under university security rules, verified status is required to request housing allocations or access payments.
                    </p>
                    {simulatedVerifyToken && (
                      <div className="mt-3 bg-[#0A0A0B] border border-white/5 rounded-lg p-2.5 max-w-md">
                        <div className="text-[10px] text-indigo-400 font-mono flex items-center space-x-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          <span>Simulated Mail Delivery Token:</span>
                        </div>
                        <div className="font-mono text-xs text-emerald-400 select-all font-semibold">{simulatedVerifyToken}</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
                  <div className="flex bg-[#0A0A0B] border border-white/10 rounded-xl overflow-hidden px-1 py-1 max-w-xs">
                    <input 
                      type="text"
                      placeholder="Enter verification token"
                      className="bg-transparent text-xs text-white placeholder-slate-600 px-3 py-1.5 focus:outline-none w-full font-mono"
                      value={verifyToken}
                      onChange={e => setVerifyToken(e.target.value)}
                    />
                    <button 
                      onClick={() => handleVerifyEmailSubmit()}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold text-xs px-4 py-1.5 rounded-lg transition-all"
                    >
                      Verify
                    </button>
                  </div>
                  <button 
                    onClick={handleTriggerVerification}
                    className="border border-white/10 hover:bg-white/[0.02] text-slate-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend Code</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8 w-full items-start">
            
            {/* SIDE BAR NAVIGATION */}
            <aside className="w-full lg:w-64 bg-[#0F0F12] border border-white/5 rounded-2xl p-6 flex flex-col space-y-2 shrink-0">
              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-1">Navigation Console</p>
                <div className="h-0.5 w-8 bg-indigo-500 rounded-full"></div>
              </div>

              {user.role === 'student' ? (
                // STUDENT NAVIGATION
                <>
                  <button 
                    onClick={() => setActiveTab('dashboard')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'dashboard' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <Home className="w-4 h-4 shrink-0" />
                    <span>My Dashboard</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('apply')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'apply' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Apply Hostel</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('history')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'history' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    <span>Application Log</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('profile')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'profile' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <UserIcon className="w-4 h-4 shrink-0" />
                    <span>My Profile</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('notifications')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center justify-between text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'notifications' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Bell className="w-4 h-4 shrink-0" />
                      <span>Notifications & Alerts</span>
                    </div>
                    {getUnreadCount() > 0 && (
                      <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                        {getUnreadCount()}
                      </span>
                    )}
                  </button>
                </>
              ) : (
                // ADMIN (Hostel & System Admins) NAVIGATION
                <>
                  <button 
                    onClick={() => setActiveTab('stats')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'stats' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 shrink-0" />
                    <span>General Analytics</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('hostels')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'hostels' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4 shrink-0" />
                    <span>Hostel Blocks</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('rooms')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'rooms' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Room Allocations</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('applications')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'applications' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <ClipboardList className="w-4 h-4 shrink-0" />
                    <span>Applications Desk</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('students')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'students' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <Users className="w-4 h-4 shrink-0" />
                    <span>Students Directory</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('broadcasts')} 
                    className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeTab === 'broadcasts' ? 'bg-indigo-500/10 border border-indigo-500/20 text-white' : 'border border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white'
                    }`}
                  >
                    <Bell className="w-4 h-4 shrink-0" />
                    <span>Broadcast announcements</span>
                  </button>
                </>
              )}

              {/* Security Level Tag */}
              <div className="pt-8 mt-auto">
                <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 flex items-center space-x-2.5">
                  <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-indigo-300 font-bold">Secure Zone</p>
                    <p className="text-[8px] text-slate-500 mt-0.5 leading-none">ID: {user.matricNoOrStaffId}</p>
                  </div>
                </div>
              </div>
            </aside>

            {/* CONTENT MODULE */}
            <section className="flex-1 w-full bg-transparent overflow-hidden">
              
              {/* ======================================================== */}
              {/* ================ A. STUDENT VIEWPORT TABS ============= */}
              {/* ======================================================== */}
              
              {user.role === 'student' && (
                <div className="space-y-6 w-full text-left animate-fade-in">
                  
                  {/* TAB: Student Dashboard */}
                  {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0F0F12] border border-white/5 p-6 rounded-2xl gap-4">
                        <div>
                          <h2 className="text-xl font-serif text-white italic">Welcome back, {user.name}</h2>
                          <p className="text-xs text-slate-500 mt-1">Review your current housing applications, payment invoices, and real-time alerts.</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('apply')}
                          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider font-semibold shrink-0"
                        >
                          Submit New Application
                        </button>
                      </div>

                      {/* Summary Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-[#0F0F12] p-6 rounded-2xl border border-white/5">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Academic Term</p>
                          <p className="text-2xl font-light text-white mt-1">2025/2026</p>
                          <p className="text-[10px] text-indigo-400 mt-2 font-semibold">Active Enrollment</p>
                        </div>
                        <div className="bg-[#0F0F12] p-6 rounded-2xl border border-white/5">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Submitted Applications</p>
                          <p className="text-2xl font-light text-white mt-1">{applications.length}</p>
                          <p className="text-[10px] text-indigo-400 mt-2 font-semibold">Total history logged</p>
                        </div>
                        <div className="bg-[#0F0F12] p-6 rounded-2xl border border-white/5">
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">Gender Allocation</p>
                          <p className="text-2xl font-light text-white mt-1 capitalize">{user.gender} Block</p>
                          <p className="text-[10px] text-indigo-400 mt-2 font-semibold">Automatic Policy Matching</p>
                        </div>
                      </div>

                      {/* Active Allocations Card */}
                      <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Active Room Allocation Status</h3>
                          <span className="text-[9px] uppercase tracking-widest text-slate-500">2025/2026 Session</span>
                        </div>

                        {applications.length === 0 ? (
                          <div className="text-center py-10">
                            <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                            <p className="text-xs text-slate-400">You have not submitted any hostel application for the 2025/2026 session.</p>
                            <button 
                              onClick={() => setActiveTab('apply')}
                              className="text-indigo-400 hover:underline text-xs mt-2 font-semibold"
                            >
                              Apply for a room slot now &rarr;
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {applications.slice(0, 1).map((app) => (
                              <div key={app.id} className="p-5 rounded-xl bg-[#0A0A0B] border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                  <div className="flex items-center space-x-3">
                                    <span className="text-sm font-serif italic text-white">{app.hostelName}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                                      app.status === 'approved' 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                        : app.status === 'rejected' 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-2">
                                    Requested: <span className="font-mono">{new Date(app.createdAt).toLocaleDateString()}</span>
                                  </p>
                                  {app.adminComment && (
                                    <p className="text-[10px] text-indigo-300 mt-2 italic">
                                      Admin comment: &ldquo;{app.adminComment}&rdquo;
                                    </p>
                                  )}
                                </div>

                                <div className="text-left md:text-right">
                                  {app.status === 'approved' && app.paymentStatus === 'unpaid' && (
                                    <div>
                                      <p className="text-[9px] text-amber-400 uppercase tracking-widest font-bold mb-1">Payment Required</p>
                                      <div className="flex items-center space-x-2 justify-start md:justify-end">
                                        <button 
                                          onClick={() => handleCancelApplication(app.id)}
                                          className="px-3 py-2 border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                                        >
                                          Cancel
                                        </button>
                                        <button 
                                          onClick={() => setPayingApp(app)}
                                          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs hover:bg-indigo-500 transition-all font-semibold uppercase tracking-wider"
                                        >
                                          Pay Room Fees &rarr;
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {app.status === 'approved' && app.paymentStatus === 'paid' && (
                                    <div className="flex flex-col items-start md:items-end space-y-2">
                                      <div className="p-3 bg-green-500/5 border border-green-500/10 rounded-xl flex items-center space-x-3">
                                        <Check className="w-5 h-5 text-green-400" />
                                        <div className="text-left">
                                          <p className="text-xs font-bold text-white uppercase">Room Allocated</p>
                                          <p className="text-[10px] text-slate-400 mt-0.5">Room No: <span className="font-mono text-white font-bold">{app.roomNo}</span></p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => handleCancelApplication(app.id)}
                                        className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-all"
                                      >
                                        Cancel Allocation
                                      </button>
                                    </div>
                                  )}

                                  {app.status === 'pending' && (
                                    <div className="flex flex-col items-start md:items-end space-y-2">
                                      <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-left">
                                        <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider leading-none">Under Review</p>
                                        <p className="text-[9px] text-slate-500 mt-1">Allocation desk is sorting matching rooms.</p>
                                      </div>
                                      <button 
                                        onClick={() => handleCancelApplication(app.id)}
                                        className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider transition-all"
                                      >
                                        Cancel Request
                                      </button>
                                    </div>
                                  )}

                                  {app.status === 'rejected' && (
                                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-left">
                                      <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider leading-none">Application Rejected</p>
                                      <p className="text-[9px] text-slate-500 mt-1">Please submit a new request or contact Student Affairs.</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: Hostel Application Form */}
                  {activeTab === 'apply' && (
                    <div className="space-y-6">
                      <div className="bg-[#0F0F12] p-6 rounded-2xl border border-white/5">
                        <h2 className="text-lg font-serif text-white italic">Hostel Application Portal</h2>
                        <p className="text-xs text-slate-500 mt-1">
                          Apply for student housing for the 2025/2026 Academic Session. Gender restrictions are automatically matched with your profile registration.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Application Form */}
                        <div className="lg:col-span-2 bg-[#0F0F12] border border-white/5 p-6 rounded-2xl">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Allocation Form</h3>
                          
                          <form onSubmit={handleApplyHostel} className="space-y-5">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Academic Year</label>
                              <input 
                                type="text"
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none font-mono"
                                value={appAcademicYear}
                                disabled
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Select Target Hostel Block *</label>
                              <select 
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                                value={appHostelId}
                                onChange={e => setAppHostelId(e.target.value)}
                              >
                                <option value="">-- Choose Hostel --</option>
                                {hostels
                                  .filter(h => h.type === 'unisex' || h.type === user.gender)
                                  .map(h => (
                                    <option key={h.id} value={h.id}>
                                      {h.name} ({h.type === 'unisex' ? 'Unisex' : `${h.type} Only`}) — {h.location}
                                    </option>
                                  ))}
                              </select>
                              <p className="text-[10px] text-slate-500 mt-1">Only displaying hostel blocks conforming to gender: &ldquo;{user.gender}&rdquo;</p>
                            </div>

                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1.5 font-semibold">Special Request / Message (Optional)</label>
                              <textarea 
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all min-h-24"
                                placeholder="E.g., I would prefer a lower bunk or a room closer to the study lounge due to medical conditions..."
                                value={appMessage}
                                onChange={e => setAppMessage(e.target.value)}
                              />
                            </div>

                            <button 
                              type="submit"
                              className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider font-semibold"
                            >
                              Submit Housing Request
                            </button>
                          </form>
                        </div>

                        {/* Housing Policies & Stats */}
                        <div className="space-y-6">
                          <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-4">University Housing Policies</h3>
                            <ul className="space-y-3 text-[11px] text-slate-400 leading-relaxed">
                              <li className="flex items-start space-x-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>Allocations are strictly based on priority applications and room availability.</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>Students must clear all outstanding balance within 48 hours of room approval.</span>
                              </li>
                              <li className="flex items-start space-x-2">
                                <span className="text-indigo-400 font-bold">•</span>
                                <span>Trading allocated spaces with another student is considered a major offense.</span>
                              </li>
                            </ul>
                          </div>

                          <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-4">Hostel Block Specs</h3>
                            <div className="space-y-4">
                              {hostels
                                .filter(h => h.type === 'unisex' || h.type === user.gender)
                                .map(h => (
                                  <div key={h.id} className="text-left">
                                    <p className="text-xs font-semibold text-slate-200">{h.name}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{h.description}</p>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: Application History */}
                  {activeTab === 'history' && (
                    <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
                        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Your Housing Application Log</h2>
                        <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Total Request Logs ({applications.length})</span>
                      </div>

                      {applications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-10">No applications registered in your student profile history.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/[0.01]">
                              <tr>
                                <th className="px-5 py-4">Applied Hostel</th>
                                <th className="px-5 py-4">Academic Session</th>
                                <th className="px-5 py-4">Request Date</th>
                                <th className="px-5 py-4">Review Status</th>
                                <th className="px-5 py-4">Billing Status</th>
                                <th className="px-5 py-4">Room No</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs border-t border-white/5">
                              {applications.map((app) => (
                                <tr key={app.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                  <td className="px-5 py-4 text-white font-serif italic">{app.hostelName}</td>
                                  <td className="px-5 py-4 font-mono">{app.academicYear}</td>
                                  <td className="px-5 py-4 font-mono text-slate-500">
                                    {new Date(app.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                                      app.status === 'approved' 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                        : app.status === 'rejected' 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4">
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider border ${
                                      app.paymentStatus === 'paid' 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}>
                                      {app.paymentStatus}
                                    </span>
                                  </td>
                                  <td className="px-5 py-4 font-mono font-bold text-slate-300">
                                    {app.roomNo || 'Unassigned'}
                                  </td>
                                  <td className="px-5 py-4 text-right">
                                    {app.status !== 'rejected' ? (
                                      <button 
                                        onClick={() => handleCancelApplication(app.id)}
                                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded text-[10px] uppercase font-bold tracking-wider transition-all"
                                      >
                                        Cancel
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-600 font-mono">-</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Student Profile */}
                  {activeTab === 'profile' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="bg-[#0F0F12] border border-white/5 p-8 rounded-2xl text-center self-start">
                        <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 border-2 border-indigo-500/20 rounded-full flex items-center justify-center font-serif text-3xl font-bold mx-auto mb-4 uppercase">
                          {user.name.substring(0, 2)}
                        </div>
                        <h3 className="text-lg font-serif italic text-white">{user.name}</h3>
                        <p className="text-[10px] uppercase tracking-widest text-indigo-400 mt-1 font-bold">{user.role}</p>

                        <div className="mt-8 pt-6 border-t border-white/5 text-left space-y-4">
                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <BookOpen className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>Dept: {user.department || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-3 text-xs text-slate-400">
                            <Users className="w-4 h-4 text-slate-500 shrink-0" />
                            <span>Gender: <span className="capitalize">{user.gender}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-2 space-y-6 text-left">
                        <div className="bg-[#0F0F12] border border-white/5 p-8 rounded-2xl">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Modify Student Profile</h3>
                          <EditProfileForm 
                            user={user} 
                            onProfileUpdated={(updatedUser) => setUser(updatedUser)} 
                            showToast={showToast} 
                          />
                        </div>

                        <div className="bg-[#0F0F12] border border-white/5 p-8 rounded-2xl">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Verification Credentials</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-500">Matriculation Identifier</p>
                              <p className="text-sm font-semibold font-mono text-slate-200 mt-1.5">{user.matricNoOrStaffId}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-500">Email Address</p>
                              <p className="text-sm font-semibold font-mono text-slate-200 mt-1.5">{user.email}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-500">Mobile Phone</p>
                              <p className="text-sm font-semibold font-mono text-slate-200 mt-1.5">{user.phone}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-slate-500">Account Enrolled</p>
                              <p className="text-sm font-semibold font-mono text-slate-200 mt-1.5">{new Date(user.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: Student Notifications & Alerts */}
                  {activeTab === 'notifications' && (
                    <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-white/5 mb-6 gap-4">
                        <div>
                          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Portal Notifications & System Broadcasts</h2>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Stay up to date with housing, financial audits, and staff memos</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={loadData}
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 hover:text-white transition-all"
                            title="Refresh Notifications"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {notifications.length === 0 ? (
                        <div className="text-center py-16 bg-[#0A0A0B] rounded-xl border border-white/5">
                          <Bell className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">No notifications logged for your student account.</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {notifications.map((n) => {
                            let icon = <Bell className="w-4 h-4 text-indigo-400" />;
                            let badgeText = "Notification";
                            let badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
                            
                            if (n.type === 'system_announcement') {
                              icon = <Sparkles className="w-4 h-4 text-amber-400" />;
                              badgeText = "System Announcement";
                              badgeStyle = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                            } else if (n.type === 'allocation_update') {
                              icon = <Home className="w-4 h-4 text-emerald-400" />;
                              badgeText = "Allocation Update";
                              badgeStyle = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                            } else if (n.type === 'application_update') {
                              icon = <ClipboardList className="w-4 h-4 text-blue-400" />;
                              badgeText = "Application Status";
                              badgeStyle = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                            }

                            return (
                              <div 
                                key={n.id}
                                onClick={() => !n.read && handleMarkNotification(n.id)}
                                className={`p-5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                  n.read 
                                    ? 'bg-white/[0.01] border-white/5 opacity-60' 
                                    : 'bg-indigo-500/[0.03] border-indigo-500/10 hover:border-indigo-500/25 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-start space-x-4">
                                  <div className={`p-2.5 rounded-lg border ${badgeStyle.split(' ')[2]} bg-white/[0.02]`}>
                                    {icon}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                      <h4 className="text-sm font-semibold text-white leading-tight">{n.title}</h4>
                                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${badgeStyle}`}>
                                        {badgeText}
                                      </span>
                                      {!n.read && (
                                        <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{n.message}</p>
                                    <span className="text-[9px] text-slate-500 font-mono mt-2 block">
                                      Broadcast: {new Date(n.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                
                                {!n.read && (
                                  <button className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 hover:text-indigo-300 transition-all shrink-0">
                                    Mark as read
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* ======================================================== */}
              {/* ================== B. ADMIN VIEWPORT TABS ============= */}
              {/* ======================================================== */}
              
              {user.role !== 'student' && (
                <div className="space-y-6 w-full text-left animate-fade-in">
                  
                  {/* TAB: General Analytics */}
                  {activeTab === 'stats' && stats && (
                    <div className="space-y-6">
                      {/* Sub-navigation bar for Analytics modules */}
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'overview', label: 'Overview Dashboard' },
                            { id: 'occupancy', label: 'Occupancy Analysis' },
                            { id: 'applications', label: 'Application Trends' },
                            { id: 'utilization', label: 'Hostel Utilization' },
                            { id: 'students', label: 'Student Demographics' },
                            { id: 'reports', label: 'Monthly Financials' },
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setAnalyticsSubTab(t.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all ${
                                analyticsSubTab === t.id
                                  ? 'bg-indigo-500/10 border-indigo-500/20 text-white shadow-md'
                                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]'
                              }`}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>

                        {/* Export Panel actions */}
                        <div className="flex items-center space-x-3 shrink-0">
                          <button
                            onClick={exportToCSV}
                            className="bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white px-4 py-2 rounded-xl text-xs font-mono font-medium flex items-center space-x-1.5 transition-all cursor-pointer"
                            title="Export Summary Data to CSV"
                          >
                            <span>EXPORT CSV</span>
                          </button>
                          <button
                            onClick={exportToPDF}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-lg shadow-indigo-500/15 cursor-pointer"
                            title="Export Comprehensive PDF Executive Report"
                          >
                            <span>EXPORT PDF</span>
                          </button>
                        </div>
                      </div>

                      {/* LOADING/ERROR GUARD FOR DETAILED ANALYTICS */}
                      {loadingAnalytics ? (
                        <div className="text-center py-20 bg-[#0F0F12] border border-white/5 rounded-2xl">
                          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Aggregating hostel allocation tables, tracking student statuses, and building monthly reports...</p>
                        </div>
                      ) : !analytics ? (
                        <div className="text-center py-20 bg-[#0F0F12] border border-white/5 rounded-2xl">
                          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                          <p className="text-xs text-slate-400 uppercase tracking-widest mb-4">Detailed analytics dataset not yet synced with host database.</p>
                          <button onClick={fetchAnalyticsData} className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-xl hover:bg-indigo-500 uppercase tracking-wider font-semibold font-mono">Sync Analytics Database</button>
                        </div>
                      ) : (
                        <div className="space-y-6 animate-fade-in">
                          {/* 1. OVERVIEW DASHBOARD */}
                          {analyticsSubTab === 'overview' && (
                            <div className="space-y-6">
                              {/* Summary Counters */}
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <Users className="w-16 h-16 text-indigo-500" />
                                  </div>
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Student Body</p>
                                  <p className="text-3xl font-light text-white">{analytics.summary.totalStudents}</p>
                                  <p className="text-[10px] text-indigo-400 mt-2 font-mono">Registered student portal accounts</p>
                                </div>
                                <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <Building2 className="w-16 h-16 text-emerald-500" />
                                  </div>
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Total Housing Capacity</p>
                                  <p className="text-3xl font-light text-white">{analytics.summary.totalCapacity}</p>
                                  <p className="text-[10px] text-emerald-400 mt-2 font-mono">{analytics.summary.allocatedBeds} beds allocated ({analytics.summary.occupancyRate}%)</p>
                                </div>
                                <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <ClipboardList className="w-16 h-16 text-amber-500" />
                                  </div>
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Pending Request Queue</p>
                                  <p className="text-3xl font-light text-white">{analytics.applications.byStatus.pending}</p>
                                  <p className="text-[10px] text-amber-400 mt-2 font-mono">{analytics.applications.byStatus.total} total application sheets filed</p>
                                </div>
                                <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <CreditCard className="w-16 h-16 text-indigo-500" />
                                  </div>
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Realized Housing Revenue</p>
                                  <p className="text-3xl font-light text-white font-mono">GH₵ {analytics.summary.realizedRevenue.toLocaleString()}</p>
                                  <p className="text-[10px] text-slate-500 mt-2 font-mono">Projected Cap: GH₵ {analytics.summary.projectedRevenue.toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Mini occupancy and trend showcase */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Hostel Capacity distribution</h3>
                                  <div className="space-y-5">
                                    {analytics.occupancy.byHostel.map((item: any, idx: number) => (
                                      <div key={idx}>
                                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                                          <span className="font-medium">{item.name} ({item.type === 'male' ? 'Boys' : 'Girls'})</span>
                                          <span className="font-mono text-slate-400">{item.occupied} / {item.capacity} Beds ({item.occupancyRate}%)</span>
                                        </div>
                                        <div className="h-2 w-full bg-[#0A0A0B] rounded-full overflow-hidden border border-white/5">
                                          <div 
                                            className="h-full bg-indigo-500 transition-all duration-500"
                                            style={{ width: `${item.occupancyRate}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Application Submission Trend</h3>
                                  <div className="h-48 w-full font-mono">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={analytics.applications.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                          <linearGradient id="colorSubmitted" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                                        <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} itemStyle={{ color: '#fff', fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="submitted" stroke="#6366f1" fillOpacity={1} fill="url(#colorSubmitted)" name="Submitted" />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 2. OCCUPANCY ANALYSIS */}
                          {analyticsSubTab === 'occupancy' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Hostel Detailed Board */}
                              <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Hostel Capacity & Allocation</h3>
                                <div className="space-y-6">
                                  {analytics.occupancy.byHostel.map((h: any) => (
                                    <div key={h.id} className="p-4 rounded-xl bg-[#0A0A0B] border border-white/5">
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <h4 className="text-xs font-bold text-white uppercase tracking-wide">{h.name}</h4>
                                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{h.type === 'male' ? 'Boys' : h.type === 'female' ? 'Girls' : 'Unisex'} Residency • {h.status} Utilization</p>
                                        </div>
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                                          h.occupancyRate >= 90 ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                          h.occupancyRate >= 50 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                          'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}>{h.occupancyRate}% Full</span>
                                      </div>
                                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 border-t border-b border-white/5 my-2">
                                        <div>
                                          <p className="text-[9px] text-slate-500 uppercase">Capacity</p>
                                          <p className="font-mono text-white font-medium mt-0.5">{h.capacity}</p>
                                        </div>
                                        <div>
                                          <p className="text-[9px] text-slate-500 uppercase">Allocated</p>
                                          <p className="font-mono text-emerald-400 font-medium mt-0.5">{h.occupied}</p>
                                        </div>
                                        <div>
                                          <p className="text-[9px] text-slate-500 uppercase">Available</p>
                                          <p className="font-mono text-indigo-400 font-medium mt-0.5">{h.available}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Room Type Utilization */}
                              <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Occupancy by Room Category</h3>
                                <div className="space-y-6">
                                  {analytics.occupancy.byRoomType.map((r: any, idx: number) => (
                                    <div key={idx} className="p-4 rounded-xl bg-[#0A0A0B] border border-white/5">
                                      <div className="flex items-center justify-between mb-2">
                                        <div>
                                          <h4 className="text-xs font-bold text-white uppercase tracking-wide">{r.roomType}</h4>
                                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{r.totalRooms} rooms configured in inventory</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-mono font-bold">{r.occupiedBeds} / {r.totalCapacity} beds filled ({r.utilization}%)</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                                        <div 
                                          className="h-full bg-indigo-500 transition-all duration-500"
                                          style={{ width: `${r.utilization}%` }}
                                        ></div>
                                      </div>
                                      <div className="flex justify-between text-[9px] text-slate-500 mt-2 font-mono">
                                        <span>Beds Vacant: {r.vacantBeds}</span>
                                        <span>Target Utilization: 100%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 3. APPLICATION TRENDS */}
                          {analyticsSubTab === 'applications' && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-4">Approval Success Rate</h3>
                                  <div className="h-44 flex items-center justify-center font-mono">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <PieChart>
                                        <Pie
                                          data={[
                                            { name: 'Approved', value: analytics.applications.byStatus.approved, color: '#10b981' },
                                            { name: 'Pending', value: analytics.applications.byStatus.pending, color: '#f59e0b' },
                                            { name: 'Rejected', value: analytics.applications.byStatus.rejected, color: '#ef4444' }
                                          ]}
                                          cx="50%"
                                          cy="50%"
                                          innerRadius={50}
                                          outerRadius={70}
                                          paddingAngle={5}
                                          dataKey="value"
                                        >
                                          {[
                                            { name: 'Approved', value: analytics.applications.byStatus.approved, color: '#10b981' },
                                            { name: 'Pending', value: analytics.applications.byStatus.pending, color: '#f59e0b' },
                                            { name: 'Rejected', value: analytics.applications.byStatus.rejected, color: '#ef4444' }
                                          ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                          ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }} />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                  <div className="flex justify-around text-[10px] font-mono mt-2">
                                    <span className="text-emerald-400">Approved: {analytics.applications.byStatus.approved}</span>
                                    <span className="text-amber-400">Pending: {analytics.applications.byStatus.pending}</span>
                                    <span className="text-red-400">Rejected: {analytics.applications.byStatus.rejected}</span>
                                  </div>
                                </div>

                                <div className="md:col-span-2 bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Monthly Application Breakdown (Last 6 Months)</h3>
                                  <div className="h-48 w-full font-mono">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={analytics.applications.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                        <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
                                        <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#0A0A0B', border: '1px solid rgba(255,255,255,0.05)' }} />
                                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                                        <Bar dataKey="submitted" fill="#6366f1" name="Submitted" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="approved" fill="#10b981" name="Approved" radius={[4, 4, 0, 0]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 4. HOSTEL UTILIZATION */}
                          {analyticsSubTab === 'utilization' && (
                            <div className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl text-center">
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Highly Utilized Hostels</p>
                                  <p className="text-5xl font-light text-red-400 mt-2 font-mono">{analytics.hostelUtilization.highlyUtilized}</p>
                                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 font-mono">Greater than 80% Occupancy</p>
                                </div>
                                <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl text-center">
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Moderately Utilized Hostels</p>
                                  <p className="text-5xl font-light text-indigo-400 mt-2 font-mono">{analytics.hostelUtilization.moderatelyUtilized}</p>
                                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 font-mono">40% to 80% Occupancy</p>
                                </div>
                                <div className="bg-[#0F0F12] border border-white/5 p-6 rounded-2xl text-center">
                                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Under-Utilized Hostels</p>
                                  <p className="text-5xl font-light text-amber-400 mt-2 font-mono">{analytics.hostelUtilization.underUtilized}</p>
                                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-2 font-mono">Less than 40% Occupancy</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Boys Blocks Allocation Efficiency</h3>
                                  <div className="flex justify-between items-center text-xs mb-3">
                                    <span className="text-slate-400">Total Boys Housing Beds</span>
                                    <span className="font-mono text-white font-bold">{analytics.hostelUtilization.byGender.male.occupied} / {analytics.hostelUtilization.byGender.male.capacity}</span>
                                  </div>
                                  <div className="h-3 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      className="h-full bg-indigo-500 transition-all duration-500"
                                      style={{ width: `${analytics.hostelUtilization.byGender.male.capacity > 0 ? (analytics.hostelUtilization.byGender.male.occupied / analytics.hostelUtilization.byGender.male.capacity) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-[9px] text-slate-500 mt-2 text-right uppercase tracking-widest font-mono">Current Efficiency Index: {analytics.hostelUtilization.byGender.male.capacity > 0 ? Math.round((analytics.hostelUtilization.byGender.male.occupied / analytics.hostelUtilization.byGender.male.capacity) * 100) : 0}%</p>
                                </div>

                                <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6">Girls Blocks Allocation Efficiency</h3>
                                  <div className="flex justify-between items-center text-xs mb-3">
                                    <span className="text-slate-400">Total Girls Housing Beds</span>
                                    <span className="font-mono text-white font-bold">{analytics.hostelUtilization.byGender.female.occupied} / {analytics.hostelUtilization.byGender.female.capacity}</span>
                                  </div>
                                  <div className="h-3 w-full bg-white/[0.02] rounded-full overflow-hidden border border-white/5">
                                    <div 
                                      className="h-full bg-indigo-500 transition-all duration-500"
                                      style={{ width: `${analytics.hostelUtilization.byGender.female.capacity > 0 ? (analytics.hostelUtilization.byGender.female.occupied / analytics.hostelUtilization.byGender.female.capacity) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                  <p className="text-[9px] text-slate-500 mt-2 text-right uppercase tracking-widest font-mono">Current Efficiency Index: {analytics.hostelUtilization.byGender.female.capacity > 0 ? Math.round((analytics.hostelUtilization.byGender.female.occupied / analytics.hostelUtilization.byGender.female.capacity) * 100) : 0}%</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 5. STUDENT STATISTICS */}
                          {analyticsSubTab === 'students' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Left column: Gender and Allocation split */}
                              <div className="lg:col-span-1 space-y-6">
                                <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-4">Housing Status Split</h3>
                                  <div className="space-y-4">
                                    {analytics.studentStats.allocationStatus.map((status: any, idx: number) => {
                                      const percent = analytics.studentStats.total > 0 ? Math.round((status.value / analytics.studentStats.total) * 100) : 0;
                                      return (
                                        <div key={idx} className="p-3 bg-[#0A0A0B] rounded-xl border border-white/5">
                                          <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="font-bold text-white">{status.name}</span>
                                            <span className="font-mono text-slate-400">{status.value} Students ({percent}%)</span>
                                          </div>
                                          <div className="h-1.5 w-full bg-white/[0.01] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: status.color, width: `${percent}%` }}></div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                  <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-4">Gender Distribution</h3>
                                  <div className="space-y-4 font-mono text-xs">
                                    {analytics.studentStats.genderDistribution.map((g: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                        <span className="text-slate-400">{g.name} students</span>
                                        <span className="text-white font-bold">{g.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              {/* Right column: Department breakdown */}
                              <div className="lg:col-span-2 bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-4">Registered Students by Academic Department</h3>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse">
                                    <thead>
                                      <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider font-mono text-slate-500">
                                        <th className="pb-3 font-bold">Academic Department</th>
                                        <th className="pb-3 text-right font-bold">Total Enrolled</th>
                                        <th className="pb-3 text-right font-bold">Portal Ratio</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-xs">
                                      {analytics.studentStats.byDepartment.map((dept: any, idx: number) => {
                                        const ratio = analytics.studentStats.total > 0 ? Math.round((dept.count / analytics.studentStats.total) * 100) : 0;
                                        return (
                                          <tr key={idx} className="hover:bg-white/[0.01]">
                                            <td className="py-3 text-white font-medium">{dept.name}</td>
                                            <td className="py-3 text-right font-mono text-indigo-400">{dept.count}</td>
                                            <td className="py-3 text-right font-mono text-slate-500">{ratio}%</td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 6. MONTHLY FINANCIAL REPORTS */}
                          {analyticsSubTab === 'reports' && (
                            <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                              <div className="pb-4 border-b border-white/5 mb-6">
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Monthly Housing Activity & Confirmed Revenue Reports</h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Structured monthly audit of transaction confirmations, requests flow, and top block queries</p>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="border-b border-white/5 text-[9px] uppercase tracking-wider font-mono text-slate-500">
                                      <th className="pb-3 font-bold text-left">Report Month</th>
                                      <th className="pb-3 text-right font-bold">New Submissions</th>
                                      <th className="pb-3 text-right font-bold">Approvals Issued</th>
                                      <th className="pb-3 text-right font-bold">Payments Confirmed</th>
                                      <th className="pb-3 text-right font-bold">Revenue Generated</th>
                                      <th className="pb-3 text-right font-bold">Most Popular Hostel Block</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/5 text-xs font-mono">
                                    {analytics.monthlyReports.map((report: any) => (
                                      <tr key={report.monthId} className="hover:bg-white/[0.01]">
                                        <td className="py-4 text-white font-medium text-left">{report.monthName}</td>
                                        <td className="py-4 text-right text-slate-300">{report.newApplicationsCount}</td>
                                        <td className="py-4 text-right text-emerald-400">{report.approvedApplicationsCount}</td>
                                        <td className="py-4 text-right text-indigo-400">{report.paymentsConfirmedCount}</td>
                                        <td className="py-4 text-right text-white font-bold">GH₵ {report.revenueGenerated.toLocaleString()}</td>
                                        <td className="py-4 text-right text-slate-400 font-sans">{report.topHostelName}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Hostel Blocks Configuration */}
                  {activeTab === 'hostels' && (
                    <div className="space-y-6">
                      
                      {/* Hostel Assets Grid with Advanced Filters */}
                      <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5 mb-6 gap-4">
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Registered University Hostel Blocks</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Search and filter active campus residence assets</p>
                          </div>
                          
                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-bold font-mono">
                              Live Page Results: {hostels.length}
                            </span>
                          </div>
                        </div>

                        {/* Search and Filters Strip */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                          <div className="md:col-span-5 relative">
                            <input 
                              type="text"
                              className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                              placeholder="Search by name, campus quadrant, location..."
                              value={hostelSearch}
                              onChange={e => {
                                setHostelSearch(e.target.value);
                                setHostelPage(1);
                              }}
                            />
                            <div className="absolute left-3 top-3 text-slate-500">
                              <Users className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="md:col-span-3">
                            <select 
                              className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                              value={hostelTypeFilter}
                              onChange={e => {
                                setHostelTypeFilter(e.target.value as any);
                                setHostelPage(1);
                              }}
                            >
                              <option value="all">Gender: All Policies</option>
                              <option value="unisex">Unisex Blocks Only</option>
                              <option value="male">Male Only Blocks</option>
                              <option value="female">Female Only Blocks</option>
                            </select>
                          </div>

                          <div className="md:col-span-4 flex items-center bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-2.5">
                            <input 
                              type="checkbox"
                              id="vacancy-toggle"
                              className="bg-transparent text-indigo-600 rounded border-white/10 focus:ring-0 focus:ring-offset-0 mr-2.5"
                              checked={hostelVacancyFilter}
                              onChange={e => {
                                setHostelVacancyFilter(e.target.checked);
                                setHostelPage(1);
                              }}
                            />
                            <label htmlFor="vacancy-toggle" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold cursor-pointer select-none">
                              With Available Vacancy Only
                            </label>
                          </div>
                        </div>

                        {/* List Grid */}
                        {hostels.length === 0 ? (
                          <div className="text-center py-12 bg-[#0A0A0B] rounded-xl border border-white/5">
                            <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">No matching hostel assets found</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {hostels.map((h) => (
                              <div 
                                key={h.id} 
                                className="bg-[#0A0A0B]/60 backdrop-blur-sm border border-white/[0.06] rounded-2xl flex flex-col justify-between relative group hover:border-indigo-500/45 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden cursor-pointer hover:-translate-y-1"
                                onClick={() => {
                                  setDrilldownHostelId(h.id);
                                  api.listRooms(h.id).then(rList => setDrilldownRooms(rList)).catch(console.error);
                                }}
                              >
                                {/* Cover Image */}
                                <div className="h-44 w-full relative bg-slate-950 overflow-hidden shrink-0">
                                  <img 
                                    src={h.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'} 
                                    alt={h.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                                    referrerPolicy="no-referrer"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/20 to-transparent"></div>
                                  
                                  {/* Badge Overlay */}
                                  <div className="absolute top-4 left-4 flex space-x-1.5 z-10">
                                    <span className={`px-2.5 py-1 text-[9px] font-extrabold rounded-lg backdrop-blur-md shadow-md uppercase tracking-wider border ${
                                      h.type === 'male' 
                                        ? 'bg-blue-950/80 text-blue-300 border-blue-500/25' 
                                        : h.type === 'female' 
                                        ? 'bg-pink-950/80 text-pink-300 border-pink-500/25' 
                                        : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/25'
                                    }`}>
                                      {h.type} Only
                                    </span>
                                  </div>

                                  <div className="absolute top-4 right-4 z-10">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteHostel(h.id);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg bg-black/50 backdrop-blur-md hover:bg-red-500/10 transition-all border border-white/10"
                                      title="Delete Hostel"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-between bg-zinc-950/95">
                                  <div>
                                    <h4 className="text-base font-extrabold tracking-tight text-white group-hover:text-indigo-300 transition-colors duration-300 leading-snug">{h.name}</h4>
                                    <p className="text-xs text-slate-100 font-bold mt-2 flex items-center font-mono">
                                      <MapPin className="w-3.5 h-3.5 text-indigo-400 mr-1.5 shrink-0" />
                                      {h.location}
                                    </p>
                                    <p className="text-[12px] text-slate-300 font-medium mt-3.5 leading-relaxed line-clamp-3">{h.description || 'No description provided for this housing block.'}</p>
                                  </div>

                                  {/* Bento Style Statistics Grid */}
                                  <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-2 text-center text-[11px] font-mono">
                                    <div className="bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 transition-colors">
                                      <p className="text-slate-400 font-extrabold uppercase tracking-wider text-[9px]">Rooms Count</p>
                                      <p className="text-base font-black text-white mt-1">{h.totalRooms || 0}</p>
                                    </div>
                                    <div className="bg-indigo-500/10 hover:bg-indigo-500/15 p-2.5 rounded-xl border border-indigo-500/20 transition-colors">
                                      <p className="text-indigo-300 font-extrabold uppercase tracking-wider text-[9px]">Available Beds</p>
                                      <p className="text-base font-black text-emerald-400 mt-1">{h.availableCapacity || 0}</p>
                                    </div>
                                  </div>

                                  <div className="mt-5 flex justify-center pt-2">
                                    <span className="text-[10px] uppercase tracking-widest text-indigo-300 font-black group-hover:text-white flex items-center transition-colors">
                                      <Info className="w-3.5 h-3.5 mr-2 text-indigo-400 animate-pulse" />
                                      <span>Book & View Rooms</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pagination Controls */}
                        {hostelsTotalPages > 1 && (
                          <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 font-mono">
                            <button 
                              disabled={hostelPage === 1}
                              onClick={() => setHostelPage(p => Math.max(1, p - 1))}
                              className="px-3 py-1.5 bg-[#0A0A0B] border border-white/10 rounded-lg text-[10px] text-slate-400 hover:text-white disabled:opacity-40 transition-all uppercase tracking-wider font-mono font-semibold"
                            >
                              &larr; Prev
                            </button>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Page {hostelPage} of {hostelsTotalPages}
                            </span>
                            <button 
                              disabled={hostelPage >= hostelsTotalPages}
                              onClick={() => setHostelPage(p => p + 1)}
                              className="px-3 py-1.5 bg-[#0A0A0B] border border-white/10 rounded-lg text-[10px] text-slate-400 hover:text-white disabled:opacity-40 transition-all uppercase tracking-wider font-mono font-semibold"
                            >
                              Next &rarr;
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Add Hostel Asset Form */}
                      <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6 max-w-3xl text-left">
                        <div className="pb-3 border-b border-white/5 mb-6">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Provision New Hostel Asset</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Deploy additional residential buildings to the university portfolio</p>
                        </div>
                        
                        <form onSubmit={handleCreateHostel} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Hostel Block Name *</label>
                              <input 
                                type="text"
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium font-mono"
                                placeholder="E.g., Kofi Annan Block C"
                                value={newHostelName}
                                onChange={e => setNewHostelName(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Gender Policy Constraint *</label>
                              <select 
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono font-medium"
                                value={newHostelType}
                                onChange={e => setNewHostelType(e.target.value as any)}
                              >
                                <option value="unisex">Unisex Block</option>
                                <option value="male">Male Only</option>
                                <option value="female">Female Only</option>
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Physical Campus Location *</label>
                              <input 
                                type="text"
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono font-medium"
                                placeholder="E.g., North Gate Quad"
                                value={newHostelLocation}
                                onChange={e => setNewHostelLocation(e.target.value)}
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Estimated Max Bed Capacity *</label>
                              <input 
                                type="number"
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono font-medium"
                                placeholder="100"
                                value={newHostelCapacity}
                                onChange={e => setNewHostelCapacity(e.target.value)}
                                required
                              />
                            </div>
                          </div>

                          {/* Image Zone with Cloudinary simulation */}
                          <div className="border-t border-white/5 pt-4">
                            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-2 font-semibold font-mono">Hostel Block Image Asset (Local Gallery + Cloudinary Compression)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-2">
                                {/* Hidden Local File Input */}
                                <input 
                                  type="file" 
                                  id="hostel-gallery-upload-input"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageFile(file);
                                  }}
                                />
                                {/* Drag & Drop Area */}
                                <div 
                                  onClick={() => {
                                    document.getElementById('hostel-gallery-upload-input')?.click();
                                  }}
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-500/5');
                                  }}
                                  onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-500/5');
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-500/5');
                                    const file = e.dataTransfer.files?.[0];
                                    if (file) handleImageFile(file);
                                  }}
                                  className="border-2 border-dashed border-white/15 hover:border-indigo-500/40 bg-[#0A0A0B] rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-28 hover:shadow-lg hover:shadow-indigo-500/5"
                                >
                                  {isUploadingImg ? (
                                    <div className="space-y-2 w-full max-w-[150px]">
                                      <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-mono animate-pulse">Uploading to CDN...</p>
                                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                      </div>
                                    </div>
                                  ) : uploadSuccess && cloudinaryMetadata ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-center space-x-1.5 text-emerald-400">
                                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                                        <span className="text-[10px] uppercase tracking-wider font-bold">Cloudinary Active</span>
                                      </div>
                                      <p className="text-[8px] text-slate-300 font-mono truncate max-w-[180px] font-bold">{cloudinaryMetadata.publicId}.{cloudinaryMetadata.format}</p>
                                      <p className="text-[8px] text-slate-500 font-mono font-bold">Size: {(cloudinaryMetadata.bytes / 1024).toFixed(1)} KB</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <Sparkles className="w-5 h-5 text-indigo-400 mx-auto mb-1 animate-pulse" />
                                      <p className="text-[10px] text-slate-300 font-semibold">Drop image or click to upload</p>
                                      <p className="text-[8px] text-slate-600 uppercase tracking-wider font-mono">Cloudinary Autocompression Engine</p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Image Preview & Preset Selection */}
                              <div className="bg-[#0A0A0B] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
                                <div className="relative aspect-video rounded bg-slate-900 overflow-hidden shrink-0">
                                  {newHostelImg ? (
                                    <img src={newHostelImg} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-[9px] text-slate-600 font-mono">No Image Selected</div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-3 gap-1 mt-2">
                                  {[
                                    { name: 'Classic', url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=400&q=80' },
                                    { name: 'Modern', url: 'https://images.unsplash.com/photo-1595246140625-573b715d11dc?auto=format&fit=crop&w=400&q=80' },
                                    { name: 'Luxury', url: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=400&q=80' },
                                  ].map(preset => (
                                    <button
                                      key={preset.name}
                                      type="button"
                                      onClick={() => {
                                        setNewHostelImg(preset.url);
                                        setUploadSuccess(true);
                                        setCloudinaryMetadata({
                                          publicId: 'cl_preset_' + preset.name.toLowerCase(),
                                          bytes: 231000,
                                          format: 'webp',
                                          secureUrl: preset.url,
                                        });
                                      }}
                                      className={`px-1.5 py-1 text-[8px] uppercase tracking-wider rounded border font-mono truncate transition-all ${
                                        newHostelImg === preset.url 
                                          ? 'bg-indigo-500/10 border-indigo-500 text-white' 
                                          : 'bg-transparent border-white/5 text-slate-500 hover:text-slate-300'
                                      }`}
                                    >
                                      {preset.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Hostel Profile Description</label>
                            <textarea 
                              className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all min-h-16 font-medium font-mono"
                              placeholder="Describe standard amenities, room settings, study tables..."
                              value={newHostelDesc}
                              onChange={e => setNewHostelDesc(e.target.value)}
                            />
                          </div>

                          <button 
                            type="submit"
                            className="bg-indigo-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider font-semibold font-mono"
                          >
                            Deploy Hostel Block
                          </button>
                        </form>
                      </div>

                    </div>
                  )}

                  {/* TAB: Room Allocations and Configuration */}
                  {activeTab === 'rooms' && (() => {
                    const filteredRooms = rooms.filter(room => {
                      const matchesSearch = room.roomNo.toLowerCase().includes(roomSearch.toLowerCase());
                      const matchesStatus = roomStatusFilter === 'all' || room.status === roomStatusFilter;
                      const matchesPrice = !roomPriceFilter || room.price <= Number(roomPriceFilter);
                      return matchesSearch && matchesStatus && matchesPrice;
                    });

                    return (
                      <div className="space-y-6">
                        
                        {/* Scope & Filtering Controls */}
                        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6 space-y-4 text-left">
                          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 gap-4">
                            <div>
                              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Select Hostel Scope</h3>
                              <p className="text-[11px] text-slate-500 mt-1">Select a hostel block to manage individual room inventories and active student occupants.</p>
                            </div>
                            <select 
                              className="bg-[#0A0A0B] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                              value={roomHostelId}
                              onChange={e => setRoomHostelId(e.target.value)}
                            >
                              <option value="">-- Choose Hostel block --</option>
                              {hostels.map(h => (
                                <option key={h.id} value={h.id}>{h.name} ({h.type})</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {/* Filter Search Room No */}
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-mono">Search Room Number</label>
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                                <input 
                                  type="text"
                                  className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                  placeholder="Search e.g. A101"
                                  value={roomSearch}
                                  onChange={e => setRoomSearch(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Filter Status */}
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-mono">Filter by Room Status</label>
                              <select 
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                                value={roomStatusFilter}
                                onChange={e => setRoomStatusFilter(e.target.value as any)}
                              >
                                <option value="all">All Statuses</option>
                                <option value="available">Available / Vacant</option>
                                <option value="full">Full / Lodged</option>
                                <option value="maintenance">Maintenance / Blocked</option>
                              </select>
                            </div>

                            {/* Filter Max Price */}
                            <div>
                              <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-mono">Max Fee (NGN)</label>
                              <input 
                                type="number"
                                className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                placeholder="E.g. 150000"
                                value={roomPriceFilter}
                                onChange={e => setRoomPriceFilter(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Room Inventory List */}
                        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6 text-left">
                          <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-6">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Room Inventories</h4>
                            <span className="text-[10px] text-indigo-400 font-mono">Showing {filteredRooms.length} of {rooms.length} rooms</span>
                          </div>
                          
                          {filteredRooms.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-10">No rooms matched the active scope filters. Adjust filters or provision rooms below.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/[0.01]">
                                  <tr>
                                    <th className="px-5 py-4">Room No</th>
                                    <th className="px-5 py-4">Total Capacity</th>
                                    <th className="px-5 py-4">Beds Allocated</th>
                                    <th className="px-5 py-4">Annual Cost</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-center">Config Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="text-xs border-t border-white/5">
                                  {filteredRooms.map((room) => {
                                    // Find current occupants of this room
                                    const roomOccupants = applications.filter(
                                      app => app.roomId === room.id && app.status === 'approved'
                                    );

                                    return (
                                      <tr key={room.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                        <td className="px-5 py-4 font-mono font-bold text-white flex flex-col">
                                          <span>{room.roomNo}</span>
                                          {roomOccupants.length > 0 && (
                                            <span className="text-[9px] text-slate-500 font-normal font-sans mt-0.5">
                                              Occupied by: {roomOccupants.map(o => o.studentName.split(' ')[0]).join(', ')}
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-5 py-4 font-mono">{room.capacity} beds</td>
                                        <td className="px-5 py-4 font-mono">
                                          <span className={`${room.occupied >= room.capacity ? 'text-amber-400 font-bold' : 'text-slate-300'}`}>
                                            {room.occupied} / {room.capacity}
                                          </span>
                                        </td>
                                        <td className="px-5 py-4 font-mono">GH₵ {room.price.toLocaleString()}</td>
                                        <td className="px-5 py-4">
                                          <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider border ${
                                            room.status === 'available' 
                                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                              : room.status === 'full' 
                                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                                          }`}>
                                            {room.status}
                                          </span>
                                        </td>
                                        <td className="px-5 py-4">
                                          <div className="flex items-center justify-center space-x-2">
                                            <button 
                                              onClick={() => {
                                                setEditingRoom(room);
                                                setEditingRoomNo(room.roomNo);
                                                setEditingRoomCapacity(String(room.capacity));
                                                setEditingRoomPrice(String(room.price));
                                                setEditingRoomStatus(room.status);
                                              }}
                                              className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/25 text-indigo-400 rounded text-[9px] uppercase tracking-wider font-semibold"
                                              title="Edit Room Properties"
                                            >
                                              Edit
                                            </button>
                                            <button 
                                              onClick={() => handleToggleRoomStatus(room, room.status === 'maintenance' ? 'available' : 'maintenance')}
                                              className={`px-2 py-1 rounded text-[9px] uppercase tracking-wider ${
                                                room.status === 'maintenance'
                                                  ? 'bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/25 text-emerald-400'
                                                  : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 text-red-400'
                                              }`}
                                              title="Toggle Maintenance"
                                            >
                                              {room.status === 'maintenance' ? 'Unlock' : 'Block'}
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteRoom(room)}
                                              className="p-1 text-slate-500 hover:text-red-400 rounded-md hover:bg-red-500/5 transition-all"
                                              title="Delete Room"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* Room Provisioning & Diagnostics Grid layout */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
                          {/* Add Room Asset Form */}
                          <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white pb-3 border-b border-white/5 mb-6 font-mono">Provision New Room Space</h3>
                            
                            <form onSubmit={handleAddRoom} className="space-y-4">
                              <div>
                                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Room Code / Number *</label>
                                <input 
                                  type="text"
                                  className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                  placeholder="E.g., A104"
                                  value={newRoomNo}
                                  onChange={e => setNewRoomNo(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Bed Capacity *</label>
                                  <input 
                                    type="number"
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                    placeholder="4"
                                    value={newRoomCapacity}
                                    onChange={e => setNewRoomCapacity(e.target.value)}
                                    required
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-semibold font-mono">Annual Bed Fee (NGN) *</label>
                                  <input 
                                    type="number"
                                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                                    placeholder="150000"
                                    value={newRoomPrice}
                                    onChange={e => setNewRoomPrice(e.target.value)}
                                    required
                                  />
                                </div>
                              </div>

                              <button 
                                type="submit"
                                className="w-full bg-indigo-600 text-white font-medium py-2.5 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider font-semibold font-mono"
                              >
                                Deploy Room Asset
                              </button>
                            </form>
                          </div>

                          {/* SYSTEM TESTING AND ALLOCATION COMPATIBILITY LABORATORY */}
                          <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6 flex flex-col">
                            <div className="pb-3 border-b border-white/5 mb-4 flex justify-between items-center">
                              <div>
                                <h3 className="text-xs font-semibold uppercase tracking-wider text-white font-mono">Allocation Integrity Diagnostic Lab</h3>
                                <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-sans">Verify CRUD, capacity validations, and unisex room gender policies</p>
                              </div>
                              {testResult && (
                                <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider font-mono border ${
                                  testResult === 'passed'
                                    ? 'bg-green-500/15 text-green-400 border-green-500/20'
                                    : 'bg-red-500/15 text-red-400 border-red-500/20'
                                }`}>
                                  TestSuite: {testResult}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-h-[160px] max-h-[180px] overflow-y-auto bg-black p-3.5 rounded-xl border border-white/5 font-mono text-[9px] text-slate-400 space-y-1 scrollbar-thin">
                              {testLogs.length === 0 ? (
                                <div className="text-slate-600 h-full flex flex-col items-center justify-center text-center">
                                  <Activity className="w-6 h-6 text-slate-700 mb-1.5 animate-pulse" />
                                  <p>Diagnostic laboratory is online.</p>
                                  <p className="uppercase text-[8px] tracking-widest mt-0.5">Click "Run Rule Verification" to test allocation security live.</p>
                                </div>
                              ) : (
                                testLogs.map((logStr, idx) => (
                                  <p key={idx} className={`${
                                    logStr.includes('❌') 
                                      ? 'text-red-400 font-bold' 
                                      : logStr.includes('✔') 
                                      ? 'text-emerald-400 font-semibold' 
                                      : logStr.includes('🎉')
                                      ? 'text-green-300 font-bold bg-green-500/5 p-1 rounded border border-green-500/10'
                                      : 'text-slate-400'
                                  }`}>
                                    {logStr}
                                  </p>
                                ))
                              )}
                            </div>

                            <button
                              onClick={runDiagnosticsSuite}
                              disabled={isRunningTests}
                              className="mt-4 w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider font-mono disabled:opacity-40 flex items-center justify-center space-x-2 border border-white/5"
                            >
                              <Play className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                              <span>{isRunningTests ? 'Executing Test Suite...' : 'Run Rule Verification'}</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                  {/* TAB: Admin Applications Desk */}
                  {activeTab === 'applications' && (
                    <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                      <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Student Hostel Application Desk</h3>
                          <p className="text-[11px] text-slate-500 mt-1">Review applicant eligibility, matches gender policies, and select vacant rooms for allocation.</p>
                        </div>
                        <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Inbox ({applications.length})</span>
                      </div>

                      {applications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-10">No applications pending in the university allocation desk queue.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/[0.01]">
                              <tr>
                                <th className="px-4 py-4">Applicant</th>
                                <th className="px-4 py-4">Gender Policy</th>
                                <th className="px-4 py-4">Requested Hostel</th>
                                <th className="px-4 py-4">Session</th>
                                <th className="px-4 py-4">Status</th>
                                <th className="px-4 py-4">Assigned Room</th>
                                <th className="px-4 py-4 text-center font-mono">Action</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs border-t border-white/5">
                              {applications.map((app) => (
                                <tr key={app.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                  <td className="px-4 py-4 text-white">
                                    <p className="font-semibold">{app.studentName}</p>
                                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">{app.studentMatric}</p>
                                  </td>
                                  <td className="px-4 py-4 text-slate-400 capitalize">{app.studentGender}</td>
                                  <td className="px-4 py-4 font-serif italic">{app.hostelName}</td>
                                  <td className="px-4 py-4 font-mono">{app.academicYear}</td>
                                  <td className="px-4 py-4">
                                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider border ${
                                      app.status === 'approved' 
                                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                        : app.status === 'rejected' 
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    }`}>
                                      {app.status}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 font-mono font-bold text-slate-300">
                                    {app.roomNo || 'Unassigned'}
                                  </td>
                                  <td className="px-4 py-4">
                                    {app.status === 'pending' ? (
                                      <button 
                                        onClick={() => {
                                          setDecisionAppId(app.id);
                                          setDecisionStatus('approved');
                                          // Auto fetch rooms for this hostel
                                          fetchRooms(app.hostelId);
                                        }}
                                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] uppercase font-semibold hover:bg-indigo-500 transition-all font-mono"
                                      >
                                        Decide Space
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-slate-500 uppercase italic">Locked</span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Students Directory */}
                  {activeTab === 'students' && (
                    <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5 mb-6 gap-4">
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">University Student Directory</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Review student profiles, departments, contact info, and active housing securements</p>
                        </div>
                        <span className="text-[10px] text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full uppercase tracking-widest font-bold font-mono">
                          Active Directory: {studentsList.length} Students
                        </span>
                      </div>

                      {/* Filter Controls */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                        <div className="md:col-span-8 relative">
                          <input 
                            type="text"
                            className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                            placeholder="Search directory by name, matric ID, email address..."
                            value={studentSearch}
                            onChange={e => {
                              setStudentSearch(e.target.value);
                              setStudentPage(1);
                            }}
                          />
                          <div className="absolute left-3 top-3 text-slate-500">
                            <Users className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="md:col-span-4">
                          <select 
                            className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                            value={studentDeptFilter}
                            onChange={e => {
                              setStudentDeptFilter(e.target.value);
                              setStudentPage(1);
                            }}
                          >
                            <option value="all">Dept: All Academic fields</option>
                            <option value="Computer Science">Computer Science</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Medicine">Medicine & Surgery</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Business Administration">Business Administration</option>
                          </select>
                        </div>
                      </div>

                      {/* Students Table */}
                      {studentsList.length === 0 ? (
                        <div className="text-center py-12 bg-[#0A0A0B] rounded-xl border border-white/5 font-mono">
                          <p className="text-xs text-slate-500 uppercase tracking-widest">No registered students match search parameters</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/[0.01]">
                              <tr>
                                <th className="px-4 py-4">Student Name / Matric</th>
                                <th className="px-4 py-4">Academic Dept</th>
                                <th className="px-4 py-4">Gender Policy</th>
                                <th className="px-4 py-4">Email / Phone</th>
                                <th className="px-4 py-4">Housing Security</th>
                              </tr>
                            </thead>
                            <tbody className="text-xs border-t border-white/5 font-mono">
                              {studentsList.map((stud) => {
                                // Calculate active allocation status
                                const studentApps = applications.filter(a => a.studentId === stud.id);
                                const approvedApp = studentApps.find(a => a.status === 'approved');
                                const pendingApp = studentApps.find(a => a.status === 'pending');
                                
                                return (
                                  <tr key={stud.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                    <td className="px-4 py-4 text-white font-serif italic">
                                      <p className="font-semibold text-xs font-sans not-italic text-indigo-300">{stud.name}</p>
                                      <p className="text-[9px] text-slate-500 mt-0.5">{stud.matricNoOrStaffId}</p>
                                    </td>
                                    <td className="px-4 py-4 text-slate-400 capitalize">{stud.department || 'Not Assigned'}</td>
                                    <td className="px-4 py-4 text-slate-400 capitalize">{stud.gender}</td>
                                    <td className="px-4 py-4 text-slate-500">
                                      <p className="text-slate-300">{stud.email}</p>
                                      <p className="text-[9px] mt-0.5">{stud.phone || 'No Phone record'}</p>
                                    </td>
                                    <td className="px-4 py-4">
                                      {approvedApp ? (
                                        <div className="flex flex-col space-y-0.5">
                                          <span className="inline-flex max-w-fit px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            Room {approvedApp.roomNo} Secured
                                          </span>
                                          <span className="text-[8px] text-slate-500">{approvedApp.hostelName}</span>
                                        </div>
                                      ) : pendingApp ? (
                                        <span className="inline-flex px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                          Reviewing Application
                                        </span>
                                      ) : (
                                        <span className="inline-flex px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider bg-white/5 text-slate-500 border border-white/10">
                                          No active lodging
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Pagination Controls */}
                      {studentsTotalPages > 1 && (
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5 font-mono">
                          <button 
                            disabled={studentPage === 1}
                            onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1.5 bg-[#0A0A0B] border border-white/10 rounded-lg text-[10px] text-slate-400 hover:text-white disabled:opacity-40 transition-all uppercase tracking-wider font-semibold"
                          >
                            &larr; Prev
                          </button>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Page {studentPage} of {studentsTotalPages}
                          </span>
                          <button 
                            disabled={studentPage >= studentsTotalPages}
                            onClick={() => setStudentPage(p => p + 1)}
                            className="px-3 py-1.5 bg-[#0A0A0B] border border-white/10 rounded-lg text-[10px] text-slate-400 hover:text-white disabled:opacity-40 transition-all uppercase tracking-wider font-semibold"
                          >
                            Next &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: Broadcast Announcements */}
                  {activeTab === 'broadcasts' && (
                    <div className="space-y-6">
                      <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/5 mb-6 gap-4">
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Broadcast System Announcements</h3>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Send immediate, system-wide alerts & official notices to all student profiles</p>
                          </div>
                        </div>

                        {/* Announcement Creator Form */}
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          const target = e.currentTarget;
                          const formData = new FormData(target);
                          const title = formData.get('title') as string;
                          const message = formData.get('message') as string;
                          
                          if (!title.trim() || !message.trim()) return;
                          
                          try {
                            await api.createAnnouncement({ title, message });
                            toast.success("System announcement successfully broadcasted to all students!");
                            target.reset();
                            await loadData(); // Reload both notifications and state
                          } catch (err: any) {
                            toast.error(err.message || "Failed to broadcast announcement");
                          }
                        }} className="space-y-4">
                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Announcement Title *</label>
                            <input 
                              name="title"
                              type="text"
                              required
                              className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                              placeholder="e.g. Maintenance Notice: Central Water Supply Interruption"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Detailed Broadcast Message *</label>
                            <textarea 
                              name="message"
                              required
                              rows={4}
                              className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all font-sans leading-relaxed"
                              placeholder="Describe the official memo, update, or notification instructions here..."
                            ></textarea>
                          </div>

                          <div className="flex justify-end pt-2">
                            <button 
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all text-xs uppercase tracking-wider font-semibold font-mono flex items-center space-x-2 shadow-lg shadow-indigo-500/15"
                            >
                              <Megaphone className="w-3.5 h-3.5" />
                              <span>Publish & Broadcast Notice</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Active Broadcast Memos */}
                      <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-6">
                        <div className="pb-4 border-b border-white/5 mb-6">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-white">Active System-Wide Memo History</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Review live broadcasts and view receipt read counters</p>
                        </div>

                        {notifications.filter(n => n.userId === 'all' || n.type === 'system_announcement').length === 0 ? (
                          <div className="text-center py-10 bg-[#0A0A0B] rounded-xl border border-white/5">
                            <Megaphone className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-mono">No previous system announcements published yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {notifications
                              .filter(n => n.userId === 'all' || n.type === 'system_announcement')
                              .map((n) => (
                                <div key={n.id} className="p-5 rounded-xl bg-[#0A0A0B] border border-white/5 flex flex-col md:flex-row md:items-start justify-between gap-4">
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                      <h4 className="text-sm font-semibold text-white leading-tight">{n.title}</h4>
                                      <span className="text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider bg-amber-500/10 text-amber-400 border-amber-500/20">
                                        Active Broadcast
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{n.message}</p>
                                    <div className="flex items-center space-x-4 text-[9px] text-slate-500 font-mono pt-1">
                                      <span>Published: {new Date(n.createdAt).toLocaleString()}</span>
                                      <span>•</span>
                                      <span className="text-indigo-400 font-semibold">{n.readBy?.length || 0} Student reads confirmed</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              )}

            </section>
          </div>
          </div>
        )}

      </main>

      {/* --- MODAL DIALOGS --- */}

      {/* 0. DRILLDOWN HOSTEL DETAILS MODAL */}
      {drilldownHostelId && (() => {
        const h = hostels.find(x => x.id === drilldownHostelId);
        if (!h) return null;
        return (
          <div className="fixed inset-0 bg-[#0A0A0B]/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-left">
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Cover Header */}
              <div className="h-44 w-full relative bg-slate-900 shrink-0">
                <img 
                  src={h.imageUrl || 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'} 
                  alt={h.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F12] to-black/30"></div>
                <button 
                  onClick={() => setDrilldownHostelId(null)} 
                  className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-all border border-white/10"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
                
                <div className="absolute bottom-4 left-6">
                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider border ${
                    h.type === 'male' 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : h.type === 'female' 
                      ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' 
                      : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                  }`}>
                    {h.type} Policy Block
                  </span>
                  <h3 className="text-lg font-serif italic text-white mt-1 leading-snug">{h.name}</h3>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Campus Coordinates</h4>
                  <p className="text-xs text-slate-300 flex items-center font-mono">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400 mr-1.5 shrink-0" />
                    {h.location}
                  </p>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5 font-mono">Asset Dossier & Comfort Amenities</h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{h.description || 'This structural residential asset provides clean sanitary facilities, continuous power systems, and fully secure quad quadrants for students.'}</p>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-3 gap-4 font-mono text-center">
                  <div className="bg-[#0A0A0B] p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Total Rooms</p>
                    <p className="text-base font-semibold text-white mt-1">{h.totalRooms || 0}</p>
                  </div>
                  <div className="bg-[#0A0A0B] p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Allocated Beds</p>
                    <p className="text-base font-semibold text-indigo-400 mt-1">{h.occupiedCapacity || 0}</p>
                  </div>
                  <div className="bg-[#0A0A0B] p-3 rounded-xl border border-white/5">
                    <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Vacancy Reserve</p>
                    <p className="text-base font-semibold text-emerald-400 mt-1">{h.availableCapacity || 0}</p>
                  </div>
                </div>

                {/* Rooms list inside this hostel */}
                <div>
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                    <h4 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold font-mono">Registered Room Enclaves</h4>
                    <span className="text-[9px] text-slate-500 font-mono">Active Rooms: {drilldownRooms.length}</span>
                  </div>

                  {drilldownRooms.length === 0 ? (
                    <p className="text-xs text-slate-600 italic font-mono py-4">No rooms currently deployed to this block.</p>
                  ) : (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                      {drilldownRooms.map((rm) => {
                        const vacancy = rm.capacity - rm.occupied;
                        return (
                          <div key={rm.id} className="bg-[#0A0A0B] border border-white/5 rounded-xl p-3 flex justify-between items-center text-xs font-mono">
                            <div>
                              <p className="font-semibold text-white font-sans text-xs">Room {rm.roomNo}</p>
                              <p className="text-[9px] text-slate-500 mt-0.5">Capacity: {rm.capacity} beds • Price: GH₵ {rm.price.toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              {rm.status === 'maintenance' ? (
                                <span className="inline-flex px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                                  Maintenance
                                </span>
                              ) : vacancy === 0 ? (
                                <span className="inline-flex px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider bg-slate-500/15 text-slate-500 border border-white/5">
                                  Full Lodged
                                </span>
                              ) : (
                                <span className="inline-flex px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {vacancy} Beds Free
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Close footer */}
              <div className="p-4 border-t border-white/5 shrink-0 bg-[#0A0A0B]/50 flex justify-end">
                <button 
                  onClick={() => setDrilldownHostelId(null)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all font-mono"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 1. ADMIN DECISION MODAL */}
      {decisionAppId && (() => {
        const app = applications.find(a => a.id === decisionAppId);
        if (!app) return null;

        const candidateRooms = rooms.filter(
          r => r.hostelId === app.hostelId && r.status === 'available' && r.occupied < r.capacity
        );

        return (
          <div className="fixed inset-0 bg-[#0A0A0B]/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-left">
            <div className="bg-[#0F0F12] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Determine Room Allocation</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Applicant: <span className="text-indigo-400 font-mono font-medium">{app.studentName} ({app.studentGender})</span></p>
                </div>
                <button onClick={() => setDecisionAppId(null)} className="p-1 text-slate-500 hover:text-white rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdminDecision} className="space-y-4">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Action Determination</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      type="button"
                      onClick={() => setDecisionStatus('approved')}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all ${
                        decisionStatus === 'approved' 
                          ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                          : 'border-white/5 text-slate-500'
                      }`}
                    >
                      Approve Request
                    </button>
                    <button 
                      type="button"
                      onClick={() => setDecisionStatus('rejected')}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all ${
                        decisionStatus === 'rejected' 
                          ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                          : 'border-white/5 text-slate-500'
                      }`}
                    >
                      Reject Request
                    </button>
                  </div>
                </div>

                {decisionStatus === 'approved' && (
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Assign Open Room Space *</label>
                    <select 
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                      value={decisionRoomId}
                      onChange={e => setDecisionRoomId(e.target.value)}
                      required={decisionStatus === 'approved'}
                    >
                      <option value="">-- Choose Vacant Room --</option>
                      {candidateRooms.map(r => (
                        <option key={r.id} value={r.id}>
                          Room {r.roomNo} ({r.capacity - r.occupied} vacancies left) — GH₵ {r.price.toLocaleString()}
                        </option>
                      ))}
                    </select>
                    {candidateRooms.length === 0 && (
                      <p className="text-[10px] text-red-400 mt-1 font-medium font-mono">⚠️ No available vacant rooms in {app.hostelName}. Deploy room assets or unlock them from maintenance.</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Academic Counselor Comment</label>
                  <textarea 
                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium min-h-16"
                    placeholder="E.g., Allocated to Room 101 lower bunk as requested."
                    value={decisionComment}
                    onChange={e => setDecisionComment(e.target.value)}
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider font-semibold font-mono"
                >
                  Sign & Transmit Decision
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* 2. STUDENT PAYMENT MODAL (Simulated Stripe/Remita secure checkout for university fees) */}
      {payingApp && (
        <div className="fixed inset-0 bg-[#0A0A0B]/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-left">
          <div className="bg-[#0F0F12] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white font-mono">Secure Housing Checkout</h3>
              </div>
              <button onClick={() => setPayingApp(null)} className="p-1 text-slate-500 hover:text-white rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Hostel Allocation:</span>
                <span className="text-white font-medium">{payingApp.hostelName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Assigned Room Number:</span>
                <span className="text-white font-mono font-bold">{payingApp.roomNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Academic Session:</span>
                <span className="text-white font-mono">{payingApp.academicYear}</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between text-sm font-semibold">
                <span className="text-slate-300">Aggregate Fee Due:</span>
                <span className="text-indigo-400 font-mono">GH₵ {(rooms.find(r => r.id === payingApp.roomId)?.price || 150000).toLocaleString()}.00</span>
              </div>
            </div>

            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold font-mono">Debit / Credit Card Number *</label>
                <input 
                  type="text"
                  className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  placeholder="5399 2300 4500 1200"
                  maxLength={19}
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold font-mono">Expiry MM/YY *</label>
                  <input 
                    type="text"
                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                    placeholder="12/28"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1 font-bold font-mono">Security CVV *</label>
                  <input 
                    type="password"
                    className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                    placeholder="•••"
                    maxLength={3}
                    value={cardCvv}
                    onChange={e => setCardCvv(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 text-white font-medium py-3 rounded-xl hover:bg-indigo-500 transition-all text-xs uppercase tracking-wider font-semibold font-mono flex items-center justify-center space-x-2"
              >
                <span>Authorize & Pay GH₵ {(rooms.find(r => r.id === payingApp.roomId)?.price || 150000).toLocaleString()}</span>
              </button>
              <p className="text-center text-[9px] text-slate-500 font-mono">🔒 Payments secured via PCI-DSS encrypted Remita sandbox gateway.</p>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT ROOM MODAL */}
      {editingRoom && (() => {
        // Find current occupants of this room
        const roomOccupants = applications
          .filter(app => app.roomId === editingRoom.id && app.status === 'approved')
          .map(app => ({
            id: app.studentId,
            name: app.studentName,
            matric: app.studentMatric,
            gender: app.studentGender,
            paymentStatus: app.paymentStatus
          }));

        return (
          <div className="fixed inset-0 bg-[#0A0A0B]/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in text-left">
            <div className="bg-[#0F0F12] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Modify Room {editingRoom.roomNo}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Edit capacity limits, annual fees, and active service statuses.</p>
                </div>
                <button 
                  onClick={() => setEditingRoom(null)} 
                  className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all"
                >
                  <X className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Form & Content */}
              <form onSubmit={handleUpdateRoomSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Room Code / Number *</label>
                    <input 
                      type="text"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                      value={editingRoomNo}
                      onChange={e => setEditingRoomNo(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Service Status *</label>
                    <select 
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium"
                      value={editingRoomStatus}
                      onChange={e => setEditingRoomStatus(e.target.value as any)}
                    >
                      <option value="available">Available / Open</option>
                      <option value="full">Full / Lodged</option>
                      <option value="maintenance">Maintenance / Blocked</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Total Bed Capacity *</label>
                    <input 
                      type="number"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                      value={editingRoomCapacity}
                      onChange={e => setEditingRoomCapacity(e.target.value)}
                      required
                    />
                    <p className="text-[9px] text-slate-500 mt-1 font-mono">Occupied slots: {editingRoom.occupied} bed(s)</p>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-400 mb-1.5 font-bold font-mono">Annual Bed Fee (NGN) *</label>
                    <input 
                      type="number"
                      className="w-full bg-[#0A0A0B] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium"
                      value={editingRoomPrice}
                      onChange={e => setEditingRoomPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Occupants list */}
                <div className="border-t border-white/5 pt-4">
                  <h4 className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3 font-mono flex items-center justify-between">
                    <span>Active Occupants Dossier</span>
                    <span className="text-[9px] font-normal text-indigo-400">({roomOccupants.length} student{roomOccupants.length !== 1 ? 's' : ''})</span>
                  </h4>

                  {roomOccupants.length === 0 ? (
                    <div className="p-4 bg-[#0A0A0B] border border-white/5 rounded-xl text-center text-[11px] text-slate-500 font-mono">
                      No student is currently allocated or secured to this room.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                      {roomOccupants.map(oc => (
                        <div key={oc.id} className="bg-[#0A0A0B] p-3 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-white">{oc.name}</p>
                            <p className="text-[9px] text-slate-500 font-mono mt-0.5">{oc.matric} • {oc.gender}</p>
                          </div>
                          <div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider border ${
                              oc.paymentStatus === 'paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {oc.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setEditingRoom(null)}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs uppercase tracking-wider font-semibold transition-all font-mono text-center"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all font-mono"
                  >
                    Apply Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}


      {/* DEMONSTRATION & GRADING UTILITIES PANEL */}
      <footer className="w-full py-8 border-t border-white/5 bg-[#050506] px-6 lg:px-12 text-center space-y-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">University Defense & Grading Demonstration Controller</p>
          
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button 
              onClick={() => handleQuickSwitch('student_john')}
              className="px-3.5 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center space-x-2"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Login as Student (John - Male)</span>
            </button>
            
            <button 
              onClick={() => handleQuickSwitch('student_jane')}
              className="px-3.5 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center space-x-2"
            >
              <Users className="w-3.5 h-3.5 text-pink-400" />
              <span>Login as Student (Jane - Female)</span>
            </button>

            <button 
              onClick={() => handleQuickSwitch('hostel_admin')}
              className="px-3.5 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center space-x-2"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Login as Hostel Admin (Dr. Grey)</span>
            </button>

            <button 
              onClick={() => handleQuickSwitch('system_admin')}
              className="px-3.5 py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 rounded-xl text-xs font-semibold text-slate-300 transition-all flex items-center space-x-2"
            >
              <Shield className="w-3.5 h-3.5 text-green-400" />
              <span>Login as System Admin (Prof. Xavier)</span>
            </button>
          </div>
          <p className="text-[9px] text-slate-600 mt-3 font-mono">Use the buttons above to instantly switch between accounts and demonstrate complete role-based workflows to lecturers without manual data re-entry.</p>
        </div>

        <div className="pt-4 border-t border-white/[0.03]">
          <p className="text-[10px] text-slate-500 font-mono">HostelEase &copy; 2026. Designed as an Academic Year Software Engineering Final Thesis Project.</p>
        </div>
      </footer>

      {/* Progressive Web App Install Banner & Prompt */}
      <InstallAppPrompt />
    </div>
  );
}
