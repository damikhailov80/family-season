import { NotFoundBox, NotFoundLink } from '../../../../components/site/NotFoundBox'
import { getDict, getLang } from '../../../../i18n/server'
import { ROUTES, withLang } from '../../../../model/site'

/**
 * «Сезона нет» — своя страница у выложенного сезона.
 *
 * Сюда приходят по чужой ссылке, и это самый частый 404 на сайте: сезон убрали
 * с витрины, удалили или закрыли после жалоб, а ссылка уже разошлась. Общее
 * «страница не найдена» тут говорит не то: человек искал не страницу, а сезон,
 * и знать ему надо, что искать больше нечего.
 *
 * Отсюда и главное действие — витрина, а не лендинг: пришли ведь за чужой
 * идеей, и рядом лежат другие.
 *
 * Почему сезона нет, не уточняем: удалён, закрыт после жалоб или выдуман —
 * снаружи это одно и то же, и по ответу не должно быть видно, существовал ли он
 * когда-нибудь (см. «Витрина» в CLAUDE.md).
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
