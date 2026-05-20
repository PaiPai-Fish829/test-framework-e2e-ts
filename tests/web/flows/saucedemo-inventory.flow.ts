import { SauceDemoAuthFlow, type LoginFlowResult } from './saucedemo-auth.flow.js'
import { SauceDemoInventoryPage } from '../pages/saucedemo-inventory.page.js'

export interface RunInventoryFlowInput {
  username: string
  password: string
  sortValue?: 'az' | 'za' | 'lohi' | 'hilo'
  addItemName?: string
}

export interface InventoryFlowResult {
  loginResult: LoginFlowResult
  inventoryTitle: string
  inventoryItemCount: number
  firstItemName: string
  cartBadgeText: string
}

export class SauceDemoInventoryFlow {
  constructor(
    private readonly authFlow = new SauceDemoAuthFlow(),
    private readonly inventoryPage = new SauceDemoInventoryPage()
  ) {}

  async runInventoryFlow(input: RunInventoryFlowInput): Promise<InventoryFlowResult> {
    const loginResult = await this.authFlow.runLoginFlow(input.username, input.password)

    if (loginResult.errorVisible) {
      return {
        loginResult,
        inventoryTitle: '',
        inventoryItemCount: 0,
        firstItemName: '',
        cartBadgeText: '',
      }
    }

    await this.inventoryPage.waitForReady()

    if (input.sortValue) {
      await this.inventoryPage.sortBy(input.sortValue)
    }

    if (input.addItemName) {
      await this.inventoryPage.addItemToCartByName(input.addItemName)
    }

    return {
      loginResult,
      inventoryTitle: await this.inventoryPage.getTitleText(),
      inventoryItemCount: await this.inventoryPage.getInventoryItemCount(),
      firstItemName: await this.inventoryPage.getFirstItemName(),
      cartBadgeText: await this.inventoryPage.getCartBadgeText(),
    }
  }
}
