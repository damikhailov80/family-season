import { PALETTE_LABELS, PALETTE_ORDER } from '../../model/palettes'
import { SectionBox } from '../SectionBox'
import { SparkStar } from '../doodles'
import styles from './Inside.module.css'

const PARTS = [
  ['Название сезона', 'Тема месяца и вопрос, на который семья ответит в финале.'],
  ['Четыре недели', 'Четыре серии месяца: у каждой своя идея и пустая рамка-полароид под фото.'],
  ['Личные проекты', 'Сюжетная линия каждого: своё дело, описание, цель и шкала на десять делений.'],
  ['Хроника настроений', 'Клетка на каждый день месяца для каждого — закрашивается вручную.'],
  ['Финал и анонс', 'Чем запомнился сезон и что придумали на следующий — большие поля под заметки.'],
]

/* Каждая четвёртая тема: показать все сто — это уже не полоса, а каталог. */
const SHOWCASE = PALETTE_ORDER.filter((_, index) => index % 4 === 0)

export function Inside() {
  return (
    <SectionBox
      accent="theme"
      label="Что на постере"
      note="две страницы A4"
      className={styles.section}
    >
      <SparkStar className={styles.star} size={26} />
      <ul className={styles.list}>
        {PARTS.map(([title, text]) => (
          <li className={styles.item} key={title}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.text}>{text}</p>
          </li>
        ))}
      </ul>
      {/* Каждый свотч несёт свой data-palette и потому красится своими же
          красками — цвета набора нигде не дублируются. */}
      <div className={styles.palettes}>
        <h3 className={styles.palettesTitle}>Сто тем оформления</h3>
        <ul className={styles.swatches}>
          {SHOWCASE.map((palette) => (
            <li className={styles.swatchItem} key={palette}>
              <span
                className={styles.swatch}
                data-palette={palette}
                title={PALETTE_LABELS[palette]}
              />
            </li>
          ))}
        </ul>
        <p className={styles.text}>
          В правке кнопка бросает постер в случайную тему, пока не понравится; тема
          уезжает в ссылку вместе с сезоном, и у близких постер откроется в тех же
          цветах. Каждую тему задают четыре краски — остальное лист выводит из них.
        </p>
      </div>

      <p className={styles.footnote}>
        Печатается всегда чистый постер: шкалы на нуле, клетки настроений пустые, поля под
        заметки — свободные. Остальное впишет сам месяц, от руки.
      </p>
    </SectionBox>
  )
}
