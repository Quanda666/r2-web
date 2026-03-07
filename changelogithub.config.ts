import { defineConfig } from 'changelogithub'

export default defineConfig({
  types: {
    feat: { title: '🚀 Features' },
    fix: { title: '🐞 Bug Fixes' },
    perf: { title: '🏎 Performance' },
    chore: { title: '🧹 Chores' },
    style: { title: '🎨 Styles' },
    refactor: { title: '🔨 Refactors' },
    docs: { title: '📚 Documentation' },
    ci: { title: '⚙️ CI' },
    build: { title: '🏗 Build' },
  },
})
