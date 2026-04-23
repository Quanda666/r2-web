import { STORAGE_KEY, THEME_KEY, LANG_KEY, VIEW_KEY, DENSITY_KEY, SORT_BY_KEY, SORT_ORDER_KEY } from './constants.js'
import { API } from './api.js'

/** @typedef {{ id?: number; name?: string; accountId?: string; accessKeyId?: string; secretAccessKey?: string; bucket?: string; bucketName?: string; filenameTpl?: string; filenameTplScope?: string; customDomain?: string; bucketAccess?: 'public' | 'private'; bucketVisibility?: 'public' | 'private'; compressMode?: string; compressLevel?: string; tinifyKey?: string; uploadConcurrency?: number; isDefault?: boolean }} AppConfig */
/** @typedef {AppConfig & { theme?: string; lang?: string; view?: string; density?: string; sortBy?: string; sortOrder?: string }} SharePayload */

class ConfigManager {
  /** @type {AppConfig | null} */
  #activeConfig = null
  /** @type {any | null} */
  #user = null
  /** @type {AppConfig[]} */
  #buckets = []

  async init() {
    try {
      const { authenticated, user } = await API.me()
      if (authenticated) {
        this.#user = user
        await this.refreshBuckets()
      }
    } catch (e) {
      console.error('Failed to init auth:', e)
    }
  }

  get user() { return this.#user }
  get buckets() { return this.#buckets }

  async refreshBuckets() {
    if (!this.#user) return
    this.#buckets = await API.getBuckets()
    // Map backend field names to AppConfig if necessary
    this.#buckets = this.#buckets.map(b => ({
      ...b,
      bucket: b.bucketName, // compatibility
      bucketAccess: b.bucketVisibility // compatibility
    }))
    
    if (this.#buckets.length > 0) {
      const defaultBucket = this.#buckets.find(b => b.isDefault) || this.#buckets[0]
      this.#activeConfig = defaultBucket
    }
  }

  /** @returns {AppConfig} */
  load() {
    if (this.#activeConfig) return this.#activeConfig

    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') || {}
    } catch {
      return /** @type {AppConfig} */ ({})
    }
  }

  /** @param {AppConfig} cfg */
  save(cfg) {
    if (this.#user && cfg.id) {
      // If we're updating an existing bucket for a user, we'd call API.updateBucket
      // But usually 'save' is called for the whole R2 settings tab.
      // For simplicity, if we have an active config, we merge it.
      this.#activeConfig = { ...this.#activeConfig, ...cfg }
      // In a more robust impl, we'd sync back to API here.
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
    }
  }

  /** @returns {AppConfig} */
  get() {
    return this.load()
  }

  switchBucket(id) {
    const bucket = this.#buckets.find(b => b.id === id)
    if (bucket) {
      this.#activeConfig = bucket
      return true
    }
    return false
  }

  clear() {
    if (this.#user) {
      this.#activeConfig = null
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  isValid() {
    const c = this.load()
    return !!(c.accountId && c.accessKeyId && c.secretAccessKey && (c.bucket || c.bucketName))
  }

  getEndpoint() {
    const c = this.load()
    return `https://${c.accountId}.r2.cloudflarestorage.com`
  }

  getBucketUrl() {
    const c = this.load()
    return `${this.getEndpoint()}/${c.bucket || c.bucketName}`
  }

  toBase64() {
    /** @type {SharePayload} */
    const payload = {
      ...this.load(),
      theme: localStorage.getItem(THEME_KEY) || undefined,
      lang: localStorage.getItem(LANG_KEY) || undefined,
      view: localStorage.getItem(VIEW_KEY) || undefined,
      density: localStorage.getItem(DENSITY_KEY) || undefined,
      sortBy: localStorage.getItem(SORT_BY_KEY) || undefined,
      sortOrder: localStorage.getItem(SORT_ORDER_KEY) || undefined,
    }
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  }

  /** @param {string} b64 @returns {boolean} */
  loadFromBase64(b64) {
    try {
      const json = decodeURIComponent(escape(atob(b64)))
      /** @type {SharePayload} */
      const payload = JSON.parse(json)
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false

      const { theme, lang, view, density, sortBy, sortOrder, ...r2Config } = payload
      if (theme) localStorage.setItem(THEME_KEY, theme)
      if (lang) localStorage.setItem(LANG_KEY, lang)
      if (view) localStorage.setItem(VIEW_KEY, view)
      if (density) localStorage.setItem(DENSITY_KEY, density)
      if (sortBy) localStorage.setItem(SORT_BY_KEY, sortBy)
      if (sortOrder) localStorage.setItem(SORT_ORDER_KEY, sortOrder)

      if (Object.values(r2Config).some(Boolean)) this.save(r2Config)
      return true
    } catch {
      /* invalid base64 or JSON */
    }
    return false
  }

  getShareUrl() {
    const b64 = this.toBase64()
    const url = new URL(window.location.href)
    url.searchParams.set('config', b64)
    url.hash = ''
    return url.toString()
  }
}

export { ConfigManager }
