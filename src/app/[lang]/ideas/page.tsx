import type { Metadata } from 'next'
import Link from 'next/link'
import { PaperSheet } from '../../../components/PaperSheet'
import { SectionBox } from '../../../components/SectionBox'
import { LikeCount } from '../../../components/community/LikeCount'
import { SeasonPreview } from '../../../components/community/SeasonPreview'
import { NewSeasonAction } from '../../../components/site/NewSeasonAction'
import { Toast } from '../../../components/site/Toast'
import { getDict, getLang } from '../../../i18n/server'
import { fill } from '../../../i18n/fill'
import { ROUTES, withLang } from '../../../model/site'
import { auth } from '../../../server/auth'
import { randomIdeas } from '../../../server/publicSeasons'
import { ReportEntry } from './ReportEntry'
import styles from './page.module.css'

export async function generateMetadata(): Promise<Metadata> {
  const { ideas } = await getDict()
  return { title: ideas.title, description: ideas.description }
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
 *
 * Витрина показывает **свой язык**: идею берут, чтобы прочитать, и десяток
 * непонятных постеров ей ни к чему. Прямая ссылка при этом работает из любого
 * языка — там сезон уже показали, и прятать его поздно.
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
  // Вход спрашиваем здесь: от него зависит, что покажет флажок жалобы —
  // окно с текстом или предложение войти.
  const lang = await getLang()
  const dict = await getDict()
  const [state, session] = await Promise.all([randomIdeas(lang), auth()])
  const ideas = state.status === 'ok' ? state.ideas : []

  return (
    <PaperSheet>
      <SectionBox accent="theme" label={dict.ideas.heading} className={styles.section}>
        <p className={styles.text}>{dict.ideas.lead}</p>

        {/* Не прочитали — показываем пустоту и тост, никогда не умолчание:
            выдумывать содержимое витрины нельзя. */}
        {state.status === 'ok' &&
          (ideas.length ? (
            <>
              <ul className={styles.grid}>
                {ideas.map((idea) => (
                  <li className={styles.card} key={idea.code}>
                    <SeasonPreview idea={idea} lang={lang} />
                    {/* Названия под превью нет: оно и есть тема месяца,
                        крупно написанная на самом превью, — второй раз
                        повторять её незачем. */}
                    <div className={styles.meta}>
                      <LikeCount
                        likes={idea.likes}
                        size={14}
                        className={styles.likes}
                        label={fill(dict.ideas.likesAria, { n: idea.likes })}
                      />
                      {/* На наши примеры не жалуются: шестеро недовольных иначе
                          убрали бы их с витрины. Сервер такую жалобу и так не
                          примет — кнопке тем более здесь не место. */}
                      {!idea.system && (
                        <ReportEntry
                          code={idea.code}
                          title={idea.title}
                          signedIn={Boolean(session?.user)}
                        />
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.actions}>
                {/* Пометка обязана меняться: без неё вторая такая же ссылка была
                    бы переходом «сюда же» и ничего не перетасовала. */}
                <Link
                  className={styles.primary}
                  href={`${withLang(lang, ROUTES.ideas)}?r=${next}`}
                >
                  {dict.ideas.another}
                </Link>
                <NewSeasonAction className={styles.ghost}>{dict.ideas.newSeason}</NewSeasonAction>
              </div>

              <p className={styles.note}>{dict.ideas.note}</p>
            </>
          ) : (
            <>
              <p className={styles.hand}>{dict.ideas.emptyHand}</p>
              <div className={styles.actions}>
                <NewSeasonAction className={styles.primary}>{dict.ideas.newSeason}</NewSeasonAction>
                <a className={styles.ghost} href={withLang(lang, ROUTES.home)}>
                  {dict.ideas.seeExamples}
                </a>
              </div>
              <p className={styles.note}>{dict.ideas.emptyNote}</p>
            </>
          ))}

        {state.status === 'error' && <Toast message={dict.ideas.error} />}
      </SectionBox>
    </PaperSheet>
  )
}
