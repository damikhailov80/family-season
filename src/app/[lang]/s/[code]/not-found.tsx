import { NotFoundBox, NotFoundLink } from '../../../../components/site/NotFoundBox'
import { getDict, getLang } from '../../../../i18n/server'
import { ROUTES, withLang } from '../../../../model/site'

/**
 * Своя страница: человек искал не страницу, а сезон, и знать ему надо, что искать
 * больше нечего. Отсюда и главное действие — витрина, а не лендинг.
 *
 * Почему сезона нет, не уточняем: удалён, закрыт после жалоб или выдуман —
 * снаружи это одно и то же.
 */
export default async function SeasonNotFound() {
  const lang = await getLang()
  const { pages } = await getDict()

  return (
    <NotFoundBox
      heading={pages.seasonGoneTitle}
      text={pages.seasonGoneText}
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
