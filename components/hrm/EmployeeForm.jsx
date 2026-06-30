"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, Plus, Save, Trash2 } from "lucide-react";

import { createEmployee, getNextEmployeeCode, updateEmployee } from "@/lib/api/hrmEmployeesApi";
import { getBranches, getDepartments, getDesignations, getSetupOptions, getShifts } from "@/lib/api/hrmSetupApi";
import { formatLabel, formatMoney } from "@/components/hrm/hrmUi";
import {
  digitsRegex,
  getApiErrorMessage,
  hasUnsafeInput,
  safeCodeRegex,
  safeNameRegex,
  safeSimpleTextRegex,
  safeTextRegex,
  sanitizeSafeCode,
  sanitizeSafeName,
  sanitizeSafeText,
} from "@/components/hrm/hrmValidation";

const steps = ["Personal", "Employment", "Contact", "Banking", "Hours & Rates", "Documents"];
const nameRegex = safeNameRegex;
const textRegex = safeTextRegex;
const simpleTextRegex = safeSimpleTextRegex;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const alphaNumRegex = safeCodeRegex;

const fallbackDocumentTypes = [
  "National Identity Card",
  "Passport",
  "Birth Certificate",
  "Educational Degree Certificate",
  "Professional Resume",
  "Bank Account Statement",
  "Professional Photograph",
  "Performance Evaluation Records",
];

const minDate = "1900-01-01";

const initialForm = {
  employee_code: "",
  first_name: "",
  last_name: "",
  call_name: "",
  date_of_birth: "",
  gender: "male",
  nic_or_passport: "",
  biometric_employee_id: "",
  branch_name: "",
  department_name: "",
  designation: "",
  employment_type_id: "",
  employment_type_name: "",
  employment_type: "full_time",
  employee_status: "active",
  branch_id: "",
  department_id: "",
  designation_id: "",
  shift_id: "",
  shift_name: "",
  date_of_joining: "",
  email: "",
  phone: "",
  address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  bank_name: "",
  account_number: "",
  account_holder_name: "",
  bank_branch: "",
  basic_salary: "",
  pay_frequency: "monthly",
  overtime_type: "none",
  hourly_rate: "",
  epf_number: "",
  tax_number: "",
  document_notes: "",
  document_items: [{ document_type: "", file_name: "" }],
};

const stepFields = [
  ["first_name", "last_name", "call_name", "date_of_birth", "nic_or_passport", "biometric_employee_id"],
  ["date_of_joining", "branch_id", "department_id", "designation_id", "employment_type_id", "employment_type", "shift_id"],
  ["email", "phone", "address", "emergency_contact_name", "emergency_contact_phone"],
  ["bank_name", "bank_branch", "account_holder_name", "account_number"],
  ["basic_salary", "hourly_rate", "epf_number", "tax_number"],
  ["document_items", "document_notes"],
];

const fieldStepMap = stepFields.reduce((map, fields, stepIndex) => {
  fields.forEach((field) => {
    map[field] = stepIndex;
  });
  return map;
}, {});

export default function EmployeeForm({ mode = "create", employeeId, initialEmployee }) {
  const router = useRouter();
  const formTopRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [setup, setSetup] = useState({ branches: [], departments: [], designations: [], documentTypes: [], employmentTypes: [], shifts: [] });

  const isLastStep = activeStep === steps.length - 1;
  const activeStepErrors = useMemo(() => errors, [errors]);

  useEffect(() => {
    async function loadCode() {
      if (mode === "edit" && initialEmployee) {
        setForm(toFormState(initialEmployee));
        return;
      }
      try {
        const response = await getNextEmployeeCode();
        setForm((current) => ({ ...current, employee_code: response.employee_code }));
      } catch {
        const fallback = `EMP${new Date().getFullYear()}0001`;
        setForm((current) => ({ ...current, employee_code: fallback }));
      }
    }
    loadCode();
  }, [mode, initialEmployee]);

  useEffect(() => {
    async function loadSetup() {
      const [branches, departments, designations, documentTypes, employmentTypes, shifts] = await Promise.all([
        getBranches().catch(() => []),
        getDepartments().catch(() => []),
        getDesignations().catch(() => []),
        getSetupOptions("document-types").catch(() => []),
        getSetupOptions("employment-types").catch(() => []),
        getShifts().catch(() => []),
      ]);
      setSetup({ branches, departments, designations, documentTypes, employmentTypes, shifts });
    }
    loadSetup();
  }, []);

  function update(name, value) {
    const nextValue = sanitizeValue(name, value);
    setMessage("");
    setForm((current) => {
      const next = { ...current, [name]: nextValue };
      if (name === "branch_id") {
        const branch = setup.branches.find((item) => item.id === nextValue);
        next.branch_name = branch?.name || "";
      }
      if (name === "department_id") {
        const department = setup.departments.find((item) => item.id === nextValue);
        next.department_name = department?.name || "";
        const designation = setup.designations.find((item) => item.id === next.designation_id);
        if (designation?.department_id && designation.department_id !== nextValue) {
          next.designation_id = "";
          next.designation = "";
        }
      }
      if (name === "designation_id") {
        const designation = setup.designations.find((item) => item.id === nextValue);
        next.designation = designation?.name || "";
      }
      if (name === "employment_type_id") {
        const employmentType = setup.employmentTypes.find((item) => item.id === nextValue);
        next.employment_type_name = employmentType?.name || "";
        next.employment_type = employmentType ? employmentTypeValue(employmentType) : "full_time";
      }
      if (name === "employment_type") {
        next.employment_type_id = "";
        next.employment_type_name = formatLabel(nextValue, "");
      }
      if (name === "shift_id") {
        const shift = setup.shifts.find((item) => item.id === nextValue);
        next.shift_name = shift?.name || "";
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function updateDocument(index, field, value) {
    setMessage("");
    setForm((current) => {
      const nextDocuments = [...current.document_items];
      nextDocuments[index] = { ...nextDocuments[index], [field]: value };
      return { ...current, document_items: nextDocuments };
    });
    setErrors((current) => ({ ...current, document_items: "" }));
  }

  function addDocument() {
    setForm((current) => ({
      ...current,
      document_items: [...current.document_items, { document_type: "", file_name: "" }],
    }));
  }

  function removeDocument(index) {
    setForm((current) => ({
      ...current,
      document_items: current.document_items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function buildValidationErrors() {
    const nextErrors = {};
    requirePattern(nextErrors, "first_name", form.first_name, nameRegex, "First name can contain letters, spaces, apostrophes, and hyphens.");
    requirePattern(nextErrors, "last_name", form.last_name, nameRegex, "Last name can contain letters, spaces, apostrophes, and hyphens.");
    optionalPattern(nextErrors, "call_name", form.call_name, nameRegex, "Call name can contain letters, spaces, apostrophes, and hyphens.");
    if (!form.date_of_birth) nextErrors.date_of_birth = "Date of birth is required.";
    if (form.date_of_birth && new Date(form.date_of_birth) >= new Date()) nextErrors.date_of_birth = "Date of birth must be in the past.";
    optionalPattern(nextErrors, "nic_or_passport", form.nic_or_passport, alphaNumRegex, "NIC/passport can contain only letters, numbers, and hyphens.");
    optionalPattern(nextErrors, "biometric_employee_id", form.biometric_employee_id, alphaNumRegex, "Biometric ID can contain only letters, numbers, and hyphen.");
    if (!form.date_of_joining) nextErrors.date_of_joining = "Date of joining is required.";
    if (form.date_of_joining && form.date_of_joining < minDate) nextErrors.date_of_joining = "Date of joining is not valid.";
    if (!form.branch_id) nextErrors.branch_id = "Please select a branch.";
    if (!form.department_id) nextErrors.department_id = "Please select a department.";
    if (!form.designation_id) nextErrors.designation_id = "Please select a designation.";
    if (setup.employmentTypes.length && !form.employment_type_id) nextErrors.employment_type_id = "Please select an employment type.";
    if (!emailRegex.test(form.email)) nextErrors.email = "Enter a valid email address.";
    requirePattern(nextErrors, "phone", form.phone, digitsRegex, "Contact number must be exactly 10 digits.");
    if (form.phone.length !== 10) nextErrors.phone = "Contact number must be exactly 10 digits.";
    requirePattern(nextErrors, "address", form.address, textRegex, "Address is required and contains unsupported characters.");
    if (form.address.length > 100) nextErrors.address = "Address cannot exceed 100 characters.";
    requirePattern(nextErrors, "emergency_contact_name", form.emergency_contact_name, nameRegex, "Emergency contact name can contain letters, spaces, apostrophes, and hyphens.");
    requirePattern(nextErrors, "emergency_contact_phone", form.emergency_contact_phone, digitsRegex, "Emergency contact number must be exactly 10 digits.");
    if (form.emergency_contact_phone.length !== 10) nextErrors.emergency_contact_phone = "Emergency contact number must be exactly 10 digits.";
    optionalPattern(nextErrors, "bank_name", form.bank_name, nameRegex, "Bank name can contain letters, spaces, apostrophes, and hyphens.");
    optionalPattern(nextErrors, "account_holder_name", form.account_holder_name, nameRegex, "Account holder name can contain letters, spaces, apostrophes, and hyphens.");
    optionalPattern(nextErrors, "bank_branch", form.bank_branch, simpleTextRegex, "Bank branch contains unsupported characters.");
    optionalPattern(nextErrors, "account_number", form.account_number, digitsRegex, "Account number must contain numbers only.");
    if (form.account_number && form.account_number.length < 6) nextErrors.account_number = "Account number must be at least 6 digits.";
    if (form.basic_salary && Number(form.basic_salary) < 0) nextErrors.basic_salary = "Salary cannot be negative.";
    if (form.hourly_rate && Number(form.hourly_rate) < 0) nextErrors.hourly_rate = "Hourly rate cannot be negative.";
    optionalPattern(nextErrors, "epf_number", form.epf_number, alphaNumRegex, "EPF number can contain only letters and numbers.");
    optionalPattern(nextErrors, "tax_number", form.tax_number, alphaNumRegex, "Tax number can contain only letters and numbers.");
    const filledDocuments = form.document_items.filter((item) => item.document_type || item.file_name);
    if (filledDocuments.some((item) => !item.document_type || !item.file_name)) {
      nextErrors.document_items = "Each added document needs both document type and file.";
    }
    if (filledDocuments.some((item) => hasUnsafeInput(item.document_type) || hasUnsafeInput(item.file_name))) {
      nextErrors.document_items = "Document details contain unsupported characters.";
    }
    if (form.document_notes && hasUnsafeInput(form.document_notes)) {
      nextErrors.document_notes = "Document notes contain unsupported characters.";
    }
    return nextErrors;
  }

  function errorsForStep(nextErrors, stepIndex) {
    return Object.fromEntries(
      Object.entries(nextErrors).filter(([field]) => fieldStepMap[field] === stepIndex)
    );
  }

  function firstErrorStep(nextErrors) {
    const firstField = Object.keys(nextErrors).find((field) => fieldStepMap[field] !== undefined);
    return firstField ? fieldStepMap[firstField] : 0;
  }

  function scrollToFormTop() {
    window.setTimeout(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      formTopRef.current?.focus?.();
    });
  }

  function showErrorsOnStep(stepIndex) {
    setActiveStep(stepIndex);
    scrollToFormTop();
  }

  function validateStepByIndex(stepIndex) {
    const nextErrors = buildValidationErrors();
    const currentStepErrors = errorsForStep(nextErrors, stepIndex);
    setErrors((existing) => {
      const cleaned = Object.fromEntries(
        Object.entries(existing).filter(([field]) => fieldStepMap[field] !== stepIndex)
      );
      return { ...cleaned, ...currentStepErrors };
    });
    if (Object.keys(currentStepErrors).length) {
      scrollToFormTop();
      return false;
    }
    return true;
  }

  function validateAllSteps() {
    const nextErrors = buildValidationErrors();
    setErrors(nextErrors);
    const errorFields = Object.keys(nextErrors);
    if (!errorFields.length) {
      return true;
    }
    const stepIndex = firstErrorStep(nextErrors);
    showErrorsOnStep(stepIndex);
    return false;
  }

  function toPayload() {
    const payload = Object.fromEntries(
      Object.entries(form)
        .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
        .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    );
    delete payload.employee_code;
    payload.document_items = form.document_items.filter((item) => item.document_type && item.file_name);
    if (!payload.document_items.length) delete payload.document_items;
    return payload;
  }

  function applyBackendErrors(error, fallbackMessage) {
    const backendErrors = mapBackendErrors(error?.details);
    if (Object.keys(backendErrors).length) {
      setErrors((existing) => ({ ...existing, ...backendErrors }));
      const stepIndex = firstErrorStep(backendErrors);
      showErrorsOnStep(stepIndex);
      return;
    }
    setMessage(getApiErrorMessage(error, fallbackMessage));
    scrollToFormTop();
  }

  async function handleSubmit() {
    setMessage("");
    if (!isLastStep) {
      return;
    }
    if (!validateAllSteps()) return;
    setSaving(true);
    try {
      if (mode === "edit") {
        const updated = await updateEmployee(employeeId, toPayload());
        setMessage(`Employee ${updated.employee_code} updated successfully.`);
        setForm(toFormState(updated));
        router.refresh();
      } else {
        const created = await createEmployee(toPayload());
        setMessage(`Employee ${created.employee_code} created successfully.`);
        router.push("/hrm/employees");
        router.refresh();
      }
    } catch (err) {
      applyBackendErrors(err, mode === "edit" ? "Unable to update employee." : "Unable to create employee.");
    } finally {
      setSaving(false);
    }
  }

  function nextStep() {
    if (!validateStepByIndex(activeStep)) return;
    setActiveStep((current) => Math.min(current + 1, steps.length - 1));
  }

  return (
    <div ref={formTopRef} tabIndex={-1} className="space-y-6 outline-none">
      <div className="rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-2 rounded-md bg-gray-100 p-1 sm:grid-cols-2 lg:grid-cols-6">
          {steps.map((step, index) => {
            const isActive = activeStep === index;
            return (
              <button
                key={step}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`flex items-center justify-center gap-2 rounded-md border px-3 py-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-accdoo-blue bg-accdoo-blueSoft text-accdoo-blue shadow-sm"
                    : "border-gray-200 bg-white text-gray-500 hover:text-gray-950"
                }`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isActive ? "bg-accdoo-blue text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  {index + 1}
                </span>
                {step}
              </button>
            );
          })}
        </div>
      </div>

      {message && message.includes("successfully") ? (
        <div className={`rounded-md border px-4 py-3 text-sm font-semibold ${message.includes("successfully") ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {message}
        </div>
      ) : null}

      <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        {activeStep === 0 ? <PersonalStep form={form} errors={activeStepErrors} update={update} /> : null}
        {activeStep === 1 ? <EmploymentStep form={form} errors={activeStepErrors} update={update} setup={setup} /> : null}
        {activeStep === 2 ? <ContactStep form={form} errors={activeStepErrors} update={update} /> : null}
        {activeStep === 3 ? <BankingStep form={form} errors={activeStepErrors} update={update} /> : null}
        {activeStep === 4 ? <RatesStep form={form} errors={activeStepErrors} update={update} /> : null}
        {activeStep === 5 ? (
          <DocumentsStep
            form={form}
            errors={activeStepErrors}
            update={update}
            updateDocument={updateDocument}
            addDocument={addDocument}
            removeDocument={removeDocument}
            documentTypes={setup.documentTypes}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/hrm/employees" className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <div className="flex gap-2">
          <button type="button" disabled={activeStep === 0} onClick={() => setActiveStep((current) => Math.max(current - 1, 0))} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
            Previous
          </button>
          {!isLastStep ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-md bg-accdoo-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accdoo-blueDark">
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-accdoo-blue px-4 py-2 text-sm font-semibold text-white hover:bg-accdoo-blueDark disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? <CheckCircle2 className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
              {mode === "edit" ? "Update Employee" : "Save Employee"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function sanitizeValue(name, value) {
  if (["first_name", "last_name", "call_name", "bank_name", "account_holder_name", "emergency_contact_name"].includes(name)) {
    return sanitizeSafeName(value).slice(0, 150);
  }
  if (name === "bank_branch") {
    return sanitizeSafeText(value, 120);
  }
  if (["phone", "emergency_contact_phone"].includes(name)) {
    return value.replace(/\D/g, "").slice(0, 10);
  }
  if (["account_number"].includes(name)) {
    return value.replace(/\D/g, "").slice(0, 24);
  }
  if (["nic_or_passport", "biometric_employee_id", "epf_number", "tax_number"].includes(name)) {
    return sanitizeSafeCode(value, 80);
  }
  if (name === "address") {
    return sanitizeSafeText(value, 100);
  }
  if (name === "document_notes") {
    return sanitizeSafeText(value, 1000);
  }
  if (["basic_salary", "hourly_rate"].includes(name)) {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const [whole = "", ...decimalParts] = cleaned.split(".");
    const decimal = decimalParts.join("").slice(0, 2);
    return decimalParts.length ? `${whole}.${decimal}` : whole;
  }
  return value;
}

function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
}

function toFormState(employee) {
  return {
    ...initialForm,
    ...Object.fromEntries(
      Object.entries(employee || {}).map(([key, value]) => [key, value === null || value === undefined ? "" : String(value)])
    ),
    document_items: employee?.document_items?.length ? employee.document_items : initialForm.document_items,
  };
}

function mapBackendErrors(details) {
  if (!details) return {};
  const mapped = {};
  const items = Array.isArray(details) ? details : Object.entries(details).map(([field, message]) => ({ loc: [field], msg: message }));

  items.forEach((item) => {
    const loc = Array.isArray(item.loc) ? item.loc : [item.loc || item.field];
    const cleanLoc = loc.filter(Boolean).filter((part) => part !== "body");
    const field = cleanLoc[cleanLoc.length - 1];
    if (!field || fieldStepMap[field] === undefined) return;
    const message = typeof item.msg === "string" ? item.msg : String(item.message || item.detail || "Please enter a valid value.");
    mapped[field] = message;
  });

  return mapped;
}

function requirePattern(errors, name, value, pattern, message) {
  if (!value || hasUnsafeInput(value) || !pattern.test(value.trim())) {
    errors[name] = message;
  }
}

function optionalPattern(errors, name, value, pattern, message) {
  if (value && (hasUnsafeInput(value) || !pattern.test(value.trim()))) {
    errors[name] = message;
  }
}

function Field({ label, name, form, update, errors, type = "text", required = false, children, ...props }) {
  return (
    <label>
      <span className="text-sm font-semibold text-gray-800">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </span>
      {children || (
        <input
          type={type}
          value={form[name]}
          onChange={(event) => update(name, event.target.value)}
          className={`mt-2 w-full rounded-md border px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10 ${errors?.[name] ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"}`}
          {...props}
        />
      )}
      {errors?.[name] ? <span className="mt-1 block text-xs font-medium text-red-600">{errors[name]}</span> : null}
    </label>
  );
}

function CurrencyField({ label, name, form, update, errors, optional = false }) {
  return (
    <label>
      <span className="text-sm font-semibold text-gray-800">
        {label} {optional ? <span className="font-medium text-gray-400">(optional)</span> : null}
      </span>
      <div className={`mt-2 flex overflow-hidden rounded-md border ${errors?.[name] ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"} focus-within:border-accdoo-blue focus-within:ring-2 focus-within:ring-accdoo-blue/10`}>
        <span className="flex items-center border-r border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-500">LKR</span>
        <input
          type="text"
          inputMode="decimal"
          value={form[name]}
          onChange={(event) => update(name, event.target.value)}
          placeholder="0.00"
          className="w-full px-3 py-3 text-sm outline-none"
        />
      </div>
      {form[name] ? <span className="mt-1 block text-xs font-medium text-gray-500">{formatCurrencyPreview(form[name])}</span> : null}
      {errors?.[name] ? <span className="mt-1 block text-xs font-medium text-red-600">{errors[name]}</span> : null}
    </label>
  );
}

function StepGrid({ title, children }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-950">{title}</h2>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{children}</div>
    </div>
  );
}

function PersonalStep({ form, errors, update }) {
  const maxBirthDate = getYesterdayDate();

  return (
    <StepGrid title="Personal Details">
      <Field label="Employee Id" name="employee_code" form={form} update={update} errors={errors}>
        <input value={form.employee_code || "Generating..."} readOnly className="mt-2 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-700" />
      </Field>
      <Field
        label="Date Of Birth"
        name="date_of_birth"
        type="date"
        form={form}
        update={update}
        errors={errors}
        required
        min={minDate}
        max={maxBirthDate}
      />
      <Field label="First Name" name="first_name" form={form} update={update} errors={errors} required placeholder="Enter first name" />
      <Field label="Last Name" name="last_name" form={form} update={update} errors={errors} required placeholder="Enter last name" />
      <Field label="Call Name" name="call_name" form={form} update={update} errors={errors} placeholder="Enter call name" />
      <Field label="NIC / Passport" name="nic_or_passport" form={form} update={update} errors={errors} placeholder="Letters and numbers only" />
      <Field label="Biometric Employee Id" name="biometric_employee_id" form={form} update={update} errors={errors} placeholder="Enter biometric employee id" />
      <div>
        <span className="text-sm font-semibold text-gray-800">Gender</span>
        <div className="mt-4 flex flex-wrap gap-6">
          {["male", "female", "other"].map((gender) => (
            <label key={gender} className="flex items-center gap-2 text-sm font-semibold capitalize text-gray-800">
              <input type="radio" checked={form.gender === gender} onChange={() => update("gender", gender)} className="h-4 w-4 accent-accdoo-blue" />
              {gender}
            </label>
          ))}
        </div>
      </div>
    </StepGrid>
  );
}

function EmploymentStep({ form, errors, update, setup }) {
  const departments = setup.departments;
  const designations = setup.designations.filter((designation) => {
    if (!form.department_id) return true;
    return !designation.department_id || designation.department_id === form.department_id;
  });

  return (
    <StepGrid title="Employment">
      <Field label="Date Of Joining" name="date_of_joining" type="date" form={form} update={update} errors={errors} required />
      <Field label="Employment Type" name="employment_type" form={form} update={update} errors={errors} required>
        {setup.employmentTypes.length ? (
          <SearchSelect
            value={form.employment_type_id}
            onChange={(value) => update("employment_type_id", value)}
            options={setup.employmentTypes}
            placeholder="Search and select employment type"
            error={errors.employment_type_id}
            getMeta={(item) => [item.code, item.description].filter(Boolean).join(" / ")}
          />
        ) : (
          <select value={form.employment_type} onChange={(event) => update("employment_type", event.target.value)} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="intern">Intern</option>
            <option value="temporary">Temporary</option>
          </select>
        )}
      </Field>
      <Field label="Branch" name="branch_id" form={form} update={update} errors={errors} required>
        <SearchSelect
          value={form.branch_id}
          onChange={(value) => update("branch_id", value)}
          options={setup.branches}
          placeholder="Search and select branch"
          error={errors.branch_id}
          getMeta={(item) => [item.branch_id, item.location].filter(Boolean).join(" / ")}
        />
      </Field>
      <Field label="Department" name="department_id" form={form} update={update} errors={errors} required>
        <SearchSelect
          value={form.department_id}
          onChange={(value) => update("department_id", value)}
          options={departments}
          placeholder="Search and select department"
          error={errors.department_id}
          getMeta={(item) => item.description || ""}
        />
      </Field>
      <Field label="Designation" name="designation_id" form={form} update={update} errors={errors} required>
        <SearchSelect
          value={form.designation_id}
          onChange={(value) => update("designation_id", value)}
          options={designations}
          placeholder="Search and select designation"
          error={errors.designation_id}
          getMeta={(item) => item.department_name || ""}
        />
      </Field>
      <Field label="Employee Status" name="employee_status" form={form} update={update} errors={errors}>
        <select value={form.employee_status} onChange={(event) => update("employee_status", event.target.value)} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="probation">Probation</option>
          <option value="terminated">Terminated</option>
          <option value="resigned">Resigned</option>
        </select>
      </Field>
      <Field label="Shift" name="shift_id" form={form} update={update} errors={errors}>
        <SearchSelect
          value={form.shift_id}
          onChange={(value) => update("shift_id", value)}
          options={setup.shifts}
          placeholder="Search and select shift"
          error={errors.shift_id}
          getMeta={(item) => shiftMeta(item)}
        />
      </Field>
    </StepGrid>
  );
}

function ContactStep({ form, errors, update }) {
  return (
    <StepGrid title="Contact">
      <Field label="Email" name="email" type="email" form={form} update={update} errors={errors} required placeholder="employee@company.com" />
      <Field label="Contact Number" name="phone" form={form} update={update} errors={errors} required placeholder="0771234567" inputMode="numeric" />
      <Field label="Address" name="address" form={form} update={update} errors={errors} required placeholder="Max 100 characters" />
      <Field label="Emergency Contact Name" name="emergency_contact_name" form={form} update={update} errors={errors} required />
      <Field label="Emergency Contact Number" name="emergency_contact_phone" form={form} update={update} errors={errors} required placeholder="0771234567" inputMode="numeric" />
      <p className="self-end text-xs text-gray-500">{form.address.length}/100 address characters</p>
    </StepGrid>
  );
}

function BankingStep({ form, errors, update }) {
  return (
    <StepGrid title="Banking">
      <Field label="Bank Name" name="bank_name" form={form} update={update} errors={errors} placeholder="Letters only" />
      <Field label="Bank Branch" name="bank_branch" form={form} update={update} errors={errors} />
      <Field label="Account Holder Name" name="account_holder_name" form={form} update={update} errors={errors} placeholder="Letters only" />
      <Field label="Account Number" name="account_number" form={form} update={update} errors={errors} inputMode="numeric" placeholder="Numbers only" />
    </StepGrid>
  );
}

function RatesStep({ form, errors, update }) {
  return (
    <StepGrid title="Hours & Rates">
      <CurrencyField label="Basic Salary" name="basic_salary" form={form} update={update} errors={errors} />
      <CurrencyField label="Hourly Rate" name="hourly_rate" form={form} update={update} errors={errors} optional />
      <Field label="EPF Number" name="epf_number" form={form} update={update} errors={errors} />
      <Field label="Tax Number" name="tax_number" form={form} update={update} errors={errors} />
      <Field label="Pay Frequency" name="pay_frequency" form={form} update={update} errors={errors}>
        <select value={form.pay_frequency} onChange={(event) => update("pay_frequency", event.target.value)} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
          <option value="monthly">Monthly</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Biweekly</option>
          <option value="daily">Daily</option>
          <option value="hourly">Hourly</option>
        </select>
      </Field>
      <Field label="Overtime Type" name="overtime_type" form={form} update={update} errors={errors}>
        <select value={form.overtime_type} onChange={(event) => update("overtime_type", event.target.value)} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
          <option value="none">None</option>
          <option value="fixed">Fixed</option>
          <option value="hourly">Hourly</option>
        </select>
      </Field>
    </StepGrid>
  );
}

function DocumentsStep({ form, errors, update, updateDocument, addDocument, removeDocument, documentTypes }) {
  const types = documentTypes.length ? documentTypes.map((item) => item.name) : fallbackDocumentTypes;

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-950">Employee Documents</h2>
      <div className="mt-6 space-y-4">
        {form.document_items.map((item, index) => (
          <div key={index} className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Item {index + 1}</p>
              {form.document_items.length > 1 ? (
                <button type="button" onClick={() => removeDocument(index)} className="rounded-md p-2 text-red-600 hover:bg-red-50" aria-label="Remove document">
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="text-sm font-semibold text-gray-800">Document Type</span>
                <select value={item.document_type} onChange={(event) => updateDocument(index, "document_type", event.target.value)} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10">
                  <option value="">Select Document Type</option>
                  {types.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-gray-800">Document File</span>
                <input
                  type="file"
                  onChange={(event) => updateDocument(index, "file_name", event.target.files?.[0]?.name || "")}
                  className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-accdoo-blue file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {item.file_name ? (
                  <span className="mt-2 flex items-center gap-2 text-xs font-medium text-gray-600">
                    <FileText className="h-4 w-4 text-accdoo-blue" />
                    {item.file_name}
                  </span>
                ) : null}
              </label>
            </div>
          </div>
        ))}
      </div>
      {errors.document_items ? <p className="mt-2 text-xs font-medium text-red-600">{errors.document_items}</p> : null}
      <button type="button" onClick={addDocument} className="mt-5 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-white px-4 py-4 text-sm font-semibold text-gray-800 hover:bg-gray-50">
        <Plus className="h-4 w-4" />
        Add Document
      </button>
      <label className="mt-5 block">
        <span className="text-sm font-semibold text-gray-800">Document Notes</span>
        <textarea
          value={form.document_notes}
          onChange={(event) => update("document_notes", event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10"
        />
      </label>
    </div>
  );
}

function employmentTypeValue(item) {
  const candidate = `${item.code || item.name || ""}`.trim().toLowerCase().replaceAll("-", "_").replaceAll(" ", "_");
  const aliases = {
    ft: "full_time",
    fulltime: "full_time",
    full_time: "full_time",
    pt: "part_time",
    parttime: "part_time",
    part_time: "part_time",
    contract: "contract",
    intern: "intern",
    temporary: "temporary",
    tmp: "temporary",
  };
  return aliases[candidate] || "full_time";
}

function shiftMeta(item) {
  const start = item.start_time?.slice(0, 5);
  const end = item.end_time?.slice(0, 5);
  return [item.code, start && end ? `${start} - ${end}` : ""].filter(Boolean).join(" / ");
}

function formatCurrencyPreview(value) {
  const formatted = formatMoney(value);
  return formatted === "-" ? "" : formatted;
}

function SearchSelect({ value, onChange, options, placeholder, error, getMeta }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const selected = options.find((item) => item.id === value);
  const selectedMeta = selected ? getMeta?.(selected) : "";
  const visibleOptions = options.filter((item) => {
    const meta = getMeta?.(item) || "";
    return `${item.name} ${meta}`.toLowerCase().includes(query.toLowerCase());
  });

  return (
    <div className="relative mt-2">
      <input
        value={open ? query : selected?.name || ""}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          if (!event.target.value) onChange("");
        }}
        placeholder={placeholder}
        className={`w-full rounded-md border px-3 py-3 text-sm outline-none focus:border-accdoo-blue focus:ring-2 focus:ring-accdoo-blue/10 ${error ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"}`}
      />
      {!open && selectedMeta ? <p className="mt-1 text-xs font-medium text-gray-500">{selectedMeta}</p> : null}
      {open ? (
        <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {visibleOptions.length ? visibleOptions.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(item.id);
                setQuery("");
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-accdoo-blueSoft ${value === item.id ? "bg-accdoo-blueSoft text-accdoo-blue" : "text-gray-700"}`}
            >
              <span className="font-medium">{item.name}</span>
              {getMeta?.(item) ? <span className="truncate text-xs text-gray-500">{getMeta(item)}</span> : null}
            </button>
          )) : (
            <div className="px-3 py-3 text-sm text-gray-500">No records found. Add it in System Setup first.</div>
          )}
        </div>
      ) : null}
      {open ? <button type="button" aria-label="Close options" onClick={() => setOpen(false)} className="fixed inset-0 z-20 cursor-default bg-transparent" tabIndex={-1} /> : null}
    </div>
  );
}
