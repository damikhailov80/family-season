import type { Metadata } from 'next'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { MegaphoneDoodle } from '../../components/doodles'
import { ROUTES } from '../../model/site'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Идеи сообщества — Семейный сезон',
  description: 'Витрина сезонов, которыми поделились семьи. Пока пусто.',
}

/**
 * Витрина чужих сезонов. Открыта всем: это витрина, а не кабинет — смотреть
 * идеи должно быть можно и без входа.
 *
 * Пока заглушка, и текст говорит это прямо: делиться нечем не потому, что никто
 * не поделился, а потому, что публиковать сезоны сайт ещё не умеет.
 */
export default function IdeasPage() {
  return (
    <PaperSheet>
      <SectionBox accent="theme" label="Идеи сообщества" note="скоро" className={styles.section}>
        <MegaphoneDoodle className={styles.mark} size={54} />
        <h1 className={styles.title}>Здесь будут чужие сезоны</h1>
        <p className={styles.text}>
          Самое трудное в постере — придумать, чем занять месяц. Проще, когда видишь, как это
          сделали другие: чей-то «Месяц воды», чей-то «Месяц без экранов», чьи-то сюжетные линии
          на четверых. Любой такой сезон можно будет открыть и форкнуть под свою семью.
        </p>
        <p className={styles.text}>
          Пока витрина пуста, и причина честная: сайт ещё не умеет публиковать сезоны. Сезон
          сегодня живёт в ссылке, и она есть только у вас и у тех, кому вы её отправили.
        </p>
        <p className={styles.hand}>
          Собрали сезон, которым не жалко поделиться? Пришлите ссылку — соберём из первых
          присланных.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href={ROUTES.sheet}>
            Посмотреть примеры
          </a>
          <a className={styles.ghost} href={ROUTES.sheetEdit}>
            Собрать свой сезон
          </a>
        </div>
      </SectionBox>
    </PaperSheet>
  )
}
