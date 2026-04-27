<template>
  <div v-if="hasSteps || hasVideo" class="stepsAndVideo" :class="{ withVideo: hasVideo }">
    <div v-if="hasSteps" class="stepsColumn">
      <div v-for="(step, i) in steps" :key="i" class="stepItem">
        <span class="stepNumber">{{ i + 1 }}</span>
        <span class="stepText">{{ step }}</span>
      </div>
    </div>

    <div v-if="hasVideo" class="videoColumn">
      <div class="videoWrapper">
        <!-- Google Drive: use iframe embed -->
        <iframe
          v-if="googleDriveEmbedUrl"
          :src="googleDriveEmbedUrl"
          class="demoVideo demoIframe"
          allow="autoplay"
          allowfullscreen
          title="Tutorial video"
        />
        <!-- Direct video URL -->
        <template v-else>
          <video
            ref="videoEl"
            :src="normalizedVideoUrl"
            class="demoVideo"
            autoplay
            loop
            muted
            playsinline
            @click="togglePlay"
          />
          <button v-if="paused" class="playOverlay" @click="togglePlay">
            <v-icon size="44" color="white">mdi-play-circle-outline</v-icon>
          </button>
        </template>
        <button class="fullscreenBtn" @click.stop="openFullscreen">
          <v-icon size="18" color="white">mdi-fullscreen</v-icon>
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="fs-fade">
      <div v-if="fsOpen" class="fsOverlay" @click.self="closeFullscreen">
        <div class="fsContainer">
          <iframe
            v-if="googleDriveEmbedUrl"
            :src="googleDriveEmbedUrl"
            class="fsVideo fsIframe"
            allow="autoplay"
            allowfullscreen
            title="Tutorial video (fullscreen)"
          />
          <template v-else>
            <video
              ref="fsVideoEl"
              :src="normalizedVideoUrl"
              class="fsVideo"
              autoplay
              loop
              muted
              playsinline
              @click="toggleFsPlay"
            />
            <button v-if="fsPaused" class="fsPlayOverlay" @click="toggleFsPlay">
              <v-icon size="64" color="white">mdi-play-circle-outline</v-icon>
            </button>
          </template>
          <button class="fsCloseBtn" @click="closeFullscreen">
            <v-icon size="24" color="white">mdi-close</v-icon>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'

const props = defineProps({
  steps: { type: Array, default: () => [] },
  videoUrl: { type: [String, Array], default: null },
})

const normalizedVideoUrl = computed(() => {
  if (Array.isArray(props.videoUrl)) return props.videoUrl[0] || null
  return props.videoUrl
})

/** Google Drive view link -> embed (preview) URL for iframe */
const googleDriveEmbedUrl = computed(() => {
  const url = normalizedVideoUrl.value
  if (!url || typeof url !== 'string') return null
  const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) return null
  return `https://drive.google.com/file/d/${match[1]}/preview`
})

const hasSteps = computed(() => props.steps?.length > 0)
const hasVideo = computed(() => !!normalizedVideoUrl.value)

const videoEl = ref(null)
const paused = ref(false)

function togglePlay() {
  if (!videoEl.value) return
  if (videoEl.value.paused) {
    videoEl.value.play()
    paused.value = false
  } else {
    videoEl.value.pause()
    paused.value = true
  }
}

const fsOpen = ref(false)
const fsPaused = ref(false)
const fsVideoEl = ref(null)

async function openFullscreen() {
  fsOpen.value = true
  fsPaused.value = false
  await nextTick()
  fsVideoEl.value?.play()
}

function closeFullscreen() {
  fsOpen.value = false
  fsVideoEl.value?.pause()
}

function toggleFsPlay() {
  if (!fsVideoEl.value) return
  if (fsVideoEl.value.paused) {
    fsVideoEl.value.play()
    fsPaused.value = false
  } else {
    fsVideoEl.value.pause()
    fsPaused.value = true
  }
}
</script>

<style scoped>
.stepsAndVideo {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 540px) {
  .stepsAndVideo.withVideo {
    flex-direction: row;
    align-items: flex-start;
    gap: 1rem;
  }

  .stepsAndVideo.withVideo .stepsColumn {
    flex: 1 1 45%;
    min-width: 0;
  }

  .stepsAndVideo.withVideo .videoColumn {
    flex: 1 1 55%;
    min-width: 0;
  }
}

.stepsColumn {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stepItem {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
}

.stepNumber {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(var(--freshSky-rgb), 0.2);
  color: var(--freshSky);
  font-family: var(--font);
  font-size: 0.75rem;
  font-weight: 700;
  margin-top: 1px;
}

.stepText {
  font-family: var(--font);
  font-size: 0.85rem;
  color: rgba(var(--ink-rgb), 0.7);
  line-height: 1.45;
}

.videoColumn {
  width: 100%;
}

.videoWrapper {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(var(--ink-rgb), 0.1);
  background: rgba(var(--shadow-rgb), 0.3);
  cursor: pointer;
}

.demoVideo {
  display: block;
  width: 100%;
  height: auto;
  max-height: 320px;
  object-fit: contain;
  background: #000;
}

.demoIframe {
  min-height: 200px;
  height: 320px;
  border: none;
}

.playOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--shadow-rgb), 0.4);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.playOverlay:hover {
  background: rgba(var(--shadow-rgb), 0.55);
}

.fullscreenBtn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(var(--shadow-rgb), 0.55);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease, background 0.15s ease;
}

.videoWrapper:hover .fullscreenBtn {
  opacity: 1;
}

.fullscreenBtn:hover {
  background: rgba(var(--shadow-rgb), 0.8);
}

/* --- fullscreen overlay --- */
.fsOverlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--shadow-rgb), 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.fsContainer {
  position: relative;
  width: 90vw;
  max-width: 1100px;
  max-height: 85vh;
  border-radius: 16px;
  overflow: hidden;
  background: #000;
  box-shadow: 0 8px 60px rgba(var(--shadow-rgb), 0.6);
}

.fsVideo {
  display: block;
  width: 100%;
  height: auto;
  max-height: 85vh;
  object-fit: contain;
  cursor: pointer;
}

.fsIframe {
  width: 100%;
  height: 85vh;
  min-height: 320px;
  border: none;
}

.fsPlayOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(var(--shadow-rgb), 0.35);
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
}

.fsPlayOverlay:hover {
  background: rgba(var(--shadow-rgb), 0.5);
}

.fsCloseBtn {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(var(--shadow-rgb), 0.6);
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

.fsCloseBtn:hover {
  background: rgba(var(--shadow-rgb), 0.85);
  transform: scale(1.1);
}

/* transition */
.fs-fade-enter-active,
.fs-fade-leave-active {
  transition: opacity 0.25s ease;
}

.fs-fade-enter-from,
.fs-fade-leave-to {
  opacity: 0;
}
</style>
