import type { Metadata } from 'next'
import Link from 'next/link'
import { PaperSheet } from '../../components/PaperSheet'
import { SectionBox } from '../../components/SectionBox'
import { SeasonPreview } from '../../components/community/SeasonPreview'
import { HeartDoodle, MegaphoneDoodle } from '../../components/doodles'
import { Toast } from '../../components/site/Toast'
import { ROUTES } from '../../model/site'
import { randomIdeas } from '../../server/community'
import { ReportEntry } from './ReportEntry'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Идеи сообщества — Семейный сезон',
  description: 'Витрина сезонов, которыми поделились семьи: чужие месяцы, идеи и сюжетные линии.',
}

/**
 * Витрина чужих сезонов. Открыта всем: смотреть идеи должно быть можно и без
 * входа — это витрина, а не кабинет.
 *
 * Показываем десяток **случайных** сезонов, а не первую десятку по лайкам.
 * Сортировка по рейтингу заперла бы витрину навсегда: попавшие наверх собирали
 * бы лайки просто потому, что их видно. Поэтому выборка взвешенная — лайки
 * повышают вероятность, но места не гарантируют (см. `randomIdeas`).
 *
 * «Показать другие» — обычная ссылка с новой пометкой в адресе, а не кнопка на
 * JS: выборка случайна на каждый рендер, а меняющийся адрес честно заводит
 * запись в истории, работает без JS и переживает перезагрузку.
 */
export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>
}) {
  // Пометка нужна лишь затем, чтобы следующий адрес отличался от нынешнего и
  // «Показать другие» было настоящим переходом. Поэтому она просто счётчик:
  // считать его от `Date.now()` нельзя — это вызов нечистой функции в рендере.
  const flags = await searchParams
  const next = (Number(flags.r) || 0) + 1
  const state = await randomIdeas()
  const ideas = state.status === 'ok' ? state.ideas : []

  return (
    <PaperSheet>
      <SectionBox accent="theme" label="Идеи сообщества" className={styles.section}>
        <MegaphoneDoodle className={styles.mark} size={54} />
        <h1 className={styles.title}>Чужие сезоны</h1>
        <p className={styles.text}>
          Самое трудное в постере — придумать, чем занять месяц. Проще, когда видишь, как это
          сделали другие: чей-то «Месяц воды», чей-то «Месяц без экранов», чьи-то сюжетные линии
          на четверых. Любой сезон отсюда можно открыть и форкнуть под свою семью.
        </p>

        {/* Не прочитали — показываем пустоту и тост, никогда не умолчание:
            выдумывать содержимое витрины нельзя. */}
        {state.status === 'ok' &&
          (ideas.length ? (
            <>
              <ul className={styles.grid}>
                {ideas.map((idea) => (
                  <li className={styles.card} key={idea.id}>
                    <SeasonPreview idea={idea} />
                    <div className={styles.meta}>
                      <span className={styles.name}>{idea.title}</span>
                      <span className={styles.likes} role="img" aria-label={`Лайков: ${idea.likes}`}>
                        <HeartDoodle size={14} filled strokeWidth={4} />
                        {idea.likes}
                      </span>
                      <ReportEntry id={idea.id} title={idea.title} />
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                {/* Пометка обязана меняться: без неё вторая такая же ссылка была
                    бы переходом «сюда же» и ничего не перетасовала. */}
                <Link className={styles.primary} href={`${ROUTES.ideas}?r=${next}`}>
                  Показать другие
                </Link>
                <a className={styles.ghost} href={ROUTES.sheetEdit}>
                  Собрать свой сезон
                </a>
              </div>

              <p className={styles.note}>
                Сезоны выкладывают сами семьи — кнопкой с мегафоном на постере. Показываем
                каждый раз случайные: так у нового сезона есть шанс попасться на глаза, а не
                утонуть под теми, кого уже видно. Увидели рекламу, грубость или чужие личные
                данные — нажмите флажок: такие сезоны мы с витрины убираем.
              </p>
            </>
          ) : (
            <>
              <p className={styles.hand}>
                Пока витрина пуста — никто ещё не выложил свой сезон. Будете первыми?
              </p>
              <div className={styles.actions}>
                <a className={styles.primary} href={ROUTES.sheetEdit}>
                  Собрать свой сезон
                </a>
                <a className={styles.ghost} href={ROUTES.sheet}>
                  Посмотреть примеры
                </a>
              </div>
              <p className={styles.note}>
                Сохраните сезон в «Мои», откройте его и нажмите на постере кнопку с мегафоном —
                он появится здесь.
              </p>
            </>
          ))}

        {state.status === 'error' && (
          <Toast message="Не удалось загрузить витрину — ошибка на сервере." />
        )}
      </SectionBox>
    </PaperSheet>
  )
}
