"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Building2, CalendarDays, Clock3, FileText, Gift, Pencil, Plus, Search, ShieldAlert, ShieldX, Trash2, TriangleAlert, UserRound, X } from "lucide-react";

import {
  createDepartment,
  createDesignation,
  createSetupOption,
  createShift,
  deleteDepartment,
  deleteDesignation,
  deleteSetupOption,
  deleteShift,
  getBranches,
  getDepartments,
  getDesignations,
  getSetupOptions,
  getShifts,
  updateDepartment,
  updateDesignation,
  updateSetupOption,
  updateShift,
} from "@/lib/api/hrmSetupApi";
import { colorPalette, colorValueFromText, initials, toneFromColor } from "@/components/hrm/hrmUi";
import {
  getApiErrorMessage,
  hasUnsafeInput,
  safeCodeRegex,
  safeNameRegex,
  safeTextRegex,
} from "@/components/hrm/hrmValidation";

const sections = [
  { id: "branches", label: "Branches", group: "Organization", icon: Building2, readOnly: true, description: "Physical locations where your business operates." },
  { id: "departments", label: "Departments", group: "Organization", icon: Building2, description: "Functional units employees are organized into." },
  { id: "designations", label: "Designations", group: "Organization", icon: Gift, description: "Job titles assigned to employees." },
  { id: "employment-types", label: "Employment Types", group: "People", icon: UserRound, description: "How working arrangements are classified." },
  { id: "shifts", label: "Shifts", group: "People", icon: Clock3, description: "Working-hour patterns assigned to employees." },
  { id: "document-types", label: "Document Types", group: "People", icon: FileText, description: "Documents required from employees." },
  { id: "award-types", label: "Award Types", group: "People", icon: Gift, description: "Recognition categories for employees." },
  { id: "termination-types", label: "Termination Types", group: "People", icon: ShieldX, description: "Termination reason categories." },
  { id: "warning-types", label: "Warning Types", group: "People", icon: TriangleAlert, description: "Warning categories for disciplinary tracking." },
  { id: "complaint-types", label: "Complaint Types", group: "People", icon: ShieldAlert, description: "Complaint categories for HR records." },
  { id: "holiday-types", label: "Holiday Types", group: "People", icon: CalendarDays, description: "Holiday categories for calendars." },
];

const blankForm = { name: "", code: "", branch_id: "", department_id: "", head_name: "", level: "", color: colorPalette[0].value, description: "", is_required: false, is_active: true, start_time: "", end_time: "", break_minutes: "0" };

const fallbackBranches = [
  { id: 1, name: "Head Office", type: "Head Office", city: "Colombo", employee_count: 0, status: "active", color: "#0B5CAB" },
  { id: 2, name: "Kandy Branch", type: "Branch", city: "Kandy", employee_count: 0, status: "active", color: "#155DFC" },
  { id: 3, name: "Galle Branch", type: "Branch", city: "Galle", employee_count: 0, status: "active", color: "#0F766E" },
];

export default function SystemSetupManager() {
  const [activeSection, setActiveSection] = useState("branches");
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");

  const section = useMemo(() => sections.find((item) => item.id === activeSection) || sections[0], [activeSection]);
  const isDocumentType = activeSection === "document-types";

  const filteredRecords = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return records;
    return records.filter((record) => recordSearchText(record).includes(value));
  }, [records, query]);

  useEffect(() => {
    loadRecords(activeSection);
  }, [activeSection]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!modalOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [modalOpen]);

  async function loadRecords(sectionId = activeSection) {
    setLoading(true);
    setError("");
    setRecords([]);
    setQuery("");
    try {
      const departmentList = await getDepartments(false).catch(() => []);
      if (departmentList.length) setDepartments(departmentList);

      if (sectionId === "branches") {
        const branchList = await getBranches().catch(() => []);
        setRecords(normalizeBranches(branchList.length ? branchList : fallbackBranches));
      }
      else if (sectionId === "departments") setRecords(departmentList);
      else if (sectionId === "designations") setRecords(await getDesignations());
      else if (sectionId === "shifts") setRecords(await getShifts(false));
      else setRecords(await getSetupOptions(sectionId, false));
    } catch (err) {
      setRecords([]);
      setError(err.message || "Unable to load setup data");
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setEditing(null);
    setForm({ ...blankForm, color: colorPalette[records.length % colorPalette.length].value });
    setModalOpen(true);
  }

  function startEdit(record) {
    setEditing(record);
    setForm({
      ...blankForm,
      name: record.name || "",
      code: record.code || "",
      department_id: record.department_id || "",
      head_name: record.head_name || "",
      level: record.level || "",
      color: record.color || colorValueFromText(record.name),
      description: record.description || "",
      is_required: Boolean(record.is_required),
      is_active: record.is_active !== false,
      start_time: record.start_time?.slice(0, 5) || "",
      end_time: record.end_time?.slice(0, 5) || "",
      break_minutes: String(record.break_minutes ?? 0),
    });
    setModalOpen(true);
  }

  async function saveRecord(event) {
    event.preventDefault();
    setError("");
    const validationMessage = validateSetupForm(activeSection, form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setSaving(true);
    try {
      if (activeSection === "departments") {
        const payload = basePayload({ head_name: clean(form.head_name), color: form.color });
        editing ? await updateDepartment(editing.id, payload) : await createDepartment(payload);
      } else if (activeSection === "designations") {
        const payload = basePayload({ department_id: form.department_id || null, level: clean(form.level), color: form.color });
        editing ? await updateDesignation(editing.id, payload) : await createDesignation(payload);
      } else if (activeSection === "shifts") {
        const payload = {
          name: form.name.trim(),
          code: clean(form.code),
          start_time: form.start_time || null,
          end_time: form.end_time || null,
          break_minutes: Number(form.break_minutes || 0),
          color: form.color,
          description: clean(form.description),
          is_active: form.is_active,
        };
        editing ? await updateShift(editing.id, payload) : await createShift(payload);
      } else {
        const payload = basePayload({ color: form.color, is_required: isDocumentType ? form.is_required : undefined });
        editing ? await updateSetupOption(activeSection, editing.id, payload) : await createSetupOption(activeSection, payload);
      }
      setModalOpen(false);
      setEditing(null);
      setForm(blankForm);
      await loadRecords(activeSection);
    } catch (err) {
      setError(getApiErrorMessage(err, "Unable to save setup data"));
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(record) {
    if (!window.confirm(`Remove ${record.name}? Used records will be made inactive safely.`)) return;
    setError("");
    try {
      if (activeSection === "departments") await deleteDepartment(record.id);
      else if (activeSection === "designations") await deleteDesignation(record.id);
      else if (activeSection === "shifts") await deleteShift(record.id);
      else await deleteSetupOption(activeSection, record.id);
      await loadRecords(activeSection);
    } catch (err) {
      setError(err.message || "Unable to remove setup data");
    }
  }

  function basePayload(extra = {}) {
    return {
      name: form.name.trim(),
      code: clean(form.code),
      description: clean(form.description),
      is_active: form.is_active,
      ...Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== undefined)),
    };
  }

  const departmentOptions = departments;
  const columns = getColumns(activeSection);
  const groupedSections = groupSections(sections);
  const ActiveIcon = section.icon;

  return (
    <div className="min-w-0 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-gray-950">System Setup</h1>
        <p className="mt-1 text-sm text-gray-500">Configure organization structure, people and finance settings.</p>
      </header>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="min-w-0 rounded-lg border border-gray-200 bg-white p-3 shadow-sm xl:self-start">
          <div className="flex gap-2 overflow-x-auto xl:block xl:space-y-5 xl:overflow-visible">
            {Object.entries(groupedSections).map(([group, items]) => (
              <div key={group} className="shrink-0 xl:shrink">
                <p className="mb-2 hidden px-2 text-xs font-bold uppercase tracking-wide text-gray-400 xl:block">{group}</p>
                <div className="flex gap-2 xl:block xl:space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const count = item.id === activeSection ? records.length : "";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveSection(item.id)}
                        className={`flex min-w-max items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold transition xl:w-full ${activeSection === item.id ? "bg-accdoo-blueSoft text-accdoo-blue" : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"}`}
                      >
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${activeSection === item.id ? "bg-accdoo-blue text-white" : "bg-gray-50 text-gray-500"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {count !== "" ? <span className="rounded-full bg-white px-2 py-0.5 text-xs text-gray-500">{count}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accdoo-blueSoft text-accdoo-blue">
                <ActiveIcon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-950">{section.label}</h2>
                <p className="text-sm text-gray-500">{section.description}</p>
              </div>
            </div>
            {!section.readOnly ? (
              <button type="button" onClick={openNew} className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accdoo-blue px-4 text-sm font-semibold text-white shadow-sm hover:bg-accdoo-blueDark">
                <Plus className="h-4 w-4" />
                Add {singularLabel(section.label)}
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${section.label.toLowerCase()}...`} className="h-10 w-full rounded-md border border-gray-300 bg-gray-50 pl-9 pr-3 text-sm outline-none focus:border-accdoo-blue focus:bg-white focus:ring-2 focus:ring-accdoo-blue/10" />
            </label>
          </div>

          {error ? <div className="mx-4 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed text-sm">
              <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wide text-gray-400">
                <tr>{columns.map((column) => <th key={column.key} className={`${column.width} px-4 py-3 ${column.key === "actions" ? "text-right" : ""}`}>{column.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td className="px-4 py-10 text-center text-gray-500" colSpan={columns.length}>Loading setup data...</td></tr>
                ) : filteredRecords.length ? filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50/80">
                    {columns.map((column) => (
                      <td key={column.key} className={`px-4 py-3 align-middle ${column.key === "actions" ? "text-right" : "text-gray-700"}`}>
                        <SetupCell record={record} column={column} sectionId={activeSection} onEdit={startEdit} onDelete={removeRecord} />
                      </td>
                    ))}
                  </tr>
                )) : (
                  <tr><td className="px-4 py-12 text-center text-gray-500" colSpan={columns.length}>No setup records found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-500">Showing {filteredRecords.length} of {records.length} {section.label.toLowerCase()}</div>
        </section>
      </div>

      {mounted && modalOpen ? createPortal(
        <SetupModal
          section={section}
          activeSection={activeSection}
          form={form}
          setForm={setForm}
          departmentOptions={departmentOptions}
          editing={editing}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSubmit={saveRecord}
        />,
        document.body
      ) : null}
    </div>
  );
}

function normalizeBranches(branches) {
  return branches.map((branch) => ({
    ...branch,
    type: branch.type || branch.branch_type || "Branch",
    status: branch.status || (branch.is_active === false ? "inactive" : "active"),
    employee_count: branch.employee_count ?? branch.employeeCount ?? 0,
  }));
}

function validateSetupForm(activeSection, form) {
  const name = form.name.trim();
  if (!name) return "Name is required.";
  if (name.length > 120) return "This value is too long.";
  if (hasUnsafeInput(name) || !safeTextRegex.test(name)) return "Name contains unsupported characters.";

  if (form.code && (hasUnsafeInput(form.code) || !safeCodeRegex.test(form.code.trim()))) {
    return "Code contains unsupported characters.";
  }

  if (form.head_name && (hasUnsafeInput(form.head_name) || !safeNameRegex.test(form.head_name.trim()))) {
    return "Head name contains unsupported characters.";
  }

  if (form.level && (hasUnsafeInput(form.level) || !safeTextRegex.test(form.level.trim()))) {
    return "Level contains unsupported characters.";
  }

  if (form.description && (form.description.length > 500 || hasUnsafeInput(form.description))) {
    return "Description contains unsupported characters or is too long.";
  }

  if (activeSection === "shifts" && form.start_time && form.end_time && form.start_time === form.end_time) {
    return "Shift start and end time cannot be the same.";
  }

  return "";
}

function SetupModal({ section, activeSection, form, setForm, departmentOptions, editing, saving, onClose, onSubmit }) {
  const isDocumentType = activeSection === "document-types";
  const needsDescription = activeSection !== "branches";
  return (
    <div className="fixed inset-0 z-[100] flex min-h-dvh items-center justify-center bg-gray-950/60 p-4 sm:p-6">
      <form onSubmit={onSubmit} className="flex max-h-[calc(100dvh-48px)] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-black/10">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-950">{editing ? "Edit" : "Create"} {singularLabel(section.label)}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
          <ModalInput label={isDocumentType ? "Document Name" : "Name"} required value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
          {activeSection !== "document-types" ? <ModalInput label="Code" value={form.code} onChange={(value) => setForm((current) => ({ ...current, code: value.replace(/[^A-Za-z0-9-]/g, "") }))} /> : null}
          {activeSection === "departments" ? <ModalInput label="Head" value={form.head_name} onChange={(value) => setForm((current) => ({ ...current, head_name: value.replace(/[^A-Za-z ]/g, "") }))} /> : null}
          {activeSection === "designations" ? (
            <>
              <ModalSelect label="Department" value={form.department_id} onChange={(value) => setForm((current) => ({ ...current, department_id: value }))}>
                <option value="">Select Department</option>
                {departmentOptions.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
              </ModalSelect>
              <ModalInput label="Level" value={form.level} onChange={(value) => setForm((current) => ({ ...current, level: value.replace(/[^A-Za-z0-9 ]/g, "") }))} placeholder="Junior, Mid, Senior, Management" />
            </>
          ) : null}
          {activeSection === "shifts" ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <ModalInput label="Start" type="time" value={form.start_time} onChange={(value) => setForm((current) => ({ ...current, start_time: value }))} />
              <ModalInput label="End" type="time" value={form.end_time} onChange={(value) => setForm((current) => ({ ...current, end_time: value }))} />
              <ModalInput label="Break mins" type="number" value={form.break_minutes} onChange={(value) => setForm((current) => ({ ...current, break_minutes: value.replace(/\D/g, "").slice(0, 3) }))} />
            </div>
          ) : null}
          {activeSection !== "document-types" || isDocumentType ? (
            <label className="block">
              <span className="text-sm font-semibold text-gray-800">Color</span>
              <div className="mt-1.5 flex items-center gap-2">
                <input type="color" value={form.color || colorPalette[0].value} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} className="h-10 w-12 rounded-md border border-gray-300 bg-white p-1" />
                <div className="flex flex-wrap gap-1">
                  {colorPalette.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, color: color.value }))}
                      className={`h-6 w-6 rounded-full border border-white shadow ring-1 ring-gray-200 ${color.bg}`}
                      aria-label={`Use ${color.value}`}
                    />
                  ))}
                </div>
              </div>
            </label>
          ) : null}
          {needsDescription ? (
            <label className="block">
              <span className="text-sm font-semibold text-gray-800">Description</span>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value.slice(0, 500) }))} rows={3} placeholder="Enter Description" className="mt-1.5 w-full resize-none rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10" />
            </label>
          ) : null}
          <div className="flex flex-wrap gap-4 pt-1">
            {isDocumentType ? (
              <label className="flex items-center gap-3 text-sm font-semibold text-gray-800"><input type="checkbox" checked={form.is_required} onChange={(event) => setForm((current) => ({ ...current, is_required: event.target.checked }))} className="h-4 w-4 accent-accdoo-blue" />Is Required</label>
            ) : null}
            <label className="flex items-center gap-3 text-sm font-semibold text-gray-800"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} className="h-4 w-4 accent-accdoo-blue" />Active</label>
          </div>
        </div>
        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-md bg-accdoo-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accdoo-blueDark disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
        </div>
      </form>
    </div>
  );
}

function SetupCell({ record, column, sectionId, onEdit, onDelete }) {
  if (column.key === "primary") return <PrimaryCell record={record} sectionId={sectionId} />;
  if (column.key === "type") return <TypeBadge value={record.type || record.name} color={record.color} />;
  if (column.key === "status") return <StatusBadge value={record.status || (record.is_active === false ? "inactive" : "active")} />;
  if (column.key === "hours") return <span>{shiftHours(record) || "-"}</span>;
  if (column.key === "timing") return <span>{formatTime(record.start_time)}{record.start_time || record.end_time ? " - " : ""}{formatTime(record.end_time)}</span>;
  if (column.key === "employee_count") return <span>{record.employee_count ?? 0}</span>;
  if (column.key === "is_required") return <TypeBadge value={record.is_required ? "Required" : "Not Required"} color={record.is_required ? "#0B5CAB" : "#64748B"} />;
  if (column.key === "actions") {
    if (sectionId === "branches") return null;
    return (
      <div className="flex justify-end gap-1">
        <button type="button" onClick={() => onEdit(record)} className="rounded-md p-2 text-blue-600 hover:bg-blue-50" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
        <button type="button" onClick={() => onDelete(record)} className="rounded-md p-2 text-red-500 hover:bg-red-50" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
      </div>
    );
  }
  return <span className="line-clamp-2">{record[column.key] || "-"}</span>;
}

function PrimaryCell({ record, sectionId }) {
  const tone = toneFromColor(record.color, record.name);
  const subtitle = sectionId === "branches" ? (record.type === "Head Office" ? "Primary location" : "Operating location") : record.description;
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${tone.bg}`}>{initials(record.name)}</span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-950">{record.name}</p>
        {subtitle ? <p className="truncate text-xs text-gray-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

function ModalInput({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-800">{label} {required ? <span className="text-red-500">*</span> : null}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} placeholder={placeholder || `Enter ${label}`} className="mt-1.5 w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10" />
    </label>
  );
}

function ModalSelect({ label, value, onChange, children }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-800">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">{children}</select>
    </label>
  );
}

function getColumns(sectionId) {
  if (sectionId === "branches") return [
    { key: "primary", label: "Branch", width: "w-[30%]" },
    { key: "type", label: "Type", width: "w-[18%]" },
    { key: "city", label: "City", width: "w-[18%]" },
    { key: "employee_count", label: "Employees", width: "w-[14%]" },
    { key: "status", label: "Status", width: "w-[20%]" },
  ];
  if (sectionId === "departments") return [
    { key: "primary", label: "Department", width: "w-[30%]" },
    { key: "code", label: "Code", width: "w-[14%]" },
    { key: "head_name", label: "Head", width: "w-[22%]" },
    { key: "employee_count", label: "Employees", width: "w-[12%]" },
    { key: "status", label: "Status", width: "w-[12%]" },
    { key: "actions", label: "Actions", width: "w-[10%]" },
  ];
  if (sectionId === "designations") return [
    { key: "primary", label: "Designation", width: "w-[26%]" },
    { key: "level", label: "Level", width: "w-[16%]" },
    { key: "department_name", label: "Department", width: "w-[22%]" },
    { key: "employee_count", label: "Employees", width: "w-[12%]" },
    { key: "status", label: "Status", width: "w-[14%]" },
    { key: "actions", label: "Actions", width: "w-[10%]" },
  ];
  if (sectionId === "employment-types") return [
    { key: "primary", label: "Type", width: "w-[32%]" },
    { key: "code", label: "Code", width: "w-[16%]" },
    { key: "description", label: "Description", width: "w-[22%]" },
    { key: "employee_count", label: "Employees", width: "w-[10%]" },
    { key: "status", label: "Status", width: "w-[12%]" },
    { key: "actions", label: "Actions", width: "w-[8%]" },
  ];
  if (sectionId === "shifts") return [
    { key: "primary", label: "Shift", width: "w-[28%]" },
    { key: "timing", label: "Timing", width: "w-[22%]" },
    { key: "hours", label: "Hours", width: "w-[12%]" },
    { key: "employee_count", label: "Employees", width: "w-[12%]" },
    { key: "status", label: "Status", width: "w-[16%]" },
    { key: "actions", label: "Actions", width: "w-[10%]" },
  ];
  if (sectionId === "document-types") return [
    { key: "primary", label: "Document Name", width: "w-[30%]" },
    { key: "description", label: "Description", width: "w-[34%]" },
    { key: "is_required", label: "Is Required", width: "w-[18%]" },
    { key: "actions", label: "Actions", width: "w-[18%]" },
  ];
  return [
    { key: "primary", label: "Name", width: "w-[34%]" },
    { key: "description", label: "Description", width: "w-[42%]" },
    { key: "status", label: "Status", width: "w-[12%]" },
    { key: "actions", label: "Actions", width: "w-[12%]" },
  ];
}

function TypeBadge({ value, color }) {
  const tone = toneFromColor(color, value);
  return <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${tone.soft} ${tone.text}`}><span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />{value || "-"}</span>;
}

function StatusBadge({ value }) {
  const active = String(value).toLowerCase() === "active";
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-gray-500"}`} />{active ? "Active" : "Inactive"}</span>;
}

function shiftHours(record) {
  if (!record.start_time || !record.end_time) return "";
  const [startHour, startMinute] = record.start_time.split(":").map(Number);
  const [endHour, endMinute] = record.end_time.split(":").map(Number);
  let minutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute) - Number(record.break_minutes || 0);
  if (minutes < 0) minutes += 24 * 60;
  return `${Math.max(minutes / 60, 0).toFixed(minutes % 60 ? 1 : 0)}h`;
}

function formatTime(value) {
  return value ? value.slice(0, 5) : "";
}

function recordSearchText(record) {
  return Object.values(record).filter((value) => typeof value === "string" || typeof value === "number").join(" ").toLowerCase();
}

function groupSections(items) {
  return items.reduce((groups, item) => {
    groups[item.group] = groups[item.group] || [];
    groups[item.group].push(item);
    return groups;
  }, {});
}

function clean(value) {
  return value?.trim() || null;
}

function singularLabel(label) {
  if (label === "Branches") return "Branch";
  if (label === "Shifts") return "Shift";
  if (label.endsWith("ies")) return `${label.slice(0, -3)}y`;
  return label.endsWith("s") ? label.slice(0, -1) : label;
}
