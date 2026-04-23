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
    const buckets = await API.getBuckets()
    // Map backend field names to AppConfig
    this.#buckets = buckets.map(b => ({
      ...b,
      id: b.id,
      name: b.name,
      accountId: b.account_id,
      accessKeyId: b.access_key_id,
      secretAccessKey: b.secret_access_key,
      bucket: b.bucket_name,
      bucketName: b.bucket_name,
      customDomain: b.custom_domain,
      bucketAccess: b.bucket_visibility,
      bucketVisibility: b.bucket_visibility,
      isDefault: !!b.is_default
    }))
    
    if (this.#buckets.length > 0) {
      // If we already have an active config that exists in the new buckets list, keep it
      const currentId = this.#activeConfig?.id
      const stillExists = currentId ? this.#buckets.find(b => b.id === currentId) : null
      
      if (stillExists) {
        this.#activeConfig = stillExists
      } else {
        const defaultBucket = this.#buckets.find(b => b.isDefault) || this.#buckets[0]
        this.#activeConfig = defaultBucket
      }
    } else {
      this.#activeConfig = null
    }
  }

  /** @returns {AppConfig} */
  load() {
    if (this.#activeConfig) return this.#activeConfig

    try {
      const local = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') || {}
      if (local && Object.keys(local).length > 0) return local
    } catch {
      // ignore
    }
    return /** @type {AppConfig} */ ({})
  }

  /** @param {AppConfig} cfg */
  async save(cfg) {
    if (this.#user) {
      if (this.#activeConfig?.id) {
        // Update existing
        await API.updateBucket(this.#activeConfig.id, {
          ...cfg,
          bucketName: cfg.bucket || cfg.bucketName,
          bucketVisibility: cfg.bucketAccess || cfg.bucketVisibility
        })
        await this.refreshBuckets()
      } else {
        // Create new
        await API.createBucket({
          ...cfg,
          bucketName: cfg.bucket || cfg.bucketName,
          bucketVisibility: cfg.bucketAccess || cfg.bucketVisibility,
          isDefault: this.#buckets.length === 0
        })
        await this.refreshBuckets()
      }
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
    }
  }

  /** @returns {AppConfig} */
  get() {
    return this.load()
  }

  switchBucket(id) {
    const bucket = this.#buckets.find(b => b.id === Number(id))
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
