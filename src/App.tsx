"use client";
import React, { useMemo, useState, useEffect } from "react";
import { Calculator, Info, Landmark, Banknote, Sun, Moon, Save, Upload, AlertTriangle, TrendingUp, Calendar } from "lucide-react";

export default function SellerFinanceCalculator() {
  // ---------- Theme ----------
  const [darkMode, setDarkMode] = useState(true);

  const theme = useMemo(
    () =>
      darkMode
        ? {
            bg: "bg-slate-900 text-slate-100",
            card: "bg-slate-800/70 border border-slate-700",
            input: "bg-slate-900 border border-slate-700 text-slate-100",
            textMuted: "text-slate-400",
            accent: "text-emerald-400",
            warning: "bg-amber-900/30 border-amber-700",
          }
        : {
            bg: "bg-white text-black",
            card: "bg-gray-50 border border-gray-300",
            input: "bg-white border border-gray-300 text-black",
            textMuted: "text-gray-500",
            accent: "text-emerald-600",
            warning: "bg-amber-50 border-amber-300",
          },
    [darkMode]
  );

  // ---------- Helpers ----------
  const parseNumber = (s) => {
    if (s === undefined || s === null) return 0;
    if (typeof s === "number") return s;
    const cleaned = String(s).replace(/[^0-9.\-]/g, "").trim();
    if (cleaned === "" || cleaned === "-" || cleaned === ".") return 0;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };
  const fmt2 = (n) =>
    Number(n || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const fmt0 = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

  // ---------- Reusable Inputs ----------
  const NumberField = ({ label, valueRaw, setValueRaw, min = 0, warning }) => {
    const [focused, setFocused] = useState(false);
    const [draft, setDraft] = useState(valueRaw);
    useEffect(() => {
      if (!focused) setDraft(valueRaw);
    }, [valueRaw, focused]);
    const formatCommas = (value) => {
      let num = parseNumber(value);
      if (min !== undefined && num < min) num = min;
      return value === "" ? "" : fmt0(num);
    };
    return (
      <label className="text-xs w-full">
        <div className="flex items-center justify-between mb-1">
          <span>{label}</span>
          {warning && <AlertTriangle className="w-3 h-3 text-amber-500" />}
        </div>
        <input
          value={focused ? draft : valueRaw}
          onFocus={() => {
            setFocused(true);
            setDraft(valueRaw);
          }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setFocused(false);
            setValueRaw(formatCommas(draft));
          }}
          className={`w-full rounded px-2 py-1 ${theme.input} ${warning ? 'border-amber-500' : ''}`}
          type="text"
          placeholder="0"
        />
      </label>
    );
  };

  const RateField = ({ label, value, setValue }) => {
    const [focused, setFocused] = useState(false);
    const [draft, setDraft] = useState(String(value));
    useEffect(() => {
      if (!focused) setDraft(String(value));
    }, [value, focused]);
    return (
      <label className="text-xs w-full">
        {label}
        <input
          value={focused ? draft : value}
          onFocus={() => {
            setFocused(true);
            setDraft(String(value));
          }}
          onChange={(e) => setDraft(e.target.value.replace("%", ""))}
          onBlur={() => {
            setFocused(false);
            let num = parseNumber(draft);
            if (num < 0) num = 0;
            if (num > 100) num = 100;
            setValue(String(num));
          }}
          className={`w-full rounded px-2 py-1 ${theme.input}`}
          type="text"
          placeholder="0.00"
        />
      </label>
    );
  };

  // ---------- State ----------
  const [purchasePriceRaw, setPurchasePriceRaw] = useState("6,000,000");
  const [downPaymentRaw, setDownPaymentRaw] = useState("200,000");
  const [noiRaw, setNoiRaw] = useState("356,000");

  const [useFirstLoan, setUseFirstLoan] = useState(true);
  const [firstBalanceRaw, setFirstBalanceRaw] = useState("2,000,000");
  const [firstRate, setFirstRate] = useState("6.3");
  const [firstAmortYears, setFirstAmortYears] = useState(25);
  const [firstBalloonYears, setFirstBalloonYears] = useState(10);
  const [useFirstBalloon, setUseFirstBalloon] = useState(true);

  const [sellerMode, setSellerMode] = useState("amortized");
  const [sellerRate, setSellerRate] = useState("3");
  const [sellerAmortYears, setSellerAmortYears] = useState(30);
  const [sellerBalloonYears, setSellerBalloonYears] = useState(8);
  const [useSellerBalloon, setUseSellerBalloon] = useState(true);

  // ---------- Saved Scenarios ----------
  const [savedScenarios, setSavedScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // ---------- Payment Schedule ----------
  const [showSchedule, setShowSchedule] = useState(false);

  // ---------- Derived Numbers ----------
  const purchasePrice = useMemo(() => parseNumber(purchasePriceRaw), [purchasePriceRaw]);
  const downPayment = useMemo(() => parseNumber(downPaymentRaw), [downPaymentRaw]);
  const noi = useMemo(() => parseNumber(noiRaw), [noiRaw]);
  const firstBalance = useMemo(
    () => (useFirstLoan ? parseNumber(firstBalanceRaw) : 0),
    [firstBalanceRaw, useFirstLoan]
  );
  const sellerBalance = useMemo(
    () => Math.max(purchasePrice - downPayment - firstBalance, 0),
    [purchasePrice, downPayment, firstBalance]
  );

  // ---------- Validation Warnings ----------
  const warnings = useMemo(() => {
    const w = [];
    if (downPayment > purchasePrice) w.push("Down payment exceeds purchase price");
    if (firstBalance > purchasePrice) w.push("First loan exceeds purchase price");
    if (downPayment + firstBalance > purchasePrice) w.push("Down payment + first loan exceeds purchase price");
    if (noi < 0) w.push("NOI is negative");
    if (sellerBalance < 0) w.push("Seller balance is negative (check your inputs)");
    return w;
  }, [downPayment, purchasePrice, firstBalance, noi, sellerBalance]);

  // ---------- Finance Math ----------
  const monthlyPayment = (bal, rateStr, years) => {
    const r = Number(rateStr) / 100 / 12;
    if (!bal || !years || !Number.isFinite(r)) return 0;
    const n = years * 12;
    return r === 0 ? bal / n : (bal * r) / (1 - Math.pow(1 + r, -n));
  };
  const remainingBalance = (bal, rateStr, years, months) => {
    const r = Number(rateStr) / 100 / 12;
    if (!bal || !years || !Number.isFinite(r)) return 0;
    const n = years * 12;
    const m = Math.min(months, n);
    const pmt = monthlyPayment(bal, rateStr, years);
    if (r === 0) return Math.max(bal - pmt * m, 0);
    return bal * Math.pow(1 + r, m) - pmt * ((Math.pow(1 + r, m) - 1) / r);
  };

  const first = useMemo(() => {
    if (!useFirstLoan) return { monthly: 0, annual: 0, balAtBalloon: 0 };
    const monthly = monthlyPayment(firstBalance, firstRate, firstAmortYears);
    const annual = monthly * 12;
    const balAtBalloon = useFirstBalloon
      ? remainingBalance(firstBalance, firstRate, firstAmortYears, firstBalloonYears * 12)
      : 0;
    return { monthly, annual, balAtBalloon };
  }, [useFirstLoan, firstBalance, firstRate, firstAmortYears, firstBalloonYears, useFirstBalloon]);

  const seller = useMemo(() => {
    let monthly = 0,
      annual = 0,
      balAtBalloon = 0;
    const r = Number(sellerRate) / 100 / 12;
    if (sellerBalance <= 0) return { monthly: 0, annual: 0, balAtBalloon: 0 };

    if (sellerMode === "interestOnly") {
      monthly = sellerBalance * r;
      annual = monthly * 12;
      balAtBalloon = useSellerBalloon ? sellerBalance : 0;
    } else if (sellerMode === "zeroInterest") {
      const n = sellerAmortYears * 12;
      monthly = n > 0 ? sellerBalance / n : 0;
      annual = monthly * 12;
      if (useSellerBalloon) {
        const paidMonths = sellerBalloonYears * 12;
        const principalPaid = Math.min(paidMonths, n) * monthly;
        balAtBalloon = Math.max(sellerBalance - principalPaid, 0);
      } else {
        balAtBalloon = 0;
      }
    } else {
      monthly = monthlyPayment(sellerBalance, sellerRate, sellerAmortYears);
      annual = monthly * 12;
      balAtBalloon = useSellerBalloon
        ? remainingBalance(sellerBalance, sellerRate, sellerAmortYears, sellerBalloonYears * 12)
        : 0;
    }
    return { monthly, annual, balAtBalloon };
  }, [sellerBalance, sellerRate, sellerMode, sellerAmortYears, sellerBalloonYears, useSellerBalloon]);

  const totalMonthlyDebt = first.monthly + seller.monthly;
  const totalAnnualDebt = first.annual + seller.annual;
  const annualCashFlow = noi - totalAnnualDebt;
  const monthlyCashFlow = annualCashFlow / 12;
  const dscr = totalAnnualDebt > 0 ? noi / totalAnnualDebt : 0;

  // ---------- Enhanced Metrics ----------
  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  const cocReturn = downPayment > 0 ? (annualCashFlow / downPayment) * 100 : 0;
  const totalLTV = purchasePrice > 0 ? ((firstBalance + sellerBalance) / purchasePrice) * 100 : 0;
  const firstLTV = purchasePrice > 0 ? (firstBalance / purchasePrice) * 100 : 0;

  // ---------- Payment Schedule Generation ----------
  const generateSchedule = (balance, rateStr, years, label) => {
    const schedule = [];
    const r = Number(rateStr) / 100 / 12;
    const pmt = monthlyPayment(balance, rateStr, years);
    let remaining = balance;
    const months = Math.min(years * 12, 12); // Show first year only
    
    for (let i = 1; i <= months; i++) {
      const interest = remaining * r;
      const principal = pmt - interest;
      remaining = Math.max(remaining - principal, 0);
      schedule.push({
        month: i,
        payment: pmt,
        principal,
        interest,
        balance: remaining,
        label
      });
    }
    return schedule;
  };

  const firstSchedule = useFirstLoan ? generateSchedule(firstBalance, firstRate, firstAmortYears, "First Loan") : [];
  const sellerSchedule = sellerBalance > 0 && sellerMode === "amortized" 
    ? generateSchedule(sellerBalance, sellerRate, sellerAmortYears, "Seller Note") 
    : [];

  // ---------- Scenario Management ----------
  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    const scenario = {
      name: scenarioName,
      date: new Date().toLocaleDateString(),
      data: {
        purchasePriceRaw, downPaymentRaw, noiRaw,
        useFirstLoan, firstBalanceRaw, firstRate, firstAmortYears, firstBalloonYears, useFirstBalloon,
        sellerMode, sellerRate, sellerAmortYears, sellerBalloonYears, useSellerBalloon
      },
      results: { dscr, capRate, cocReturn, totalLTV, annualCashFlow }
    };
    setSavedScenarios([...savedScenarios, scenario]);
    setScenarioName("");
    setShowSaveDialog(false);
  };

  const loadScenario = (scenario) => {
    const d = scenario.data;
    setPurchasePriceRaw(d.purchasePriceRaw);
    setDownPaymentRaw(d.downPaymentRaw);
    setNoiRaw(d.noiRaw);
    setUseFirstLoan(d.useFirstLoan);
    setFirstBalanceRaw(d.firstBalanceRaw);
    setFirstRate(d.firstRate);
    setFirstAmortYears(d.firstAmortYears);
    setFirstBalloonYears(d.firstBalloonYears);
    setUseFirstBalloon(d.useFirstBalloon);
    setSellerMode(d.sellerMode);
    setSellerRate(d.sellerRate);
    setSellerAmortYears(d.sellerAmortYears);
    setSellerBalloonYears(d.sellerBalloonYears);
    setUseSellerBalloon(d.useSellerBalloon);
    setShowLoadDialog(false);
  };

  const deleteScenario = (index) => {
    setSavedScenarios(savedScenarios.filter((_, i) => i !== index));
  };

  // ---------- Deal Slider ----------
  const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
  const dscrMin = 0.9, dscrMax = 1.6;
  const dealScore = Math.round(clamp(((dscr - dscrMin) / (dscrMax - dscrMin)) * 100, 0, 100));
  let dealVerdict = "Bad deal";
  if (dscr >= 1.55) dealVerdict = "Smoking deal";
  else if (dscr >= 1.35) dealVerdict = "Great";
  else if (dscr >= 1.2) dealVerdict = "Solid";
  else if (dscr >= 1.15) dealVerdict = "Decent";
  else if (dscr >= 1.0) dealVerdict = "Weak";
  const markerLeft = `${dealScore}%`;

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 ${theme.bg}`}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between flex-wrap gap-4">
          <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${theme.accent}`}>
            <Calculator className="w-7 h-7" /> Seller Finance Calculator
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowSaveDialog(true)}
              className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${theme.card} hover:opacity-80`}
            >
              <Save className="w-4 h-4" /> Save
            </button>
            <button
              onClick={() => setShowLoadDialog(true)}
              className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${theme.card} hover:opacity-80`}
            >
              <Upload className="w-4 h-4" /> Load ({savedScenarios.length})
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-2 px-3 py-1 rounded-xl border ${theme.card} hover:opacity-80`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Validation Warnings */}
        {warnings.length > 0 && (
          <div className={`p-4 rounded-xl border ${theme.warning}`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-600 dark:text-amber-400">Input Warnings</div>
                <ul className="text-sm mt-1 space-y-1">
                  {warnings.map((w, i) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Two-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: Inputs */}
          <div className="space-y-8">
            {/* Purchase Info */}
            <section className={`space-y-4 p-6 rounded-2xl ${theme.card}`}>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.accent}`}>
                <Banknote className="w-4 h-4" /> Purchase Info
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Purchase Price"
                  valueRaw={purchasePriceRaw}
                  setValueRaw={setPurchasePriceRaw}
                  min={0}
                />
                <NumberField
                  label="Down Payment"
                  valueRaw={downPaymentRaw}
                  setValueRaw={setDownPaymentRaw}
                  min={0}
                  warning={downPayment > purchasePrice}
                />
                <NumberField
                  label="NOI (Annual)"
                  valueRaw={noiRaw}
                  setValueRaw={setNoiRaw}
                  warning={noi < 0}
                />
              </div>
            </section>

            {/* First / Existing Loan */}
            <section className={`space-y-4 p-6 rounded-2xl ${theme.card}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.accent}`}>
                  <Landmark className="w-4 h-4" /> First / Existing Loan
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <label className={`flex items-center gap-1 ${theme.textMuted}`}>
                    <input
                      type="checkbox"
                      checked={useFirstBalloon}
                      onChange={(e) => setUseFirstBalloon(e.target.checked)}
                    />
                    Balloon
                  </label>
                  <div>
                    <span className={theme.textMuted}>Monthly: </span>
                    <span className={`font-semibold ${theme.accent}`}>${fmt2(first.monthly)}</span>
                  </div>
                </div>
              </div>
              <label className={`flex items-center gap-2 text-sm ${theme.textMuted}`}>
                <input
                  type="checkbox"
                  checked={!useFirstLoan}
                  onChange={(e) => setUseFirstLoan(!e.target.checked)}
                />
                No first loan
              </label>
              {useFirstLoan && (
                <div className="grid grid-cols-2 gap-3">
                  <NumberField
                    label="Balance"
                    valueRaw={firstBalanceRaw}
                    setValueRaw={setFirstBalanceRaw}
                    min={0}
                    warning={firstBalance > purchasePrice}
                  />
                  <RateField label="Rate %" value={firstRate} setValue={setFirstRate} />
                  <label className="text-xs">
                    Amort (yrs)
                    <input
                      value={firstAmortYears}
                      onChange={(e) => setFirstAmortYears(Math.max(1, Number(e.target.value) || 1))}
                      className={`w-full rounded px-2 py-1 ${theme.input}`}
                      type="number"
                      min="1"
                    />
                  </label>
                  {useFirstBalloon && (
                    <label className="text-xs">
                      Balloon (yrs)
                      <input
                        value={firstBalloonYears}
                        onChange={(e) => setFirstBalloonYears(Math.max(1, Number(e.target.value) || 1))}
                        className={`w-full rounded px-2 py-1 ${theme.input}`}
                        type="number"
                        min="1"
                      />
                    </label>
                  )}
                </div>
              )}
            </section>

            {/* Seller Carry Note */}
            <section className={`space-y-4 p-6 rounded-2xl ${theme.card}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.accent}`}>
                  <Banknote className="w-4 h-4" /> Seller Carry Note
                </h3>
                <div className="flex items-center gap-4 text-xs">
                  <label className={`flex items-center gap-1 ${theme.textMuted}`}>
                    <input
                      type="checkbox"
                      checked={useSellerBalloon}
                      onChange={(e) => setUseSellerBalloon(e.target.checked)}
                    />
                    Balloon
                  </label>
                  <div>
                    <span className={theme.textMuted}>Monthly: </span>
                    <span className={`font-semibold ${theme.accent}`}>${fmt2(seller.monthly)}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs">
                  Balance (auto)
                  <input
                    value={"$" + fmt2(sellerBalance)}
                    readOnly
                    className={`w-full rounded px-2 py-1 ${theme.input} opacity-80`}
                  />
                  <span className={`text-[10px] ${theme.textMuted}`}>
                    = Price − Down − First
                  </span>
                </label>
                <label className="text-xs">
                  Structure
                  <select
                    value={sellerMode}
                    onChange={(e) => setSellerMode(e.target.value)}
                    className={`w-full rounded px-2 py-1 ${theme.input}`}
                  >
                    <option value="amortized">Amortized</option>
                    <option value="interestOnly">Interest Only</option>
                    <option value="zeroInterest">0% Principal Only</option>
                  </select>
                </label>
                <RateField label="Rate %" value={sellerRate} setValue={setSellerRate} />
                <label className="text-xs">
                  Amort (yrs)
                  <input
                    value={sellerAmortYears}
                    onChange={(e) => setSellerAmortYears(Math.max(1, Number(e.target.value) || 1))}
                    className={`w-full rounded px-2 py-1 ${theme.input}`}
                    type="number"
                    min="1"
                  />
                </label>
                {useSellerBalloon && (
                  <label className="text-xs">
                    Balloon (yrs)
                    <input
                      value={sellerBalloonYears}
                      onChange={(e) => setSellerBalloonYears(Math.max(1, Number(e.target.value) || 1))}
                      className={`w-full rounded px-2 py-1 ${theme.input}`}
                      type="number"
                      min="1"
                    />
                  </label>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT: Results */}
          <div className="space-y-4">
            {/* Main Results */}
            <div className={`space-y-4 p-6 rounded-2xl ${theme.card}`}>
              <h3 className={`text-lg font-semibold ${theme.accent}`}>Results</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>Total Monthly Debt</div>
                  <div className={`text-xl font-semibold ${theme.accent}`}>${fmt2(totalMonthlyDebt)}</div>
                </div>
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>Total Annual Debt</div>
                  <div className={`text-xl font-semibold ${theme.accent}`}>${fmt2(totalAnnualDebt)}</div>
                </div>
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>Monthly Cash Flow</div>
                  <div className={`text-xl font-semibold ${monthlyCashFlow >= 0 ? theme.accent : "text-rose-500"}`}>
                    ${fmt2(monthlyCashFlow)}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>Annual Cash Flow</div>
                  <div className={`text-xl font-semibold ${annualCashFlow >= 0 ? theme.accent : "text-rose-500"}`}>
                    ${fmt2(annualCashFlow)}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>DSCR</div>
                  <div className={`text-xl font-semibold ${theme.accent}`}>
                    {totalAnnualDebt > 0 ? dscr.toFixed(2) : "—"}
                  </div>
                </div>
              </div>

              {/* DSCR Slider */}
              <div className={`p-4 rounded-xl ${theme.card} mt-4`}>
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className={theme.textMuted}>Bad</span>
                  <span className={theme.textMuted}>Weak</span>
                  <span className={theme.textMuted}>Decent</span>
                  <span className={theme.textMuted}>Solid</span>
                  <span className={theme.textMuted}>Great</span>
                  <span className={theme.textMuted}>Smoking</span>
                </div>
                <div className="relative w-full h-3 rounded-full overflow-hidden mb-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-rose-500 via-yellow-400 to-emerald-500" />
                  <div
                    className="absolute -top-3 left-0"
                    style={{ left: markerLeft, transform: "translateX(-50%)" }}
                  >
                    <div
                      className="w-0 h-0 mx-auto"
                      style={{
                        borderLeft: "6px solid transparent",
                        borderRight: "6px solid transparent",
                        borderBottom: "8px solid white",
                        filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.5))",
                      }}
                    />
                    <div className="w-px h-3 bg-white/80 mx-auto mt-1" />
                  </div>
                </div>
                <div className="flex justify-center text-xs font-semibold mt-1">
                  <span className={`${dealScore >= 60 ? "text-emerald-400" : dealScore >= 40 ? "text-yellow-400" : "text-rose-400"}`}>
                    {dealVerdict} (DSCR: {totalAnnualDebt > 0 ? dscr.toFixed(2) : "—"})
                  </span>
                </div>
                <p className={`text-xs mt-3 flex items-start gap-2 ${theme.textMuted}`}>
                  <Info className={`w-4 h-4 ${theme.accent}`} /> If DSCR &lt; 1.20, consider adjusting rate or amortization.
                </p>
              </div>

              {/* Balloon balances */}
              {(useFirstBalloon || useSellerBalloon) && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  {useFirstBalloon && (
                    <div className={`p-3 rounded-xl ${theme.card}`}>
                      <div className={theme.textMuted}>First Loan @ {firstBalloonYears}yr</div>
                      <div className={`text-lg font-semibold ${theme.accent}`}>${fmt2(first.balAtBalloon)}</div>
                    </div>
                  )}
                  {useSellerBalloon && (
                    <div className={`p-3 rounded-xl ${theme.card}`}>
                      <div className={theme.textMuted}>Seller Note @ {sellerBalloonYears}yr</div>
                      <div className={`text-lg font-semibold ${theme.accent}`}>${fmt2(seller.balAtBalloon)}</div>
                    </div>
                  )}
                  <div className={`p-3 rounded-xl ${theme.card}`}>
                    <div className={theme.textMuted}>Total Balloon Payoff</div>
                    <div className={`text-lg font-semibold ${theme.accent}`}>
                      ${fmt2((useFirstBalloon ? first.balAtBalloon : 0) + (useSellerBalloon ? seller.balAtBalloon : 0))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Enhanced Metrics */}
            <div className={`space-y-4 p-6 rounded-2xl ${theme.card}`}>
              <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.accent}`}>
                <TrendingUp className="w-4 h-4" /> Enhanced Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>Cap Rate</div>
                  <div className={`text-xl font-semibold ${theme.accent}`}>{capRate.toFixed(2)}%</div>
                  <div className={`text-xs ${theme.textMuted}`}>NOI ÷ Price</div>
                </div>
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>Cash-on-Cash</div>
                  <div className={`text-xl font-semibold ${cocReturn >= 0 ? theme.accent : "text-rose-500"}`}>
                    {cocReturn.toFixed(2)}%
                  </div>
                  <div className={`text-xs ${theme.textMuted}`}>Cash Flow ÷ Down</div>
                </div>
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>Total LTV</div>
                  <div className={`text-xl font-semibold ${theme.accent}`}>{totalLTV.toFixed(1)}%</div>
                  <div className={`text-xs ${theme.textMuted}`}>All Loans ÷ Price</div>
                </div>
                <div className={`p-3 rounded-xl ${theme.card}`}>
                  <div className={theme.textMuted}>First LTV</div>
                  <div className={`text-xl font-semibold ${theme.accent}`}>{firstLTV.toFixed(1)}%</div>
                  <div className={`text-xs ${theme.textMuted}`}>First Loan ÷ Price</div>
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div className={`space-y-4 p-6 rounded-2xl ${theme.card}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold flex items-center gap-2 ${theme.accent}`}>
                  <Calendar className="w-4 h-4" /> Payment Schedule
                </h3>
                <button
                  onClick={() => setShowSchedule(!showSchedule)}
                  className={`text-xs px-3 py-1 rounded-lg ${theme.input} hover:opacity-80`}
                >
                  {showSchedule ? "Hide" : "Show First Year"}
                </button>
              </div>
              
              {showSchedule && (
                <div className="space-y-4">
                  {useFirstLoan && firstSchedule.length > 0 && (
                    <div>
                      <div className={`text-sm font-semibold mb-2 ${theme.accent}`}>First Loan</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className={theme.textMuted}>
                              <th className="text-left p-1">Month</th>
                              <th className="text-right p-1">Payment</th>
                              <th className="text-right p-1">Principal</th>
                              <th className="text-right p-1">Interest</th>
                              <th className="text-right p-1">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {firstSchedule.map((row) => (
                              <tr key={row.month} className="border-t border-slate-700">
                                <td className="p-1">{row.month}</td>
                                <td className="text-right p-1">${fmt2(row.payment)}</td>
                                <td className="text-right p-1">${fmt2(row.principal)}</td>
                                <td className="text-right p-1">${fmt2(row.interest)}</td>
                                <td className="text-right p-1">${fmt2(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {sellerBalance > 0 && sellerSchedule.length > 0 && (
                    <div>
                      <div className={`text-sm font-semibold mb-2 ${theme.accent}`}>Seller Note</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className={theme.textMuted}>
                              <th className="text-left p-1">Month</th>
                              <th className="text-right p-1">Payment</th>
                              <th className="text-right p-1">Principal</th>
                              <th className="text-right p-1">Interest</th>
                              <th className="text-right p-1">Balance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sellerSchedule.map((row) => (
                              <tr key={row.month} className="border-t border-slate-700">
                                <td className="p-1">{row.month}</td>
                                <td className="text-right p-1">${fmt2(row.payment)}</td>
                                <td className="text-right p-1">${fmt2(row.principal)}</td>
                                <td className="text-right p-1">${fmt2(row.interest)}</td>
                                <td className="text-right p-1">${fmt2(row.balance)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {sellerMode !== "amortized" && sellerBalance > 0 && (
                    <div className={`text-xs ${theme.textMuted} italic`}>
                      {sellerMode === "interestOnly" 
                        ? "Interest-only payments shown. Principal due at balloon or maturity."
                        : "0% interest - principal-only payments. No interest charged."}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full p-6 rounded-2xl ${theme.card}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme.accent}`}>Save Scenario</h3>
            <input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Enter scenario name..."
              className={`w-full rounded px-3 py-2 mb-4 ${theme.input}`}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className={`px-4 py-2 rounded-lg ${theme.input} hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={saveScenario}
                disabled={!scenarioName.trim()}
                className={`px-4 py-2 rounded-lg ${theme.accent} bg-emerald-600 text-white hover:opacity-80 disabled:opacity-50`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full max-h-[80vh] overflow-auto p-6 rounded-2xl ${theme.card}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme.accent}`}>Load Scenario</h3>
            {savedScenarios.length === 0 ? (
              <p className={`text-sm ${theme.textMuted} mb-4`}>No saved scenarios yet.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {savedScenarios.map((scenario, idx) => (
                  <div key={idx} className={`p-4 rounded-xl ${theme.card} hover:opacity-80`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-semibold">{scenario.name}</div>
                        <div className={`text-xs ${theme.textMuted}`}>{scenario.date}</div>
                        <div className="text-xs mt-2 grid grid-cols-2 gap-2">
                          <div>DSCR: <span className={theme.accent}>{scenario.results.dscr.toFixed(2)}</span></div>
                          <div>Cap Rate: <span className={theme.accent}>{scenario.results.capRate.toFixed(2)}%</span></div>
                          <div>CoC: <span className={theme.accent}>{scenario.results.cocReturn.toFixed(2)}%</span></div>
                          <div>LTV: <span className={theme.accent}>{scenario.results.totalLTV.toFixed(1)}%</span></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadScenario(scenario)}
                          className={`px-3 py-1 rounded-lg text-xs ${theme.input} hover:opacity-80`}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteScenario(idx)}
                          className="px-3 py-1 rounded-lg text-xs bg-rose-600 text-white hover:opacity-80"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadDialog(false)}
              className={`w-full px-4 py-2 rounded-lg ${theme.input} hover:opacity-80`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
