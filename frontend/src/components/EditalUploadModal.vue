<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div class="modal-icon-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div class="modal-title-group">
          <h3>Adicionar Novo Edital</h3>
          <p>Faça upload de um arquivo PDF para ser processado pela IA</p>
        </div>
        <button class="btn-close" @click="$emit('close')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleUpload" class="modal-body">
        <!-- File Upload Area -->
        <div 
          class="file-drop-area" 
          :class="{ 'dragging': isDragging, 'has-file': file }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="$refs.fileInput.click()"
        >
          <input 
            type="file" 
            ref="fileInput" 
            class="hidden-input" 
            accept="application/pdf"
            @change="handleFileSelect"
          >
          
          <template v-if="!file">
            <div class="upload-placeholder">
              <div class="upload-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="12" y2="12"/>
                  <line x1="15" y1="15" x2="12" y2="12"/>
                </svg>
              </div>
              <p class="upload-text"><strong>Clique para selecionar</strong> ou arraste o PDF aqui</p>
              <p class="upload-hint">Somente arquivos PDF são aceitos</p>
            </div>
          </template>
          
          <template v-else>
            <div class="file-info">
              <div class="file-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="file-details">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
              </div>
              <button class="btn-remove-file" @click.stop="file = null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </template>
        </div>

        <!-- Form Fields -->
        <div class="form-grid">
          <div class="form-group">
            <label for="titulo">Título do Edital <span class="required">*</span></label>
            <input 
              type="text" 
              id="titulo" 
              v-model="formData.titulo" 
              placeholder="Ex: Edital 01/2024 - Bolsas de Mestrado"
              required
            >
          </div>
          
          <div class="form-group">
            <label for="ano">Ano <span class="required">*</span></label>
            <input 
              type="number" 
              id="ano" 
              v-model="formData.ano" 
              placeholder="2024"
              required
            >
          </div>
        </div>

        <div class="form-group">
          <label for="keywords">Palavras-chave (separadas por vírgula)</label>
          <input 
            type="text" 
            id="keywords" 
            v-model="formData.keywords" 
            placeholder="Ex: bolsa, mestrado, acadêmico"
          >
        </div>

        <div v-if="uploading" class="upload-progress-container">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <span class="progress-text">{{ progress === 100 ? 'Processando conteúdo...' : `Fazendo upload: ${progress}%` }}</span>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" @click="$emit('close')" :disabled="uploading">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" :disabled="uploading || !file">
            <template v-if="!uploading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Começar Processamento
            </template>
            <template v-else>
              <div class="spinner-sm"></div>
              Aguarde...
            </template>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { uploadEdital } from '../services/api.js'
import { success, error as showError, info } from '../utils/toast.js'

const emit = defineEmits(['close', 'success'])

const file = ref(null)
const isDragging = ref(false)
const uploading = ref(false)
const progress = ref(0)

const formData = reactive({
  titulo: '',
  ano: new Date().getFullYear(),
  keywords: ''
})

const handleFileSelect = (event) => {
  const selectedFile = event.target.files[0]
  if (selectedFile && selectedFile.type === 'application/pdf') {
    file.value = selectedFile
    // Tenta extrair o ano do nome do arquivo se não tiver sido preenchido
    if (!formData.titulo) {
      formData.titulo = selectedFile.name.replace('.pdf', '')
    }
  } else if (selectedFile) {
    showError('Por favor, selecione apenas arquivos PDF.')
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const droppedFile = event.dataTransfer.files[0]
  if (droppedFile && droppedFile.type === 'application/pdf') {
    file.value = droppedFile
    if (!formData.titulo) {
      formData.titulo = droppedFile.name.replace('.pdf', '')
    }
  } else if (droppedFile) {
    showError('Por favor, selecione apenas arquivos PDF.')
  }
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const handleUpload = async () => {
  if (!file.value) return

  try {
    uploading.value = true
    progress.value = 10
    
    const data = new FormData()
    data.append('arquivo', file.value)
    data.append('titulo', formData.titulo)
    data.append('ano', formData.ano)
    data.append('keywords', formData.keywords)

    // Simular progresso já que axios onUploadProgress é mais complexo aqui
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.floor(Math.random() * 10)
      }
    }, 800)

    const response = await uploadEdital(data)
    
    clearInterval(progressInterval)
    progress.value = 100
    
    success('Edital enviado e processado com sucesso!')
    emit('success', response.data)
    emit('close')
  } catch (err) {
    console.error('Erro no upload:', err)
    showError(err.message || 'Erro ao fazer upload do edital.')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 1.5rem;
}

.modal-card {
  background: var(--color-surface);
  border-radius: var(--radius-2xl);
  max-width: 550px;
  width: 100%;
  box-shadow: var(--shadow-xl);
  animation: modalIn 0.3s ease;
  overflow: hidden;
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 1.5rem 1.5rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.modal-icon-wrapper {
  width: 44px;
  height: 44px;
  background: var(--color-primary-50);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-600);
  flex-shrink: 0;
}

.modal-icon-wrapper svg {
  width: 24px;
  height: 24px;
}

.modal-title-group h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-gray-900);
  margin: 0;
}

.modal-title-group p {
  font-size: 0.8125rem;
  color: var(--color-gray-500);
  margin: 0.125rem 0 0 0;
}

.btn-close {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  background: none;
  border: none;
  color: var(--color-gray-400);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--color-surface-2);
  color: var(--color-gray-700);
}

.modal-body {
  padding: 1.5rem;
}

/* File Drop Area */
.file-drop-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-xl);
  padding: 2rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--color-bg);
  margin-bottom: 1.5rem;
}

.file-drop-area:hover, .file-drop-area.dragging {
  border-color: var(--color-primary-400);
  background: var(--color-primary-50);
}

.file-drop-area.has-file {
  border-style: solid;
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
}

.hidden-input {
  display: none;
}

.upload-icon {
  width: 48px;
  height: 48px;
  color: var(--color-primary-600);
  margin: 0 auto 1rem;
}

.upload-text {
  font-size: 0.9375rem;
  color: var(--color-gray-700);
  margin-bottom: 0.375rem;
}

.upload-hint {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.file-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  text-align: left;
}

.file-icon {
  width: 40px;
  height: 40px;
  background: var(--color-primary-100);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-600);
}

.file-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-900);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-size {
  font-size: 0.75rem;
  color: var(--color-gray-500);
}

.btn-remove-file {
  background: var(--color-danger-50);
  border: none;
  color: var(--color-danger-600);
  padding: 0.375rem;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* Form Fields */
.form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-gray-700);
  margin-bottom: 0.5rem;
}

.required {
  color: var(--color-danger-500);
}

.form-group input {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

/* Progress Bar */
.upload-progress-container {
  margin: 1.5rem 0 0.5rem;
}

.progress-bar-bg {
  height: 6px;
  background: var(--color-gray-100);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar-fill {
  height: 100%;
  background: var(--color-primary-600);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-primary-700);
  font-weight: 500;
}

.modal-footer {
  padding-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary-600);
  color: white;
}

.btn-primary:not(:disabled):hover {
  background: var(--color-primary-700);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-surface-2);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:not(:disabled):hover {
  background: var(--color-gray-100);
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .modal-footer .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
