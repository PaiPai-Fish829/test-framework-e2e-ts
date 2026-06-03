import assert from 'node:assert/strict'

import { loadYamlCases } from '../../../shared/utils/testCaseLoader.util.js'
import {
  clearMobileAppData,
  resetMobileAppForNextCase,
  terminateMobileApp,
} from '../../../shared/utils/app/app-lifecycle.util.js'
import { TplinkApp } from '../pages/tplink-app.js'

interface TplinkLoginCase {
  name: string
  expectLogin: boolean
  username?: string
  password?: string
  /** 默认 true；空密码等场景设为 false，只填表不提交 */
  submit?: boolean
}

const loginCases = loadYamlCases<TplinkLoginCase>('tplink-login.cases.yaml')

function credentials(caseData: TplinkLoginCase): { username: string; password: string } {
  return {
    username: (caseData.username ?? process.env.TPLINK_USERNAME ?? '').trim(),
    password: (caseData.password ?? process.env.TPLINK_PASSWORD ?? '').trim(),
  }
}

describe('TP-Link App 登录', () => {
  for (const caseData of loginCases) {
    it(caseData.name, async function () {
      this.timeout(90_000)

      const { username, password } = credentials(caseData)
      const submit = caseData.submit !== false

      assert.ok(username.length > 0, `[${caseData.name}] 配置 TPLINK_USERNAME 或在 YAML 提供 username`)
      if (caseData.expectLogin) {
        assert.ok(password.length > 0, `[${caseData.name}] 配置 TPLINK_PASSWORD`)
      }

      const app = new TplinkApp()
      await resetMobileAppForNextCase()

      try {
        await app.appOpen()
        await app.login(username, password, submit)
        await app.waitForLoginOutcome(caseData.expectLogin)

        assert.equal(
          await app.isStillOnLoginForm(),
          !caseData.expectLogin,
          caseData.expectLogin ? '登录后仍停留在登录页' : '未登录成功却离开了登录页'
        )
      } finally {
        await app.leaveLoginPage()
        await terminateMobileApp()
        await clearMobileAppData()
      }
    })
  }
})
