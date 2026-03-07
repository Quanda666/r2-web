import { filesize } from 'filesize'
import { AUDIO_RE, IMAGE_RE, TEXT_RE, VIDEO_RE } from './constants.js'
import { t } from './i18n.js'
import { R2Client } from './r2-client.js'
import { UIManager } from './ui-manager.js'
import { $, formatDate, getErrorMessage, getFileName, getMimeType } from './utils.js'

class FilePreview {
  /** @type {R2Client} */
  #r2
  /** @type {UIManager} */
  #ui
  #currentKey = ''
  #currentText = ''
  #currentCopyType = /** @type {'text'|'image'|null} */ (null)
  #currentImageUrl = ''

  /** @param {R2Client} r2 @param {UIManager} ui */
  constructor(r2, ui) {
    this.#r2 = r2
    this.#ui = ui
  }

  get currentKey() {
    return this.#currentKey
  }

  /** @param {{key: string, size?: number, lastModified?: number}} item */
  async preview(item) {
    const key = item.key
    this.#currentKey = key
    this.#currentText = ''
    this.#currentCopyType = null
    this.#currentImageUrl = ''
    const dialog = /** @type {HTMLDialogElement} */ ($('#preview-dialog'))
    const body = $('#preview-body')
    const footer = $('#preview-footer')
    const filename = $('#preview-filename')
    const copyBtn = /** @type {HTMLElement} */ ($('#preview-copy'))

    filename.textContent = getFileName(key)
    body.innerHTML = '<div style="color:var(--text-tertiary)">Loading...</div>'
    footer.innerHTML = ''
    footer.classList.remove('bordered')
    copyBtn.hidden = true
    dialog.showModal()

    try {
      const meta = {
        contentLength: item.size ?? 0,
        contentType: getMimeType(key),
        lastModified: item.lastModified ? new Date(item.lastModified) : undefined,
      }

      footer.classList.add('bordered')
      footer.innerHTML = `
        <span>${t('size')}: ${filesize(meta.contentLength)}</span>
        <span>${t('contentType')}: ${meta.contentType || 'unknown'}</span>
        ${meta.lastModified ? `<span>${t('lastModified')}: ${formatDate(meta.lastModified)}</span>` : ''}
      `

      if (IMAGE_RE.test(key)) {
        const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
        this.#currentImageUrl = url
        this.#currentCopyType = 'image'
        body.innerHTML = `<img src="${url}" alt="${getFileName(key)}">`
        copyBtn.dataset.tooltip = t('copyLink')
        copyBtn.hidden = false
      } else if (VIDEO_RE.test(key)) {
        const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
        body.innerHTML = `<video src="${url}" controls></video>`
      } else if (AUDIO_RE.test(key)) {
        const url = this.#r2.getPublicUrl(key) ?? (await this.#r2.getPresignedUrl(key))
        body.innerHTML = `<audio src="${url}" controls></audio>`
      } else if (TEXT_RE.test(key)) {
        const res = await this.#r2.getObject(key)
        const text = await res.text()
        this.#currentText = text
        this.#currentCopyType = 'text'
        body.innerHTML = ''
        const pre = document.createElement('pre')
        pre.textContent = text
        body.appendChild(pre)
        copyBtn.dataset.tooltip = t('copyText')
        copyBtn.hidden = false
      } else {
        body.innerHTML = `<p style="color:var(--text-tertiary)">${t('previewNotAvailable')}</p>`
      }
    } catch (/** @type {any} */ err) {
      body.innerHTML = `<p style="color:var(--text-danger)">${err.message}</p>`
    }
  }

  async downloadCurrent() {
    if (!this.#currentKey) return
    try {
      const filename = getFileName(this.#currentKey)
      const url = await this.#r2.getDownloadUrl(this.#currentKey, filename)
      const a = document.createElement('a')
      a.href = url
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (/** @type {any} */ err) {
      const errorKey = getErrorMessage(err)
      if (errorKey === 'networkError') {
        this.#ui.toast(t('networkError', { msg: err.message }), 'error')
      } else {
        this.#ui.toast(t(/** @type {any} */ (errorKey)), 'error')
      }
    }
  }

  async copyCurrentText() {
    if (this.#currentCopyType === 'text' && this.#currentText) {
      try {
        await navigator.clipboard.writeText(this.#currentText)
        this.#ui.toast(t('copyTextSuccess'), 'success')
      } catch {
        await this.#ui.prompt(t('copyTextTitle'), t('copyTextLabel'), this.#currentText)
      }
      return
    }

    if (this.#currentCopyType === 'image' && this.#currentImageUrl) {
      try {
        await navigator.clipboard.writeText(this.#currentImageUrl)
        this.#ui.toast(t('linkCopied'), 'success')
      } catch {
        await this.#ui.prompt(t('copyTextTitle'), t('copyUrl'), this.#currentImageUrl)
      }
    }
  }
}

export { FilePreview }
