<script setup>
import { ref, defineProps } from 'vue'

const props = defineProps({
  adminToken: { type: String, required: true }
})

// Content sections to manage
const contentSections = ref([
  { id: 'hero', name: 'Hero Section', description: 'Main homepage banner and headline', icon: '🏠' },
  { id: 'about', name: 'About Section', description: 'Company information and story', icon: '📖' },
  { id: 'team', name: 'Team Members', description: 'Team profiles and bios', icon: '👥' },
  { id: 'testimonials', name: 'Testimonials', description: 'Customer reviews and feedback', icon: '⭐' },
  { id: 'faq', name: 'FAQ', description: 'Frequently asked questions', icon: '❓' },
  { id: 'contact', name: 'Contact Info', description: 'Contact details and social links', icon: '📞' },
  { id: 'banners', name: 'Promotional Banners', description: 'Sale and promotional banners', icon: '🎉' },
  { id: 'footer', name: 'Footer Content', description: 'Footer links and information', icon: '📋' },
])

const selectedSection = ref(null)
const isEditing = ref(false)
const isSaving = ref(false)

function selectSection(section) {
  selectedSection.value = section
  isEditing.value = true
}

function closeEditor() {
  selectedSection.value = null
  isEditing.value = false
}
</script>

<template>
  <div class="content-manager">
    <!-- Header -->
    <div class="mb-6">
      <h3 class="text-lg font-semibold text-surface-900 mb-2">Content Management</h3>
      <p class="text-sm text-surface-500">Manage website content sections. Changes will be saved to the repository.</p>
    </div>

    <!-- Coming Soon Notice -->
    <div class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-2xl p-8 mb-6 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-lg flex items-center justify-center">
        <svg class="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      </div>
      <h4 class="text-xl font-bold text-surface-900 mb-2">Content Editor Coming Soon</h4>
      <p class="text-surface-600 max-w-md mx-auto">
        The visual content editor is under development. You'll be able to edit all website content directly from this dashboard.
      </p>
    </div>

    <!-- Content Sections Grid -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div
        v-for="section in contentSections"
        :key="section.id"
        class="bg-white rounded-xl p-4 border border-surface-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer group"
        @click="selectSection(section)"
      >
        <div class="text-3xl mb-3">{{ section.icon }}</div>
        <h4 class="font-semibold text-surface-900 group-hover:text-primary-700 transition-colors">
          {{ section.name }}
        </h4>
        <p class="text-sm text-surface-500 mt-1">{{ section.description }}</p>
        <div class="mt-3 flex items-center text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Edit content</span>
          <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>

    <!-- Section Editor Modal (Placeholder) -->
    <div v-if="isEditing && selectedSection" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="closeEditor" />
      <div class="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div class="flex items-center justify-between p-6 border-b border-surface-200">
          <div class="flex items-center gap-3">
            <span class="text-2xl">{{ selectedSection.icon }}</span>
            <div>
              <h3 class="text-xl font-bold">{{ selectedSection.name }}</h3>
              <p class="text-sm text-surface-500">{{ selectedSection.description }}</p>
            </div>
          </div>
          <button @click="closeEditor" class="p-2 hover:bg-surface-100 rounded-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-6">
          <div class="text-center py-12">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
              <svg class="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h4 class="text-lg font-semibold text-surface-700 mb-2">Editor Under Development</h4>
            <p class="text-surface-500 text-sm max-w-sm mx-auto">
              This content section editor is being built. Check back soon for the ability to edit {{ selectedSection.name.toLowerCase() }} content.
            </p>
          </div>
        </div>

        <div class="flex gap-3 p-6 border-t border-surface-200 bg-surface-50">
          <button class="flex-1 btn btn-primary btn-lg" disabled>Save Changes</button>
          <button class="btn btn-secondary btn-lg" @click="closeEditor">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
