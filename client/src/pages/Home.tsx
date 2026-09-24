import { useEffect, useMemo, useState } from "react";
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
type ReasonKey = "fall-in" | "fest" | "camp" | "parade" | "training" | "duty" | "other";

type Cadet = {
  id: number;
  name: string;
  roll: string;
};

type Settings = {
  college: string;
  unit: string;
  recipient: string;
  signer: string;
};

const reasonOptions: Array<{ key: ReasonKey; label: string; hindi: string; color: string }> = [
  { key: "fall-in", label: "Fall-in", hindi: "फॉल-इन", color: "orange" },
  { key: "fest", label: "College Fest", hindi: "कॉलेज फेस्ट", color: "violet" },
  { key: "camp", label: "NCC Camp", hindi: "NCC कैंप", color: "green" },
  { key: "parade", label: "Parade", hindi: "परेड", color: "blue" },
  { key: "training", label: "Training", hindi: "ट्रेनिंग", color: "pink" },
  { key: "duty", label: "Event / Duty", hindi: "इवेंट / ड्यूटी", color: "yellow" },
  { key: "other", label: "Other", hindi: "अन्य", color: "slate" },
];

const defaultSettings: Settings = {
  college: "Your College Name",
  unit: "NCC Unit / Battalion",
  recipient: "The Principal",
  signer: "NCC In-charge / ANO",
};

const today = new Date();
const dateToInput = (date: Date) => {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 10);
};

const formatDate = (value: string, language: Language) => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat(language === "hindi" ? "hi-IN" : "en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const normalizeNames = (value: string) =>
  value
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function Home() {
  const [date, setDate] = useState(dateToInput(today));
  const [reason, setReason] = useState<ReasonKey>("fall-in");
  const [language, setLanguage] = useState<Language>("english");
  const [cadets, setCadets] = useState<Cadet[]>([
    { id: 1, name: "Rahul Kumar", roll: "" },
    { id: 2, name: "Aman Sharma", roll: "" },
    { id: 3, name: "Rohit Singh", roll: "" },
  ]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("");
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("ncc-generator-settings");
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch {
        // Ignore malformed local settings and keep defaults.
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ncc-generator-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectedReason = reasonOptions.find((item) => item.key === reason) ?? reasonOptions[0];
  const activeCadets = cadets.filter((cadet) => cadet.name.trim());
  const prettyDate = formatDate(date, language);

  const application = useMemo(() => {
    const names = activeCadets.map((cadet) => cadet.name.trim());
    const reasonName = language === "hindi" ? selectedReason.hindi : selectedReason.label;
    const count = names.length;

    if (language === "hindi") {
      return [
        `सेवा में,`,
        `${settings.recipient},`,
        `${settings.college}`,
        ``,
        `विषय: ${prettyDate} को ${reasonName} में उपस्थित NCC कैडेट्स की उपस्थिति के संबंध में`,
        ``,
        `महोदय / महोदया,`,
        ``,
        `सविनय निवेदन है कि दिनांक ${prettyDate} को आयोजित ${reasonName} में हमारे NCC यूनिट के ${count} कैडेट्स ने भाग लिया। उपस्थित कैडेट्स का विवरण निम्नलिखित है:`,
        ``,
        ...names.map((name, index) => `${index + 1}. ${name}`),
        ``,
        `अतः आपसे अनुरोध है कि उपरोक्त कैडेट्स की उस दिन की उपस्थिति दर्ज करने की कृपा करें।`,
        ``,
        `धन्यवाद।`,
        ``,
        `भवदीय,`,
        `${settings.signer}`,
        `${settings.unit}`,
      ].join("\n");
    }

    return [
      `To,`,
      `${settings.recipient},`,
      `${settings.college}`,
      ``,
      `Subject: Regarding attendance of NCC cadets for ${reasonName} on ${prettyDate}`,
      ``,
      `Respected Sir/Madam,`,
      ``,
      `This is to inform you that ${count} NCC cadet${count === 1 ? "" : "s"} from our unit attended the ${reasonName} conducted on ${prettyDate}. The details of the present cadets are given below:`,
      ``,
      ...names.map((name, index) => `${index + 1}. ${name}`),
      ``,
      `You are requested to kindly consider their attendance for the above-mentioned date.`,
      ``,
      `Thank you.`,
      ``,
      `Yours faithfully,`,
      `${settings.signer}`,
      `${settings.unit}`,
    ].join("\n");
  }, [activeCadets, language, prettyDate, selectedReason, settings]);

  const updateCadet = (id: number, field: "name" | "roll", value: string) => {
    setCadets((current) => current.map((cadet) => (cadet.id === id ? { ...cadet, [field]: value } : cadet)));
  };

  const addCadet = () => {
    setCadets((current) => [...current, { id: Date.now(), name: "", roll: "" }]);
  };

  const removeCadet = (id: number) => {
    setCadets((current) => current.filter((cadet) => cadet.id !== id));
  };

  const importNames = () => {
    const names = normalizeNames(importText);
    if (!names.length) {
      setNotice(language === "hindi" ? "पहले नाम डालो" : "Add at least one name first");
      return;
    }
    setCadets(names.map((name, index) => ({ id: Date.now() + index, name, roll: "" })));
    setImportText("");
    setShowImport(false);
    setNotice(`${names.length} ${language === "hindi" ? "नाम जोड़ दिए गए" : "names imported"}`);
  };

  const generate = () => {
    if (!activeCadets.length) {
      setNotice(language === "hindi" ? "कम से कम एक कैडेट का नाम डालो" : "Add at least one cadet name first");
      return;
    }
    setGeneratedAt(new Date());
    setNotice(language === "hindi" ? "Application तैयार है" : "Application generated successfully");
    document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const copyApplication = async () => {
    await navigator.clipboard.writeText(application);
    setNotice(language === "hindi" ? "Application copy हो गई" : "Application copied");
  };

  const downloadText = () => {
    const blob = new Blob([application], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ncc-attendance-${date}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice(language === "hindi" ? "Text file download हो गई" : "Text file downloaded");
  };

  const resetForm = () => {
    setDate(dateToInput(today));
    setReason("fall-in");
    setLanguage("english");
    setCadets([
      { id: 1, name: "", roll: "" },
      { id: 2, name: "", roll: "" },
      { id: 3, name: "", roll: "" },
    ]);
    setGeneratedAt(null);
    setNotice("Form reset");
  };

  const ui = language === "hindi";

  return (
    <div className="app-shell">
      <header className="topbar no-print">
        <div className="brand-lockup">
          <div className="brand-mark"><Flag size={19} strokeWidth={2.5} /></div>
          <div>
            <div className="brand-name">CADET<span>FORM</span></div>
            <div className="brand-sub">NCC attendance desk</div>
          </div>
        </div>
        <div className="top-actions">
          <div className="lang-toggle" aria-label="Application language">
            <button className={language === "english" ? "active" : ""} onClick={() => setLanguage("english")}>EN</button>
            <button className={language === "hindi" ? "active" : ""} onClick={() => setLanguage("hindi")}>हि</button>
          </div>
          <button className="icon-button" onClick={() => setShowSettings(true)} aria-label="Open settings"><Settings2 size={18} /></button>
        </div>
      </header>

      <main className="workspace">
        <section className="hero no-print">
          <div className="eyebrow"><Sparkles size={14} /> {ui ? "समय बचाओ, सही format पाओ" : "Save time. Submit it right."}</div>
          <h1>{ui ? "Attendance से application तक, बस कुछ clicks." : <>From attendance to<br /><em>application</em> in a few clicks.</>}</h1>
          <p>{ui ? "Date, reason और cadets डालो — बाकी official format अपने-आप तैयार हो जाएगा।" : "Add the date, pick the reason, enter your cadets. Your official application is ready before the parade ends."}</p>
          <div className="hero-stamp"><span className="stamp-dot" /> {activeCadets.length} {ui ? "cadets ready" : "cadets ready"}<span className="stamp-line" /> {selectedReason.label}</div>
        </section>

        <div className="stepper no-print">
          <div className="step active"><span>01</span><div><strong>{ui ? "Details भरो" : "Add details"}</strong><small>{ui ? "कब और किसलिए?" : "When & why?"}</small></div></div>
          <div className="step-line" />
          <div className={`step ${generatedAt ? "active" : ""}`}><span>02</span><div><strong>{ui ? "Application तैयार" : "Generate"}</strong><small>{ui ? "Submit करने लायक" : "Ready to submit"}</small></div></div>
        </div>

        <div className="builder-grid no-print">
          <section className="panel form-panel">
            <div className="panel-heading">
              <div><span className="section-kicker">STEP 01 / DETAILS</span><h2>{ui ? "आज की attendance" : "Today’s attendance"}</h2></div>
              <div className="count-pill"><Users size={14} /> {activeCadets.length} present</div>
            </div>

            <div className="field-row">
              <label className="field-label">{ui ? "Date" : "Attendance date"}<input className="text-input" type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
              <label className="field-label">{ui ? "Unit / Battalion" : "Unit / battalion"}<input className="text-input" value={settings.unit} onChange={(event) => setSettings({ ...settings, unit: event.target.value })} placeholder="e.g. 3 UP BN NCC" /></label>
            </div>

            <div className="field-block">
              <div className="field-label">{ui ? "Reason चुनो" : "What was it for?"}<span className="required">Required</span></div>
              <div className="reason-grid">
                {reasonOptions.map((item) => (
                  <button key={item.key} className={`reason-card ${item.color} ${reason === item.key ? "selected" : ""}`} onClick={() => setReason(item.key)}>
                    <span>{item.label}</span><small>{item.hindi}</small>{reason === item.key && <Check size={14} className="reason-check" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="cadet-heading">
              <div><div className="field-label">{ui ? "Present cadets" : "Present cadets"}<span className="required">Required</span></div><p>{ui ? "एक line में एक नाम या नीचे paste करो" : "Add names one by one, or paste a whole list."}</p></div>
              <button className="text-action" onClick={() => setShowImport(true)}><Clipboard size={15} /> Paste list</button>
            </div>

            <div className="cadet-list">
              {cadets.map((cadet, index) => (
                <div className="cadet-row" key={cadet.id}>
                  <span className="row-number">{String(index + 1).padStart(2, "0")}</span>
                  <input className="cadet-input" value={cadet.name} onChange={(event) => updateCadet(cadet.id, "name", event.target.value)} placeholder="Cadet full name" />
                  <input className="roll-input" value={cadet.roll} onChange={(event) => updateCadet(cadet.id, "roll", event.target.value)} placeholder="Roll no." />
                  <button className="delete-button" onClick={() => removeCadet(cadet.id)} aria-label="Remove cadet"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <button className="add-button" onClick={addCadet}><Plus size={16} /> Add another cadet</button>

            <div className="generate-wrap">
              <button className="generate-button" onClick={generate}><span>{ui ? "Application बनाओ" : "Generate application"}</span><ArrowRight size={18} /></button>
              <p><span className="secure-dot" /> {ui ? "आपका data इसी browser में रहता है" : "Your details stay in this browser"}</p>
            </div>
          </section>

          <aside className="quick-card">
            <div className="quick-top"><Layers3 size={18} /><span>{ui ? "Quick setup" : "Quick setup"}</span></div>
            <h3>{ui ? "एक बार details save कर दो" : "Save your college details once."}</h3>
            <p>{ui ? "फिर हर application में header और signature अपने-आप आएगा।" : "Your college header and signature will appear on every application automatically."}</p>
            <button onClick={() => setShowSettings(true)}>Open settings <ArrowRight size={15} /></button>
            <div className="quick-footer"><span>Tip</span> {ui ? "नाम comma या नई line से भी paste कर सकते हो" : "Paste names separated by commas or new lines."}</div>
          </aside>
        </div>

        <section className={`preview-section ${generatedAt ? "is-generated" : ""}`} id="preview">
          <div className="preview-heading no-print">
            <div><span className="section-kicker">STEP 02 / OUTPUT</span><h2>{ui ? "Application preview" : "Application preview"}</h2></div>
            <div className="preview-actions">
              <button className="secondary-button" onClick={copyApplication}><Clipboard size={15} /> Copy text</button>
              <button className="secondary-button" onClick={downloadText}><Download size={15} /> TXT</button>
              <button className="primary-small" onClick={() => window.print()}><FileText size={15} /> Print / PDF</button>
            </div>
          </div>

          <div className="paper-wrap">
            <article className="paper print-page">
              <div className="paper-topline"><span>{settings.unit}</span><span>{prettyDate}</span></div>
              <div className="paper-content">
                <p className="paper-address">{ui ? "सेवा में," : "To,"}<br />{settings.recipient},<br />{settings.college}</p>
                <h3>{ui ? `विषय: ${prettyDate} को ${selectedReason.hindi} में उपस्थित NCC कैडेट्स की उपस्थिति के संबंध में` : `Subject: Regarding attendance of NCC cadets for ${selectedReason.label} on ${prettyDate}`}</h3>
                <p>{ui ? "महोदय / महोदया," : "Respected Sir/Madam,"}</p>
                <p>{ui ? `सविनय निवेदन है कि दिनांक ${prettyDate} को आयोजित ${selectedReason.hindi} में हमारे NCC यूनिट के ${activeCadets.length} कैडेट्स ने भाग लिया। उपस्थित कैडेट्स का विवरण निम्नलिखित है:` : `This is to inform you that ${activeCadets.length} NCC cadet${activeCadets.length === 1 ? "" : "s"} from our unit attended the ${selectedReason.label} conducted on ${prettyDate}. The details of the present cadets are given below:`}</p>
                <ol>{activeCadets.map((cadet) => <li key={cadet.id}>{cadet.name.trim()} {cadet.roll.trim() && <span>— {cadet.roll.trim()}</span>}</li>)}</ol>
                <p>{ui ? "अतः आपसे अनुरोध है कि उपरोक्त कैडेट्स की उस दिन की उपस्थिति दर्ज करने की कृपा करें।" : "You are requested to kindly consider their attendance for the above-mentioned date."}</p>
                <p>{ui ? "धन्यवाद।" : "Thank you."}</p>
                <div className="signature"><p>{ui ? "भवदीय," : "Yours faithfully,"}</p><strong>{settings.signer}</strong><span>{settings.unit}</span></div>
              </div>
              <div className="paper-footer"><span>CADET<span>FORM</span> · Attendance desk</span><span>{activeCadets.length} present · {selectedReason.label}</span></div>
            </article>
          </div>
          <div className="after-paper no-print"><span className="paper-status"><Check size={14} /> {generatedAt ? "Generated just now" : "Live preview — updates as you type"}</span><button className="reset-button" onClick={resetForm}><RotateCcw size={14} /> Start over</button></div>
        </section>
      </main>

      {notice && <div className="toast"><Check size={16} /> {notice}</div>}

      {showImport && <div className="modal-backdrop no-print" onClick={() => setShowImport(false)}><div className="modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="section-kicker">QUICK IMPORT</span><h2>Paste cadet names</h2></div><button className="icon-button" onClick={() => setShowImport(false)}><X size={18} /></button></div><p>One name per line, or separate names with commas.</p><textarea autoFocus value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={'Rahul Kumar\nAman Sharma\nRohit Singh'} /><button className="generate-button" onClick={importNames}>Add names <ArrowRight size={18} /></button></div></div>}

      {showSettings && <div className="modal-backdrop no-print" onClick={() => setShowSettings(false)}><div className="modal settings-modal" onClick={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="section-kicker">SETTINGS</span><h2>College details</h2></div><button className="icon-button" onClick={() => setShowSettings(false)}><X size={18} /></button></div><p>These details are saved only on this device and added to every application.</p><label className="modal-field">College name<input className="text-input" value={settings.college} onChange={(event) => setSettings({ ...settings, college: event.target.value })} /></label><label className="modal-field">Unit / battalion<input className="text-input" value={settings.unit} onChange={(event) => setSettings({ ...settings, unit: event.target.value })} /></label><label className="modal-field">Application addressed to<input className="text-input" value={settings.recipient} onChange={(event) => setSettings({ ...settings, recipient: event.target.value })} /></label><label className="modal-field">Signature / designation<input className="text-input" value={settings.signer} onChange={(event) => setSettings({ ...settings, signer: event.target.value })} /></label><button className="generate-button" onClick={() => { setShowSettings(false); setNotice("College details saved"); }}>Save details <Check size={18} /></button></div></div>}
    </div>
  );
}
