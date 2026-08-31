import { test, expect } from '../fixtures'
import { DICTS } from '../../src/i18n/dict'

/**
 * Смена языка. CLAUDE.md → «Каркас: Next.js», `src/model/lang.ts`, `src/proxy.ts`.
 *
 * Проверяется главное правило переключателя: он уводит на **тот же адрес** в
 * другом языке. «Тот же» включает query — в нём живёт примеренное оформление
 * (`?p=`, `?i=`) и состояние списка (`?tab=`, `?q=`, `?sort=`), и редирект,
 * теряющий query, портит ровно ту ссылку, ради которой примерка и заведена.
 *
 * Сознательно не покрыто (ждёт своих тестов):
 *   - выбор языка по `Accept-Language` на голом `/`;
 *   - запоминание языка кукой между заходами;
 *   - язык сезона против языка интерфейса на чужом выложенном постере.
 */
test.describe('смена языка', () => {
  test('переключатель уводит на тот же адрес и не теряет ни query, ни сессию', async ({
    signedIn: page,
  }) => {
    await page.goto('/ru/seasons?tab=published')

    // Вошли: страница показывает список, а не приглашение войти.
    await expect(page.getByRole('link', { name: DICTS.ru.seasons.tabPublished })).toHaveAttribute(
      'aria-current',
      'page',
    )

    // Переключатель — `<details>`: сперва раскрыть, потом выбрать язык.
    await page.getByLabel(DICTS.ru.site.langsAria).click()
    await page.getByRole('link', { name: 'English' }).click()

    // Ожидание — литералом, а не через `withLang`: тест, считающий ответ той же
    // функцией, которую проверяет, ничего не утверждает.
    await expect(page).toHaveURL('/en/seasons?tab=published')

    // Язык сменился…
    await expect(page.getByRole('link', { name: DICTS.en.seasons.tabPublished })).toHaveAttribute(
      'aria-current',
      'page',
    )

    // …а сессия пережила переход: у невошедшего этой вкладки нет вовсе.
    await expect(page.getByRole('link', { name: DICTS.en.site.seasons })).toBeVisible()
  })
})
