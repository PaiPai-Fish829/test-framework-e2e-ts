import { $, $$, browser } from '@wdio/globals'

export class SauceDemoCheckoutPage {
    private get title() {
        return $('[data-test="title"]')
    }

    private get firstNameInput() {
        return $('[data-test="firstName"]')
    }

    private get lastNameInput() {
        return $('[data-test="lastName"]')
    }

    private get postalCodeInput() {
        return $('[data-test="postalCode"]')
    }

    private get continueButton() {
        return $('[data-test="continue"]')
    }

    private get finishButton() {
        return $('[data-test="finish"]')
    }

    private get checkoutCompleteTitle() {
        return $('//h2[@data-test="complete-header"]')
    }
    
    async getTitleText(): Promise<string> {
        return (await this.title.getText()).trim()
    }

    async waitForReady(): Promise<void> {
        await this.title.waitForDisplayed({ timeout: 10000 })
        await this.firstNameInput.waitForDisplayed({ timeout: 10000 })
        await this.firstNameInput.waitForEnabled({ timeout: 10000 })
    }

    async fillFirstName(firstName: string): Promise<void> {
        await this.firstNameInput.waitForDisplayed({ timeout: 10000 })
        await this.firstNameInput.setValue(firstName)
    }

    async fillLastName(lastName: string): Promise<void> {
        await this.lastNameInput.waitForDisplayed({ timeout: 10000 })
        await this.lastNameInput.setValue(lastName)
    }

    async fillPostalCode(postalCode: string): Promise<void> {
        await this.postalCodeInput.waitForDisplayed({ timeout: 10000 })
        await this.postalCodeInput.setValue(postalCode)
    }
    
    async fillForm(firstName: string, lastName: string, postalCode: string): Promise<void> {
        await this.fillFirstName(firstName)
        await this.fillLastName(lastName)
        await this.fillPostalCode(postalCode)
    }

    async clickContinueButton(): Promise<void> {
        await this.continueButton.waitForClickable({ timeout: 10000 })
        await this.continueButton.click()
    }

    async clickFinishButton(): Promise<void> {
        await this.finishButton.waitForClickable({ timeout: 10000 })
        await this.finishButton.click()
    }

    async getCheckoutCompleteTitleText(): Promise<string> {
        try {
            await this.checkoutCompleteTitle.waitForDisplayed({ timeout: 10000 })
            return (await this.checkoutCompleteTitle.getText()).trim()
        } catch {
            return ''
        }
    }
}