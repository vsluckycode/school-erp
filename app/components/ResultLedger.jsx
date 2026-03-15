"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, RadarChart,
  Radar, PolarGrid, PolarAngleAxis,
} from "recharts";

// ─── Export helpers ────────────────────────────────────────────────────────────
function downloadCSV(rows, filename) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
}

function downloadExcel(rows, filename) {
  // Simple TSV renamed to .xls (opens in Excel)
  const tsv = rows.map(r => r.map(c => String(c ?? "")).join("\t")).join("\n");
  const blob = new Blob([tsv], { type: "application/vnd.ms-excel" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = filename; a.click();
}

// Safely resolve gender to "M" or "F" regardless of encryption
function safeGender(st) {
  const candidates = [st.gender, st.profile?.gender];
  for (const v of candidates) {
    if (!v) continue;
    const s = String(v).trim();
    if (s === "M" || s === "Male")   return "M";
    if (s === "F" || s === "Female") return "F";
    // might be encrypted — try to detect by length/base64 chars
    // if it contains = or is longer than 6 chars, it's likely encrypted — skip
  }
  return "M";
}

async function printToPDF(elementId, filename, pageSize = "A4") {
  const el = document.getElementById(elementId);
  if (!el) return;
  // Hide buttons inside the element before cloning
  const btnsToHide = el.querySelectorAll("button,[data-no-print]");
  btnsToHide.forEach(b => b.setAttribute("data-was-visible","1") && (b.style.display="none"));
  const clone = el.cloneNode(true);
  // Restore buttons on original
  btnsToHide.forEach(b => { b.style.display=""; b.removeAttribute("data-was-visible"); });

  clone.style.cssText = "background:#fff;color:#000;padding:12px 16px;font-family:sans-serif;";
  // Light-mode colours for print
  clone.querySelectorAll("*").forEach(node => {
    const col = node.style.color||"";
    if (col.includes("#fff")||col.includes("rgb(255")) node.style.color="#000";
    node.style.background=""; node.style.backgroundColor="";
    node.style.borderColor=node.style.borderColor?"#ccc":"";
  });
  // Remove any nested buttons in clone
  clone.querySelectorAll("button").forEach(b=>b.remove());

  const title = document.createElement("h2");
  title.textContent = filename.replace(/_/g," ").replace(".pdf","");
  title.style.cssText = "font-family:sans-serif;color:#000;padding:0 0 8px;margin:0 0 8px;font-size:13px;border-bottom:1px solid #ccc;";

  const wrap = document.createElement("div");
  wrap.id = elementId+"-print-wrap";
  wrap.style.cssText = "position:fixed;top:0;left:0;width:100%;z-index:99999;background:#fff;";
  wrap.appendChild(title);
  wrap.appendChild(clone);

  const style = document.createElement("style");
  // A4 portrait, scale content to fit width, hide everything except wrap
  style.textContent = `
    @media print {
      body > *:not(#${elementId}-print-wrap) { display:none!important; }
      #${elementId}-print-wrap { position:static!important; }
      @page { size: ${pageSize} portrait; margin:8mm; }
      table { font-size:9pt!important; border-collapse:collapse!important; width:100%!important; }
      td, th { padding:3px 5px!important; }
      button { display:none!important; }
      * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(wrap);
  window.print();
  setTimeout(() => {
    if (document.body.contains(wrap)) document.body.removeChild(wrap);
    if (document.head.contains(style)) document.head.removeChild(style);
  }, 1500);
}

// ─── Export button group ───────────────────────────────────────────────────────
function ExportBar({ sectionId, csvRows, filename, label }) {
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}>
      <span style={{fontSize:11,color:"#475569",fontWeight:600}}>Export {label}:</span>
      {[["A4 PDF","#3b82f6",()=>printToPDF(sectionId,filename+"-A4.pdf","A4")],
        ["A3 PDF","#7c3aed",()=>printToPDF(sectionId,filename+"-A3.pdf","A3")],
        ["CSV","#22c55e",()=>downloadCSV(csvRows,filename+".csv")],
        ["Excel","#f59e0b",()=>downloadExcel(csvRows,filename+".xls")],
      ].map(([lbl,col,fn])=>(
        <button key={lbl} onClick={fn}
          style={{padding:"4px 12px",borderRadius:6,border:`1px solid ${col}44`,
            background:col+"22",color:col,fontSize:11,fontWeight:600,cursor:"pointer",
            transition:"all 0.15s"}}>
          ⬇ {lbl}
        </button>
      ))}
    </div>
  );
}

// ─── Student Result Sheet with comparison ─────────────────────────────────────
function StudentResultSheet({ student, subjects, currentExamName, previousMarks, previousExamName, onClose }) {
  const subjectList = subjects.length > 0 ? subjects : Object.keys(student.marks);
  const currentData = subjectList.map(sub => ({
    subject: sub.length > 8 ? sub.slice(0, 8) + ".." : sub,
    current: student.marks[sub] === "ab" ? 0 : Number(student.marks[sub] || 0),
    previous: previousMarks?.[sub] === "ab" ? 0 : Number(previousMarks?.[sub] || 0),
    fullSub: sub,
  }));
  const hasComparison = previousMarks && Object.keys(previousMarks).length > 0;
  const currentTotal = currentData.reduce((s, d) => s + d.current, 0);
  const prevTotal = hasComparison ? currentData.reduce((s, d) => s + d.previous, 0) : null;
  const improvement = hasComparison ? currentTotal - prevTotal : null;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:1000,
      display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div id="student-result-sheet" style={{background:"#0f1e3d",borderRadius:16,
        maxWidth:900,width:"100%",maxHeight:"90vh",overflowY:"auto",
        border:"1px solid #1e3a6e",boxShadow:"0 20px 60px rgba(0,0,0,0.7)"}}>

        {/* Sheet header */}
        <div style={{background:"linear-gradient(135deg,#1e3a6e,#0f1e3d)",padding:"18px 24px",
          borderBottom:"1px solid #1e3a6e",borderRadius:"16px 16px 0 0",
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <h2 style={{margin:0,fontSize:18,fontWeight:800,color:"#f1f5f9"}}>{student.name}</h2>
            <p style={{margin:"4px 0 0",fontSize:12,color:"#475569"}}>
              Adm: {student.admNo} · {currentExamName || "Current Exam"} · Rank #{student.classRank}
            </p>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button data-no-print onClick={()=>printToPDF("student-result-sheet","Result_"+student.name,"A4")}
              style={{padding:"6px 14px",borderRadius:8,background:"#3b82f622",
                border:"1px solid #3b82f644",color:"#60a5fa",fontSize:12,cursor:"pointer",fontWeight:600}}>
              🖨 Print / PDF
            </button>
            <button data-no-print onClick={onClose}
              style={{padding:"6px 14px",borderRadius:8,background:"#ef444422",
                border:"1px solid #ef444444",color:"#ef4444",fontSize:12,cursor:"pointer",fontWeight:600}}>
              ✕ Close
            </button>
          </div>
        </div>

        <div style={{padding:"20px 24px"}}>
          {/* Summary cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:20}}>
            {[
              {label:"Total Marks",  value:currentTotal,                                  color:"#fbbf24", icon:"🏆"},
              {label:"Average",      value:(currentTotal/Math.max(subjectList.length,1)).toFixed(1), color:"#60a5fa", icon:"📊"},
              {label:"Class Rank",   value:"#"+student.classRank,                         color:"#a78bfa", icon:"🥇"},
              ...(hasComparison?[{label:"vs Previous", value:(improvement>0?"+":"")+improvement, color:improvement>=0?"#22c55e":"#ef4444", icon:improvement>=0?"📈":"📉"}]:[]),
            ].map(c=>(
              <div key={c.label} style={{background:"#0a142a",borderRadius:10,padding:"12px 14px",
                borderLeft:`3px solid ${c.color}`}}>
                <div style={{fontSize:18}}>{c.icon}</div>
                <div style={{fontSize:20,fontWeight:800,color:c.color}}>{c.value}</div>
                <div style={{fontSize:11,color:"#475569"}}>{c.label}</div>
              </div>
            ))}
          </div>

          {/* Marks table */}
          <div style={{overflowX:"auto",marginBottom:20}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#0a142a"}}>
                  <th style={shtTH}>Subject</th>
                  <th style={{...shtTH,color:"#fbbf24"}}>{currentExamName||"Current"}</th>
                  <th style={{...shtTH,color:"#fbbf24"}}>Grade</th>
                  {hasComparison&&<th style={{...shtTH,color:"#60a5fa"}}>{previousExamName||"Previous"}</th>}
                  {hasComparison&&<th style={{...shtTH,color:"#60a5fa"}}>Grade</th>}
                  {hasComparison&&<th style={{...shtTH,color:"#22c55e"}}>Change</th>}
                </tr>
              </thead>
              <tbody>
                {currentData.map((d,i)=>{
                  const cGP = gradePoint(student.marks[d.fullSub]);
                  const pGP = hasComparison ? gradePoint(previousMarks[d.fullSub]) : null;
                  const diff = hasComparison ? d.current - d.previous : null;
                  return (
                    <tr key={d.fullSub} style={{background:i%2===0?"#070e1c":"#0a1220"}}>
                      <td style={{...shtTD,textAlign:"left",paddingLeft:10,color:"#cbd5e1",fontWeight:500}}>{d.fullSub}</td>
                      <td style={{...shtTD,fontWeight:700,color:GRADE_COLORS[cGP]||"#e2e8f0"}}>
                        {student.marks[d.fullSub]??"—"}
                      </td>
                      <td style={{...shtTD,fontWeight:700,color:GRADE_COLORS[cGP]||"#64748b"}}>{cGP!=="-"?cGP:""}</td>
                      {hasComparison&&<td style={{...shtTD,color:GRADE_COLORS[pGP]||"#94a3b8"}}>{previousMarks[d.fullSub]??"—"}</td>}
                      {hasComparison&&<td style={{...shtTD,color:GRADE_COLORS[pGP]||"#64748b",fontWeight:700}}>{pGP!=="-"?pGP:""}</td>}
                      {hasComparison&&<td style={{...shtTD,fontWeight:700,color:diff>0?"#22c55e":diff<0?"#ef4444":"#64748b"}}>
                        {diff===null?"—":diff>0?"+"+diff:diff}
                      </td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Charts — side by side columns */}
          <div style={{display:"grid",gridTemplateColumns:hasComparison?"1fr 1fr":"1fr",gap:16}}>
            {/* Bar chart */}
            <div style={{background:"#0a142a",borderRadius:12,padding:16,border:"1px solid #1e3a6e"}}>
              <h3 style={{color:"#94a3b8",fontSize:13,margin:"0 0 12px"}}>
                {hasComparison?`📈 ${previousExamName} vs ${currentExamName}`:"📊 Marks by Subject"}
              </h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={currentData} margin={{left:-10,right:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e"/>
                  <XAxis dataKey="subject" tick={{fill:"#475569",fontSize:8}} interval={0} angle={-35} textAnchor="end" height={50}/>
                  <YAxis domain={[0,100]} tick={{fill:"#475569",fontSize:9}}/>
                  <Tooltip contentStyle={{background:"#0f1e3d",border:"1px solid #1e3a6e",color:"#e2e8f0",fontSize:11}}/>
                  <Legend wrapperStyle={{color:"#64748b",fontSize:11}}/>
                  {hasComparison&&<Bar dataKey="previous" name={previousExamName||"Previous"} fill="#3b82f6" radius={[3,3,0,0]}/>}
                  <Bar dataKey="current" name={currentExamName||"Current"} fill="#22c55e" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Radar chart */}
            <div style={{background:"#0a142a",borderRadius:12,padding:16,border:"1px solid #1e3a6e"}}>
              <h3 style={{color:"#94a3b8",fontSize:13,margin:"0 0 12px"}}>🕸 Performance Radar</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={currentData.slice(0,10)}>
                  <PolarGrid stroke="#1e3a6e"/>
                  <PolarAngleAxis dataKey="subject" tick={{fill:"#475569",fontSize:8}}/>
                  {hasComparison&&<Radar name={previousExamName||"Previous"} dataKey="previous" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2}/>}
                  <Radar name={currentExamName||"Current"} dataKey="current" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3}/>
                  <Legend wrapperStyle={{color:"#64748b",fontSize:11}}/>
                  <Tooltip contentStyle={{background:"#0f1e3d",border:"1px solid #1e3a6e",color:"#e2e8f0",fontSize:11}}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const shtTH={padding:"8px 10px",textAlign:"center",color:"#64748b",fontWeight:600,fontSize:11,borderBottom:"2px solid #1e3a6e",whiteSpace:"nowrap"};
const shtTD={padding:"6px 10px",textAlign:"center",borderBottom:"1px solid #0d1a2f",color:"#e2e8f0"};

// ─── A/L Streams (for UI badge display) ──────────────────────────────────────
const AL_STREAM_COLORS = {
  Science:"#22c55e", Maths:"#3b82f6", Commerce:"#f59e0b",
  Arts:"#a78bfa", Technology:"#f97316",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function gradePoint(mark) {
  if (mark==="ab"||mark==="") return "AB";
  const m=Number(mark); if(isNaN(m)) return "-";
  if(m>74) return "A"; if(m>64) return "B"; if(m>54) return "C";
  if(m>39) return "S"; if(m>0)  return "W"; return "-";
}
const RANGES=[
  {label:"0–34",  min:0,  max:34,  color:"#ef4444"},
  {label:"35–54", min:35, max:54,  color:"#f97316"},
  {label:"55–64", min:55, max:64,  color:"#eab308"},
  {label:"65–74", min:65, max:74,  color:"#84cc16"},
  {label:"75–100",min:75, max:100, color:"#22c55e"},
];
const PIE_COLORS  =["#22c55e","#84cc16","#eab308","#f97316","#ef4444"];
const GRADE_COLORS={A:"#22c55e",B:"#84cc16",C:"#eab308",S:"#f97316",W:"#ef4444",AB:"#a78bfa"};

function computeSubjectSummary(students,subject){
  const vals=students.map(s=>{const v=s.marks[subject];return v==="ab"?null:Number(v);})
    .filter(v=>v!==null&&!isNaN(v));
  const total=vals.length;
  const pass=vals.filter(v=>v>34).length;
  const avg=total>0?(vals.reduce((a,b)=>a+b,0)/total).toFixed(1):"—";
  return{subject,total,pass,avg,
    highest:total>0?Math.max(...vals):"—",
    lowest: total>0?Math.min(...vals):"—",
    passPercent:total>0?((pass/total)*100).toFixed(1):"0",
    rangeCounts:RANGES.map(r=>({...r,count:vals.filter(v=>v>=r.min&&v<=r.max).length})),
  };
}

function evaluateOLCriteria(students){
  // Find a subject entry whose name matches any of the given keywords
  const findSub=(results,keywords)=>results.find(r=>
    keywords.some(kw=>r.sub.toLowerCase().replace(/[\s_-]/g,"").includes(kw))
  );

  return students.map(s=>{
    const results=Object.entries(s.marks)
      .filter(([,v])=>v!==undefined&&v!=="")
      .map(([sub,mark])=>({
        sub,
        mark: mark==="ab"?0:Number(mark)||0,
        grade:gradePoint(mark),
      }));

    // Match "Sinhala", "Sinhala Language", etc.
    const sinEntry  = findSub(results,["sinhala"]);
    // Match "Maths", "Mathematics", "Math"
    const mathEntry = findSub(results,["math","maths","mathematics"]);

    // Pass = not W and not AB and mark > 0 (S=40–54 counts as pass)
    const FAIL_GRADES=["W","AB","-"];
    const passed = results.filter(r=>!FAIL_GRADES.includes(r.grade)&&r.mark>0);
    const credits= results.filter(r=>["A","B","C"].includes(r.grade));
    const total  = results.length; // total entered subjects

    const sinPass  = sinEntry  ? !FAIL_GRADES.includes(sinEntry.grade)  && sinEntry.mark>0  : false;
    const mathPass = mathEntry ? !FAIL_GRADES.includes(mathEntry.grade) && mathEntry.mark>0 : false;

    // Pass threshold — use actual subject count, min 3, cap check at 5
    // e.g. if only 3 subjects configured: need 3+ passes; if 9 subjects: need 5+ passes
    const passThreshold = Math.min(5, Math.max(3, total));
    const creditThreshold= Math.min(3, Math.max(1, Math.floor(total*0.4)));

    return{...s,
      sinLabel:  sinEntry?.sub  || "Sinhala",
      mathLabel: mathEntry?.sub || "Maths",
      sinMark:   sinEntry?.mark,
      mathMark:  mathEntry?.mark,
      sinGrade:  sinEntry?.grade  || "-",
      mathGrade: mathEntry?.grade || "-",
      sinPass, mathPass,
      passedCount: passed.length,
      creditCount: credits.length,
      pass5WithCredit3: passed.length>=passThreshold && credits.length>=creditThreshold,
      pass6WithSinMath: sinPass && mathPass && credits.length>=creditThreshold,
      // These cards only check sin/math pass status — no subject count requirement
      pass5SinNoMath:   sinPass && !mathPass,
      pass5MathNoSin:   mathPass && !sinPass,
      fail5Plus:        passed.length<passThreshold,
      olStatus: passed.length>=passThreshold && credits.length>=creditThreshold ? "PASS" : "FAIL",
    };
  });
}

// A/L grade: uses Z-score style (A=3,B=2,C=1,S=0) — simplified pass/fail by subject
function evaluateALCriteria(students){
  return students.map(s=>{
    const results=Object.entries(s.marks).map(([sub,mark])=>({
      sub,grade:gradePoint(mark),
    }));
    const credits=results.filter(r=>["A","B","C"].includes(r.grade));
    const passes =results.filter(r=>["A","B","C","S"].includes(r.grade));
    return{...s,
      alCredits:credits.length,
      alPasses: passes.length,
      alStatus: passes.length>=3?"QUALIFY":"NOT QUALIFY",
    };
  });
}

function generateDemo(n,isOL,isAL){
  const subs=isAL
    ?["Gen English","Gen IT","Physics","Chemistry","Comb Maths"]
    :isOL
    ?["Sinhala","Religion","English","Maths","History","Science","Basket1","Basket2","Basket3"]
    :["Sinhala","Religion","English","Maths","Science","History","Geography","Civics","2nd Lang","Health","PTS","Aesthetic","ICT"];
  return Array.from({length:n},(_,i)=>{
    const marks={};
    subs.forEach(s=>{const r=Math.random();marks[s]=r<0.05?"ab":Math.floor(Math.random()*95+5);});
    const total=Object.values(marks).reduce((sum,v)=>sum+(v==="ab"?0:Number(v)),0);
    return{id:i+1,admNo:`2026${String(i+1).padStart(4,"0")}`,
      name:`Student ${String.fromCharCode(65+i%26)}${i+1}`,
      gender:i%2===0?"M":"F",marks,total};
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Props:
//   db    – sb Supabase REST client
//   user  – LoggedInUser { role, id, name }
//   state – AppState from page.tsx (live subjects, students, classes, exams, examRecords)
// ── SyncedTable: scrollbar ABOVE content, thead sticky ─────────────────────
function SyncedTableRL({ children, tableRef }) {
  const phantomRef = React.useRef(null);
  React.useEffect(() => {
    const wrap = tableRef?.current;
    const ph   = phantomRef?.current;
    if (!wrap || !ph) return;
    function syncW() { if(ph.firstChild) ph.firstChild.style.width = wrap.scrollWidth+"px"; }
    syncW();
    let lockT=false, lockP=false;
    function onWrap() { if(lockP) return; lockT=true; ph.scrollLeft=wrap.scrollLeft; lockT=false; }
    function onPh()   { if(lockT) return; lockP=true; wrap.scrollLeft=ph.scrollLeft; lockP=false; }
    wrap.addEventListener("scroll",onWrap);
    ph.addEventListener("scroll",onPh);
    const ro=new ResizeObserver(syncW); ro.observe(wrap);
    return ()=>{ wrap.removeEventListener("scroll",onWrap); ph.removeEventListener("scroll",onPh); ro.disconnect(); };
  },[tableRef]);
  return (
    <div style={{display:"flex",flexDirection:"column"}}>
      <div style={{background:"#060c1a",borderBottom:"1px solid #0f1e3d",flexShrink:0}}>
        <div ref={phantomRef} className="ledger-phantom-scroll"
          style={{overflowX:"scroll",overflowY:"hidden",height:12,
                  scrollbarWidth:"thin",scrollbarColor:"#1e3a6e #060c1a"}}>
          <div style={{height:1}}/>
        </div>
      </div>
      <div ref={tableRef} className="ledger-hidden-scroll"
        style={{overflowX:"scroll",overflowY:"auto",
                maxHeight:"calc(100vh - 360px)",
                scrollbarWidth:"thin",
                scrollbarColor:"#1e3a6e #060c1a"}}>
        {children}
      </div>
    </div>
  );
}


/**
 * @param {{ db: any, user: any, state: any, setState: any }} props
 */
export default function ResultLedger({ db, user, state, setState }) {
  const [selGrade,  setSelGrade]  = useState("6");
  const [selClass,  setSelClass]  = useState("All");
  const [selExamId, setSelExamId] = useState("");
  const [year]                    = useState(String(new Date().getFullYear()));
  const [viewMode,  setViewMode]  = useState("ledger");
  const [rawStudents,setRawStudents]=useState([]);
  const [liveSubjectNames,setLiveSubjectNames]=useState([]);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  // Student result sheet state
  const [sheetStudent,  setSheetStudent]  = useState(null);
  const [previousMarks, setPreviousMarks] = useState({});
  const [previousExamName, setPrevExamName] = useState("");

  const isMiddle=["6","7","8","9"].includes(selGrade);
  const isOL=selGrade==="10"||selGrade==="11";
  const isAL=selGrade==="12"||selGrade==="13";

  // All exams live from state.exams (auto-refreshes when admin creates exam)
  const allExams=useMemo(()=>[...(state?.exams||[])].sort((a,b)=>b.year-a.year||0),[state?.exams]);
  const selExam =allExams.find(e=>e.id===selExamId)||null;

  // Resolve previous exam for comparison
  const ledgerScrollRef = React.useRef(null);

  const prevExam = useMemo(()=>{
    if(!selExamId||allExams.length<2) return null;
    const idx=allExams.findIndex(e=>e.id===selExamId);
    return idx>=0&&idx+1<allExams.length?allExams[idx+1]:null;
  },[allExams,selExamId]);

  function openStudentSheet(student){
    setSheetStudent(student);
    // Build previous marks from examRecords
    if(prevExam){
      const pMarks={};
      (state?.examRecords||[]).filter(r=>r.examId===prevExam.id&&r.studentId===student.id).forEach(r=>{
        const sub=(state?.subjects||[]).find(s=>s.id===r.subjectId);
        const key=sub?sub.name:r.subjectId;
        pMarks[key]=String(r.marks);
      });
      setPreviousMarks(pMarks);
      setPrevExamName(prevExam.name+" ("+prevExam.year+")");
    } else {
      setPreviousMarks({});
      setPrevExamName("");
    }
  }

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(()=>{
    async function load(){
      setLoading(true); setError("");
      try{
        const grade=parseInt(selGrade);

        // ── Subjects: from state for matching classes ──
        let subNames=[];
        const matchingClasses=(state?.classes||[]).filter(c=>{
          const cGrade=parseInt(c.name);
          return cGrade===grade&&(selClass==="All"||c.section===selClass);
        });
        const classIds=matchingClasses.map(c=>c.id);
        const stateSubs=(state?.subjects||[]).filter(s=>s.classIds?.some(cid=>classIds.includes(cid)));
        if(stateSubs.length>0) subNames=stateSubs.map(s=>s.name);
        setLiveSubjectNames(subNames);

        // ── Students: state-first ──
        let stuList=[];
        if((state?.students||[]).length>0&&classIds.length>0){
          stuList=(state.students||[]).filter(s=>classIds.includes(s.classId));
        } else if(db?.isConfigured?.()){
          let q=`grade=eq.${selGrade}&order=adm_no.asc`;
          if(selClass!=="All") q+=`&class=eq.${selClass}`;
          stuList=await db.select("students",q);
        }

        // ── Marks ──
        let marksMap={};

        if(selExamId){
          // From examRecords in state — fully live
          (state?.examRecords||[])
            .filter(r=>r.examId===selExamId)
            .forEach(r=>{
              if(!marksMap[r.studentId]) marksMap[r.studentId]={};
              // Resolve subject name
              const sub=(state?.subjects||[]).find(s=>s.id===r.subjectId);
              const key=sub?sub.name:r.subjectId;
              marksMap[r.studentId][key]=String(r.marks);
            });
          // Also use current student.marks (legacy fallback keyed by subjectId)
          stuList.forEach(st=>{
            if(!marksMap[st.id]) marksMap[st.id]={};
            if(st.marks) Object.entries(st.marks).forEach(([subId,v])=>{
              const sub=(state?.subjects||[]).find(s=>s.id===subId);
              const key=sub?sub.name:subId;
              if(!marksMap[st.id][key]) marksMap[st.id][key]=String(v);
            });
          });
        } else if(db?.isConfigured?.()){
          let q=`grade=eq.${selGrade}&academic_year=eq.${year}`;
          if(selClass!=="All") q+=`&class=eq.${selClass}`;
          const rows=await db.select("marks",q);
          // Build subject id→name map from DB
          const dbSubMap={};
          if(stateSubs.length>0) stateSubs.forEach(s=>{dbSubMap[s.id]=s.name;});
          rows.forEach(m=>{
            if(!marksMap[m.student_id]) marksMap[m.student_id]={};
            const key=dbSubMap[m.subject_id]||m.subject_id;
            marksMap[m.student_id][key]=m.mark;
          });
        } else {
          // Use student.marks directly
          stuList.forEach(st=>{
            marksMap[st.id]={};
            if(st.marks) Object.entries(st.marks).forEach(([subId,v])=>{
              const sub=(state?.subjects||[]).find(s=>s.id===subId);
              const key=sub?sub.name:subId;
              marksMap[st.id][key]=String(v);
            });
          });
        }

        setRawStudents(stuList.map(st=>{
          const marks=marksMap[st.id]||{};
          const total=Object.values(marks).reduce((sum,v)=>sum+(v==="ab"?0:Number(v)||0),0);
          return{id:st.id,admNo:st.adm_no||st.rollNo||"",name:st.name,
            gender:safeGender(st),marks,total};
        }));

      } catch(e){
        setError("Failed to load: "+(e?.message||e));
        setRawStudents([]);
      } finally{ setLoading(false); }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[selGrade,selClass,selExamId,year,
     state?.students?.length,
     state?.subjects?.length,
     state?.classes?.length,
     state?.examRecords?.length,
     state?.exams?.length]);

  // ─── Derived data ────────────────────────────────────────────────────────────
  const students=useMemo(()=>{
    const sorted=[...rawStudents].sort((a,b)=>b.total-a.total);
    return sorted.map((s,i)=>({...s,classRank:i+1}));
  },[rawStudents]);

  const subjects=useMemo(()=>{
    // Use live subject names if available, else derive from marks keys
    if(liveSubjectNames.length>0) return liveSubjectNames;
    const keys=new Set();
    students.forEach(s=>Object.keys(s.marks).forEach(k=>keys.add(k)));
    return Array.from(keys);
  },[students,liveSubjectNames]);

  const summaries  =useMemo(()=>subjects.map(sub=>computeSubjectSummary(students,sub)),[students,subjects]);
  const olStudents =useMemo(()=>isOL?evaluateOLCriteria(students):[]          ,[students,isOL]);
  const alStudents =useMemo(()=>isAL?evaluateALCriteria(students):[]          ,[students,isAL]);

  const gradeDistData=useMemo(()=>{
    const all=students.flatMap(s=>subjects.map(sub=>gradePoint(s.marks[sub])));
    return ["A","B","C","S","W"].map(g=>({grade:g,count:all.filter(x=>x===g).length,fill:GRADE_COLORS[g]}));
  },[students,subjects]);

  const rangeChartData=useMemo(()=>
    RANGES.map(r=>({range:r.label,
      ...Object.fromEntries(summaries.map(s=>[s.subject,
        s.rangeCounts.find(rc=>rc.label===r.label)?.count||0]))}))
  ,[summaries]);

  const passRateData=useMemo(()=>
    summaries.map(s=>({subject:s.subject.slice(0,8),
      pass:parseFloat(s.passPercent),fail:100-parseFloat(s.passPercent)}))
  ,[summaries]);

  const olCounts=useMemo(()=>({
    total:          olStudents.length,
    pass5Credits3:  olStudents.filter(s=>s.pass5WithCredit3).length,
    pass6SinMath:   olStudents.filter(s=>s.pass6WithSinMath).length,
    pass5SinNoMath: olStudents.filter(s=>s.pass5SinNoMath).length,
    pass5MathNoSin: olStudents.filter(s=>s.pass5MathNoSin).length,
    fail5Plus:      olStudents.filter(s=>s.fail5Plus).length,
  }),[olStudents]);

  const alCounts=useMemo(()=>({
    qualify: alStudents.filter(s=>s.alStatus==="QUALIFY").length,
    fail:    alStudents.filter(s=>s.alStatus==="NOT QUALIFY").length,
    credits3:alStudents.filter(s=>s.alCredits>=3).length,
  }),[alStudents]);

  const passPiData=useMemo(()=>{
    // Count students with 5+ subjects scoring >34 (pass threshold)
    const passCount=students.filter(s=>{
      const vals=Object.values(s.marks)
        .map(v=>v==="ab"?0:Number(v))
        .filter(v=>!isNaN(v)&&v>0); // only entered marks
      return vals.filter(x=>x>34).length>=Math.min(5,Math.max(1,vals.length));
    }).length;
    const failCount=students.length-passCount;
    return[
      {name:"Pass (>34)",    value:passCount, fill:"#22c55e"},
      {name:"Needs Support", value:failCount, fill:"#ef4444"},
    ];
  },[students]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  const tabs=[
    {key:"ledger",  label:"📋 Ledger"},
    {key:"summary", label:"📈 Summary"},
    {key:"charts",  label:"📊 Charts"},
    ...(isMiddle?[{key:"middle_analysis",label:"📐 Class Analysis"}]:[]),
    ...(isOL?[{key:"ol_analysis",label:"🎓 O/L Analysis"}]:[]),
    ...(isAL?[{key:"al_analysis",label:"🏫 A/L Analysis"}]:[]),
  ];

  if(loading) return(
    <div style={{background:"#0a0f1e",minHeight:"60vh",display:"flex",alignItems:"center",
      justifyContent:"center",color:"#64748b",fontSize:15,fontFamily:"'Segoe UI',sans-serif"}}>
      ⏳ Loading Grade {selGrade}{selClass!=="All"?selClass:""}...
    </div>
  );

  return (
    <div style={{background:"#0a0f1e",minHeight:"100vh",fontFamily:"'Segoe UI',sans-serif",color:"#e2e8f0"}}>

      {/* Student result sheet modal */}
      {sheetStudent&&(
        <StudentResultSheet
          student={sheetStudent}
          subjects={subjects}
          currentExamName={selExam?selExam.name+" ("+selExam.year+")":"Current Marks"}
          previousMarks={previousMarks}
          previousExamName={previousExamName}
          onClose={()=>setSheetStudent(null)}
        />
      )}

      {/* GRADE LEGEND BAR — top of page, always visible */}
      <div style={{background:"#060c1a",borderBottom:"1px solid #1e3a6e",padding:"7px 22px",display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"#334155",fontWeight:600,letterSpacing:"0.5px"}}>GRADE SCALE:</span>
        {[["A",">75","#22c55e"],["B","65–74","#84cc16"],["C","55–64","#eab308"],["S","40–54","#f97316"],["W","0–39","#ef4444"]].map(([g,r,col])=>(
          <span key={g} style={{display:"flex",alignItems:"center",gap:5}}>
            <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:5,background:col,fontSize:12,color:"#fff",fontWeight:800}}>{g}</span>
            <span style={{color:"#64748b",fontSize:12}}>{r}</span>
          </span>
        ))}
        <span style={{color:"#1e3a6e",marginLeft:4}}>|</span>
        <span style={{fontSize:11,color:"#334155"}}>Click any student row to view their result sheet with comparison</span>
      </div>

      {/* ── HEADER ── */}
      <div style={{background:"linear-gradient(135deg,#0f1e3d,#0a0f1e)",borderBottom:"1px solid #1e3a6e",
        padding:"14px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",
        flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:800,
            background:"linear-gradient(90deg,#60a5fa,#a78bfa)",
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            📊 Result Ledger & Analytics
          </h1>
          <p style={{margin:"2px 0 0",fontSize:12,color:"#475569"}}>
            {year} · {user?.name||""}
          </p>
        </div>

        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          {/* Grade groups — from state.classes only */}
          {(()=>{
            const allGrades=[...new Set((state?.classes||[]).map(c=>String(c.name).replace(/[^0-9]/g,"")))].filter(g=>g).sort((a,b)=>parseInt(a)-parseInt(b));
            if(allGrades.length===0) return <span style={{fontSize:11,color:"#475569"}}>No classes yet</span>;
            return [["6","7","8","9"],["10","11"],["12","13"]].map((group,gi)=>{
              const grp=group.filter(g=>allGrades.includes(g));
              if(!grp.length) return null;
              const colors=["#3b82f6","#0891b2","#7c3aed"];
              const col=colors[gi];
              return(
                <div key={gi} style={{display:"flex",gap:2,background:"#0a0f1e",padding:3,borderRadius:8,border:`1px solid ${col}33`}}>
                  {grp.map(g=>(
                    <button key={g} onClick={()=>{
                      setSelGrade(g);
                      setSelClass("All");
                    }} style={{padding:"4px 10px",borderRadius:5,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,
                      background:selGrade===g?col:"transparent",color:selGrade===g?"#fff":"#475569"}}>
                      {gi===1?"O/L "+g:gi===2?"A/L "+g:g}
                    </button>
                  ))}
                </div>
              );
            });
          })()}

          {/* Section filter — All + sections that exist for selected grade */}
          <div style={{display:"flex",gap:2,background:"#0a0f1e",padding:3,borderRadius:8,border:"1px solid #1e3a6e33"}}>
            <button onClick={()=>setSelClass("All")} style={{padding:"4px 9px",borderRadius:5,border:"none",
              cursor:"pointer",fontWeight:600,fontSize:12,
              background:selClass==="All"?"#4f46e5":"transparent",color:selClass==="All"?"#fff":"#475569"}}>
              All
            </button>
            {(state?.classes||[])
              .filter(c=>String(c.name).replace(/[^0-9]/g,"")===selGrade)
              .sort((a,b)=>a.section.localeCompare(b.section))
              .map(cls=>(
              <button key={cls.id} onClick={()=>setSelClass(cls.section)}
                style={{padding:"4px 9px",borderRadius:5,border:"none",cursor:"pointer",fontWeight:600,
                  fontSize:11,whiteSpace:"nowrap",
                  background:selClass===cls.section?"#4f46e5":"transparent",
                  color:selClass===cls.section?"#fff":"#475569"}}>
                {cls.section}
              </button>
            ))}
          </div>

          {/* Exam selector — live */}
          <select value={selExamId} onChange={e=>setSelExamId(e.target.value)}
            style={{padding:"6px 10px",borderRadius:7,background:"#0f1e3d",
              border:"1px solid #1e3a6e",color:"#e2e8f0",fontSize:12}}>
            <option value="">— Current Marks —</option>
            {allExams.map(ex=>(
              <option key={ex.id} value={ex.id}>{ex.name} ({ex.year})</option>
            ))}
          </select>
          {selExam&&(
            <span style={{fontSize:11,color:"#a78bfa",background:"#1e1040",
              padding:"3px 10px",borderRadius:20,border:"1px solid #7c3aed33"}}>
              📝 {selExam.name}
            </span>
          )}
        </div>
      </div>

      {error&&(
        <div style={{background:"#450a0a",border:"1px solid #ef4444",
          color:"#fca5a5",padding:"8px 22px",fontSize:12}}>
          ⚠ {error} — showing demo data
        </div>
      )}

      {/* A/L info strip */}
      {isAL&&(
        <div style={{padding:"5px 22px",background:"#060c1a",borderBottom:"1px solid #1e3a6e",
          display:"flex",gap:8,alignItems:"center",fontSize:11}}>
          <span style={{color:"#475569"}}>A/L Grade {selGrade}</span>
          {Object.entries(AL_STREAM_COLORS).map(([k,c])=>(
            <span key={k} style={{color:c,background:c+"22",padding:"2px 8px",borderRadius:20}}>{k}</span>
          ))}
          <span style={{color:"#334155",marginLeft:"auto"}}>
            {liveSubjectNames.length>0
              ?`✓ ${liveSubjectNames.length} live subjects`
              :"Using local subject config"}
          </span>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{background:"#0d1a2f",borderBottom:"1px solid #1e3a6e",
        padding:"0 22px",display:"flex",gap:2}}>
        {tabs.map(tab=>(
          <button key={tab.key} onClick={()=>setViewMode(tab.key)}
            style={{padding:"11px 16px",border:"none",background:"none",cursor:"pointer",
              fontWeight:600,fontSize:12,
              color:viewMode===tab.key?"#60a5fa":"#475569",
              borderBottom:viewMode===tab.key?"2px solid #60a5fa":"2px solid transparent"}}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── STATS BAR ── */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",
        gap:10,padding:"14px 22px"}}>
        {[
          {label:"Total Students",value:students.length,           icon:"👥",color:"#60a5fa"},
          {label:"Highest Total", value:students[0]?.total||0,     icon:"🏆",color:"#fbbf24"},
          {label:"Class Average", value:students.length>0
            ?(students.reduce((a,s)=>a+s.total,0)/students.length).toFixed(1):"—",
            icon:"📊",color:"#a78bfa"},
          ...(isOL?[
            {label:"O/L Pass (5+3)",value:olCounts.pass5Credits3,icon:"✅",color:"#22c55e"},
            {label:"Need Support",  value:olCounts.fail5Plus,     icon:"⚠️",color:"#ef4444"},
          ]:isAL?[
            {label:"A/L Qualify (3 passes)",value:alCounts.qualify, icon:"🎓",color:"#22c55e"},
            {label:"3+ Credits",            value:alCounts.credits3,icon:"⭐",color:"#f59e0b"},
          ]:isMiddle?[
            {label:"Above Average",value:students.filter(s=>
              s.total>(students.reduce((a,b)=>a+b.total,0)/Math.max(students.length,1))).length,
              icon:"⭐",color:"#22c55e"},
            {label:"Need Support",value:students.filter(s=>s.avg<40).length,icon:"⚠️",color:"#ef4444"},
          ]:[
            {label:"Above Average",value:students.filter(s=>
              s.total>(students.reduce((a,b)=>a+b.total,0)/Math.max(students.length,1))).length,
              icon:"⭐",color:"#22c55e"},
          ]),
        ].map(stat=>(
          <div key={stat.label} style={{background:"#0f1e3d",borderRadius:10,padding:"12px 14px",
            border:`1px solid ${stat.color}22`,borderLeft:`3px solid ${stat.color}`}}>
            <div style={{fontSize:20}}>{stat.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:stat.color}}>{stat.value}</div>
            <div style={{fontSize:11,color:"#475569",marginTop:2}}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── LEDGER ── */}
      {viewMode==="ledger"&&(
        <div style={{padding:"0 22px 8px"}}>
          <ExportBar
            sectionId="ledger-section"
            label="Ledger"
            filename={`Ledger_Grade${selGrade}${selClass}_${selExam?.name||"Current"}`}
            csvRows={[
              ["#","Adm No","Name","M/F",...subjects,"Total","Avg","Rank"],
              ...students.map((s,i)=>[i+1,s.admNo,s.name,s.gender,...subjects.map(sub=>s.marks[sub]??""),s.total,(s.total/Math.max(subjects.length,1)).toFixed(1),s.classRank])
            ]}
          />
          <style>{`
            .ledger-hidden-scroll::-webkit-scrollbar{width:0;height:0}
            .ledger-phantom-scroll::-webkit-scrollbar{height:12px}
            .ledger-phantom-scroll::-webkit-scrollbar-track{background:#060c1a}
            .ledger-phantom-scroll::-webkit-scrollbar-thumb{background:#1e3a6e;border-radius:4px}
            .ledger-phantom-scroll::-webkit-scrollbar-thumb:hover{background:#2d4f8e}
          `}</style>
          <div id="ledger-section">
          <SyncedTableRL tableRef={ledgerScrollRef}>
          {students.length===0?(
            <div style={{textAlign:"center",padding:60,color:"#475569"}}>
              No results found.
              {!selExamId&&" Add students from the Students tab — they'll appear here automatically."}
            </div>
          ):(
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:900}}>
              <thead style={{position:"sticky",top:0,zIndex:10}}>
                <tr style={{background:"#0f1e3d"}}>
                  <th style={TH}>#</th>
                  <th style={TH}>Adm No</th>
                  <th style={{...TH,textAlign:"left",minWidth:150}}>Name</th>
                  <th style={TH}>M/F</th>
                  {subjects.map(s=><th key={s} style={{...TH,minWidth:62,fontSize:11}}>{s.slice(0,9)}</th>)}
                  <th style={{...TH,background:"#111d35",color:"#fbbf24"}}>Total</th>
                  <th style={{...TH,background:"#111d35",color:"#60a5fa"}}>Avg</th>
                  <th style={{...TH,background:"#111d35",color:"#a78bfa"}}>Rank</th>
                  {isOL&&<th style={{...TH,background:"#111d35",color:"#22c55e"}}>O/L</th>}
                  {isAL&&<th style={{...TH,background:"#111d35",color:"#a78bfa"}}>A/L</th>}
                </tr>
                <tr style={{background:"#0a142a",borderBottom:"1px solid #1e3a6e"}}>
                  <td colSpan={4} style={{...TD,color:"#334155",fontSize:10}}>Subject Averages →</td>
                  {subjects.map(s=>{
                    const sum=summaries.find(x=>x.subject===s);
                    return <td key={s} style={{...TD,fontSize:10,color:"#60a5fa"}}>{sum?.avg}</td>;
                  })}
                  <td colSpan={isOL||isAL?4:3} style={TD}/>
                </tr>
              </thead>
              <tbody>
                {students.map((s,i)=>{
                  const olS=isOL?olStudents.find(o=>o.id===s.id):null;
                  const alS=isAL?alStudents.find(o=>o.id===s.id):null;
                  return (
                    <tr key={s.id} style={{background:i%2===0?"#070e1c":"#0a1220",cursor:"pointer"}}
                      onClick={()=>openStudentSheet(s)}
                      title="Click to view result sheet"
                      onMouseEnter={e=>e.currentTarget.style.background="#0d1a30"}
                      onMouseLeave={e=>e.currentTarget.style.background=i%2===0?"#070e1c":"#0a1220"}>
                      <td style={{...TD,color:"#334155"}}>{i+1}</td>
                      <td style={{...TD,fontFamily:"monospace",color:"#475569",fontSize:11}}>{s.admNo}</td>
                      <td style={{...TD,textAlign:"left",fontWeight:500,color:"#cbd5e1",paddingLeft:8}}>{s.name}</td>
                      <td style={{...TD,color:s.gender==="M"?"#60a5fa":"#f472b6",fontSize:11}}>{s.gender}</td>
                      {subjects.map(sub=>{
                        const v=s.marks[sub];const gp=gradePoint(v);
                        return(
                          <td key={sub} style={{...TD,padding:"3px 2px"}}>
                            <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
                              <span style={{color:v==="ab"?"#a78bfa":"#e2e8f0",fontSize:12,fontWeight:600}}>{v??"—"}</span>
                              <span style={{fontSize:9,color:GRADE_COLORS[gp]||"#475569",fontWeight:700}}>{gp!=="-"?gp:""}</span>
                            </div>
                          </td>
                        );
                      })}
                      <td style={{...TD,fontWeight:700,color:"#fbbf24",fontSize:13}}>{s.total}</td>
                      <td style={{...TD,color:"#94a3b8"}}>
                        {subjects.length>0?(s.total/subjects.length).toFixed(1):"—"}
                      </td>
                      <td style={TD}>
                        <span style={{display:"inline-block",padding:"2px 8px",borderRadius:20,
                          background:s.classRank===1?"#fbbf24":s.classRank<=3?"#7c3aed":s.classRank<=10?"#1e3a6e":"transparent",
                          color:s.classRank<=3?"#fff":"#64748b",fontWeight:700,fontSize:11}}>
                          {s.classRank}
                        </span>
                      </td>
                      {isOL&&(
                        <td style={TD}>
                          <span style={{padding:"2px 7px",borderRadius:5,fontWeight:700,fontSize:11,
                            background:olS?.olStatus==="PASS"?"#14532d":"#450a0a",
                            color:olS?.olStatus==="PASS"?"#22c55e":"#ef4444"}}>
                            {olS?.olStatus||"—"}
                          </span>
                        </td>
                      )}
                      {isAL&&(
                        <td style={TD}>
                          <span style={{padding:"2px 7px",borderRadius:5,fontWeight:700,fontSize:11,
                            background:alS?.alStatus==="QUALIFY"?"#14532d":"#450a0a",
                            color:alS?.alStatus==="QUALIFY"?"#22c55e":"#ef4444"}}>
                            {alS?.alStatus||"—"}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </SyncedTableRL>
          </div>
        </div>
      )}

      {/* ── SUMMARY ── */}
      {viewMode==="summary"&&(
        <div style={{padding:"18px 22px"}}>
          <ExportBar
            sectionId="summary-section"
            label="Summary"
            filename={`Summary_Grade${selGrade}${selClass}_${selExam?.name||"Current"}`}
            csvRows={[
              ["Subject",...RANGES.map(r=>r.label),"Pass%","Average","Highest","Lowest"],
              ...summaries.map(s=>[s.subject,...s.rangeCounts.map(r=>r.count),s.passPercent+"%",s.avg,s.highest,s.lowest])
            ]}
          />
          <h2 style={{color:"#94a3b8",fontSize:15,marginBottom:14}}>
            Subject-wise Summary — Grade {selGrade} {selClass!=="All"?selClass:"All Classes"}
            {selExam&&<span style={{fontSize:12,color:"#a78bfa",marginLeft:8}}>· {selExam.name}</span>}
          </h2>
          <div id="summary-section" style={{overflowX:"scroll",scrollbarWidth:"thin",scrollbarColor:"#1e3a6e #060c1a"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:700}}>
              <thead>
                <tr style={{background:"#0f1e3d"}}>
                  <th style={TH}>Subject</th>
                  {RANGES.map(r=><th key={r.label} style={{...TH,color:r.color}}>{r.label}</th>)}
                  <th style={{...TH,color:"#22c55e"}}>Pass %</th>
                  <th style={{...TH,color:"#60a5fa"}}>Average</th>
                  <th style={{...TH,color:"#fbbf24"}}>Highest</th>
                  <th style={{...TH,color:"#ef4444"}}>Lowest</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s,i)=>(
                  <tr key={s.subject} style={{background:i%2===0?"#070e1c":"#0a1220"}}>
                    <td style={{...TD,fontWeight:600,textAlign:"left",paddingLeft:10,color:"#cbd5e1"}}>{s.subject}</td>
                    {s.rangeCounts.map(r=>(
                      <td key={r.label} style={TD}>
                        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                          <span style={{fontWeight:700,color:r.color}}>{r.count}</span>
                          <div style={{width:36,height:3,background:"#1e293b",borderRadius:2}}>
                            <div style={{width:`${s.total>0?(r.count/s.total)*100:0}%`,height:"100%",background:r.color,borderRadius:2}}/>
                          </div>
                        </div>
                      </td>
                    ))}
                    <td style={TD}>
                      <span style={{padding:"2px 8px",borderRadius:20,fontWeight:700,
                        background:parseFloat(s.passPercent)>=75?"#14532d":parseFloat(s.passPercent)>=50?"#422006":"#450a0a",
                        color:parseFloat(s.passPercent)>=75?"#22c55e":parseFloat(s.passPercent)>=50?"#f97316":"#ef4444"}}>
                        {s.passPercent}%
                      </span>
                    </td>
                    <td style={{...TD,color:"#60a5fa",fontWeight:600}}>{s.avg}</td>
                    <td style={{...TD,color:"#fbbf24",fontWeight:600}}>{s.highest}</td>
                    <td style={{...TD,color:"#ef4444",fontWeight:600}}>{s.lowest}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── CHARTS ── */}
      {viewMode==="charts"&&(
        <div style={{padding:"18px 22px"}}>
          <ExportBar
            sectionId="charts-section"
            label="Charts"
            filename={`Charts_Grade${selGrade}${selClass}_${selExam?.name||"Current"}`}
            csvRows={[
              ["Grade","Count"],
              ...gradeDistData.map(g=>[g.grade,g.count]),
              [],["Subject","Pass%","Fail%"],
              ...passRateData.map(r=>[r.subject,r.pass,r.fail])
            ]}
          />
          <div id="charts-section" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={{background:"#0f1e3d",borderRadius:14,padding:18,border:"1px solid #1e3a6e"}}>
            <h3 style={{color:"#94a3b8",margin:"0 0 14px",fontSize:13}}>📈 Subject Pass Rate (%)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={passRateData} margin={{left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e"/>
                <XAxis dataKey="subject" tick={{fill:"#475569",fontSize:10}}/>
                <YAxis tick={{fill:"#475569",fontSize:10}} domain={[0,100]}/>
                <Tooltip contentStyle={{background:"#0f1e3d",border:"1px solid #1e3a6e",color:"#e2e8f0"}}/>
                <Bar dataKey="pass" stackId="a" fill="#22c55e" name="Pass"/>
                <Bar dataKey="fail" stackId="a" fill="#ef4444" name="Fail"/>
                <Legend wrapperStyle={{color:"#64748b",fontSize:11}}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{background:"#0f1e3d",borderRadius:14,padding:18,border:"1px solid #1e3a6e"}}>
            <h3 style={{color:"#94a3b8",margin:"0 0 14px",fontSize:13}}>🥧 Grade Distribution</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={gradeDistData.filter(d=>d.count>0)} cx="50%" cy="50%" outerRadius={95} dataKey="count"
                  label={({grade,percent})=>percent>0.02?`${grade} ${(percent*100).toFixed(0)}%`:""}
                  labelLine={{stroke:"#334155"}}>
                  {gradeDistData.filter(d=>d.count>0).map((e,i)=><Cell key={i} fill={e.fill}/>)}
                </Pie>
                <Legend wrapperStyle={{color:"#64748b",fontSize:11}}/>
                <Tooltip contentStyle={{background:"#0f1e3d",border:"1px solid #1e3a6e",color:"#e2e8f0"}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div style={{background:"#0f1e3d",borderRadius:14,padding:18,border:"1px solid #1e3a6e",gridColumn:"1 / -1"}}>
            <h3 style={{color:"#94a3b8",margin:"0 0 14px",fontSize:13}}>📊 Mark Range by Subject</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rangeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a6e"/>
                <XAxis dataKey="range" tick={{fill:"#475569",fontSize:11}}/>
                <YAxis tick={{fill:"#475569",fontSize:10}}/>
                <Tooltip contentStyle={{background:"#0f1e3d",border:"1px solid #1e3a6e",color:"#e2e8f0"}}/>
                <Legend wrapperStyle={{color:"#64748b",fontSize:10}}/>
                {subjects.slice(0,6).map((sub,i)=>(
                  <Bar key={sub} dataKey={sub} fill={PIE_COLORS[i%PIE_COLORS.length]}/>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{background:"#0f1e3d",borderRadius:14,padding:18,border:"1px solid #1e3a6e"}}>
            <h3 style={{color:"#94a3b8",margin:"0 0 14px",fontSize:13}}>✅ Pass/Fail (5 subjects)</h3>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={passPiData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                  dataKey="value"
                  label={({name,value,percent})=>value>0?`${name}: ${(percent*100).toFixed(0)}%`:""}>
                  {passPiData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                </Pie>
                <Legend wrapperStyle={{color:"#64748b",fontSize:11}}/>
                <Tooltip contentStyle={{background:"#0f1e3d",border:"1px solid #1e3a6e",color:"#e2e8f0"}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          </div>
        </div>
      )}

      {/* ── MIDDLE SCHOOL ANALYSIS (Gr 6–9) ── */}
      {viewMode==="middle_analysis"&&isMiddle&&(()=>{
        const gradeOf=m=>{ if(m===undefined)return"–"; if(m>=75)return"A"; if(m>=65)return"B"; if(m>=55)return"C"; if(m>=40)return"S"; return"W"; };
        const gradeCol=g=>({A:"#22c55e",B:"#60a5fa",C:"#eab308",S:"#f97316",W:"#ef4444","–":"#475569"}[g]||"#475569");
        const total=students.length;
        const aboveAvg=students.filter(s=>s.total>(students.reduce((a,b)=>a+b.total,0)/Math.max(total,1))).length;
        const gradeDist={A:0,B:0,C:0,S:0,W:0};
        students.forEach(s=>{ const g=gradeOf(s.avg); if(g in gradeDist) gradeDist[g]++; });
        const classAvg=total?(students.reduce((a,s)=>a+s.total,0)/total).toFixed(1):"—";
        const highest=students[0]?.total||0;
        const lowest=students.length?students[students.length-1]?.total||0:0;
        // CSV rows for export
        const csvRows=[
          ["#","Roll No","Name","M/F",...subjects.map(s=>s),"Total","Average","Grade","Rank"],
          ...students.map((s,i)=>[i+1,s.rollNo,s.name,s.gender||"M",...subjects.map(sub=>s.marks[sub]??""),s.total,(s.avg||0).toFixed(1),gradeOf(s.avg),i+1])
        ];
        const sectionId="middle-analysis-section";
        const filename=`Grade${selGrade}${selClass!=="All"?selClass:""}-Analysis`;
        return(
        <div style={{padding:"18px 22px"}} id={sectionId}>
          <ExportBar sectionId={sectionId} csvRows={csvRows} filename={filename} label="Class Analysis"/>
          {/* Summary stat cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:20}}>
            {[
              {label:"Total Students",   value:total,     icon:"👥",color:"#60a5fa",desc:"Enrolled"},
              {label:"Class Average",    value:classAvg,  icon:"📊",color:"#a78bfa",desc:"Average Marks"},
              {label:"Highest Total",    value:highest,   icon:"🏆",color:"#fbbf24",desc:"Top Score"},
              {label:"Lowest Total",     value:lowest,    icon:"📉",color:"#f97316",desc:"Lowest Score"},
              {label:"Above Average",    value:aboveAvg,  icon:"⭐",color:"#22c55e",desc:"Students"},
              {label:"Below Average",    value:total-aboveAvg,icon:"⚠️",color:"#ef4444",desc:"Need Support"},
            ].map(c=>(
              <div key={c.label} style={{background:"#0f1e3d",borderRadius:10,padding:14,
                border:`1px solid ${c.color}33`,borderTop:`3px solid ${c.color}`}}>
                <div style={{fontSize:20}}>{c.icon}</div>
                <div style={{fontSize:28,fontWeight:800,color:c.color}}>{c.value}</div>
                <div style={{fontSize:11,fontWeight:600,color:c.color,marginBottom:2}}>{c.desc}</div>
                <div style={{fontSize:10,color:"#334155"}}>{c.label}</div>
              </div>
            ))}
          </div>
          {/* Grade distribution */}
          <div style={{background:"#0f1e3d",borderRadius:10,padding:14,marginBottom:20,border:"1px solid #1e3a6e"}}>
            <div style={{fontSize:13,color:"#94a3b8",fontWeight:600,marginBottom:12}}>Grade Distribution</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {Object.entries(gradeDist).map(([g,n])=>(
                <div key={g} style={{textAlign:"center",background:gradeCol(g)+"22",border:`1px solid ${gradeCol(g)}44`,
                  borderRadius:8,padding:"10px 18px",minWidth:60}}>
                  <div style={{fontSize:22,fontWeight:800,color:gradeCol(g)}}>{n}</div>
                  <div style={{fontSize:12,fontWeight:700,color:gradeCol(g)}}>Grade {g}</div>
                  <div style={{fontSize:10,color:"#475569"}}>{total?Math.round(n/total*100):0}%</div>
                </div>
              ))}
            </div>
          </div>
          {/* Per-subject analysis */}
          <div style={{background:"#0f1e3d",borderRadius:10,padding:14,marginBottom:20,border:"1px solid #1e3a6e"}}>
            <div style={{fontSize:13,color:"#94a3b8",fontWeight:600,marginBottom:12}}>Subject Performance</div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{background:"#0a1628"}}>
                  {["Subject","Average","Highest","Lowest","Pass","Fail","Pass %"].map(h=>(
                    <th key={h} style={TH}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {subjects.map((sub,i)=>{
                    const vals=students.map(s=>s.marks[sub]).filter(v=>v!==undefined&&v!=="");
                    const nums=vals.map(Number).filter(n=>!isNaN(n));
                    const avg=nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(1):"—";
                    const pass=nums.filter(m=>m>=40).length;
                    const fail=nums.filter(m=>m<40).length;
                    const pct=nums.length?Math.round(pass/nums.length*100):0;
                    return(
                      <tr key={sub} style={{background:i%2===0?"#070e1c":"#0a1220"}}>
                        <td style={{...TD,textAlign:"left",paddingLeft:10,color:"#cbd5e1",fontWeight:600}}>{sub}</td>
                        <td style={{...TD,color:Number(avg)>=75?"#22c55e":Number(avg)>=40?"#f59e0b":"#ef4444",fontWeight:700}}>{avg}</td>
                        <td style={{...TD,color:"#60a5fa"}}>{nums.length?Math.max(...nums):"—"}</td>
                        <td style={{...TD,color:"#f97316"}}>{nums.length?Math.min(...nums):"—"}</td>
                        <td style={{...TD,color:"#22c55e",fontWeight:700}}>{pass}</td>
                        <td style={{...TD,color:"#ef4444",fontWeight:700}}>{fail}</td>
                        <td style={TD}>
                          <span style={{padding:"2px 8px",borderRadius:5,fontWeight:700,fontSize:11,
                            background:pct>=75?"#14532d":pct>=50?"#422006":"#450a0a",
                            color:pct>=75?"#22c55e":pct>=50?"#f97316":"#ef4444"}}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          {/* Student ranking table */}
          <div style={{fontSize:13,color:"#94a3b8",fontWeight:600,marginBottom:10}}>Student Rankings</div>
          <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"calc(100vh - 420px)",
            scrollbarWidth:"thin",scrollbarColor:"#1e3a6e #060c1a"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead style={{position:"sticky",top:0,zIndex:5}}>
                <tr style={{background:"#0f1e3d"}}>
                  <th style={TH}>Rank</th>
                  <th style={TH}>Roll No</th>
                  <th style={{...TH,textAlign:"left",paddingLeft:8}}>Name</th>
                  <th style={TH}>M/F</th>
                  {subjects.map(s=><th key={s} style={{...TH,fontSize:10,minWidth:45}}>{s.slice(0,6)}</th>)}
                  <th style={{...TH,color:"#60a5fa"}}>Total</th>
                  <th style={{...TH,color:"#a78bfa"}}>Avg</th>
                  <th style={{...TH,color:"#fbbf24"}}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s,i)=>{
                  const g=gradeOf(s.avg);
                  return(
                    <tr key={s.id} style={{background:i%2===0?"#070e1c":"#0a1220"}}>
                      <td style={{...TD,fontWeight:800,color:i===0?"#fbbf24":i<=2?"#a78bfa":"#475569"}}>#{i+1}</td>
                      <td style={{...TD,fontFamily:"monospace",color:"#64748b"}}>{s.rollNo}</td>
                      <td style={{...TD,textAlign:"left",paddingLeft:8,color:"#cbd5e1",fontWeight:500}}>{s.name}</td>
                      <td style={{...TD,color:s.gender==="F"?"#f472b6":"#60a5fa"}}>{s.gender||"M"}</td>
                      {subjects.map(sub=>{
                        const v=s.marks[sub]; const sg=gradeOf(v);
                        return <td key={sub} style={{...TD,color:gradeCol(sg),fontWeight:700}}>{v??"—"}</td>;
                      })}
                      <td style={{...TD,color:"#60a5fa",fontWeight:800}}>{s.total}</td>
                      <td style={{...TD,color:"#a78bfa"}}>{(s.avg||0).toFixed(1)}</td>
                      <td style={TD}><span style={{padding:"2px 8px",borderRadius:5,fontWeight:800,fontSize:12,
                        background:gradeCol(g)+"22",color:gradeCol(g),border:`1px solid ${gradeCol(g)}44`}}>{g}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}

      {/* ── O/L ANALYSIS ── */}
      {viewMode==="ol_analysis"&&isOL&&(()=>{
        const hasSin  = olStudents.some(s=>s.sinMark!==undefined);
        const hasMath = olStudents.some(s=>s.mathMark!==undefined);
        const sinLbl  = olStudents[0]?.sinLabel  || "Sinhala";
        const mathLbl = olStudents[0]?.mathLabel || "Maths";
        const statCards=[
          {label:"5+ subjects + 3 Credits",              value:olCounts.pass5Credits3, color:"#22c55e",desc:"Core O/L Pass"},
          {label:`6+ + ${sinLbl} + ${mathLbl} + 3C`,    value:olCounts.pass6SinMath,  color:"#60a5fa",desc:"Strong Pass"},
          {label:`5+ + ${sinLbl} (${mathLbl} failed)`,  value:olCounts.pass5SinNoMath,color:"#f97316",desc:`${sinLbl} Pass, ${mathLbl} Fail`},
          {label:`5+ + ${mathLbl} (${sinLbl} failed)`,  value:olCounts.pass5MathNoSin,color:"#eab308",desc:`${mathLbl} Pass, ${sinLbl} Fail`},
          {label:"Failed more than 5 subjects",          value:olCounts.fail5Plus,     color:"#ef4444",desc:"Failed 5+"},
        ];
        return(
        <div style={{padding:"18px 22px"}}>
          <ExportBar
            sectionId="ol-analysis-section"
            csvRows={[
              ["#","Name",hasSin?sinLbl:"",hasMath?mathLbl:"","Passed","Credits",hasSin?"Sin Pass":"",hasMath?"Math Pass":"","5+3C",hasSin&&hasMath?"6+SinMath":"","Status"].filter(Boolean),
              ...olStudents.map((s,i)=>[i+1,s.name,hasSin?s.sinMark??"":undefined,hasMath?s.mathMark??"":undefined,s.passedCount,s.creditCount,hasSin?s.sinPass?"Y":"N":undefined,hasMath?s.mathPass?"Y":"N":undefined,s.pass5WithCredit3?"Y":"N",hasSin&&hasMath?s.pass6WithSinMath?"Y":"N":undefined,s.olStatus].filter(v=>v!==undefined))
            ]}
            filename={`OL-Analysis-Grade${selGrade}${selClass!=="All"?selClass:""}`}
            label="O/L Analysis"
          />
          <div id="ol-analysis-section">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginBottom:20}}>
            {statCards.map(c=>(
              <div key={c.label} style={{background:"#0f1e3d",borderRadius:10,padding:14,
                border:`1px solid ${c.color}33`,borderTop:`3px solid ${c.color}`}}>
                <div style={{fontSize:30,fontWeight:800,color:c.color}}>{c.value}</div>
                <div style={{fontSize:11,fontWeight:600,color:c.color,marginBottom:3}}>{c.desc}</div>
                <div style={{fontSize:10,color:"#334155",lineHeight:1.4}}>{c.label}</div>
              </div>
            ))}
          </div>
          <h3 style={{color:"#94a3b8",fontSize:14,marginBottom:10}}>Student O/L Performance Details</h3>
          {olStudents.length===0&&(
            <div style={{textAlign:"center",padding:40,color:"#334155",fontSize:13}}>
              No O/L students found. Enter marks in Marks Entry first.
            </div>
          )}
          {olStudents.length>0&&(
          <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"calc(100vh - 380px)",
            scrollbarWidth:"thin",scrollbarColor:"#1e3a6e #060c1a"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead style={{position:"sticky",top:0,zIndex:5}}>
                <tr style={{background:"#0f1e3d"}}>
                  <th style={TH}>#</th>
                  <th style={{...TH,textAlign:"left",paddingLeft:8}}>Name</th>
                  {hasSin &&<th style={TH}>{sinLbl}</th>}
                  {hasMath&&<th style={TH}>{mathLbl}</th>}
                  <th style={TH}>Passed</th>
                  <th style={TH}>Credits</th>
                  {hasSin &&<th style={TH}>Sin Pass</th>}
                  {hasMath&&<th style={TH}>Math Pass</th>}
                  <th style={TH}>5+3C</th>
                  {hasSin&&hasMath&&<th style={TH}>6+SinMath</th>}
                  <th style={TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {olStudents.map((s,i)=>(
                  <tr key={s.id} style={{background:i%2===0?"#070e1c":"#0a1220"}}>
                    <td style={{...TD,color:"#334155"}}>{i+1}</td>
                    <td style={{...TD,textAlign:"left",paddingLeft:8,color:"#cbd5e1"}}>{s.name}</td>
                    {hasSin&&(
                      <td style={TD}>
                        <span style={{color:s.sinPass?"#22c55e":"#ef4444",fontWeight:700}}>
                          {s.sinMark??"-"} <span style={{fontSize:9}}>({s.sinGrade})</span>
                        </span>
                      </td>
                    )}
                    {hasMath&&(
                      <td style={TD}>
                        <span style={{color:s.mathPass?"#22c55e":"#ef4444",fontWeight:700}}>
                          {s.mathMark??"-"} <span style={{fontSize:9}}>({s.mathGrade})</span>
                        </span>
                      </td>
                    )}
                    <td style={{...TD,color:"#60a5fa",fontWeight:700}}>{s.passedCount}</td>
                    <td style={{...TD,color:"#a78bfa",fontWeight:700}}>{s.creditCount}</td>
                    {hasSin &&<YN val={s.sinPass}/>}
                    {hasMath&&<YN val={s.mathPass}/>}
                    <YN val={s.pass5WithCredit3}/>
                    {hasSin&&hasMath&&<YN val={s.pass6WithSinMath}/>}
                    <td style={TD}>
                      <span style={{padding:"2px 8px",borderRadius:5,fontWeight:800,fontSize:11,
                        background:s.olStatus==="PASS"?"#14532d":"#450a0a",
                        color:s.olStatus==="PASS"?"#22c55e":"#ef4444"}}>
                        {s.olStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>{/* end ol-analysis-section */}
        </div>
        );
      })()}

      {/* ── A/L ANALYSIS ── */}
      {viewMode==="al_analysis"&&isAL&&(
        <div style={{padding:"18px 22px"}}>
          <ExportBar
            sectionId="al-analysis-section"
            csvRows={[
              ["#","Name","Passes","Credits","Status",...subjects],
              ...alStudents.map((s,i)=>[i+1,s.name,s.alPasses,s.alCredits,s.alStatus,...subjects.map(sub=>s.marks[sub]??"")])
            ]}
            filename={`AL-Analysis-Grade${selGrade}${selClass!=="All"?selClass:""}`}
            label="A/L Analysis"
          />
          <div id="al-analysis-section">
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10,marginBottom:20}}>
            {[
              {label:"3+ passes (qualify for university)",value:alCounts.qualify, color:"#22c55e",desc:"A/L Qualify"},
              {label:"3+ credit passes (A/B/C)",          value:alCounts.credits3,color:"#60a5fa",desc:"3+ Credits"},
              {label:"Did not qualify (< 3 passes)",       value:alCounts.fail,   color:"#ef4444",desc:"Not Qualified"},
            ].map(c=>(
              <div key={c.label} style={{background:"#0f1e3d",borderRadius:10,padding:14,
                border:`1px solid ${c.color}33`,borderTop:`3px solid ${c.color}`}}>
                <div style={{fontSize:30,fontWeight:800,color:c.color}}>{c.value}</div>
                <div style={{fontSize:11,fontWeight:600,color:c.color,marginBottom:3}}>{c.desc}</div>
                <div style={{fontSize:10,color:"#334155",lineHeight:1.4}}>{c.label}</div>
              </div>
            ))}
          </div>
          <h3 style={{color:"#94a3b8",fontSize:14,marginBottom:10}}>Student A/L Performance Details</h3>
          {alStudents.length===0&&(
            <div style={{textAlign:"center",padding:40,color:"#334155",fontSize:13}}>
              No A/L students found. Enter marks in Marks Entry first.
            </div>
          )}
          {alStudents.length>0&&(
          <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"calc(100vh - 380px)",
            scrollbarWidth:"thin",scrollbarColor:"#1e3a6e #060c1a"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead style={{position:"sticky",top:0,zIndex:5}}>
                <tr style={{background:"#0f1e3d"}}>
                  {["#","Name","Passes","Credits","Status"].map(h=>(
                    <th key={h} style={TH}>{h}</th>
                  ))}
                  {subjects.map(s=><th key={s} style={{...TH,fontSize:10}}>{s.slice(0,8)}</th>)}
                </tr>
              </thead>
              <tbody>
                {alStudents.map((s,i)=>(
                  <tr key={s.id} style={{background:i%2===0?"#070e1c":"#0a1220"}}>
                    <td style={{...TD,color:"#334155"}}>{i+1}</td>
                    <td style={{...TD,textAlign:"left",paddingLeft:8,color:"#cbd5e1"}}>{s.name}</td>
                    <td style={{...TD,color:"#60a5fa",fontWeight:700}}>{s.alPasses}</td>
                    <td style={{...TD,color:"#a78bfa",fontWeight:700}}>{s.alCredits}</td>
                    <td style={TD}>
                      <span style={{padding:"2px 8px",borderRadius:5,fontWeight:800,fontSize:11,
                        background:s.alStatus==="QUALIFY"?"#14532d":"#450a0a",
                        color:s.alStatus==="QUALIFY"?"#22c55e":"#ef4444"}}>
                        {s.alStatus}
                      </span>
                    </td>
                    {subjects.map(sub=>{
                      const v=s.marks[sub]; const gp=gradePoint(v);
                      return(
                        <td key={sub} style={TD}>
                          <span style={{color:GRADE_COLORS[gp]||"#475569",fontWeight:700,fontSize:12}}>{v??"—"}</span>
                          <span style={{fontSize:9,color:GRADE_COLORS[gp]||"#475569",marginLeft:2}}>{gp!=="-"?gp:""}</span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>{/* end al-analysis-section */}
        </div>
      )}
    </div>
  );
}

function YN({val}){
  return(
    <td style={{...TD,textAlign:"center"}}>
      <span style={{fontWeight:700,color:val?"#22c55e":"#ef4444"}}>{val?"Y":"N"}</span>
    </td>
  );
}

const TH={padding:"9px 7px",textAlign:"center",color:"#64748b",fontWeight:600,fontSize:12,
  borderBottom:"2px solid #1e3a6e",whiteSpace:"nowrap"};
const TD={padding:"5px 7px",textAlign:"center",borderBottom:"1px solid #0d1a2f",color:"#e2e8f0"};