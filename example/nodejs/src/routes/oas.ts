import { domainsOas } from '@viron/lib';
import { RouteContext } from '.';

/**
 * oas取得
 * @route GET /oas
 */
export const getOas = async (context: RouteContext): Promise<void> => {
  const oas = await domainsOas.get(context.apiDefinition);
  context.res.json(oas);
};