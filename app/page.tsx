"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  School, Users, BookOpen, QrCode, Settings, BarChart3,
  Plus, X, Check, Trash2, GraduationCap, Clock, Award,
  Search, Bell, ChevronRight, Save, Shield,
  LogOut, Eye, EyeOff, User, Lock, Home,
  CheckCircle, AlertCircle, TrendingUp, Grid3X3, Download, FileText,
  Upload, UserPlus, Phone, Printer,
  Globe, Image, Newspaper, Star, Users2, MapPin, Calendar, Tag, Edit2, ExternalLink, ChevronLeft, ChevronDown, PlayCircle,
  HeartHandshake, DollarSign, Package, KeyRound, CreditCard, Boxes, ClipboardList, AlertTriangle, Database, Wifi, WifiOff,
  Menu, ClipboardCheck
} from "lucide-react";

// ─── Supabase Client ──────────────────────────────────────────────────────────
// Replace these with your actual Supabase project URL and anon key.
// You can find them in: Supabase Dashboard → Settings → API
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Minimal Supabase REST client — no SDK needed, works with the anon key
const sb = {
  headers: () => ({
    "Content-Type": "application/json",
    "apikey": SUPABASE_ANON,
    "Authorization": `Bearer ${SUPABASE_ANON}`,
    "Prefer": "return=representation",
  }),
  isConfigured: () => !!(SUPABASE_URL && SUPABASE_ANON),

  async select<T>(table: string, query = ""): Promise<T[]> {
    if (!this.isConfigured()) return [];
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: this.headers() as HeadersInit,
    });
    if (!res.ok) { console.error(`[sb.select] ${table}:`, await res.text()); return []; }
    return res.json();
  },

  async insert<T>(table: string, data: Partial<T>): Promise<T | null> {
    if (!this.isConfigured()) return null;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: this.headers() as HeadersInit,
      body: JSON.stringify(data),
    });
    if (!res.ok) { console.error(`[sb.insert] ${table}:`, await res.text()); return null; }
    const arr = await res.json();
    return arr[0] ?? null;
  },

  async upsert<T>(table: string, data: Partial<T>): Promise<T | null> {
    if (!this.isConfigured()) return null;
    const h = { ...this.headers(), "Prefer": "return=representation,resolution=merge-duplicates" } as HeadersInit;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: h,
      body: JSON.stringify(data),
    });
    if (!res.ok) { console.error(`[sb.upsert] ${table}:`, await res.text()); return null; }
    const arr = await res.json();
    return arr[0] ?? null;
  },

  async update<T>(table: string, id: string, data: Partial<T>): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: this.headers() as HeadersInit,
      body: JSON.stringify(data),
    });
    if (!res.ok) { console.error(`[sb.update] ${table}:`, await res.text()); return false; }
    return true;
  },

  async delete(table: string, id: string): Promise<boolean> {
    if (!this.isConfigured()) return false;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "DELETE",
      headers: this.headers() as HeadersInit,
    });
    if (!res.ok) { console.error(`[sb.delete] ${table}:`, await res.text()); return false; }
    return true;
  },
};

// ─── DB Operations Interface (passed as prop) ─────────────────────────────────
interface DbOps {
  connected: boolean;
  // Students
  addStudent:    (s: Student)       => Promise<void>;
  updateStudent: (s: Student)       => Promise<void>;
  deleteStudent: (id: string)       => Promise<void>;
  // Teachers
  addTeacher:    (t: Teacher)       => Promise<void>;
  updateTeacher: (t: Teacher)       => Promise<void>;
  deleteTeacher: (id: string)       => Promise<void>;
  // Inventory items
  addItem:       (i: InventoryItem) => Promise<void>;
  updateItem:    (i: InventoryItem) => Promise<void>;
  deleteItem:    (id: string)       => Promise<void>;
  // Labs
  addLab:        (l: Lab)           => Promise<void>;
  updateLab:     (l: Lab)           => Promise<void>;
  deleteLab:     (id: string)       => Promise<void>;
  // Fees
  addFee:        (f: FeeRecord)     => Promise<void>;
  updateFee:     (f: FeeRecord)     => Promise<void>;
  deleteFee:     (id: string)       => Promise<void>;
  // Behavior
  addBehavior:   (b: BehaviorRecord)=> Promise<void>;
  updateBehavior:(b: BehaviorRecord)=> Promise<void>;
  deleteBehavior:(id: string)       => Promise<void>;
  // Counseling
  saveCounselingProfile: (p: CounselingProfile) => Promise<void>;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Role  = "admin" | "support_admin" | "teacher" | "student";
type Grade = "S" | "A" | "B" | "C" | "W" | "-";

interface StudentProfile { dob?:string; gender?:string; address?:string; phone?:string; parentName?:string; parentPhone?:string; bloodGroup?:string; nic?:string; }
interface TeacherProfile { dob?:string; gender?:string; address?:string; phone?:string; qualification?:string; joinDate?:string; nic?:string; specialization?:string; }
interface Student { id:string; name:string; rollNo:string; classId:string; photo:string; marks:Record<string,number>; password:string; profile?:StudentProfile; status?:"pending"|"approved"; }
interface Teacher { id:string; name:string; email:string; subjectIds:string[]; classIds:string[]; password:string; profile?:TeacherProfile; status?:"pending"|"approved"; }
interface Subject { id:string; name:string; code:string; classIds:string[]; teacherId:string }
interface Class   { id:string; name:string; section:string; teacherId:string }
interface TimetableSlot { day:string; period:number; subjectId:string; teacherId:string }
interface SchoolSettings { name:string; tagline:string; logoUrl:string; blogUrl:string; currency:string; pwAdmin:string; pwCounselor:string; pwStaff:string; }
interface SupportAdmin   { id:string; name:string; email:string; password:string; }

// ─── CMS / Public Website Types ──────────────────────────────────────────────
interface SliderSlide  { id:string; imageUrl:string; title:string; subtitle:string; }
interface GalleryItem  { id:string; imageUrl:string; caption:string; category:string; date:string; }
interface NewsPost     { id:string; title:string; body:string; imageUrl:string; category:"news"|"blog"|"circular"; date:string; author:string; pinned?:boolean; }
interface Achievement  { id:string; title:string; description:string; imageUrl:string; category:"academic"|"sports"|"aesthetic"; year:string; }
interface Club         { id:string; name:string; description:string; imageUrl:string; teacher:string; members:number; badge:string; }
interface MediaFile    { id:string; name:string; url:string; type:"image"|"pdf"; size:string; uploadedAt:string; }
interface PrincipalMsg { text:string; name:string; title:string; photo:string; }
interface VisionMission{ vision:string; mission:string; history:string; contact:string; address:string; mapEmbed:string; }

type StaffRole = "principal" | "deputy_principal" | "assistant_principal" | "sectional_head" | "teacher";
interface StaffMember { id:string; name:string; designation:string; role:StaffRole; department?:string; photo:string; }

interface CMS {
  slides:SliderSlide[];
  gallery:GalleryItem[];
  news:NewsPost[];
  achievements:Achievement[];
  clubs:Club[];
  media:MediaFile[];
  principal:PrincipalMsg;
  visionMission:VisionMission;
  quickStats:{students:number;teachers:number;founded:number;achievements:number;};
  staff:StaffMember[];
}
// ─── Behavior Module Types ─────────────────────────────────────────────────────
type BehaviorSeverity = "commendation"|"minor"|"moderate"|"serious"|"critical";
type BehaviorStatus   = "open"|"resolved"|"monitoring";
interface BehaviorRecord {
  id:string; studentId:string; date:string;
  type:"positive"|"negative";
  severity:BehaviorSeverity;
  category:string; description:string;
  actionTaken:string; status:BehaviorStatus;
  reportedBy:string;
}
interface BehaviorState { records:BehaviorRecord[]; }

interface AppState {
  settings:SchoolSettings; classes:Class[]; subjects:Subject[];
  teachers:Teacher[]; students:Student[];
  timetable:Record<string,TimetableSlot[]>; attendance:Record<string,Record<string,boolean>>;
  supportAdmins:SupportAdmin[];
  cms:CMS;
  counseling:CounselingState;
  fees:FeesState;
  inventory:InventoryState;
  behavior:BehaviorState;
}

// ─── Counseling Module Types ───────────────────────────────────────────────────
interface CounselingSession { id:string; date:string; issue:string; notes:string; followUp:string; mood:"good"|"neutral"|"concern"|"urgent"; }
interface CounselingProfile { studentId:string; background:string; sessions:CounselingSession[]; flags:string[]; }
interface CounselingState   { profiles:CounselingProfile[]; }

// ─── Fees Module Types ─────────────────────────────────────────────────────────
type FeeCategory = "tuition"|"transport"|"lab"|"sports"|"activity"|"other";
interface FeeRecord { id:string; studentId:string; category:FeeCategory; label:string; amount:number; dueDate:string; paidDate?:string; status:"paid"|"unpaid"|"partial"; paidAmount?:number; note?:string; }
interface FeesState { records:FeeRecord[]; }

// ─── Inventory Module Types ────────────────────────────────────────────────────
type ItemCondition = "excellent"|"good"|"fair"|"poor"|"damaged";
interface InventoryItem { id:string; name:string; category:string; quantity:number; unit:string; condition:ItemCondition; location:string; lastChecked:string; note?:string; labId?:string; }
interface Lab { id:string; name:string; icon:string; password:string; description:string; color:string; }
interface InventoryState { items:InventoryItem[]; labs:Lab[]; }
interface LoggedInUser { role:Role; id:string; name:string }

// ─── PII Encryption (XOR + btoa — replace with Web Crypto AES in production) ──
const ENC_KEY = "NEXUS_ERP_2026";
function encPII(v:string):string { if(!v) return ""; try { return btoa(unescape(encodeURIComponent(v.split("").map((c,i)=>String.fromCharCode(c.charCodeAt(0)^ENC_KEY.charCodeAt(i%ENC_KEY.length))).join("")))); } catch { return btoa(v); } }
function decPII(v:string):string { if(!v) return ""; try { return decodeURIComponent(escape(atob(v))).split("").map((c,i)=>String.fromCharCode(c.charCodeAt(0)^ENC_KEY.charCodeAt(i%ENC_KEY.length))).join(""); } catch { return atob(v); } }
function encProfile<T extends Record<string,any>>(p:T):T { const o:any={}; Object.entries(p).forEach(([k,v])=>{o[k]=v?encPII(String(v)):v;}); return o as T; }
function decProfile<T extends Record<string,any>>(p?:T):T { if(!p) return {} as T; const o:any={}; Object.entries(p).forEach(([k,v])=>{o[k]=v?decPII(String(v)):v;}); return o as T; }

// ─── CSV Parser ────────────────────────────────────────────────────────────────
function parseCSV(text:string):Record<string,string>[] {
  const lines = text.trim().split(/\r?\n/); if(lines.length<2) return [];
  const headers = lines[0].split(",").map(h=>h.trim().toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,""));
  return lines.slice(1).filter(l=>l.trim()).map(l=>{
    const vals = l.split(",").map(v=>v.trim().replace(/^"|"$/g,""));
    const o:Record<string,string>={}; headers.forEach((h,i)=>{o[h]=vals[i]||"";}); return o;
  });
}

// ─── Session persistence (1-hour login) ──────────────────────────────────────
const SESSION_KEY    = "erp_session_user";
const SESSION_EXPIRY = "erp_session_expiry";
const SESSION_DASH   = "erp_in_dash";
const ONE_HOUR_MS    = 60 * 60 * 1000;

// ─── Logo persistence helpers ─────────────────────────────────────────────────
const getSavedLogo = (): string => {
  if (typeof window === "undefined") return "";
  try { return localStorage.getItem("school_logo") || ""; } catch { return ""; }
};
const saveLogo = (url: string) => {
  try {
    if (url) localStorage.setItem("school_logo", url);
    else localStorage.removeItem("school_logo");
  } catch {}
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];

const INITIAL: AppState = {
  settings: { name:"Nexus Academy", tagline:"Excellence in Education", logoUrl:getSavedLogo(), blogUrl:"https://nexusacademy.edu.lk/blog", currency:"LKR", pwAdmin:"admin123", pwCounselor:"couns789", pwStaff:"staff456" },
  classes: [
    { id:"c1", name:"9",  section:"A", teacherId:"t1" },
    { id:"c2", name:"10", section:"B", teacherId:"t2" },
  ],
  subjects: [
    { id:"s1", name:"Mathematics", code:"MTH", classIds:["c1","c2"], teacherId:"t1" },
    { id:"s2", name:"Physics",     code:"PHY", classIds:["c1"],       teacherId:"t2" },
    { id:"s3", name:"Chemistry",   code:"CHM", classIds:["c2"],       teacherId:"t2" },
    { id:"s4", name:"English",     code:"ENG", classIds:["c1","c2"], teacherId:"t1" },
  ],
  teachers: [
    { id:"t1", name:"Dr. Arjun Mehta",  email:"arjun@nexus.edu",  subjectIds:["s1","s4"], classIds:["c1","c2"], password:"teacher123",
      profile: encProfile({dob:"1985-06-15",gender:"Male",phone:"0771234567",address:"12 Main St, Colombo",qualification:"PhD Mathematics",joinDate:"2020-01-10",nic:"850615V",specialization:"Applied Mathematics"}) },
    { id:"t2", name:"Ms. Priya Sharma", email:"priya@nexus.edu",  subjectIds:["s2","s3"], classIds:["c1","c2"], password:"teacher456",
      profile: encProfile({dob:"1990-03-22",gender:"Female",phone:"0779876543",address:"45 Lake Rd, Kandy",qualification:"MSc Physics",joinDate:"2021-08-01",nic:"900322V",specialization:"Nuclear Physics"}) },
  ],
  students: [
    { id:"st1", name:"Aditya Kumar", rollNo:"0001", classId:"c1", photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Aditya", marks:{s1:88,s2:76,s4:92}, password:"aditya123",
      profile: encProfile({dob:"2010-04-12",gender:"Male",phone:"0771112222",address:"7 Rose Ave, Colombo",parentName:"Ramesh Kumar",parentPhone:"0771113333",bloodGroup:"O+",nic:""}) },
    { id:"st2", name:"Sneha Patel",  rollNo:"0002", classId:"c1", photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Sneha",  marks:{s1:95,s2:89,s4:97}, password:"sneha123",
      profile: encProfile({dob:"2010-08-25",gender:"Female",phone:"0772223333",address:"3 Palm St, Galle",parentName:"Suresh Patel",parentPhone:"0772224444",bloodGroup:"A+",nic:""}) },
    { id:"st3", name:"Rohan Singh",  rollNo:"0003", classId:"c2", photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Rohan",  marks:{s1:71,s3:68,s4:75}, password:"rohan123",
      profile: encProfile({dob:"2009-11-05",gender:"Male",phone:"0773334444",address:"22 Hill Rd, Kandy",parentName:"Arjun Singh",parentPhone:"0773335555",bloodGroup:"B+",nic:""}) },
    { id:"st4", name:"Kavya Nair",   rollNo:"0004", classId:"c2", photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Kavya",  marks:{s1:82,s3:90,s4:88}, password:"kavya123",
      profile: encProfile({dob:"2010-01-18",gender:"Female",phone:"0774445555",address:"9 Sea View, Matara",parentName:"Vijay Nair",parentPhone:"0774446666",bloodGroup:"AB+",nic:""}) },
  ],
  timetable: {
    c1:[
      {day:"Monday",period:1,subjectId:"s1",teacherId:"t1"},{day:"Monday",period:2,subjectId:"s2",teacherId:"t2"},
      {day:"Tuesday",period:1,subjectId:"s4",teacherId:"t1"},{day:"Wednesday",period:3,subjectId:"s1",teacherId:"t1"},
      {day:"Thursday",period:2,subjectId:"s2",teacherId:"t2"},{day:"Friday",period:1,subjectId:"s4",teacherId:"t1"},
    ],
    c2:[
      {day:"Monday",period:1,subjectId:"s1",teacherId:"t1"},{day:"Monday",period:2,subjectId:"s3",teacherId:"t2"},
      {day:"Tuesday",period:1,subjectId:"s4",teacherId:"t1"},{day:"Wednesday",period:2,subjectId:"s3",teacherId:"t2"},
      {day:"Friday",period:3,subjectId:"s1",teacherId:"t1"},
    ],
  },
  attendance: { "2026-03-01":{"0001":true,"0002":true,"0003":false,"0004":true} },
  supportAdmins: [{ id:"sa1", name:"Support Admin", email:"support@nexus.edu", password:"support123" }],
  counseling: {
    profiles: [
      { studentId:"st1", background:"Highly motivated student. Parents are separated — occasional focus issues.", sessions:[
          {id:"cs1",date:"2026-01-15",issue:"Exam Anxiety",notes:"Student expressed concern about upcoming AL exams. Discussed coping strategies and breathing exercises.",followUp:"Check in after mock exams.",mood:"neutral"},
          {id:"cs2",date:"2026-02-10",issue:"Peer Conflict",notes:"Dispute with classmate resolved through mediation. Both parties agreed to communicate openly.",followUp:"Monitor class dynamics.",mood:"good"},
        ], flags:["Exam Anxiety"]
      },
      { studentId:"st2", background:"Exceptionally high achiever. Monitor for perfectionist burnout.", sessions:[], flags:["Perfectionism"] },
    ]
  },
  fees: {
    records: [
      {id:"f1",studentId:"st1",category:"tuition",  label:"Term 1 Tuition Fee",   amount:15000,dueDate:"2026-01-31",paidDate:"2026-01-20",status:"paid",  paidAmount:15000},
      {id:"f2",studentId:"st1",category:"transport",label:"Bus Fee — Term 1",      amount:4500, dueDate:"2026-01-31",paidDate:"2026-01-20",status:"paid",  paidAmount:4500},
      {id:"f3",studentId:"st2",category:"tuition",  label:"Term 1 Tuition Fee",   amount:15000,dueDate:"2026-01-31",paidDate:"2026-01-25",status:"paid",  paidAmount:15000},
      {id:"f4",studentId:"st3",category:"tuition",  label:"Term 1 Tuition Fee",   amount:15000,dueDate:"2026-01-31",                     status:"unpaid"},
      {id:"f5",studentId:"st3",category:"lab",      label:"Science Lab Fee",       amount:2500, dueDate:"2026-02-15",                     status:"unpaid"},
      {id:"f6",studentId:"st4",category:"tuition",  label:"Term 1 Tuition Fee",   amount:15000,dueDate:"2026-01-31",paidDate:"2026-02-05",status:"partial",paidAmount:8000,note:"Balance to be paid by March"},
    ]
  },
  inventory: {
    labs: [
      {id:"lab1",name:"Physics Lab",     icon:"⚗️",  password:"phys2026", description:"Physics experiments and apparatus",              color:"bg-blue-500/10 border-blue-500/20"},
      {id:"lab2",name:"IT / Computer Lab",icon:"💻", password:"ict2026",  description:"Computers, networking equipment and peripherals", color:"bg-cyan-500/10 border-cyan-500/20"},
      {id:"lab3",name:"Science Lab",     icon:"🔬",  password:"sci2026",  description:"Biology and Chemistry lab equipment",             color:"bg-emerald-500/10 border-emerald-500/20"},
    ],
    items: [
      {id:"i1",name:"Student Desks",       category:"Furniture",   quantity:320,unit:"pcs", condition:"good",      location:"Classrooms",      lastChecked:"2026-01-10"},
      {id:"i2",name:"Teacher Chairs",      category:"Furniture",   quantity:48, unit:"pcs", condition:"good",      location:"Staff Rooms",      lastChecked:"2026-01-10"},
      {id:"i3",name:"Desktop Computers",   category:"Technology",  quantity:40, unit:"pcs", condition:"good",      location:"Computer Lab",     lastChecked:"2026-02-01", labId:"lab2"},
      {id:"i4",name:"Projectors",          category:"Technology",  quantity:12, unit:"pcs", condition:"fair",      location:"Various Rooms",    lastChecked:"2026-02-01"},
      {id:"i5",name:"Cricket Bats",        category:"Sports",      quantity:15, unit:"pcs", condition:"fair",      location:"Sports Store",     lastChecked:"2026-01-20"},
      {id:"i6",name:"Science Microscopes", category:"Lab Equipment",quantity:20,unit:"pcs", condition:"excellent", location:"Science Lab",      lastChecked:"2026-02-15", labId:"lab3"},
      {id:"i7",name:"Fire Extinguishers",  category:"Safety",      quantity:18, unit:"pcs", condition:"excellent", location:"Throughout School", lastChecked:"2026-03-01"},
      {id:"i8",name:"Physics Oscilloscopes",category:"Lab Equipment",quantity:8,unit:"pcs", condition:"good",      location:"Physics Lab",      lastChecked:"2026-02-10", labId:"lab1"},
    ]
  },
  behavior: {
    records: [
      {id:"bh1",studentId:"st1",date:"2026-02-05",type:"positive",severity:"commendation",category:"Academic",description:"Scored highest in the class in the Mathematics mock exam.",actionTaken:"Certificate of Excellence awarded",status:"resolved",reportedBy:"Admin"},
      {id:"bh2",studentId:"st3",date:"2026-02-12",type:"negative",severity:"moderate",category:"Discipline",description:"Repeated disruption during Physics class despite two warnings.",actionTaken:"Meeting with parents scheduled",status:"monitoring",reportedBy:"Admin"},
      {id:"bh3",studentId:"st4",date:"2026-02-20",type:"negative",severity:"minor",category:"Attendance",description:"Late to school 3 times in February without valid reason.",actionTaken:"Verbal warning issued",status:"open",reportedBy:"Admin"},
    ]
  },
  cms: {
    slides: [
      {id:"sl1",imageUrl:"https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1400&q=80",title:"Welcome to Nexus Academy",subtitle:"Shaping Tomorrow's Leaders Today"},
      {id:"sl2",imageUrl:"https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1400&q=80",title:"Excellence in Education",subtitle:"A Legacy of Learning Since 1995"},
      {id:"sl3",imageUrl:"https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=1400&q=80",title:"Nurturing Every Talent",subtitle:"Academics · Sports · Arts"},
    ],
    gallery: [
      {id:"g1",imageUrl:"https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",caption:"Annual Sports Meet 2025",category:"Sports",date:"2025-03-15"},
      {id:"g2",imageUrl:"https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=800&q=80",caption:"Science Exhibition",category:"Academic",date:"2025-02-20"},
      {id:"g3",imageUrl:"https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",caption:"Cultural Day Celebrations",category:"Cultural",date:"2025-01-10"},
      {id:"g4",imageUrl:"https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&q=80",caption:"Prize Giving Ceremony",category:"Academic",date:"2024-12-05"},
      {id:"g5",imageUrl:"https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=800&q=80",caption:"Prefects Installation",category:"Leadership",date:"2024-11-18"},
      {id:"g6",imageUrl:"https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=800&q=80",caption:"Debate Championship",category:"Academic",date:"2024-10-22"},
    ],
    news: [
      {id:"n1",title:"Term 2 Results Published",body:"We are pleased to announce that Term 2 examination results are now available on the student portal. Students can log in to view their detailed marksheet and download their result slip.",imageUrl:"https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&q=80",category:"news",date:"2026-02-28",author:"Admin",pinned:true},
      {id:"n2",title:"Annual Sports Meet 2026",body:"The Annual Sports Meet will be held on March 15th at the main grounds. All students are encouraged to participate. Registration closes on March 5th.",imageUrl:"https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80",category:"news",date:"2026-02-20",author:"Sports Dept"},
      {id:"n3",title:"New Science Lab Inauguration",body:"We are thrilled to announce the inauguration of our state-of-the-art science laboratory, equipped with modern apparatus for Chemistry, Physics, and Biology experiments.",imageUrl:"https://images.unsplash.com/photo-1581093458791-9d58e74f5e5e?w=600&q=80",category:"blog",date:"2026-02-10",author:"Principal"},
    ],
    achievements: [
      {id:"a1",title:"National Mathematics Olympiad — Gold",description:"Team Nexus secured the Gold Medal at the National Mathematics Olympiad 2025, competing against 200+ schools.",imageUrl:"https://images.unsplash.com/photo-1567427018141-0584cfcbf1b8?w=600&q=80",category:"academic",year:"2025"},
      {id:"a2",title:"Inter-School Cricket Champions",description:"The Nexus Academy Cricket Team won the Inter-School Championship for the third consecutive year.",imageUrl:"https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&q=80",category:"sports",year:"2025"},
      {id:"a3",title:"Best Drama at National Arts Festival",description:"Our Drama Society's production of 'Echoes of Tomorrow' won the Best Drama award at the National Arts Festival.",imageUrl:"https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=600&q=80",category:"aesthetic",year:"2024"},
    ],
    clubs: [
      {id:"cl1",name:"Science & Robotics Club",description:"Explore cutting-edge technology, build robots, and compete in national science competitions. Weekly sessions every Thursday.",imageUrl:"https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=600&q=80",teacher:"Dr. Arjun Mehta",members:42,badge:"🤖"},
      {id:"cl2",name:"Debate Society",description:"Sharpen your oratory and critical thinking skills. Participates in inter-school and national debate championships.",imageUrl:"https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80",teacher:"Ms. Priya Sharma",members:28,badge:"🎤"},
      {id:"cl3",name:"Drama & Arts Society",description:"Express your creativity through theatre, painting, and performance. Annual productions and art exhibitions.",imageUrl:"https://images.unsplash.com/photo-1503095396549-807759245b35?w=600&q=80",teacher:"Dr. Arjun Mehta",members:35,badge:"🎭"},
      {id:"cl4",name:"Eco Green Club",description:"Dedicated to environmental conservation. Tree planting, waste reduction campaigns, and awareness programs.",imageUrl:"https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&q=80",teacher:"Ms. Priya Sharma",members:56,badge:"🌿"},
    ],
    media: [],
    principal: {
      text:"At Nexus Academy, we believe that every child is a unique constellation of talents waiting to be discovered. Our mission is not merely to educate but to inspire — to ignite the flame of curiosity, nurture resilience, and build the character that will carry our students through life's greatest challenges. We are proud of our legacy and even more excited about our future.",
      name:"Dr. Kavindra Perera",
      title:"Principal, Nexus Academy",
      photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Principal&backgroundColor=b6e3f4"
    },
    visionMission: {
      vision:"To be a centre of excellence that empowers every learner to reach their full potential and contribute meaningfully to a global society.",
      mission:"Providing a holistic, inclusive, and innovative education that nurtures intellectual curiosity, ethical values, and a lifelong love of learning.",
      history:"Founded in 1995 by visionary educators, Nexus Academy has grown from a small institution of 200 students to a thriving community of over 1,200 learners. With a legacy of academic excellence and a track record of producing leaders in every field, we continue to build on our founding principles of integrity, innovation, and impact.",
      contact:"info@nexusacademy.edu.lk | +94 11 234 5678",
      address:"42 Knowledge Lane, Colombo 07, Sri Lanka",
      mapEmbed:"https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.9!2d79.8!3d6.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwNTQnMDAuMCJOIDc5wrA0OCcwMC4wIkU!5e0!3m2!1sen!2slk!4v1234567890"
    },
    quickStats:{students:1240,teachers:68,founded:1995,achievements:127},
    staff:[
      {id:"sf1",name:"Dr. Kavindra Perera",   designation:"Principal",                          role:"principal",          photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Principal&backgroundColor=b6e3f4"},
      {id:"sf2",name:"Mrs. Dilini Fernando",   designation:"Deputy Principal",                   role:"deputy_principal",   photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Dilini&backgroundColor=ffd5dc"},
      {id:"sf3",name:"Mr. Roshan Silva",       designation:"Assistant Principal (Academic)",     role:"assistant_principal",photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Roshan&backgroundColor=d1d4f9"},
      {id:"sf4",name:"Mrs. Kamala Jayasuriya", designation:"Assistant Principal (Welfare)",      role:"assistant_principal",photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Kamala&backgroundColor=c0aede"},
      {id:"sf5",name:"Mr. Sunil Bandara",      designation:"Sectional Head — Science",           role:"sectional_head",     department:"Science",        photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Sunil&backgroundColor=b6e3f4"},
      {id:"sf6",name:"Mrs. Nimali Peris",      designation:"Sectional Head — Humanities",        role:"sectional_head",     department:"Humanities",     photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Nimali&backgroundColor=ffd5dc"},
      {id:"sf7",name:"Mr. Asanka Rajapaksa",   designation:"Sectional Head — Commerce",          role:"sectional_head",     department:"Commerce",       photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Asanka&backgroundColor=d1d4f9"},
      {id:"sf8",name:"Dr. Arjun Mehta",        designation:"Class Teacher Gr.9A · Mathematics",  role:"teacher",            department:"Mathematics",    photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun&backgroundColor=b6e3f4"},
      {id:"sf9",name:"Ms. Priya Sharma",       designation:"Class Teacher Gr.10B · Physics",     role:"teacher",            department:"Science",        photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Priya&backgroundColor=ffd5dc"},
      {id:"sf10",name:"Mr. Chamara Dissanayake",designation:"Subject Teacher · English",         role:"teacher",            department:"Languages",     photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Chamara&backgroundColor=d1d4f9"},
      {id:"sf11",name:"Mrs. Sandya Wijeratne", designation:"Subject Teacher · History",          role:"teacher",            department:"Humanities",     photo:"https://api.dicebear.com/7.x/avataaars/svg?seed=Sandya&backgroundColor=c0aede"},
    ],
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const uid   = () => Math.random().toString(36).slice(2, 9);
const today = new Date().toISOString().split("T")[0];



function downloadCSV(filename:string, rows:string[][]){
  const content = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([content], {type:"text/csv;charset=utf-8;"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const DAYS    = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const PERIODS = [1,2,3,4,5,6];

function getGrade(avg:number):Grade {
  if(avg>=75) return "A";
  if(avg>=65) return "B";
  if(avg>=55) return "C";
  if(avg>=35) return "S";
  if(avg>0)   return "W";
  return "-";
}
function gradeColor(g:Grade){
  return{S:"text-emerald-400",A:"text-blue-400",B:"text-yellow-400",C:"text-orange-400",W:"text-red-400","-":"text-gray-500"}[g];
}
function gradeBg(g:Grade){
  return{S:"bg-emerald-500/20 border-emerald-500/30",A:"bg-blue-500/20 border-blue-500/30",B:"bg-yellow-500/20 border-yellow-500/30",C:"bg-orange-500/20 border-orange-500/30",W:"bg-red-500/20 border-red-500/30","-":"bg-white/5 border-white/10"}[g];
}
function gradeLabel(g:Grade){ return{A:"Excellent",B:"Good",C:"Average",S:"Simple Pass",W:"Fail","-":"–"}[g]; }

// ─── Grade Key Component (fix for cramped plain-text key shown in screenshots) ─
function GradeKey() {
  const items = [
    {g:"S",r:"≥ 90",cls:"bg-emerald-500/20 border-emerald-500/40 text-emerald-400"},
    {g:"A",r:"≥ 75",cls:"bg-blue-500/20 border-blue-500/40 text-blue-400"},
    {g:"B",r:"≥ 60",cls:"bg-yellow-500/20 border-yellow-500/40 text-yellow-400"},
    {g:"C",r:"≥ 40",cls:"bg-orange-500/20 border-orange-500/40 text-orange-400"},
    {g:"W",r:"< 40", cls:"bg-red-500/20 border-red-500/40 text-red-400"},
  ] as const;
  return (
    <div className="mt-5 pt-4 border-t border-white/10">
      <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest mb-3">Grade Key</div>
      <div className="flex flex-wrap gap-2">
        {items.map(({g,r,cls}) => (
          <span key={g} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${cls}`}>
            <span className="font-bold">{g}</span>
            <span className="opacity-60 text-[10px]">{r}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Compute results for a class ─────────────────────────────────────────────
function getResults(state:AppState, classId:string) {
  const students = state.students.filter(s=>s.classId===classId);
  const subjects = state.subjects.filter(s=>s.classIds.includes(classId));
  const results  = students.map(st=>{
    const scores = subjects.map(sub=>st.marks[sub.id]??null);
    const valid  = scores.filter(s=>s!==null) as number[];
    const total  = valid.reduce((a,b)=>a+b,0);
    const avg    = valid.length?total/valid.length:0;
    return{student:st,scores,total,avg:Math.round(avg*10)/10,grade:getGrade(avg)};
  });
  const sorted=[...results].sort((a,b)=>b.total-a.total);
  return results.map(r=>({...r,rank:sorted.indexOf(r)+1}));
}

// ─── PDF Download via browser print ──────────────────────────────────────────
function downloadResultPDF(student:Student, state:AppState) {
  const myClass    = state.classes.find(c=>c.id===student.classId);
  const mySubjects = state.subjects.filter(s=>s.classIds.includes(student.classId));
  const validMarks = mySubjects.map(s=>student.marks[s.id]).filter(m=>m!==undefined) as number[];
  const total      = validMarks.reduce((a,b)=>a+b,0);
  const avg        = validMarks.length?Math.round((total/validMarks.length)*10)/10:0;
  const grade      = getGrade(avg);
  const classStudents = state.students.filter(s=>s.classId===student.classId);
  const ranked = classStudents.map(st=>{
    const v=mySubjects.map(s=>st.marks[s.id]).filter(m=>m!==undefined) as number[];
    return{id:st.id,total:v.reduce((a,b)=>a+b,0)};
  }).sort((a,b)=>b.total-a.total);
  const rank = ranked.findIndex(r=>r.id===student.id)+1;

  const rows = mySubjects.map(sub=>{
    const m=student.marks[sub.id];
    const g=m!==undefined?getGrade(m):"-";
    const color=m===undefined?"#888":m>=75?"#10b981":m>=40?"#f59e0b":"#ef4444";
    return`<tr><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">${sub.code}</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0">${sub.name}</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:monospace;color:${color};font-weight:bold">${m??'–'}/100</td><td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:bold;color:${color}">${m!==undefined?g:"–"}</td></tr>`;
  }).join("");

  const gColor=(g:Grade)=>g==="S"?"#059669":g==="A"?"#1d4ed8":g==="B"?"#b45309":g==="C"?"#c2410c":"#dc2626";

  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Result — ${student.name}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;background:#fff;color:#0f172a;padding:40px}.header{text-align:center;border-bottom:3px solid #1e40af;padding-bottom:20px;margin-bottom:24px}.school{font-size:24px;font-weight:bold;color:#1e40af;letter-spacing:2px}.tagline{font-size:12px;color:#64748b;margin-top:4px}.title{font-size:13px;font-weight:bold;color:#475569;margin-top:10px;text-transform:uppercase;letter-spacing:3px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}.box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px}.label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px}.val{font-size:14px;font-weight:bold;color:#0f172a;margin-top:3px}.summary{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:20px}.sbox{text-align:center;padding:16px;border:2px solid #e2e8f0;border-radius:12px}.sval{font-size:28px;font-weight:bold}.slabel{font-size:11px;color:#64748b;margin-top:4px;text-transform:uppercase;letter-spacing:1px}table{width:100%;border-collapse:collapse;margin-bottom:20px}thead{background:#1e40af}thead th{color:#fff;padding:12px 16px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}.gkey{display:flex;gap:16px;font-size:11px;color:#64748b;padding-top:16px;border-top:1px solid #e2e8f0}.footer{text-align:center;margin-top:40px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:16px}@media print{body{padding:20px}}</style>
  </head><body>
  <div class="header"><div class="school">${state.settings.name.toUpperCase()}</div><div class="tagline">${state.settings.tagline}</div><div class="title">Student Progress Report Card</div></div>
  <div class="grid">
    <div class="box"><div class="label">Student Name</div><div class="val">${student.name}</div></div>
    <div class="box"><div class="label">Roll Number</div><div class="val" style="font-family:monospace">${student.rollNo}</div></div>
    <div class="box"><div class="label">Class</div><div class="val">${myClass?.name}-${myClass?.section}</div></div>
    <div class="box"><div class="label">Class Rank</div><div class="val" style="color:#d97706">#${rank} of ${classStudents.length}</div></div>
  </div>
  <div class="summary">
    <div class="sbox"><div class="sval" style="color:#1e40af">${total}</div><div class="slabel">Total Marks</div><div style="font-size:11px;color:#94a3b8">out of ${validMarks.length*100}</div></div>
    <div class="sbox"><div class="sval" style="color:#0891b2">${avg}%</div><div class="slabel">Average</div></div>
    <div class="sbox"><div class="sval" style="color:${gColor(grade)}">${grade}</div><div class="slabel">Overall Grade</div></div>
  </div>
  <table><thead><tr><th>Code</th><th>Subject</th><th style="text-align:center">Marks</th><th style="text-align:center">Grade</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="gkey"><span>Grade Key:</span><span>S=90–100</span><span>A=75–89</span><span>B=60–74</span><span>C=40–59</span><span>W=Below 40</span></div>
  <div class="footer">Generated on ${new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · ${state.settings.name}</div>
  </body></html>`;

  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,"_blank");
  if(win){ win.onload=()=>{ win.print(); setTimeout(()=>URL.revokeObjectURL(url),2000); }; }
}

// ─── Teacher Timetable PDF Export ─────────────────────────────────────────────
function downloadTeacherTimetablePDF(teacher:Teacher, state:AppState){
  const rows = DAYS.map(day=>{
    const slots = PERIODS.map(p=>{
      const entry = Object.entries(state.timetable).flatMap(([cid,sl])=>sl.filter(s=>s.teacherId===teacher.id&&s.day===day&&s.period===p).map(s=>({...s,classId:cid}))).find(Boolean);
      if(!entry) return `<td style="color:#94a3b8;text-align:center">—</td>`;
      const sub = state.subjects.find(s=>s.id===entry.subjectId);
      const cls = state.classes.find(c=>c.id===entry.classId);
      return `<td style="background:#eff6ff;border-radius:4px;padding:8px 6px;text-align:center"><b style="color:#1e40af">${sub?.code||""}</b><br/><small style="color:#64748b">${cls?.name||""}-${cls?.section||""}</small></td>`;
    });
    return `<tr><td style="font-weight:600;padding:8px 12px">${day}</td>${slots.join("")}</tr>`;
  });
  const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Timetable — ${teacher.name}</title>
  <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;background:#fff;color:#0f172a;padding:32px}h2{font-size:18px;color:#1e40af;margin-bottom:4px}p{font-size:12px;color:#64748b;margin-bottom:20px}table{width:100%;border-collapse:separate;border-spacing:4px}th{background:#1e40af;color:#fff;padding:8px;font-size:11px;text-align:center;border-radius:4px}td{padding:6px;font-size:12px;border:1px solid #e2e8f0}@media print{body{padding:16px}}</style>
  </head><body><h2>${teacher.name}</h2><p>${state.settings.name} — Weekly Timetable</p>
  <table><thead><tr><th>Day</th>${PERIODS.map(p=>`<th>P${p}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></body></html>`;
  const blob=new Blob([html],{type:"text/html"});
  const url=URL.createObjectURL(blob);
  const win=window.open(url,"_blank");
  if(win){ win.onload=()=>{ win.print(); setTimeout(()=>URL.revokeObjectURL(url),2000); }; }
}

// ─── Student Profile Modal ────────────────────────────────────────────────────
function StudentProfileModal({student,state,onSave,onClose}:{student:Student;state:AppState;onSave:(s:Student)=>void;onClose:()=>void}){
  const d=decProfile(student.profile);
  const [form,setForm]=useState({dob:d.dob||"",gender:d.gender||"",phone:d.phone||"",address:d.address||"",parentName:d.parentName||"",parentPhone:d.parentPhone||"",bloodGroup:d.bloodGroup||"",nic:d.nic||""});
  const set=(k:keyof typeof form)=>(v:string)=>setForm(f=>({...f,[k]:v}));
  const cls=state.classes.find(c=>c.id===student.classId);
  const [showIDCard,setShowIDCard]=useState(false);
  function save(){const enc=encProfile(form);onSave({...student,profile:enc});onClose();}
  return(
    <div className="bg-[#080D18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-3 mb-5">
        <img src={student.photo} className="w-12 h-12 rounded-xl border border-white/10"/>
        <div><div className="text-white font-bold">{student.name}</div><div className="text-xs text-white/40">Roll {student.rollNo} · {cls?.name}-{cls?.section}</div></div>
        <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/60 transition-colors"><X size={16}/></button>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2 mb-5"><Shield size={11}/>PII is encrypted before saving</div>
      <div className="grid grid-cols-2 gap-3">
        {([["Date of Birth","dob","date"],["Gender","gender","text"],["Phone","phone","tel"],["Blood Group","bloodGroup","text"],["NIC","nic","text"],["Parent Name","parentName","text"],["Parent Phone","parentPhone","tel"],["Address","address","text"]] as [string,keyof typeof form,string][]).map(([label,key,type])=>(
          <div key={key} className={key==="address"?"col-span-2":""}>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">{label}</label>
            {key==="gender"
              ?<select value={form.gender} onChange={e=>set("gender")(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 bg-[#05080F]"><option value="">–</option><option>Male</option><option>Female</option><option>Other</option></select>
              :key==="bloodGroup"
              ?<select value={form.bloodGroup} onChange={e=>set("bloodGroup")(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 bg-[#05080F]"><option value="">–</option>{BLOOD_GROUPS.map(g=><option key={g}>{g}</option>)}</select>
              :<input type={type} value={form[key]} onChange={e=>set(key)(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"/>
            }
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={()=>setShowIDCard(true)} className="flex items-center gap-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm px-4 py-2.5 rounded-xl transition-colors"><CreditCard size={14}/>ID Card</button>
        <button onClick={onClose} className="flex-1 border border-white/10 text-white/60 text-sm py-2.5 rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"><Save size={14}/>Save Encrypted</button>
      </div>
      {showIDCard&&(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={e=>e.target===e.currentTarget&&setShowIDCard(false)}>
          <StudentIDCard student={student} cls={cls} schoolName={state.settings.name} schoolTagline={state.settings.tagline} onClose={()=>setShowIDCard(false)}/>
        </div>
      )}
    </div>
  );
}

// ─── Student ID Card ─────────────────────────────────────────────────────────
function StudentIDCard({student,cls,schoolName,schoolTagline,onClose}:{student:Student;cls?:{name:string;section:string};schoolName:string;schoolTagline:string;onClose:()=>void}){
  const cardRef = React.useRef<HTMLDivElement>(null);
  const qrData  = encodeURIComponent(`STUDENT:${student.rollNo}:${student.name}`);
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}&bgcolor=0d1117&color=60a5fa&margin=8`;
  const d       = decProfile(student.profile);
  const bloodGroup = d.bloodGroup||"—";

  function downloadCard(){
    // Use browser print in a new window for reliable card download
    const card=cardRef.current;
    if(!card) return;
    const html=`<!DOCTYPE html><html><head><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{background:#0d1117;display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:'Segoe UI',sans-serif}
      .card{width:340px;background:linear-gradient(135deg,#0f1729 0%,#111827 50%,#0d1b2a 100%);border:1px solid rgba(59,130,246,0.3);border-radius:16px;overflow:hidden;color:white}
      .top{background:linear-gradient(135deg,#1e3a5f,#1e40af);padding:16px;display:flex;align-items:center;gap:12px}
      .top .school-name{font-size:14px;font-weight:700;color:white}
      .top .school-tag{font-size:10px;color:rgba(255,255,255,0.6);margin-top:2px}
      .body{padding:20px;display:flex;gap:16px;align-items:flex-start}
      .photo{width:80px;height:80px;border-radius:12px;border:2px solid rgba(59,130,246,0.5);flex-shrink:0;object-fit:cover}
      .info{flex:1}
      .name{font-size:16px;font-weight:700;color:white;margin-bottom:4px}
      .roll{font-size:11px;color:#60a5fa;font-family:monospace;margin-bottom:8px}
      .row{display:flex;justify-content:space-between;font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:3px}
      .row span{color:rgba(255,255,255,0.85);font-weight:500}
      .bottom{padding:12px 20px;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.08)}
      .qr{border-radius:8px;overflow:hidden}
      .badge{background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);border-radius:8px;padding:6px 12px;text-align:center}
      .badge .label{font-size:9px;color:#60a5fa;text-transform:uppercase;letter-spacing:1px}
      .badge .val{font-size:13px;font-weight:700;color:white;margin-top:2px}
      @media print{body{min-height:0}@page{size:340px 240px;margin:0}}
    </style></head><body>
    <div class="card">
      <div class="top">
        <div style="width:36px;height:36px;background:rgba(255,255,255,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🏫</div>
        <div><div class="school-name">${schoolName}</div><div class="school-tag">${schoolTagline}</div></div>
      </div>
      <div class="body">
        <img src="${student.photo}" class="photo"/>
        <div class="info">
          <div class="name">${student.name}</div>
          <div class="roll">Roll No: ${student.rollNo}</div>
          <div class="row">Class <span>${cls?cls.name+"-"+cls.section:"—"}</span></div>
          <div class="row">Blood Group <span>${bloodGroup}</span></div>
          <div class="row">Academic Year <span>${new Date().getFullYear()}</span></div>
        </div>
      </div>
      <div class="bottom">
        <div class="badge"><div class="label">Student ID</div><div class="val">${student.rollNo}</div></div>
        <img src="${qrUrl}" class="qr" width="80" height="80"/>
      </div>
    </div>
    </body></html>`;
    const w=window.open("","_blank","width=400,height=320");
    if(!w) return;
    w.document.write(html);
    w.document.close();
    w.onload=()=>{w.print();};
  }

  return(
    <div className="flex flex-col items-center gap-4" style={{animation:"fadeUp 0.3s ease"}}>
      {/* Live preview card */}
      <div ref={cardRef} style={{width:340,background:"linear-gradient(135deg,#0f1729 0%,#111827 50%,#0d1b2a 100%)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:16,overflow:"hidden",fontFamily:"system-ui,sans-serif"}}>
        {/* Header */}
        <div style={{background:"linear-gradient(135deg,#1e3a5f,#1e40af)",padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:36,height:36,background:"rgba(255,255,255,0.15)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>🏫</div>
          <div><div style={{fontSize:14,fontWeight:700,color:"#fff"}}>{schoolName}</div><div style={{fontSize:10,color:"rgba(255,255,255,0.6)",marginTop:2}}>{schoolTagline}</div></div>
        </div>
        {/* Body */}
        <div style={{padding:"18px 16px",display:"flex",gap:14,alignItems:"flex-start"}}>
          <img src={student.photo} alt="" style={{width:78,height:78,borderRadius:12,border:"2px solid rgba(59,130,246,0.5)",objectFit:"cover",flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:3}}>{student.name}</div>
            <div style={{fontSize:11,color:"#60a5fa",fontFamily:"monospace",marginBottom:8}}>Roll No: {student.rollNo}</div>
            {[["Class",cls?cls.name+"-"+cls.section:"—"],["Blood Group",bloodGroup],["Year",String(new Date().getFullYear())]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:3}}>
                <span style={{color:"rgba(255,255,255,0.45)"}}>{k}</span>
                <span style={{color:"rgba(255,255,255,0.9)",fontWeight:500}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Footer with QR */}
        <div style={{padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
          <div style={{background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.3)",borderRadius:8,padding:"6px 14px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#60a5fa",textTransform:"uppercase",letterSpacing:1}}>Student ID</div>
            <div style={{fontSize:15,fontWeight:700,color:"#fff",marginTop:2,fontFamily:"monospace"}}>{student.rollNo}</div>
          </div>
          <img src={qrUrl} alt="QR" style={{width:80,height:80,borderRadius:8}}/>
        </div>
      </div>
      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={downloadCard} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium"><Download size={14}/>Download / Print ID Card</button>
        <button onClick={onClose} className="border border-white/10 text-white/50 text-sm px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors"><X size={14}/></button>
      </div>
      <p className="text-white/25 text-xs">A print dialog will open. Use "Save as PDF" to download.</p>
    </div>
  );
}

// ─── Teacher Profile Modal ────────────────────────────────────────────────────
function TeacherProfileModal({teacher,state,onSave,onClose}:{teacher:Teacher;state:AppState;onSave:(t:Teacher)=>void;onClose:()=>void}){
  const d=decProfile(teacher.profile);
  const [form,setForm]=useState({dob:d.dob||"",gender:d.gender||"",phone:d.phone||"",address:d.address||"",qualification:d.qualification||"",specialization:d.specialization||"",joinDate:d.joinDate||"",nic:d.nic||""});
  const set=(k:keyof typeof form)=>(v:string)=>setForm(f=>({...f,[k]:v}));
  function save(){const enc=encProfile(form);onSave({...teacher,profile:enc});onClose();}
  return(
    <div className="bg-[#080D18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-white font-bold text-lg">{teacher.name[0]}</div>
        <div><div className="text-white font-bold">{teacher.name}</div><div className="text-xs text-white/40">{teacher.email}</div></div>
        <button onClick={onClose} className="ml-auto text-white/30 hover:text-white/60 transition-colors"><X size={16}/></button>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2 mb-5"><Shield size={11}/>PII is encrypted before saving</div>
      <div className="grid grid-cols-2 gap-3">
        {([["Date of Birth","dob","date"],["Gender","gender","text"],["Phone","phone","tel"],["NIC","nic","text"],["Qualification","qualification","text"],["Specialization","specialization","text"],["Join Date","joinDate","date"],["Address","address","text"]] as [string,keyof typeof form,string][]).map(([label,key,type])=>(
          <div key={key} className={key==="address"?"col-span-2":""}>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1">{label}</label>
            {key==="gender"
              ?<select value={form.gender} onChange={e=>set("gender")(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 bg-[#05080F]"><option value="">–</option><option>Male</option><option>Female</option><option>Other</option></select>
              :<input type={type} value={form[key]} onChange={e=>set(key)(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50"/>
            }
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-5">
        <button onClick={onClose} className="flex-1 border border-white/10 text-white/60 text-sm py-2.5 rounded-xl hover:bg-white/5 transition-colors">Cancel</button>
        <button onClick={save} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"><Save size={14}/>Save Encrypted</button>
      </div>
    </div>
  );
}

// ─── Subject Performance Bar Chart (no external lib) ─────────────────────────
function SubjectChart({state,classId}:{state:AppState;classId:string}) {
  const subjects = state.subjects.filter(s=>s.classIds.includes(classId));
  const students = state.students.filter(s=>s.classId===classId);
  const COLORS   = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4"];

  if(!subjects.length||!students.length)
    return<div className="text-center text-white/20 text-sm py-10">No data</div>;

  const data = subjects.map((sub,i)=>{
    const marks=students.map(st=>st.marks[sub.id]).filter(m=>m!==undefined) as number[];
    const avg=marks.length?Math.round(marks.reduce((a,b)=>a+b,0)/marks.length):0;
    return{label:sub.code,name:sub.name,avg,color:COLORS[i%COLORS.length]};
  });

  return(
    <div>
      {/* Bar chart */}
      <div className="flex items-end gap-3 h-36 border-b border-white/10 px-2 mb-3">
        {data.map(d=>(
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end group relative">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0f172a] border border-white/10 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap z-10 pointer-events-none shadow-xl">
              {d.name}: <span className="font-bold text-blue-300">{d.avg}%</span>
            </div>
            <div className="text-[10px] text-white/50 mb-1 font-mono">{d.avg}</div>
            <div className="w-full rounded-t-md transition-all duration-700 min-h-[4px]"
              style={{height:`${(d.avg/100)*112}px`,background:`linear-gradient(to top,${d.color}99,${d.color})`,boxShadow:`0 0 16px ${d.color}40`}}
            />
          </div>
        ))}
      </div>
      {/* X labels */}
      <div className="flex gap-3 px-2 mb-4">
        {data.map(d=><div key={d.label} className="flex-1 text-center text-[10px] font-mono text-white/40">{d.label}</div>)}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {data.map(d=>(
          <div key={d.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:d.color}}/>
            <span className="text-[10px] text-white/40">{d.name}</span>
          </div>
        ))}
      </div>
      {/* Student mini-bars */}
      <div className="border-t border-white/5 pt-4">
        <div className="text-xs text-white/30 mb-3 uppercase tracking-wider">Individual Breakdown</div>
        {students.map(st=>(
          <div key={st.id} className="mb-3 last:mb-0">
            <div className="flex items-center gap-2 mb-1.5">
              <img src={st.photo} className="w-5 h-5 rounded-full flex-shrink-0"/>
              <span className="text-xs text-white/60">{st.name}</span>
            </div>
            <div className="flex gap-1">
              {subjects.map((sub,i)=>{
                const m=st.marks[sub.id];
                return(
                  <div key={sub.id} className="flex-1 relative group">
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${m??0}%`,background:COLORS[i%COLORS.length]}}/>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#0f172a] border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white whitespace-nowrap z-10 pointer-events-none">
                      {sub.code}: {m??'–'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Marksheet (Admin + Class Teacher) ─────────────────────────────────
function MarksheetView({state,classId,onClassChange,availableClasses}:
  {state:AppState;classId:string;onClassChange:(id:string)=>void;availableClasses:Class[]}) {
  const results = getResults(state,classId);
  const subs    = state.subjects.filter(s=>s.classIds.includes(classId));
  const cls     = state.classes.find(c=>c.id===classId);
  return(
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select value={classId} onChange={e=>onClassChange(e.target.value)}
          className="bg-[#080D18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50">
          {availableClasses.map(c=><option key={c.id} value={c.id}>Class {c.name}-{c.section}</option>)}
        </select>
      </div>
      <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-4 py-3 text-center border-b border-white/5">
          <div className="text-white font-bold">{state.settings.name}</div>
          <div className="text-white/30 text-xs">{state.settings.tagline} — Class {cls?.name}-{cls?.section} Marksheet</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b border-white/5">
              <th className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">Rank</th>
              <th className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">Student</th>
              {subs.map(s=><th key={s.id} className="text-center text-xs font-semibold text-white/40 uppercase px-3 py-3">{s.code}</th>)}
              <th className="text-center text-xs font-semibold text-white/40 uppercase px-4 py-3">Total</th>
              <th className="text-center text-xs font-semibold text-white/40 uppercase px-4 py-3">Avg</th>
              <th className="text-center text-xs font-semibold text-white/40 uppercase px-4 py-3">Grade</th>
            </tr></thead>
            <tbody>{results.sort((a,b)=>a.rank-b.rank).map(r=>(
              <tr key={r.student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3"><span className={`font-mono font-bold ${r.rank===1?"text-yellow-400":r.rank===2?"text-gray-300":r.rank===3?"text-orange-400":"text-white/40"}`}>#{r.rank}</span></td>
                <td className="px-4 py-3"><div className="flex items-center gap-2"><img src={r.student.photo} className="w-7 h-7 rounded-full"/><div><div className="text-sm text-white">{r.student.name}</div><div className="text-xs text-white/30 font-mono">{r.student.rollNo}</div></div></div></td>
                {subs.map((s,i)=><td key={s.id} className="px-3 py-3 text-center"><span className={`font-mono text-sm ${r.scores[i]===null?"text-white/20":r.scores[i]!>=75?"text-emerald-400":r.scores[i]!>=40?"text-yellow-400":"text-red-400"}`}>{r.scores[i]??'–'}</span></td>)}
                <td className="px-4 py-3 text-center font-mono text-sm text-white font-bold">{r.total}</td>
                <td className="px-4 py-3 text-center font-mono text-sm text-white/60">{r.avg}%</td>
                <td className="px-4 py-3 text-center"><span className={`font-mono font-bold text-lg ${gradeColor(r.grade)}`}>{r.grade}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
        <div className="px-5 pb-5"><GradeKey /></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({state,db,onLogin,onRegister,onBack}:{state:AppState;db:DbOps;onLogin:(u:LoggedInUser)=>void;onRegister:()=>void;onBack?:()=>void}) {
  const [role,setRole]   = useState<Role>("student");
  const [id,setId]       = useState("");
  const [pass,setPass]   = useState("");
  const [show,setShow]   = useState(false);
  const [error,setError] = useState("");
  const [load,setLoad]   = useState(false);

  async function handleLogin(){
    setError(""); setLoad(true);
    try {
      if(role==="admin"){
        // 1. Try Supabase users table first
        if(sb.isConfigured()){
          const rows = await sb.select<any>("users", `username=eq.${encodeURIComponent(id)}&role=eq.admin`);
          if(rows.length && rows[0].password_hash === pass){
            onLogin({role:"admin",id:"admin",name:rows[0].display_name||"Administrator"});
            return;
          }
        }
        // 2. Fallback: hardcoded master admin (username: admin, password from settings)
        if(id==="admin" && pass===state.settings.pwAdmin){
          onLogin({role:"admin",id:"admin",name:"Administrator"});
        } else {
          setError("Invalid admin credentials");
        }
      } else if(role==="support_admin"){
        // Try Supabase users table, then fallback to local supportAdmins
        if(sb.isConfigured()){
          const rows = await sb.select<any>("users", `username=eq.${encodeURIComponent(id)}&role=eq.support_admin`);
          if(rows.length && rows[0].password_hash === pass){
            onLogin({role:"support_admin",id:rows[0].id,name:rows[0].display_name||id});
            return;
          }
        }
        const sa=state.supportAdmins.find(s=>s.email===id&&s.password===pass);
        if(sa) onLogin({role:"support_admin",id:sa.id,name:sa.name}); else setError("Invalid credentials");
      } else if(role==="teacher"){
        const t=state.teachers.find(t=>t.email===id&&t.password===pass);
        if(!t){ setError("Invalid email or password"); }
        else if(t.status==="pending"){ setError("Your account is pending admin approval."); }
        else { onLogin({role:"teacher",id:t.id,name:t.name}); }
      } else {
        const s=state.students.find(s=>s.rollNo===id&&s.password===pass);
        if(!s){ setError("Invalid roll number or password"); }
        else if(s.status==="pending"){ setError("Your account is pending admin approval."); }
        else { onLogin({role:"student",id:s.id,name:s.name}); }
      }
    } finally {
      setLoad(false);
    }
  }

  const placeholders:Record<Role,string>={admin:"Username",support_admin:"Email address",teacher:"Email address",student:"Roll Number (e.g. 0001)"};

  return(
    <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4 font-mono">
      <div className="fixed inset-0 opacity-[0.03]" style={{backgroundImage:"linear-gradient(#3B82F6 1px,transparent 1px),linear-gradient(90deg,#3B82F6 1px,transparent 1px)",backgroundSize:"40px 40px"}}/>
      <div className="fixed inset-0" style={{background:"radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.08) 0%, transparent 60%)"}}/>
      <div className="relative w-full max-w-md" style={{animation:"fadeUp 0.4s ease forwards"}}>
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4 overflow-hidden">
            {state.settings.logoUrl
              ? <img src={state.settings.logoUrl} className="w-full h-full object-cover"/>
              : <School size={28} className="text-blue-400"/>}
          </div>
          <h1 className="text-2xl font-bold text-white">{state.settings.name}</h1>
          <p className="text-white/30 text-sm mt-1">School Management System</p>
        </div>
        <div className="flex gap-1 mb-5 bg-[#080D18] border border-white/5 rounded-xl p-1">
          {(["student","teacher","admin","support_admin"] as Role[]).map(r=>(
            <button key={r} onClick={()=>{setRole(r);setId("");setPass("");setError("");}}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all px-1 ${role===r?"bg-blue-600 text-white shadow-lg shadow-blue-500/20":"text-white/40 hover:text-white/60"}`}>
              {r==="support_admin"?"Support":r[0].toUpperCase()+r.slice(1)}
            </button>
          ))}
        </div>
        <div className="bg-[#080D18] border border-white/5 rounded-2xl p-6 space-y-4">
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">{role==="admin"?"Username":role==="student"?"Roll Number":"Email"}</label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
              <input value={id} onChange={e=>{setId(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder={placeholders[role]}
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-4 py-3 outline-none focus:border-blue-500/50 placeholder-white/20"/>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
              <input type={show?"text":"password"} value={pass} onChange={e=>{setPass(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Enter password"
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl pl-9 pr-10 py-3 outline-none focus:border-blue-500/50 placeholder-white/20"/>
              <button onClick={()=>setShow(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">{show?<EyeOff size={14}/>:<Eye size={14}/>}</button>
            </div>
          </div>
          {error&&<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"><AlertCircle size={13} className="text-red-400 flex-shrink-0"/><span className="text-xs text-red-400">{error}</span></div>}
          <button onClick={handleLogin} disabled={load}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm py-3 rounded-xl transition-all font-medium flex items-center justify-center gap-2 mt-1">
            {load&&<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
            {load?"Signing in...":"Sign In"}
          </button>
          {/* Register button */}
          <button onClick={onRegister}
            className="w-full border border-white/10 hover:border-blue-500/30 text-white/50 hover:text-blue-400 text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 hover:bg-blue-500/5">
            <UserPlus size={14}/>New User? Register Here
          </button>
        </div>
        {/* Blog link */}
        {onBack&&(
          <div className="mt-4 text-center">
            <button onClick={onBack} className="inline-flex items-center gap-2 text-xs text-white/30 hover:text-blue-400 transition-colors border border-white/5 hover:border-blue-500/20 px-4 py-2.5 rounded-xl bg-white/3 hover:bg-blue-500/5">
              <ChevronRight size={12} className="rotate-180"/>Back to Website
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════
function Layout({user,state,children,navItems,activeTab,setTab,onLogout}:
  {user:LoggedInUser;state:AppState;children:React.ReactNode;navItems:{id:string;label:string;icon:any;badge?:number}[];activeTab:string;setTab:(t:string)=>void;onLogout:()=>void}) {

  // Desktop: collapsed (icon-only) vs expanded
  const [open,setOpen]         = useState(true);
  // Mobile: sidebar drawer open / closed
  const [mobileOpen,setMobileOpen] = useState(false);

  const roleColors:Record<string,string>={
    admin:         "bg-blue-500/20 text-blue-400",
    support_admin: "bg-cyan-500/20 text-cyan-400",
    teacher:       "bg-purple-500/20 text-purple-400",
    student:       "bg-emerald-500/20 text-emerald-400",
  };

  // Close mobile drawer when a nav item is tapped
  function handleNavClick(id:string){
    setTab(id);
    setMobileOpen(false);
  }

  // Sidebar inner content — shared between desktop and mobile drawer
  function SidebarContent({forMobile=false}:{forMobile?:boolean}){
    const showLabels = forMobile || open; // mobile always shows labels; desktop respects `open`
    return(
      <>
        {/* Logo / school name */}
        <div className="px-4 py-5 border-b border-white/5 flex items-center gap-3 min-h-[64px]">
          {state.settings.logoUrl
            ?<img src={state.settings.logoUrl} className="w-8 h-8 rounded-lg object-cover flex-shrink-0"/>
            :<div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0"><School size={15} className="text-blue-400"/></div>}
          {showLabels&&<div className="overflow-hidden">
            <div className="text-xs font-bold text-white leading-tight truncate">{state.settings.name}</div>
            <div className="text-[10px] text-white/30 truncate">{state.settings.tagline}</div>
          </div>}
          {/* Close button — mobile only */}
          {forMobile&&(
            <button onClick={()=>setMobileOpen(false)} className="ml-auto text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5">
              <X size={16}/>
            </button>
          )}
        </div>

        {/* User badge */}
        {showLabels&&(
          <div className="px-3 py-3 border-b border-white/5">
            <div className="flex items-center gap-2 bg-white/3 rounded-xl px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 flex items-center justify-center text-[10px] text-white font-bold flex-shrink-0">{user.name[0]}</div>
              <div className="overflow-hidden flex-1">
                <div className="text-xs text-white truncate">{user.name}</div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${roleColors[user.role]}`}>{user.role}</span>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(n=>{
            const active=activeTab===n.id;
            return(
              <button key={n.id}
                onClick={()=>handleNavClick(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${active?"bg-blue-600/20 text-blue-300 border border-blue-500/20":"text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
                <div className="relative flex-shrink-0">
                  <n.icon size={15}/>
                  {(n.badge??0)>0&&(
                    <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center leading-none">
                      {(n.badge??0)>9?"9+":n.badge}
                    </span>
                  )}
                </div>
                {showLabels&&<span className="text-xs font-medium truncate flex-1">{n.label}</span>}
                {showLabels&&(n.badge??0)>0&&(
                  <span className="ml-auto bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {n.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer: sign out + desktop collapse toggle */}
        <div className="p-2 border-t border-white/5 space-y-1">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={14} className="flex-shrink-0"/>
            {showLabels&&<span className="text-xs">Sign Out</span>}
          </button>
          {/* Desktop collapse button — hidden on mobile drawer */}
          {!forMobile&&(
            <button onClick={()=>setOpen(o=>!o)} className="w-full flex items-center justify-center p-2 text-white/20 hover:text-white/50 transition-colors rounded-lg hover:bg-white/5">
              <ChevronRight size={14} className={`transition-transform ${open?"rotate-180":""}`}/>
            </button>
          )}
        </div>
      </>
    );
  }

  return(
    <div className="flex h-screen overflow-hidden bg-[#05080F] font-mono">

      {/* ── DESKTOP SIDEBAR (md and above, permanent) ── */}
      <aside className={`hidden md:flex ${open?"w-56":"w-16"} flex-shrink-0 bg-[#080D18] border-r border-white/5 flex-col transition-all duration-200`}>
        <SidebarContent/>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY (below md) ── */}
      {/* Backdrop */}
      {mobileOpen&&(
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={()=>setMobileOpen(false)}
        />
      )}
      {/* Drawer */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 z-50
        bg-[#080D18] border-r border-white/5
        flex flex-col
        transition-transform duration-300 ease-in-out
        md:hidden
        ${mobileOpen?"translate-x-0":"-translate-x-full"}
      `}>
        <SidebarContent forMobile/>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-16 bg-[#080D18] border-b border-white/5 flex items-center justify-between px-4 md:px-6 flex-shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={()=>setMobileOpen(true)}
              className="md:hidden flex-shrink-0 p-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
              aria-label="Open menu"
            >
              <Menu size={18}/>
            </button>
            {/* School logo — mobile only, shows when sidebar is hidden */}
            <div className="md:hidden flex-shrink-0">
              {state.settings.logoUrl
                ? <img src={state.settings.logoUrl} className="w-7 h-7 rounded-lg object-cover"/>
                : <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center"><School size={13} className="text-blue-400"/></div>
              }
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white capitalize truncate">{navItems.find(n=>n.id===activeTab)?.label}</div>
              <div className="text-xs text-white/30 hidden sm:block">{new Date().toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {(user.role==="admin"||user.role==="support_admin")&&(
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full">
                <Shield size={11}/>PII Encrypted
              </div>
            )}
            <Bell size={16} className="text-white/30 hover:text-white/60 cursor-pointer transition-colors"/>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6" key={activeTab} style={{animation:"fadeUp 0.2s ease forwards"}}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function AdminView({user,state,setState,onLogout,isSA,db}:
  {user:LoggedInUser;state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;onLogout:()=>void;isSA?:boolean;db:DbOps}) {

  const [tab,setTab]           = useState("dashboard");
  const [popup,setPopup]       = useState<{type:string;data?:any}|null>(null);
  const [lu,setLU]             = useState(false);
  const [lpin,setLP]           = useState("");
  const [lerr,setLE]           = useState(false);
  const [qrIn,setQrIn]         = useState("");
  const [qrOk,setQrOk]         = useState<Student|null>(null);
  const [sc,setSC]             = useState(state.classes[0]?.id||"");
  const [ss,setSS]             = useState(state.subjects[0]?.id||"");
  const [me,setME]             = useState<Record<string,string>>({});
  const [dashCls,setDashCls]   = useState(state.classes[0]?.id||"");
  const [adminSearch,setAS]    = useState("");
  const [csvMsg,setCsvMsg]     = useState("");
  const [editSt,setEditSt]     = useState<Student|null>(null);
  const [editTch,setEditTch]   = useState<Teacher|null>(null);
  const upd = setState;

  const pendingCount = state.students.filter(s=>s.status==="pending").length
                     + state.teachers.filter(t=>t.status==="pending").length;

  const NAV=[
    {id:"dashboard",        label:"Dashboard",        icon:Grid3X3},
    {id:"approvals",        label:"Approvals",        icon:ClipboardCheck, badge:pendingCount},
    {id:"classes",          label:"Classes",          icon:School},
    {id:"subjects",         label:"Subjects",         icon:BookOpen},
    {id:"teachers",         label:"Teachers",         icon:GraduationCap},
    {id:"students",         label:"Students",         icon:Users},
    {id:"marks",            label:"Marks Entry",      icon:Award},
    {id:"timetable",        label:"Timetable",        icon:Clock},
    {id:"attendance",       label:"QR Attendance",    icon:QrCode},
    {id:"ledger",           label:"Result Ledger",    icon:BarChart3},
    {id:"counseling",       label:"Counseling",       icon:HeartHandshake},
    {id:"behavior",         label:"Behavior",         icon:AlertTriangle},
    {id:"fees",             label:"Fees & Finance",   icon:DollarSign},
    {id:"inventory",        label:"Inventory",        icon:Package},
    {id:"website",          label:"Website CMS",      icon:Globe},
    {id:"manage_staff",     label:"Manage Staff",     icon:Users2},
    {id:"manage_downloads", label:"Manage Downloads", icon:Download},
    {id:"settings",         label:"Settings",         icon:Settings},
  ];

  function importStudentsCSV(text:string){
    const rows=parseCSV(text);
    const ns:Student[]=rows.map(r=>{
      if(!r.name||!r.rollno) return null;
      const cid=state.classes.find(c=>c.name===r.class&&c.section===r.section)?.id||state.classes[0]?.id||"";
      return{id:uid(),name:r.name,rollNo:r.rollno,classId:cid,
        photo:`https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`,marks:{},password:r.password||"changeme",
        profile:encProfile({dob:r.dob||"",gender:r.gender||"",phone:r.phone||"",address:r.address||"",parentName:r.parent_name||"",parentPhone:r.parent_phone||"",bloodGroup:r.blood_group||"",nic:""})} as Student;
    }).filter(Boolean) as Student[];
    if(!ns.length){setCsvMsg("No valid rows. Required columns: name, rollno"); return;}
    const newOnes=ns.filter(n=>!state.students.find(x=>x.rollNo===n.rollNo));
    newOnes.forEach(s=>db.addStudent(s));
    setCsvMsg(`✓ Imported ${newOnes.length} students successfully`);
  }
  function importTeachersCSV(text:string){
    const rows=parseCSV(text);
    const nt:Teacher[]=rows.map(r=>{
      if(!r.name||!r.email) return null;
      return{id:uid(),name:r.name,email:r.email,subjectIds:[],classIds:[],password:r.password||"changeme",
        profile:encProfile({dob:r.dob||"",gender:r.gender||"",phone:r.phone||"",address:r.address||"",qualification:r.qualification||"",specialization:r.specialization||"",joinDate:r.join_date||r.joindate||"",nic:r.nic||""})} as Teacher;
    }).filter(Boolean) as Teacher[];
    if(!nt.length){setCsvMsg("No valid rows. Required columns: name, email"); return;}
    const newOnes=nt.filter(n=>!state.teachers.find(x=>x.email===n.email));
    newOnes.forEach(t=>db.addTeacher(t));
    setCsvMsg(`✓ Imported ${newOnes.length} teachers successfully`);
  }
  function importTimetableCSV(text:string){
    const rows=parseCSV(text); let count=0;
    rows.forEach(r=>{
      const cls=state.classes.find(c=>c.name===r.class&&c.section===r.section);
      const sub=state.subjects.find(s=>s.code===r.subject_code||s.name.toLowerCase()===r.subject?.toLowerCase());
      const tch=state.teachers.find(t=>t.email===r.teacher_email||t.name===r.teacher_name);
      const period=parseInt(r.period);
      if(cls&&sub&&r.day&&!isNaN(period)){
        count++;
        upd(s=>({...s,timetable:{...s.timetable,[cls.id]:[...(s.timetable[cls.id]||[]).filter(x=>!(x.day===r.day&&x.period===period)),{day:r.day,period,subjectId:sub.id,teacherId:tch?.id||""}]}}));
      }
    });
    setCsvMsg(count?`✓ Imported ${count} timetable slots`:"No valid rows. Required: class,section,day,period,subject_code");
  }

  function scanQr(){
    const s=state.students.find(s=>s.rollNo===qrIn.trim());
    if(!s)return;
    upd(st=>({...st,attendance:{...st.attendance,[today]:{...(st.attendance[today]||{}),[s.rollNo]:true}}}));
    setQrOk(s);setQrIn("");setTimeout(()=>setQrOk(null),3000);
  }

  function renderTab(){
    switch(tab){

      case "dashboard": return(
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Admin Dashboard</h2>

          {/* ── Pending Approvals Banner ── */}
          {(()=>{
            const pendingStudents=state.students.filter(s=>s.status==="pending");
            const pendingTeachers=state.teachers.filter(t=>t.status==="pending");
            const total=pendingStudents.length+pendingTeachers.length;
            if(!total) return null;
            return(
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <Bell size={16} className="text-amber-400"/>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-300">Pending Approvals</div>
                    <div className="text-xs text-amber-400/70">{total} account{total!==1?"s":""} awaiting your review</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {[...pendingTeachers.map(t=>({...t,_role:"Teacher" as const})),...pendingStudents.map(s=>({...s,_role:"Student" as const}))].map(u=>(
                    <div key={u.id} className="flex items-center gap-3 bg-[#080D18] border border-white/5 rounded-xl px-4 py-3">
                      <img src={"photo" in u ? u.photo : `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} className="w-8 h-8 rounded-full flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{u.name}</div>
                        <div className="text-xs text-white/40">{u._role} {"rollNo" in u?`· Roll ${u.rollNo}`:("email" in u?`· ${u.email}`:"")}</div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={()=>{
                          if(u._role==="Teacher") upd(s=>({...s,teachers:s.teachers.map(t=>t.id===u.id?{...t,status:"approved" as const}:t)}));
                          else upd(s=>({...s,students:s.students.map(st=>st.id===u.id?{...st,status:"approved" as const}:st)}));
                        }} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium">
                          <Check size={11}/>Approve
                        </button>
                        <button onClick={()=>{
                          if(u._role==="Teacher") upd(s=>({...s,teachers:s.teachers.filter(t=>t.id!==u.id)}));
                          else upd(s=>({...s,students:s.students.filter(st=>st.id!==u.id)}));
                        }} className="flex items-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs px-3 py-1.5 rounded-lg transition-colors">
                          <X size={11}/>Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:"Students",value:state.students.length,icon:Users,         color:"from-blue-500/20 to-blue-600/5",    border:"border-blue-500/30"},
              {label:"Teachers",value:state.teachers.length,icon:GraduationCap, color:"from-purple-500/20 to-purple-600/5",border:"border-purple-500/30"},
              {label:"Classes", value:state.classes.length, icon:School,        color:"from-emerald-500/20 to-emerald-600/5",border:"border-emerald-500/30"},
              {label:"Subjects",value:state.subjects.length,icon:BookOpen,      color:"from-orange-500/20 to-orange-600/5",border:"border-orange-500/30"},
            ].map(c=>(
              <div key={c.label} className={`bg-gradient-to-br ${c.color} border ${c.border} rounded-xl p-5`}>
                <c.icon size={18} className="text-white/50 mb-3"/>
                <div className="text-3xl font-bold text-white">{c.value}</div>
                <div className="text-xs text-white/40 mt-1">{c.label}</div>
              </div>
            ))}
          </div>

          {/* ✅ Subject-wise Performance Chart */}
          <div className="bg-[#080D18] border border-white/5 rounded-xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-white">Subject-wise Performance</h3>
                <p className="text-xs text-white/30 mt-0.5">Average marks per subject — hover bars for details</p>
              </div>
              <select value={dashCls} onChange={e=>setDashCls(e.target.value)}
                className="bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500/50">
                {state.classes.map(c=><option key={c.id} value={c.id}>Class {c.name}-{c.section}</option>)}
              </select>
            </div>
            <SubjectChart state={state} classId={dashCls}/>
          </div>

          {/* Today attendance summary */}
          <div className="bg-[#080D18] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Today's Attendance</h3>
            <div className="space-y-2">
              {state.students.map(s=>{
                const present=state.attendance[today]?.[s.rollNo];
                return(
                  <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                    <div className="flex items-center gap-2"><img src={s.photo} className="w-7 h-7 rounded-full"/><span className="text-sm text-white">{s.name}</span></div>
                    <span className={`text-xs px-2 py-1 rounded-full font-mono ${present?"bg-emerald-500/20 text-emerald-400":"bg-red-500/10 text-red-400/60"}`}>{present?"Present":"Absent"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

      case "approvals": {
        const pendingS=state.students.filter(s=>s.status==="pending");
        const pendingT=state.teachers.filter(t=>t.status==="pending");
        const all=[
          ...pendingT.map(t=>({...t,_role:"Teacher" as const,_id:t.email})),
          ...pendingS.map(s=>({...s,_role:"Student" as const,_id:s.rollNo})),
        ];
        return(
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Pending Approvals</h2>
                <p className="text-white/30 text-xs mt-0.5">Review and approve new registration requests.</p>
              </div>
              {all.length>0&&(
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-full">
                  {all.length} pending
                </span>
              )}
            </div>
            {all.length===0?(
              <div className="bg-[#080D18] border border-white/5 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check size={24} className="text-emerald-400"/>
                </div>
                <div className="text-white font-semibold mb-1">All clear!</div>
                <div className="text-white/30 text-sm">No pending registration requests.</div>
              </div>
            ):(
              <div className="space-y-3">
                {all.map(u=>(
                  <div key={u.id} className="bg-[#080D18] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <img
                      src={"photo" in u?u.photo:`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                      className="w-12 h-12 rounded-full flex-shrink-0 bg-white/5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{u.name}</div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${u._role==="Teacher"?"bg-purple-500/20 text-purple-400 border-purple-500/30":"bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                          {u._role}
                        </span>
                        <span className="text-xs text-white/30">{u._id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Pending</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={()=>{
                          if(u._role==="Teacher") upd(s=>({...s,teachers:s.teachers.map(t=>t.id===u.id?{...t,status:"approved" as const}:t)}));
                          else upd(s=>({...s,students:s.students.map(st=>st.id===u.id?{...st,status:"approved" as const}:st)}));
                        }}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-xl transition-colors font-medium">
                        <Check size={12}/>Approve
                      </button>
                      <button
                        onClick={()=>{
                          if(u._role==="Teacher") upd(s=>({...s,teachers:s.teachers.filter(t=>t.id!==u.id)}));
                          else upd(s=>({...s,students:s.students.filter(st=>st.id!==u.id)}));
                        }}
                        className="flex items-center gap-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs px-4 py-2 rounded-xl transition-colors">
                        <X size={12}/>Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case "classes": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Class Management</h2>
            {!isSA&&<button onClick={()=>setPopup({type:"addClass"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"><Plus size={14}/>Add Class</button>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.classes.map(cls=>{
              const teacher=state.teachers.find(t=>t.id===cls.teacherId);
              const sc2=state.students.filter(s=>s.classId===cls.id).length;
              const sub=state.subjects.filter(s=>s.classIds.includes(cls.id)).length;
              return(
                <div key={cls.id} className="bg-[#080D18] border border-white/5 rounded-xl p-5 hover:border-blue-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><span className="text-base font-bold text-blue-400">{cls.name}{cls.section}</span></div>
                    {!isSA&&<button onClick={()=>upd(s=>({...s,classes:s.classes.filter(c=>c.id!==cls.id)}))} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14}/></button>}
                  </div>
                  <div className="text-white font-semibold">Class {cls.name} – {cls.section}</div>
                  <div className="text-xs text-white/40 mt-1">Class Teacher: {teacher?.name||"Unassigned"}</div>
                  <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                    <div className="text-center"><div className="text-xl font-bold text-white">{sc2}</div><div className="text-xs text-white/30">Students</div></div>
                    <div className="text-center"><div className="text-xl font-bold text-white">{sub}</div><div className="text-xs text-white/30">Subjects</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

      case "subjects": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Subject Management</h2>
            <button onClick={()=>setPopup({type:"addSubject"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"><Plus size={14}/>Add Subject</button>
          </div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">{["Code","Subject","Classes","Teacher",""].map(h=><th key={h} className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>{state.subjects.map(sub=>{
                const teacher=state.teachers.find(t=>t.id===sub.teacherId);
                const classes=state.classes.filter(c=>sub.classIds.includes(c.id));
                return(
                  <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3"><span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{sub.code}</span></td>
                    <td className="px-4 py-3 text-sm text-white">{sub.name}</td>
                    <td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{classes.map(c=><span key={c.id} className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">{c.name}-{c.section}</span>)}</div></td>
                    <td className="px-4 py-3 text-sm text-white/60">{teacher?.name||"–"}</td>
                    <td className="px-4 py-3"><button onClick={()=>upd(s=>({...s,subjects:s.subjects.filter(x=>x.id!==sub.id)}))} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={14}/></button></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      );

      case "teachers": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-white">Teacher Management</h2>
            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors">
                <Upload size={12}/>Bulk CSV
                <input type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{importTeachersCSV(ev.target?.result as string);e.target.value="";};r.readAsText(f);}}/>
              </label>
              <button onClick={()=>downloadCSV("teachers_template.csv",[["name","email","password","dob","gender","phone","address","qualification","specialization","join_date","nic"],["John Smith","john@school.edu","pass123","1985-04-12","Male","+1234567890","123 Main St","B.Ed Mathematics","Mathematics","2020-01-15","NIC123456"]])} className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-blue-400 hover:border-blue-500/30 text-xs px-3 py-2 rounded-lg transition-colors"><Download size={12}/>Example CSV</button>
              {!isSA&&<button onClick={()=>setPopup({type:"addTeacher"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"><Plus size={14}/>Add Teacher</button>}
            </div>
          </div>
          {csvMsg&&<div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5"><CheckCircle size={12}/><span className="flex-1">{csvMsg}</span><button onClick={()=>setCsvMsg("")} className="text-white/30 hover:text-white/60"><X size={11}/></button></div>}
          <div className="text-[10px] text-white/30 bg-white/3 border border-white/5 rounded-lg px-3 py-2">CSV columns: <span className="font-mono text-white/50">name, email, password, dob, gender, phone, address, qualification, specialization, join_date, nic</span></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {state.teachers.map(t=>{
              const subs=state.subjects.filter(s=>t.subjectIds.includes(s.id));
              const cls=state.classes.filter(c=>t.classIds.includes(c.id));
              const ownCls=state.classes.filter(c=>c.teacherId===t.id);
              const d=decProfile(t.profile);
              return(
                <div key={t.id} className="bg-[#080D18] border border-white/5 rounded-xl p-5 hover:border-blue-500/20 transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center text-white font-bold">{t.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold">{t.name}</div>
                      <div className="text-xs text-white/40">{t.email}</div>
                      {d.phone&&<div className="text-xs text-white/25 flex items-center gap-1 mt-0.5"><Phone size={9}/>{d.phone}</div>}
                    </div>
                    <div className="flex gap-1.5 ml-auto">
                      <button onClick={()=>setEditTch(t)} className="text-white/20 hover:text-blue-400 transition-colors p-1" title="Edit Profile"><User size={13}/></button>
                      {!isSA&&<button onClick={()=>db.deleteTeacher(t.id)} className="text-white/20 hover:text-red-400 transition-colors p-1"><Trash2 size={14}/></button>}
                    </div>
                  </div>
                  {ownCls.length>0&&<div className="mb-3"><span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Class Teacher: {ownCls.map(c=>`${c.name}-${c.section}`).join(", ")}</span></div>}
                  {(d.qualification||d.specialization)&&<div className="text-xs text-white/30 mb-2">{d.qualification}{d.specialization&&` · ${d.specialization}`}</div>}
                  <div className="space-y-2">
                    <div><div className="text-xs text-white/30 mb-1">Subjects</div><div className="flex gap-1 flex-wrap">{subs.map(s=><span key={s.id} className="text-xs font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">{s.code}</span>)}</div></div>
                    <div><div className="text-xs text-white/30 mb-1">Classes</div><div className="flex gap-1 flex-wrap">{cls.map(c=><span key={c.id} className="text-xs bg-white/5 text-white/50 px-2 py-0.5 rounded">{c.name}-{c.section}</span>)}</div></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );

      case "students": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-white">Student Management</h2>
            <div className="flex gap-2 flex-wrap">
              <label className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors">
                <Upload size={12}/>Bulk CSV
                <input type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{importStudentsCSV(ev.target?.result as string);e.target.value="";};r.readAsText(f);}}/>
              </label>
              <button onClick={()=>downloadCSV("students_template.csv",[["name","rollno","class","section","password","dob","gender","phone","address","parent_name","parent_phone","blood_group"],["Aditya Kumar","0005","9","A","pass123","2009-05-14","Male","+1234567890","45 Park Ave","Raj Kumar","+1234567891","A+"]])} className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-blue-400 hover:border-blue-500/30 text-xs px-3 py-2 rounded-lg transition-colors"><Download size={12}/>Example CSV</button>
              <button onClick={()=>setPopup({type:"addStudent"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"><Plus size={14}/>Add Student</button>
            </div>
          </div>
          {csvMsg&&<div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5"><CheckCircle size={12}/><span className="flex-1">{csvMsg}</span><button onClick={()=>setCsvMsg("")} className="text-white/30 hover:text-white/60"><X size={11}/></button></div>}
          <div className="text-[10px] text-white/30 bg-white/3 border border-white/5 rounded-lg px-3 py-2">CSV columns: <span className="font-mono text-white/50">name, rollno, class, section, password, dob, gender, phone, address, parent_name, parent_phone, blood_group</span></div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">{["","Roll","Name","Class","Profile",""].map((h,i)=><th key={i} className="text-left text-xs font-semibold text-white/40 uppercase tracking-wider px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>{state.students.map(st=>{
                const cls=state.classes.find(c=>c.id===st.classId);
                const d=decProfile(st.profile);
                return(
                  <tr key={st.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3"><img src={st.photo} className="w-8 h-8 rounded-full bg-white/10"/></td>
                    <td className="px-4 py-3 font-mono text-xs text-white/40">{st.rollNo}</td>
                    <td className="px-4 py-3 text-sm text-white">{st.name}</td>
                    <td className="px-4 py-3 text-sm text-white/60">{cls?`${cls.name}-${cls.section}`:"–"}</td>
                    <td className="px-4 py-3"><div className="flex gap-2 text-xs">{d.bloodGroup&&<span className="bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded font-mono">{d.bloodGroup}</span>}{d.phone&&<span className="text-white/30 flex items-center gap-0.5"><Phone size={9}/>{d.phone}</span>}</div></td>
                    <td className="px-4 py-3"><div className="flex gap-1.5">
                      <button onClick={()=>setEditSt(st)} className="text-white/20 hover:text-blue-400 transition-colors p-1" title="Edit Profile"><User size={13}/></button>
                      {!isSA&&<button onClick={()=>db.deleteStudent(st.id)} className="text-white/20 hover:text-red-400 transition-colors p-1"><Trash2 size={14}/></button>}
                    </div></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      );

      case "marks": return(
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Marks Entry</h2>
          <div className="flex gap-3 flex-wrap">
            <select value={sc} onChange={e=>setSC(e.target.value)} className="bg-[#080D18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50">{state.classes.map(c=><option key={c.id} value={c.id}>Class {c.name}-{c.section}</option>)}</select>
            <select value={ss} onChange={e=>setSS(e.target.value)} className="bg-[#080D18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50">{state.subjects.filter(s=>s.classIds.includes(sc)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-sm text-white/60">{state.subjects.find(s=>s.id===ss)?.name}</span>
              <button onClick={()=>{
                const upds:Record<string,number>={};
                Object.entries(me).forEach(([id,v])=>{const n=parseFloat(v);if(!isNaN(n))upds[id]=n;});
                upd(s=>({...s,students:s.students.map(st=>upds[st.id]!==undefined?{...st,marks:{...st.marks,[ss]:upds[st.id]}}:st)}));
                setME({});
              }} className="flex items-center gap-2 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors"><Save size={12}/>Save All</button>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">{["Student","Roll","Current","Enter /100"].map(h=><th key={h} className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">{h}</th>)}</tr></thead>
              <tbody>{state.students.filter(s=>s.classId===sc).map(st=>{
                const cur=st.marks[ss];
                return(
                  <tr key={st.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><img src={st.photo} className="w-7 h-7 rounded-full"/><span className="text-sm text-white">{st.name}</span></div></td>
                    <td className="px-4 py-3 font-mono text-xs text-white/40">{st.rollNo}</td>
                    <td className="px-4 py-3">{cur!==undefined?<span className={`font-mono text-sm ${cur>=75?"text-emerald-400":cur>=40?"text-yellow-400":"text-red-400"}`}>{cur}</span>:<span className="text-white/20 text-xs">–</span>}</td>
                    <td className="px-4 py-3"><input type="number" min="0" max="100" placeholder="0–100" value={me[st.id]??""} onChange={e=>setME(m=>({...m,[st.id]:e.target.value}))} className="w-24 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 font-mono outline-none focus:border-blue-500/50"/></td>
                  </tr>
                );
              })}</tbody>
            </table>
            </div>
          </div>
        </div>
      );

      case "timetable": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-bold text-white">Timetable</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <select value={sc} onChange={e=>setSC(e.target.value)} className="bg-[#080D18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50">{state.classes.map(c=><option key={c.id} value={c.id}>Class {c.name}-{c.section}</option>)}</select>
              <label className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors">
                <Upload size={12}/>Import CSV
                <input type="file" accept=".csv" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{importTimetableCSV(ev.target?.result as string);e.target.value="";};r.readAsText(f);}}/>
              </label>
              <button onClick={()=>downloadCSV("timetable_template.csv",[["class","section","day","period","subject_code","teacher_email"],["9","A","Monday","1","MTH","arjun@nexus.edu"],["9","A","Monday","2","PHY","arjun@nexus.edu"],["9","A","Tuesday","1","ENG","arjun@nexus.edu"]])} className="flex items-center gap-2 border border-white/10 text-white/50 hover:text-blue-400 hover:border-blue-500/30 text-xs px-3 py-2 rounded-lg transition-colors"><Download size={12}/>Example CSV</button>
            </div>
          </div>
          {csvMsg&&<div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5"><CheckCircle size={12}/><span className="flex-1">{csvMsg}</span><button onClick={()=>setCsvMsg("")} className="text-white/30 hover:text-white/60"><X size={11}/></button></div>}
          <div className="text-[10px] text-white/30 bg-white/3 border border-white/5 rounded-lg px-3 py-2">CSV columns: <span className="font-mono text-white/50">class, section, day, period, subject_code, teacher_email</span></div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5"><th className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3 w-20">Period</th>{DAYS.map(d=><th key={d} className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">{d}</th>)}</tr></thead>
              <tbody>{PERIODS.map(p=>(
                <tr key={p} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-white/40">{p}</td>
                  {DAYS.map(d=>{
                    const slot=(state.timetable[sc]||[]).find(s=>s.day===d&&s.period===p);
                    const sub=slot?state.subjects.find(s=>s.id===slot.subjectId):null;
                    const tea=slot?state.teachers.find(t=>t.id===slot.teacherId):null;
                    return(
                      <td key={d} className="px-4 py-2">
                        {sub?(
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 group relative">
                            <div className="text-xs font-semibold text-blue-300">{sub.code}</div>
                            <div className="text-xs text-white/40 truncate max-w-[80px]">{tea?.name?.split(" ")[0]}</div>
                            <button onClick={()=>upd(s=>({...s,timetable:{...s.timetable,[sc]:(s.timetable[sc]||[]).filter(x=>!(x.day===d&&x.period===p))}}))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all"><X size={10}/></button>
                          </div>
                        ):(
                          <button onClick={()=>setPopup({type:"addSlot",data:{day:d,period:p,classId:sc}})} className="w-full h-12 border border-dashed border-white/10 rounded-lg hover:border-blue-500/30 hover:bg-blue-500/5 transition-all flex items-center justify-center">
                            <Plus size={12} className="text-white/20"/>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );

      case "attendance": return(
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">QR Attendance</h2>
          <div className="max-w-md mx-auto space-y-4">
            <div className="bg-[#080D18] border border-white/5 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><QrCode size={36} className="text-blue-400"/></div>
              <p className="text-white/40 text-sm mb-5">Enter roll number or scan QR</p>
              <div className="flex gap-2">
                <input value={qrIn} onChange={e=>setQrIn(e.target.value)} onKeyDown={e=>e.key==="Enter"&&scanQr()} placeholder="Roll Number" className="flex-1 bg-white/5 border border-white/10 text-white font-mono text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 placeholder-white/20"/>
                <button onClick={scanQr} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl transition-colors"><Check size={16}/></button>
              </div>
              {qrOk&&(
                <div className="mt-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4 animate-pulse">
                  <img src={qrOk.photo} className="w-12 h-12 rounded-full border-2 border-emerald-500/40"/>
                  <div className="text-left"><div className="text-emerald-400 font-semibold text-sm">✓ Marked Present</div><div className="text-white text-sm">{qrOk.name}</div><div className="text-white/40 text-xs font-mono">Roll: {qrOk.rollNo}</div></div>
                </div>
              )}
            </div>
            <div className="bg-[#080D18] border border-white/5 rounded-xl p-4">
              <div className="text-xs text-white/30 uppercase tracking-wider mb-3">Today — {today}</div>
              {state.students.map(st=>{
                const present=state.attendance[today]?.[st.rollNo];
                return(
                  <div key={st.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-2"><img src={st.photo} className="w-6 h-6 rounded-full"/><span className="text-sm text-white">{st.name}</span></div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${present?"bg-emerald-400":"bg-white/10"}`}/>
                      <button onClick={()=>upd(s=>({...s,attendance:{...s.attendance,[today]:{...(s.attendance[today]||{}),[st.rollNo]:!present}}}))} className="text-xs text-white/30 hover:text-white/60 transition-colors">{present?"Undo":"Mark"}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

      case "ledger":
        if(!lu) return(
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-[#080D18] border border-white/5 rounded-2xl p-10 w-80 text-center">
              <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center"><Shield size={24} className="text-yellow-400"/></div>
              <h3 className="text-white font-bold mb-1">Result Ledger</h3>
              <p className="text-white/40 text-xs mb-5">Enter Admin Password</p>
              <input type="password" value={lpin} onChange={e=>{setLP(e.target.value);setLE(false);}} onKeyDown={e=>{if(e.key==="Enter"){if(lpin===state.settings.pwAdmin){setLU(true);setLE(false);}else setLE(true);}}} placeholder="Password" className={`w-full text-center text-sm font-mono bg-white/5 border ${lerr?"border-red-500/50":"border-white/10"} text-white rounded-xl px-4 py-3 outline-none mb-3`}/>
              {lerr&&<p className="text-red-400 text-xs mb-2">Incorrect password</p>}
              <button onClick={()=>{if(lpin===state.settings.pwAdmin){setLU(true);setLE(false);}else setLE(true);}} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl transition-colors">Unlock</button>
            </div>
          </div>
        );
        return(
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Result Ledger</h2>
              <button onClick={()=>{setLU(false);setLP("");}} className="text-xs text-white/30 hover:text-white/60 border border-white/10 px-3 py-2 rounded-lg transition-colors">Lock</button>
            </div>
            <MarksheetView state={state} classId={sc} onClassChange={setSC} availableClasses={state.classes}/>
          </div>
        );

      case "settings": return <SettingsTab state={state} upd={upd} isSA={!!isSA} setPopup={setPopup}/>

      case "website": return <CMSAdmin state={state} setState={upd}/>;

      case "manage_staff": return <StaffManager state={state} setState={upd}/>;

      case "manage_downloads": return <DownloadsManager state={state} setState={upd}/>;

      case "counseling": return <CounselingModule state={state} setState={upd} db={db}/>;

      case "behavior": return <BehaviorModule state={state} setState={upd} db={db}/>;

      case "fees": return <FeesModule state={state} setState={upd} db={db}/>;

      case "inventory": return <InventoryModule state={state} setState={upd} db={db}/>;

      default: return null;
    }
  }

  function renderPopup(){
    if(!popup)return null;
    const close=()=>setPopup(null);
    if(popup.type==="addClass"){let n="",sec="",tid="";return<Modal title="Add Class" onClose={close}><Field label="Class Name" onChange={v=>n=v}/><Field label="Section" onChange={v=>sec=v}/><SelField label="Class Teacher" options={state.teachers.map(t=>({value:t.id,label:t.name}))} onChange={v=>tid=v}/><MBtn onClick={()=>{if(n&&sec){upd(s=>({...s,classes:[...s.classes,{id:uid(),name:n,section:sec,teacherId:tid}]}));close();}}}>Create</MBtn></Modal>;}
    if(popup.type==="addSubject"){let n="",code="",tid="";let cids:string[]=[];return<Modal title="Add Subject" onClose={close}><Field label="Subject Name" onChange={v=>n=v}/><Field label="Code" onChange={v=>code=v.toUpperCase()}/><SelField label="Teacher" options={state.teachers.map(t=>({value:t.id,label:t.name}))} onChange={v=>tid=v}/><div><label className="text-xs text-white/40 uppercase block mb-2">Classes</label><div className="flex gap-3 flex-wrap">{state.classes.map(c=><label key={c.id} className="flex items-center gap-1.5 text-sm text-white cursor-pointer"><input type="checkbox" className="accent-blue-500" onChange={e=>{if(e.target.checked)cids.push(c.id);else cids=cids.filter(x=>x!==c.id);}}/>{c.name}-{c.section}</label>)}</div></div><MBtn onClick={()=>{if(n&&code){upd(s=>({...s,subjects:[...s.subjects,{id:uid(),name:n,code,classIds:cids,teacherId:tid}]}));close();}}}>Create</MBtn></Modal>;}
    if(popup.type==="addTeacher"){let n="",e="",p="";return<Modal title="Add Teacher" onClose={close}><Field label="Full Name" onChange={v=>n=v}/><Field label="Email" onChange={v=>e=v}/><Field label="Password" onChange={v=>p=v}/><MBtn onClick={()=>{if(n&&e){const t:Teacher={id:uid(),name:n,email:e,subjectIds:[],classIds:[],password:p};db.addTeacher(t);close();}}}>Add</MBtn></Modal>;}
    if(popup.type==="addStudent"){let n="",r="",cid=state.classes[0]?.id||"",p="";return<Modal title="Add Student" onClose={close}><Field label="Full Name" onChange={v=>n=v}/><Field label="Roll Number" onChange={v=>r=v}/><Field label="Password" onChange={v=>p=v}/><SelField label="Class" options={state.classes.map(c=>({value:c.id,label:`Class ${c.name}-${c.section}`}))} onChange={v=>cid=v}/><MBtn onClick={()=>{if(n&&r){const s:Student={id:uid(),name:n,rollNo:r,classId:cid,photo:`https://api.dicebear.com/7.x/avataaars/svg?seed=${n}`,marks:{},password:p};db.addStudent(s);close();}}}>Add</MBtn></Modal>;}
    if(popup.type==="addSlot"){const{day,period,classId}=popup.data;let sid="",tid="";const csubs=state.subjects.filter(s=>s.classIds.includes(classId));return<Modal title={`Slot — ${day}, P${period}`} onClose={close}><SelField label="Subject" options={csubs.map(s=>({value:s.id,label:s.name}))} onChange={v=>sid=v}/><SelField label="Teacher" options={state.teachers.map(t=>({value:t.id,label:t.name}))} onChange={v=>tid=v}/><MBtn onClick={()=>{if(sid){upd(s=>({...s,timetable:{...s.timetable,[classId]:[...(s.timetable[classId]||[]),{day,period,subjectId:sid,teacherId:tid}]}}));close();}}}>Add</MBtn></Modal>;}
    if(popup.type==="addSupportAdmin"){let n="",e="",p="";return<Modal title="Add Support Admin" onClose={close}><Field label="Full Name" onChange={v=>n=v}/><Field label="Email" onChange={v=>e=v}/><Field label="Password" onChange={v=>p=v}/><MBtn onClick={()=>{if(n&&e&&p){upd(s=>({...s,supportAdmins:[...s.supportAdmins,{id:uid(),name:n,email:e,password:p}]}));close();}}}>Create</MBtn></Modal>;}
    return null;
  }

  return(
    <Layout user={user} state={state} navItems={NAV} activeTab={tab} setTab={setTab} onLogout={onLogout}>
      {renderTab()}
      {popup&&<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setPopup(null)}>{renderPopup()}</div>}
      {editSt&&<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><StudentProfileModal student={editSt} state={state} onSave={u=>db.updateStudent(u)} onClose={()=>setEditSt(null)}/></div>}
      {editTch&&<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><TeacherProfileModal teacher={editTch} state={state} onSave={u=>db.updateTeacher(u)} onClose={()=>setEditTch(null)}/></div>}
    </Layout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEACHER VIEW
// ═══════════════════════════════════════════════════════════════════════════════
function TeacherView({user,state,setState,onLogout}:
  {user:LoggedInUser;state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;onLogout:()=>void}) {

  const [tab,setTab]       = useState("profile");
  const [sc,setSC]         = useState("");
  const [ss,setSS]         = useState("");
  const [me,setME]         = useState<Record<string,string>>({});
  const [search,setSearch] = useState(""); // ✅ Student search
  const [shCls,setShCls]   = useState(""); // ✅ Marksheet class
  const [editSt,setEditSt] = useState<Student|null>(null); // ✅ Profile edit (class teachers)

  const teacher    = state.teachers.find(t=>t.id===user.id)!;
  const mySubjects = state.subjects.filter(s=>teacher.subjectIds.includes(s.id));
  const myClasses  = state.classes.filter(c=>teacher.classIds.includes(c.id));
  const myOwnCls   = state.classes.filter(c=>c.teacherId===teacher.id); // classes where I am class teacher

  const NAV=[
    {id:"profile",    label:"My Profile",     icon:User},
    {id:"marks",      label:"Enter Marks",    icon:Award},
    {id:"timetable",  label:"My Schedule",    icon:Clock},
    {id:"students",   label:"My Students",    icon:Users},
    {id:"marksheet",  label:"Class Marksheet",icon:BarChart3},
  ];

  function renderTab(){
    switch(tab){

      case "profile": return(
        <div className="space-y-6 max-w-2xl">
          <div className="bg-[#080D18] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center text-2xl font-bold text-white">{teacher.name[0]}</div>
              <div>
                <h2 className="text-xl font-bold text-white">{teacher.name}</h2>
                <p className="text-white/40 text-sm">{teacher.email}</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <span className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">Teacher</span>
                  {myOwnCls.map(c=><span key={c.id} className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">Class Teacher {c.name}-{c.section}</span>)}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {label:"Classes",value:myClasses.length,icon:School,color:"text-blue-400"},
              {label:"Subjects",value:mySubjects.length,icon:BookOpen,color:"text-purple-400"},
              {label:"Students",value:state.students.filter(s=>myClasses.map(c=>c.id).includes(s.classId)).length,icon:Users,color:"text-emerald-400"},
            ].map(c=>(
              <div key={c.label} className="bg-[#080D18] border border-white/5 rounded-xl p-4 text-center">
                <c.icon size={18} className={`${c.color} mx-auto mb-2`}/>
                <div className="text-2xl font-bold text-white">{c.value}</div>
                <div className="text-xs text-white/40">{c.label}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Assigned Subjects</h3>
            <div className="space-y-3">
              {mySubjects.map(sub=>{
                const cls=state.classes.filter(c=>sub.classIds.includes(c.id));
                return(
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-1 rounded">{sub.code}</span>
                      <span className="text-sm text-white">{sub.name}</span>
                    </div>
                    <div className="flex gap-1">{cls.map(c=><span key={c.id} className="text-xs bg-white/5 text-white/40 px-2 py-0.5 rounded">{c.name}-{c.section}</span>)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

      case "marks": return(
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-xl font-bold text-white">Enter Marks</h2>
          <div className="flex gap-3 flex-wrap">
            <select value={sc} onChange={e=>setSC(e.target.value)} className="bg-[#080D18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50">
              <option value="">Select Class</option>
              {myClasses.map(c=><option key={c.id} value={c.id}>Class {c.name}-{c.section}</option>)}
            </select>
            <select value={ss} onChange={e=>setSS(e.target.value)} className="bg-[#080D18] border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50">
              <option value="">Select Subject</option>
              {mySubjects.filter(s=>!sc||s.classIds.includes(sc)).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {sc&&ss?(
            <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-sm text-white/60">{state.subjects.find(s=>s.id===ss)?.name}</span>
                <button onClick={()=>{
                  const upds:Record<string,number>={};
                  Object.entries(me).forEach(([id,v])=>{const n=parseFloat(v);if(!isNaN(n))upds[id]=n;});
                  setState(s=>({...s,students:s.students.map(st=>upds[st.id]!==undefined?{...st,marks:{...st.marks,[ss]:upds[st.id]}}:st)}));
                  setME({});
                }} className="flex items-center gap-2 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-colors"><Save size={12}/>Save All</button>
              </div>
              <table className="w-full">
                <thead><tr className="border-b border-white/5">{["Student","Roll","Current","Enter /100"].map(h=><th key={h} className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">{h}</th>)}</tr></thead>
                <tbody>{state.students.filter(s=>s.classId===sc).map(st=>{
                  const cur=st.marks[ss];
                  return(
                    <tr key={st.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><img src={st.photo} className="w-7 h-7 rounded-full"/><span className="text-sm text-white">{st.name}</span></div></td>
                      <td className="px-4 py-3 font-mono text-xs text-white/40">{st.rollNo}</td>
                      <td className="px-4 py-3">{cur!==undefined?<span className={`font-mono text-sm ${cur>=75?"text-emerald-400":cur>=40?"text-yellow-400":"text-red-400"}`}>{cur}</span>:<span className="text-white/20 text-xs">–</span>}</td>
                      <td className="px-4 py-3"><input type="number" min="0" max="100" placeholder="0–100" value={me[st.id]??""} onChange={e=>setME(m=>({...m,[st.id]:e.target.value}))} className="w-24 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 font-mono outline-none focus:border-blue-500/50"/></td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          ):<div className="text-white/30 text-sm text-center py-16 bg-[#080D18] border border-white/5 rounded-xl">Select a class and subject to begin</div>}
        </div>
      );

      case "timetable": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">My Schedule</h2>
            <button onClick={()=>downloadTeacherTimetablePDF(teacher,state)} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"><Printer size={14}/>Export PDF</button>
          </div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5"><th className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3 w-20">Period</th>{DAYS.map(d=><th key={d} className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">{d}</th>)}</tr></thead>
              <tbody>{PERIODS.map(p=>(
                <tr key={p} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-white/40">{p}</td>
                  {DAYS.map(d=>{
                    const mySlots=Object.entries(state.timetable).flatMap(([cid,slots])=>slots.filter(s=>s.teacherId===teacher.id&&s.day===d&&s.period===p).map(s=>({...s,classId:cid})));
                    const slot=mySlots[0];
                    if(!slot)return<td key={d} className="px-4 py-2"><div className="h-12 rounded-lg bg-white/3"/></td>;
                    const sub=state.subjects.find(s=>s.id===slot.subjectId);
                    const cls=state.classes.find(c=>c.id===slot.classId);
                    return(
                      <td key={d} className="px-4 py-2">
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg px-3 py-2">
                          <div className="text-xs font-semibold text-purple-300">{sub?.code}</div>
                          <div className="text-xs text-white/40">{cls?.name}-{cls?.section}</div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );

      // ✅ My Students — with search box
      case "students": return(
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">My Students</h2>

          {/* Search Box */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or roll number..."
              className="w-full bg-[#080D18] border border-white/10 text-white text-sm rounded-xl pl-9 pr-9 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/>
            {search&&<button onClick={()=>setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"><X size={12}/></button>}
          </div>

          {search&&(
            <div className="text-xs text-white/30">
              Showing results for "<span className="text-blue-400">{search}</span>" —{" "}
              {state.students.filter(s=>myClasses.map(c=>c.id).includes(s.classId)&&(s.name.toLowerCase().includes(search.toLowerCase())||s.rollNo.includes(search))).length} found
            </div>
          )}

          {myClasses.map(cls=>{
            const clsSubs    = state.subjects.filter(s=>s.classIds.includes(cls.id)&&s.teacherId===teacher.id);
            const clsStudents = state.students
              .filter(s=>s.classId===cls.id)
              .filter(s=>!search||s.name.toLowerCase().includes(search.toLowerCase())||s.rollNo.includes(search));

            if(!clsStudents.length&&search) return null;
            return(
              <div key={cls.id} className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 bg-white/3 flex items-center justify-between">
                  <div><span className="text-sm font-semibold text-white">Class {cls.name}-{cls.section}</span><span className="text-xs text-white/30 ml-2">{clsStudents.length} student{clsStudents.length!==1?"s":""}</span></div>
                  {search&&<span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">filtered</span>}
                </div>
                {clsStudents.length===0?(
                  <div className="text-white/20 text-sm text-center py-8">No students match "{search}"</div>
                ):(
                  <table className="w-full">
                    <thead><tr className="border-b border-white/5">
                      <th className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">Student</th>
                      {clsSubs.map(s=><th key={s.id} className="text-center text-xs font-semibold text-white/40 uppercase px-3 py-3">{s.code}</th>)}
                      <th className="text-center text-xs font-semibold text-white/40 uppercase px-4 py-3">Today</th>
                      {myOwnCls.some(c=>c.id===cls.id)&&<th className="text-center text-xs font-semibold text-white/40 uppercase px-4 py-3">Profile</th>}
                    </tr></thead>
                    <tbody>{clsStudents.map(st=>{
                      const present=state.attendance[today]?.[st.rollNo];
                      const d=decProfile(st.profile);
                      return(
                        <tr key={st.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <img src={st.photo} className="w-7 h-7 rounded-full"/>
                              <div>
                                <div className="text-sm text-white">{st.name}</div>
                                <div className="text-xs text-white/30 font-mono">{st.rollNo}{d.bloodGroup&&<span className="ml-1.5 text-red-400/70">{d.bloodGroup}</span>}</div>
                              </div>
                            </div>
                          </td>
                          {clsSubs.map(sub=>{const m=st.marks[sub.id];return<td key={sub.id} className="px-3 py-3 text-center"><span className={`font-mono text-sm ${m===undefined?"text-white/20":m>=75?"text-emerald-400":m>=40?"text-yellow-400":"text-red-400"}`}>{m??'–'}</span></td>;})}
                          <td className="px-4 py-3 text-center"><span className={`text-xs px-2 py-1 rounded-full ${present?"bg-emerald-500/20 text-emerald-400":"bg-red-500/10 text-red-400/60"}`}>{present?"P":"A"}</span></td>
                          {myOwnCls.some(c=>c.id===cls.id)&&<td className="px-4 py-3 text-center"><button onClick={()=>setEditSt(st)} className="text-white/20 hover:text-blue-400 transition-colors p-1"><User size={13}/></button></td>}
                        </tr>
                      );
                    })}</tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      );

      // ✅ Class Marksheet — restricted to classes where I am the class teacher
      case "marksheet": return(
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Class Marksheet</h2>
            <p className="text-white/40 text-xs mt-1">
              {myOwnCls.length>0?"Full marksheet for your assigned class(es)":"You are not assigned as a class teacher"}
            </p>
          </div>
          {myOwnCls.length===0?(
            <div className="bg-[#080D18] border border-white/5 rounded-xl p-16 text-center">
              <BarChart3 size={32} className="text-white/10 mx-auto mb-3"/>
              <div className="text-white/30 text-sm">Not a class teacher</div>
              <div className="text-white/20 text-xs mt-1">Ask admin to assign you as a class teacher to view marksheets</div>
            </div>
          ):(
            <MarksheetView
              state={state}
              classId={shCls||myOwnCls[0]?.id}
              onClassChange={setShCls}
              availableClasses={myOwnCls}
            />
          )}
        </div>
      );

      default: return null;
    }
  }

  return(
    <Layout user={user} state={state} navItems={NAV} activeTab={tab} setTab={setTab} onLogout={onLogout}>
      {renderTab()}
      {editSt&&<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"><StudentProfileModal student={editSt} state={state} onSave={u=>setState(s=>({...s,students:s.students.map(x=>x.id===u.id?u:x)}))} onClose={()=>setEditSt(null)}/></div>}
    </Layout>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
function StudentView({user,state,onLogout}:
  {user:LoggedInUser;state:AppState;onLogout:()=>void}) {

  const [tab,setTab]   = useState("dashboard");
  const student        = state.students.find(s=>s.id===user.id)!;
  const myClass        = state.classes.find(c=>c.id===student.classId)!;
  const mySubjects     = state.subjects.filter(s=>s.classIds.includes(student.classId));

  const NAV=[
    {id:"dashboard",  label:"Dashboard",  icon:Home},
    {id:"marks",      label:"My Results", icon:TrendingUp},
    {id:"timetable",  label:"Timetable",  icon:Clock},
    {id:"attendance", label:"Attendance", icon:CheckCircle},
  ];

  const validMarks     = mySubjects.map(s=>student.marks[s.id]).filter(m=>m!==undefined) as number[];
  const total          = validMarks.reduce((a,b)=>a+b,0);
  const avg            = validMarks.length?Math.round((total/validMarks.length)*10)/10:0;
  const grade          = getGrade(avg);
  const attendanceDays = Object.keys(state.attendance);
  const presentDays    = attendanceDays.filter(d=>state.attendance[d]?.[student.rollNo]).length;
  const pct            = attendanceDays.length?Math.round((presentDays/attendanceDays.length)*100):0;
  const classStudents  = state.students.filter(s=>s.classId===student.classId);
  const ranked         = classStudents.map(st=>{const v=mySubjects.map(s=>st.marks[s.id]).filter(m=>m!==undefined) as number[];return{id:st.id,total:v.reduce((a,b)=>a+b,0)};}).sort((a,b)=>b.total-a.total);
  const myRank         = ranked.findIndex(r=>r.id===student.id)+1;

  function renderTab(){
    switch(tab){

      case "dashboard": return(
        <div className="space-y-6 max-w-2xl">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <img src={student.photo} className="w-16 h-16 rounded-2xl border-2 border-blue-500/30"/>
              <div>
                <p className="text-white/50 text-xs mb-1">Welcome back</p>
                <h2 className="text-xl font-bold text-white">{student.name}</h2>
                <p className="text-white/40 text-sm">Class {myClass?.name}-{myClass?.section} · Roll: <span className="font-mono text-blue-400">{student.rollNo}</span></p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#080D18] border border-white/5 rounded-xl p-5 text-center"><div className={`text-4xl font-bold mb-1 ${gradeColor(grade)}`}>{grade}</div><div className="text-xs text-white/40">Overall Grade</div><div className="text-lg font-bold text-white mt-1">{avg}%</div></div>
            <div className="bg-[#080D18] border border-white/5 rounded-xl p-5 text-center"><div className="text-4xl font-bold text-yellow-400 mb-1">#{myRank}</div><div className="text-xs text-white/40">Class Rank</div><div className="text-sm text-white/40 mt-1">of {classStudents.length}</div></div>
            <div className="bg-[#080D18] border border-white/5 rounded-xl p-5 text-center"><div className="text-4xl font-bold text-white mb-1">{total}</div><div className="text-xs text-white/40">Total Marks</div><div className="text-sm text-white/40 mt-1">out of {validMarks.length*100}</div></div>
            <div className={`border rounded-xl p-5 text-center ${pct>=75?"bg-emerald-500/10 border-emerald-500/20":"bg-red-500/10 border-red-500/20"}`}><div className={`text-4xl font-bold mb-1 ${pct>=75?"text-emerald-400":"text-red-400"}`}>{pct}%</div><div className="text-xs text-white/40">Attendance</div><div className="text-sm text-white/40 mt-1">{presentDays}/{attendanceDays.length} days</div></div>
          </div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Subject Performance</h3>
            <div className="space-y-3">
              {mySubjects.map(sub=>{
                const m=student.marks[sub.id];
                return(
                  <div key={sub.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2"><span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{sub.code}</span><span className="text-sm text-white">{sub.name}</span></div>
                      <span className={`font-mono text-sm font-bold ${m===undefined?"text-white/30":m>=75?"text-emerald-400":m>=40?"text-yellow-400":"text-red-400"}`}>{m??'–'}<span className="text-white/30 font-normal">/100</span></span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${m===undefined?"w-0":m>=75?"bg-emerald-400":m>=40?"bg-yellow-400":"bg-red-400"}`} style={{width:`${m??0}%`}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

      // ✅ My Results — with Download PDF button
      case "marks": return(
        <div className="space-y-4 max-w-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">My Results</h2>
            <button onClick={()=>downloadResultPDF(student,state)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
              <Download size={14}/>Download PDF
            </button>
          </div>

          <div className="bg-[#080D18] border border-white/5 rounded-2xl p-6">
            <div className="text-center mb-5 pb-5 border-b border-white/5">
              <div className="text-white font-bold text-lg">{state.settings.name}</div>
              <div className="text-white/30 text-xs">{state.settings.tagline}</div>
              <div className="text-white/20 text-xs mt-1">Progress Report Card</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
              <div className="bg-white/3 rounded-lg p-3"><span className="text-white/40">Name</span><div className="text-white mt-0.5">{student.name}</div></div>
              <div className="bg-white/3 rounded-lg p-3"><span className="text-white/40">Roll No</span><div className="text-white font-mono mt-0.5">{student.rollNo}</div></div>
              <div className="bg-white/3 rounded-lg p-3"><span className="text-white/40">Class</span><div className="text-white mt-0.5">{myClass?.name}-{myClass?.section}</div></div>
              <div className="bg-white/3 rounded-lg p-3"><span className="text-white/40">Rank</span><div className="text-yellow-400 font-bold mt-0.5">#{myRank}</div></div>
            </div>
            <table className="w-full">
              <thead><tr className="border-b border-white/5"><th className="text-left text-xs text-white/40 uppercase px-2 py-2">Subject</th><th className="text-center text-xs text-white/40 uppercase px-2 py-2">Marks</th><th className="text-center text-xs text-white/40 uppercase px-2 py-2">Grade</th></tr></thead>
              <tbody>{mySubjects.map(sub=>{
                const m=student.marks[sub.id];
                const g=getGrade(m??0);
                return(
                  <tr key={sub.id} className="border-b border-white/5">
                    <td className="px-2 py-3"><div className="flex items-center gap-2"><span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{sub.code}</span><span className="text-sm text-white">{sub.name}</span></div></td>
                    <td className="px-2 py-3 text-center"><span className={`font-mono text-sm font-bold ${m===undefined?"text-white/20":m>=75?"text-emerald-400":m>=40?"text-yellow-400":"text-red-400"}`}>{m??'–'}<span className="text-white/20 font-normal">/100</span></span></td>
                    <td className="px-2 py-3 text-center"><span className={`text-sm font-bold font-mono px-2 py-0.5 rounded border ${gradeBg(m!==undefined?g:"-")} ${gradeColor(m!==undefined?g:"-")}`}>{m!==undefined?g:"–"}</span></td>
                  </tr>
                );
              })}</tbody>
              <tfoot>
                <tr className="border-t-2 border-white/10"><td className="px-2 py-3 text-sm font-bold text-white">Total</td><td className="px-2 py-3 text-center font-mono font-bold text-white">{total}/{validMarks.length*100}</td><td className="px-2 py-3 text-center"><span className={`text-lg font-bold font-mono ${gradeColor(grade)}`}>{grade}</span></td></tr>
                <tr><td className="px-2 py-2 text-xs text-white/40">Average</td><td className="px-2 py-2 text-center font-mono text-sm text-white/60">{avg}%</td><td/></tr>
              </tfoot>
            </table>
            <GradeKey />
          </div>

          <div className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 rounded-xl px-4 py-3">
            <FileText size={14} className="text-blue-400 flex-shrink-0"/>
            <span className="text-xs text-white/40">Click <span className="text-blue-400 font-medium">Download PDF</span> above, then choose <span className="text-white/60">"Save as PDF"</span> in the print dialog.</span>
          </div>
        </div>
      );

      case "timetable": return(
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Timetable — Class {myClass?.name}-{myClass?.section}</h2>
          <div className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-white/5"><th className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3 w-20">Period</th>{DAYS.map(d=><th key={d} className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">{d}</th>)}</tr></thead>
              <tbody>{PERIODS.map(p=>(
                <tr key={p} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs text-white/40">{p}</td>
                  {DAYS.map(d=>{
                    const slot=(state.timetable[student.classId]||[]).find(s=>s.day===d&&s.period===p);
                    const sub=slot?state.subjects.find(s=>s.id===slot.subjectId):null;
                    const tea=slot?state.teachers.find(t=>t.id===slot.teacherId):null;
                    return(
                      <td key={d} className="px-4 py-2">
                        {sub?(
                          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                            <div className="text-xs font-semibold text-blue-300">{sub.code}</div>
                            <div className="text-xs text-white/40 truncate">{sub.name}</div>
                            <div className="text-xs text-white/20 truncate">{tea?.name?.split(" ")[0]}</div>
                          </div>
                        ):<div className="h-14 rounded-lg bg-white/3"/>}
                      </td>
                    );
                  })}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );

      case "attendance": return(
        <div className="space-y-4 max-w-xl">
          <h2 className="text-xl font-bold text-white">Attendance Record</h2>
          <div className={`border rounded-2xl p-5 ${pct>=75?"bg-emerald-500/10 border-emerald-500/20":"bg-red-500/10 border-red-500/20"}`}>
            <div className="flex items-center justify-between">
              <div><div className={`text-4xl font-bold ${pct>=75?"text-emerald-400":"text-red-400"}`}>{pct}%</div><div className="text-white/40 text-sm mt-1">{presentDays} present / {attendanceDays.length} total days</div></div>
              {pct>=75?<div className="flex items-center gap-2 text-emerald-400"><CheckCircle size={20}/><span className="text-sm">Good Standing</span></div>:<div className="flex items-center gap-2 text-red-400"><AlertCircle size={20}/><span className="text-sm">Below 75% — At Risk</span></div>}
            </div>
            <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden"><div className={`h-full rounded-full ${pct>=75?"bg-emerald-400":"bg-red-400"}`} style={{width:`${pct}%`}}/></div>
          </div>
          <div className="bg-[#080D18] border border-white/5 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">Daily Log</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {attendanceDays.length===0&&<div className="text-white/20 text-sm text-center py-8">No records yet</div>}
              {attendanceDays.sort((a,b)=>b.localeCompare(a)).map(d=>{
                const present=state.attendance[d]?.[student.rollNo];
                return(
                  <div key={d} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-sm text-white font-mono">{d}</span>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${present?"bg-emerald-500/20 text-emerald-400":"bg-red-500/10 text-red-400"}`}>{present?"Present":"Absent"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );

      default: return null;
    }
  }

  return(
    <Layout user={user} state={state} navItems={NAV} activeTab={tab} setTab={setTab} onLogout={onLogout}>
      {renderTab()}
    </Layout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// REGISTRATION SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// CMS ADMIN — Website Content Manager
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// STAFF MANAGER — Admin Dashboard Tab
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// SHARED — Password Gate HOC
// ═══════════════════════════════════════════════════════════════════════════════
function PasswordGate({moduleId,correctPw,icon,title,subtitle,accent,children}:{
  moduleId:string; correctPw:string; icon:React.ReactNode; title:string; subtitle:string; accent:string; children:React.ReactNode;
}){
  const key=`pw_unlocked_${moduleId}`;
  const [unlocked,setUnlocked]=React.useState(false);
  const [pw,setPw]=React.useState("");
  const [err,setErr]=React.useState(false);
  const [show,setShow]=React.useState(false);

  function attempt(){
    if(pw===correctPw){setUnlocked(true);setErr(false);}
    else{setErr(true);setPw("");setTimeout(()=>setErr(false),2000);}
  }

  if(unlocked) return(
    <div>
      <div className={`flex items-center gap-2 text-xs mb-4 ${accent} bg-white/5 border border-white/5 px-3 py-2 rounded-xl`}>
        <Shield size={12}/><span>Module unlocked — session access only</span>
        <button onClick={()=>{setUnlocked(false);setPw("");}} className="ml-auto text-white/30 hover:text-red-400 transition-colors text-[10px] border border-white/10 px-2 py-0.5 rounded-full">Lock</button>
      </div>
      {children}
    </div>
  );

  return(
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[#080D18] border border-white/10 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl" style={{animation:"fadeUp 0.4s ease forwards"}}>
        <div className={`w-16 h-16 rounded-2xl ${accent.replace("text-","bg-").replace("-400","-500/10")} border ${accent.replace("text-","border-").replace("-400","-500/20")} flex items-center justify-center mx-auto mb-5`}>
          <div className={accent}>{icon}</div>
        </div>
        <h2 className="text-white font-bold text-lg mb-1" style={{fontFamily:"'DM Mono',monospace"}}>{title}</h2>
        <p className="text-white/30 text-xs mb-6">{subtitle}</p>
        <div className="relative mb-4">
          <input
            type={show?"text":"password"}
            value={pw}
            onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&attempt()}
            placeholder="Enter access password"
            className={`w-full bg-white/5 border text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors placeholder-white/20 pr-10 ${err?"border-red-500/50 bg-red-500/5":"border-white/10 focus:border-blue-500/50"}`}
          />
          <button onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
            {show?<EyeOff size={14}/>:<Eye size={14}/>}
          </button>
        </div>
        {err&&<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 mb-3 text-xs text-red-400"><AlertCircle size={12}/>Incorrect password. Try again.</div>}
        <button onClick={attempt} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2">
          <KeyRound size={14}/>Unlock Module
        </button>
        <p className="text-white/20 text-[10px] mt-4">Access is session-only and resets on logout.</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COUNSELING MODULE
// ═══════════════════════════════════════════════════════════════════════════════
function CounselingModule({state,setState,db}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;db:DbOps}){
  return(
    <PasswordGate moduleId="counseling" correctPw={state.settings.pwCounselor} icon={<HeartHandshake size={28}/>} title="Counseling Module" subtitle="High-privacy student counseling records — authorized personnel only." accent="text-purple-400">
      <CounselingInner state={state} setState={setState} db={db}/>
    </PasswordGate>
  );
}

function CounselingInner({state,setState,db}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;db:DbOps}){
  const upd=(fn:(c:CounselingState)=>CounselingState)=>setState(s=>({...s,counseling:fn(s.counseling)}));
  const [search,setSearch]=React.useState("");
  const [selId,setSelId]=React.useState<string|null>(null);
  const [newNote,setNewNote]=React.useState({issue:"",notes:"",followUp:"",mood:"neutral" as CounselingSession["mood"]});
  const [editBg,setEditBg]=React.useState(false);
  const [bgText,setBgText]=React.useState("");
  const [newFlag,setNewFlag]=React.useState("");

  const students=state.students.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.rollNo.includes(search));
  const selStudent=state.students.find(s=>s.id===selId);
  const profile=state.counseling.profiles.find(p=>p.studentId===selId);
  const cls=selStudent?state.classes.find(c=>c.id===selStudent.classId):null;

  function getOrCreateProfile(sid:string):CounselingProfile{
    return state.counseling.profiles.find(p=>p.studentId===sid)||{studentId:sid,background:"",sessions:[],flags:[]};
  }

  function saveSession(){
    if(!newNote.issue||!newNote.notes) return;
    const session:CounselingSession={id:uid(),date:today,...newNote};
    const prof=getOrCreateProfile(selId!);
    const updated={...prof,sessions:[session,...prof.sessions]};
    db.saveCounselingProfile(updated);
    setNewNote({issue:"",notes:"",followUp:"",mood:"neutral"});
  }

  function saveBg(){
    const prof=getOrCreateProfile(selId!);
    const updated={...prof,background:bgText};
    db.saveCounselingProfile(updated);
    setEditBg(false);
  }

  function addFlag(){
    if(!newFlag.trim()) return;
    const prof=getOrCreateProfile(selId!);
    const updated={...prof,flags:[...prof.flags,newFlag.trim()]};
    db.saveCounselingProfile(updated);
    setNewFlag("");
  }

  function removeSession(sid:string){
    const prof=getOrCreateProfile(selId!);
    const updated={...prof,sessions:prof.sessions.filter(s=>s.id!==sid)};
    db.saveCounselingProfile(updated);
  }

  const MOOD_CFG={
    good:{label:"Good",color:"bg-emerald-500/20 text-emerald-400 border-emerald-500/30"},
    neutral:{label:"Neutral",color:"bg-blue-500/20 text-blue-400 border-blue-500/30"},
    concern:{label:"Concern",color:"bg-amber-500/20 text-amber-400 border-amber-500/30"},
    urgent:{label:"Urgent",color:"bg-red-500/20 text-red-400 border-red-500/30"},
  };

  return(
    <div className="flex gap-4 h-[calc(100vh-140px)]">
      {/* Student list sidebar */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search size={13} className="text-white/30"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search students…" className="bg-transparent text-white text-xs outline-none flex-1 placeholder-white/20"/>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {students.map(st=>{
            const hasProfile=state.counseling.profiles.some(p=>p.studentId===st.id);
            const flags=state.counseling.profiles.find(p=>p.studentId===st.id)?.flags||[];
            return(
              <button key={st.id} onClick={()=>{setSelId(st.id);setEditBg(false);}} className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${selId===st.id?"bg-purple-600/20 border border-purple-500/30":"border border-transparent hover:bg-white/5"}`}>
                <img src={st.photo} className="w-8 h-8 rounded-full flex-shrink-0"/>
                <div className="min-w-0 flex-1">
                  <div className="text-white text-xs font-semibold truncate">{st.name}</div>
                  <div className="text-white/30 text-[10px] font-mono">{st.rollNo}</div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {hasProfile&&<div className="w-1.5 h-1.5 rounded-full bg-purple-400"/>}
                  {flags.some(f=>f)&&<AlertTriangle size={10} className="text-amber-400"/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {!selStudent?(
          <div className="h-full flex items-center justify-center text-white/20 flex-col gap-3">
            <HeartHandshake size={40} className="opacity-30"/>
            <p className="text-sm">Select a student to view their counseling profile</p>
          </div>
        ):(
          <div className="space-y-5">
            {/* Student header */}
            <div className="flex items-center gap-4 bg-[#080D18] border border-white/5 rounded-2xl p-4">
              <img src={selStudent.photo} className="w-14 h-14 rounded-xl border border-purple-500/20"/>
              <div className="flex-1">
                <div className="text-white font-bold text-base">{selStudent.name}</div>
                <div className="text-white/40 text-xs font-mono">Roll {selStudent.rollNo} · Class {cls?.name}-{cls?.section}</div>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {(profile?.flags||[]).map(f=><span key={f} className="text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">{f}</span>)}
              </div>
            </div>

            {/* Background / Flags */}
            <div className="bg-[#080D18] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Background & Context</h3>
                <button onClick={()=>{setEditBg(true);setBgText(profile?.background||"");}} className="text-xs text-purple-400 hover:text-purple-300 border border-purple-500/20 px-2 py-1 rounded-lg"><Edit2 size={10} className="inline mr-1"/>Edit</button>
              </div>
              {editBg?(
                <div className="space-y-2">
                  <textarea value={bgText} onChange={e=>setBgText(e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500/50 resize-none placeholder-white/20" placeholder="Family background, academic context, known issues…"/>
                  <div className="flex gap-2"><button onClick={saveBg} className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-1"><Save size={11}/>Save</button><button onClick={()=>setEditBg(false)} className="border border-white/10 text-white/40 text-xs px-4 py-2 rounded-lg">Cancel</button></div>
                </div>
              ):<p className="text-white/50 text-sm">{profile?.background||"No background recorded yet."}</p>}
              {/* Flags */}
              <div className="pt-3 border-t border-white/5">
                <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Alert Flags</div>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(profile?.flags||[]).map((f,i)=>(
                    <span key={i} className="flex items-center gap-1 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                      {f}<button onClick={()=>{const p=getOrCreateProfile(selId!);const u={...p,flags:p.flags.filter((_,j)=>j!==i)};db.saveCounselingProfile(u);}} className="hover:text-red-400 ml-0.5"><X size={9}/></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2"><input value={newFlag} onChange={e=>setNewFlag(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addFlag()} placeholder="Add flag e.g. Bullying, Anxiety…" className="flex-1 bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-500/50 placeholder-white/20"/><button onClick={addFlag} className="bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs px-3 py-2 rounded-xl hover:bg-amber-600/30"><Plus size={11}/></button></div>
              </div>
            </div>

            {/* New session */}
            <div className="bg-[#080D18] border border-purple-500/20 rounded-2xl p-5 space-y-3">
              <h3 className="text-purple-400 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><ClipboardList size={13}/>Log New Session — {today}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1">Issue / Reason for Session</label><input value={newNote.issue} onChange={e=>setNewNote(n=>({...n,issue:e.target.value}))} placeholder="e.g. Academic stress, peer conflict…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-purple-500/50 placeholder-white/20"/></div>
                <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1">Session Notes (Private)</label><textarea value={newNote.notes} onChange={e=>setNewNote(n=>({...n,notes:e.target.value}))} rows={3} placeholder="Observations, discussion points, student response…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-purple-500/50 resize-none placeholder-white/20"/></div>
                <div><label className="text-xs text-white/40 uppercase block mb-1">Follow-up Action</label><input value={newNote.followUp} onChange={e=>setNewNote(n=>({...n,followUp:e.target.value}))} placeholder="Next steps…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-purple-500/50 placeholder-white/20"/></div>
                <div><label className="text-xs text-white/40 uppercase block mb-1">Student Mood</label>
                  <select value={newNote.mood} onChange={e=>setNewNote(n=>({...n,mood:e.target.value as any}))} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-purple-500/50">
                    {Object.entries(MOOD_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={saveSession} disabled={!newNote.issue||!newNote.notes} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium"><Save size={14}/>Save Session Log</button>
            </div>

            {/* Past sessions */}
            {(profile?.sessions||[]).length>0&&(
              <div className="space-y-3">
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider">Session History ({profile!.sessions.length})</h3>
                {profile!.sessions.map(s=>(
                  <div key={s.id} className="bg-[#080D18] border border-white/5 rounded-2xl p-4 space-y-2 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/30 font-mono">{s.date}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${MOOD_CFG[s.mood].color}`}>{MOOD_CFG[s.mood].label}</span>
                      </div>
                      <button onClick={()=>removeSession(s.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all"><Trash2 size={12}/></button>
                    </div>
                    <div className="text-white text-sm font-semibold">{s.issue}</div>
                    <div className="text-white/50 text-xs leading-relaxed">{s.notes}</div>
                    {s.followUp&&<div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/10 rounded-xl px-3 py-2"><ChevronRight size={11} className="text-blue-400 mt-0.5 flex-shrink-0"/><span className="text-xs text-blue-400">{s.followUp}</span></div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════════════════════════
// FEES & FINANCE MODULE
// ═══════════════════════════════════════════════════════════════════════════════
function FeesModule({state,setState,db}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;db:DbOps}){
  return(
    <PasswordGate moduleId="fees" correctPw={state.settings.pwStaff} icon={<DollarSign size={28}/>} title="Fees & Finance" subtitle="School fee management — authorized staff only." accent="text-emerald-400">
      <FeesInner state={state} setState={setState} db={db}/>
    </PasswordGate>
  );
}

function FeesInner({state,setState,db}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;db:DbOps}){
  const upd=(fn:(f:FeesState)=>FeesState)=>setState(s=>({...s,fees:fn(s.fees)}));
  const [filterSt,setFilterSt]=React.useState("");
  const [filterCat,setFilterCat]=React.useState<FeeCategory|"all">("all");
  const [filterStatus,setFilterStatus]=React.useState<"all"|"paid"|"unpaid"|"partial">("all");
  const [popup,setPopup]=React.useState<{type:string;data?:any}|null>(null);

  const CAT_LABELS:Record<FeeCategory,string>={tuition:"Tuition",transport:"Transport",lab:"Lab",sports:"Sports",activity:"Activity",other:"Other"};
  const CAT_COLORS:Record<FeeCategory,string>={tuition:"bg-blue-500/20 text-blue-400",transport:"bg-purple-500/20 text-purple-400",lab:"bg-cyan-500/20 text-cyan-400",sports:"bg-emerald-500/20 text-emerald-400",activity:"bg-amber-500/20 text-amber-400",other:"bg-white/10 text-white/50"};

  const records=state.fees.records.filter(r=>{
    const st=state.students.find(s=>s.id===r.studentId);
    if(!st) return false;
    if(filterSt&&!st.name.toLowerCase().includes(filterSt.toLowerCase())&&!st.rollNo.includes(filterSt)) return false;
    if(filterCat!=="all"&&r.category!==filterCat) return false;
    if(filterStatus!=="all"&&r.status!==filterStatus) return false;
    return true;
  });

  const totalDue=records.reduce((a,r)=>a+r.amount,0);
  const totalCollected=records.reduce((a,r)=>a+(r.paidAmount||0),0);
  const totalUnpaid=records.filter(r=>r.status!=="paid").reduce((a,r)=>a+(r.amount-(r.paidAmount||0)),0);

  function togglePaid(rec:FeeRecord){
    const updated:FeeRecord=rec.status==="paid"
      ?{...rec,status:"unpaid",paidDate:undefined,paidAmount:undefined}
      :{...rec,status:"paid",paidDate:today,paidAmount:rec.amount};
    db.updateFee(updated);
  }

  function deleteRec(id:string){db.deleteFee(id);}

  return(
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-white">Fees & Finance</h2><p className="text-white/30 text-xs mt-0.5">Track and manage all student fee payments.</p></div>
        <button onClick={()=>setPopup({type:"addFee"})} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"><Plus size={14}/>Add Fee Record</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{label:"Total Billed",val:totalDue,color:"text-white"},{label:"Collected",val:totalCollected,color:"text-emerald-400"},{label:"Outstanding",val:totalUnpaid,color:"text-red-400"}].map(c=>(
          <div key={c.label} className="bg-[#080D18] border border-white/5 rounded-2xl px-5 py-4">
            <div className="text-white/30 text-xs uppercase tracking-wider mb-1">{c.label}</div>
            <div className={`text-2xl font-bold font-mono ${c.color}`}>{state.settings.currency} {c.val.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search size={13} className="text-white/30"/><input value={filterSt} onChange={e=>setFilterSt(e.target.value)} placeholder="Search student…" className="bg-transparent text-white text-xs outline-none placeholder-white/20 w-32"/>
        </div>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value as any)} className="bg-[#080D18] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none">
          <option value="all">All Categories</option>{Object.entries(CAT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)} className="bg-[#080D18] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none">
          <option value="all">All Status</option><option value="paid">Paid</option><option value="unpaid">Unpaid</option><option value="partial">Partial</option>
        </select>
        {/* Currency selector */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <DollarSign size={11} className="text-emerald-400"/>
          <select value={state.settings.currency} onChange={e=>setState(s=>({...s,settings:{...s.settings,currency:e.target.value}}))} className="bg-transparent text-white text-xs outline-none">
            {["LKR","USD","EUR","GBP","AUD","CAD","JPY","INR","රු","$","€","£","¥","₹"].map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="ml-auto text-xs text-white/30 self-center">{records.length} records</div>
      </div>

      {/* Fee table */}
      <div className="bg-[#080D18] border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead><tr className="border-b border-white/5">{["Student","Category","Description","Amount","Due","Status","Action"].map(h=><th key={h} className="text-left text-xs font-semibold text-white/40 uppercase px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>
            {records.map(r=>{
              const st=state.students.find(s=>s.id===r.studentId);
              const cls=state.classes.find(c=>c.id===st?.classId);
              return(
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2"><img src={st?.photo||""} className="w-7 h-7 rounded-full"/><div><div className="text-white text-xs font-semibold">{st?.name}</div><div className="text-white/30 text-[10px] font-mono">{st?.rollNo} · {cls?.name}-{cls?.section}</div></div></div>
                  </td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full ${CAT_COLORS[r.category]}`}>{CAT_LABELS[r.category]}</span></td>
                  <td className="px-4 py-3 text-white/70 text-xs">{r.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-white">{r.amount.toLocaleString()}{r.paidAmount&&r.paidAmount<r.amount?<span className="text-emerald-400 ml-1">({r.paidAmount.toLocaleString()} paid)</span>:null}</td>
                  <td className="px-4 py-3 text-white/40 text-xs font-mono">{r.dueDate}</td>
                  <td className="px-4 py-3">
                    <button onClick={()=>togglePaid(r)} className={`text-[10px] px-2.5 py-1 rounded-full border font-semibold transition-all ${r.status==="paid"?"bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30":r.status==="partial"?"bg-amber-500/20 text-amber-400 border-amber-500/30":"bg-red-500/10 text-red-400/70 border-red-500/20 hover:bg-red-500/20"}`}>
                      {r.status==="paid"?"✓ Paid":r.status==="partial"?"◑ Partial":"✗ Unpaid"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={()=>deleteRec(r.id)} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                  </td>
                </tr>
              );
            })}
            {records.length===0&&<tr><td colSpan={7} className="text-center py-12 text-white/20 text-sm">No fee records match your filters.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Add Fee popup */}
      {popup?.type==="addFee"&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setPopup(null)}>
          {(()=>{let sid=state.students[0]?.id||"",cat:FeeCategory="tuition",label="",amount=0,dueDate=today,paidAmt=0,status:"paid"|"unpaid"|"partial"="unpaid",note="";
          return(
            <div className="bg-[#080D18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-bold text-white">Add Fee Record</h3><button onClick={()=>setPopup(null)} className="text-white/30 hover:text-white/60"><X size={16}/></button></div>
              <div><label className="text-xs text-white/40 uppercase block mb-1.5">Student</label><select onChange={e=>{sid=e.target.value;}} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none">{state.students.map(s=><option key={s.id} value={s.id}>{s.name} ({s.rollNo})</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-white/40 uppercase block mb-1.5">Category</label><select onChange={e=>{cat=e.target.value as FeeCategory;}} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none">{Object.entries(CAT_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>
                <div><label className="text-xs text-white/40 uppercase block mb-1.5">Status</label><select onChange={e=>{status=e.target.value as any;}} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none"><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="partial">Partial</option></select></div>
              </div>
              <div><label className="text-xs text-white/40 uppercase block mb-1.5">Description</label><input onChange={e=>{label=e.target.value;}} placeholder="e.g. Term 2 Tuition Fee" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50 placeholder-white/20"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-white/40 uppercase block mb-1.5">Amount ({state.settings.currency})</label><input type="number" onChange={e=>{amount=Number(e.target.value);}} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50"/></div>
                <div><label className="text-xs text-white/40 uppercase block mb-1.5">Due Date</label><input type="date" defaultValue={today} onChange={e=>{dueDate=e.target.value;}} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50"/></div>
              </div>
              <div><label className="text-xs text-white/40 uppercase block mb-1.5">Note (optional)</label><input onChange={e=>{note=e.target.value;}} placeholder="e.g. Balance to be paid by…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500/50 placeholder-white/20"/></div>
              <button onClick={()=>{if(!label||!amount) return;const rec:FeeRecord={id:uid(),studentId:sid,category:cat,label,amount,dueDate,status,paidDate:status==="paid"?today:undefined,paidAmount:status==="paid"?amount:status==="partial"?paidAmt:undefined,note:note||undefined};db.addFee(rec);setPopup(null);}} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"><Save size={14}/>Save Record</button>
            </div>
          );})()}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTORY MODULE
// ═══════════════════════════════════════════════════════════════════════════════
function InventoryModule({state,setState,db}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;db:DbOps}){
  return <InventoryInner state={state} setState={setState} db={db}/>;
}

function InventoryInner({state,setState,db}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;db:DbOps}){
  const upd=(fn:(inv:InventoryState)=>InventoryState)=>setState(s=>({...s,inventory:fn(s.inventory)}));
  // "general" = show all non-lab items; labId = show specific lab (teacher view)
  const [view,setView]=React.useState<"general"|string>("general");
  const [unlockedLabs,setUnlockedLabs]=React.useState<Set<string>>(new Set());
  const [labPw,setLabPw]=React.useState("");
  const [labPwErr,setLabPwErr]=React.useState(false);
  const [search,setSearch]=React.useState("");
  const [catFilter,setCatFilter]=React.useState("all");
  const [condFilter,setCondFilter]=React.useState<ItemCondition|"all">("all");
  const [popup,setPopup]=React.useState<{type:string;data?:any}|null>(null);
  const isAdmin=true; // inside PasswordGate so always authorized staff

  const COND_CFG:Record<ItemCondition,{label:string;color:string}>={
    excellent:{label:"Excellent",color:"bg-emerald-500/20 text-emerald-400 border-emerald-500/30"},
    good:     {label:"Good",     color:"bg-blue-500/20 text-blue-400 border-blue-500/30"},
    fair:     {label:"Fair",     color:"bg-amber-500/20 text-amber-400 border-amber-500/30"},
    poor:     {label:"Poor",     color:"bg-orange-500/20 text-orange-400 border-orange-500/30"},
    damaged:  {label:"Damaged",  color:"bg-red-500/20 text-red-400 border-red-500/30"},
  };

  const labs=state.inventory.labs;
  const allItems=state.inventory.items;

  // Items shown in current view
  const viewItems=view==="general"
    ? allItems.filter(i=>!i.labId)
    : allItems.filter(i=>i.labId===view);

  const cats=["all",...Array.from(new Set(viewItems.map(i=>i.category)))];
  const filtered=viewItems.filter(i=>{
    if(search&&!i.name.toLowerCase().includes(search.toLowerCase())) return false;
    if(catFilter!=="all"&&i.category!==catFilter) return false;
    if(condFilter!=="all"&&i.condition!==condFilter) return false;
    return true;
  });

  const totalUnits=viewItems.reduce((a,i)=>a+i.quantity,0);
  const attentionCount=viewItems.filter(i=>i.condition==="poor"||i.condition==="damaged").length;

  function tryUnlockLab(lab:Lab){
    if(labPw===lab.password){
      setUnlockedLabs(s=>{const n=new Set(s);n.add(lab.id);return n;});
      setView(lab.id); setLabPw(""); setLabPwErr(false); setPopup(null);
    } else { setLabPwErr(true); setLabPw(""); setTimeout(()=>setLabPwErr(false),2000); }
  }

  function deleteItem(id:string){db.deleteItem(id);}

  function saveItem(item:any){
    const finalItem={...item,labId:item.labId||undefined};
    if(item.id){ db.updateItem({...finalItem,id:item.id}); }
    else { db.addItem({...finalItem,id:uid(),labId:view==="general"?undefined:view}); }
    setPopup(null);
  }

  function saveLab(lab:Omit<Lab,"id">){
    db.addLab({...lab,id:uid()});
    setPopup(null);
  }

  function deleteLab(id:string){
    db.deleteLab(id);
    if(view===id) setView("general");
  }

  const activeLab=labs.find(l=>l.id===view);

  return(
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Inventory Management</h2>
          <p className="text-white/30 text-xs mt-0.5">Track school assets, labs, and equipment.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={()=>setPopup({type:"addLab"})} className="flex items-center gap-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 text-sm px-3 py-2 rounded-xl transition-colors"><Plus size={13}/>New Lab</button>
          <button onClick={()=>setPopup({type:"addItem"})} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white text-sm px-4 py-2 rounded-xl transition-colors font-medium"><Plus size={13}/>Add Item</button>
        </div>
      </div>

      {/* View tabs: General + Labs */}
      <div className="flex gap-2 flex-wrap bg-[#080D18] border border-white/5 rounded-xl p-1.5">
        <button onClick={()=>{setView("general");setSearch("");setCatFilter("all");setCondFilter("all");}}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view==="general"?"bg-amber-600 text-white":"text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
          <Boxes size={12}/>General Stock
        </button>
        {labs.map(lab=>(
          <button key={lab.id} onClick={()=>{
            if(unlockedLabs.has(lab.id)){setView(lab.id);setSearch("");setCatFilter("all");setCondFilter("all");}
            else setPopup({type:"unlockLab",data:lab});
          }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view===lab.id?"bg-blue-600 text-white":"text-white/40 hover:text-white/70 hover:bg-white/5"}`}>
            <span>{lab.icon}</span>{lab.name}
            {!unlockedLabs.has(lab.id)&&<Lock size={10} className="opacity-50"/>}
          </button>
        ))}
      </div>

      {/* Active lab banner */}
      {activeLab&&(
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${activeLab.color}`}>
          <span className="text-2xl">{activeLab.icon}</span>
          <div className="flex-1"><div className="text-white text-sm font-semibold">{activeLab.name}</div><div className="text-white/40 text-xs">{activeLab.description}</div></div>
          <button onClick={()=>setPopup({type:"editLab",data:activeLab})} className="text-white/30 hover:text-white/60 text-xs border border-white/10 px-2 py-1 rounded-lg"><Edit2 size={11}/></button>
          <button onClick={()=>{if(confirm(`Delete ${activeLab.name} and all its items?`))deleteLab(activeLab.id);}} className="text-white/30 hover:text-red-400 text-xs border border-white/10 px-2 py-1 rounded-lg"><Trash2 size={11}/></button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {label:"Items in View",  val:`${viewItems.length} items`,   color:"text-white"},
          {label:"Total Units",    val:`${totalUnits.toLocaleString()}`, color:"text-amber-400"},
          {label:"Need Attention", val:`${attentionCount} items`,     color:attentionCount>0?"text-red-400":"text-emerald-400"}
        ].map(c=>(
          <div key={c.label} className="bg-[#080D18] border border-white/5 rounded-2xl px-5 py-4">
            <div className="text-white/30 text-xs uppercase tracking-wider mb-1">{c.label}</div>
            <div className={`text-xl font-bold font-mono ${c.color}`}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search size={13} className="text-white/30"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search items…" className="bg-transparent text-white text-xs outline-none placeholder-white/20 w-28"/>
        </div>
        <select value={catFilter} onChange={e=>setCatFilter(e.target.value)} className="bg-[#080D18] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none">
          {cats.map(c=><option key={c} value={c}>{c==="all"?"All Categories":c}</option>)}
        </select>
        <select value={condFilter} onChange={e=>setCondFilter(e.target.value as any)} className="bg-[#080D18] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none">
          <option value="all">All Conditions</option>{Object.entries(COND_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="ml-auto text-xs text-white/30 self-center">{filtered.length} items</div>
      </div>

      {/* Items grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(item=>(
          <div key={item.id} className={`bg-[#080D18] border rounded-2xl p-4 group hover:border-white/10 transition-colors ${(item.condition==="poor"||item.condition==="damaged")?"border-red-500/20":"border-white/5"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-white font-semibold text-sm">{item.name}</div>
                <div className="text-white/30 text-xs mt-0.5">{item.category} · {item.location}</div>
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={()=>setPopup({type:"editItem",data:item})} className="w-7 h-7 rounded-lg border border-white/10 hover:border-blue-500/30 flex items-center justify-center"><Edit2 size={11} className="text-white/40 hover:text-blue-400"/></button>
                <button onClick={()=>deleteItem(item.id)} className="w-7 h-7 rounded-lg border border-white/10 hover:border-red-500/30 flex items-center justify-center"><Trash2 size={11} className="text-white/40 hover:text-red-400"/></button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 text-center">
                  <div className="text-amber-400 font-bold font-mono text-lg leading-none">{item.quantity}</div>
                  <div className="text-amber-400/60 text-[10px]">{item.unit}</div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${COND_CFG[item.condition].color}`}>{COND_CFG[item.condition].label}</span>
              </div>
              <div className="text-white/20 text-[10px] font-mono">Checked {item.lastChecked}</div>
            </div>
            {item.note&&<div className="mt-2 text-white/30 text-xs italic">{item.note}</div>}
          </div>
        ))}
        {filtered.length===0&&(
          <div className="col-span-2 text-center py-16 text-white/20 text-sm bg-[#080D18] border border-dashed border-white/10 rounded-2xl">
            <Boxes size={32} className="mx-auto mb-3 opacity-30"/>
            {view==="general"?"No general stock items yet.":"No items in this lab yet. Add one above."}
          </div>
        )}
      </div>

      {/* Popups */}
      {popup&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setPopup(null)}>
          {(popup.type==="addItem"||popup.type==="editItem")&&(
            <InventoryItemForm initial={popup.data} labId={view==="general"?undefined:view} labs={labs} onSave={saveItem} onClose={()=>setPopup(null)} condCfg={COND_CFG}/>
          )}
          {(popup.type==="addLab"||popup.type==="editLab")&&(
            <LabForm initial={popup.data} onSave={(lab:any)=>{
              if(lab.id) db.updateLab(lab);
              else saveLab(lab);
              setPopup(null);
            }} onClose={()=>setPopup(null)}/>
          )}
          {popup.type==="unlockLab"&&(
            <div className="bg-[#080D18] border border-white/10 rounded-2xl p-6 w-80 space-y-4 shadow-2xl" style={{animation:"fadeUp 0.3s ease"}}>
              <div className="text-center">
                <div className="text-4xl mb-3">{popup.data.icon}</div>
                <h3 className="text-white font-bold">{popup.data.name}</h3>
                <p className="text-white/30 text-xs mt-1">Enter lab password to access</p>
              </div>
              <div className="relative">
                <input type="password" value={labPw} onChange={e=>setLabPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryUnlockLab(popup.data)}
                  placeholder="Lab password" autoFocus
                  className={`w-full bg-white/5 border text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors placeholder-white/20 ${labPwErr?"border-red-500/50 bg-red-500/5":"border-white/10 focus:border-blue-500/50"}`}/>
              </div>
              {labPwErr&&<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-xs text-red-400"><AlertCircle size={12}/>Wrong password</div>}
              <button onClick={()=>tryUnlockLab(popup.data)} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl flex items-center justify-center gap-2"><KeyRound size={13}/>Unlock Lab</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LabForm({initial,onSave,onClose}:{initial?:Lab;onSave:(l:any)=>void;onClose:()=>void}){
  const COLORS=["bg-blue-500/10 border-blue-500/20","bg-cyan-500/10 border-cyan-500/20","bg-emerald-500/10 border-emerald-500/20","bg-purple-500/10 border-purple-500/20","bg-amber-500/10 border-amber-500/20","bg-red-500/10 border-red-500/20"];
  const ICONS=["⚗️","💻","🔬","🧪","🔭","📡","🧬","⚡","🤖","🛠️","📐","🏋️"];
  const [form,setForm]=React.useState({name:initial?.name||"",icon:initial?.icon||"⚗️",description:initial?.description||"",password:initial?.password||"",color:initial?.color||COLORS[0]});
  const set=(k:keyof typeof form)=>(v:string)=>setForm(f=>({...f,[k]:v}));
  const [showPw,setShowPw]=React.useState(false);
  return(
    <div className="bg-[#080D18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" style={{animation:"fadeUp 0.3s ease"}}>
      <div className="flex items-center justify-between"><h3 className="font-bold text-white">{initial?"Edit Lab":"Create New Lab"}</h3><button onClick={onClose} className="text-white/30 hover:text-white/60"><X size={16}/></button></div>
      {/* Icon picker */}
      <div>
        <label className="text-xs text-white/40 uppercase block mb-2">Lab Icon</label>
        <div className="flex gap-2 flex-wrap">{ICONS.map(ic=><button key={ic} type="button" onClick={()=>set("icon")(ic)} className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${form.icon===ic?"border-blue-500/50 bg-blue-500/10":"border-white/10 hover:border-white/20"}`}>{ic}</button>)}</div>
      </div>
      {/* Color picker */}
      <div>
        <label className="text-xs text-white/40 uppercase block mb-2">Accent Color</label>
        <div className="flex gap-2">{COLORS.map(c=><button key={c} type="button" onClick={()=>set("color")(c)} className={`w-7 h-7 rounded-lg border-2 ${c} transition-all ${form.color===c?"scale-110 opacity-100":"opacity-50 hover:opacity-80"}`}/>)}</div>
      </div>
      <div><label className="text-xs text-white/40 uppercase block mb-1.5">Lab Name *</label><input value={form.name} onChange={e=>set("name")(e.target.value)} placeholder="e.g. Chemistry Lab" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
      <div><label className="text-xs text-white/40 uppercase block mb-1.5">Description</label><input value={form.description} onChange={e=>set("description")(e.target.value)} placeholder="Brief description of the lab" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
      <div>
        <label className="text-xs text-white/40 uppercase block mb-1.5">Lab Access Password *</label>
        <div className="relative"><input type={showPw?"text":"password"} value={form.password} onChange={e=>set("password")(e.target.value)} placeholder="Set a unique password for this lab" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-amber-500/50 placeholder-white/20"/><button type="button" onClick={()=>setShowPw(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">{showPw?<EyeOff size={14}/>:<Eye size={14}/>}</button></div>
        <p className="text-white/20 text-[10px] mt-1">Teachers need this password to access the lab inventory.</p>
      </div>
      <button onClick={()=>{if(!form.name||!form.password)return;onSave(initial?{...form,id:initial.id}:form);}} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-3 rounded-xl flex items-center justify-center gap-2 font-medium"><Save size={14}/>{initial?"Update Lab":"Create Lab"}</button>
    </div>
  );
}

function InventoryItemForm({initial,labId,labs,onSave,onClose,condCfg}:{initial?:InventoryItem;labId?:string;labs:Lab[];onSave:(i:any)=>void;onClose:()=>void;condCfg:Record<ItemCondition,{label:string;color:string}>}){
  const [form,setForm]=React.useState({name:initial?.name||"",category:initial?.category||"",quantity:initial?.quantity||1,unit:initial?.unit||"pcs",condition:(initial?.condition||"good") as ItemCondition,location:initial?.location||"",note:initial?.note||"",labId:initial?.labId||labId||""});
  const set=(k:keyof typeof form)=>(v:any)=>setForm(f=>({...f,[k]:v}));
  return(
    <div className="bg-[#080D18] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" style={{animation:"fadeUp 0.3s ease"}}>
      <div className="flex items-center justify-between"><h3 className="font-bold text-white">{initial?"Edit Item":"Add Inventory Item"}</h3><button onClick={onClose} className="text-white/30 hover:text-white/60"><X size={16}/></button></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1.5">Item Name *</label><input defaultValue={form.name} onChange={e=>set("name")(e.target.value)} placeholder="e.g. Desktop Computers" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-500/50 placeholder-white/20"/></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Category</label><input defaultValue={form.category} onChange={e=>set("category")(e.target.value)} placeholder="e.g. Technology" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 placeholder-white/20"/></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Location</label><input defaultValue={form.location} onChange={e=>set("location")(e.target.value)} placeholder="e.g. Shelf A-1" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 placeholder-white/20"/></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Quantity</label><input type="number" defaultValue={form.quantity} onChange={e=>set("quantity")(parseInt(e.target.value)||0)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 font-mono"/></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Unit</label><input defaultValue={form.unit} onChange={e=>set("unit")(e.target.value)} placeholder="pcs / sets / kg…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50 placeholder-white/20"/></div>
        <div className="col-span-2">
          <label className="text-xs text-white/40 uppercase block mb-1.5">Assign to Lab <span className="text-white/20">(optional)</span></label>
          <select defaultValue={form.labId} onChange={e=>set("labId")(e.target.value)} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-amber-500/50">
            <option value="">General Stock (no lab)</option>
            {labs.map(l=><option key={l.id} value={l.id}>{l.icon} {l.name}</option>)}
          </select>
        </div>
        <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1.5">Condition</label>
          <div className="flex gap-2 flex-wrap">{(Object.entries(condCfg) as [ItemCondition,{label:string;color:string}][]).map(([k,v])=>(
            <button key={k} type="button" onClick={()=>set("condition")(k)} className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${form.condition===k?v.color:"border-white/10 text-white/30 hover:text-white/60"}`}>{v.label}</button>
          ))}</div>
        </div>
        <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1.5">Note (optional)</label><input defaultValue={form.note} onChange={e=>set("note")(e.target.value)} placeholder="Any additional info…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-amber-500/50 placeholder-white/20"/></div>
      </div>
      <button onClick={()=>onSave(initial?{...form,id:initial.id,lastChecked:today,labId:form.labId||undefined}:{...form,lastChecked:today,labId:form.labId||undefined})} className="w-full bg-amber-600 hover:bg-amber-500 text-white text-sm py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"><Save size={14}/>{initial?"Save Changes":"Add to Inventory"}</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETTINGS TAB — with General + Security Center sub-tabs
// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// BEHAVIOR / DISCIPLINE MODULE
// ═══════════════════════════════════════════════════════════════════════════════
function BehaviorModule({state,setState,db}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;db:DbOps}){
  const upd=(fn:(b:BehaviorState)=>BehaviorState)=>setState(s=>({...s,behavior:fn(s.behavior)}));
  const [filterSt,setFilterSt]=useState("");
  const [filterType,setFilterType]=useState<"all"|"positive"|"negative">("all");
  const [filterStatus,setFilterStatus]=useState<"all"|BehaviorStatus>("all");
  const [popup,setPopup]=useState<{type:string;data?:BehaviorRecord}|null>(null);

  const SEV_CFG:Record<BehaviorSeverity,{label:string;color:string;dot:string}>={
    commendation:{label:"Commendation",color:"bg-emerald-500/20 text-emerald-400 border-emerald-500/30",dot:"bg-emerald-400"},
    minor:        {label:"Minor",       color:"bg-blue-500/20 text-blue-400 border-blue-500/30",         dot:"bg-blue-400"},
    moderate:     {label:"Moderate",    color:"bg-amber-500/20 text-amber-400 border-amber-500/30",      dot:"bg-amber-400"},
    serious:      {label:"Serious",     color:"bg-orange-500/20 text-orange-400 border-orange-500/30",   dot:"bg-orange-400"},
    critical:     {label:"Critical",    color:"bg-red-500/20 text-red-400 border-red-500/30",            dot:"bg-red-400"},
  };
  const STATUS_CFG:Record<BehaviorStatus,{label:string;color:string}>={
    open:       {label:"Open",       color:"bg-red-500/10 text-red-400 border-red-500/20"},
    monitoring: {label:"Monitoring", color:"bg-amber-500/10 text-amber-400 border-amber-500/20"},
    resolved:   {label:"Resolved",   color:"bg-emerald-500/10 text-emerald-400 border-emerald-500/20"},
  };
  const CATEGORIES=["Academic","Discipline","Attendance","Bullying","Property","Uniform","Positive Achievement","Community","Other"];

  const records=state.behavior.records.filter(r=>{
    const st=state.students.find(s=>s.id===r.studentId);
    if(filterSt&&!st?.name.toLowerCase().includes(filterSt.toLowerCase())&&!st?.rollNo.includes(filterSt)) return false;
    if(filterType!=="all"&&r.type!==filterType) return false;
    if(filterStatus!=="all"&&r.status!==filterStatus) return false;
    return true;
  }).sort((a,b)=>b.date.localeCompare(a.date));

  const totalPos=state.behavior.records.filter(r=>r.type==="positive").length;
  const totalNeg=state.behavior.records.filter(r=>r.type==="negative").length;
  const openCount=state.behavior.records.filter(r=>r.status==="open").length;

  function deleteRecord(id:string){db.deleteBehavior(id);}

  function cycleStatus(rec:BehaviorRecord){
    const order:BehaviorStatus[]=["open","monitoring","resolved"];
    const next=order[(order.indexOf(rec.status)+1)%order.length];
    db.updateBehavior({...rec,status:next});
  }

  return(
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Behavior & Discipline</h2>
          <p className="text-white/30 text-xs mt-0.5">Track student commendations, incidents, and disciplinary actions.</p>
        </div>
        <button onClick={()=>setPopup({type:"add"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2.5 rounded-xl transition-colors font-medium"><Plus size={14}/>Log Record</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {label:"Commendations",val:totalPos,color:"text-emerald-400",bg:"bg-emerald-500/10 border-emerald-500/20"},
          {label:"Incidents",val:totalNeg,color:"text-red-400",bg:"bg-red-500/10 border-red-500/20"},
          {label:"Open Cases",val:openCount,color:openCount>0?"text-amber-400":"text-white/40",bg:"bg-amber-500/10 border-amber-500/20"},
        ].map(c=>(
          <div key={c.label} className={`border rounded-2xl px-5 py-4 ${c.bg}`}>
            <div className="text-white/40 text-xs uppercase tracking-wider mb-1">{c.label}</div>
            <div className={`text-3xl font-bold font-mono ${c.color}`}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search size={13} className="text-white/30"/><input value={filterSt} onChange={e=>setFilterSt(e.target.value)} placeholder="Search student…" className="bg-transparent text-white text-xs outline-none placeholder-white/20 w-28"/>
        </div>
        <div className="flex gap-1 bg-[#080D18] border border-white/5 rounded-xl p-1">
          {(["all","positive","negative"] as const).map(t=>(
            <button key={t} onClick={()=>setFilterType(t)} className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterType===t?(t==="positive"?"bg-emerald-600 text-white":t==="negative"?"bg-red-600 text-white":"bg-blue-600 text-white"):"text-white/40 hover:text-white/70"}`}>
              {t==="all"?"All":t==="positive"?"✓ Positive":"✗ Negative"}
            </button>
          ))}
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)} className="bg-[#080D18] border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none">
          <option value="all">All Status</option><option value="open">Open</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option>
        </select>
        <div className="ml-auto text-xs text-white/30">{records.length} records</div>
      </div>

      {/* Records */}
      <div className="space-y-2">
        {records.map(rec=>{
          const st=state.students.find(s=>s.id===rec.studentId);
          const cls=state.classes.find(c=>c.id===st?.classId);
          return(
            <div key={rec.id} className={`bg-[#080D18] border rounded-2xl p-4 group transition-colors ${rec.type==="negative"&&rec.severity==="critical"?"border-red-500/20 hover:border-red-500/30":"border-white/5 hover:border-white/10"}`}>
              <div className="flex items-start gap-4">
                {/* Severity dot */}
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${SEV_CFG[rec.severity].dot}`}/>
                {/* Student */}
                <div className="flex items-center gap-3 w-40 flex-shrink-0">
                  <img src={st?.photo||""} className="w-8 h-8 rounded-full"/>
                  <div>
                    <div className="text-white text-xs font-semibold">{st?.name}</div>
                    <div className="text-white/30 text-[10px] font-mono">{st?.rollNo} · {cls?.name}-{cls?.section}</div>
                  </div>
                </div>
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${rec.type==="positive"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/20":"bg-red-500/10 text-red-400 border-red-500/20"}`}>
                      {rec.type==="positive"?"▲ Positive":"▼ Incident"}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${SEV_CFG[rec.severity].color}`}>{SEV_CFG[rec.severity].label}</span>
                    <span className="text-[10px] bg-white/5 text-white/40 px-2 py-0.5 rounded-full border border-white/10">{rec.category}</span>
                  </div>
                  <p className="text-white/70 text-xs leading-relaxed">{rec.description}</p>
                  {rec.actionTaken&&<p className="text-blue-400/70 text-[10px] mt-1">↳ {rec.actionTaken}</p>}
                </div>
                {/* Right side: date, status, actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <div className="text-white/25 text-[10px] font-mono">{rec.date}</div>
                  <button onClick={()=>cycleStatus(rec)} className={`text-[10px] px-2 py-0.5 rounded-full border cursor-pointer transition-all hover:opacity-80 ${STATUS_CFG[rec.status].color}`}>{STATUS_CFG[rec.status].label}</button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>setPopup({type:"edit",data:rec})} className="w-6 h-6 rounded-lg border border-white/10 hover:border-blue-500/30 flex items-center justify-center"><Edit2 size={10} className="text-white/40 hover:text-blue-400"/></button>
                    <button onClick={()=>deleteRecord(rec.id)} className="w-6 h-6 rounded-lg border border-white/10 hover:border-red-500/30 flex items-center justify-center"><Trash2 size={10} className="text-white/40 hover:text-red-400"/></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {records.length===0&&(
          <div className="text-center py-16 bg-[#080D18] border border-dashed border-white/10 rounded-2xl text-white/20 text-sm">
            <AlertTriangle size={32} className="mx-auto mb-3 opacity-30"/>No behavior records found.
          </div>
        )}
      </div>

      {/* Add/Edit popup */}
      {popup&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&setPopup(null)}>
          <BehaviorForm
            initial={popup.data}
            students={state.students}
            classes={state.classes}
            categories={CATEGORIES}
            sevCfg={SEV_CFG}
            onSave={rec=>{
              if(rec.id) db.updateBehavior(rec);
              else db.addBehavior({...rec,id:uid()});
              setPopup(null);
            }}
            onClose={()=>setPopup(null)}
          />
        </div>
      )}
    </div>
  );
}

function BehaviorForm({initial,students,classes,categories,sevCfg,onSave,onClose}:{
  initial?:BehaviorRecord; students:Student[]; classes:Class[];
  categories:string[]; sevCfg:Record<BehaviorSeverity,{label:string;color:string;dot:string}>;
  onSave:(r:any)=>void; onClose:()=>void;
}){
  const [form,setForm]=useState({
    studentId:initial?.studentId||students[0]?.id||"",
    date:initial?.date||today,
    type:(initial?.type||"negative") as "positive"|"negative",
    severity:(initial?.severity||"minor") as BehaviorSeverity,
    category:initial?.category||categories[0],
    description:initial?.description||"",
    actionTaken:initial?.actionTaken||"",
    status:(initial?.status||"open") as BehaviorStatus,
    reportedBy:initial?.reportedBy||"Admin",
  });
  const set=(k:keyof typeof form)=>(v:any)=>setForm(f=>({...f,[k]:v}));
  const SEVS:BehaviorSeverity[]=form.type==="positive"?["commendation"]:["minor","moderate","serious","critical"];
  return(
    <div className="bg-[#080D18] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl space-y-4 overflow-y-auto max-h-[90vh]" style={{animation:"fadeUp 0.3s ease"}}>
      <div className="flex items-center justify-between"><h3 className="font-bold text-white">{initial?"Edit Record":"Log Behavior Record"}</h3><button onClick={onClose} className="text-white/30 hover:text-white/60"><X size={16}/></button></div>
      {/* Type toggle */}
      <div className="flex gap-2">
        {(["positive","negative"] as const).map(t=>(
          <button key={t} type="button" onClick={()=>{set("type")(t);set("severity")(t==="positive"?"commendation":"minor");}} className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${form.type===t?(t==="positive"?"bg-emerald-600 border-emerald-500 text-white":"bg-red-600 border-red-500 text-white"):"border-white/10 text-white/40 hover:text-white/60"}`}>
            {t==="positive"?"▲ Positive Achievement":"▼ Incident / Discipline"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1.5">Student *</label>
          <select value={form.studentId} onChange={e=>set("studentId")(e.target.value)} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500/50">
            {students.map(s=>{const c=classes.find(x=>x.id===s.classId);return<option key={s.id} value={s.id}>{s.name} ({s.rollNo} · {c?.name}-{c?.section})</option>;})}</select></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Date</label><input type="date" value={form.date} onChange={e=>set("date")(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500/50"/></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Category</label>
          <select value={form.category} onChange={e=>set("category")(e.target.value)} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500/50">
            {categories.map(c=><option key={c}>{c}</option>)}</select></div>
        <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1.5">Severity</label>
          <div className="flex gap-2 flex-wrap">{SEVS.map(s=><button key={s} type="button" onClick={()=>set("severity")(s)} className={`text-[10px] px-2.5 py-1 rounded-full border transition-all ${form.severity===s?sevCfg[s].color:"border-white/10 text-white/30 hover:text-white/60"}`}>{sevCfg[s].label}</button>)}</div></div>
        <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1.5">Description *</label><textarea value={form.description} onChange={e=>set("description")(e.target.value)} rows={3} placeholder="Describe the incident or achievement in detail…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 resize-none placeholder-white/20"/></div>
        <div className="col-span-2"><label className="text-xs text-white/40 uppercase block mb-1.5">Action Taken</label><input value={form.actionTaken} onChange={e=>set("actionTaken")(e.target.value)} placeholder="e.g. Verbal warning, parent meeting, award…" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Status</label>
          <select value={form.status} onChange={e=>set("status")(e.target.value as any)} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500/50">
            <option value="open">Open</option><option value="monitoring">Monitoring</option><option value="resolved">Resolved</option></select></div>
        <div><label className="text-xs text-white/40 uppercase block mb-1.5">Reported By</label><input value={form.reportedBy} onChange={e=>set("reportedBy")(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500/50"/></div>
      </div>
      <button onClick={()=>{if(!form.studentId||!form.description.trim())return;onSave(initial?{...form,id:initial.id}:form);}} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2"><Save size={14}/>{initial?"Update Record":"Save Record"}</button>
    </div>
  );
}

function SettingsTab({state,upd,isSA,setPopup}:{state:AppState;upd:(fn:(s:AppState)=>AppState)=>void;isSA:boolean;setPopup:(p:any)=>void}){
  const [stab,setStab]=useState<"general"|"security">("general");
  return(
    <div className="space-y-6 max-w-xl">
      <h2 className="text-xl font-bold text-white">Global Settings</h2>
      <div className="flex gap-2 bg-[#080D18] border border-white/5 rounded-xl p-1.5">
        {([{id:"general",label:"General",Icon:Settings},{id:"security",label:"Security Center",Icon:Shield}] as const).map(t=>(
          <button key={t.id} onClick={()=>setStab(t.id as any)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${stab===t.id?"bg-blue-600 text-white":"text-white/40 hover:text-white/70 hover:bg-white/5"}`}><t.Icon size={12}/>{t.label}</button>
        ))}
      </div>

      {stab==="general"&&(
        <div className="bg-[#080D18] border border-white/5 rounded-xl p-6 space-y-5">
          <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-2">School Name</label><input value={state.settings.name} onChange={e=>upd(s=>({...s,settings:{...s.settings,name:e.target.value}}))} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50"/></div>
          <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Tagline</label><input value={state.settings.tagline} onChange={e=>upd(s=>({...s,settings:{...s.settings,tagline:e.target.value}}))} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50"/></div>
          <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-2">Blog URL</label><input value={state.settings.blogUrl} onChange={e=>upd(s=>({...s,settings:{...s.settings,blogUrl:e.target.value}}))} placeholder="https://..." className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-2">School Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {state.settings.logoUrl?<img src={state.settings.logoUrl} className="w-full h-full object-cover"/>:<School size={22} className="text-white/20"/>}
              </div>
              <div className="flex-1 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs px-3 py-2 rounded-lg transition-colors w-fit"><Upload size={12}/>Upload Image<input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const logoUrl=ev.target?.result as string;try{localStorage.setItem("school_logo",logoUrl);}catch{}upd(s=>({...s,settings:{...s.settings,logoUrl}}));};r.readAsDataURL(f);}}/></label>
                <input value={state.settings.logoUrl?.startsWith("data:")?"":(state.settings.logoUrl||"")} onChange={e=>{const logoUrl=e.target.value;try{if(logoUrl)localStorage.setItem("school_logo",logoUrl);else localStorage.removeItem("school_logo");}catch{}upd(s=>({...s,settings:{...s.settings,logoUrl}}));}} placeholder="...or paste image URL" className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 placeholder-white/20"/>
              </div>
            </div>
            {state.settings.logoUrl&&<button onClick={()=>{try{localStorage.removeItem("school_logo");}catch{}upd(s=>({...s,settings:{...s.settings,logoUrl:""}}))} } className="mt-2 text-xs text-red-400/60 hover:text-red-400 transition-colors">Remove logo</button>}
          </div>
          {!isSA&&(
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-3">Support Admins</label>
              <div className="space-y-2 mb-3">
                {state.supportAdmins.map(sa=>(
                  <div key={sa.id} className="flex items-center justify-between bg-white/3 border border-white/5 rounded-xl px-4 py-2.5">
                    <div><div className="text-sm text-white">{sa.name}</div><div className="text-xs text-white/40">{sa.email}</div></div>
                    <button onClick={()=>upd(s=>({...s,supportAdmins:s.supportAdmins.filter(x=>x.id!==sa.id)}))} className="text-white/20 hover:text-red-400 transition-colors"><Trash2 size={13}/></button>
                  </div>
                ))}
              </div>
              <button onClick={()=>setPopup({type:"addSupportAdmin"})} className="flex items-center gap-2 text-xs border border-white/10 hover:border-cyan-500/30 text-white/40 hover:text-cyan-400 px-3 py-2 rounded-lg transition-colors"><Plus size={12}/>Add Support Admin</button>
            </div>
          )}
        </div>
      )}

      {stab==="security"&&<SecurityCenter state={state} setState={upd}/>}
    </div>
  );
}

// ─── Security Center ─────────────────────────────────────────────────────────
function SecurityCenter({state,setState}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void}){
  const [saved,setSaved]=useState<string|null>(null);
  const [show,setShow]=useState<Record<string,boolean>>({});
  const [labPws,setLabPws]=useState<Record<string,string>>(
    Object.fromEntries(state.inventory.labs.map(l=>[l.id,l.password]))
  );

  function toggleShow(k:string){setShow(s=>({...s,[k]:!s[k]}));}

  function saveSystemPw(key:"pwAdmin"|"pwCounselor"|"pwStaff",val:string){
    if(!val.trim()) return;
    setState(s=>({...s,settings:{...s.settings,[key]:val.trim()}}));
    setSaved(key); setTimeout(()=>setSaved(null),2000);
  }

  function saveLabPw(labId:string){
    const pw=labPws[labId];
    if(!pw?.trim()) return;
    setState(s=>({...s,inventory:{...s.inventory,labs:s.inventory.labs.map(l=>l.id===labId?{...l,password:pw.trim()}:l)}}));
    setSaved(labId); setTimeout(()=>setSaved(null),2000);
  }

  const SYS_PW_ROWS:[string,"pwAdmin"|"pwCounselor"|"pwStaff",string,string][]=[
    ["Admin Login & Result Ledger","pwAdmin","Used to log in as Administrator and unlock the Result Ledger","text-blue-400"],
    ["Counseling Module","pwCounselor","Required to enter the Counseling tab","text-purple-400"],
    ["Finance & Inventory","pwStaff","Required for Fees and Inventory modules","text-emerald-400"],
  ];

  return(
    <div className="space-y-5">
      <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
        <Shield size={16} className="text-red-400 flex-shrink-0"/>
        <p className="text-red-400/80 text-xs">Password changes take effect immediately. Keep a secure record of all passwords.</p>
      </div>

      {/* System passwords */}
      <div className="bg-[#080D18] border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><KeyRound size={13}/>System Passwords</h3>
        {SYS_PW_ROWS.map(([label,key,hint,color])=>(
          <PasswordRow
            key={key}
            label={label}
            hint={hint}
            current={state.settings[key]}
            accent={color}
            showPw={!!show[key]}
            onToggleShow={()=>toggleShow(key)}
            saved={saved===key}
            onSave={val=>saveSystemPw(key,val)}
          />
        ))}
      </div>

      {/* Lab passwords */}
      {state.inventory.labs.length>0&&(
        <div className="bg-[#080D18] border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"><Package size={13}/>Lab Access Passwords</h3>
          {state.inventory.labs.map(lab=>(
            <div key={lab.id} className={`p-4 rounded-xl border ${lab.color} space-y-2`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{lab.icon}</span>
                <div><div className="text-white text-sm font-semibold">{lab.name}</div><div className="text-white/30 text-xs">{lab.description}</div></div>
              </div>
              <PasswordRow
                label={`${lab.name} Password`}
                hint="Teachers use this to access the lab inventory"
                current={lab.password}
                accent="text-amber-400"
                showPw={!!show[lab.id]}
                onToggleShow={()=>toggleShow(lab.id)}
                saved={saved===lab.id}
                onSave={val=>{ setLabPws(p=>({...p,[lab.id]:val})); saveLabPw(lab.id); }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PasswordRow({label,hint,current,accent,showPw,onToggleShow,saved,onSave}:{label:string;hint:string;current:string;accent:string;showPw:boolean;onToggleShow:()=>void;saved:boolean;onSave:(v:string)=>void}){
  const [val,setVal]=useState(current);
  return(
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div><div className={`text-xs font-semibold ${accent}`}>{label}</div><div className="text-white/25 text-[10px]">{hint}</div></div>
        {saved&&<div className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle size={11}/>Saved</div>}
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input type={showPw?"text":"password"} value={val} onChange={e=>setVal(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-blue-500/50 font-mono"/>
          <button type="button" onClick={onToggleShow} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">{showPw?<EyeOff size={13}/>:<Eye size={13}/>}</button>
        </div>
        <button onClick={()=>onSave(val)} disabled={!val.trim()||val===current} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white text-xs px-4 py-2.5 rounded-xl transition-colors font-medium whitespace-nowrap"><Save size={12}/>Update</button>
      </div>
    </div>
  );
}

function StaffManager({state,setState}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void}){
  const upd=(fn:(c:CMS)=>CMS)=>setState(s=>({...s,cms:fn(s.cms)}));
  const staff=state.cms.staff;

  // Form state
  const [name,setName]         = useState("");
  const [desig,setDesig]       = useState("");
  const [role,setRole]         = useState<StaffRole>("teacher");
  const [dept,setDept]         = useState("");
  const [photo,setPhoto]       = useState("");
  const [photoMode,setPhMode]  = useState<"url"|"upload">("url");
  const [editId,setEditId]     = useState<string|null>(null);
  const [msg,setMsg]           = useState("");

  const ROLE_LABELS:Record<StaffRole,string>={
    principal:"Principal",
    deputy_principal:"Deputy Principal",
    assistant_principal:"Assistant Principal",
    sectional_head:"Sectional Head",
    teacher:"Class / Subject Teacher",
  };
  const ROLE_ORDER:StaffRole[]=["principal","deputy_principal","assistant_principal","sectional_head","teacher"];

  function resetForm(){setName("");setDesig("");setRole("teacher");setDept("");setPhoto("");setEditId(null);}

  function startEdit(m:StaffMember){
    setName(m.name);setDesig(m.designation);setRole(m.role);setDept(m.department||"");
    setPhoto(m.photo);setEditId(m.id);setPhMode(m.photo.startsWith("data:")?"upload":"url");
  }

  function save(){
    if(!name.trim()||!desig.trim()){setMsg("Name and Designation are required.");return;}
    const entry:StaffMember={id:editId||uid(),name:name.trim(),designation:desig.trim(),role,department:dept.trim()||undefined,photo:photo||`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`};
    if(editId){
      upd(c=>({...c,staff:c.staff.map(x=>x.id===editId?entry:x)}));
      setMsg("✓ Staff member updated.");
    } else {
      upd(c=>({...c,staff:[...c.staff,entry]}));
      setMsg("✓ Staff member added.");
    }
    resetForm();
    setTimeout(()=>setMsg(""),3000);
  }

  function remove(id:string){upd(c=>({...c,staff:c.staff.filter(x=>x.id!==id)}));}

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-white">Manage Staff</h2><p className="text-white/30 text-xs mt-0.5">Add, edit, or remove staff members shown on the public Staff Directory page.</p></div>
        <div className="text-xs text-white/30 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{staff.length} members</div>
      </div>

      {/* Add / Edit Form */}
      <div className="bg-[#080D18] border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-white/70">{editId?"Edit Staff Member":"Add New Staff Member"}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Full Name *</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Dr. Kavindra Perera"
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/>
          </div>
          {/* Designation */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Designation *</label>
            <input value={desig} onChange={e=>setDesig(e.target.value)} placeholder="e.g. Principal"
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/>
          </div>
          {/* Role */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Hierarchy Role *</label>
            <select value={role} onChange={e=>setRole(e.target.value as StaffRole)}
              className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50">
              {ROLE_ORDER.map(r=><option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {/* Department */}
          <div>
            <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Department / Section <span className="text-white/20">(optional)</span></label>
            <input value={dept} onChange={e=>setDept(e.target.value)} placeholder="e.g. Science, Mathematics…"
              className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/>
          </div>
        </div>

        {/* Photo */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Profile Photo</label>
          <div className="flex gap-2 mb-2">
            <button onClick={()=>setPhMode("url")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${photoMode==="url"?"bg-blue-600 border-blue-500 text-white":"border-white/10 text-white/40 hover:text-white/70"}`}>URL</button>
            <button onClick={()=>setPhMode("upload")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${photoMode==="upload"?"bg-blue-600 border-blue-500 text-white":"border-white/10 text-white/40 hover:text-white/70"}`}>Upload</button>
          </div>
          <div className="flex gap-3 items-center">
            {/* Preview */}
            <div className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex-shrink-0 overflow-hidden">
              {photo
                ?<img src={photo} className="w-full h-full object-cover"/>
                :<div className="w-full h-full flex items-center justify-center text-white/20"><User size={18}/></div>}
            </div>
            {photoMode==="url"
              ?<input value={photo} onChange={e=>setPhoto(e.target.value)} placeholder="https://example.com/photo.jpg"
                  className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/>
              :<label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-white/10 hover:border-blue-500/40 text-white/40 hover:text-blue-400 text-sm rounded-xl py-2.5 cursor-pointer transition-all">
                  <Upload size={14}/>{photo?"Change Photo":"Click to Upload"}
                  <input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>setPhoto(ev.target?.result as string);r.readAsDataURL(f);}}/>
                </label>}
          </div>
          <p className="text-white/20 text-xs mt-1.5">Leave blank to use an auto-generated avatar.</p>
        </div>

        {msg&&<div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-emerald-400"><CheckCircle size={12}/>{msg}</div>}

        <div className="flex gap-3">
          <button onClick={save} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium"><Save size={14}/>{editId?"Save Changes":"Add Staff Member"}</button>
          {editId&&<button onClick={resetForm} className="border border-white/10 text-white/50 text-sm px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors">Cancel</button>}
        </div>
      </div>

      {/* Staff List grouped by role */}
      {ROLE_ORDER.map(r=>{
        const members=staff.filter(s=>s.role===r);
        if(!members.length) return null;
        return(
          <div key={r}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-wider">{ROLE_LABELS[r]}</div>
              <div className="flex-1 h-px bg-white/5"/>
              <div className="text-xs text-white/20">{members.length}</div>
            </div>
            <div className="space-y-2">
              {members.map(m=>(
                <div key={m.id} className="flex items-center gap-4 bg-[#080D18] border border-white/5 rounded-xl px-4 py-3 hover:border-blue-500/20 transition-colors group">
                  <div className="w-10 h-10 rounded-full border border-white/10 bg-white/5 flex-shrink-0 overflow-hidden">
                    <img src={m.photo||`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(m.name)}`} className="w-full h-full object-cover"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-semibold truncate">{m.name}</div>
                    <div className="text-white/40 text-xs">{m.designation}{m.department&&<span className="ml-2 text-white/25">· {m.department}</span>}</div>
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>startEdit(m)} className="w-8 h-8 rounded-lg border border-white/10 hover:border-blue-500/30 flex items-center justify-center"><Edit2 size={12} className="text-white/40 hover:text-blue-400"/></button>
                    <button onClick={()=>remove(m.id)} className="w-8 h-8 rounded-lg border border-white/10 hover:border-red-500/30 flex items-center justify-center"><Trash2 size={12} className="text-white/40 hover:text-red-400"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOADS MANAGER — Admin Dashboard Tab
// ═══════════════════════════════════════════════════════════════════════════════
function DownloadsManager({state,setState}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void}){
  const upd=(fn:(c:CMS)=>CMS)=>setState(s=>({...s,cms:fn(s.cms)}));
  const media=state.cms.media;

  const [mode,setMode]       = useState<"url"|"upload">("upload");
  const [urlInput,setUrl]    = useState("");
  const [fileName,setFName]  = useState("");
  const [fileType,setFType]  = useState<"image"|"pdf">("pdf");
  const [filter,setFilter]   = useState<"all"|"image"|"pdf">("all");
  const [msg,setMsg]         = useState("");

  function addFromUrl(){
    if(!urlInput.trim()||!fileName.trim()){setMsg("Please provide both a file name and URL.");return;}
    upd(c=>({...c,media:[...c.media,{id:uid(),name:fileName.trim(),url:urlInput.trim(),type:fileType,size:"—",uploadedAt:today}]}));
    setUrl("");setFName("");setMsg("✓ File added.");setTimeout(()=>setMsg(""),3000);
  }

  function remove(id:string){upd(c=>({...c,media:c.media.filter(x=>x.id!==id)}));}

  const shown=filter==="all"?media:media.filter(m=>m.type===filter);

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-white">Manage Downloads</h2><p className="text-white/30 text-xs mt-0.5">Upload or link PDFs, past papers, circulars, and images for the public Downloads page.</p></div>
        <div className="text-xs text-white/30 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">{media.length} files</div>
      </div>

      {/* Add File Form */}
      <div className="bg-[#080D18] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex gap-2 mb-1">
          <button onClick={()=>setMode("upload")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${mode==="upload"?"bg-blue-600 border-blue-500 text-white":"border-white/10 text-white/40 hover:text-white/70"}`}><Upload size={11} className="inline mr-1"/>Upload File</button>
          <button onClick={()=>setMode("url")} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${mode==="url"?"bg-blue-600 border-blue-500 text-white":"border-white/10 text-white/40 hover:text-white/70"}`}><Globe size={11} className="inline mr-1"/>Link by URL</button>
        </div>

        {mode==="upload"?(
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/40 hover:bg-blue-500/5 transition-all group">
            <Upload size={22} className="text-white/20 group-hover:text-blue-400 mb-2 transition-colors"/>
            <span className="text-sm text-white/40 group-hover:text-white/60">Click to upload — PDF, Image, or any file</span>
            <span className="text-xs text-white/20 mt-1">File will appear in the public Downloads page</span>
            <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden" onChange={e=>{
              const f=e.target.files?.[0]; if(!f) return;
              const r=new FileReader();
              r.onload=ev=>{
                const url=ev.target?.result as string;
                const t=f.type.includes("pdf")?"pdf":"image";
                upd(c=>({...c,media:[...c.media,{id:uid(),name:f.name,url,type:t,size:`${(f.size/1024).toFixed(1)} KB`,uploadedAt:today}]}));
                setMsg(`✓ "${f.name}" uploaded.`); setTimeout(()=>setMsg(""),3000);
              };
              r.readAsDataURL(f); e.target.value="";
            }}/>
          </label>
        ):(
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Display Name *</label>
                <input value={fileName} onChange={e=>setFName(e.target.value)} placeholder="e.g. Grade 10 Maths Past Paper 2024"
                  className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">File Type</label>
                <select value={fileType} onChange={e=>setFType(e.target.value as "image"|"pdf")}
                  className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50">
                  <option value="pdf">PDF / Document</option>
                  <option value="image">Image</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Direct URL *</label>
              <input value={urlInput} onChange={e=>setUrl(e.target.value)} placeholder="https://drive.google.com/… or any direct link"
                className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/>
            </div>
            <button onClick={addFromUrl} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium"><Plus size={14}/>Add Link</button>
          </div>
        )}

        {msg&&<div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-xs text-emerald-400"><CheckCircle size={12}/>{msg}</div>}
      </div>

      {/* File List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/60">Uploaded Files</h3>
          <div className="flex gap-2">
            {(["all","pdf","image"] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${filter===f?"bg-white/10 border-white/20 text-white":"border-white/5 text-white/30 hover:text-white/60"}`}>
                {f==="all"?"All":f==="pdf"?"PDFs":"Images"}
              </button>
            ))}
          </div>
        </div>

        {shown.length===0?(
          <div className="text-center py-16 bg-[#080D18] border border-dashed border-white/10 rounded-xl text-white/20 text-sm">
            <FileText size={32} className="mx-auto mb-3 opacity-30"/>No files yet. Upload above or add a URL link.
          </div>
        ):(
          <div className="space-y-2">
            {shown.map(m=>(
              <div key={m.id} className="flex items-center gap-4 bg-[#080D18] border border-white/5 rounded-xl px-4 py-3 hover:border-white/10 transition-colors group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${m.type==="pdf"?"bg-red-500/10":"bg-blue-500/10"}`}>
                  {m.type==="pdf"?<FileText size={16} className="text-red-400"/>:<Image size={16} className="text-blue-400"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm truncate">{m.name}</div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${m.type==="pdf"?"bg-red-500/10 text-red-400":"bg-blue-500/10 text-blue-400"}`}>{m.type.toUpperCase()}</span>
                    <span className="text-white/25 text-xs font-mono">{m.size}</span>
                    <span className="text-white/25 text-xs">{m.uploadedAt}</span>
                  </div>
                </div>
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg border border-white/10 hover:border-blue-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <ExternalLink size={12} className="text-white/40 hover:text-blue-400"/>
                </a>
                <button onClick={()=>remove(m.id)} className="w-8 h-8 rounded-lg border border-white/10 hover:border-red-500/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={12} className="text-white/40 hover:text-red-400"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CMSAdmin({state,setState}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void}){
  const [section,setSection]=useState("slides");
  const [popup,setPopup]=useState<{type:string;data?:any}|null>(null);
  const [richText,setRT]=useState("");
  const cms=state.cms;
  const upd=(fn:(c:CMS)=>CMS)=>setState(s=>({...s,cms:fn(s.cms)}));
  const close=()=>setPopup(null);

  const SECTIONS=[
    {id:"slides",    label:"Home Slides",   icon:PlayCircle},
    {id:"gallery",   label:"Gallery",       icon:Image},
    {id:"news",      label:"News & Blog",   icon:Newspaper},
    {id:"achievements",label:"Achievements",icon:Star},
    {id:"clubs",     label:"Clubs",         icon:Users2},
    {id:"principal", label:"Principal Msg", icon:User},
    {id:"vision",    label:"Vision & About",icon:Globe},
    {id:"media",     label:"Media Library", icon:FileText},
  ];

  function imgUpload(onUrl:(url:string)=>void){
    return(e:React.ChangeEvent<HTMLInputElement>)=>{
      const f=e.target.files?.[0]; if(!f) return;
      const r=new FileReader();
      r.onload=ev=>{
        const url=ev.target?.result as string;
        // Register in media library
        upd(c=>({...c,media:[...c.media,{id:uid(),name:f.name,url,type:"image",size:`${(f.size/1024).toFixed(1)}KB`,uploadedAt:today}]}));
        onUrl(url);
      };
      r.readAsDataURL(f);
      e.target.value="";
    };
  }

  function renderSection(){
    switch(section){
      case "slides": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-white font-bold text-lg">Home Slider</h3><button onClick={()=>setPopup({type:"addSlide"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"><Plus size={12}/>Add Slide</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cms.slides.map((sl,i)=>(
              <div key={sl.id} className="relative rounded-xl overflow-hidden border border-white/10 group">
                <img src={sl.imageUrl} className="w-full h-36 object-cover"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
                  <div className="text-white text-sm font-semibold">{sl.title}</div>
                  <div className="text-white/60 text-xs">{sl.subtitle}</div>
                </div>
                <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>setPopup({type:"editSlide",data:sl})} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-blue-500 flex items-center justify-center backdrop-blur-sm"><Edit2 size={12} className="text-white"/></button>
                  <button onClick={()=>upd(c=>({...c,slides:c.slides.filter(s=>s.id!==sl.id)}))} className="w-7 h-7 rounded-lg bg-white/20 hover:bg-red-500 flex items-center justify-center backdrop-blur-sm"><Trash2 size={12} className="text-white"/></button>
                </div>
                <div className="absolute top-2 left-2 text-xs bg-black/40 text-white/60 px-2 py-0.5 rounded-full backdrop-blur-sm">#{i+1}</div>
              </div>
            ))}
          </div>
        </div>
      );
      case "gallery": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-white font-bold text-lg">Gallery</h3><button onClick={()=>setPopup({type:"addGallery"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"><Plus size={12}/>Add Photo</button></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {cms.gallery.map(g=>(
              <div key={g.id} className="relative rounded-xl overflow-hidden border border-white/10 group">
                <img src={g.imageUrl} className="w-full h-28 object-cover"/>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2"><div className="text-white text-xs font-medium truncate">{g.caption}</div><div className="text-white/50 text-[10px]">{g.category}</div></div>
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={()=>upd(c=>({...c,gallery:c.gallery.filter(x=>x.id!==g.id)}))} className="w-6 h-6 rounded-lg bg-red-500/80 flex items-center justify-center"><Trash2 size={10} className="text-white"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case "news": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-white font-bold text-lg">News & Blog</h3><button onClick={()=>{setRT("");setPopup({type:"addNews"});}} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"><Plus size={12}/>New Post</button></div>
          <div className="space-y-3">
            {cms.news.map(n=>(
              <div key={n.id} className="flex gap-4 bg-[#080D18] border border-white/5 rounded-xl p-4 hover:border-blue-500/20 transition-colors">
                <img src={n.imageUrl} className="w-20 h-16 rounded-lg object-cover flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${n.category==="news"?"bg-blue-500/20 text-blue-400":n.category==="blog"?"bg-purple-500/20 text-purple-400":"bg-amber-500/20 text-amber-400"}`}>{n.category}</span>
                    {n.pinned&&<span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">📌 Pinned</span>}
                    <span className="text-xs text-white/30 ml-auto">{n.date}</span>
                  </div>
                  <div className="text-white text-sm font-semibold">{n.title}</div>
                  <div className="text-white/40 text-xs mt-0.5 line-clamp-1">{n.body.replace(/<[^>]+>/g,"")}</div>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button onClick={()=>{setRT(n.body);setPopup({type:"editNews",data:n});}} className="w-7 h-7 rounded-lg border border-white/10 hover:border-blue-500/30 flex items-center justify-center"><Edit2 size={12} className="text-white/40 hover:text-blue-400"/></button>
                  <button onClick={()=>upd(c=>({...c,news:c.news.filter(x=>x.id!==n.id)}))} className="w-7 h-7 rounded-lg border border-white/10 hover:border-red-500/30 flex items-center justify-center"><Trash2 size={12} className="text-white/40 hover:text-red-400"/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      case "achievements": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-white font-bold text-lg">Achievements</h3><button onClick={()=>setPopup({type:"addAch"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"><Plus size={12}/>Add Achievement</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cms.achievements.map(a=>(
              <div key={a.id} className="flex gap-3 bg-[#080D18] border border-white/5 rounded-xl p-4 group hover:border-yellow-500/20 transition-colors">
                <img src={a.imageUrl} className="w-16 h-16 rounded-lg object-cover flex-shrink-0"/>
                <div className="flex-1 min-w-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${a.category==="academic"?"bg-blue-500/20 text-blue-400":a.category==="sports"?"bg-emerald-500/20 text-emerald-400":"bg-purple-500/20 text-purple-400"}`}>{a.category} · {a.year}</span>
                  <div className="text-white text-sm font-semibold mt-1">{a.title}</div>
                  <div className="text-white/40 text-xs line-clamp-2">{a.description}</div>
                </div>
                <button onClick={()=>upd(c=>({...c,achievements:c.achievements.filter(x=>x.id!==a.id)}))} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all self-start"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        </div>
      );
      case "clubs": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between"><h3 className="text-white font-bold text-lg">Clubs & Societies</h3><button onClick={()=>setPopup({type:"addClub"})} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg transition-colors"><Plus size={12}/>Add Club</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cms.clubs.map(cl=>(
              <div key={cl.id} className="flex gap-3 bg-[#080D18] border border-white/5 rounded-xl p-4 group hover:border-purple-500/20 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-2xl flex-shrink-0">{cl.badge}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-semibold">{cl.name}</div>
                  <div className="text-white/40 text-xs line-clamp-1">{cl.description}</div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-white/30"><span className="flex items-center gap-1"><User size={9}/>{cl.teacher}</span><span className="flex items-center gap-1"><Users2 size={9}/>{cl.members} members</span></div>
                </div>
                <button onClick={()=>upd(c=>({...c,clubs:c.clubs.filter(x=>x.id!==cl.id)}))} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all self-start"><Trash2 size={13}/></button>
              </div>
            ))}
          </div>
        </div>
      );
      case "principal": {
        const p=cms.principal;
        return(
          <div className="space-y-4 max-w-xl">
            <h3 className="text-white font-bold text-lg">Principal's Message</h3>
            <div className="bg-[#080D18] border border-white/5 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4"><img src={p.photo} className="w-14 h-14 rounded-xl border border-white/10"/><div><div className="text-white font-semibold">{p.name}</div><div className="text-white/40 text-xs">{p.title}</div></div><label className="ml-auto flex items-center gap-1.5 cursor-pointer bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 text-xs px-3 py-1.5 rounded-lg"><Upload size={11}/>Photo<input type="file" accept="image/*" className="hidden" onChange={imgUpload(url=>upd(c=>({...c,principal:{...c.principal,photo:url}})))}/></label></div>
              <div><label className="text-xs text-white/40 uppercase block mb-1.5">Principal's Name</label><input value={p.name} onChange={e=>upd(c=>({...c,principal:{...c.principal,name:e.target.value}}))} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50"/></div>
              <div><label className="text-xs text-white/40 uppercase block mb-1.5">Title</label><input value={p.title} onChange={e=>upd(c=>({...c,principal:{...c.principal,title:e.target.value}}))} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50"/></div>
              <div><label className="text-xs text-white/40 uppercase block mb-1.5">Message (supports HTML tags)</label><RichEditor value={p.text} onChange={v=>upd(c=>({...c,principal:{...c.principal,text:v}}))}/></div>
            </div>
          </div>
        );
      }
      case "vision": {
        const vm=cms.visionMission;
        return(
          <div className="space-y-4 max-w-xl">
            <h3 className="text-white font-bold text-lg">Vision, Mission & About</h3>
            <div className="bg-[#080D18] border border-white/5 rounded-xl p-5 space-y-4">
              {([["Vision","vision"],["Mission","mission"],["School History","history"],["Contact","contact"],["Address","address"],["Google Maps Embed URL","mapEmbed"]] as [string,keyof VisionMission][]).map(([label,key])=>(
                <div key={key}>
                  <label className="text-xs text-white/40 uppercase block mb-1.5">{label}</label>
                  {key==="history"||key==="vision"||key==="mission"
                    ?<RichEditor value={vm[key]} onChange={v=>upd(c=>({...c,visionMission:{...c.visionMission,[key]:v}}))}/>
                    :<input value={vm[key]} onChange={e=>upd(c=>({...c,visionMission:{...c.visionMission,[key]:e.target.value}}))} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50"/>
                  }
                </div>
              ))}
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-amber-400"><MapPin size={12}/>Paste a Google Maps embed URL for the map on the About page</div>
            </div>
            <div><label className="text-xs text-white/40 uppercase block mb-1.5">Quick Stats</label>
              <div className="grid grid-cols-2 gap-3">
                {([["students","Students"],["teachers","Teachers"],["founded","Year Founded"],["achievements","Achievements"]] as [keyof CMS["quickStats"],string][]).map(([k,l])=>(
                  <div key={k}><label className="text-xs text-white/30 block mb-1">{l}</label><input type="number" value={state.cms.quickStats[k]} onChange={e=>upd(c=>({...c,quickStats:{...c.quickStats,[k]:parseInt(e.target.value)||0}}))} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500/50 font-mono"/></div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      case "media": return(
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">Media Library ({cms.media.length} files)</h3>
            <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg cursor-pointer transition-colors"><Upload size={12}/>Upload File<input type="file" accept="image/*,.pdf" className="hidden" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const url=ev.target?.result as string;const type=f.type.includes("pdf")?"pdf":"image";upd(c=>({...c,media:[...c.media,{id:uid(),name:f.name,url,type,size:`${(f.size/1024).toFixed(1)}KB`,uploadedAt:today}]}));};r.readAsDataURL(f);e.target.value="";}}/></label>
          </div>
          {cms.media.length===0?<div className="text-white/20 text-sm text-center py-16 bg-[#080D18] border border-dashed border-white/10 rounded-xl">No files uploaded yet. Upload images and PDFs for use across the website.</div>:(
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {cms.media.map(m=>(
                <div key={m.id} className="bg-[#080D18] border border-white/5 rounded-xl overflow-hidden group hover:border-blue-500/20 transition-colors">
                  {m.type==="image"?<img src={m.url} className="w-full h-20 object-cover"/>:<div className="w-full h-20 flex items-center justify-center bg-amber-500/10"><FileText size={24} className="text-amber-400"/></div>}
                  <div className="p-2"><div className="text-white/60 text-xs truncate">{m.name}</div><div className="flex items-center justify-between mt-1"><span className="text-white/30 text-[10px] font-mono">{m.size}</span><button onClick={()=>upd(c=>({...c,media:c.media.filter(x=>x.id!==m.id)}))} className="opacity-0 group-hover:opacity-100 text-red-400/60 hover:text-red-400 transition-all"><Trash2 size={11}/></button></div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
      default: return null;
    }
  }

  function renderPopup(){
    if(!popup)return null;
    const isEdit=popup.type.startsWith("edit");
    const data=popup.data;

    if(popup.type==="addSlide"||popup.type==="editSlide"){
      let img=data?.imageUrl||"",title=data?.title||"",sub=data?.subtitle||"";
      return(
        <Modal title={isEdit?"Edit Slide":"Add Slide"} onClose={close}>
          <div><label className="text-xs text-white/40 uppercase block mb-1.5">Slide Image</label>
            <div className="relative"><img src={img||"https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=400&q=60"} className="w-full h-28 object-cover rounded-xl mb-2"/><label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl cursor-pointer opacity-0 hover:opacity-100 transition-opacity"><Upload size={20} className="text-white"/><input type="file" accept="image/*" className="hidden" onChange={imgUpload(url=>{img=url;})}/></label></div>
            <input value={img} onChange={e=>{img=e.target.value;}} placeholder="...or paste image URL" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500/50 placeholder-white/20"/>
          </div>
          <Field label="Title" onChange={v=>{title=v;}} type="text"/>
          <Field label="Subtitle" onChange={v=>{sub=v;}} type="text"/>
          <MBtn onClick={()=>{if(isEdit)upd(c=>({...c,slides:c.slides.map(s=>s.id===data.id?{...s,imageUrl:img||s.imageUrl,title:title||s.title,subtitle:sub||s.subtitle}:s)}));else upd(c=>({...c,slides:[...c.slides,{id:uid(),imageUrl:img,title,subtitle:sub}]}));close();}}>Save Slide</MBtn>
        </Modal>
      );
    }
    if(popup.type==="addGallery"){
      let img="",cap="",cat="Sports";
      return(
        <Modal title="Add Gallery Photo" onClose={close}>
          <div><label className="text-xs text-white/40 uppercase block mb-1.5">Photo</label>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
              <Upload size={20} className="text-white/20 group-hover:text-blue-400 mb-1"/><span className="text-xs text-white/30">Click to upload or drag & drop</span>
              <input type="file" accept="image/*" className="hidden" onChange={imgUpload(url=>{img=url;})}/>
            </label>
            <input value={img} onChange={e=>{img=e.target.value;}} placeholder="...or paste URL" className="w-full bg-white/5 border border-white/10 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-blue-500/50 placeholder-white/20 mt-2"/>
          </div>
          <Field label="Caption" onChange={v=>{cap=v;}}/>
          <div><label className="text-xs text-white/40 uppercase block mb-1.5">Category</label><select onChange={e=>{cat=e.target.value;}} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none">{["Sports","Academic","Cultural","Leadership","Arts","Other"].map(c=><option key={c}>{c}</option>)}</select></div>
          <MBtn onClick={()=>{if(img&&cap){upd(c=>({...c,gallery:[...c.gallery,{id:uid(),imageUrl:img,caption:cap,category:cat,date:today}]}));close();}else alert("Image and caption required");}}>Add to Gallery</MBtn>
        </Modal>
      );
    }
    if(popup.type==="addNews"||popup.type==="editNews"){
      let t=data?.title||"",auth=data?.author||"",cat=data?.category||"news",img=data?.imageUrl||"",pin=data?.pinned||false;
      return(
        <Modal title={isEdit?"Edit Post":"New Post"} onClose={close} wide>
          <Field label="Title" onChange={v=>{t=v;}}/>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/40 uppercase block mb-1.5">Category</label><select onChange={e=>{cat=e.target.value as any;}} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none"><option value="news">News</option><option value="blog">Blog</option><option value="circular">Circular</option></select></div>
            <Field label="Author" onChange={v=>{auth=v;}}/>
          </div>
          <div><label className="text-xs text-white/40 uppercase block mb-1.5">Featured Image</label>
            <div className="flex gap-2"><input value={img} onChange={e=>{img=e.target.value;}} placeholder="Image URL or upload" className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500/50 placeholder-white/20"/>
            <label className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs px-3 py-2 rounded-xl cursor-pointer"><Upload size={11}/>Upload<input type="file" accept="image/*" className="hidden" onChange={imgUpload(url=>{img=url;})}/></label></div>
          </div>
          <div><label className="text-xs text-white/40 uppercase block mb-1.5">Content (Rich Text)</label><RichEditor value={richText} onChange={v=>{setRT(v);}}/></div>
          <MBtn onClick={()=>{if(t){const entry={id:data?.id||uid(),title:t,body:richText,imageUrl:img,category:cat as any,date:today,author:auth,pinned:pin};if(isEdit)upd(c=>({...c,news:c.news.map(x=>x.id===data.id?entry:x)}));else upd(c=>({...c,news:[entry,...c.news]}));close();}}}>Save Post</MBtn>
        </Modal>
      );
    }
    if(popup.type==="addAch"){
      let t="",desc="",img="",cat="academic",yr=String(new Date().getFullYear());
      return(
        <Modal title="Add Achievement" onClose={close}>
          <Field label="Title" onChange={v=>{t=v;}}/>
          <Field label="Description" onChange={v=>{desc=v;}}/>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-white/40 uppercase block mb-1.5">Category</label><select onChange={e=>{cat=e.target.value;}} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none"><option value="academic">Academic</option><option value="sports">Sports</option><option value="aesthetic">Aesthetic</option></select></div>
            <Field label="Year" onChange={v=>{yr=v;}}/>
          </div>
          <div><label className="text-xs text-white/40 uppercase block mb-1.5">Image</label>
            <div className="flex gap-2"><input value={img} onChange={e=>{img=e.target.value;}} placeholder="Image URL" className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500/50 placeholder-white/20"/><label className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs px-3 py-2 rounded-xl cursor-pointer"><Upload size={11}/>Upload<input type="file" accept="image/*" className="hidden" onChange={imgUpload(url=>{img=url;})}/></label></div>
          </div>
          <MBtn onClick={()=>{if(t&&desc){upd(c=>({...c,achievements:[...c.achievements,{id:uid(),title:t,description:desc,imageUrl:img,category:cat as any,year:yr}]}));close();}else alert("Title and description required");}}>Add Achievement</MBtn>
        </Modal>
      );
    }
    if(popup.type==="addClub"){
      let n="",desc="",img="",teacher="",badge="🎯";let members=0;
      return(
        <Modal title="Add Club" onClose={close}>
          <div className="grid grid-cols-4 gap-3"><div className="col-span-3"><Field label="Club Name" onChange={v=>{n=v;}}/></div><div><label className="text-xs text-white/40 uppercase block mb-1.5">Badge</label><input defaultValue="🎯" onChange={e=>{badge=e.target.value;}} className="w-full bg-white/5 border border-white/10 text-white text-2xl text-center rounded-xl px-2 py-1.5 outline-none focus:border-blue-500/50"/></div></div>
          <Field label="Description" onChange={v=>{desc=v;}}/>
          <div className="grid grid-cols-2 gap-3"><Field label="Teacher-in-Charge" onChange={v=>{teacher=v;}}/><div><label className="text-xs text-white/40 uppercase block mb-1.5">Members</label><input type="number" defaultValue={0} onChange={e=>{members=parseInt(e.target.value)||0;}} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500/50"/></div></div>
          <div><label className="text-xs text-white/40 uppercase block mb-1.5">Club Image</label><div className="flex gap-2"><input value={img} onChange={e=>{img=e.target.value;}} placeholder="Image URL" className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none focus:border-blue-500/50 placeholder-white/20"/><label className="flex items-center gap-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs px-3 py-2 rounded-xl cursor-pointer"><Upload size={11}/>Upload<input type="file" accept="image/*" className="hidden" onChange={imgUpload(url=>{img=url;})}/></label></div></div>
          <MBtn onClick={()=>{if(n&&desc){upd(c=>({...c,clubs:[...c.clubs,{id:uid(),name:n,description:desc,imageUrl:img,teacher,members,badge}]}));close();}else alert("Name and description required");}}>Create Club</MBtn>
        </Modal>
      );
    }
    return null;
  }

  return(
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold text-white">Website CMS</h2><p className="text-white/30 text-xs mt-0.5">Manage all public website content without writing code</p></div><div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full"><Globe size={11}/>Public Site Live</div></div>
      <div className="flex gap-2 flex-wrap bg-[#080D18] border border-white/5 rounded-xl p-1.5">
        {SECTIONS.map(s=>(
          <button key={s.id} onClick={()=>setSection(s.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${section===s.id?"bg-blue-600 text-white":"text-white/40 hover:text-white/70 hover:bg-white/5"}`}><s.icon size={12}/>{s.label}</button>
        ))}
      </div>
      <div>{renderSection()}</div>
      {popup&&<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={e=>e.target===e.currentTarget&&close()}>{renderPopup()}</div>}
    </div>
  );
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────
function RichEditor({value,onChange}:{value:string;onChange:(v:string)=>void}){
  const [mode,setMode]=useState<"visual"|"html">("visual");
  const tools=[
    {label:"B",cmd:"bold",title:"Bold"},
    {label:"I",cmd:"italic",title:"Italic"},
    {label:"U",cmd:"underline",title:"Underline"},
    {label:"H2",cmd:"formatBlock",arg:"H2",title:"Heading"},
    {label:"¶",cmd:"formatBlock",arg:"P",title:"Paragraph"},
    {label:"•",cmd:"insertUnorderedList",title:"Bullet List"},
    {label:"🔗",cmd:"createLink",title:"Insert Link"},
  ];
  const ref=React.useRef<HTMLDivElement>(null);
  function exec(cmd:string,arg?:string){
    if(cmd==="createLink"){const url=prompt("Enter URL:");if(url)document.execCommand(cmd,false,url);}
    else document.execCommand(cmd,false,arg);
    if(ref.current)onChange(ref.current.innerHTML);
  }
  return(
    <div className="border border-white/10 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between bg-white/3 border-b border-white/10 px-3 py-2">
        <div className="flex gap-1">
          {tools.map(t=><button key={t.cmd+t.arg} type="button" title={t.title} onClick={()=>exec(t.cmd,t.arg)} className="w-7 h-7 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold flex items-center justify-center">{t.label}</button>)}
        </div>
        <button type="button" onClick={()=>setMode(m=>m==="visual"?"html":"visual")} className="text-[10px] text-white/30 hover:text-white/60 border border-white/10 px-2 py-1 rounded-lg transition-colors">{mode==="visual"?"HTML":"Visual"}</button>
      </div>
      {mode==="visual"
        ?<div ref={ref} contentEditable suppressContentEditableWarning onInput={e=>onChange((e.target as HTMLDivElement).innerHTML)} dangerouslySetInnerHTML={{__html:value}} className="min-h-[120px] p-4 text-white text-sm outline-none bg-white/3 [&>*]:mb-2 [&>b]:font-bold [&>i]:italic [&>ul]:list-disc [&>ul]:pl-4"/>
        :<textarea value={value} onChange={e=>onChange(e.target.value)} className="w-full min-h-[120px] p-4 text-white text-xs font-mono outline-none bg-white/3 resize-y"/>
      }
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC WEBSITE
// ═══════════════════════════════════════════════════════════════════════════════
function PublicWebsite({state,route,setRoute,onEnterDash}:{state:AppState;route:string;setRoute:(r:string)=>void;onEnterDash:()=>void}){
  const [mobileOpen,setMO]=useState(false);
  const cms=state.cms;
  const PAGES=[
    {id:"home",label:"Home"},
    {id:"gallery",label:"Gallery"},
    {id:"news",label:"News"},
    {id:"about",label:"About"},
    {id:"achievements",label:"Achievements"},
    {id:"clubs",label:"Clubs"},
    {id:"staff",label:"Our Staff"},
    {id:"downloads",label:"Downloads"},
  ];

  function nav(r:string){setRoute(r);setMO(false);window.scrollTo({top:0,behavior:"smooth"});}

  return(
    <div className="min-h-screen bg-[#F8F6F1] font-sans" style={{fontFamily:"'Inter',sans-serif"}}>
      {/* Global web styles */}
      <style>{`
        .pub-gradient{background:linear-gradient(135deg,#0f1729 0%,#1a2744 100%)}
        .pub-accent{color:#C9A84C}
        .pub-btn{background:#C9A84C;color:#0f1729;font-weight:700}
        .pub-btn:hover{background:#b8963f}
        .pub-card{background:#fff;border:1px solid #E8E2D9;border-radius:16px}
        .pub-section{padding:80px 0}
        @keyframes slideSlider{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}
        .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        .line-clamp-3{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
        .prose b{font-weight:700} .prose i{font-style:italic} .prose ul{list-style:disc;padding-left:1.25rem;margin:0.5rem 0} .prose h2{font-size:1.25rem;font-weight:700;margin:0.75rem 0 0.25rem}
      `}</style>

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-[#0f1729]/95 backdrop-blur-md border-b border-white/10 shadow-xl shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button onClick={()=>nav("home")} className="flex items-center gap-3">
            {state.settings.logoUrl
              ?<img src={state.settings.logoUrl} className="w-9 h-9 rounded-lg object-cover"/>
              :<div className="w-9 h-9 rounded-lg bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center"><School size={17} className="text-[#C9A84C]"/></div>}
            <div className="hidden sm:block"><div className="text-white font-bold text-sm leading-tight" style={{fontFamily:"'Playfair Display',serif"}}>{state.settings.name}</div><div className="text-white/40 text-[10px]">{state.settings.tagline}</div></div>
          </button>
          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {PAGES.map(p=>(
              <button key={p.id} onClick={()=>nav(p.id)} className={`px-4 py-2 rounded-lg text-sm transition-all font-medium ${route===p.id?"text-[#C9A84C] bg-[#C9A84C]/10":"text-white/60 hover:text-white hover:bg-white/5"}`}>{p.label}</button>
            ))}
            <button onClick={onEnterDash} className="ml-3 pub-btn px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"><Lock size={12}/>Staff Login</button>
          </nav>
          <button className="md:hidden text-white/60 hover:text-white" onClick={()=>setMO(o=>!o)}><ChevronDown size={20} className={`transition-transform ${mobileOpen?"rotate-180":""}`}/></button>
        </div>
        {/* Mobile menu */}
        {mobileOpen&&(
          <div className="md:hidden border-t border-white/10 bg-[#0f1729] px-4 py-3 space-y-1">
            {PAGES.map(p=><button key={p.id} onClick={()=>nav(p.id)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm ${route===p.id?"text-[#C9A84C] bg-[#C9A84C]/10":"text-white/60"}`}>{p.label}</button>)}
            <button onClick={()=>{onEnterDash();setMO(false);}} className="w-full text-center pub-btn px-4 py-2.5 rounded-lg text-sm mt-2">Staff Login</button>
          </div>
        )}
      </header>

      {/* Page content */}
      <div className="anim-fade">
        {route==="home"       &&<PageHome     cms={cms} onNav={nav} settings={state.settings}/>}
        {route==="gallery"    &&<PageGallery  cms={cms}/>}
        {route==="news"       &&<PageNews     cms={cms}/>}
        {route==="about"      &&<PageAbout    cms={cms} settings={state.settings}/>}
        {route==="achievements"&&<PageAchievements cms={cms}/>}
        {route==="clubs"      &&<PageClubs    cms={cms}/>}
        {route==="staff"      &&<PageStaff    cms={cms}/>}
        {route==="downloads"  &&<PageDownloads cms={cms}/>}
      </div>

      {/* Footer */}
      <footer className="bg-[#0f1729] text-white/50 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div><div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center"><School size={15} className="text-[#C9A84C]"/></div><span className="text-white font-bold" style={{fontFamily:"'Playfair Display',serif"}}>{state.settings.name}</span></div><p className="text-sm">{state.settings.tagline}</p></div>
          <div><h4 className="text-white font-semibold mb-3 text-sm">Quick Links</h4><div className="space-y-1.5">{PAGES.map(p=><button key={p.id} onClick={()=>nav(p.id)} className="block text-sm hover:text-[#C9A84C] transition-colors text-left">{p.label}</button>)}</div></div>
          <div><h4 className="text-white font-semibold mb-3 text-sm">Contact</h4><p className="text-sm">{cms.visionMission.contact}</p><p className="text-sm mt-1">{cms.visionMission.address}</p><button onClick={onEnterDash} className="mt-3 pub-btn text-xs px-3 py-2 rounded-lg inline-flex items-center gap-1.5"><Lock size={11}/>Staff Portal</button></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-white/5 text-center text-xs text-white/20">© {new Date().getFullYear()} {state.settings.name}. All rights reserved.</div>
      </footer>
    </div>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────
function PageHome({cms,onNav,settings}:{cms:CMS;onNav:(r:string)=>void;settings:AppState["settings"]}){
  const [slide,setSlide]=useState(0);
  React.useEffect(()=>{const t=setInterval(()=>setSlide(s=>(s+1)%Math.max(1,cms.slides.length)),5000);return()=>clearInterval(t);},[cms.slides.length]);
  const cur=cms.slides[slide];
  return(
    <div>
      {/* Hero Slider */}
      <div className="relative h-[540px] overflow-hidden">
        {cms.slides.map((sl,i)=>(
          <div key={sl.id} className="absolute inset-0 transition-opacity duration-1000" style={{opacity:i===slide?1:0}}>
            <img src={sl.imageUrl} className="w-full h-full object-cover"/>
            <div className="absolute inset-0" style={{background:"linear-gradient(to right, rgba(15,23,41,0.85) 0%, rgba(15,23,41,0.4) 60%, transparent 100%)"}}/>
          </div>
        ))}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-xl" style={{animation:"fadeUp 0.6s ease forwards"}}>
              <div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-4">{settings.tagline}</div>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4" style={{fontFamily:"'Playfair Display',serif"}}>{cur?.title||"Welcome"}</h1>
              <p className="text-white/70 text-lg mb-8">{cur?.subtitle||""}</p>
              <div className="flex gap-3">
                <button onClick={()=>onNav("about")} className="pub-btn px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105">Explore Our School</button>
                <button onClick={()=>onNav("news")} className="px-6 py-3 rounded-xl text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all">Latest News</button>
              </div>
            </div>
          </div>
        </div>
        {/* Slider dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {cms.slides.map((_,i)=><button key={i} onClick={()=>setSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i===slide?"bg-[#C9A84C] w-6":"bg-white/30"}`}/>)}
        </div>
        {/* Arrows */}
        <button onClick={()=>setSlide(s=>(s-1+cms.slides.length)%cms.slides.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all"><ChevronLeft size={18} className="text-white"/></button>
        <button onClick={()=>setSlide(s=>(s+1)%cms.slides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-all"><ChevronRight size={18} className="text-white"/></button>
      </div>

      {/* Quick Stats */}
      <div className="bg-[#0f1729]">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[{v:cms.quickStats.students,l:"Students",suf:"+"},{v:cms.quickStats.teachers,l:"Teachers",suf:"+"},{v:cms.quickStats.founded,l:"Est.",suf:""},{v:cms.quickStats.achievements,l:"Awards",suf:"+"}].map((s,i)=>(
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-[#C9A84C]" style={{fontFamily:"'Playfair Display',serif"}}>{s.v}{s.suf}</div>
                <div className="text-white/50 text-sm mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Principal's Message */}
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Message from the</div>
              <h2 className="text-3xl font-bold text-[#0f1729] mb-6 leading-tight" style={{fontFamily:"'Playfair Display',serif"}}>Our Principal's Vision</h2>
              <div className="relative">
                <div className="text-6xl text-[#C9A84C]/20 font-serif absolute -top-4 -left-2">"</div>
                <div className="prose text-gray-600 leading-relaxed pl-4" dangerouslySetInnerHTML={{__html:cms.principal.text}}/>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <img src={cms.principal.photo} className="w-14 h-14 rounded-full border-2 border-[#C9A84C]/30 bg-gray-100"/>
                <div><div className="font-bold text-[#0f1729]" style={{fontFamily:"'Playfair Display',serif"}}>{cms.principal.name}</div><div className="text-gray-500 text-sm">{cms.principal.title}</div></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {cms.gallery.slice(0,4).map(g=>(
                <div key={g.id} className="rounded-2xl overflow-hidden shadow-lg"><img src={g.imageUrl} className="w-full h-36 object-cover hover:scale-105 transition-transform duration-500"/></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="bg-[#0f1729] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-2">Our Purpose</div><h2 className="text-3xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>Vision & Mission</h2></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[3px] mb-3">Vision</div><p className="text-white/80 leading-relaxed text-lg italic" style={{fontFamily:"'Playfair Display',serif"}}>"{cms.visionMission.vision}"</p></div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[3px] mb-3">Mission</div><p className="text-white/80 leading-relaxed text-lg italic" style={{fontFamily:"'Playfair Display',serif"}}>"{cms.visionMission.mission}"</p></div>
          </div>
        </div>
      </section>

      {/* Latest News preview */}
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10"><div><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-2">Stay Updated</div><h2 className="text-3xl font-bold text-[#0f1729]" style={{fontFamily:"'Playfair Display',serif"}}>Latest News</h2></div><button onClick={()=>onNav("news")} className="pub-btn px-5 py-2.5 rounded-xl text-sm flex items-center gap-2">All News<ChevronRight size={14}/></button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cms.news.slice(0,3).map(n=>(
              <article key={n.id} className="pub-card overflow-hidden hover:shadow-xl transition-shadow group">
                <img src={n.imageUrl} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="p-5"><div className="flex items-center gap-2 mb-3"><span className={`text-[10px] px-2 py-1 rounded-full font-mono ${n.category==="news"?"bg-blue-100 text-blue-700":n.category==="blog"?"bg-purple-100 text-purple-700":"bg-amber-100 text-amber-700"}`}>{n.category}</span><span className="text-gray-400 text-xs">{n.date}</span></div><h3 className="font-bold text-[#0f1729] mb-2 line-clamp-2">{n.title}</h3><p className="text-gray-500 text-sm line-clamp-2">{n.body.replace(/<[^>]+>/g,"")}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements preview */}
      <section className="bg-[#F0EBE1] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10"><div><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-2">Our Pride</div><h2 className="text-3xl font-bold text-[#0f1729]" style={{fontFamily:"'Playfair Display',serif"}}>Recent Achievements</h2></div><button onClick={()=>onNav("achievements")} className="pub-btn px-5 py-2.5 rounded-xl text-sm">View All</button></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cms.achievements.slice(0,3).map(a=>(
              <div key={a.id} className="pub-card overflow-hidden hover:shadow-lg transition-shadow"><img src={a.imageUrl} className="w-full h-36 object-cover"/><div className="p-4"><span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${a.category==="academic"?"bg-blue-100 text-blue-700":a.category==="sports"?"bg-emerald-100 text-emerald-700":"bg-purple-100 text-purple-700"}`}>{a.category} · {a.year}</span><h3 className="font-bold text-[#0f1729] mt-2 text-sm">{a.title}</h3></div></div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Gallery Page ──────────────────────────────────────────────────────────────
function PageGallery({cms}:{cms:CMS}){
  const [filter,setFilter]=useState("All");
  const [lightbox,setLB]=useState<GalleryItem|null>(null);
  const cats=["All",...Array.from(new Set(cms.gallery.map(g=>g.category)))];
  const shown=filter==="All"?cms.gallery:cms.gallery.filter(g=>g.category===filter);
  return(
    <div>
      <div className="pub-gradient py-20 text-center"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Our Memories</div><h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>Photo Gallery</h1></div>
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {cats.map(c=><button key={c} onClick={()=>setFilter(c)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter===c?"pub-btn":"border border-gray-200 text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C]"}`}>{c}</button>)}
          </div>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
            {shown.map(g=>(
              <div key={g.id} className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all" onClick={()=>setLB(g)}>
                <img src={g.imageUrl} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3"><p className="text-white text-xs font-semibold">{g.caption}</p><p className="text-white/60 text-[10px]">{g.category}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Lightbox */}
      {lightbox&&(
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setLB(null)}>
          <div className="max-w-4xl w-full" onClick={e=>e.stopPropagation()}>
            <img src={lightbox.imageUrl} className="w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"/>
            <div className="flex items-center justify-between mt-4"><div><p className="text-white font-semibold">{lightbox.caption}</p><p className="text-white/50 text-sm flex items-center gap-2"><Tag size={12}/>{lightbox.category}<Calendar size={12} className="ml-2"/>{lightbox.date}</p></div><button onClick={()=>setLB(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><X size={18}/></button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── News Page ─────────────────────────────────────────────────────────────────
function PageNews({cms}:{cms:CMS}){
  const [filter,setFilter]=useState("all");
  const [selected,setSelected]=useState<NewsPost|null>(null);
  const pinned=cms.news.filter(n=>n.pinned);
  const shown=filter==="all"?cms.news:cms.news.filter(n=>n.category===filter);
  return(
    <div>
      <div className="pub-gradient py-20 text-center"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Keep Up</div><h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>News & Announcements</h1></div>
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6">
          {pinned.length>0&&(
            <div className="mb-10 bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="text-xs font-mono text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Star size={11}/>Pinned Announcements</div>
              <div className="space-y-2">
                {pinned.map(n=><div key={n.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-amber-100 cursor-pointer hover:border-amber-300 transition-colors" onClick={()=>setSelected(n)}><div className="flex items-center gap-3"><img src={n.imageUrl} className="w-10 h-10 rounded-lg object-cover"/><div><div className="font-semibold text-[#0f1729] text-sm">{n.title}</div><div className="text-gray-400 text-xs">{n.date}</div></div></div><ChevronRight size={14} className="text-gray-400"/></div>)}
              </div>
            </div>
          )}
          <div className="flex gap-2 mb-8">
            {[["all","All"],["news","News"],["blog","Blog"],["circular","Circulars"]].map(([v,l])=><button key={v} onClick={()=>setFilter(v)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter===v?"pub-btn":"border border-gray-200 text-gray-600 hover:border-[#C9A84C]"}`}>{l}</button>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map(n=>(
              <article key={n.id} className="pub-card overflow-hidden hover:shadow-xl transition-all cursor-pointer group" onClick={()=>setSelected(n)}>
                <div className="relative overflow-hidden"><img src={n.imageUrl} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"/>{n.pinned&&<div className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">📌 Pinned</div>}</div>
                <div className="p-5"><div className="flex items-center gap-2 mb-3"><span className={`text-[10px] px-2.5 py-1 rounded-full font-mono ${n.category==="news"?"bg-blue-100 text-blue-700":n.category==="blog"?"bg-purple-100 text-purple-700":"bg-amber-100 text-amber-700"}`}>{n.category}</span><span className="text-gray-400 text-xs">{n.date}</span></div><h3 className="font-bold text-[#0f1729] mb-2 line-clamp-2 group-hover:text-[#C9A84C] transition-colors">{n.title}</h3><p className="text-gray-500 text-sm line-clamp-3">{n.body.replace(/<[^>]+>/g,"")}</p><div className="mt-3 text-[#C9A84C] text-xs font-semibold flex items-center gap-1">By {n.author}<ChevronRight size={12}/></div></div>
              </article>
            ))}
          </div>
        </div>
      </section>
      {/* Article Modal */}
      {selected&&(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 pt-16 overflow-y-auto" onClick={()=>setSelected(null)}>
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
            <img src={selected.imageUrl} className="w-full h-60 object-cover"/>
            <div className="p-6"><div className="flex items-center gap-2 mb-4"><span className={`text-xs px-3 py-1 rounded-full font-mono ${selected.category==="news"?"bg-blue-100 text-blue-700":selected.category==="blog"?"bg-purple-100 text-purple-700":"bg-amber-100 text-amber-700"}`}>{selected.category}</span><span className="text-gray-400 text-sm">{selected.date}</span><span className="text-gray-400 text-sm ml-auto">By {selected.author}</span></div><h2 className="text-2xl font-bold text-[#0f1729] mb-4" style={{fontFamily:"'Playfair Display',serif"}}>{selected.title}</h2><div className="prose text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{__html:selected.body}}/><button onClick={()=>setSelected(null)} className="mt-6 pub-btn px-5 py-2.5 rounded-xl text-sm">Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── About Page ────────────────────────────────────────────────────────────────
function PageAbout({cms,settings}:{cms:CMS;settings:AppState["settings"]}){
  const vm=cms.visionMission;
  return(
    <div>
      <div className="pub-gradient py-20 text-center"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Who We Are</div><h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>About {settings.name}</h1></div>
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Our History</div><h2 className="text-3xl font-bold text-[#0f1729] mb-5" style={{fontFamily:"'Playfair Display',serif"}}>A Legacy of Excellence</h2><div className="prose text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{__html:vm.history}}/></div>
          <div className="space-y-4">
            <div className="bg-[#0f1729] rounded-2xl p-6"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[3px] mb-3">Vision</div><p className="text-white/80 italic">{vm.vision}</p></div>
            <div className="bg-[#F0EBE1] rounded-2xl p-6"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[3px] mb-3">Mission</div><p className="text-gray-700">{vm.mission}</p></div>
          </div>
        </div>
      </section>
      <section className="bg-[#F0EBE1] pub-section">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Find Us</div><h2 className="text-2xl font-bold text-[#0f1729] mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Location & Contact</h2><div className="space-y-3"><div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100"><MapPin size={16} className="text-[#C9A84C] mt-0.5 flex-shrink-0"/><div><div className="font-semibold text-[#0f1729] text-sm">Address</div><div className="text-gray-500 text-sm">{vm.address}</div></div></div><div className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100"><Phone size={16} className="text-[#C9A84C] mt-0.5 flex-shrink-0"/><div><div className="font-semibold text-[#0f1729] text-sm">Contact</div><div className="text-gray-500 text-sm">{vm.contact}</div></div></div></div></div>
          <div className="rounded-2xl overflow-hidden shadow-lg h-64 bg-gray-200">{vm.mapEmbed?<iframe src={vm.mapEmbed} width="100%" height="100%" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"/>:<div className="w-full h-full flex items-center justify-center text-gray-400"><MapPin size={40}/></div>}</div>
        </div>
      </section>
    </div>
  );
}

// ─── Achievements Page ─────────────────────────────────────────────────────────
function PageAchievements({cms}:{cms:CMS}){
  const [filter,setFilter]=useState("all");
  const cats=["all","academic","sports","aesthetic"];
  const shown=filter==="all"?cms.achievements:cms.achievements.filter(a=>a.category===filter);
  return(
    <div>
      <div className="pub-gradient py-20 text-center"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Our Pride</div><h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>Achievements</h1></div>
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 mb-8 justify-center">
            {cats.map(c=><button key={c} onClick={()=>setFilter(c)} className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all ${filter===c?"pub-btn":"border border-gray-200 text-gray-600 hover:border-[#C9A84C]"}`}>{c==="all"?"All Categories":c}</button>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map(a=>(
              <div key={a.id} className="pub-card overflow-hidden hover:shadow-xl transition-all group">
                <div className="relative overflow-hidden"><img src={a.imageUrl} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"/>
                <div className="absolute top-3 left-3"><span className={`text-xs px-3 py-1 rounded-full font-bold ${a.category==="academic"?"bg-blue-500 text-white":a.category==="sports"?"bg-emerald-500 text-white":"bg-purple-500 text-white"}`}>{a.category}</span></div>
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-mono">{a.year}</div></div>
                <div className="p-5"><h3 className="font-bold text-[#0f1729] mb-2">{a.title}</h3><p className="text-gray-500 text-sm">{a.description}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Clubs Page ────────────────────────────────────────────────────────────────
function PageClubs({cms}:{cms:CMS}){
  return(
    <div>
      <div className="pub-gradient py-20 text-center"><div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Get Involved</div><h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>Clubs & Societies</h1><p className="text-white/60 mt-3 max-w-lg mx-auto">Discover your passion. Join a club and build skills, friendships, and memories that last a lifetime.</p></div>
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {cms.clubs.map(cl=>(
            <div key={cl.id} className="pub-card overflow-hidden hover:shadow-xl transition-all group flex">
              <div className="relative w-40 flex-shrink-0 overflow-hidden"><img src={cl.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/><div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"/></div>
              <div className="p-5 flex-1">
                <div className="text-3xl mb-2">{cl.badge}</div>
                <h3 className="font-bold text-[#0f1729] text-base mb-1" style={{fontFamily:"'Playfair Display',serif"}}>{cl.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{cl.description}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><User size={11}/>{cl.teacher}</span>
                  <span className="flex items-center gap-1"><Users2 size={11}/>{cl.members} members</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Staff Directory Page ─────────────────────────────────────────────────────
function PageStaff({cms}:{cms:CMS}){
  // Ordered hierarchy tiers
  const TIERS: {role:StaffRole; label:string; subtitle:string; accent:string; bg:string; border:string; cols:string}[] = [
    {role:"principal",          label:"Principal",                   subtitle:"Chief Executive of the School",           accent:"text-[#C9A84C]",   bg:"bg-[#C9A84C]/10",   border:"border-[#C9A84C]/30",  cols:"grid-cols-1 max-w-sm mx-auto"},
    {role:"deputy_principal",   label:"Deputy Principal",            subtitle:"Second-in-Command",                       accent:"text-slate-700",   bg:"bg-slate-100",       border:"border-slate-200",      cols:"grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"},
    {role:"assistant_principal",label:"Assistant Principals",        subtitle:"Academic & Welfare Leadership",           accent:"text-indigo-700",  bg:"bg-indigo-50",       border:"border-indigo-100",     cols:"grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto"},
    {role:"sectional_head",     label:"Sectional Heads",             subtitle:"Departmental Academic Leaders",           accent:"text-emerald-700", bg:"bg-emerald-50",      border:"border-emerald-100",    cols:"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"},
    {role:"teacher",            label:"Class & Subject Teachers",    subtitle:"The Heart of Our Teaching Community",     accent:"text-blue-700",    bg:"bg-blue-50",         border:"border-blue-100",       cols:"grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"},
  ];

  return(
    <div>
      {/* Hero */}
      <div className="pub-gradient py-20 text-center">
        <div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Meet the Team</div>
        <h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>Our Staff</h1>
        <p className="text-white/60 mt-3 max-w-xl mx-auto text-sm">Dedicated educators and administrators committed to nurturing every student's potential.</p>
      </div>

      {/* Tier sections */}
      <section className="pub-section">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
          {TIERS.map(tier=>{
            const members=cms.staff.filter(s=>s.role===tier.role);
            if(members.length===0) return null;
            const isTop=tier.role==="principal"||tier.role==="deputy_principal"||tier.role==="assistant_principal";
            return(
              <div key={tier.role}>
                {/* Tier heading */}
                <div className="text-center mb-10">
                  <div className={`inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[3px] px-4 py-2 rounded-full ${tier.bg} ${tier.border} border mb-3`}>
                    <span className={tier.accent}>{tier.label}</span>
                  </div>
                  <p className="text-gray-400 text-sm">{tier.subtitle}</p>
                  {/* Decorative line */}
                  <div className="flex items-center gap-4 mt-5 max-w-xs mx-auto">
                    <div className="flex-1 h-px bg-gray-200"/>
                    <div className={`w-2 h-2 rounded-full ${tier.bg} border ${tier.border}`}/>
                    <div className="flex-1 h-px bg-gray-200"/>
                  </div>
                </div>

                {/* Member cards */}
                <div className={`grid gap-5 ${tier.cols}`}>
                  {members.map(member=>(
                    <div key={member.id}
                      className={`pub-card p-6 text-center hover:shadow-xl transition-all group ${isTop?"py-8":""}`}>
                      {/* Photo */}
                      <div className="relative mx-auto mb-4" style={{width: isTop?96:72, height: isTop?96:72}}>
                        <div className={`w-full h-full rounded-full border-4 ${tier.border} overflow-hidden bg-gray-100 shadow-lg`}>
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                        {/* Role dot indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm ${tier.bg} flex items-center justify-center`}>
                          <div className={`w-2 h-2 rounded-full ${tier.accent.replace("text-","bg-")}`}/>
                        </div>
                      </div>

                      {/* Name */}
                      <h3 className={`font-bold text-[#0f1729] mb-1 ${isTop?"text-lg":"text-sm"}`}
                        style={isTop?{fontFamily:"'Playfair Display',serif"}:{}}>
                        {member.name}
                      </h3>

                      {/* Designation badge */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${tier.bg} ${tier.border} border`}>
                        <span className={tier.accent}>{member.designation}</span>
                      </div>

                      {/* Department tag */}
                      {member.department&&(
                        <div className="mt-2">
                          <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">{member.department}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hierarchy connector — arrow pointing down to next tier */}
                {tier.role!=="teacher"&&(
                  <div className="flex justify-center mt-10">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-px h-6 bg-gray-200"/>
                      <ChevronDown size={16} className="text-gray-300"/>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ─── Downloads Page ────────────────────────────────────────────────────────────
function PageDownloads({cms}:{cms:CMS}){
  const [filter,setFilter]=useState<"all"|"image"|"pdf">("all");
  const shown=filter==="all"?cms.media:cms.media.filter(m=>m.type===filter);
  return(
    <div>
      <div className="pub-gradient py-20 text-center">
        <div className="text-[#C9A84C] text-xs font-mono uppercase tracking-[4px] mb-3">Resources</div>
        <h1 className="text-4xl font-bold text-white" style={{fontFamily:"'Playfair Display',serif"}}>Downloads</h1>
        <p className="text-white/60 mt-3 max-w-lg mx-auto">Access school circulars, past papers, and media resources shared by the administration.</p>
      </div>
      <section className="pub-section">
        <div className="max-w-5xl mx-auto px-6">
          {cms.media.length===0?(
            <div className="text-center py-24 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-30"/>
              <p className="text-lg font-medium">No files available yet.</p>
              <p className="text-sm mt-1">Check back soon — the school admin will upload resources here.</p>
            </div>
          ):(
            <>
              <div className="flex gap-2 mb-8">
                {([["all","All Files"],["pdf","PDFs"],["image","Images"]] as const).map(([v,l])=>(
                  <button key={v} onClick={()=>setFilter(v)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter===v?"pub-btn":"border border-gray-200 text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C]"}`}>{l}</button>
                ))}
                <span className="ml-auto text-sm text-gray-400 self-center">{shown.length} file{shown.length!==1?"s":""}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {shown.map(m=>(
                  <a key={m.id} href={m.url} download={m.name} target="_blank" rel="noopener noreferrer"
                    className="pub-card p-4 flex gap-4 items-start hover:shadow-lg hover:border-[#C9A84C]/40 transition-all group cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${m.type==="pdf"?"bg-red-50 border border-red-100":"bg-blue-50 border border-blue-100"}`}>
                      {m.type==="pdf"
                        ?<FileText size={22} className="text-red-500"/>
                        :<Image size={22} className="text-blue-500"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[#0f1729] text-sm truncate group-hover:text-[#C9A84C] transition-colors">{m.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${m.type==="pdf"?"bg-red-100 text-red-700":"bg-blue-100 text-blue-700"}`}>{m.type.toUpperCase()}</span>
                        <span className="text-gray-400 text-xs font-mono">{m.size}</span>
                      </div>
                      <div className="text-gray-400 text-xs mt-1 flex items-center gap-1"><Calendar size={10}/>{m.uploadedAt}</div>
                    </div>
                    <Download size={14} className="text-gray-300 group-hover:text-[#C9A84C] transition-colors flex-shrink-0 mt-1"/>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

function RegistrationScreen({state,setState,onBack}:{state:AppState;setState:(fn:(s:AppState)=>AppState)=>void;onBack:()=>void}){
  const [step,setStep]=useState<"choose"|"form"|"done">("choose");
  const [role,setRole]=useState<"student"|"teacher">("student");
  const [form,setForm]=useState({name:"",email:"",rollNo:"",password:"",confirm:"",classId:state.classes[0]?.id||""});
  const [error,setError]=useState("");
  const set=(k:keyof typeof form)=>(v:string)=>setForm(f=>({...f,[k]:v}));

  async function submit(){
    if(!form.name||!form.password){setError("Name and password are required.");return;}
    if(form.password!==form.confirm){setError("Passwords do not match.");return;}
    if(role==="student"&&!form.rollNo){setError("Roll number is required.");return;}
    if(role==="teacher"&&!form.email){setError("Email is required.");return;}
    if(role==="teacher"&&state.teachers.find(t=>t.email===form.email)){setError("Email already registered.");return;}
    if(role==="student"&&state.students.find(s=>s.rollNo===form.rollNo)){setError("Roll number already registered.");return;}
    const newId = uid();
    if(role==="teacher"){
      const t:Teacher={id:newId,name:form.name,email:form.email,subjectIds:[],classIds:[],password:form.password,status:"pending"};
      setState(s=>({...s,teachers:[...s.teachers,t]}));
      if(sb.isConfigured()){
        await sb.insert("teachers",{id:newId,name:form.name,email:form.email,password:form.password,subject_ids:[],class_ids:[],status:"pending"});
      }
    } else {
      const photo=`https://api.dicebear.com/7.x/avataaars/svg?seed=${form.name}`;
      const st:Student={id:newId,name:form.name,rollNo:form.rollNo,classId:form.classId,photo,marks:{},password:form.password,status:"pending"};
      setState(s=>({...s,students:[...s.students,st]}));
      if(sb.isConfigured()){
        await sb.insert("students",{id:newId,name:form.name,roll_no:form.rollNo,class_id:form.classId,photo,marks:{},password:form.password,status:"pending"});
      }
    }
    setStep("done");
  }

  if(step==="done") return(
    <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-sm text-center" style={{animation:"fadeUp 0.4s ease forwards"}}>
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5"><Clock size={28} className="text-amber-400"/></div>
        <h2 className="text-xl font-bold text-white mb-2">Registration Submitted!</h2>
        <p className="text-white/40 text-sm mb-1">{form.name} has been registered as a <span className="text-white/70">{role}</span>.</p>
        {role==="student"&&<p className="text-white/30 text-xs mb-2">Roll No: <span className="font-mono text-blue-400">{form.rollNo}</span></p>}
        {role==="teacher"&&<p className="text-white/30 text-xs mb-2">Email: <span className="font-mono text-blue-400">{form.email}</span></p>}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-left mb-6">
          <Shield size={14} className="text-amber-400 flex-shrink-0"/>
          <span className="text-xs text-amber-400">Your account is <strong>pending approval</strong>. An administrator must approve your account before you can log in.</span>
        </div>
        <button onClick={onBack} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-3 rounded-xl transition-colors">Back to Login</button>
      </div>
    </div>
  );

  if(step==="choose") return(
    <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-sm" style={{animation:"fadeUp 0.4s ease forwards"}}>
        <div className="text-center mb-8"><div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4"><UserPlus size={24} className="text-blue-400"/></div><h2 className="text-xl font-bold text-white">Register</h2><p className="text-white/30 text-sm mt-1">Choose your role to get started</p></div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {([["student","Student","Roll-based login"],["teacher","Teacher","Email-based login"]] as const).map(([r,label,sub])=>(
            <button key={r} onClick={()=>{setRole(r);setStep("form");}} className="bg-[#080D18] border border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5 rounded-2xl p-5 text-left transition-all group">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${r==="student"?"bg-emerald-500/10 border-emerald-500/20":"bg-purple-500/10 border-purple-500/20"} border`}>{r==="student"?<Users size={18} className="text-emerald-400"/>:<GraduationCap size={18} className="text-purple-400"/>}</div>
              <div className="text-white font-semibold text-sm">{label}</div><div className="text-white/30 text-xs mt-0.5">{sub}</div>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="w-full border border-white/10 text-white/40 text-sm py-2.5 rounded-xl hover:bg-white/5 transition-colors">Back to Login</button>
      </div>
    </div>
  );

  return(
    <div className="min-h-screen bg-[#05080F] flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-sm" style={{animation:"fadeUp 0.4s ease forwards"}}>
        <div className="text-center mb-6"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${role==="student"?"bg-emerald-500/10 border-emerald-500/20":"bg-purple-500/10 border-purple-500/20"} border`}>{role==="student"?<Users size={20} className="text-emerald-400"/>:<GraduationCap size={20} className="text-purple-400"/>}</div><h2 className="text-white font-bold">Register as {role==="student"?"Student":"Teacher"}</h2></div>
        <div className="bg-[#080D18] border border-white/5 rounded-2xl p-6 space-y-4">
          <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Full Name</label><input onChange={e=>set("name")(e.target.value)} placeholder="Your full name" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
          {role==="teacher"&&<div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Email Address</label><input type="email" onChange={e=>set("email")(e.target.value)} placeholder="your@email.com" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>}
          {role==="student"&&(<>
            <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Roll Number</label><input onChange={e=>set("rollNo")(e.target.value)} placeholder="e.g. 0005" className="w-full bg-white/5 border border-white/10 text-white text-sm font-mono rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
            <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Class</label><select onChange={e=>set("classId")(e.target.value)} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50">{state.classes.map(c=><option key={c.id} value={c.id}>Class {c.name}-{c.section}</option>)}</select></div>
          </>)}
          <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Password</label><input type="password" onChange={e=>set("password")(e.target.value)} placeholder="Min 6 characters" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
          <div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Confirm Password</label><input type="password" onChange={e=>set("confirm")(e.target.value)} placeholder="Repeat password" className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50 placeholder-white/20"/></div>
          {error&&<div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"><AlertCircle size={13} className="text-red-400 flex-shrink-0"/><span className="text-xs text-red-400">{error}</span></div>}
          <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-3 rounded-xl transition-colors font-medium flex items-center justify-center gap-2 mt-1"><UserPlus size={14}/>Create Account</button>
          <button onClick={()=>setStep("choose")} className="w-full border border-white/10 text-white/40 text-sm py-2.5 rounded-xl hover:bg-white/5 transition-colors">← Back</button>
        </div>
      </div>
    </div>
  );
}

export default function SchoolERP() {
  const [state,setState] = useState<AppState>(INITIAL);
  const [user,setUser]   = useState<LoggedInUser|null>(null);
  const [showReg,setReg] = useState(false);
  const [route,setRoute] = useState<string>("home"); // public site route
  const [inDash,setInDash] = useState(false); // true = show dashboard
  const [dbStatus,setDbStatus] = useState<"idle"|"loading"|"ok"|"offline">("idle");
  const update = (fn:(s:AppState)=>AppState)=>setState(fn);

  // ─── Session restore on mount ────────────────────────────────────────────────
  useEffect(() => {
    try {
      const expiry = localStorage.getItem(SESSION_EXPIRY);
      if (expiry && Date.now() < parseInt(expiry)) {
        const savedUser = localStorage.getItem(SESSION_KEY);
        const savedDash = localStorage.getItem(SESSION_DASH);
        if (savedUser) setUser(JSON.parse(savedUser));
        if (savedDash === "true") setInDash(true);
      } else {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_EXPIRY);
        localStorage.removeItem(SESSION_DASH);
      }
    } catch {}
  }, []);

  // ─── Supabase: Load data on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!sb.isConfigured()) { setDbStatus("offline"); return; }
    setDbStatus("loading");
    Promise.all([
      sb.select<any>("students"),
      sb.select<any>("teachers"),
      sb.select<any>("inventory_items"),
      sb.select<any>("labs"),
      sb.select<any>("fees"),
      sb.select<any>("behavior"),
      sb.select<any>("counseling_profiles"),
    ]).then(([students, teachers, items, labs, fees, behavior, counseling]) => {
      setState(prev => ({
        ...prev,
        students:  students.length  ? students.map(dbToStudent)  : prev.students,
        teachers:  teachers.length  ? teachers.map(dbToTeacher)  : prev.teachers,
        inventory: {
          labs:  labs.length  ? labs.map(dbToLab)   : prev.inventory.labs,
          items: items.length ? items.map(dbToItem)  : prev.inventory.items,
        },
        fees:     { records: fees.length     ? fees.map(dbToFee)              : prev.fees.records },
        behavior: { records: behavior.length ? behavior.map(dbToBehavior)     : prev.behavior.records },
        counseling:{ profiles: counseling.length ? counseling.map(dbToCounselingProfile) : prev.counseling.profiles },
      }));
      setDbStatus("ok");
    }).catch(() => setDbStatus("offline"));
  }, []);

  // ─── Row mappers: DB snake_case → app camelCase ────────────────────────────
  function dbToStudent(r: any): Student {
    return { id: r.id, name: r.name, rollNo: r.roll_no, classId: r.class_id,
      photo: r.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`,
      marks: r.marks || {}, password: r.password || "changeme",
      profile: r.profile || undefined };
  }
  function dbToTeacher(r: any): Teacher {
    return { id: r.id, name: r.name, email: r.email, subjectIds: r.subject_ids || [],
      classIds: r.class_ids || [], password: r.password || "changeme",
      profile: r.profile || undefined };
  }
  function dbToItem(r: any): InventoryItem {
    return { id: r.id, name: r.name, category: r.category, quantity: r.quantity,
      unit: r.unit, condition: r.condition, location: r.location,
      lastChecked: r.last_checked, note: r.note || undefined, labId: r.lab_id || undefined };
  }
  function dbToLab(r: any): Lab {
    return { id: r.id, name: r.name, icon: r.icon, password: r.password,
      description: r.description || "", color: r.color || "bg-blue-500/10 border-blue-500/20" };
  }
  function dbToFee(r: any): FeeRecord {
    return { id: r.id, studentId: r.student_id, category: r.category, label: r.label,
      amount: r.amount, dueDate: r.due_date, status: r.status,
      paidDate: r.paid_date || undefined, paidAmount: r.paid_amount || undefined,
      note: r.note || undefined };
  }
  function dbToBehavior(r: any): BehaviorRecord {
    return { id: r.id, studentId: r.student_id, date: r.date, type: r.type,
      severity: r.severity, category: r.category, description: r.description,
      actionTaken: r.action_taken || "", status: r.status, reportedBy: r.reported_by || "Admin" };
  }
  function dbToCounselingProfile(r: any): CounselingProfile {
    return { studentId: r.student_id, background: r.background || "",
      sessions: r.sessions || [], flags: r.flags || [] };
  }

  // ─── DB Operations (Supabase + local state) ────────────────────────────────
  const db: DbOps = {
    connected: dbStatus === "ok",

    // Students
    async addStudent(s) {
      update(st => ({ ...st, students: [...st.students, s] }));
      await sb.upsert("students", {
        id: s.id, name: s.name, roll_no: s.rollNo, class_id: s.classId,
        photo: s.photo, marks: s.marks, password: s.password, profile: s.profile ?? null,
      });
    },
    async updateStudent(s) {
      update(st => ({ ...st, students: st.students.map(x => x.id === s.id ? s : x) }));
      await sb.update("students", s.id, {
        name: s.name, roll_no: s.rollNo, class_id: s.classId,
        photo: s.photo, marks: s.marks, password: s.password, profile: s.profile ?? null,
      });
    },
    async deleteStudent(id) {
      update(st => ({ ...st, students: st.students.filter(x => x.id !== id) }));
      await sb.delete("students", id);
    },

    // Teachers
    async addTeacher(t) {
      update(st => ({ ...st, teachers: [...st.teachers, t] }));
      await sb.upsert("teachers", {
        id: t.id, name: t.name, email: t.email, subject_ids: t.subjectIds,
        class_ids: t.classIds, password: t.password, profile: t.profile ?? null,
      });
    },
    async updateTeacher(t) {
      update(st => ({ ...st, teachers: st.teachers.map(x => x.id === t.id ? t : x) }));
      await sb.update("teachers", t.id, {
        name: t.name, email: t.email, subject_ids: t.subjectIds,
        class_ids: t.classIds, password: t.password, profile: t.profile ?? null,
      });
    },
    async deleteTeacher(id) {
      update(st => ({ ...st, teachers: st.teachers.filter(x => x.id !== id) }));
      await sb.delete("teachers", id);
    },

    // Inventory items
    async addItem(i) {
      update(st => ({ ...st, inventory: { ...st.inventory, items: [...st.inventory.items, i] } }));
      await sb.upsert("inventory_items", {
        id: i.id, name: i.name, category: i.category, quantity: i.quantity,
        unit: i.unit, condition: i.condition, location: i.location,
        last_checked: i.lastChecked, note: i.note ?? null, lab_id: i.labId ?? null,
      });
    },
    async updateItem(i) {
      update(st => ({ ...st, inventory: { ...st.inventory, items: st.inventory.items.map(x => x.id === i.id ? i : x) } }));
      await sb.update("inventory_items", i.id, {
        name: i.name, category: i.category, quantity: i.quantity,
        unit: i.unit, condition: i.condition, location: i.location,
        last_checked: i.lastChecked, note: i.note ?? null, lab_id: i.labId ?? null,
      });
    },
    async deleteItem(id) {
      update(st => ({ ...st, inventory: { ...st.inventory, items: st.inventory.items.filter(x => x.id !== id) } }));
      await sb.delete("inventory_items", id);
    },

    // Labs
    async addLab(l) {
      update(st => ({ ...st, inventory: { ...st.inventory, labs: [...st.inventory.labs, l] } }));
      await sb.upsert("labs", { id: l.id, name: l.name, icon: l.icon, password: l.password, description: l.description, color: l.color });
    },
    async updateLab(l) {
      update(st => ({ ...st, inventory: { ...st.inventory, labs: st.inventory.labs.map(x => x.id === l.id ? l : x) } }));
      await sb.update("labs", l.id, { name: l.name, icon: l.icon, password: l.password, description: l.description, color: l.color });
    },
    async deleteLab(id) {
      update(st => ({ ...st, inventory: { ...st.inventory, labs: st.inventory.labs.filter(x => x.id !== id), items: st.inventory.items.filter(x => x.labId !== id) } }));
      await sb.delete("labs", id);
    },

    // Fees
    async addFee(f) {
      update(st => ({ ...st, fees: { records: [...st.fees.records, f] } }));
      await sb.upsert("fees", {
        id: f.id, student_id: f.studentId, category: f.category, label: f.label,
        amount: f.amount, due_date: f.dueDate, status: f.status,
        paid_date: f.paidDate ?? null, paid_amount: f.paidAmount ?? null, note: f.note ?? null,
      });
    },
    async updateFee(f) {
      update(st => ({ ...st, fees: { records: st.fees.records.map(x => x.id === f.id ? f : x) } }));
      await sb.update("fees", f.id, {
        status: f.status, paid_date: f.paidDate ?? null,
        paid_amount: f.paidAmount ?? null, note: f.note ?? null,
      });
    },
    async deleteFee(id) {
      update(st => ({ ...st, fees: { records: st.fees.records.filter(x => x.id !== id) } }));
      await sb.delete("fees", id);
    },

    // Behavior
    async addBehavior(b) {
      update(st => ({ ...st, behavior: { records: [...st.behavior.records, b] } }));
      await sb.upsert("behavior", {
        id: b.id, student_id: b.studentId, date: b.date, type: b.type,
        severity: b.severity, category: b.category, description: b.description,
        action_taken: b.actionTaken, status: b.status, reported_by: b.reportedBy,
      });
    },
    async updateBehavior(b) {
      update(st => ({ ...st, behavior: { records: st.behavior.records.map(x => x.id === b.id ? b : x) } }));
      await sb.update("behavior", b.id, {
        severity: b.severity, category: b.category, description: b.description,
        action_taken: b.actionTaken, status: b.status,
      });
    },
    async deleteBehavior(id) {
      update(st => ({ ...st, behavior: { records: st.behavior.records.filter(x => x.id !== id) } }));
      await sb.delete("behavior", id);
    },

    // Counseling
    async saveCounselingProfile(p) {
      update(st => {
        const existing = st.counseling.profiles.find(x => x.studentId === p.studentId);
        return { ...st, counseling: { profiles: existing
          ? st.counseling.profiles.map(x => x.studentId === p.studentId ? p : x)
          : [...st.counseling.profiles, p] }};
      });
      await sb.upsert("counseling_profiles", {
        student_id: p.studentId, background: p.background,
        sessions: p.sessions, flags: p.flags,
      });
    },
  };

  const globalStyle = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap');
    .font-display{font-family:'Playfair Display',serif}
    .font-sans{font-family:'Inter',sans-serif}
    .font-mono{font-family:'DM Mono',monospace}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-track{background:#05080F}
    ::-webkit-scrollbar-thumb{background:#1e2535;border-radius:2px}
    ::-webkit-scrollbar-thumb:hover{background:#3B82F6}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
    @keyframes slideIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse-slow{0%,100%{opacity:1}50%{opacity:0.6}}
    .anim-fade{animation:fadeUp 0.5s ease forwards}
    .anim-slide{animation:slideIn 0.4s ease forwards}
    select{color-scheme:dark}
    select option{background:#0d1117;color:#ffffff}
  `;

  // Dashboard routes
  if(inDash){
    if(showReg) return(<><style>{globalStyle}</style><RegistrationScreen state={state} setState={update} onBack={()=>setReg(false)}/></>);
    if(!user) return(<><style>{globalStyle}</style><LoginScreen state={state} db={db} onLogin={(loggedInUser)=>{try{localStorage.setItem(SESSION_KEY,JSON.stringify(loggedInUser));localStorage.setItem(SESSION_EXPIRY,String(Date.now()+ONE_HOUR_MS));localStorage.setItem(SESSION_DASH,"true");}catch{}setUser(loggedInUser);setInDash(true);}} onRegister={()=>setReg(true)} onBack={()=>setInDash(false)}/></>);
    return(
      <>
        <style>{globalStyle}</style>
        {/* DB status badge */}
        <div style={{position:"fixed",bottom:12,right:12,zIndex:9999}}>
          {dbStatus==="loading"&&<div className="flex items-center gap-1.5 bg-[#080D18] border border-white/10 rounded-full px-3 py-1.5 text-[10px] text-white/40"><Database size={10} className="animate-pulse text-blue-400"/>Connecting to DB…</div>}
          {dbStatus==="ok"&&<div className="flex items-center gap-1.5 bg-[#080D18] border border-emerald-500/20 rounded-full px-3 py-1.5 text-[10px] text-emerald-400"><Wifi size={10}/>Supabase connected</div>}
          {dbStatus==="offline"&&<div className="flex items-center gap-1.5 bg-[#080D18] border border-amber-500/20 rounded-full px-3 py-1.5 text-[10px] text-amber-400"><WifiOff size={10}/>Local mode (no DB)</div>}
        </div>
        {(user.role==="admin")         &&<AdminView   user={user} state={state} setState={update} db={db} onLogout={()=>{try{localStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_EXPIRY);localStorage.removeItem(SESSION_DASH);}catch{}setUser(null);setInDash(false);}}/>}
        {(user.role==="support_admin") &&<AdminView   user={user} state={state} setState={update} db={db} onLogout={()=>{try{localStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_EXPIRY);localStorage.removeItem(SESSION_DASH);}catch{}setUser(null);setInDash(false);}} isSA/>}
        {user.role==="teacher"         &&<TeacherView user={user} state={state} setState={update} onLogout={()=>{try{localStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_EXPIRY);localStorage.removeItem(SESSION_DASH);}catch{}setUser(null);setInDash(false);}}/>}
        {user.role==="student"         &&<StudentView user={user} state={state} onLogout={()=>{try{localStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_EXPIRY);localStorage.removeItem(SESSION_DASH);}catch{}setUser(null);setInDash(false);}}/>}
      </>
    );
  }

  // Public website
  return(
    <>
      <style>{globalStyle}</style>
      <PublicWebsite state={state} route={route} setRoute={setRoute} onEnterDash={()=>setInDash(true)}/>
    </>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────
function Modal({title,children,onClose,wide}:{title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean}) {
  return(
    <div className={`bg-[#080D18] border border-white/10 rounded-2xl p-6 ${wide?"w-full max-w-2xl":"w-96"} space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto`}>
      <div className="flex items-center justify-between"><h3 className="font-bold text-white">{title}</h3><button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors"><X size={16}/></button></div>
      {children}
    </div>
  );
}
function Field({label,onChange,type="text"}:{label:string;onChange:(v:string)=>void;type?:string}){
  return<div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">{label}</label><input type={type} onChange={e=>onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50"/></div>;
}
function SelField({label,options,onChange}:{label:string;options:{value:string;label:string}[];onChange:(v:string)=>void}){
  return<div><label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">{label}</label><select onChange={e=>onChange(e.target.value)} className="w-full bg-[#05080F] border border-white/10 text-white text-sm rounded-xl px-4 py-2.5 outline-none focus:border-blue-500/50"><option value="">— Select —</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
}
function MBtn({onClick,children}:{onClick:()=>void;children:React.ReactNode}){
  return<button onClick={onClick} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm py-2.5 rounded-xl transition-colors font-medium mt-1">{children}</button>;
}