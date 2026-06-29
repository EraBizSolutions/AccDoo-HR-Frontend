import { cleanParams, request } from "@/lib/api/request";

export function getBranches() {
  return request("/hrm/system-setup/branches");
}

export function getDepartments(includeInactive = false) {
  return request(`/hrm/system-setup/departments?include_inactive=${includeInactive}`);
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
  const searchParams = new URLSearchParams(cleanParams(params));
  return request(`/hrm/system-setup/designations?${searchParams.toString()}`);
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

export function getSetupOptions(category, includeInactive = false) {
  return request(`/hrm/system-setup/${category}?include_inactive=${includeInactive}`);
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

export function getShifts(includeInactive = false) {
  return request(`/hrm/system-setup/shifts?include_inactive=${includeInactive}`);
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
