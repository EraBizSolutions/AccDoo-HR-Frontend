import { cleanParams, request } from "@/lib/api/request";

function setupParams(options = {}) {
  if (typeof options === "boolean") {
    return { include_inactive: options };
  }
  return options || {};
}

function queryString(params) {
  const searchParams = new URLSearchParams(cleanParams(params));
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function getBranches() {
  return request("/hrm/system-setup/branches");
}

export function getDepartments(options = false) {
  return request(`/hrm/system-setup/departments${queryString(setupParams(options))}`);
}

export function createDepartment(payload) {
  return request("/hrm/system-setup/departments", { method: "POST", body: JSON.stringify(payload) });
}

export function updateDepartment(id, payload) {
  return request(`/hrm/system-setup/departments/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteDepartment(id) {
  return request(`/hrm/system-setup/departments/${id}`, { method: "DELETE" });
}

export function getDesignations(params = {}) {
  return request(`/hrm/system-setup/designations${queryString(params)}`);
}

export function createDesignation(payload) {
  return request("/hrm/system-setup/designations", { method: "POST", body: JSON.stringify(payload) });
}

export function updateDesignation(id, payload) {
  return request(`/hrm/system-setup/designations/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteDesignation(id) {
  return request(`/hrm/system-setup/designations/${id}`, { method: "DELETE" });
}

export function getSetupOptions(category, options = false) {
  return request(`/hrm/system-setup/${category}${queryString(setupParams(options))}`);
}

export function createSetupOption(category, payload) {
  return request(`/hrm/system-setup/${category}`, { method: "POST", body: JSON.stringify(payload) });
}

export function updateSetupOption(category, id, payload) {
  return request(`/hrm/system-setup/${category}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteSetupOption(category, id) {
  return request(`/hrm/system-setup/${category}/${id}`, { method: "DELETE" });
}

export function getShifts(options = false) {
  return request(`/hrm/system-setup/shifts${queryString(setupParams(options))}`);
}

export function createShift(payload) {
  return request("/hrm/system-setup/shifts", { method: "POST", body: JSON.stringify(payload) });
}

export function updateShift(id, payload) {
  return request(`/hrm/system-setup/shifts/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteShift(id) {
  return request(`/hrm/system-setup/shifts/${id}`, { method: "DELETE" });
}
