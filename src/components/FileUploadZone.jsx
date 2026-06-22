import { useState, useRef, useCallback } from 'react'
import { Upload, X, FileText, Image, File, CheckCircle2 } from 'lucide-react'

const DEFAULT_ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv'

function fileIcon(file) {
  if (file.type.startsWith('image/'))                      return { Icon: Image,    color: 'text-[#7C3AED]', bg: 'bg-[#F5F3FF] dark:bg-[#1A0E3A]' }
  if (file.type === 'application/pdf')                     return { Icon: FileText, color: 'text-[#dc2626]', bg: 'bg-[#FEF2F2] dark:bg-[#2D0808]' }
  if (file.type.includes('spreadsheet') || file.type.includes('excel') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))
                                                           return { Icon: File,     color: 'text-[#15803d]', bg: 'bg-[#F0FDF4] dark:bg-[#0A2318]' }
  return { Icon: File, color: 'text-primary dark:text-[#5B9BD5]', bg: 'bg-light-blue dark:bg-[#1B2D4A]' }
}

function fmtSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileUploadZone({
  label    = 'Click to upload or drag & drop',
  hint     = 'Images, PDFs, Word, Excel • up to 10 files',
  maxFiles = 10,
  accept   = DEFAULT_ACCEPT,
  onChange,
}) {
  const [files,   setFiles]   = useState([])
  const [isDrag,  setIsDrag]  = useState(false)
  const inputRef = useRef(null)

  const merge = useCallback((incoming) => {
    const arr = Array.from(incoming)
    setFiles(prev => {
      const next = [...prev, ...arr].slice(0, maxFiles)
      onChange?.(next)
      return next
    })
  }, [maxFiles, onChange])

  const remove = (i) => {
    setFiles(prev => {
      const next = prev.filter((_, idx) => idx !== i)
      onChange?.(next)
      return next
    })
  }

  const onDrop      = (e) => { e.preventDefault(); setIsDrag(false); merge(e.dataTransfer.files) }
  const onDragOver  = (e) => { e.preventDefault(); setIsDrag(true)  }
  const onDragLeave = ()  => setIsDrag(false)

  return (
    <div className="space-y-2.5">
      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={[
          'border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all duration-150',
          isDrag
            ? 'border-primary bg-light-blue/30 dark:bg-[#1B2D4A]/40 scale-[1.01]'
            : 'border-[#DDDDDD] dark:border-[#2A3547] hover:border-primary hover:bg-light-blue/20 dark:hover:bg-[#1B2D4A]/30 group',
        ].join(' ')}
      >
        <div className={[
          'w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
          isDrag ? 'bg-light-blue dark:bg-[#1B2D4A]' : 'bg-[#F0F2F5] dark:bg-[#1F2937] group-hover:bg-light-blue dark:group-hover:bg-[#1B2D4A]',
        ].join(' ')}>
          <Upload size={18} className={[
            'transition-colors',
            isDrag ? 'text-primary' : 'text-muted group-hover:text-primary',
          ].join(' ')} />
        </div>
        <div className="text-center">
          <p className={['text-[13px] font-medium transition-colors', isDrag ? 'text-primary' : 'text-muted group-hover:text-primary'].join(' ')}>
            {isDrag ? 'Drop files here' : label}
          </p>
          <p className="text-[11px] text-muted dark:text-slate-500 mt-0.5">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="hidden"
          onChange={e => { merge(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((file, i) => {
            const { Icon, color, bg } = fileIcon(file)
            const isImg = file.type.startsWith('image/')
            return (
              <div key={i}
                className="flex items-center gap-3 px-3 py-2 bg-[#F7F9FC] dark:bg-[#1A2236] rounded-xl border border-[#EFEFEF] dark:border-[#2A3547] group/item">
                {isImg ? (
                  <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 border border-[#EFEFEF] dark:border-[#2A3547]">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover"/>
                  </div>
                ) : (
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                    <Icon size={15} className={color}/>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-body dark:text-slate-200 truncate">{file.name}</p>
                  <p className="text-[10px] text-muted dark:text-slate-500 mt-0.5">{fmtSize(file.size)}</p>
                </div>
                <CheckCircle2 size={14} className="text-[#15803d] shrink-0 opacity-60 group-hover/item:opacity-0 transition-opacity"/>
                <button
                  onClick={e => { e.stopPropagation(); remove(i) }}
                  className="p-1 rounded-lg text-muted hover:text-[#dc2626] hover:bg-[#FEF2F2] dark:hover:bg-[#2D0808] transition-colors opacity-0 group-hover/item:opacity-100">
                  <X size={13} strokeWidth={2}/>
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
