const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function cleanParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );
}

export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
  } catch {
    throw new Error("API server is not reachable");
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(formatApiError(data));
    error.details = data?.details || data?.detail || null;
    error.status = response.status;
    throw error;
  }
  return data;
}

export function formatApiError(data, fallback = "HRMS API request failed") {
  if (!data) {
    return fallback;
  }

  if (typeof data.message === "string") {
    return [data.message, formatDetails(data.details)].filter(Boolean).join(" ");
  }

  if (typeof data.detail === "string") {
    return data.detail;
  }

  if (Array.isArray(data.detail)) {
    return data.detail
      .map((error) => {
        const location = Array.isArray(error.loc) ? error.loc.filter((part) => part !== "body").join(".") : "field";
        return `${location}: ${error.msg}`;
      })
      .join(" | ");
  }

  if (data.detail && typeof data.detail === "object") {
    return formatDetails(data.detail) || fallback;
  }

  return fallback;
}

function formatDetails(details) {
  if (!details || typeof details !== "object") {
    return "";
  }
  const text = Object.entries(details)
    .map(([key, value]) => `${formatFieldName(key)}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(" | ");
  return text ? `(${text})` : "";
}

function formatFieldName(value) {
  return value.replaceAll("_", " ");
}
