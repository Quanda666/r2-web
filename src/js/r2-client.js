import { AwsClient } from 'aws4fetch'
import { PAGE_SIZE } from './constants.js'
import { encodeS3Key } from './utils.js'
import { ConfigManager } from './config-manager.js'

/** @typedef {{ key: string; isFolder: boolean; size?: number; lastModified?: string }} FileItem */

class R2Client {
  /** @type {AwsClient | null} */
  #client = null
  /** @type {ConfigManager | null} */
  #config = null

  /** @param {ConfigManager} configManager */
  init(configManager) {
    this.#config = configManager
    const cfg = configManager.get()
    
    // Ensure we have credentials before creating the client
    if (cfg.accountId && cfg.accessKeyId && cfg.secretAccessKey) {
      this.#client = new AwsClient({
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
        service: 's3',
        region: 'auto',
      })
    } else {
      this.#client = null
    }
  }

  #getBucketUrl() {
    if (!this.#config) throw new Error('Config manager not initialized')
    const url = this.#config.getBucketUrl()
    if (!url) throw new Error('R2 Bucket URL is not configured')
    return url
  }

  /**
   * Internal fetch with signing and error handling
   * @param {string | URL} url 
   * @param {RequestInit} [init]
   */
  async #fetch(url, init) {
    if (!this.#client) {
      throw new Error('R2 Client not initialized or missing credentials')
    }
    
    try {
      const res = await this.#client.fetch(url.toString(), init)
      if (!res.ok) {
        if (res.status === 401) throw new Error('HTTP_401')
        if (res.status === 403) throw new Error('HTTP_403')
        if (res.status === 404) throw new Error('HTTP_404')
        throw new Error(`HTTP ${res.status}`)
      }
      return res
    } catch (/** @type {any} */ err) {
      if (err.message.startsWith('HTTP_') || err.message.startsWith('HTTP ')) throw err
      console.error('R2 Fetch failed:', err)
      throw err
    }
  }

  /** @param {string} [prefix] @param {string} [continuationToken] */
  async listObjects(prefix = '', continuationToken = '') {
    const bucketUrl = this.#getBucketUrl()
    const url = new URL(bucketUrl)
    url.searchParams.set('list-type', '2')
    url.searchParams.set('delimiter', '/')
    url.searchParams.set('max-keys', String(PAGE_SIZE))
    if (prefix) url.searchParams.set('prefix', prefix)
    if (continuationToken) url.searchParams.set('continuation-token', continuationToken)

    const res = await this.#fetch(url)
    const text = await res.text()
    const doc = new DOMParser().parseFromString(text, 'application/xml')

    // Check for S3 error in XML
    const errorEl = doc.querySelector('Error')
    if (errorEl) {
      const code = errorEl.querySelector('Code')?.textContent
      const message = errorEl.querySelector('Message')?.textContent
      throw new Error(code ? `${code}: ${message}` : message || 'Unknown S3 error')
    }

    /** @type {FileItem[]} */
    const folders = [...doc.querySelectorAll('CommonPrefixes > Prefix')].map((el) => ({
      key: el.textContent ?? '',
      isFolder: true,
    }))

    /** @type {FileItem[]} */
    const files = [...doc.querySelectorAll('Contents')]
      .map((el) => ({
        key: el.querySelector('Key')?.textContent ?? '',
        size: parseInt(el.querySelector('Size')?.textContent ?? '0', 10),
        lastModified: el.querySelector('LastModified')?.textContent ?? '',
        isFolder: false,
      }))
      .filter((f) => f.key !== prefix)

    const isTruncated = doc.querySelector('IsTruncated')?.textContent === 'true'
    const nextToken = doc.querySelector('NextContinuationToken')?.textContent || ''

    return { folders, files, isTruncated, nextToken }
  }

  /**
   * 检查对象是否存在，使用 ListObjectsV2 避免 HEAD 404 污染控制台
   * @param {string} key
   * @returns {Promise<boolean>}
   */
  async fileExists(key) {
    try {
      const bucketUrl = this.#getBucketUrl()
      const url = new URL(bucketUrl)
      url.searchParams.set('list-type', '2')
      url.searchParams.set('max-keys', '1')
      url.searchParams.set('prefix', key)
      
      const res = await this.#fetch(url)
      const text = await res.text()
      const doc = new DOMParser().parseFromString(text, 'application/xml')
      return [...doc.querySelectorAll('Contents > Key')].some((el) => el.textContent === key)
    } catch {
      return false
    }
  }

  /** @param {string} key @param {string} contentType */
  async putObjectSigned(key, contentType) {
    if (!this.#client) {
      throw new Error('R2 Client not initialized or missing credentials')
    }
    const url = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    const req = await this.#client.sign(url, {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
    })
    return { url: req.url, headers: Object.fromEntries(req.headers.entries()) }
  }

  /** @param {string} key */
  async getObject(key) {
    const url = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    return this.#fetch(url)
  }

  /** @param {string} key */
  async getPresignedUrl(key) {
    if (!this.#client) {
      throw new Error('R2 Client not initialized or missing credentials')
    }
    const url = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    const signed = await this.#client.sign(url, {
      method: 'GET',
      aws: { signQuery: true },
    })
    return signed.url
  }

  /** @param {string} key @param {string} filename */
  async getDownloadUrl(key, filename) {
    if (!this.#client) {
      throw new Error('R2 Client not initialized or missing credentials')
    }
    const base = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    const url = new URL(base)
    url.searchParams.set('response-content-disposition', `attachment; filename="${encodeURIComponent(filename)}"`)
    const signed = await this.#client.sign(url.toString(), {
      method: 'GET',
      aws: { signQuery: true },
    })
    return signed.url
  }

  /** @param {string} key */
  getPublicUrl(key) {
    if (!this.#config) return null
    const cfg = this.#config.get()
    if (cfg.customDomain && cfg.bucketAccess !== 'private') {
      return `${cfg.customDomain}/${encodeS3Key(key)}`
    }
    return null
  }

  /** @param {string} key */
  async headObject(key) {
    const url = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    const res = await this.#fetch(url, { method: 'HEAD' })
    return {
      contentType: res.headers.get('content-type'),
      contentLength: parseInt(res.headers.get('content-length') || '0', 10),
      lastModified: res.headers.get('last-modified'),
      etag: res.headers.get('etag'),
    }
  }

  /** @param {string} key */
  async deleteObject(key) {
    const url = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    await this.#fetch(url, { method: 'DELETE' })
  }

  /** @param {string} src @param {string} dest */
  async copyObject(src, dest) {
    if (!this.#config) throw new Error('Config manager not initialized')
    const cfg = this.#config.get()
    const url = `${this.#getBucketUrl()}/${encodeS3Key(dest)}`
    await this.#fetch(url, {
      method: 'PUT',
      headers: {
        'x-amz-copy-source': `/${cfg.bucket || cfg.bucketName}/${encodeS3Key(src)}`,
      },
    })
  }

  /** @param {string} key @param {string} contentType */
  async updateContentType(key, contentType) {
    if (!this.#config) throw new Error('Config manager not initialized')
    const cfg = this.#config.get()
    const url = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    await this.#fetch(url, {
      method: 'PUT',
      headers: {
        'x-amz-copy-source': `/${cfg.bucket || cfg.bucketName}/${encodeS3Key(key)}`,
        'x-amz-metadata-directive': 'REPLACE',
        'Content-Type': contentType,
      },
    })
  }

  /** @param {string} prefix */
  async createFolder(prefix) {
    const key = prefix.endsWith('/') ? prefix : prefix + '/'
    const url = `${this.#getBucketUrl()}/${encodeS3Key(key)}`
    await this.#fetch(url, {
      method: 'PUT',
      headers: { 'Content-Length': '0' },
      body: '',
    })
  }
}

export { R2Client }
