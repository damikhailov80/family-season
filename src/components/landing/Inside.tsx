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
          переменными — цвета набора нигде не дублируются. */}
      <div className={styles.palettes}>
        <h3 className={styles.palettesTitle}>Пять тем оформления</h3>
        <ul className={styles.swatches}>
          {PALETTE_ORDER.map((palette) => (
            <li className={styles.swatchItem} key={palette}>
              <span className={styles.swatch} data-palette={palette} aria-hidden="true" />
              {PALETTE_LABELS[palette]}
            </li>
          ))}
        </ul>
        <p className={styles.text}>
          Тему выбирают в правке, и она уезжает в ссылку вместе с сезоном: у близких
          постер откроется в тех же цветах. Каждую тему задают две краски — остальные
          цвета листа выводятся из них.
        </p>
      </div>

      <p className={styles.footnote}>
        Печатается всегда чистый постер: шкалы на нуле, клетки настроений пустые, поля под
        заметки — свободные. Остальное впишет сам месяц, от руки.
      </p>
    </SectionBox>
  )
}
