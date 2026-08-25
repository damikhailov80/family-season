import { QR_PATH, QR_SIZE, QR_URL } from '../model/qr.data'
import styles from './QrCode.module.css'

/**
 * QR-код постера — inline SVG, как и все остальные рисунки проекта: растровых
 * картинок в макете нет, а вектор печатается без ступенек на любом масштабе
 * (лист печатают минимум на A3).
 *
 * Матрица собрана заранее (`npm run qr`, см. tools/qr/build.mjs): код ведёт на
 * сайт и одинаков у всех листов, поэтому считать его в браузере при каждой
 * загрузке незачем — кодировщик остался сборочной зависимостью.
 *
 * Размера здесь нет: его задаёт место, куда код поставили.
 */
export function QrCode({ className }: { className?: string }) {
  return (
    <svg
      className={[styles.qr, className].filter(Boolean).join(' ')}
      viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`}
      // Модуль обязан ложиться в целые пиксели, иначе экранный код мылится.
      shapeRendering="crispEdges"
      role="img"
      aria-label={QR_URL.replace(/^https:\/\/(www\.)?|\/$/g, '')}
    >
      {/* Белая подложка нужна и на экране, и на бумаге: код читается по контрасту. */}
      <rect className={styles.paper} width={QR_SIZE} height={QR_SIZE} />
      <path className={styles.modules} d={QR_PATH} />
    </svg>
  )
}
