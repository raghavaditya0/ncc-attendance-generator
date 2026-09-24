import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { bundledDirectory } from "../data/cadets";
import {
  ArrowRight,
  Check,
  Clipboard,
  Download,
  FileText,
  Flag,
  Layers3,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

type Language = "english" | "hindi";
type ReasonKey = "fall-in" | "class" | "fest" | "camp" | "parade" | "training" | "duty" | "other";
type Cadet = { id: number; name: string; rank: string; branch: string; enrollment: string };
type DirectoryCadet = Cadet & { year: string };
type Settings = { college: string; address: string; unit: string; recipient: string; signer: string; designation: string };

const reasonOptions: Array<{ key: ReasonKey; label: string; hindi: string; color: string }> = [
  { key: "fall-in", label: "Fall-in", hindi: "फॉल-इन", color: "orange" },
  { key: "class", label: "NCC Class", hindi: "NCC क्लास", color: "blue" },
  { key: "fest", label: "College Fest", hindi: "कॉलेज फेस्ट", color: "violet" },
  { key: "camp", label: "NCC Camp", hindi: "NCC कैंप", color: "green" },
  { key: "parade", label: "Parade", hindi: "परेड", color: "pink" },
  { key: "training", label: "Training", hindi: "ट्रेनिंग", color: "yellow" },
  { key: "duty", label: "Event / Duty", hindi: "इवेंट / ड्यूटी", color: "slate" },
  { key: "other", label: "Other", hindi: "अन्य", color: "slate" },
];

const defaultSettings: Settings = {
  college: "Guru Tegh Bahadur Institute of Technology",
  address: "Rajouri Garden, New Delhi - 110064",
  unit: "6 DBN GTBIT",
  recipient: "The Head of Departments",
  signer: "Lt. Gurveen Singh Grover",
  designation: "ANO & Assistant Professor",
};
const defaultHods = [
  { name: "Dr. Amandeep Kaur", department: "IT, CSE-DS" },
  { name: "Dr. Jasleen Kaur", department: "CSE, CSE-AIML" },
  { name: "Dr. Gurmeet Singh", department: "ECE" },
];

const today = new Date();
const dateToInput = (date: Date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};
const blankCadet = (id: number): Cadet => ({ id, name: "", rank: "", branch: "", enrollment: "" });
const formatDate = (value: string, language: Language) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat(language === "hindi" ? "hi-IN" : "en-IN", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(year, month - 1, day));
};
const normalizeNames = (value: string) => value.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean);

export default function Home() {
  const [startDate, setStartDate] = useState(dateToInput(today));
  const [endDate, setEndDate] = useState(dateToInput(today));
  const [reason, setReason] = useState<ReasonKey>("fall-in");
  const [venue, setVenue] = useState("");
  const [language, setLanguage] = useState<Language>("english");
  const [cadets, setCadets] = useState<Cadet[]>([blankCadet(1), blankCadet(2), blankCadet(3)]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [directory, setDirectory] = useState<DirectoryCadet[]>(() => [...bundledDirectory]);
  const [directorySearch, setDirectorySearch] = useState("");
  const [selectedDirectoryIds, setSelectedDirectoryIds] = useState<number[]>([]);
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("");
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const ui = language === "hindi";
  const selectedReason = reasonOptions.find((item) => item.key === reason) ?? reasonOptions[0];
  const activeCadets = cadets.filter((cadet) => cadet.name.trim());
  const dateRange = startDate === endDate ? formatDate(startDate, language) : `${formatDate(startDate, language)} ${ui ? "से" : "to"} ${formatDate(endDate, language)}`;
  const filteredDirectory = directory.filter((cadet) => `${cadet.name} ${cadet.rank} ${cadet.enrollment} ${cadet.year}`.toLowerCase().includes(directorySearch.toLowerCase())).slice(0, 100);

  useEffect(() => {
    const saved = localStorage.getItem("ncc-generator-settings");
    if (saved) { try { setSettings({ ...defaultSettings, ...JSON.parse(saved) }); } catch { /* keep defaults */ } }
    const savedDirectory = localStorage.getItem("ncc-cadet-directory");
    if (savedDirectory) { try { setDirectory(JSON.parse(savedDirectory)); } catch { /* ignore malformed local directory */ } }
  }, []);
  useEffect(() => { localStorage.setItem("ncc-generator-settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { if (directory.length) localStorage.setItem("ncc-cadet-directory", JSON.stringify(directory)); }, [directory]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 2600); return () => window.clearTimeout(timer); }, [notice]);

  const details = useMemo(() => {
    const name = selectedReason.label;
    const venueText = venue.trim() ? ` at ${venue.trim()}` : "";
    if (reason === "camp") return { subject: `Application regarding attendance of NCC Cadets attending mandatory NCC Camp${venueText} from ${dateRange}.`, body: `This is to inform you that the cadets mentioned in the attached nominal roll were required to attend the mandatory NCC Camp${venueText} from ${dateRange}. Attendance at this camp is compulsory as a part of their NCC training requirements.` };
    if (reason === "class") return { subject: `Attendance for the NCC Class on ${dateRange}`, body: `With due respect, I wish to seek your attention and inform you about the NCC class which was held on ${dateRange}. The list of cadets provided were practicing drills and skills required for NCC and personality development and were not able to attend their regular academic classes due to the same reason.` };
    if (reason === "fest") return { subject: `Request for grant of attendance to cadets who attended ${venue || "the College Fest"} from ${dateRange}.`, body: `This is to inform you that the cadets mentioned in the attached nominal roll attended ${venue || "the College Fest"} from ${dateRange}. The concerned cadets were required to participate in the event and were therefore unable to attend their regular academic classes.` };
    if (reason === "parade" || reason === "fall-in" || reason === "training") return { subject: `Request for grant of attendance to NCC cadets who attended ${name} on ${dateRange}.`, body: `This is to inform you that the cadets mentioned in the attached nominal roll attended the NCC ${name}${venueText} on ${dateRange}. The concerned cadets were required to be present for NCC activities and were therefore unable to attend their regular academic classes.` };
    return { subject: `Request for grant of attendance to NCC cadets for ${name} on ${dateRange}.`, body: `This is to inform you that the cadets mentioned in the attached nominal roll attended ${name}${venueText} on ${dateRange}. The concerned cadets were required to be present during the above-mentioned period and were therefore unable to attend their regular academic classes.` };
  }, [dateRange, reason, selectedReason.label, venue]);

  const application = useMemo(() => {
    const rows = activeCadets.map((cadet, index) => `${index + 1}. ${cadet.rank || "—"} | ${cadet.name.trim()} | ${cadet.branch || "—"} | ${cadet.enrollment || "—"}`).join("\n");
    if (ui) return [`सेवा में,`, `${settings.recipient},`, `${settings.college},`, settings.address, ``, `विषय: ${details.subject}`, ``, `महोदय / महोदया,`, ``, `${details.body} अतः आपसे अनुरोध है कि उपरोक्त कैडेट्स की ${dateRange} की उपस्थिति दर्ज करने की कृपा करें।`, ``, `धन्यवाद।`, ``, `भवदीय,`, settings.signer, settings.designation, settings.unit, ``, `संलग्न: नाममात्र रोल`, `S.No | Rank | Name | Year, Branch | Enrollment Number`, rows].join("\n");
    return [`The Head of Departments,`, `${settings.college},`, settings.address, ``, `Subject: ${details.subject}`, ``, `Respected Sir/Madam,`, ``, `${details.body}`, ``, `Therefore, it is requested that the attendance of the concerned cadets may kindly be considered and granted for the above mentioned period.`, `Your kind consideration and necessary action in this regard are requested.`, ``, `Thanking You.`, ``, `Yours sincerely,`, settings.signer, settings.designation, settings.unit, ``, `Copy to:`, `• All HODs`, ``, `Attached nominal roll:`, `S.No | Rank | Name | Year, Branch | Enrollment Number`, rows].join("\n");
  }, [activeCadets, dateRange, details, settings, ui]);

  const updateCadet = (id: number, field: keyof Omit<Cadet, "id">, value: string) => setCadets((current) => current.map((cadet) => {
    if (cadet.id !== id || field !== "name") return cadet.id === id ? { ...cadet, [field]: value } : cadet;
    const match = lookupCadet(value);
    return match ? { ...cadet, name: value, rank: match.rank, branch: match.branch, enrollment: match.enrollment } : { ...cadet, name: value };
  }));
  const addCadet = () => setCadets((current) => [...current, blankCadet(Date.now())]);
  const removeCadet = (id: number) => setCadets((current) => current.filter((cadet) => cadet.id !== id));
  const importNames = () => {
    const names = normalizeNames(importText);
    if (!names.length) { setNotice(ui ? "पहले नाम डालो" : "Add at least one name first"); return; }
    setCadets(names.map((name, index) => {
      const match = lookupCadet(name);
      return { ...blankCadet(Date.now() + index), name, rank: match?.rank ?? "", branch: match?.branch ?? "", enrollment: match?.enrollment ?? "" };
    }));
    setImportText(""); setShowImport(false); setNotice(`${names.length} ${ui ? "नाम जोड़ दिए गए" : "names imported"}`);
  };
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const imported: DirectoryCadet[] = [];
      workbook.SheetNames.forEach((sheetName) => {
        const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "" });
        const headerIndex = rows.findIndex((row) => String(row[0]).trim().toLowerCase() === "s.no");
        if (headerIndex < 0) return;
        rows.slice(headerIndex + 1).forEach((row, index) => {
          const name = String(row[3] ?? "").trim();
          if (!name || name === "undefined") return;
          imported.push({ id: Date.now() + imported.length + index, year: sheetName, rank: String(row[2] ?? "").trim(), name, branch: sheetName, enrollment: String(row[1] ?? "").trim() });
        });
      });
      const unique = Array.from(new Map(imported.map((cadet) => [`${cadet.enrollment}|${cadet.name.toLowerCase()}`, cadet])).values());
      setDirectory(unique);
      setSelectedDirectoryIds([]);
      setDirectorySearch("");
      setShowDirectory(true);
      setNotice(`${unique.length} ${ui ? "cadets की list load हो गई" : "unique cadets loaded from Excel"}`);
    } catch {
      setNotice(ui ? "Excel file पढ़ी नहीं जा सकी" : "Could not read this Excel file");
    }
    event.target.value = "";
  };
  const toggleDirectoryCadet = (id: number) => setSelectedDirectoryIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const applyDirectorySelection = () => {
    const selected = directory.filter((cadet) => selectedDirectoryIds.includes(cadet.id)).map(({ id, year, ...cadet }) => ({ ...cadet, id }));
    if (!selected.length) { setNotice(ui ? "कम से कम एक cadet select करो" : "Select at least one cadet"); return; }
    setCadets(selected);
    setShowDirectory(false);
    setNotice(`${selected.length} ${ui ? "cadets attendance में जोड़ दिए" : "cadets added to attendance"}`);
  };
  const lookupCadet = (name: string) => directory.find((cadet) => cadet.name.trim().toLowerCase() === name.trim().toLowerCase());
  const generate = () => {
    if (!activeCadets.length) { setNotice(ui ? "कम से कम एक कैडेट का नाम डालो" : "Add at least one cadet name first"); return; }
    setGeneratedAt(new Date()); setNotice(ui ? "Application तैयार है" : "Application generated successfully"); document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const copyApplication = async () => { await navigator.clipboard.writeText(application); setNotice(ui ? "Application copy हो गई" : "Application copied"); };
  const downloadText = () => { const blob = new Blob([application], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `ncc-attendance-${startDate}.txt`; link.click(); URL.revokeObjectURL(url); setNotice(ui ? "Text file download हो गई" : "Text file downloaded"); };
  const resetForm = () => { setStartDate(dateToInput(today)); setEndDate(dateToInput(today)); setReason("fall-in"); setVenue(""); setLanguage("english"); setCadets([blankCadet(1), blankCadet(2), blankCadet(3)]); setGeneratedAt(null); setNotice("Form reset"); };

  return <div className="app-shell">
    <header className="topbar no-print"><div className="brand-lockup"><div className="brand-mark"><Flag size={19} strokeWidth={2.5} /></div><div><div className="brand-name">CADET<span>FORM</span></div><div className="brand-sub">NCC attendance desk</div></div></div><div className="top-actions"><div className="lang-toggle"><button className={language === "english" ? "active" : ""} onClick={() => setLanguage("english")}>EN</button><button className={language === "hindi" ? "active" : ""} onClick={() => setLanguage("hindi")}>हि</button></div><button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Open settings"><Settings2 size={18} /></button></div></header>
    <main className="workspace">
      <section className="hero no-print"><div className="eyebrow"><Sparkles size={14} /> {ui ? "समय बचाओ, सही format पाओ" : "Save time. Submit it right."}</div><h1>{ui ? "Attendance से application तक, बस कुछ clicks." : <>From attendance to<br /><em>application</em> in a few clicks.</>}</h1><p>{ui ? "Date range, reason और nominal roll डालो — वही official format अपने-आप तैयार होगा।" : "Add the dates, pick the reason, enter your nominal roll. Your official application is ready."}</p><div className="hero-stamp"><span className="stamp-dot" /> {activeCadets.length} cadets ready<span className="stamp-line" /> {selectedReason.label}</div></section>
      <div className="stepper no-print"><div className="step active"><span>01</span><div><strong>{ui ? "Details भरो" : "Add details"}</strong><small>{ui ? "कब और किसलिए?" : "When & why?"}</small></div></div><div className="step-line" /><div className={`step ${generatedAt ? "active" : ""}`}><span>02</span><div><strong>{ui ? "Application तैयार" : "Generate"}</strong><small>{ui ? "Submit करने लायक" : "Ready to submit"}</small></div></div></div>
      <div className="builder-grid no-print"><section className="panel form-panel"><div className="panel-heading"><div><span className="section-kicker">STEP 01 / DETAILS</span><h2>{ui ? "Attendance details" : "Attendance details"}</h2></div><div className="count-pill"><Users size={14} /> {activeCadets.length} present</div></div>
        <div className="field-row"><label className="field-label">{ui ? "From date" : "From date"}<input className="text-input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="field-label">{ui ? "To date" : "To date"}<input className="text-input" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} /></label></div>
        <div className="field-row compact-fields"><label className="field-label">{ui ? "Event / venue (optional)" : "Event / venue (optional)"}<input className="text-input" value={venue} onChange={(event) => setVenue(event.target.value)} placeholder="e.g. NCC Bhawan, Rohini" /></label><label className="field-label">{ui ? "Unit / Battalion" : "Unit / battalion"}<input className="text-input" value={settings.unit} onChange={(event) => setSettings({ ...settings, unit: event.target.value })} placeholder="e.g. 6 DBN GTBIT" /></label></div>
        <div className="field-block"><div className="field-label">{ui ? "Reason चुनो" : "What was it for?"}<span className="required">Required</span></div><div className="reason-grid">{reasonOptions.map((item) => <button key={item.key} className={`reason-card ${item.color} ${reason === item.key ? "selected" : ""}`} onClick={() => setReason(item.key)}><span>{item.label}</span><small>{item.hindi}</small>{reason === item.key && <Check size={14} className="reason-check" />}</button>)}</div></div>
        <div className="cadet-heading"><div><div className="field-label">{ui ? "Cadet names डालो" : "Cadet names"}<span className="required">Required</span></div><p>{ui ? "बस नाम लिखो — rank, branch और enrollment अपने-आप भरेंगे।" : "Just add the name — rank, year/branch and enrollment fill automatically."}</p></div><div className="roll-actions"><label className="text-action upload-action"><Download size={15} /> Excel list<input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} /></label><button className="text-action" onClick={() => setShowImport(true)}><Clipboard size={15} /> Paste names</button></div></div>
        <div className="cadet-list"><div className="table-label-row"><span>S.No</span><span>Rank</span><span>Name</span><span>Year, Branch</span><span>Enrollment No.</span><span /></div>{cadets.map((cadet, index) => <div className="cadet-row" key={cadet.id}><span className="row-number">{String(index + 1).padStart(2, "0")}</span><input className="cadet-input auto-detail" value={cadet.rank} onChange={(event) => updateCadet(cadet.id, "rank", event.target.value)} placeholder="Auto" readOnly={Boolean(cadet.name && lookupCadet(cadet.name))} /><input className="cadet-input" value={cadet.name} onChange={(event) => updateCadet(cadet.id, "name", event.target.value)} placeholder="Type cadet name" /><input className="cadet-input auto-detail" value={cadet.branch} onChange={(event) => updateCadet(cadet.id, "branch", event.target.value)} placeholder="Auto" readOnly={Boolean(cadet.name && lookupCadet(cadet.name))} /><input className="cadet-input auto-detail" value={cadet.enrollment} onChange={(event) => updateCadet(cadet.id, "enrollment", event.target.value)} placeholder="Auto" readOnly={Boolean(cadet.name && lookupCadet(cadet.name))} /><button className="delete-button" onClick={() => removeCadet(cadet.id)} aria-label="Remove cadet"><Trash2 size={16} /></button></div>)}</div><button className="add-button" onClick={addCadet}><Plus size={16} /> Add another cadet</button>
        <div className="generate-wrap"><button className="generate-button" onClick={generate}><span>{ui ? "Application बनाओ" : "Generate application"}</span><ArrowRight size={18} /></button><p><span className="secure-dot" /> {ui ? "आपका data इसी browser में रहता है" : "Your details stay in this browser"}</p></div>
      </section><aside className="quick-card"><div className="quick-top"><Layers3 size={18} /><span>{ui ? "PDF format matched" : "PDF format matched"}</span></div><h3>{ui ? "Nominal roll भी auto बनेगा" : "Your nominal roll, automatically attached."}</h3><p>{ui ? "Rank, branch और enrollment number सहित table application के साथ तैयार होगी।" : "Rank, year/branch and enrollment number will be formatted into the attached table."}</p><button onClick={() => setShowSettings(true)}>Edit college details <ArrowRight size={15} /></button><div className="quick-footer"><span>Tip</span> {ui ? "पहले Settings में college और ANO details भर दो" : "Save your college and ANO details once."}</div></aside></div>
      <section className={`preview-section ${generatedAt ? "is-generated" : ""}`} id="preview"><div className="preview-heading no-print"><div><span className="section-kicker">STEP 02 / OUTPUT</span><h2>{ui ? "Application preview" : "Application preview"}</h2></div><div className="preview-actions"><button className="secondary-button" onClick={copyApplication}><Clipboard size={15} /> Copy text</button><button className="secondary-button" onClick={downloadText}><Download size={15} /> TXT</button><button className="primary-small" onClick={() => window.print()}><FileText size={15} /> Print / PDF</button></div></div>
        <div className="paper-wrap"><article className="paper print-page"><div className="paper-topline"><span>{settings.unit}</span><span>{formatDate(startDate, language)}</span></div><div className="paper-content"><p className="paper-address">{ui ? "सेवा में," : "The Head of Departments,"}<br />{settings.college},<br />{settings.address}</p><h3>{ui ? `विषय: ${details.subject}` : `Subject: ${details.subject}`}</h3><p>{ui ? "महोदय / महोदया," : "Respected Sir/Madam,"}</p><p>{ui ? `${details.body} अतः आपसे अनुरोध है कि उपरोक्त कैडेट्स की ${dateRange} की उपस्थिति दर्ज करने की कृपा करें।` : details.body}</p><p>{!ui && "Therefore, it is requested that the attendance of the concerned cadets may kindly be considered and granted for the above mentioned period. Your kind consideration and necessary action in this regard are requested."}</p><p>{ui ? "धन्यवाद।" : "Thanking You."}</p><div className="signature"><p>{ui ? "भवदीय," : "Yours sincerely,"}</p><strong>{settings.signer}</strong><span>{settings.designation}</span><span>{settings.unit}</span></div><div className="copy-to"><strong>{ui ? "प्रति:" : "Copy to:"}</strong><span>• {ui ? "सभी HODs" : "All HODs"}</span></div><div className="hod-grid">{defaultHods.map((hod) => <div className="hod-card" key={hod.name}><div className="hod-sign-line" /><strong>{hod.name}</strong><span>HOD</span><span>{hod.department}</span></div>)}</div></div><div className="nominal-roll-page"><div className="roll-table-wrap"><table className="roll-table"><thead><tr><th>S.No.</th><th>Rank</th><th>Name</th><th>Year, Branch</th><th>Enrollment Number</th></tr></thead><tbody>{activeCadets.map((cadet, index) => <tr key={cadet.id}><td>{index + 1}</td><td>{cadet.rank || "—"}</td><td>{cadet.name.trim()}</td><td>{cadet.branch || "—"}</td><td>{cadet.enrollment || "—"}</td></tr>)}</tbody></table></div><div className="closing-signature"><p>{ui ? "भवदीय," : "Yours sincerely,"}</p><strong>{settings.signer}</strong><span>{settings.designation}</span><span>{settings.unit}</span></div></div><div className="paper-footer"><span>CADET<span>FORM</span> · Attendance desk</span><span>{activeCadets.length} present · {selectedReason.label}</span></div></article></div><div className="after-paper no-print"><span className="paper-status"><Check size={14} /> {generatedAt ? "Generated just now" : "Live preview — updates as you type"}</span><button className="reset-button" onClick={resetForm}><RotateCcw size={14} /> Start over</button></div></section>
    </main>
    {notice && <div className="toast"><Check size={16} /> {notice}</div>}
    {showImport && <div className="modal-backdrop no-print" onClick={() => setShowImport(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="section-kicker">QUICK IMPORT</span><h2>Paste cadet names</h2></div><button className="icon-button" onClick={() => setShowImport(false)}><X size={18} /></button></div><p>One name per line, or separate names with commas. You can fill the other table columns after importing.</p><textarea autoFocus value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={'Gaurav Kumar\nIshkant Sharma\nTanveer Singh'} /><button className="generate-button" onClick={importNames}>Add names <ArrowRight size={18} /></button></div></div>}
    {showDirectory && <div className="modal-backdrop no-print" onClick={() => setShowDirectory(false)}><div className="modal directory-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="section-kicker">EXCEL NOMINAL ROLL</span><h2>Select cadets</h2></div><button className="icon-button" onClick={() => setShowDirectory(false)}><X size={18} /></button></div><p>{directory.length} cadets loaded from your workbook. Search and select only those present today. Sensitive columns such as phone, Aadhaar, bank and email were not imported.</p><input className="text-input directory-search" value={directorySearch} onChange={(event) => setDirectorySearch(event.target.value)} placeholder="Search name, rank, year or regimental no." /><div className="directory-list">{filteredDirectory.map((cadet) => <button key={cadet.id} className={`directory-row ${selectedDirectoryIds.includes(cadet.id) ? "selected" : ""}`} onClick={() => toggleDirectoryCadet(cadet.id)}><span className="directory-check">{selectedDirectoryIds.includes(cadet.id) ? <Check size={14} /> : ""}</span><span><strong>{cadet.name}</strong><small>{cadet.rank} · {cadet.year} · {cadet.enrollment}</small></span></button>)}</div><div className="directory-footer"><span>{selectedDirectoryIds.length} selected</span><button className="generate-button" onClick={applyDirectorySelection}>Use selected cadets <ArrowRight size={18} /></button></div></div></div>}
    {showSettings && <div className="modal-backdrop no-print" onClick={() => setShowSettings(false)}><div className="modal settings-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="section-kicker">SETTINGS</span><h2>College details</h2></div><button className="icon-button" onClick={() => setShowSettings(false)}><X size={18} /></button></div><p>These details are saved only on this device and added to every application.</p><label className="modal-field">College name<input className="text-input" value={settings.college} onChange={(event) => setSettings({ ...settings, college: event.target.value })} /></label><label className="modal-field">College address<input className="text-input" value={settings.address} onChange={(event) => setSettings({ ...settings, address: event.target.value })} /></label><label className="modal-field">Unit / battalion<input className="text-input" value={settings.unit} onChange={(event) => setSettings({ ...settings, unit: event.target.value })} /></label><label className="modal-field">Application addressed to<input className="text-input" value={settings.recipient} onChange={(event) => setSettings({ ...settings, recipient: event.target.value })} /></label><label className="modal-field">ANO / signer name<input className="text-input" value={settings.signer} onChange={(event) => setSettings({ ...settings, signer: event.target.value })} /></label><label className="modal-field">Designation<input className="text-input" value={settings.designation} onChange={(event) => setSettings({ ...settings, designation: event.target.value })} /></label><button className="generate-button" onClick={() => { setShowSettings(false); setNotice("College details saved"); }}>Save details <Check size={18} /></button></div></div>}
  </div>;
}
