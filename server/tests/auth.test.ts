import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api, registerUser, startTestApp, type TestApp } from './helpers/test-app';

describe('Auth routes', () => {
    let ctx: TestApp;

    before(async () => {
        ctx = await startTestApp();
    });

    after(async () => {
        await ctx.close();
    });

    const base = () => ctx.baseUrl;

    describe('POST /api/auth/register', () => {
        it('registers a user and returns a dev verification code', async () => {
            const { status, body } = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'reg-happy@test.com', password: 'secret123', name: 'Happy' },
            });
            assert.equal(status, 201);
            const b = body as { email: string; code?: string; sent: boolean };
            assert.equal(b.email, 'reg-happy@test.com');
            assert.equal(b.sent, false);
            assert.match(b.code ?? '', /^\d{6}$/);
        });

        it('rejects a duplicate email with 409', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'dup@test.com', password: 'secret123', name: 'Dup' },
            });
            assert.equal(status, 201);
            const second = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'dup@test.com', password: 'secret123', name: 'Dup' },
            });
            assert.equal(second.status, 409);
        });

        it('rejects invalid email format with 400 (validation)', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'not-an-email', password: 'secret123', name: 'Bad' },
            });
            assert.equal(status, 400);
        });

        it('rejects empty name with 400 (validation)', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'empty-name@test.com', password: 'secret123', name: '  ' },
            });
            assert.equal(status, 400);
        });

        it('rejects missing password with 400 (validation)', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'nopass@test.com', name: 'NoPass' },
            });
            assert.equal(status, 400);
        });

        it('rejects empty body with 400 (validation)', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/register', {
                body: {},
            });
            assert.equal(status, 400);
        });

        it('rejects too-short password with 400 (validation)', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'shortpass@test.com', password: '123', name: 'Short' },
            });
            assert.equal(status, 400);
        });
    });

    describe('POST /api/auth/verify-code', () => {
        it('exchanges a verification code for a token', async () => {
            const register = await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'verify-ok@test.com', password: 'secret123', name: 'Verify' },
            });
            const code = (register.body as { code: string }).code;
            const { status, body } = await api(base(), 'POST', '/api/auth/verify-code', {
                body: { email: 'verify-ok@test.com', code },
            });
            assert.equal(status, 201);
            assert.ok((body as { accessToken: string }).accessToken);
        });

        it('rejects a wrong code with 401', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/verify-code', {
                body: { email: 'verify-ok@test.com', code: '000000' },
            });
            assert.equal(status, 401);
        });
    });

    describe('POST /api/auth/login + verify-login (2FA)', () => {
        it('sends a login code, then verify-login returns a token', async () => {
            await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'login-ok@test.com', password: 'secret123', name: 'Login' },
            });
            const login = await api(base(), 'POST', '/api/auth/login', {
                body: { email: 'login-ok@test.com', password: 'secret123' },
            });
            assert.equal(login.status, 201);
            const code = (login.body as { code: string }).code;
            assert.match(code, /^\d{6}$/);

            const verify = await api(base(), 'POST', '/api/auth/verify-login', {
                body: { email: 'login-ok@test.com', code },
            });
            assert.equal(verify.status, 201);
            assert.ok((verify.body as { accessToken: string }).accessToken);
        });

        it('rejects wrong password with 401', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/login', {
                body: { email: 'login-ok@test.com', password: 'wrongpass123' },
            });
            assert.equal(status, 401);
        });

        it('rejects unknown email with 401', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/login', {
                body: { email: 'ghost@test.com', password: 'secret123' },
            });
            assert.equal(status, 401);
        });

        it('rejects a bad login code with 401', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/verify-login', {
                body: { email: 'login-ok@test.com', code: '000000' },
            });
            assert.equal(status, 401);
        });
    });

    describe('POST /api/auth/forgot-password + reset-password', () => {
        it('issues a reset code and resets the password', async () => {
            await api(base(), 'POST', '/api/auth/register', {
                body: { email: 'reset@test.com', password: 'secret123', name: 'Reset' },
            });
            const forgot = await api(base(), 'POST', '/api/auth/forgot-password', {
                body: { email: 'reset@test.com' },
            });
            assert.equal(forgot.status, 201);
            const code = (forgot.body as { code: string }).code;

            const reset = await api(base(), 'POST', '/api/auth/reset-password', {
                body: { email: 'reset@test.com', code, newPassword: 'newpass123' },
            });
            assert.equal(reset.status, 201);

            const login = await api(base(), 'POST', '/api/auth/login', {
                body: { email: 'reset@test.com', password: 'newpass123' },
            });
            assert.equal(login.status, 201);
        });

        it('returns 404 for unknown email on forgot-password', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/forgot-password', {
                body: { email: 'nobody@test.com' },
            });
            assert.equal(status, 404);
        });
    });

    describe('POST /api/auth/request-delete-account + delete-account', () => {
        it('deletes the account after confirming with a code', async () => {
            const user = await registerUser(base(), 'delme@test.com');
            const room = await api(base(), 'POST', '/api/data-rooms', {
                token: user.token,
                body: { name: 'Del Room' },
            });
            assert.equal(room.status, 201);

            const request = await api(base(), 'POST', '/api/auth/request-delete-account', {
                token: user.token,
            });
            assert.equal(request.status, 201);
            const code = (request.body as { code: string }).code;

            const wrong = await api(base(), 'DELETE', '/api/auth/delete-account', {
                token: user.token,
                body: { code: '000000' },
            });
            assert.equal(wrong.status, 401);

            const confirm = await api(base(), 'DELETE', '/api/auth/delete-account', {
                token: user.token,
                body: { code },
            });
            assert.equal(confirm.status, 200);

            const login = await api(base(), 'POST', '/api/auth/login', {
                body: { email: 'delme@test.com', password: 'secret123' },
            });
            assert.equal(login.status, 401);
        });

        it('requires auth', async () => {
            const { status } = await api(base(), 'POST', '/api/auth/request-delete-account');
            assert.equal(status, 401);
        });
    });

    describe('GET /api/auth/me', () => {
        it('returns current user with valid token', async () => {
            const user = await registerUser(base(), 'me-ok@test.com');
            const { status, body } = await api(base(), 'GET', '/api/auth/me', {
                token: user.token,
            });
            assert.equal(status, 200);
            assert.equal((body as { email: string }).email, 'me-ok@test.com');
        });

        it('rejects missing token with 401', async () => {
            const { status } = await api(base(), 'GET', '/api/auth/me');
            assert.equal(status, 401);
        });

        it('rejects garbage token with 401', async () => {
            const { status } = await api(base(), 'GET', '/api/auth/me', { token: 'garbage' });
            assert.equal(status, 401);
        });

        it('rejects expired/forged token with 401', async () => {
            const { status } = await api(base(), 'GET', '/api/auth/me', {
                token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmYWtlIn0.fake',
            });
            assert.equal(status, 401);
        });
    });

    describe('Rate limiting', () => {
        it('returns 429 after exceeding request limit on auth', async () => {
            let last = 0;
            for (let i = 0; i < 102; i++) {
                const r = await api(base(), 'POST', '/api/auth/login', {
                    body: { email: `rate-${i}@test.com`, password: 'secret123' },
                });
                last = r.status;
                if (last === 429) {
                    break;
                }
            }
            assert.equal(last, 429);
        });
    });
});
