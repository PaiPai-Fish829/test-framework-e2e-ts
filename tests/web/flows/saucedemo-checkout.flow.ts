import { browser } from '@wdio/globals'

import { SauceDemoAuthFlow, type LoginFlowResult } from './saucedemo-auth.flow.js'
import { SauceDemoInventoryPage } from '../pages/saucedemo-inventory.page.js'
import { SauceDemoCartPage } from '../pages/saucedemo-cart.page.js'
import { SauceDemoCheckoutPage } from '../pages/saucedemo-checkout.page.js'

export interface RunCheckoutFlowInput {
    username: string
    password: string
    addItemName: string
    firstName: string
    lastName: string
    postalCode: string
}

export interface CheckoutFlowResult {
    loginResult: LoginFlowResult
    hasExpectedItemInCart: boolean
    currentUrl: string
    checkoutTitle: string
    checkoutCompleteTitle: string
}

export class SauceDemoCheckoutFlow {
    constructor(
        private readonly authFlow = new SauceDemoAuthFlow(),
        private readonly inventoryPage = new SauceDemoInventoryPage(),
        private readonly cartPage = new SauceDemoCartPage(),
        private readonly checkoutPage = new SauceDemoCheckoutPage()
    ) {}
    async runCheckoutFlow(input: RunCheckoutFlowInput): Promise<CheckoutFlowResult> {
        const loginResult = await this.authFlow.runLoginFlow(input.username, input.password)

        if (loginResult.errorVisible) {
            return {
                loginResult,
                hasExpectedItemInCart: false,
                currentUrl: await browser.getUrl(),
                checkoutTitle: '',
                checkoutCompleteTitle: '',
            }
        }

        await this.inventoryPage.waitForReady()
        await this.inventoryPage.addItemToCartByName(input.addItemName)
        await this.inventoryPage.clickShoppingCartLink()
        await this.inventoryPage.waitForShoppingCartPage()

        await this.cartPage.waitForReady()
        const cartItemNames = await this.cartPage.getCartItemNames()
        const hasExpectedItemInCart = cartItemNames.includes(input.addItemName)

        await this.cartPage.clickCheckoutButton()
        await this.checkoutPage.waitForReady()
        await this.checkoutPage.fillForm(input.firstName, input.lastName, input.postalCode)
        await this.checkoutPage.clickContinueButton()
        const checkoutTitle = await this.checkoutPage.getTitleText()
        await this.checkoutPage.clickFinishButton()

        return {
            loginResult,
            hasExpectedItemInCart,
            currentUrl: await browser.getUrl(),
            checkoutTitle,
            checkoutCompleteTitle: await this.checkoutPage.getCheckoutCompleteTitleText(),
        }
    }
}