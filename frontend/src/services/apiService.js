export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5089/api';

/**
 * Función auxiliar para obtener las cabeceras de autenticación
 */
const getHeaders = (isFormData = false) => {
  const headers = {
    'ngrok-skip-browser-warning': 'true' // Para saltar la pantalla de advertencia de ngrok
  };
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const userStr = localStorage.getItem('agrovision_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    } catch (error) {
      console.error('Error parsing user data for token:', error);
    }
  }
  return headers;
};

/**
 * Realiza peticiones HTTP y estandariza la respuesta
 */
const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  try {
    const fetchOptions = { ...options, signal: controller.signal };
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    // Intentar leer el JSON, si no, retornar objeto vacío o el status
    let data = null;
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else if (contentType.includes('text/html')) {
      return { success: false, error: 'El servidor devolvió HTML (posible advertencia de ngrok). Revisa la conexión.', status: response.status };
    }
    
    if (!response.ok) {
      return { success: false, error: data || `Error ${response.status}: ${response.statusText}`, status: response.status };
    }
    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, error: 'La petición tardó demasiado y fue cancelada (Timeout).' };
    }
    return { success: false, error: error.message };
  }
};

// ==========================================
// Auth
// ==========================================

export const login = (data) => {
  return fetchApi('/Auth/login', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

export const register = (data) => {
  return fetchApi('/Auth/register', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

export const getMe = () => {
  return fetchApi('/Auth/me', {
    method: 'GET',
    headers: getHeaders()
  });
};

// ==========================================
// Inspections
// ==========================================

export const createInspection = (data) => {
  return fetchApi('/inspections', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

export const getInspections = () => {
  return fetchApi('/inspections', {
    method: 'GET',
    headers: getHeaders()
  });
};

export const getInspectionById = (id) => {
  return fetchApi(`/inspections/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
};

export const assignPlotToInspection = (id, data) => {
  return fetchApi(`/inspections/${id}/plot`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

export const createInspectionImage = (inspectionId, data) => {
  return fetchApi(`/inspections/${inspectionId}/images`, {
    method: 'POST',
    headers: getHeaders(true),
    body: data
  });
};

export const getInspectionImages = (inspectionId) => {
  return fetchApi(`/inspections/${inspectionId}/images`, {
    method: 'GET',
    headers: getHeaders()
  });
};

// ==========================================
// Organizations
// ==========================================

export const getOrganizations = () => {
  return fetchApi('/organizations', {
    method: 'GET',
    headers: getHeaders()
  });
};

// ==========================================
// Plots
// ==========================================

export const getPlots = () => {
  return fetchApi('/Plots', {
    method: 'GET',
    headers: getHeaders()
  });
};

// ==========================================
// Role
// ==========================================

export const createRoles = () => {
  return fetchApi('/Role/roles', {
    method: 'POST',
    headers: getHeaders()
  });
};

export const validateRole = (data) => {
  return fetchApi('/Role/validate-role', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

// ==========================================
// Disease Catalog
// ==========================================

export const getDiseaseCatalog = () => {
  return fetchApi('/disease-catalog', {
    method: 'GET',
    headers: getHeaders()
  });
};

export const getDiseaseCatalogById = (id) => {
  return fetchApi(`/disease-catalog/${id}`, {
    method: 'GET',
    headers: getHeaders()
  });
};

export const createDiseaseCatalog = (data) => {
  return fetchApi('/disease-catalog', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

export const updateDiseaseCatalog = (id, data) => {
  return fetchApi(`/disease-catalog/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

export const deleteDiseaseCatalog = (id) => {
  return fetchApi(`/disease-catalog/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
};

// ==========================================
// Inference Results
// ==========================================

export const createInferenceResult = (data) => {
  return fetchApi('/inference-results', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
};

export const getInferenceResultByImageId = (imageId) => {
  return fetchApi(`/inference-results/${imageId}`, {
    method: 'GET',
    headers: getHeaders()
  });
};
