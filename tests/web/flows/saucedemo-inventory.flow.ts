import { SauceDemoAuthFlow, type LoginFlowResult } from './saucedemo-auth.flow.js'
import { SauceDemoCartFlow, type CartFlowResult } from './saucedemo-cart.flow.js'
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
  cartFlowResult: CartFlowResult | null
}

export class SauceDemoInventoryFlow {
  constructor(
    private readonly authFlow = new SauceDemoAuthFlow(),
    private readonly inventoryPage = new SauceDemoInventoryPage(),
    private readonly cartFlow = new SauceDemoCartFlow()
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
        cartFlowResult: null,
      }
    }

    await this.inventoryPage.waitForReady()

    if (input.sortValue) {
      await this.inventoryPage.sortBy(input.sortValue)
    }

    const inventoryTitle = await this.inventoryPage.getTitleText()
    const inventoryItemCount = await this.inventoryPage.getInventoryItemCount()
    const firstItemName = await this.inventoryPage.getFirstItemName()

    if (input.addItemName) {
      await this.inventoryPage.addItemToCartByName(input.addItemName)
    }

    const cartBadgeText = await this.inventoryPage.getCartBadgeText()

    if (input.addItemName) {
      await this.inventoryPage.clickShoppingCartLink()
      await this.inventoryPage.waitForShoppingCartPage()
    }

    const cartFlowResult = input.addItemName
      ? await this.cartFlow.runCartFlow(input.addItemName)
      : null

    return {
      loginResult,
      inventoryTitle,
      inventoryItemCount,
      firstItemName,
      cartBadgeText,
      cartFlowResult,
    }
  }
}
