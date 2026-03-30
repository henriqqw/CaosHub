import { FileUploadZone } from '../../../components/ui/FileUploadZone'

interface VideoUploadProps {
  onFile: (file: File) => void
}

const VIDEO_ACCEPT = ['.mp4', '.webm', '.mov', '.avi', '.mkv', 'video/*']

export function VideoUpload({ onFile }: VideoUploadProps) {
  return (
    <FileUploadZone
      accept={VIDEO_ACCEPT}
      multiple={false}
      onFiles={files => onFile(files[0])}
      label="Drop a video file here or click to browse"
      hint="MP4, WebM, MOV, AVI, MKV"
    />
  )
}
