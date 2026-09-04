import { SITE_QR, type QrMatrix } from '../model/qr'
import styles from './QrCode.module.css'

export function QrCode({ code = SITE_QR, className }: { code?: QrMatrix; className?: string }) {
  return (
    <svg
      className={[styles.qr, className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${code.size} ${code.size}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={code.url.replace(/^https:\/\/(www\.)?|\/$/g, '')}
    >
      <rect className={styles.paper} width={code.size} height={code.size} />
      <path className={styles.modules} d={code.path} />
    </svg>
  )
}
