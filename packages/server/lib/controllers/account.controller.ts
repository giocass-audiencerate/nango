import type { Request, Response, NextFunction } from 'express';
import { hmacService, environmentService, errorManager, getBaseUrl, isCloud, getWebsocketsPath, getOauthCallbackUrl } from '@nangohq/shared';
import { getUserAccountAndEnvironmentFromSession } from '../utils/utils.js';

class AccountController {
    async getAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const { environment } = await getUserAccountAndEnvironmentFromSession(req);

            if (!isCloud()) {
                environment.websockets_path = getWebsocketsPath();
            }

            environment.callback_url = await getOauthCallbackUrl(environment.id);

            res.status(200).send({ account: { ...environment, host: getBaseUrl() } });
        } catch (err) {
            next(err);
        }
    }

    async getHmacDigest(req: Request, res: Response, next: NextFunction) {
        try {
            const { environment } = await getUserAccountAndEnvironmentFromSession(req);
            const { provider_config_key: providerConfigKey, connection_id: connectionId } = req.query;

            if (!providerConfigKey) {
                errorManager.errRes(res, 'missing_provider_config_key');
                return;
            }

            if (!connectionId) {
                errorManager.errRes(res, 'missing_connection_id');
                return;
            }

            if (environment.hmac_enabled && environment.hmac_key) {
                const digest = await hmacService.digest(environment.id, providerConfigKey as string, connectionId as string);
                res.status(200).send({ hmac_digest: digest });
            } else {
                res.status(200).send({ hmac_digest: null });
            }
        } catch (err) {
            next(err);
        }
    }

    async updateCallback(req: Request, res: Response, next: NextFunction) {
        try {
            if (req.body == null) {
                errorManager.errRes(res, 'missing_body');
                return;
            }

            if (req.body['callback_url'] == null) {
                errorManager.errRes(res, 'missing_callback_url');
                return;
            }

            const environment = (await getUserAccountAndEnvironmentFromSession(req)).environment;

            await environmentService.editCallbackUrl(req.body['callback_url'], environment.id);
            res.status(200).send();
        } catch (err) {
            next(err);
        }
    }

    async updateWebhookURL(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body) {
                errorManager.errRes(res, 'missing_body');
                return;
            }

            const environment = (await getUserAccountAndEnvironmentFromSession(req)).environment;

            await environmentService.editWebhookUrl(req.body['webhook_url'], environment.id);
            res.status(200).send();
        } catch (err) {
            next(err);
        }
    }

    async updateHmacEnabled(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body) {
                errorManager.errRes(res, 'missing_body');
                return;
            }

            const environment = (await getUserAccountAndEnvironmentFromSession(req)).environment;

            await environmentService.editHmacEnabled(req.body['hmac_enabled'], environment.id);
            res.status(200).send();
        } catch (err) {
            next(err);
        }
    }

    async updateHmacKey(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.body) {
                errorManager.errRes(res, 'missing_body');
                return;
            }

            const environment = (await getUserAccountAndEnvironmentFromSession(req)).environment;

            await environmentService.editHmacKey(req.body['hmac_key'], environment.id);
            res.status(200).send();
        } catch (err) {
            next(err);
        }
    }
}

export default new AccountController();
