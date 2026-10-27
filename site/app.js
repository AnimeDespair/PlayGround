const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const signals = [
  {
    title: 'The quiet between two thoughts',
    body: 'A signal has been received. It is not an answer; it is a direction.'
  },
  {
    title: 'What the edge is holding',
    body: 'The thing you keep circling is usually smaller than the story around it. Name the edge first.'
  },
  {
    title: 'A smaller, truer sentence',
    body: 'If the work feels heavy, the sentence is probably too large. Cut it until it can be said in one breath.'
  },
  {
    title: 'The shape of the missing piece',
    body: 'Absence has a silhouette. Describe what is not there and the next step often appears inside it.'
  }
]

const replies = {
  focus: 'Focus is not a tighter grip. It is a smaller surface. Close three tabs, name one outcome, and give it the next twenty minutes. The rest can wait without being abandoned.',
  lost: 'Being lost in details usually means the frame is missing, not the answer. Zoom out one level: what is this work for, and what would make it obviously finished? Then choose the smallest detail that serves that frame.',
  next: 'Do the next thing that makes the unknown smaller. Not the most impressive thing — the one that turns a question into evidence. A rough paragraph, a five-line test, one honest message.',
  generic: [
    'Start with the smallest true sentence. If you can write it plainly, the rest of the structure has something to stand on.',
    'Notice what you keep explaining twice. Repetition is a signal that the center of the problem has not been named yet.',
    'Make the next step small enough to finish before doubt arrives. Momentum is a form of clarity.',
    'Separate the decision from the delivery. Decide what is true first; worry about how to say it second.'
  ]
}

let genericIndex = 0
let busy = false
let signalIndex = 0

const clock = document.getElementById('clock')
const signalButton = document.getElementById('signal-button')
const readout = document.getElementById('orb-readout')
const signalTitle = document.getElementById('signal-title')
const signalBody = document.getElementById('signal-body')
const output = document.getElementById('console-output')
const askForm = document.getElementById('ask-form')
const askInput = document.getElementById('ask-input')
const accessForm = document.getElementById('access-form')
const accessNote = document.getElementById('access-note')
const year = document.getElementById('year')

function updateClock () {
  if (!clock) return
  const now = new Date()
  clock.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function pickReply (text, key) {
  const value = (text || '').toLowerCase()
  if (key && replies[key]) return replies[key]
  if (/focus|distract|concentrat/.test(value)) return replies.focus
  if (/lost|detail|overwhelm|stuck/.test(value)) return replies.lost
  if (/next|start|begin|do now/.test(value)) return replies.next
  const list = replies.generic
  const reply = list[genericIndex % list.length]
  genericIndex += 1
  return reply
}

function setTranscript (question, response) {
  if (!output) return
  if (busy) return
  busy = true
  output.textContent = ''

  const prompt = document.createElement('p')
  prompt.className = 'prompt-line'
  prompt.textContent = `> ${question}`
  output.appendChild(prompt)

  const line = document.createElement('p')
  line.className = 'response-line'
  const text = document.createTextNode('')
  line.appendChild(text)
  output.appendChild(line)

  if (reduceMotion) {
    text.data = response
    busy = false
    return
  }

  const caret = document.createElement('span')
  caret.className = 'caret'
  line.appendChild(caret)

  let index = 0
  const tick = () => {
    index += 1
    text.data = response.slice(0, index)
    output.scrollTop = output.scrollHeight
    if (index < response.length) {
      window.setTimeout(tick, 11)
    } else {
      caret.remove()
      busy = false
    }
  }
  window.setTimeout(tick, 180)
}

if (signalButton) {
  signalButton.addEventListener('click', () => {
    signalIndex = (signalIndex + 1) % signals.length
    const signal = signals[signalIndex]
    readout.classList.add('is-changing')
    window.setTimeout(() => {
      signalTitle.textContent = signal.title
      signalBody.textContent = signal.body
      readout.classList.remove('is-changing')
    }, reduceMotion ? 0 : 220)
  })
}

if (askForm) {
  askForm.addEventListener('submit', event => {
    event.preventDefault()
    const question = (askInput.value || '').trim() || 'What am I missing?'
    setTranscript(question, pickReply(question))
    askInput.value = ''
  })
}

document.querySelectorAll('.chips [data-prompt]').forEach(button => {
  button.addEventListener('click', () => {
    const key = button.dataset.prompt
    setTranscript(button.textContent.trim(), pickReply(button.textContent, key))
  })
})

if (accessForm) {
  accessForm.addEventListener('submit', event => {
    event.preventDefault()
    const email = accessForm.querySelector('input[type="email"]')
    if (!email || !email.value) return
    accessNote.textContent = 'A key is reserved. Look for one observation at first light.'
    accessNote.classList.add('is-success')
    email.value = ''
  })
}

if (year) year.textContent = String(new Date().getFullYear())
updateClock()
window.setInterval(updateClock, 30000)

const canvas = document.getElementById('sky')
if (canvas && canvas.getContext) {
  const context = canvas.getContext('2d')
  let points = []
  let width = 0
  let height = 0
  let frame = 0

  const seed = () => {
    const count = Math.max(30, Math.min(86, Math.round((width * height) / 22000)))
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.075,
      vy: (Math.random() - 0.5) * 0.075,
      radius: Math.random() * 1.3 + 0.35,
      warm: Math.random() > 0.72
    }))
  }

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    width = Math.max(1, rect.width)
    height = Math.max(1, rect.height)
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(height * ratio)
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
    seed()
    if (reduceMotion) draw()
  }

  const draw = () => {
    context.clearRect(0, 0, width, height)

    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      for (let j = i + 1; j < points.length; j++) {
        const other = points[j]
        const dx = point.x - other.x
        const dy = point.y - other.y
        const distance = Math.hypot(dx, dy)
        if (distance > 118) continue
        const alpha = (1 - distance / 118) * 0.17
        context.strokeStyle = `rgba(155, 139, 234, ${alpha})`
        context.lineWidth = 0.6
        context.beginPath()
        context.moveTo(point.x, point.y)
        context.lineTo(other.x, other.y)
        context.stroke()
      }
    }

    for (const point of points) {
      context.beginPath()
      context.fillStyle = point.warm
        ? 'rgba(232, 192, 122, 0.8)'
        : 'rgba(244, 241, 232, 0.58)'
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
      context.fill()

      point.x += point.vx
      point.y += point.vy

      if (point.x < -12) point.x = width + 12
      if (point.x > width + 12) point.x = -12
      if (point.y < -12) point.y = height + 12
      if (point.y > height + 12) point.y = -12
    }

    if (!reduceMotion) frame = window.requestAnimationFrame(draw)
  }

  resize()
  window.addEventListener('resize', resize, { passive: true })
  if (!reduceMotion) frame = window.requestAnimationFrame(draw)
  window.addEventListener('pagehide', () => window.cancelAnimationFrame(frame), { once: true })
}

window.requestAnimationFrame(() => {
  document.body.dataset.appReady = 'true'
  window.__HERMIUS_READY__ = true
})
