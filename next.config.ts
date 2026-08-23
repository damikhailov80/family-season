import type { NextConfig } from 'next'

/*
 * Пустой конфиг — это осознанно, а не «ещё не дописали».
 *
 * Бандлер трогать не нужно: с Next 16 по умолчанию Turbopack (и в `dev`, и в `build`),
 * webpack теперь наоборот включается флагом `--webpack`.
 *
 * `output: 'export'` сюда добавлять нельзя: статический экспорт выключает роут-хендлеры,
 * а бэкенд в проекте планируется.
 */
const nextConfig: NextConfig = {}

export default nextConfig
