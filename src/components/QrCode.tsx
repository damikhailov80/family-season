import { SITE_QR, type QrMatrix } from '../model/qr'
import styles from './QrCode.module.css'

/**
 * Что в коде зашито, решает не он: матрица приходит готовой. Размера здесь тоже
 * нет — его задаёт место, куда код поставили.
 */
export function QrCode({ code = SITE_QR, className }: { code?: QrMatrix; className?: string }) {
  return (
    <svg
      className={[styles.qr, className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${code.size} ${code.size}`}
      // Модуль обязан ложиться в целые пиксели, иначе экранный код мылится.
      shapeRendering="crispEdges"
      role="img"
      aria-label={code.url.replace(/^https:\/\/(www\.)?|\/$/g, '')}
    >
      {/* Белая подложка нужна и на экране, и на бумаге: код читают по контрасту. */}
      <rect className={styles.paper} width={code.size} height={code.size} />
      <path className={styles.modules} d={code.path} />
    </svg>
  )
}
