
export const getApiUrl = () => localStorage.getItem('strapi_url') || 'https://dazzling-strength-d03d813531.strapiapp.com';
const getApiToken = () => localStorage.getItem('strapi_token') || 'df4d29f7ad437b3317afb55ec815bb6837077b59bdea1a2a3ea000ae976a61bd80d4642849f37314a9a6b8074f47edf3297d8854bf302b286a00cb47400013a75540b8662478b65f541e7c185cd443eac9ee5a37a472c6bf32a83740a8dd463cb50821fb59435b472268d9a76e3ae1cd1a56f58717839f2e1953c81965ab9df8';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getApiToken()}`
});

// Helper to flatten Strapi response
const flatten = (data) => {
  if (!data) return null;
  if (Array.isArray(data)) {
    return data.map(item => flatten(item));
  }
  if (data.id && data.attributes) {
    const flattened = {
      id: data.id,
      ...data.attributes
    };
    
    // Recursively flatten attributes that are relations/media
    Object.keys(flattened).forEach(key => {
      const value = flattened[key];
      if (value && typeof value === 'object' && value.data !== undefined) {
        flattened[key] = flatten(value.data);
      }
    });
    
    return flattened;
  }
  return data;
};

export const strapi = {
  async find(collection, params = {}) {
    // Build query string from params
    // Note: Strapi uses qs usually, but basic params can be handled by URLSearchParams
    // For complex filtering, we might need to handle it manually or use qs library if available
    // Here we support basic key-value params
    const url = new URL(`${getApiUrl()}/api/${collection}`);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) {
        console.error('Strapi API Error (find):', res.statusText);
        throw new Error(`Strapi Error: ${res.statusText}`);
    }
    const json = await res.json();
    return flatten(json.data);
  },
  
  async findOne(collection, id) {
    const res = await fetch(`${getApiUrl()}/api/${collection}/${id}`, { headers: getHeaders() });
    if (!res.ok) {
        console.error('Strapi API Error (findOne):', res.statusText);
        throw new Error(`Strapi Error: ${res.statusText}`);
    }
    const json = await res.json();
    return flatten(json.data);
  },

  async create(collection, data) {
    const res = await fetch(`${getApiUrl()}/api/${collection}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ data })
    });
      if (!res.ok) {
          const error = await res.json();
          console.error('Strapi API Error:', error);
          const details = error.error?.details ? JSON.stringify(error.error.details) : '';
          throw new Error(`${error.error?.message || res.statusText} ${details}`);
      }
    const json = await res.json();
    return flatten(json.data);
  },

  async update(collection, id, data) {
    const res = await fetch(`${getApiUrl()}/api/${collection}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ data })
    });
      if (!res.ok) {
          const error = await res.json();
          console.error('Strapi API Error:', error);
          const details = error.error?.details ? JSON.stringify(error.error.details) : '';
          throw new Error(`${error.error?.message || res.statusText} ${details}`);
      }
    const json = await res.json();
    return flatten(json.data);
  },

  async upload(file) {
    const formData = new FormData();
    formData.append('files', file);

    const res = await fetch(`${getApiUrl()}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getApiToken()}`
        // Content-Type is automatically set by browser for FormData
      },
      body: formData
    });

    if (!res.ok) {
        const error = await res.json();
        console.error('Strapi Upload Error:', error);
        throw new Error(error.error?.message || `Upload Error: ${res.statusText}`);
    }
    const json = await res.json();
    // Upload endpoint returns an array of files
    return json[0];
  },

  async delete(collection, id) {
    const res = await fetch(`${getApiUrl()}/api/${collection}/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
        console.error('Strapi API Error (delete):', res.statusText);
        throw new Error(`Strapi Error: ${res.statusText}`);
    }
    // Handle 204 No Content or empty body
    if (res.status === 204) {
      return null;
    }
    try {
      const text = await res.text();
      if (!text) return null;
      const json = JSON.parse(text);
      return flatten(json.data);
    } catch (e) {
      console.warn('Response is not JSON:', e);
      return null;
    }
  }
};

export default strapi;
