"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Brain,
  Zap,
  Upload,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Crosshair,
  Server,
  ServerOff,
  Database,
  Network,
  ChevronDown
} from "lucide-react"
import { RiskGauge } from "./risk-gauge"
import { FactorBars } from "./factor-bars"
import { supabaseClient } from "@/lib/supabase/client"

/* ───── Types ───── */
interface ModelMeta {
  model_type: string
  n_features: number
  best_iteration: number
  metrics: {
    val: { accuracy: number; roc_auc: number; f1: number }
    test: { accuracy: number; roc_auc: number; f1: number }
  }
  top_features: Record<string, number>
  classes: Record<string, string>
  training_rows: number
}

interface PredictionResult {
  risk_label: string
  risk_score: number
  confidence: number
  top_factors: Record<string, number>
}

interface FormOptions {
  payment_type: string[]
  shipping_mode: string[]
  customer_segment: string[]
  market: string[]
  order_region: string[]
  department_name: string[]
  order_status: string[]
  category_name: string[]
  days_scheduled: number[]
}

const DEFAULT_ORDER = {
  Type: "DEBIT",
  shipping_mode: "Standard Class",
  days_scheduled: 4,
  customer_segment: "Consumer",
  market: "USCA",
  order_region: "East of USA",
  order_country: "United States",
  order_city: "Chicago",
  order_status: "COMPLETE",
  department_name: "Fan Shop",
  category_name: "Clothing",
  product_name: "Nike Men's Dri-FIT Victory Golf Polo",
  order_item_discount_rate: 0.0,
  order_item_product_price: 49.99,
  order_item_quantity: 1,
  order_profit_per_order: 15.0,
  sales_per_customer: 150.0,
  benefit_per_order: 20.0,
  order_item_total: 49.99,
  order_item_discount: 0.0,
  order_item_profit_ratio: 0.3,
  sales: 49.99,
  latitude: 41.85,
  longitude: -87.65,
  customer_state: "IL",
  customer_city: "Chicago",
  order_date: "2016-06-15 10:00:00",
  order_state: "IL",
}

export default function RiskPredictionPage() {
  const [meta, setMeta] = useState<ModelMeta | null>(null)
  const [options, setOptions] = useState<FormOptions | null>(null)
  const [apiOnline, setApiOnline] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [predicting, setPredicting] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [form, setForm] = useState(DEFAULT_ORDER)
  const [error, setError] = useState<string | null>(null)
  
  const [supplyChains, setSupplyChains] = useState<any[]>([])
  const [selectedChainId, setSelectedChainId] = useState<string>('')

  const fetchSupplyChains = useCallback(async () => {
    try {
      const { data } = await supabaseClient
        .from('supply_chains')
        .select('*')
        .order('timestamp', { ascending: false });
      if (data) setSupplyChains(data);
    } catch (err) {
      console.error("Failed to load supply chains:", err);
    }
  }, []);

  useEffect(() => {
    fetchSupplyChains();
  }, [fetchSupplyChains]);

  useEffect(() => {
    if (!selectedChainId) return;
    const sc = supplyChains.find(s => s.supply_chain_id === selectedChainId);
    if (!sc) return;

    const newForm = { ...form };
    const name = sc.name.toLowerCase();
    
    if (!options) return;
    
    if (name.includes("lpg") || name.includes("iran") || name.includes("energy")) {
       newForm.shipping_mode = options.shipping_mode?.includes("Standard Class") ? "Standard Class" : options.shipping_mode[0];
       newForm.days_scheduled = 5;
       newForm.customer_segment = options.customer_segment?.includes("Corporate") ? "Corporate" : options.customer_segment[0];
       newForm.market = options.market?.includes("Asia Pacific") ? "Asia Pacific" : options.market[0];
       newForm.order_region = options.order_region?.includes("South Asia") ? "South Asia" : options.order_region[0];
       newForm.order_item_product_price = 850.0;
       newForm.product_name = sc.name;
       newForm.benefit_per_order = 5000;
       newForm.sales_per_customer = 25000;
       newForm.order_status = options.order_status?.includes("PENDING") ? "PENDING" : options.order_status[0];
    } else {
       const fd = sc.form_data || {};
       newForm.product_name = sc.name;
       
       const industry = ((fd.industry || "") as string).toLowerCase();
       const customInd = ((fd.customIndustry || "") as string).toLowerCase();
       const fullInd = industry + " " + customInd;
       
       if (fullInd.includes("tech") || fullInd.includes("electronic")) {
         newForm.department_name = options?.department_name?.includes("Technology") ? "Technology" : (options?.department_name?.[0] || "Fan Shop");
         newForm.category_name = options?.category_name?.includes("Accessories") ? "Accessories" : (options?.category_name?.[0] || "Clothing");
         newForm.order_item_product_price = 350.0;
       } else if (fullInd.includes("health") || fullInd.includes("pharma")) {
         newForm.department_name = options?.department_name?.includes("Health and Beauty") ? "Health and Beauty" : (options?.department_name?.[0] || "Fan Shop");
         newForm.category_name = options?.category_name?.includes("Medical") ? "Medical" : (options?.category_name?.[0] || "Clothing");
         newForm.order_item_product_price = 120.0; 
       } else if (fullInd.includes("food") || fullInd.includes("agri")) {
         newForm.department_name = options?.department_name?.includes("Book Shop") ? "Book Shop" : (options?.department_name?.[0] || "Fan Shop");
         newForm.category_name = options?.category_name?.includes("Books ") ? "Books " : (options?.category_name?.[0] || "Clothing");
         newForm.order_item_product_price = 45.0;
       } else if (fullInd.includes("auto") || fullInd.includes("vehicle")) {
         newForm.department_name = options?.department_name?.includes("Outdoors") ? "Outdoors" : (options?.department_name?.[0] || "Fan Shop");
         newForm.category_name = options?.category_name?.includes("Electronics") ? "Electronics" : (options?.category_name?.[0] || "Clothing");
         newForm.order_item_product_price = 1500.0;
       } else {
         newForm.department_name = options?.department_name?.[0] || "Fan Shop";
         newForm.category_name = options?.category_name?.[0] || "Clothing";
         newForm.order_item_product_price = 100.0;
       }

       const shipMethods = fd.shippingMethods || [];
       const shipStr = Array.isArray(shipMethods) ? shipMethods.join(" ").toLowerCase() : String(shipMethods).toLowerCase();
       
       if (shipStr.includes("air")) {
         newForm.shipping_mode = "First Class";
         newForm.days_scheduled = 2;
       } else if (shipStr.includes("sea") || shipStr.includes("ocean")) {
         newForm.shipping_mode = "Standard Class";
         newForm.days_scheduled = 4;
       } else if (shipStr.includes("rail") || shipStr.includes("truck")) {
         newForm.shipping_mode = "Second Class";
         newForm.days_scheduled = 3;
       } else {
         newForm.shipping_mode = "Standard Class";
       }

       const risks = Array.isArray(fd.risks) ? fd.risks : [];
       if (risks.length >= 3) {
         newForm.order_status = options?.order_status?.includes("PENDING") ? "PENDING" : "COMPLETE";
         newForm.days_scheduled += 2;
       } else {
         newForm.order_status = options?.order_status?.includes("COMPLETE") ? "COMPLETE" : "COMPLETE";
       }

       const regionStr = String(fd.operationsLocation || "").toLowerCase() + " " + String(fd.country || "").toLowerCase();
       if (regionStr.includes("us") || regionStr.includes("america") || regionStr.includes("canada")) {
         newForm.market = "USCA";
         newForm.order_region = options?.order_region?.includes("East of USA") ? "East of USA" : "East of USA";
       } else if (regionStr.includes("europe") || regionStr.includes("uk") || regionStr.includes("germany")) {
         newForm.market = "Europe";
         newForm.order_region = options?.order_region?.includes("Western Europe") ? "Western Europe" : "Western Europe";
       } else if (regionStr.includes("asia") || regionStr.includes("india") || regionStr.includes("china")) {
         newForm.market = "Asia Pacific";
         newForm.order_region = options?.order_region?.includes("South Asia") ? "South Asia" : "South Asia";
       } else {
         newForm.market = "USCA";
         newForm.order_region = "East of USA";
       }

       const vol = Number(fd.annualVolumeValue) || 1000;
       newForm.benefit_per_order = vol > 50000 ? 500 : 50;
       newForm.sales_per_customer = newForm.order_item_product_price * (newForm.order_item_quantity || 1) * 1.5;
     }
    
    setForm(newForm);
  }, [selectedChainId, supplyChains, options]);

  const fetchMeta = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/risk-prediction")
      if (!res.ok) throw new Error("API unavailable")
      const data = await res.json()
      setMeta(data.meta)
      setOptions(data.options)
      setApiOnline(true)
    } catch {
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMeta() }, [fetchMeta])

  const handlePredict = async () => {
    setPredicting(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch("/api/risk-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Prediction failed")
      }
      setResult(await res.json())
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPredicting(false)
    }
  }

  const setField = (k: string, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }))

  return (
    <div className="relative min-h-full flex-1 bg-theme-bg-primary overflow-y-auto text-theme-text-primary">
      {/* Header */}
      <div className="border-b border-theme-border-subtle bg-theme-bg-surface/50 backdrop-blur-[8px] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-theme-amber/20 rounded-xl blur-sm" />
            <div className="relative bg-gradient-to-br from-theme-amber to-theme-amber/90 p-2 rounded-theme-md shadow-sm">
              <Brain className="h-5 w-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-theme-text-primary">
              Supply Chain Risk Prediction
            </h1>
            <p className="text-xs text-theme-text-secondary mt-0.5">
              XGBoost ML Model — Delivery risk classification
            </p>
          </div>
        </div>

        {/* API Status badge */}
        <div className="flex items-center gap-2">
          {apiOnline === null ? (
            <Loader2 className="w-4 h-4 animate-spin text-theme-text-muted" />
          ) : apiOnline ? (
            <>
              <Server className="w-4 h-4 text-theme-green" />
              <span className="text-xs text-theme-green font-[600]">
                Model Online
              </span>
            </>
          ) : (
            <>
              <ServerOff className="w-4 h-4 text-theme-red animate-pulse" />
              <span className="text-xs text-theme-red font-[600]">
                FastAPI Offline
              </span>
            </>
          )}
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Model Overview Cards */}
        {meta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
          >
            <MetricCard
              icon={<Crosshair className="w-4 h-4" />}
              label="ROC-AUC"
              value={meta.metrics.test.roc_auc.toFixed(3)}
              color="text-theme-blue"
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="Accuracy"
              value={`${(meta.metrics.test.accuracy * 100).toFixed(1)}%`}
              color="text-theme-green"
            />
            <MetricCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Features"
              value={String(meta.n_features)}
              color="text-purple-500"
            />
            <MetricCard
              icon={<Zap className="w-4 h-4" />}
              label="Training Rows"
              value={meta.training_rows.toLocaleString()}
              color="text-theme-amber"
            />
          </motion.div>
        )}

        {/* Main Grid: Form + Results */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Prediction Form (3 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-6 shadow-sm flex flex-col"
          >
            {/* Digital Twin Selector */}
            <div className="mb-6 p-4 rounded-theme-md border border-theme-blue/20 bg-theme-blue-soft/50">
              <h2 className="text-sm font-bold mb-3 flex items-center gap-2 text-theme-blue">
                <Network className="w-4 h-4" />
                Select Digital Twin Data Source
              </h2>
              <div className="relative">
                <select
                  value={selectedChainId}
                  onChange={(e) => setSelectedChainId(e.target.value)}
                  className="w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary px-3 py-2.5 text-xs font-[600] focus:outline-none focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="">— Use Default Synthetic Data —</option>
                  {supplyChains.map((sc) => (
                    <option key={sc.supply_chain_id} value={sc.supply_chain_id}>
                      {sc.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-text-muted">
                  <Database className="w-4 h-4 opacity-50" />
                </div>
              </div>
              <p className="mt-2.5 text-xs text-theme-text-secondary">
                Selecting a twin will auto-map its attributes and network features to the ML dataset schema below.
              </p>
            </div>

            <h2 className="text-sm font-bold mb-5 flex items-center gap-2 pt-2 border-t border-theme-border-subtle/50 text-theme-text-primary">
              <Zap className="w-4 h-4 text-theme-amber" />
              Order Parameters Filter
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Dropdowns */}
              <SelectField
                label="Shipping Mode"
                value={form.shipping_mode}
                options={options?.shipping_mode ?? ["Standard Class"]}
                onChange={(v) => setField("shipping_mode", v)}
              />
              <SelectField
                label="Days Scheduled"
                value={String(form.days_scheduled)}
                options={(options?.days_scheduled ?? [1,2,3,4]).map(String)}
                onChange={(v) => setField("days_scheduled", Number(v))}
              />
              <SelectField
                label="Customer Segment"
                value={form.customer_segment}
                options={options?.customer_segment ?? ["Consumer"]}
                onChange={(v) => setField("customer_segment", v)}
              />
              <SelectField
                label="Market"
                value={form.market}
                options={options?.market ?? ["USCA"]}
                onChange={(v) => setField("market", v)}
              />
              <SelectField
                label="Order Region"
                value={form.order_region}
                options={options?.order_region ?? ["East of USA"]}
                onChange={(v) => setField("order_region", v)}
              />
              <SelectField
                label="Order Status"
                value={form.order_status}
                options={options?.order_status ?? ["COMPLETE"]}
                onChange={(v) => setField("order_status", v)}
              />
              <SelectField
                label="Department"
                value={form.department_name}
                options={options?.department_name ?? ["Fan Shop"]}
                onChange={(v) => setField("department_name", v)}
              />
              <SelectField
                label="Category"
                value={form.category_name}
                options={options?.category_name ?? ["Clothing"]}
                onChange={(v) => setField("category_name", v)}
              />
              <SelectField
                label="Payment Type"
                value={form.Type}
                options={options?.payment_type ?? ["DEBIT"]}
                onChange={(v) => setField("Type", v)}
              />

              {/* Numeric inputs */}
              <NumberField
                label="Item Price ($)"
                value={form.order_item_product_price}
                onChange={(v) => setField("order_item_product_price", v)}
              />
              <NumberField
                label="Quantity"
                value={form.order_item_quantity}
                onChange={(v) => setField("order_item_quantity", v)}
                step={1}
                min={1}
                max={5}
              />
              <NumberField
                label="Discount Rate"
                value={form.order_item_discount_rate}
                onChange={(v) => setField("order_item_discount_rate", v)}
                step={0.01}
                min={0}
                max={1}
              />
              <NumberField
                label="Profit / Order ($)"
                value={form.order_profit_per_order}
                onChange={(v) => setField("order_profit_per_order", v)}
              />
              <NumberField
                label="Sales / Customer ($)"
                value={form.sales_per_customer}
                onChange={(v) => setField("sales_per_customer", v)}
              />
              <NumberField
                label="Benefit / Order ($)"
                value={form.benefit_per_order}
                onChange={(v) => setField("benefit_per_order", v)}
              />
            </div>

            {/* Product name */}
            <div className="mt-4">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-text-muted mb-1.5">
                Product Name
              </label>
              <input
                type="text"
                value={form.product_name}
                onChange={(e) => setField("product_name", e.target.value)}
                className="w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue transition-all duration-200"
              />
            </div>

            {/* Predict button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePredict}
              disabled={predicting || !apiOnline}
              className="mt-6 w-full relative inline-flex items-center justify-center gap-2 rounded-theme-md bg-theme-text-primary hover:bg-theme-text-primary/95 px-6 py-3 text-xs font-bold uppercase tracking-[0.05em] text-theme-bg-primary shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border-none outline-none focus:outline-none"
            >
              {predicting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {predicting ? "Analyzing…" : "Predict Delivery Risk"}
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 p-3 rounded-theme-md bg-theme-red/10 border border-theme-red/20 text-theme-red text-xs flex items-center gap-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* RIGHT: Results Panel (2 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 rounded-theme-lg border border-theme-border-subtle bg-theme-bg-surface p-6 flex flex-col items-center shadow-sm"
          >
            <h2 className="text-sm font-bold mb-6 flex items-center gap-2 self-start text-theme-text-primary">
              <ShieldCheck className="w-4 h-4 text-theme-green" />
              Prediction Result
            </h2>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="w-full flex flex-col items-center gap-8"
                >
                  <RiskGauge
                    score={result.risk_score}
                    label={result.risk_label}
                    confidence={result.confidence}
                  />

                  <div className="w-full border-t border-theme-border-subtle/50 pt-6">
                    <FactorBars factors={result.top_factors} />
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-16 text-theme-text-muted/60"
                >
                  <Brain className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm font-bold text-theme-text-primary">No prediction yet</p>
                  <p className="text-xs mt-1 text-theme-text-secondary">
                    Fill in the order details and click predict
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ Sub-components ═══════════════════════ */

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center gap-2">
        <span className={color}>{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider text-theme-text-muted">
          {label}
        </span>
      </div>
      <span className="text-2xl font-extrabold tracking-tight text-theme-text-primary">{value}</span>
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-text-muted mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue transition-all duration-200 appearance-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-theme-text-muted">
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </div>
      </div>
    </div>
  )
}

function NumberField({
  label,
  value,
  onChange,
  step = 0.01,
  min,
  max,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
}) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-theme-text-muted mb-1.5">
        {label}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-theme-md border border-theme-border-subtle bg-theme-bg-surface text-theme-text-primary px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-theme-blue/30 focus:border-theme-blue transition-all duration-200"
      />
    </div>
  )
}
