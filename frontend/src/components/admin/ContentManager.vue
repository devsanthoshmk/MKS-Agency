<script setup>
import { ref, defineProps } from 'vue'

const props = defineProps({
  adminToken: { type: String, required: true }
})

const contentSections = ref([
  { id: 'hero', name: 'Hero Section', description: 'Main banner, headline, and CTA', icon: 'layout', status: 'Active' },
  { id: 'about', name: 'About Us', description: 'Brand story and values', icon: 'book', status: 'Draft' },
  { id: 'products', name: 'Product Highlights', description: 'Featured products on home', icon: 'star', status: 'Active' },
  { id: 'testimonials', name: 'Reviews', description: 'Customer testimonials', icon: 'message', status: 'Active' },
  { id: 'faq', name: 'FAQs', description: 'Common questions', icon: 'help', status: 'Draft' },
  { id: 'contact', name: 'Contact Info', description: 'Address, email, social links', icon: 'phone', status: 'Active' },
  { id: 'footer', name: 'Footer', description: 'Legal links and copyright', icon: 'file-text', status: 'Active' },
  { id: 'announcement', name: 'Announcement Bar', description: 'Top site notice', icon: 'bell', status: 'Inactive' },
])

const selectedSection = ref(null)
const isEditing = ref(false)

function selectSection(section) {
  selectedSection.value = section
  isEditing.value = true
}

function closeEditor() {
  selectedSection.value = null
  isEditing.value = false
}

function getStatusStyle(status) {
  switch (status) {
    case 'Active': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }
    case 'Draft': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' }
    case 'Inactive': return { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.2)' }
    default: return { color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.2)' }
  }
}
</script>

<template>
  <div class="content-mgr">
    <!-- Header -->
    <div class="content-header">
      <div>
        <h2 class="content-header__title">Content Management</h2>
        <p class="content-header__desc">Customize your store's content and layout</p>
      </div>
      <button class="content-publish-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Publish Changes
      </button>
    </div>

    <!-- Grid -->
    <div class="content-grid">
      <div
        v-for="(section, index) in contentSections"
        :key="section.id"
        class="content-card"
        @click="selectSection(section)"
        :style="{ animationDelay: `${index * 50}ms` }"
      >
        <div class="content-card__header">
          <div class="content-card__icon">
            <!-- Layout -->
            <svg v-if="section.icon === 'layout'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <!-- Book -->
            <svg v-else-if="section.icon === 'book'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <!-- Star -->
            <svg v-else-if="section.icon === 'star'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <!-- Message -->
            <svg v-else-if="section.icon === 'message'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <!-- Help -->
            <svg v-else-if="section.icon === 'help'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <!-- Phone -->
            <svg v-else-if="section.icon === 'phone'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <!-- File Text -->
            <svg v-else-if="section.icon === 'file-text'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <!-- Bell -->
            <svg v-else-if="section.icon === 'bell'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          </div>
          <span
            class="content-badge"
            :style="{ color: getStatusStyle(section.status).color, background: getStatusStyle(section.status).bg, borderColor: getStatusStyle(section.status).border }"
          >
            {{ section.status }}
          </span>
        </div>

        <h4 class="content-card__name">{{ section.name }}</h4>
        <p class="content-card__desc">{{ section.description }}</p>

        <div class="content-card__cta">
          Edit Content
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
      
      <!-- Add New Section Card -->
      <div class="content-card content-card--add">
        <div class="content-card--add__inner">
          <div class="content-card--add__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <h4 class="content-card--add__title">Add Section</h4>
          <p class="content-card--add__hint">Custom HTML or presets</p>
        </div>
      </div>
    </div>

    <!-- Editor Modal -->
    <div v-if="selectedSection" class="content-modal-overlay">
      <div class="content-modal-backdrop" @click="closeEditor"></div>
      
      <div class="content-modal">
        <!-- Header -->
        <div class="content-modal__header">
          <div class="content-modal__header-left">
            <div class="content-modal__header-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </div>
            <div>
              <h3 class="content-modal__title">{{ selectedSection.name }}</h3>
              <p class="content-modal__desc">Editing content</p>
            </div>
          </div>
          <button @click="closeEditor" class="content-modal__close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Body -->
        <div class="content-modal__body">
          <div class="content-modal__grid">
            <!-- Sidebar Config -->
            <div class="content-modal__config">
              <div class="config-block">
                <label class="config-block__label">Visibility</label>
                <div class="config-toggle-row">
                  <span class="config-toggle-row__text">Show Section</span>
                  <div class="config-toggle">
                    <input type="checkbox" class="config-toggle__input" checked>
                    <div class="config-toggle__track"></div>
                    <div class="config-toggle__thumb"></div>
                  </div>
                </div>
              </div>
              
              <div class="config-block">
                <label class="config-block__label">Settings</label>
                <div class="config-field">
                  <span class="config-field__label">Background</span>
                  <div class="config-colors">
                    <button class="config-color config-color--active" style="background: #1a1b22;"></button>
                    <button class="config-color" style="background: #111218;"></button>
                    <button class="config-color" style="background: #0c0d10;"></button>
                  </div>
                </div>
                <div class="config-field">
                  <span class="config-field__label">Padding</span>
                  <input type="range" class="config-range">
                </div>
              </div>
            </div>

            <!-- Main Content Editor -->
            <div class="content-modal__editor">
              <div class="editor-notice">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Content editing is coming soon. Stay tuned!</span>
              </div>

              <div class="editor-fields">
                <div class="editor-field">
                  <label class="form-label">Heading</label>
                  <input type="text" value="Welcome to our store" class="form-input" disabled>
                </div>
                <div class="editor-field">
                  <label class="form-label">Subheading</label>
                  <textarea rows="3" class="form-input form-input--textarea" disabled>Discover the best products for your lifestyle.</textarea>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="content-modal__footer">
          <button class="content-modal__save" disabled>Save Changes</button>
          <button class="content-modal__cancel" @click="closeEditor">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-mgr {
  animation: fadeUp 0.4s ease;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ----- HEADER ----- */
.content-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  margin-bottom: 1.25rem;
}

@media (min-width: 640px) {
  .content-header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.content-header__title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.15rem;
  color: #f0f1f3;
  margin: 0;
}

.content-header__desc {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0.25rem 0 0;
}

.content-publish-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
  white-space: nowrap;
}

.content-publish-btn:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
  transform: translateY(-1px);
}

/* ----- GRID ----- */
.content-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 0.75rem;
}

@media (min-width: 640px) { .content-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .content-grid { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1280px) { .content-grid { grid-template-columns: repeat(4, 1fr); } }

.content-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 14px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
  animation: cardPop 0.4s ease both;
}

@keyframes cardPop {
  from { opacity: 0; transform: scale(0.96) translateY(6px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.content-card:hover {
  border-color: rgba(16, 185, 129, 0.2);
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}

.content-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.content-card__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: #9ca3af;
  transition: all 0.3s;
}

.content-card:hover .content-card__icon {
  background: rgba(16, 185, 129, 0.08);
  color: #10b981;
  transform: scale(1.05);
}

.content-badge {
  display: inline-flex;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border: 1px solid;
}

.content-card__name {
  font-weight: 700;
  font-size: 1rem;
  color: #f0f1f3;
  margin: 0 0 0.375rem;
  transition: color 0.2s;
}

.content-card:hover .content-card__name {
  color: #10b981;
}

.content-card__desc {
  font-size: 0.82rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
  flex: 1;
}

.content-card__cta {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 1rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #10b981;
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.25s ease;
}

.content-card:hover .content-card__cta {
  opacity: 1;
  transform: translateY(0);
}

/* Add Card */
.content-card--add {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.08);
  background: transparent;
}

.content-card--add:hover {
  border-color: rgba(16, 185, 129, 0.3);
  background: rgba(16, 185, 129, 0.03);
}

.content-card--add__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.5rem 0;
  flex: 1;
}

.content-card--add__icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  color: #4b5563;
  margin-bottom: 0.75rem;
  transition: all 0.3s;
}

.content-card--add:hover .content-card--add__icon {
  color: #10b981;
  transform: scale(1.1);
}

.content-card--add__title {
  font-weight: 700;
  color: #9ca3af;
  margin: 0;
  font-size: 0.9rem;
}

.content-card--add:hover .content-card--add__title {
  color: #10b981;
}

.content-card--add__hint {
  font-size: 0.72rem;
  color: #4b5563;
  margin: 0.25rem 0 0;
}


/* ======================== MODAL ======================== */
.content-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 768px) {
  .content-modal-overlay {
    align-items: center;
    padding: 1.5rem;
  }
}

.content-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
}

.content-modal {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 90vh;
  background: #111218;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px 20px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: modalSlideUp 0.3s ease;
}

@keyframes modalSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@media (min-width: 768px) {
  .content-modal {
    height: auto;
    max-height: 85vh;
    max-width: 820px;
    border-radius: 20px;
  }
}

/* Header */
.content-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

@media (min-width: 768px) {
  .content-modal__header { padding: 1.25rem 1.75rem; }
}

.content-modal__header-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.content-modal__header-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.content-modal__title {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: #f0f1f3;
  margin: 0;
}

.content-modal__desc {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0.125rem 0 0;
}

.content-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: none;
  color: #9ca3af;
  cursor: pointer;
  transition: all 0.2s;
}

.content-modal__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}

/* Body */
.content-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
}

@media (min-width: 768px) {
  .content-modal__body { padding: 1.75rem; }
}

.content-modal__grid {
  display: grid;
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .content-modal__grid { grid-template-columns: 220px 1fr; }
}

/* Config Sidebar */
.content-modal__config {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-block {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 1rem;
}

.config-block__label {
  display: block;
  font-size: 0.68rem;
  font-weight: 700;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.75rem;
}

.config-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-toggle-row__text {
  font-size: 0.85rem;
  font-weight: 500;
  color: #e5e7eb;
}

.config-toggle {
  position: relative;
  width: 40px;
  height: 22px;
}

.config-toggle__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}

.config-toggle__track {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  background: #374151;
  transition: background 0.2s;
}

.config-toggle__input:checked ~ .config-toggle__track {
  background: #10b981;
}

.config-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s;
  pointer-events: none;
}

.config-toggle__input:checked ~ .config-toggle__thumb {
  transform: translateX(18px);
}

.config-field {
  margin-top: 0.75rem;
}

.config-field__label {
  display: block;
  font-size: 0.72rem;
  color: #6b7280;
  margin-bottom: 0.375rem;
}

.config-colors {
  display: flex;
  gap: 0.375rem;
}

.config-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.config-color--active {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
}

.config-range {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #374151;
  appearance: none;
  cursor: pointer;
  outline: none;
}

.config-range::-webkit-slider-thumb {
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  cursor: pointer;
}

/* Editor */
.content-modal__editor {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.editor-notice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(245, 158, 11, 0.06);
  border: 1px solid rgba(245, 158, 11, 0.15);
  border-radius: 10px;
  color: #fbbf24;
  font-size: 0.82rem;
}

.editor-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  opacity: 0.35;
  pointer-events: none;
}

.editor-field {
  width: 100%;
}

.form-label {
  display: block;
  font-size: 0.72rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.375rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #f0f1f3;
  font-size: 0.9rem;
  outline: none;
  box-sizing: border-box;
}

.form-input--textarea {
  resize: none;
  font-family: inherit;
}

/* Footer */
.content-modal__footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

@media (min-width: 768px) {
  .content-modal__footer { padding: 1rem 1.75rem; }
}

.content-modal__save {
  flex: 1;
  padding: 0.875rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;
  opacity: 0.4;
}

.content-modal__save:disabled {
  cursor: not-allowed;
}

.content-modal__cancel {
  padding: 0.875rem 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #9ca3af;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.content-modal__cancel:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e5e7eb;
}
</style>
