import { test as base, type Page } from '@playwright/test'
import { signIn, testAccountKey } from './support/session'

/**
 * Общие фикстуры e2e.
 *
 * Правило: фикстура заводится вместе с первым тестом, которому она нужна, и
 * удаляется вместе с последним. Принцип 5 («мёртвого кода не держим») действует
 * и здесь — набор заготовок «на будущее» гниёт быстрее самих тестов.
 */

interface Fixtures {
  /**
   * Страница вошедшего человека. Аккаунт у каждого теста **свой**: слепок базы
   * накатывается один раз на прогон, тесты идут параллельно, и вся изоляция
   * держится на том, что сезоны, настройки и реакции ключуются аккаунтом.
   *
   * Глобального у витрины остаётся только она сама — поэтому тест, который
   * что-то выкладывает, обязан собирать уникальное содержимое и проверять свой
   * код, а не число сезонов на странице.
   */
  signedIn: Page
}

export const test = base.extend<Fixtures>({
  signedIn: async ({ page }, use, testInfo) => {
    // Имя теста уникально в пределах файла, файл — в пределах прогона.
    const accountKey = testAccountKey(`${testInfo.titlePath.join('/')}`)
    await signIn(page.context(), accountKey)
    await use(page)
  },
})

export { expect } from '@playwright/test'
