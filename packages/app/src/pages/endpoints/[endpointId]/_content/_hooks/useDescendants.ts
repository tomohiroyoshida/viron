import _ from 'lodash';
import { useMemo } from 'react';
import { StatusCode } from '$constants/index';
import { BaseError, getHTTPError, NetworkError } from '$errors/index';
import { Endpoint } from '$types/index';
import {
  Document,
  Info,
  Method,
  OperationId,
  Request,
  RequestValue,
} from '$types/oas';
import { promiseErrorHandler } from '$utils/index';
import {
  cleanupRequestValue,
  constructRequestInfo,
  constructRequestInit,
  constructRequestPayloads,
  getContentBaseOperationResponseKeys,
  getRequest,
  getRequestParameterKeys,
} from '$utils/oas';

export type UseDescendantsReturn = {
  request: Request;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getDefaultValues: (data: any) => ReturnType<typeof cleanupRequestValue>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetch: (
    requestValue: RequestValue
  ) => Promise<{ data?: any; error?: BaseError }>;
}[];
// Descendant Opeartions are
// [1] operations whose path includes base operation's one at the head.(i.e. path matches `/${baseOperation's path}/xxx/yyy`)
// [2] action operations whose request payload key set contains one of base operation's response payload keys.
const useDescendants = function (
  endpoint: Endpoint,
  document: Document,
  content: Info['x-pages'][number]['contents'][number]
): UseDescendantsReturn {
  const operationIds = useMemo<OperationId[]>(
    function () {
      const _operationIds: OperationId[] = [];
      const getBaseRequestResult = getRequest(document, {
        operationId: content.operationId,
      });
      if (getBaseRequestResult.isFailure()) {
        return _operationIds;
      }
      const baseRequest = getBaseRequestResult.value;

      // Add operations under the rule of [1] described above.
      const pathItems = _.filter(document.paths, function (_, path) {
        return (
          path !== baseRequest.path && path.indexOf(baseRequest.path) === 0
        );
      });
      _.each(pathItems, function (pathItem) {
        // TODO: method一覧の扱い改善。
        (
          [
            'get',
            'put',
            'post',
            'delete',
            'options',
            'head',
            'patch',
            'trace',
          ] as Method[]
        ).forEach(function (method) {
          const operationId = pathItem[method]?.operationId;
          if (!operationId) {
            return;
          }
          _operationIds.push(operationId);
        });
      });

      // Add operations under the rule of [2] described above.
      if (content.actions) {
        const baseOperationResponseKeys = getContentBaseOperationResponseKeys(
          document,
          content
        );
        content.actions.forEach(function (action) {
          const actionOperationRequestKeys = getRequestParameterKeys(
            document,
            action.operationId
          );
          if (
            _.intersection(
              baseOperationResponseKeys,
              actionOperationRequestKeys
            ).length
          ) {
            _operationIds.push(action.operationId);
          }
        });
      }
      return _operationIds;
    },
    [document, content]
  );

  const descendants = useMemo<UseDescendantsReturn>(
    function () {
      const _descendants: UseDescendantsReturn = [];
      operationIds.forEach(function (operationId) {
        const getRequestResult = getRequest(document, { operationId });
        if (getRequestResult.isFailure()) {
          return;
        }
        const request = getRequestResult.value;
        _descendants.push({
          request,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          getDefaultValues: function (data: any) {
            // TODO: content.typeに応じてdataの扱いが変わるはず...
            return cleanupRequestValue(request, {
              parameters: {
                ...content.defaultParametersValue,
                ...data,
              },
              requestBody: {
                ...content.defaultRequestBodyValue,
                ...data,
              },
            });
          },
          fetch: async function (requestValue: RequestValue) {
            const requestPayloads = constructRequestPayloads(
              request.operation,
              requestValue
            );
            const requestInfo = constructRequestInfo(
              endpoint,
              document,
              request,
              requestPayloads
            );
            const requestInit = constructRequestInit(request, requestPayloads);
            const [response, responseError] =
              await promiseErrorHandler<Response>(
                window.fetch(requestInfo, requestInit)
              );
            if (responseError) {
              return {
                error: new NetworkError(),
              };
            }
            if (!response.ok) {
              return {
                error: getHTTPError(response.status as StatusCode),
              };
            }
            const data = await response.json();
            return {
              data,
            };
          },
        });
      });
      return _descendants;
    },
    [document, endpoint, operationIds, content]
  );

  return descendants;
};
export default useDescendants;
