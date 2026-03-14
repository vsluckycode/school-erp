"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";

// ── Grade sets ─────────────────────────────────────────────────────────────────
const OL_GRADES = ["10","11"];
const AL_GRADES = ["12","13"];

// A/L streams
const AL_STREAMS = [
  { id:"Arts",       label:"Arts",       color:"#a78bfa" },
  { id:"Commerce",   label:"Commerce",   color:"#34d399" },
  { id:"Science",    label:"Science",    color:"#60a5fa" },
  { id:"Math",       label:"Maths",      color:"#fb923c" },
  { id:"Technology", label:"Technology", color:"#f472b6" },
];

// A/L common + stream subjects
const AL_COMMON = [{ id:"al_gen_english", label:"General English", code:"AL01" }];
const AL_SUBJECTS = {
  Arts: [
    ...AL_COMMON,
    { id:"al_sinhala_lit",  label:"Sinhala Literature",    code:"AL10" },
    { id:"al_buddhism",     label:"Buddhist Civilization",  code:"AL11" },
    { id:"al_history",      label:"History",                code:"AL12" },
    { id:"al_geography",    label:"Geography",              code:"AL13" },
    { id:"al_economics",    label:"Economics",              code:"AL14" },
    { id:"al_pol_science",  label:"Political Science",      code:"AL15" },
    { id:"al_logic",        label:"Logic",                  code:"AL16" },
  ],
  Commerce: [
    ...AL_COMMON,
    { id:"al_accounting",   label:"Accounting",             code:"AL20" },
    { id:"al_business",     label:"Business Studies",       code:"AL21" },
    { id:"al_economics",    label:"Economics",              code:"AL22" },
  ],
  Science: [
    ...AL_COMMON,
    { id:"al_comb_maths",   label:"Combined Maths",         code:"AL30" },
    { id:"al_physics",      label:"Physics",                code:"AL31" },
    { id:"al_chemistry",    label:"Chemistry",              code:"AL32" },
    { id:"al_biology",      label:"Biology",                code:"AL33" },
  ],
  Math: [
    ...AL_COMMON,
    { id:"al_comb_maths",   label:"Combined Maths",         code:"AL30" },
    { id:"al_physics",      label:"Physics",                code:"AL31" },
    { id:"al_ict_al",       label:"ICT",                    code:"AL34" },
    { id:"al_statistics",   label:"Statistics",             code:"AL35" },
  ],
  Technology: [
    ...AL_COMMON,
    { id:"al_comb_maths",   label:"Combined Maths",         code:"AL30" },
    { id:"al_engineering",  label:"Engineering Technology", code:"AL40" },
    { id:"al_bio_systems",  label:"Bio Systems Technology", code:"AL41" },
    { id:"al_ict_tech",     label:"ICT",                    code:"AL42" },
  ],
};

// Middle school subjects (Gr 6–9)
const GRADE_6_9_SUBJECTS = [
  { id:"sinhala",    label:"Sinhala",       code:1  },
  { id:"religion",   label:"Religion",      code:2  },
  { id:"english",    label:"English",       code:3  },
  { id:"maths",      label:"Mathematics",   code:4  },
  { id:"science",    label:"Science",       code:5  },
  { id:"history",    label:"History",       code:6  },
  { id:"geography",  label:"Geography",     code:7  },
  { id:"civics",     label:"Civics",        code:8  },
  { id:"second_lang",label:"2nd Language",  code:9  },
  { id:"health",     label:"Health",        code:10 },
  { id:"pts",        label:"PTS",           code:11 },
  { id:"aesthetic",  label:"Aesthetic",     code:12, isAesthetic:true },
  { id:"ict",        label:"ICT",           code:13 },
];
const AESTHETIC_OPTIONS = [
  { id:"music_w", label:"Music (Western)" },
  { id:"art",     label:"Art"             },
  { id:"dance",   label:"Dance"           },
  { id:"drama",   label:"Drama"           },
];

// O/L subjects
const OL_CORE = [
  { id:"sinhala", label:"Sinhala",     code:"21" },
  { id:"english", label:"English",     code:"31" },
  { id:"maths",   label:"Mathematics", code:"32" },
  { id:"history", label:"History",     code:"33" },
  { id:"science", label:"Science",     code:"34" },
];
const OL_RELIGION_OPTIONS = [
  { id:"buddhism",  label:"Buddhism",     code:"11" },
  { id:"hinduism",  label:"Hinduism",     code:"12" },
  { id:"catholic",  label:"Catholicism",  code:"14" },
  { id:"christian", label:"Christianity", code:"15" },
  { id:"islam",     label:"Islam",        code:"16" },
];
const OL_BASKET = {
  basket1:{
    label:"Basket 1 – Commerce",
    options:[
      { id:"commerce",   label:"Business & Accounting",    code:"60" },
      { id:"geography",  label:"Geography",                code:"61" },
      { id:"civics",     label:"Civic Education",          code:"62" },
      { id:"enterprise", label:"Entrepreneurship Studies", code:"63" },
    ],
  },
  basket2:{
    label:"Basket 2 – Languages / Arts",
    options:[
      { id:"music_pera",  label:"Music (Western)",    code:"40" },
      { id:"music_east",  label:"Music (Eastern)",    code:"41" },
      { id:"art",         label:"Art",                code:"43" },
      { id:"dance_local", label:"Dance (Deshiya)",    code:"44" },
      { id:"drama_si",    label:"Drama (Sinhala)",    code:"50" },
      { id:"eng_lit",     label:"English Literature", code:"46" },
      { id:"sin_lit",     label:"Sinhala Literature", code:"47" },
    ],
  },
  basket3:{
    label:"Basket 3 – Technical / Vocational",
    options:[
      { id:"ict",       label:"ICT",                     code:"80" },
      { id:"agri",      label:"Agriculture & Food",      code:"81" },
      { id:"home_ec",   label:"Home Economics",          code:"85" },
      { id:"health_pe", label:"Health & Physical Ed.",   code:"86" },
      { id:"construct", label:"Construction Technology", code:"88" },
      { id:"mech",      label:"Mechanical Technology",   code:"89" },
      { id:"elect",     label:"Electrical Technology",   code:"90" },
    ],
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function gradePoint(mark) {
  if (mark==="ab"||mark==="") return "AB";
  const m=Number(mark);
  if (isNaN(m)) return "-";
  if (m>74) return "A";
  if (m>64) return "B";
  if (m>54) return "C";
  if (m>39) return "S";
  if (m>0)  return "W";
  return "-";
}
function gradeColor(g) {
  return ({A:"#22c55e",B:"#84cc16",C:"#eab308",S:"#f97316",W:"#ef4444",AB:"#a78bfa","-":"#6b7280"})[g]||"#6b7280";
}

// ── RBAC ──────────────────────────────────────────────────────────────────────
// Returns { canView, canEdit, allowedSubjectCodes (null=all), isAdmin, isClassTeacher, isSubjectTeacher }
function derivePermissions(user, state, selectedGrade, selectedClass) {
  if (!user) return { canView:false, canEdit:false, allowedSubjectCodes:null, isAdmin:false };
  const role=user.role;
  if (role==="admin"||role==="support_admin")
    return { canView:true, canEdit:true, allowedSubjectCodes:null, isAdmin:true };

  if (role==="teacher"&&state) {
    const teacher=(state.teachers||[]).find(t=>t.id===user.id);
    if (!teacher) return { canView:false, canEdit:false, allowedSubjectCodes:null, isAdmin:false };

    // Class teacher: classes table has { id, name (=grade), section (=class letter), teacherId }
    const isClassTeacher=(state.classes||[]).some(c=>
      c.teacherId===teacher.id &&
      (c.name===String(selectedGrade)||c.name===`${selectedGrade}${selectedClass}`) &&
      (c.section===selectedClass||c.name===`${selectedGrade}${selectedClass}`)
    );
    if (isClassTeacher)
      return { canView:true, canEdit:true, allowedSubjectCodes:null, isAdmin:false, isClassTeacher:true };

    // Subject teacher: restricted to assigned subjects
    const mySubjects=(state.subjects||[]).filter(s=>(s.teacherIds||[]).includes(teacher.id));
    const codes=mySubjects.map(s=>s.code);
    return { canView:true, canEdit:codes.length>0, allowedSubjectCodes:codes, isAdmin:false, isSubjectTeacher:true };
  }
  return { canView:false, canEdit:false, allowedSubjectCodes:null, isAdmin:false };
}

// ── Main Component ─────────────────────────────────────────────────────────────
// Props:
//   db     – Supabase REST client from page.tsx (sb)
//   user   – logged-in user  { role, id, name }
//   state  – full AppState from page.tsx  (for RBAC + live subject/student lists)
//   exams  – array of Exam objects (falls back to state.exams if omitted)

// ── SyncedTable: scrollbar pinned ABOVE content, thead sticky inside ──────────
function SyncedTable({ children, tableRef }) {
  const phantomRef = React.useRef(null);

  React.useEffect(() => {
    const wrap = tableRef?.current;
    const ph   = phantomRef?.current;
    if (!wrap || !ph) return;
    function syncW() {
      if (ph.firstChild) ph.firstChild.style.width = wrap.scrollWidth + "px";
    }
    syncW();
    let lockT=false, lockP=false;
    function onWrap() { if(lockP) return; lockT=true; ph.scrollLeft=wrap.scrollLeft; lockT=false; }
    function onPh()   { if(lockT) return; lockP=true; wrap.scrollLeft=ph.scrollLeft; lockP=false; }
    wrap.addEventListener("scroll", onWrap);
    ph.addEventListener("scroll", onPh);
    const ro = new ResizeObserver(syncW);
    ro.observe(wrap);
    return () => {
      wrap.removeEventListener("scroll", onWrap);
      ph.removeEventListener("scroll", onPh);
      ro.disconnect();
    };
  }, [tableRef]);

  return (
    <div style={{display:"flex",flexDirection:"column"}}>
      {/* Scrollbar row ABOVE the table */}
      <div style={{background:"#0a0f1e",borderBottom:"1px solid #1e293b",flexShrink:0}}>
        <div ref={phantomRef} className="marks-phantom-scroll"
          style={{overflowX:"scroll",overflowY:"hidden",height:12,
                  scrollbarWidth:"thin",scrollbarColor:"#475569 #0a0f1e"}}>
          <div style={{height:1}}/>
        </div>
      </div>
      {/* Table — vertical scroll here; horizontal hidden (phantom syncs it) */}
      <div ref={tableRef} className="marks-scroll"
        style={{overflowX:"scroll",overflowY:"auto",
                maxHeight:"calc(100vh - 360px)",
                scrollbarWidth:"thin",
                scrollbarColor:"#334155 #0f172a"}}>
        {children}
      </div>
    </div>
  );
}

/**
 * @param {{ db: any, user: any, state: any, setState: any, exams: any }} props
 */
export default function MarksEntry({ db, user, state, setState, exams: examsProp }) {
  const exams = examsProp || state?.exams || [];

  const [selectedGrade,   setSelectedGrade]   = useState("6");
  const [selectedClass,   setSelectedClass]   = useState("A");
  const [examMode,        setExamMode]        = useState("monthly");
  const [selectedMonth,   setSelectedMonth]   = useState(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const [selectedExamId,  setSelectedExamId]  = useState("");
  const [academicYear]                        = useState(String(new Date().getFullYear()));
  const [students,        setStudents]        = useState([]);
  const [subjectMap,      setSubjectMap]      = useState({});
  const [loading,         setLoading]         = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [savedIndicator,  setSavedIndicator]  = useState(false);
  const [aestheticChoice, setAestheticChoice] = useState("music_w");
  const [olReligion,      setOlReligion]      = useState("buddhism");
  const [olBasket,        setOlBasket]        = useState({basket1:"commerce",basket2:"music_pera",basket3:"ict"});
  const [filter,          setFilter]          = useState("");
  const [error,           setError]           = useState("");
  const [csvImportModal,  setCsvImportModal]  = useState(false);
  const [csvPreview,      setCsvPreview]      = useState(null);
  const [csvApplying,     setCsvApplying]     = useState(false);
  // CSV destination confirmation modal
  const [csvDestModal,    setCsvDestModal]    = useState(false);
  const [pendingCsvFile,  setPendingCsvFile]  = useState(null);
  // Selected rows for delete
  const [selectedRows,    setSelectedRows]    = useState(new Set());
  // Move marks modal
  const [moveModal,       setMoveModal]       = useState(false);
  const [moveDest,        setMoveDest]        = useState({grade:"",section:"",subjectId:""});
  const csvFileRef = useRef(null);
  const inputRefs = useRef({});
  const tableScrollRef = useRef(null);

  const isOL = OL_GRADES.includes(selectedGrade);
  const isAL = AL_GRADES.includes(selectedGrade);

  const selectedExam = examMode==="exam"
    ? (exams.find(e=>e.id===selectedExamId)?.name||"")
    : (()=>{const [y,m]=selectedMonth.split("-");return `${new Date(Number(y),Number(m)-1,1).toLocaleString("default",{month:"long"})} ${y}`;})();

  const perms = derivePermissions(user, state, selectedGrade, selectedClass);

  // ── Build subject list — ONLY from state.subjects for this class ───────
  const allSubjects = (() => {
    // Find the matching class object for selected grade + section
    const matchClass = (state?.classes||[]).find(c=>{
      const cGrade = String(c.name).replace(/[^0-9]/g,"");
      return cGrade===selectedGrade && c.section===selectedClass;
    });
    const classId = matchClass?.id;

    if (classId && (state?.subjects||[]).length > 0) {
      // Only subjects whose classIds include this class
      const classSubs = state.subjects.filter(s=>(s.classIds||[]).includes(classId));
      if (classSubs.length > 0) {
        return classSubs.map(s=>({ id:s.id, label:s.name, code:s.code }));
      }
    }

    // No subjects configured yet — return empty (don't show hardcoded defaults)
    return [];
  })();

  function canEditSubject(sub) {
    if (!perms.canEdit) return false;
    if (perms.allowedSubjectCodes===null) return true;
    if (!state) return true;
    const matched=(state.subjects||[]).find(s=>
      s.code?.toLowerCase()===String(sub.code)?.toLowerCase()||
      s.name?.toLowerCase()===sub.label?.toLowerCase()
    );
    return matched ? (matched.teacherIds||[]).includes(user?.id) : false;
  }

  // ── Load students from state (live — no fake fallbacks) ─────────────
  useEffect(()=>{
    if (!perms.canView) { setStudents([]); return; }
    setLoading(true); setError("");

    // 1. Find the classId that matches selected grade + section from state.classes
    const matchingClass = (state?.classes||[]).find(c=>{
      const cGrade = String(c.name).replace(/[^0-9]/g,"");
      return cGrade===selectedGrade && c.section===selectedClass;
    });
    const classId = matchingClass?.id;

    // 2. Filter students by classId
    let stuList = [];
    if (classId) {
      stuList = (state?.students||[]).filter(s=>s.classId===classId);
    } else {
      // fallback: try matching by grade+section stored directly on student (DB mode)
      stuList = (state?.students||[]).filter(s=>{
        const sc = (state?.classes||[]).find(c=>c.id===s.classId);
        if (!sc) return false;
        const cGrade = String(sc.name).replace(/[^0-9]/g,"");
        return cGrade===selectedGrade && sc.section===selectedClass;
      });
    }

    // 3. Keep natural order (no sort — preserves CSV upload order)

    // 4. Map to display shape — resolve marks from examRecords if exam selected
    const marksFromExam = {};
    if (examMode==="exam" && selectedExamId) {
      (state?.examRecords||[])
        .filter(r=>r.examId===selectedExamId)
        .forEach(r=>{
          if (!marksFromExam[r.studentId]) marksFromExam[r.studentId]={};
          marksFromExam[r.studentId][r.subjectId] = String(r.marks);
        });
    }

    const mapped = stuList.map(st=>{
      let rawMarks = {};
      if (examMode==="exam" && selectedExamId) {
        rawMarks = marksFromExam[st.id] || {};
      } else {
        // monthly mode — read month-prefixed keys: monthly_YYYY-MM_subjectId
        const prefix = `monthly_${selectedMonth}_`;
        const allM = st.marks || {};
        Object.keys(allM).forEach(k=>{
          if (k.startsWith(prefix)) rawMarks[k.replace(prefix,"")] = String(allM[k]);
        });
      }
      const marks = {};
      allSubjects.forEach(sub=>{
        marks[sub.id] = String(rawMarks[sub.id]||rawMarks[sub.code]||"");
      });
      // Gender: read directly from student.gender field (set by page.tsx from decrypted profile)
      const gRaw = st.gender||"";
      let gender = "M";
      if (gRaw==="F") { gender="F"; }
      else if (gRaw==="M") { gender="M"; }
      return {
        id: st.id,
        admNo: st.rollNo||st.adm_no||"",
        name: st.name,
        gender,
        marks,
      };
    });

    setStudents(mapped);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selectedGrade,selectedClass,selectedExam,selectedExamId,examMode,academicYear,perms.canView,
     state?.students?.length, state?.classes?.length, state?.examRecords?.length]);

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown=useCallback((e,si,subi)=>{
    if(e.key==="Enter"||e.key==="Tab"){
      e.preventDefault();
      const next=subi+1<allSubjects.length ? `${si}-${subi+1}` : si+1<students.length ? `${si+1}-0` : null;
      if(next&&inputRefs.current[next]) inputRefs.current[next].focus();
    }
  },[allSubjects,students]);

  const handleMarkChange=useCallback((sid,subId,val)=>{
    setStudents(prev=>prev.map(s=>s.id===sid?{...s,marks:{...s.marks,[subId]:val}}:s));
  },[]);

  function calcTotal(s){ return allSubjects.reduce((sum,sub)=>{ const v=s.marks[sub.id]; return sum+(v&&v!=="ab"?Number(v)||0:0); },0); }
  function calcAvg(s){ const c=allSubjects.filter(sub=>{const v=s.marks[sub.id];return v&&v!=="ab"&&!isNaN(Number(v));}).length; return c>0?(calcTotal(s)/c).toFixed(1):"0.0"; }

  const rankedMap=Object.fromEntries(
    [...students].map(s=>({...s,t:calcTotal(s)})).sort((a,b)=>b.t-a.t).map((s,i)=>[s.id,i+1])
  );
  const displayStudents=students.filter(s=>filter===""||s.name.toLowerCase().includes(filter.toLowerCase())||s.admNo.includes(filter));

  // ── CSV Export (example template) ─────────────────────────────────────────
  function downloadExampleCsv() {
    const subjectHeaders = allSubjects.length > 0
      ? allSubjects.map(s => s.code)
      : ["SUBJECT_CODE_1", "SUBJECT_CODE_2", "SUBJECT_CODE_3"];
    const headerRow = ["adm_no", "name", ...subjectHeaders];
    const dataRows = students.length > 0
      ? students.map(s => [s.admNo, s.name, ...subjectHeaders.map(() => "")])
      : [
          ["ADM001", "Example Student 1", ...subjectHeaders.map(() => "")],
          ["ADM002", "Example Student 2", ...subjectHeaders.map(() => "")],
          ["ADM003", "Example Student 3", ...subjectHeaders.map(() => "")],
        ];
    const csv = [headerRow, ...dataRows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marks_template_Gr${selectedGrade}${selectedClass}_${selectedExam||"term"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── CSV Parse & Preview ────────────────────────────────────────────────────
  function parseCsvText(text) {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return { rows: [], errors: ["CSV has no data rows."], matched: 0, hint: null };

    // Simple CSV split — handles quoted fields
    function splitRow(line) {
      const result = [];
      let cur = "", inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i+1] === '"') { cur += '"'; i++; }
          else inQ = !inQ;
        } else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ""; }
        else cur += ch;
      }
      result.push(cur.trim());
      return result;
    }

    const rawHeaders = splitRow(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().trim().replace(/^"|"$/g, ""));

    // Accept adm_no OR rollno / roll_no as the ID column
    const ADM_ALIASES  = ["adm_no", "rollno", "roll_no", "admission_no", "adm", "roll"];
    const NAME_ALIASES = ["name", "student_name", "full_name"];

    const admIdx  = headers.findIndex(h => ADM_ALIASES.includes(h));
    const nameIdx = headers.findIndex(h => NAME_ALIASES.includes(h));

    // Columns that are clearly non-marks metadata — always skip these
    const SKIP_COLS = new Set([
      "class","section","grade","password","pass","dob","date_of_birth",
      "gender","phone","address","parent_name","parent_phone",
      "blood_group","bloodgroup","email","nic","qualification",
      "join_date","joindate","status","photo","id"
    ]);

    if (admIdx === -1 && nameIdx === -1) {
      return {
        rows: [], matched: 0, hint: null,
        errors: [
          `Could not find a student identifier column.`,
          `Your CSV headers are: ${rawHeaders.slice(0,8).join(", ")}${rawHeaders.length>8?"…":""}`,
          `Expected one of: adm_no, rollno, name (or similar).`,
        ]
      };
    }

    // Map subject columns: match by code (case-insensitive) or by subject label
    const subjectColMap = {}; // colIndex -> subjectId
    const skippedNonSubject = [];
    const unrecognisedSubjectHeaders = [];

    headers.forEach((h, i) => {
      if (i === admIdx || i === nameIdx) return;
      if (SKIP_COLS.has(h)) { skippedNonSubject.push(rawHeaders[i]); return; }
      const sub = allSubjects.find(s =>
        String(s.code).toLowerCase() === h ||
        s.label.toLowerCase() === h ||
        s.label.toLowerCase().replace(/\s+/g,"_") === h
      );
      if (sub) subjectColMap[i] = sub.id;
      else unrecognisedSubjectHeaders.push(rawHeaders[i]);
    });

    const errors = [];

    if (Object.keys(subjectColMap).length === 0) {
      // Build a helpful message showing what the CSV has vs what subjects exist
      const csvDataCols = headers.filter((_,i) => i!==admIdx && i!==nameIdx && !SKIP_COLS.has(headers[i]));
      const expectedCodes = allSubjects.map(s => s.code);

      errors.push(
        `This looks like a student-list CSV, not a marks CSV.`
      );
      if (csvDataCols.length > 0) {
        errors.push(
          `Your CSV has columns: ${csvDataCols.slice(0,6).map(c=>rawHeaders[headers.indexOf(c)]).join(", ")}${csvDataCols.length>6?"…":""} — none match any subject.`
        );
      }
      if (expectedCodes.length > 0) {
        errors.push(
          `This class has ${allSubjects.length} subject${allSubjects.length!==1?"s":""}: ${expectedCodes.join(", ")}.`
        );
        errors.push(
          `👉 Download the "Example CSV" template — it already has the correct subject-code headers filled in.`
        );
      } else {
        errors.push(`No subjects are configured for Grade ${selectedGrade}${selectedClass} yet. Add subjects in the Subjects tab first.`);
      }
      return { rows: [], errors, matched: 0, hint: "use_template" };
    }

    // Warn about unrecognised columns that weren't skipped (possible typos in subject codes)
    if (unrecognisedSubjectHeaders.length > 0) {
      errors.push(
        `Ignored unrecognised column${unrecognisedSubjectHeaders.length!==1?"s":""}: ${unrecognisedSubjectHeaders.join(", ")} (not a known subject code or name).`
      );
    }

    const rows = [];
    let matched = 0;

    for (let li = 1; li < lines.length; li++) {
      const cols = splitRow(lines[li]);
      const admNo = admIdx >= 0 ? (cols[admIdx]||"").trim().replace(/^"|"$/g,"") : "";
      const name  = nameIdx >= 0 ? (cols[nameIdx]||"").trim().replace(/^"|"$/g,"") : "";
      if (!admNo && !name) continue; // blank row

      // Match student: by admNo first, then by name (case-insensitive)
      const student = students.find(s =>
        (admNo && (s.admNo === admNo || s.admNo === String(Number(admNo)))) ||
        (name  && s.name.toLowerCase().trim() === name.toLowerCase().trim())
      );

      if (!student) {
        if (admNo || name) errors.push(`Row ${li+1}: "${name||admNo}" not found in Grade ${selectedGrade}${selectedClass} — skipped.`);
        continue;
      }

      const marks = {};
      Object.entries(subjectColMap).forEach(([colIdx, subId]) => {
        const raw = (cols[colIdx]||"").trim().replace(/^"|"$/g,"").toLowerCase();
        if (raw === "") return;
        if (raw === "ab" || raw === "absent") { marks[subId] = "ab"; return; }
        const n = Number(raw);
        if (isNaN(n) || n < 0 || n > 100) {
          errors.push(`Row ${li+1} (${student.name}): invalid mark "${raw}" — must be 0–100 or "ab".`);
          return;
        }
        marks[subId] = String(n);
      });

      rows.push({ student, marks });
      matched++;
    }

    return { rows, errors, matched, hint: null };
  }

  function handleCsvFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    // Ask user: monthly test or exam?
    setPendingCsvFile(file);
    setCsvDestModal(true);
  }

  function proceedCsvWithDest() {
    if (!pendingCsvFile) return;
    setCsvDestModal(false);
    const reader = new FileReader();
    reader.onload = ev => {
      const result = parseCsvText(ev.target.result);
      setCsvPreview(result);
      setCsvImportModal(true);
    };
    reader.readAsText(pendingCsvFile);
    setPendingCsvFile(null);
  }

  function applyCsvImport() {
    if (!csvPreview?.rows?.length) return;
    setCsvApplying(true);
    setStudents(prev => {
      const updated = [...prev];
      csvPreview.rows.forEach(({ student, marks }) => {
        const idx = updated.findIndex(s => s.id === student.id);
        if (idx === -1) return;
        const merged = { ...updated[idx].marks };
        Object.entries(marks).forEach(([subId, val]) => {
          const sub = allSubjects.find(s => s.id === subId);
          if (sub && canEditSubject(sub)) merged[subId] = val;
        });
        updated[idx] = { ...updated[idx], marks: merged };
      });
      return updated;
    });
    setTimeout(() => {
      setCsvApplying(false);
      setCsvImportModal(false);
      setCsvPreview(null);
    }, 300);
  }

  // ── Bulk save ──────────────────────────────────────────────────────────────
  async function handleBulkSave() {
    if (!perms.canEdit) return;
    if (examMode==="exam"&&!selectedExamId){ setError("Select an exam before saving."); return; }
    if (!setState) { setError("Save unavailable — setState not provided."); return; }
    setSaving(true); setError("");
    try {
      if (examMode==="exam") {
        // ── Exam mode: write into state.examRecords ─────────────────────────
        const newRecs = [];
        for (const st of students) {
          for (const sub of allSubjects) {
            if (!canEditSubject(sub)) continue;
            const raw = st.marks[sub.id];
            if (raw==="" || raw===undefined) continue;
            newRecs.push({
              id: `${selectedExamId}_${st.id}_${sub.id}`,
              examId: selectedExamId,
              studentId: st.id,
              subjectId: sub.id,
              marks: raw==="ab" ? 0 : (Number(raw)||0),
            });
          }
        }
        const stuIds = new Set(students.map(s=>s.id));
        setState(s=>({
          ...s,
          examRecords: [
            ...(s.examRecords||[]).filter(r=>!(r.examId===selectedExamId && stuIds.has(r.studentId))),
            ...newRecs,
          ]
        }));
      } else {
        // ── Monthly mode: write into student.marks with month-prefixed keys ──
        const monthPrefix = `monthly_${selectedMonth}_`;
        setState(s=>({
          ...s,
          students: s.students.map(st=>{
            const local = students.find(x=>x.id===st.id);
            if (!local) return st;
            const updMarks = {...(st.marks||{})};
            allSubjects.forEach(sub=>{
              if (!canEditSubject(sub)) return;
              const raw = local.marks[sub.id];
              if (raw===undefined || raw==="") return;
              updMarks[monthPrefix+sub.id] = raw==="ab" ? 0 : (Number(raw)||0);
            });
            return {...st, marks: updMarks};
          })
        }));
      }
      await new Promise(r=>setTimeout(r,150));
    } catch(e){ setError("Save failed: "+(e?.message||e)); }
    finally { setSaving(false); setSavedIndicator(true); setTimeout(()=>setSavedIndicator(false),2500); }
  }

  if (!perms.canView) return (
    <div style={{background:"#0f172a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,color:"#64748b",fontFamily:"'Segoe UI',sans-serif"}}>
      <span style={{fontSize:48}}>🔒</span>
      <p style={{fontSize:16}}>You don't have permission to view Marks Entry.</p>
    </div>
  );


  // Build grade list and section list from state.classes only
  const availableGrades = [...new Set((state?.classes||[]).map(c=>String(c.name).replace(/[^0-9]/g,"")))
    .values()].filter(g=>g).sort((a,b)=>parseInt(a)-parseInt(b));

  const sectionsForGrade = (state?.classes||[])
    .filter(c=>String(c.name).replace(/[^0-9]/g,"")===selectedGrade)
    .map(c=>c.section)
    .sort();

  // Auto-select first available section when grade changes and current section isn't available
  const sectionValid = sectionsForGrade.includes(selectedClass);

  return (
    <div style={{background:"#0f172a",minHeight:"100vh",fontFamily:"'Noto Sans Sinhala','Segoe UI',sans-serif",color:"#e2e8f0"}}>

      {/* GRADE LEGEND BAR — top of page, always visible */}
      <div style={{background:"#0d1829",borderBottom:"1px solid #1e3a5f",padding:"7px 24px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"#475569",fontWeight:600,letterSpacing:"0.5px"}}>GRADE SCALE:</span>
        {[["A",">75","#22c55e"],["B","65–74","#84cc16"],["C","55–64","#eab308"],["S","40–54","#f97316"],["W","0–39","#ef4444"]].map(([g,r,col])=>(
          <span key={g} style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:5,background:col,fontSize:12,color:"#fff",fontWeight:800}}>{g}</span>
            <span style={{color:"#64748b",fontSize:12}}>{r}</span>
          </span>
        ))}
        <span style={{color:"#334155",marginLeft:4}}>|</span>
        <span style={{color:"#475569",fontSize:12}}>
          <kbd style={{background:"#1e293b",border:"1px solid #334155",padding:"1px 7px",borderRadius:4,fontSize:11,color:"#94a3b8"}}>Enter</kbd>
          {" / "}
          <kbd style={{background:"#1e293b",border:"1px solid #334155",padding:"1px 7px",borderRadius:4,fontSize:11,color:"#94a3b8"}}>Tab</kbd>
          {" — navigate cells · type "}
          <span style={{color:"#a78bfa",fontWeight:700}}>"ab"</span>
          {" for absent"}
        </span>
      </div>

      {/* HEADER */}
      <div style={{background:"linear-gradient(135deg,#1e293b,#0f172a)",borderBottom:"1px solid #334155",padding:"16px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:22,fontWeight:700,color:"#f1f5f9"}}>📋 Marks Entry</h1>
          <p style={{margin:"2px 0 0",fontSize:13,color:"#64748b"}}>
            {academicYear}{user?.name?` · ${user.name}`:""}
            {perms.isClassTeacher&&<span style={{color:"#34d399",marginLeft:8}}>🏫 Class Teacher</span>}
            {perms.isSubjectTeacher&&<span style={{color:"#a78bfa",marginLeft:8}}>📚 Subject Teacher</span>}
            {perms.isAdmin&&<span style={{color:"#60a5fa",marginLeft:8}}>🛡 Admin</span>}
          </p>
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}>
          {/* Grade buttons — from state.classes only */}
          {availableGrades.length===0 ? (
            <span style={{fontSize:12,color:"#475569"}}>No classes created yet</span>
          ) : (
            <>
              {[["6","7","8","9"],["10","11"],["12","13"]].map((group,gi)=>{
                const grp=group.filter(g=>availableGrades.includes(g));
                if(!grp.length) return null;
                const colors=["#3b82f6","#0e7490","#7c3aed"];
                const activeCol=colors[gi];
                return(
                  <div key={gi} style={{display:"flex",gap:2,background:"#0f172a",
                    padding:2,borderRadius:7,border:`1px solid ${activeCol}33`}}>
                    {grp.map(g=>(
                      <button key={g} onClick={()=>{
                        setSelectedGrade(g);
                        const secs=(state?.classes||[]).filter(c=>String(c.name).replace(/[^0-9]/g,"")===g).map(c=>c.section).sort();
                        setSelectedClass(secs[0]||"A");
                      }}
                        style={{padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",
                          fontWeight:600,fontSize:12,
                          background:selectedGrade===g?activeCol:"transparent",
                          color:selectedGrade===g?"#fff":"#64748b"}}>
                        {gi===1?"O/L "+g:gi===2?"A/L "+g:g}
                      </button>
                    ))}
                  </div>
                );
              })}
              <span style={{color:"#334155",fontSize:18}}>│</span>
              {/* Section buttons for selected grade */}
              {sectionsForGrade.length===0 ? (
                <span style={{fontSize:11,color:"#475569"}}>No sections for Gr {selectedGrade}</span>
              ) : sectionsForGrade.map(sec=>(
                <button key={sec} onClick={()=>setSelectedClass(sec)}
                  style={{padding:"4px 10px",borderRadius:7,border:"none",cursor:"pointer",
                    fontWeight:600,fontSize:12,whiteSpace:"nowrap",
                    background:(sectionValid?selectedClass:sectionsForGrade[0])===sec?"#8b5cf6":"#1e293b",
                    color:(sectionValid?selectedClass:sectionsForGrade[0])===sec?"#fff":"#94a3b8"}}>
                  {sec}
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* MODE SELECTOR — Monthly Test / Exam */}
      <div style={{background:"#1e293b",borderBottom:"1px solid #334155",padding:"10px 24px",display:"flex",gap:12,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",background:"#0f172a",borderRadius:8,overflow:"hidden",border:"1px solid #334155"}}>
          <button onClick={()=>setExamMode("monthly")}
            style={{padding:"6px 14px",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:examMode==="monthly"?"#3b82f6":"transparent",color:examMode==="monthly"?"#fff":"#64748b"}}>
            📆 Monthly Test
          </button>
          <button onClick={()=>setExamMode("exam")}
            style={{padding:"6px 14px",border:"none",cursor:"pointer",fontSize:13,fontWeight:600,background:examMode==="exam"?"#7c3aed":"transparent",color:examMode==="exam"?"#fff":"#64748b"}}>
            📝 Exam
          </button>
        </div>

        {examMode==="monthly" ? (
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)}
              style={{padding:"5px 10px",borderRadius:8,background:"#334155",border:"1px solid #475569",color:"#e2e8f0",fontSize:13,colorScheme:"dark"}}/>
            <span style={{fontSize:12,color:"#60a5fa",background:"#1d3461",padding:"4px 10px",borderRadius:20,border:"1px solid #2563eb44"}}>
              {selectedExam}
            </span>
          </div>
        ):(
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <select value={selectedExamId} onChange={e=>setSelectedExamId(e.target.value)}
              style={{padding:"6px 10px",borderRadius:8,background:"#334155",border:"1px solid #475569",color:selectedExamId?"#e2e8f0":"#94a3b8",fontSize:13,minWidth:200}}>
              <option value="">— Select Exam —</option>
              {exams.map(ex=><option key={ex.id} value={ex.id}>{ex.name} ({ex.year})</option>)}
            </select>
            {exams.length===0&&<span style={{fontSize:12,color:"#f97316"}}>⚠️ No exams yet — admin must create exams first.</span>}
            {selectedExamId&&<span style={{fontSize:12,color:"#a78bfa",background:"#7c3aed22",padding:"4px 10px",borderRadius:20,border:"1px solid #7c3aed44"}}>{exams.find(e=>e.id===selectedExamId)?.name}</span>}
          </div>
        )}
      </div>

      {/* A/L info — stream shown from section name */}
      {isAL&&selectedClass&&(
        <div style={{background:"#160d27",borderBottom:"1px solid #7c3aed44",padding:"7px 24px",display:"flex",gap:10,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#a78bfa",fontWeight:700}}>🎓 A/L</span>
          <span style={{fontSize:12,color:"#c4b5fd",background:"#7c3aed33",padding:"2px 12px",borderRadius:20,fontWeight:700}}>{selectedClass}</span>
          <span style={{fontSize:12,color:"#475569"}}>{allSubjects.length} subjects</span>
        </div>
      )}

      {/* no config panel — subjects come entirely from admin's Subjects tab */}

      {/* TOOLBAR */}
      <div style={{background:"#0f172a",padding:"10px 24px",display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",borderBottom:"1px solid #1e293b"}}>
        <span style={{fontSize:13,color:"#94a3b8",fontWeight:600}}>
          Grade {selectedGrade} · {selectedClass}
          {" · "}<span style={{color:"#60a5fa"}}>{selectedExam||"(no exam selected)"}</span>
          {" · "}{academicYear}
        </span>
        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <input placeholder="🔍 Search student…" value={filter} onChange={e=>setFilter(e.target.value)}
            style={{padding:"6px 12px",borderRadius:8,background:"#334155",border:"1px solid #475569",color:"#e2e8f0",fontSize:13,width:200}}/>

          {/* ⬇ Example CSV */}
          <button onClick={downloadExampleCsv}
            title="Download a CSV template pre-filled with student adm numbers & names"
            style={{padding:"7px 13px",borderRadius:8,background:"#0f3d2e",border:"1px solid #16a34a55",color:"#4ade80",
              cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
            ⬇ Example CSV
          </button>

          {/* ⬆ Import CSV */}
          {perms.canEdit && (
            <>
              <input ref={csvFileRef} type="file" accept=".csv,text/csv" style={{display:"none"}} onChange={handleCsvFileChange}/>
              <button onClick={()=>csvFileRef.current?.click()} disabled={loading}
                title="Upload a CSV to bulk-fill marks"
                style={{padding:"7px 13px",borderRadius:8,background:"#1a2f4a",border:"1px solid #2563eb55",color:"#60a5fa",
                  cursor:loading?"not-allowed":"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",opacity:loading?0.5:1}}>
                ⬆ Import CSV
              </button>
            </>
          )}

          {/* 🗑 Delete Selected */}
          {perms.canEdit && selectedRows.size>0 && (
            <button onClick={()=>{
              if(!confirm(`Clear marks for ${selectedRows.size} selected student(s)?`)) return;
              setStudents(prev=>prev.map(st=>{
                if(!selectedRows.has(st.id)) return st;
                const cleared={...st.marks};
                allSubjects.forEach(sub=>{ cleared[sub.id]=""; });
                return {...st,marks:cleared};
              }));
              setSelectedRows(new Set());
            }}
              style={{padding:"7px 13px",borderRadius:8,background:"#3d0f0f",border:"1px solid #ef444455",color:"#f87171",
                cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
              🗑 Delete ({selectedRows.size})
            </button>
          )}

          {/* ↗ Move Marks */}
          {perms.canEdit && selectedRows.size>0 && (
            <button onClick={()=>setMoveModal(true)}
              style={{padding:"7px 13px",borderRadius:8,background:"#1a2f1a",border:"1px solid #16a34a55",color:"#4ade80",
                cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap"}}>
              ↗ Move ({selectedRows.size})
            </button>
          )}

          {perms.canEdit?(
            <button onClick={handleBulkSave} disabled={saving||loading||(examMode==="exam"&&!selectedExamId)}
              style={{padding:"7px 20px",borderRadius:8,background:saving?"#1e3a5f":"#2563eb",color:"#fff",border:"none",
                cursor:(saving||loading||(examMode==="exam"&&!selectedExamId))?"not-allowed":"pointer",fontWeight:600,fontSize:13,
                opacity:(examMode==="exam"&&!selectedExamId)?0.5:1}}>
              {saving?"⏳ Saving…":"💾 Bulk Save"}
            </button>
          ):(
            <span style={{fontSize:12,color:"#64748b",background:"#1e293b",padding:"6px 14px",borderRadius:8,border:"1px solid #334155"}}>👁 View only</span>
          )}
          {savedIndicator&&<span style={{color:"#22c55e",fontSize:13,fontWeight:600}}>✓ Saved!</span>}
        </div>
      </div>

      {/* ERROR */}
      {error&&<div style={{background:"#450a0a",border:"1px solid #ef4444",color:"#fca5a5",padding:"10px 24px",fontSize:13}}>⚠️ {error}</div>}

      {/* TABLE */}
      {loading?(
        <div style={{display:"flex",justifyContent:"center",padding:80,color:"#64748b",fontSize:15}}>⏳ Loading Grade {selectedGrade}{selectedClass}…</div>
      ):allSubjects.length===0?(
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:60,color:"#64748b",gap:10}}>
          <span style={{fontSize:36}}>📚</span>
          <p style={{fontSize:15,margin:0}}>No subjects configured for Grade {selectedGrade}{selectedClass}.</p>
          <p style={{fontSize:12,margin:0,color:"#334155"}}>Go to <strong style={{color:"#60a5fa"}}>Subjects</strong> tab and assign subjects to this class.</p>
        </div>
      ):students.length===0?(
        <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"center",padding:60,color:"#64748b",gap:10}}>
          <span style={{fontSize:36}}>👥</span>
          <p style={{fontSize:15,margin:0}}>No students in Grade {selectedGrade}{selectedClass}.</p>
          <p style={{fontSize:12,margin:0,color:"#334155"}}>Go to <strong style={{color:"#60a5fa"}}>Students</strong> tab and assign students to this class.</p>
        </div>
      ):(
        <>
        <style>{`
            .marks-scroll::-webkit-scrollbar { width:0; height:0; }
            .marks-phantom-scroll::-webkit-scrollbar { height:12px; }
            .marks-phantom-scroll::-webkit-scrollbar-track { background:#0a0f1e; }
            .marks-phantom-scroll::-webkit-scrollbar-thumb { background:#475569; border-radius:4px; }
            .marks-phantom-scroll::-webkit-scrollbar-thumb:hover { background:#64748b; }
          `}</style>
        <SyncedTable tableRef={tableScrollRef}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:900}}>
            <thead>
              <tr style={{background:"#1e3a5f",position:"sticky",top:0,zIndex:10}}>
                <th style={{...TH,width:36}}>
                  <input type="checkbox"
                    checked={displayStudents.length>0&&displayStudents.every(s=>selectedRows.has(s.id))}
                    onChange={e=>{
                      if(e.target.checked) setSelectedRows(new Set(displayStudents.map(s=>s.id)));
                      else setSelectedRows(new Set());
                    }}
                    style={{cursor:"pointer",accentColor:"#3b82f6"}}/>
                </th>
                <th style={TH}>#</th>
                <th style={TH}>Adm. No</th>
                <th style={{...TH,minWidth:150}}>Name</th>
                <th style={TH}>M/F</th>
                {allSubjects.map(s=>{
                  const editable=canEditSubject(s);
                  return(
                    <th key={s.id} style={{...TH,minWidth:70,fontSize:11,lineHeight:1.3,opacity:editable?1:0.45,borderBottom:editable?"2px solid #3b82f6":"2px solid #334155"}}>
                      {s.label}
                      <div style={{fontSize:10,color:"#64748b",fontWeight:400}}>({s.code})</div>
                      {!editable&&<div style={{fontSize:9,color:"#475569"}}>🔒</div>}
                    </th>
                  );
                })}
                <th style={{...TH,background:"#1a3052"}}>Total</th>
                <th style={{...TH,background:"#1a3052"}}>Avg</th>
                <th style={{...TH,background:"#1a3052"}}>Rank</th>
              </tr>
            </thead>
            <tbody>
              {displayStudents.map((student,si)=>{
                const total=calcTotal(student), avg=calcAvg(student), rank=rankedMap[student.id];
                return(
                  <tr key={student.id} style={{background:selectedRows.has(student.id)?"#1a2f4a":si%2===0?"#0f172a":"#111827"}}
                    onMouseEnter={e=>{if(!selectedRows.has(student.id))e.currentTarget.style.background="#162033";}}
                    onMouseLeave={e=>{e.currentTarget.style.background=selectedRows.has(student.id)?"#1a2f4a":si%2===0?"#0f172a":"#111827";}}>
                    <td style={{...TD,width:36}}>
                      <input type="checkbox" checked={selectedRows.has(student.id)}
                        onChange={e=>{const n=new Set(selectedRows);e.target.checked?n.add(student.id):n.delete(student.id);setSelectedRows(n);}}
                        style={{cursor:"pointer",accentColor:"#3b82f6"}}/>
                    </td>
                    <td style={TD}><span style={{color:"#64748b"}}>{si+1}</span></td>
                    <td style={{...TD,color:"#94a3b8",fontFamily:"monospace"}}>{student.admNo}</td>
                    <td style={{...TD,fontWeight:500,color:"#e2e8f0"}}>{student.name}</td>
                    <td style={{...TD,color:student.gender==="M"?"#60a5fa":"#f472b6"}}>{student.gender}</td>
                    {allSubjects.map((sub,subi)=>{
                      const val=student.marks[sub.id]||"", gp=val?gradePoint(val):"";
                      const editable=canEditSubject(sub);
                      return(
                        <td key={sub.id} style={{...TD,padding:"4px 6px",opacity:editable?1:0.4}}>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                            <input
                              ref={el=>{if(el)inputRefs.current[`${si}-${subi}`]=el;}}
                              value={val}
                              onChange={e=>editable&&handleMarkChange(student.id,sub.id,e.target.value)}
                              onKeyDown={e=>handleKeyDown(e,si,subi)}
                              placeholder="—" maxLength={3} readOnly={!editable}
                              style={{width:52,textAlign:"center",padding:"4px 0",background:"transparent",border:"none",
                                borderBottom:`2px solid ${val?(gp==="W"?"#ef4444":"#334155"):"#1e3a5f"}`,
                                color:val?gradeColor(gp):"#475569",fontSize:14,fontWeight:600,outline:"none",
                                cursor:editable?"text":"default"}}
                              onFocus={e=>editable&&(e.target.style.borderBottomColor="#3b82f6")}
                              onBlur={e=>e.target.style.borderBottomColor=val?"#334155":"#1e3a5f"}
                            />
                            {gp&&<span style={{fontSize:10,fontWeight:700,color:gradeColor(gp)}}>{gp}</span>}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{...TD,fontWeight:700,color:"#f1f5f9",background:"#0d1f35"}}>{total||"—"}</td>
                    <td style={{...TD,color:"#94a3b8",background:"#0d1f35"}}>{total?avg:"—"}</td>
                    <td style={{...TD,background:"#0d1f35"}}>
                      {total?<span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,fontSize:12,fontWeight:700,
                        background:rank===1?"#fbbf24":rank<=3?"#6366f1":rank<=10?"#0f4c81":"#1e293b",
                        color:rank<=3?"#fff":"#94a3b8"}}>{rank}</span>:"—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{background:"#1e3a5f",fontWeight:700,borderTop:"2px solid #3b82f6"}}>
                <td colSpan={4} style={{...TD,color:"#94a3b8",fontSize:12}}>
                  Grade {selectedGrade}{selectedClass} · {students.length} Students · {selectedExam} {academicYear}
                </td>
                {allSubjects.map(sub=>{
                  const vals=students.map(s=>s.marks[sub.id]).filter(v=>v&&v!=="ab"&&!isNaN(Number(v))).map(Number);
                  const avg=vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):"—";
                  return <td key={sub.id} style={{...TD,color:"#60a5fa",textAlign:"center",fontSize:12}}>{avg}</td>;
                })}
                <td style={TD}/><td style={TD}/><td style={TD}/>
              </tr>
            </tfoot>
          </table>
        </SyncedTable>
        </>
      )}

      {/* Grade legend moved to top of page */}

      {/* ── CSV Import Modal ─────────────────────────────────────────────── */}
      {csvImportModal && csvPreview && (
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}}
          onClick={()=>{ setCsvImportModal(false); setCsvPreview(null); }}>
          <div style={{background:"#0d1829",border:"1px solid #1e3a5f",borderRadius:16,width:"100%",maxWidth:580,maxHeight:"85vh",display:"flex",flexDirection:"column",boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}
            onClick={e=>e.stopPropagation()}>

            {/* Modal header */}
            <div style={{padding:"18px 22px 14px",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#f1f5f9"}}>⬆ CSV Import Preview</h3>
                <p style={{margin:"3px 0 0",fontSize:12,color:"#64748b"}}>
                  Grade {selectedGrade}{selectedClass} · {selectedExam||"term"} · {academicYear}
                </p>
              </div>
              <button onClick={()=>{ setCsvImportModal(false); setCsvPreview(null); }}
                style={{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:20,lineHeight:1,padding:4}}>✕</button>
            </div>

            {/* Stats bar */}
            <div style={{padding:"12px 22px",borderBottom:"1px solid #1e293b",display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
              <span style={{fontSize:13,color:csvPreview.matched>0?"#4ade80":"#64748b",background:csvPreview.matched>0?"#0f3d2e":"#1e293b",padding:"4px 12px",borderRadius:20,fontWeight:600}}>
                ✓ {csvPreview.matched} student{csvPreview.matched!==1?"s":""} matched
              </span>
              {csvPreview.matched > 0 && (
                <span style={{fontSize:13,color:"#60a5fa",background:"#1e3a5f",padding:"4px 12px",borderRadius:20,fontWeight:600}}>
                  {csvPreview.rows.reduce((acc,r)=>acc+Object.keys(r.marks).length,0)} marks to import
                </span>
              )}
              {csvPreview.errors.length > 0 && (
                <span style={{fontSize:13,color:"#fb923c",background:"#431407",padding:"4px 12px",borderRadius:20,fontWeight:600}}>
                  ⚠ {csvPreview.errors.length} issue{csvPreview.errors.length!==1?"s":""}
                </span>
              )}
            </div>

            {/* Scrollable body */}
            <div style={{flex:1,overflowY:"auto",padding:"16px 22px",display:"flex",flexDirection:"column",gap:14}}>

              {/* Wrong-file hint banner */}
              {csvPreview.hint === "use_template" && (
                <div style={{background:"#0c1f3a",border:"1px solid #2563eb55",borderRadius:12,padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:22}}>💡</span>
                    <span style={{fontSize:14,fontWeight:700,color:"#93c5fd"}}>Wrong CSV format</span>
                  </div>
                  <p style={{margin:0,fontSize:13,color:"#94a3b8",lineHeight:1.6}}>
                    This looks like a <strong style={{color:"#e2e8f0"}}>student list CSV</strong>, not a marks CSV.
                    The marks CSV needs subject codes as column headers.
                  </p>
                  <div style={{background:"#0a1525",borderRadius:8,padding:"10px 12px",fontSize:12,fontFamily:"monospace",color:"#64748b",lineHeight:1.8}}>
                    <span style={{color:"#60a5fa"}}>adm_no</span>,<span style={{color:"#60a5fa"}}>name</span>
                    {allSubjects.length>0 && allSubjects.slice(0,4).map(s=>(
                      <span key={s.id}>,<span style={{color:"#4ade80"}}>{s.code}</span></span>
                    ))}
                    {allSubjects.length>4&&<span style={{color:"#475569"}}>…</span>}
                    <br/>
                    <span style={{color:"#94a3b8"}}>10000,AGMM Wijerathna</span>
                    {allSubjects.length>0 && allSubjects.slice(0,4).map(s=>(
                      <span key={s.id} style={{color:"#fbbf24"}}>,85</span>
                    ))}
                  </div>
                  <button onClick={()=>{ setCsvImportModal(false); setCsvPreview(null); downloadExampleCsv(); }}
                    style={{alignSelf:"flex-start",padding:"8px 16px",borderRadius:8,background:"#16a34a",border:"none",color:"#fff",
                      cursor:"pointer",fontWeight:700,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                    ⬇ Download Marks Template for Grade {selectedGrade}{selectedClass}
                  </button>
                </div>
              )}

              {/* Issues / warnings list */}
              {csvPreview.errors.length > 0 && csvPreview.hint !== "use_template" && (
                <div style={{background:"#1c0f05",border:"1px solid #78350f",borderRadius:10,padding:"12px 14px"}}>
                  <p style={{margin:"0 0 8px",fontSize:12,fontWeight:700,color:"#fb923c"}}>
                    ⚠ Issues ({csvPreview.errors.length}):
                  </p>
                  <ul style={{margin:0,padding:"0 0 0 16px",display:"flex",flexDirection:"column",gap:4}}>
                    {csvPreview.errors.map((e,i)=>(
                      <li key={i} style={{fontSize:12,color:"#fdba74",lineHeight:1.5}}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Preview table */}
              {csvPreview.rows.length === 0 && csvPreview.hint !== "use_template" ? (
                <div style={{textAlign:"center",padding:"24px 0",color:"#64748b"}}>
                  <p style={{fontSize:32,margin:"0 0 8px"}}>📭</p>
                  <p style={{fontSize:14,margin:0,color:"#475569"}}>No valid rows to import.</p>
                  <p style={{fontSize:12,marginTop:6,color:"#334155",lineHeight:1.6}}>
                    Make sure <code style={{color:"#60a5fa",background:"#0f172a",padding:"1px 5px",borderRadius:4}}>adm_no</code> or <code style={{color:"#60a5fa",background:"#0f172a",padding:"1px 5px",borderRadius:4}}>rollno</code> values match existing students,<br/>
                    and column headers match subject codes for this class.
                  </p>
                </div>
              ) : csvPreview.rows.length > 0 ? (
                <div style={{overflowX:"auto",borderRadius:10,border:"1px solid #1e293b"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                    <thead>
                      <tr style={{background:"#1e293b"}}>
                        <th style={{padding:"8px 10px",textAlign:"left",color:"#94a3b8",fontWeight:600,borderBottom:"1px solid #334155",whiteSpace:"nowrap"}}>Adm No</th>
                        <th style={{padding:"8px 10px",textAlign:"left",color:"#94a3b8",fontWeight:600,borderBottom:"1px solid #334155",whiteSpace:"nowrap"}}>Name</th>
                        {allSubjects.filter(s => csvPreview.rows.some(r => s.id in r.marks)).map(s=>(
                          <th key={s.id} style={{padding:"8px 8px",textAlign:"center",color:"#4ade80",fontWeight:700,borderBottom:"1px solid #334155",whiteSpace:"nowrap"}}>
                            {s.code}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.rows.map(({student,marks},ri)=>(
                        <tr key={ri} style={{background:ri%2===0?"#0a1020":"#0d1424",borderBottom:"1px solid #1e293b"}}>
                          <td style={{padding:"6px 10px",color:"#94a3b8",fontFamily:"monospace"}}>{student.admNo}</td>
                          <td style={{padding:"6px 10px",color:"#e2e8f0",fontWeight:500,whiteSpace:"nowrap"}}>{student.name}</td>
                          {allSubjects.filter(s => csvPreview.rows.some(r => s.id in r.marks)).map(s=>{
                            const v = marks[s.id];
                            const gp = v ? gradePoint(v) : "";
                            return(
                              <td key={s.id} style={{padding:"6px 8px",textAlign:"center"}}>
                                {v !== undefined ? (
                                  <span style={{fontWeight:700,color:gradeColor(gp||"-"),fontSize:13}}>
                                    {v==="ab"?"AB":v}
                                    {gp&&gp!=="AB"&&<span style={{fontSize:10,marginLeft:3,opacity:0.7}}>{gp}</span>}
                                  </span>
                                ) : <span style={{color:"#334155"}}>—</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>

            {/* Footer actions */}
            <div style={{padding:"14px 22px",borderTop:"1px solid #1e293b",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>{ setCsvImportModal(false); setCsvPreview(null); }}
                style={{padding:"8px 20px",borderRadius:8,background:"transparent",border:"1px solid #334155",color:"#64748b",cursor:"pointer",fontWeight:600,fontSize:13}}>
                {csvPreview.hint==="use_template" ? "Close" : "Cancel"}
              </button>
              {csvPreview.hint !== "use_template" && (
                <button
                  onClick={applyCsvImport}
                  disabled={csvApplying || csvPreview.rows.length === 0}
                  style={{padding:"8px 24px",borderRadius:8,background:csvApplying||csvPreview.rows.length===0?"#1e3a5f":"#2563eb",
                    color:"#fff",border:"none",cursor:csvApplying||csvPreview.rows.length===0?"not-allowed":"pointer",
                    fontWeight:700,fontSize:13,opacity:csvPreview.rows.length===0?0.5:1}}>
                  {csvApplying ? "⏳ Applying…" : `✓ Apply ${csvPreview.matched} Student${csvPreview.matched!==1?"s":""}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CSV Destination Modal ─────────────────────────────────────────── */}
      {csvDestModal && (
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}}
          onClick={()=>{setCsvDestModal(false);setPendingCsvFile(null);}}>
          <div style={{background:"#0d1829",border:"1px solid #1e3a5f",borderRadius:16,width:"100%",maxWidth:420,boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #1e293b"}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#f1f5f9"}}>📂 Import CSV — Where to save?</h3>
              <p style={{margin:"6px 0 0",fontSize:12,color:"#64748b"}}>Choose the destination before importing marks from this file.</p>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:12}}>
              <button onClick={()=>{ setExamMode("monthly"); proceedCsvWithDest(); }}
                style={{padding:"14px 18px",borderRadius:10,border:"2px solid #2563eb44",background:"#1d3461",color:"#f1f5f9",cursor:"pointer",textAlign:"left"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#2563eb"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#2563eb44"}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>📆 Monthly Test</div>
                <div style={{fontSize:12,color:"#60a5fa"}}>Saves to: <strong>{(()=>{const [y,m]=selectedMonth.split("-");return `${new Date(Number(y),Number(m)-1,1).toLocaleString("default",{month:"long"})} ${y}`;})()}</strong></div>
                <div style={{fontSize:11,color:"#475569",marginTop:3}}>Uses current month picker selection</div>
              </button>
              <button onClick={()=>{ setExamMode("exam"); proceedCsvWithDest(); }}
                style={{padding:"14px 18px",borderRadius:10,border:"2px solid #7c3aed44",background:"#1a1040",color:"#f1f5f9",cursor:"pointer",textAlign:"left"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#7c3aed"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#7c3aed44"}>
                <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>📝 Exam</div>
                <div style={{fontSize:12,color:"#a78bfa"}}>Saves to: <strong>{exams.find(e=>e.id===selectedExamId)?.name||"— select an exam after import —"}</strong></div>
                <div style={{fontSize:11,color:"#475569",marginTop:3}}>Uses currently selected exam</div>
              </button>
            </div>
            <div style={{padding:"0 24px 20px",display:"flex",justifyContent:"flex-end"}}>
              <button onClick={()=>{setCsvDestModal(false);setPendingCsvFile(null);}}
                style={{padding:"7px 18px",borderRadius:8,background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",cursor:"pointer",fontSize:13}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Move Marks Modal ──────────────────────────────────────────────── */}
      {moveModal && (
        <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(4px)"}}
          onClick={()=>setMoveModal(false)}>
          <div style={{background:"#0d1829",border:"1px solid #1e3a5f",borderRadius:16,width:"100%",maxWidth:480,boxShadow:"0 25px 60px rgba(0,0,0,0.7)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 14px",borderBottom:"1px solid #1e293b"}}>
              <h3 style={{margin:0,fontSize:17,fontWeight:700,color:"#f1f5f9"}}>↗ Move Marks</h3>
              <p style={{margin:"5px 0 0",fontSize:12,color:"#64748b"}}>
                Copy marks for <strong style={{color:"#60a5fa"}}>{selectedRows.size} student{selectedRows.size!==1?"s":""}</strong> to a different class or subject.
              </p>
            </div>
            <div style={{padding:"20px 24px",display:"flex",flexDirection:"column",gap:14}}>
              <div>
                <label style={{fontSize:12,color:"#94a3b8",display:"block",marginBottom:5,fontWeight:600}}>DESTINATION CLASS</label>
                <div style={{display:"flex",gap:8}}>
                  <select value={moveDest.grade} onChange={e=>setMoveDest(d=>({...d,grade:e.target.value,section:""}))}
                    style={{flex:1,padding:"8px 10px",borderRadius:8,background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",fontSize:13}}>
                    <option value="">— Grade —</option>
                    {[...new Set((state?.classes||[]).map(c=>String(c.name).replace(/[^0-9]/g,"")))].filter(Boolean).sort((a,b)=>+a-+b).map(g=>(
                      <option key={g} value={g}>Grade {g}</option>
                    ))}
                  </select>
                  <select value={moveDest.section} onChange={e=>setMoveDest(d=>({...d,section:e.target.value}))}
                    style={{flex:1,padding:"8px 10px",borderRadius:8,background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",fontSize:13}}>
                    <option value="">— Section —</option>
                    {(state?.classes||[]).filter(c=>String(c.name).replace(/[^0-9]/g,"")===(moveDest.grade||selectedGrade)).map(c=>(
                      <option key={c.id} value={c.section}>{c.section}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{fontSize:12,color:"#94a3b8",display:"block",marginBottom:5,fontWeight:600}}>DESTINATION SUBJECT <span style={{color:"#475569",fontWeight:400}}>(optional)</span></label>
                <select value={moveDest.subjectId} onChange={e=>setMoveDest(d=>({...d,subjectId:e.target.value}))}
                  style={{width:"100%",padding:"8px 10px",borderRadius:8,background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",fontSize:13}}>
                  <option value="">— Keep same subjects —</option>
                  {(()=>{
                    const destClass=(state?.classes||[]).find(c=>String(c.name).replace(/[^0-9]/g,"")===(moveDest.grade||selectedGrade)&&c.section===(moveDest.section||selectedClass));
                    if(!destClass) return null;
                    return (state?.subjects||[]).filter(s=>s.classIds.includes(destClass.id)).map(s=>(
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ));
                  })()}
                </select>
              </div>
              <div style={{background:"#1e293b",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#64748b"}}>
                ℹ️ Marks will be <strong style={{color:"#f1f5f9"}}>copied</strong> to the destination. Original marks are preserved. Students are matched by name or admission number.
              </div>
            </div>
            <div style={{padding:"0 24px 20px",display:"flex",gap:10,justifyContent:"flex-end"}}>
              <button onClick={()=>setMoveModal(false)}
                style={{padding:"8px 18px",borderRadius:8,background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",cursor:"pointer",fontSize:13}}>
                Cancel
              </button>
              <button onClick={()=>{
                const destGrade=moveDest.grade||selectedGrade;
                const destSection=moveDest.section||selectedClass;
                const destClass=(state?.classes||[]).find(c=>String(c.name).replace(/[^0-9]/g,"")===(destGrade)&&c.section===destSection);
                if(!destClass){alert("Destination class not found.");return;}
                const destStudents=(state?.students||[]).filter(s=>s.classId===destClass.id);
                if(!destStudents.length){alert("No students in destination class.");return;}
                const selectedStudentsList=students.filter(s=>selectedRows.has(s.id));
                let moved=0;
                if(examMode==="exam"&&selectedExamId){
                  const newRecs=[];
                  selectedStudentsList.forEach(src=>{
                    const dest=destStudents.find(d=>d.name===src.name||(d.rollNo&&d.rollNo===src.admNo));
                    if(!dest) return;
                    allSubjects.forEach(sub=>{
                      const val=src.marks[sub.id];
                      if(!val||val==="") return;
                      const targetSubId=moveDest.subjectId||sub.id;
                      newRecs.push({id:`${selectedExamId}_${dest.id}_${targetSubId}`,examId:selectedExamId,studentId:dest.id,subjectId:targetSubId,marks:Number(val)||0});
                    });
                    moved++;
                  });
                  if(newRecs.length) setState(s=>({...s,examRecords:[...s.examRecords.filter(r=>!newRecs.some(n=>n.id===r.id)),...newRecs]}));
                } else {
                  const monthPrefix=`monthly_${selectedMonth}_`;
                  setState(s=>({...s,students:s.students.map(dest=>{
                    if(dest.classId!==destClass.id) return dest;
                    const src=selectedStudentsList.find(x=>x.name===dest.name||(dest.rollNo&&dest.rollNo===x.admNo));
                    if(!src) return dest;
                    moved++;
                    const updMarks={...dest.marks};
                    allSubjects.forEach(sub=>{
                      const val=src.marks[sub.id];
                      if(!val||val==="") return;
                      const targetSubId=moveDest.subjectId||sub.id;
                      updMarks[monthPrefix+targetSubId]=Number(val)||0;
                    });
                    return {...dest,marks:updMarks};
                  })}));
                }
                setMoveModal(false);
                setSelectedRows(new Set());
                setMoveDest({grade:"",section:"",subjectId:""});
                alert(`✓ Marks copied for ${moved} student(s) to Grade ${destGrade}${destSection}.`);
              }}
                style={{padding:"8px 20px",borderRadius:8,background:"#16a34a",border:"none",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13}}>
                ↗ Move Marks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TH={padding:"10px 8px",textAlign:"center",color:"#94a3b8",fontWeight:600,fontSize:12,borderBottom:"2px solid #334155",whiteSpace:"nowrap",letterSpacing:"0.3px"};
const TD={padding:"6px 8px",textAlign:"center",borderBottom:"1px solid #1e293b",color:"#e2e8f0"};