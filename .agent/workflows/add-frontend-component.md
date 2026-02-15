---
description: How to add a new Vue component or page to the frontend
---

# Add Frontend Component Workflow 🎨

Follow this workflow when adding new Vue components or pages to the frontend.

## 1. Determine Component Type

| Type | Location | Naming |
|---|---|---|
| Reusable component | `frontend/src/components/` | `PascalCase.vue` |
| Admin component | `frontend/src/components/admin/` | `PascalCase.vue` |
| Page/View | `frontend/src/views/` | `PascalCase.vue` |
| Composable (state) | `frontend/src/composables/` | `useFeatureName.js` |

## 2. Create Component

Use this exact template:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue'
// Import composables for state (NOT direct API calls)
import { useAuth } from '../composables/useAuth'
import { useUI } from '../composables/useUI'

// Props
const props = defineProps({
  itemId: { type: String, required: true },
  showDetails: { type: Boolean, default: false }
})

// Emits
const emit = defineEmits(['close', 'update'])

// Composable state
const { user, isAuthenticated } = useAuth()
const { success, error: showError } = useUI()

// Local reactive state
const isLoading = ref(false)
const data = ref(null)

// Computed
const displayName = computed(() => data.value?.name ?? 'Unknown')

// Methods
async function handleAction() {
  isLoading.value = true
  try {
    // Use composable methods, NOT direct fetch calls
    // await someComposable.doAction()
    success('Action completed!')
    emit('update')
  } catch (e) {
    showError('Something went wrong')
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  // Load initial data if needed
})
</script>

<template>
  <div class="component-wrapper">
    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center justify-center p-8">
      <div class="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent" />
    </div>
    
    <!-- Error state -->
    <div v-else-if="!data" class="text-center text-gray-500 p-8">
      No data available
    </div>
    
    <!-- Content -->
    <div v-else>
      {{ displayName }}
    </div>
  </div>
</template>
```

## 3. State Management Rules
- **All API calls go through composables** — never use `fetch()` directly in components
- **Composables are singletons** — module-level state shared across components
- **NO Vuex or Pinia** — only Vue composables with `ref()` and `computed()`

## 4. Styling Rules
- Use **Tailwind CSS 4** utility classes
- Reference existing design tokens in `style.css` (colors, gradients, etc.)
- Use existing utility patterns: `gradient-hero`, `gradient-primary`, `btn`, `btn-primary`
- Mobile-first responsive design with Tailwind breakpoints
- NO external CSS libraries or icon libraries — use inline SVGs

## 5. If Adding a New Page
Add the route in `frontend/src/main.js`:

```javascript
const routes = [
  // ... existing routes
  {
    path: '/your-page',
    component: () => import('./views/YourPage.vue') // lazy load
  }
]
```

## 6. Performance Rules
- [ ] Images use `loading="lazy"`
- [ ] Search inputs debounced (300ms)
- [ ] Heavy derived state uses `computed()`, not template expressions
- [ ] Large lists consider `shallowRef()`
- [ ] New pages use lazy loading in router

## 7. Quality Gate
Follow the `/code-quality-gate` workflow.
