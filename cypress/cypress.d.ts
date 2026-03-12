/// <reference types="cypress" />

declare namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject = any> {
        /** Clerk 테스트 계정 로그인 */
        login(email: string, password: string): Chainable<void>;
        /** 시설 이름으로 리스트에서 선택 */
        selectFacility(name: string): Chainable<void>;
    }
}
