import { NotFoundBox, NotFoundLink } from '../../components/site/NotFoundBox'
import { getDict, getLang } from '../../i18n/server'
import { ROUTES, withLang } from '../../model/site'

/**
 * 404 внутри `[lang]`: несуществующий адрес и всё, у чего нет своей страницы
 * «не нашлось».
 *
 * Своя страница нужна по двум причинам сразу. Первая: корневой лейаут лежит под
 * `[lang]`, и без неё несуществующий адрес отдавал бы голую заглушку Next — без
 * шапки, подвала и вообще без сайта. Вторая: заглушка эта по-английски, а у нас
 * три языка и ни одной строки в разметке.
 *
 * Рядом с «на главную» стоит витрина: человек сюда попал, потому что чего-то
 * искал, и предложить ему смотреть чужие сезоны полезнее, чем вернуть на лендинг
 * и оставить одного.
 */
export default async function NotFound() {
  const lang = await getLang()
  const { pages } = await getDict()

  return (
    <NotFoundBox
      heading={pages.notFoundTitle}
      text={pages.notFoundText}
      actions={
        <>
          <NotFoundLink href={withLang(lang, ROUTES.ideas)} primary>
            {pages.seasonGoneIdeas}
          </NotFoundLink>
          <NotFoundLink href={withLang(lang, ROUTES.home)}>{pages.notFoundHome}</NotFoundLink>
        </>
      }
    />
  )
}
