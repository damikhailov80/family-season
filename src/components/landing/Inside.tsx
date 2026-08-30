import { getDict, getLang } from '../../i18n/server'
import { paletteLabel, PALETTE_ORDER } from '../../model/palettes'
import { SectionBox } from '../SectionBox'
import { SparkStar } from '../doodles'
import styles from './Inside.module.css'

/* Каждая четвёртая тема: показать все сто — это уже не полоса, а каталог. */
const SHOWCASE = PALETTE_ORDER.filter((_, index) => index % 4 === 0)

export async function Inside() {
  const lang = await getLang()
  const { landing } = await getDict()

  return (
    <SectionBox
      accent="theme"
      label={landing.insideLabel}
      note={landing.insideNote}
      className={styles.section}
    >
      <SparkStar className={styles.star} size={26} />
      <ul className={styles.list}>
        {landing.parts.map(({ title, text }) => (
          <li className={styles.item} key={title}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.text}>{text}</p>
          </li>
        ))}
      </ul>
      {/* Каждый свотч несёт свой data-palette и потому красится своими же
          красками — цвета набора нигде не дублируются. */}
      <div className={styles.palettes}>
        <h3 className={styles.palettesTitle}>{landing.palettesTitle}</h3>
        <ul className={styles.swatches}>
          {SHOWCASE.map((palette) => (
            <li className={styles.swatchItem} key={palette}>
              <span
                className={styles.swatch}
                data-palette={palette}
                title={paletteLabel(palette, lang)}
              />
            </li>
          ))}
        </ul>
        <p className={styles.text}>{landing.palettesText}</p>
      </div>

      <p className={styles.footnote}>{landing.insideFootnote}</p>
    </SectionBox>
  )
}
