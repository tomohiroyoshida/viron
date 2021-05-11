import _ from 'lodash';
import React, { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import Schema from '$components/schema';
import { useEliminate } from '$components/schema/hooks/index';
import {
  Parameter,
  Request,
  RequestPayloadParameter,
  RequestPayloadRequestBody,
  Schema as SchemaType,
} from '$types/oas';
import { getDefaultValue, pickContentType } from '$utils/oas';

type Props = {
  request: Request;
  onSubmit: (
    parameters?: RequestPayloadParameter[],
    requestBody?: RequestPayloadRequestBody
  ) => void;
};
const _Request: React.FC<Props> = ({ request, onSubmit }) => {
  const defaultValues = useMemo(
    function () {
      const ret: {
        parameters?: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key in string]: any;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        requestBody?: any;
      } = {};
      if (!!request.operation.parameters) {
        ret.parameters = {};
        (request.operation.parameters as Parameter[]).forEach((parameter) => {
          if (parameter.required) {
            // TODO: Without this below, tsc says "Object is possibly 'undefined'."
            if (!ret.parameters) {
              return;
            }
            ret.parameters[parameter.name] = getDefaultValue(
              parameter.schema as SchemaType
            );
          }
        });
      }
      if (!!request.operation.requestBody) {
        const schema = request.operation.requestBody.content[
          pickContentType(request.operation.requestBody.content)
        ].schema as SchemaType;
        ret.requestBody = getDefaultValue(schema);
      }
      return ret;
    },
    [request]
  );
  const {
    register,
    unregister,
    control,
    formState,
    getValues,
    setValue,
    watch,
    setError,
    clearErrors,
    handleSubmit,
  } = useForm({
    defaultValues,
  });
  const { ref, execute } = useEliminate();
  const _handleSubmit = useMemo(
    function () {
      return handleSubmit(function (data) {
        execute(data);
        console.log('eliminated data: ', data);
        const parameters: RequestPayloadParameter[] = [];
        _.forEach(data.parameters || {}, function (value, name) {
          const parameter = (request.operation.parameters as Parameter[]).find(
            (parameter) => parameter.name === name
          );
          if (!parameter) {
            return;
          }
          parameters.push({ ...parameter, value });
        });
        if (!request.operation.requestBody) {
          onSubmit(parameters);
        } else {
          const requestBody: RequestPayloadRequestBody = {
            ...request.operation.requestBody,
            value: data.requestBody,
          };
          onSubmit(parameters, requestBody);
        }
      });
    },
    [handleSubmit, onSubmit, request.operation, execute]
  );

  return (
    <div className="text-xxs">
      <form onSubmit={_handleSubmit}>
        <p>
          <span className="mr-4">{request.method.toUpperCase()}</span>
          <span>{request.path}</span>
        </p>
        {!!request.operation.parameters && (
          <div>
            <Schema
              name="parameters"
              schema={{
                type: 'object',
                properties: (function () {
                  const obj: {
                    [key in string]: SchemaType;
                  } = {};
                  request.operation.parameters.forEach(function (parameter) {
                    parameter = parameter as Parameter;
                    obj[parameter.name] = parameter.schema as SchemaType;
                  });
                  return obj;
                })(),
                required: (function () {
                  const arr: string[] = [];
                  request.operation.parameters.forEach(function (parameter) {
                    parameter = parameter as Parameter;
                    if (parameter.required) {
                      arr.push(parameter.name);
                    }
                  });
                  return arr;
                })(),
              }}
              formState={formState}
              register={register}
              unregister={unregister}
              control={control}
              watch={watch}
              getValues={getValues}
              setValue={setValue}
              setError={setError}
              clearErrors={clearErrors}
              required={true}
              isDeepActive={true}
              activeRef={ref}
            />
          </div>
        )}
        {!!request.operation.requestBody && (
          <div>
            <Schema
              name="requestBody"
              schema={
                request.operation.requestBody.content[
                  pickContentType(request.operation.requestBody.content)
                ].schema as SchemaType
              }
              formState={formState}
              register={register}
              unregister={unregister}
              control={control}
              watch={watch}
              getValues={getValues}
              setValue={setValue}
              setError={setError}
              clearErrors={clearErrors}
              required={request.operation.requestBody.required || false}
              isDeepActive={true}
              activeRef={ref}
            />
          </div>
        )}
        <input type="submit" />
      </form>
    </div>
  );
};
export default _Request;