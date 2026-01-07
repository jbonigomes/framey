import React from 'react'
import ReactDOM from 'react-dom'

import GIF from 'gif.js'
import workerUrl from 'gif.js/dist/gif.worker.js?url'
import { get, set } from 'idb-keyval'

import Logo from './components/Logo'
import Back from './components/Back'
import Camera from './components/Camera'
import Delete from './components/Delete'
import Download from './components/Download'
import Carousel from './components/Carousel'

// TODO: move styles to css
import './index.css'

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

const base64FramesToGifPerFrameDelay = async (
  framesBase64,
  frameDelayMs,
) => {
  if (!framesBase64.length) {
    throw new Error('No frames provided')
  }

  if (!Number.isFinite(frameDelayMs) || frameDelayMs <= 0 || frameDelayMs > 10000) {
    throw new Error('Delay must be a positive number smaller than 10000 (10s)')
  }

  const { naturalWidth: width, naturalHeight: height } = await loadImage(framesBase64[0])
  const canvas = document.createElement('canvas')

  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width,
    height,
    workerScript: workerUrl,
  })

  for (const src of framesBase64) {
    const img = await loadImage(src)
    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)
    gif.addFrame(canvas, { copy: true, delay: frameDelayMs })
  }

  return new Promise((resolve, reject) => {
    gif.on('finished', resolve)
    gif.on('error', reject)
    gif.render()
  })
}

const App = () => {
  const inputRef = React.useRef(null)

  const [gifUrl, setGifUrl] = React.useState('')
  const [project, setProject] = React.useState(null)
  const [projects, setProjects] = React.useState(null)

  const onGoBack = () => {
    setProject(null)
  }

  const onCreateProject = () => {
    const projectName = prompt('Enter project name')
    const projectHas = projects
      .map(({ name }) => name.trim().toLowerCase())
      .includes(projectName.trim().toLowerCase())

    if (projectName && !projectHas) {
      const newProject = { name: projectName, images: [] }
      const newProjects = [...projects, newProject]

      setProject(newProject)
      setProjects(newProjects)
      set('projects', newProjects)
    } else {
      alert('Could not create project')
    }
  }

  const onLoadProject = (_name) => () => {
    get('projects')
      .then((_projects) => {
        const _project = _projects.find(({ name }) => name === _name)

        if (_project) {
          setProject(_project)
        } else {
          alert('Could not open project')
        }
      })
      .catch(() => alert('Something went wrong!'))
  }

  const onOpenCamera = () => {
    inputRef?.current?.click?.()
  }

  const onDeleteProject = (_name) => () => {
    if (confirm('Are you sure?')) {
      const newProjects = projects.filter(({ name }) => name !== _name)

      setProject(null)
      setProjects(newProjects)
      set('projects', newProjects)
    }
  }

  const onCapture = ({ target }) => {
    const [file] = target?.files ?? []

    if (file) {
      const reader = new FileReader()

      reader.onload = () => {
        createImageBitmap(file).then((img) => {
          const canvas = document.createElement('canvas')
          const scale = Math.min(1, 720 / img.width)
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)

          canvas.width = w
          canvas.height = h

          target.value = ''

          canvas.getContext('2d').drawImage(img, 0, 0, w, h)

          const newProject = {
            ...project,
            images: [...project.images, canvas.toDataURL('image/jpeg', 0.8)],
          }

          const newProjects = projects.map(
            (_project) => _project.name === project.name ? newProject : _project
          )

          setProject(newProject)
          setProjects(newProjects)
          set('projects', newProjects)
        })
      }

      reader.readAsDataURL(file)
    }
  }

  const onCloseGifDownload = () => {
    setGifUrl('')
  }

  const onExport = () => {
    const delay = Number(prompt('Delay (ms):'))

    base64FramesToGifPerFrameDelay(project.images.map((img) => img), delay)
      .then((blob) => {
        setGifUrl(URL.createObjectURL(blob))
      })
      .catch(alert)
  }

  React.useEffect(() => {
    get('projects')
      .then((_projects = []) => setProjects(_projects))
      .catch(() => setProjects([]))
  }, [])

  if (!projects) {
    return <div>Loading...</div>
  }

  if (projects.length === 0) {
    return (
      <>
        <Logo />
        <h1>Create your first project</h1>
        <button className="cta" onClick={onCreateProject}>
          Create New Project
        </button>
      </>
    )
  }

  if (!project) {
    return (
      <>
        <Logo />
        <ul>
          {projects.map(({ name }) => (
            <li key={name}>
              <button onClick={onLoadProject(name)}>
                {name}
              </button>
              <button onClick={onDeleteProject(name)}>
                X
              </button>
            </li>
          ))}
        </ul>
        <button className="cta" onClick={onCreateProject}>
          Create New Project
        </button>
      </>
    )
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onCapture}
        style={{ display: 'none' }}
      />
      <main>
        <nav style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={onGoBack}>
            <Back />
          </button>
          <Logo />
          <button onClick={onExport}>
            <Download />
          </button>
        </nav>
        {/* TODO: make the title editable */}
        <h1>{project.name}</h1>
        <Carousel images={project.images} />
        <button
          onClick={onOpenCamera}
          style={{
            left: '50%',
            bottom: '50px',
            position: 'fixed',
            marginLeft: '-30px',
          }}
        >
          <Camera />
        </button>
      </main>
      {gifUrl && (
        <div
          style={{
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            height: '100%',
            position: 'fixed',
          }}
        >
          <button onClick={onCloseGifDownload}>X</button>
          <a href={gifUrl} download={`${project.name}.gif`}>Download</a>
        </div>
      )}
    </>
  )
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)
