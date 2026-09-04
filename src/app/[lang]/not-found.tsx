import { NotFoundBox, NotFoundLink } from '../../components/site/NotFoundBox'
import { getDict, getLang } from '../../i18n/server'
import { ROUTES, withLang } from '../../model/site'

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
