import { expect, test } from '@playwright/test'

test('loads the piano room and switches instrument controls', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '小手指，大音乐。' })).toBeVisible()
  await expect(page.getByRole('group', { name: '钢琴键盘' })).toBeVisible()
  await expect(page.getByRole('radio', { name: '木琴' })).toBeVisible()
  await page.getByRole('radio', { name: '木琴' }).click()
  await expect(page.getByText(/木琴/).first()).toBeVisible()
  await page.getByRole('button', { name: '儿童模式' }).click()
  await expect(page.getByText('儿童模式已开启')).toBeVisible()
  await expect(page.getByText('页面误触保护已开启')).toBeVisible()
})

test('parent guide explains device-level locking', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '家长指南' }).click()
  await expect(page.getByRole('dialog')).toContainText('引导式访问')
  await expect(page.getByRole('dialog')).toContainText('网页不能锁住整个设备')
})
