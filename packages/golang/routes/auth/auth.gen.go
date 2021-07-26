// Package auth provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/deepmap/oapi-codegen version v1.8.1 DO NOT EDIT.
package auth

import (
	"bytes"
	"compress/gzip"
	"encoding/base64"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"

	externalRef0 "github.com/cam-inc/viron/packages/golang/routes/components"
	"github.com/deepmap/oapi-codegen/pkg/runtime"
	openapi_types "github.com/deepmap/oapi-codegen/pkg/types"
	"github.com/getkin/kin-openapi/openapi3"
	"github.com/go-chi/chi/v5"
)

// OAuth2GoogleCallbackPayload defines model for OAuth2GoogleCallbackPayload.
type OAuth2GoogleCallbackPayload struct {

	// Googleが発行した認可コード
	Code string `json:"code"`

	// GoogleOAuth2コールバックURI
	RedirectUri string `json:"redirectUri"`

	// CSRF対策用のステートパラメータ
	State string `json:"state"`
}

// SigninEmailPayload defines model for SigninEmailPayload.
type SigninEmailPayload struct {

	// Eメールアドレス
	Email openapi_types.Email `json:"email"`

	// パスワード
	Password string `json:"password"`
}

// RedirectUriQueryParam defines model for RedirectUriQueryParam.
type RedirectUriQueryParam string

// SigninEmailJSONBody defines parameters for SigninEmail.
type SigninEmailJSONBody SigninEmailPayload

// Oauth2GoogleAuthorizationParams defines parameters for Oauth2GoogleAuthorization.
type Oauth2GoogleAuthorizationParams struct {
	RedirectUri RedirectUriQueryParam `json:"redirectUri"`
}

// Oauth2GoogleCallbackJSONBody defines parameters for Oauth2GoogleCallback.
type Oauth2GoogleCallbackJSONBody OAuth2GoogleCallbackPayload

// SigninEmailJSONRequestBody defines body for SigninEmail for application/json ContentType.
type SigninEmailJSONRequestBody SigninEmailJSONBody

// Oauth2GoogleCallbackJSONRequestBody defines body for Oauth2GoogleCallback for application/json ContentType.
type Oauth2GoogleCallbackJSONRequestBody Oauth2GoogleCallbackJSONBody

// ServerInterface represents all server handlers.
type ServerInterface interface {
	// signin to viron with email/password
	// (POST /email/signin)
	SigninEmail(w http.ResponseWriter, r *http.Request)
	// redirect to google oauth
	// (GET /oauth2/google/authorization)
	Oauth2GoogleAuthorization(w http.ResponseWriter, r *http.Request, params Oauth2GoogleAuthorizationParams)
	// callback from google oauth
	// (POST /oauth2/google/callback)
	Oauth2GoogleCallback(w http.ResponseWriter, r *http.Request)
	// signout of viron
	// (POST /signout)
	Signout(w http.ResponseWriter, r *http.Request)
}

// ServerInterfaceWrapper converts contexts to parameters.
type ServerInterfaceWrapper struct {
	Handler            ServerInterface
	HandlerMiddlewares []MiddlewareFunc
}

type MiddlewareFunc func(http.HandlerFunc) http.HandlerFunc

// SigninEmail operation middleware
func (siw *ServerInterfaceWrapper) SigninEmail(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var handler = func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.SigninEmail(w, r)
	}

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler(w, r.WithContext(ctx))
}

// Oauth2GoogleAuthorization operation middleware
func (siw *ServerInterfaceWrapper) Oauth2GoogleAuthorization(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var err error

	// Parameter object where we will unmarshal all parameters from the context
	var params Oauth2GoogleAuthorizationParams

	// ------------- Required query parameter "redirectUri" -------------
	if paramValue := r.URL.Query().Get("redirectUri"); paramValue != "" {

	} else {
		http.Error(w, "Query argument redirectUri is required, but not found", http.StatusBadRequest)
		return
	}

	err = runtime.BindQueryParameter("form", true, true, "redirectUri", r.URL.Query(), &params.RedirectUri)
	if err != nil {
		http.Error(w, fmt.Sprintf("Invalid format for parameter redirectUri: %s", err), http.StatusBadRequest)
		return
	}

	var handler = func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.Oauth2GoogleAuthorization(w, r, params)
	}

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler(w, r.WithContext(ctx))
}

// Oauth2GoogleCallback operation middleware
func (siw *ServerInterfaceWrapper) Oauth2GoogleCallback(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var handler = func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.Oauth2GoogleCallback(w, r)
	}

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler(w, r.WithContext(ctx))
}

// Signout operation middleware
func (siw *ServerInterfaceWrapper) Signout(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	var handler = func(w http.ResponseWriter, r *http.Request) {
		siw.Handler.Signout(w, r)
	}

	for _, middleware := range siw.HandlerMiddlewares {
		handler = middleware(handler)
	}

	handler(w, r.WithContext(ctx))
}

// Handler creates http.Handler with routing matching OpenAPI spec.
func Handler(si ServerInterface) http.Handler {
	return HandlerWithOptions(si, ChiServerOptions{})
}

type ChiServerOptions struct {
	BaseURL     string
	BaseRouter  chi.Router
	Middlewares []MiddlewareFunc
}

// HandlerFromMux creates http.Handler with routing matching OpenAPI spec based on the provided mux.
func HandlerFromMux(si ServerInterface, r chi.Router) http.Handler {
	return HandlerWithOptions(si, ChiServerOptions{
		BaseRouter: r,
	})
}

func HandlerFromMuxWithBaseURL(si ServerInterface, r chi.Router, baseURL string) http.Handler {
	return HandlerWithOptions(si, ChiServerOptions{
		BaseURL:    baseURL,
		BaseRouter: r,
	})
}

// HandlerWithOptions creates http.Handler with additional options
func HandlerWithOptions(si ServerInterface, options ChiServerOptions) http.Handler {
	r := options.BaseRouter

	if r == nil {
		r = chi.NewRouter()
	}
	wrapper := ServerInterfaceWrapper{
		Handler:            si,
		HandlerMiddlewares: options.Middlewares,
	}

	r.Group(func(r chi.Router) {
		r.Post(options.BaseURL+"/email/signin", wrapper.SigninEmail)
	})
	r.Group(func(r chi.Router) {
		r.Get(options.BaseURL+"/oauth2/google/authorization", wrapper.Oauth2GoogleAuthorization)
	})
	r.Group(func(r chi.Router) {
		r.Post(options.BaseURL+"/oauth2/google/callback", wrapper.Oauth2GoogleCallback)
	})
	r.Group(func(r chi.Router) {
		r.Post(options.BaseURL+"/signout", wrapper.Signout)
	})

	return r
}

// Base64 encoded, gzipped, json marshaled Swagger object
var swaggerSpec = []string{

	"H4sIAAAAAAAC/7RWf2scRRj+Kus0gq17t9eLiByUNIYqwWLqhfiHuVMmu3N3U3d3tjOzrddjwd0FMTTi",
	"D4rSP0RapdSm7QlFsP5oP8xrSP0WMjN7v/dqUfwntzPzvu887/PMPJMBclkQsZCEUqDGAEWY44BIwvWo",
	"STzKiSt3OH0nJrx/Qa2qBRqiBrqkppCNQhwQ1EB8EoxsxMmlmHLioYbkMbGRcHskwCq3w3iAJWqgWAfK",
	"fqSyheQ07KIkSUaxGsHWeix79TcZ6/pkA/v+HnY/vID7PsOehstZRLikRAe7zCPq1yPC5TSSlCmYJhnS",
	"g+Mbvz69eQDpN5B+9/TuZ0efDyF7CPnvkO8v4rBn+llS1KAbVTmE/AvIc8iGO83NsopCYlkCcGO7+cbR",
	"8PHx/a+Pr9+B9AFkjyD/RJf8FPIvIf8R8ptqmD0p4Wua6l1DwWin2R7a41y2d5G4UiHapt2QhucCTP2l",
	"rBK1uoj6XAEqP4TsFuT7kN+D7BGyJ/qaxBIeIizEFca9xaKqXdX9cCzLuNo4SeVLSbiKf/+ltTPVU2u7",
	"uHJ1vfJe+6QZtlreyWKq1fJeWDux8mIrrtXqr5499bJT+UB9r7pn9A9pD16zk3+kddTKGMQimSqFhh22",
	"2BSOZc/CEbVERFzaoS5WC0JtSqWvapy9TDkLHZ/uWSoY2egy4cJk16q16mnFGotIiCOKGmi1WqvWDQ89",
	"LZGj8TlCq6kVZEKWSKaiptWC9M4c45B99ecfTyD9HtLb7ypQkB5C9jNkP0D+sPib3oDsGtKAuG5l00ON",
	"6aNUXH8i5OvM65ubGUoSakg4ivyCAueiYBruxBxWOOmgBjrhTGzJKezAKTmsyaxQymr0hIhYKMzxrdde",
	"WWTibWZtFJC04cRBgHlf6a/3sCSztCTWFSp7lmF36gBK3BXqWGix2qqCw9R33elqX3DUgHF6FZv9BqhL",
	"5HJneqB9xFjS8fXf/vr2FqS/QH4X8o815fcgGyovKCd+C08scn1mX3vGznfL2Z2EOOV2n7TnGF2tnV7s",
	"ZZSrqDNYLN2VtdM8X50jmU/FGsIsVpz7WWZt9FFFfbks7NBuxSMdHPuyMvtIzfg0WhnoUuNWmpuJOSVz",
	"CrnFY7L8tpgujCpHjw+0MS8a/fln6jF6sv6nG/Gs1/G/X4152UaUWR3Ogn8l3BwHz6ucupQslsulKpzq",
	"GmT7kN+H7Cdlctnt5Xdmu6j4PIRsvVXiESyWFusYkygxhGQ8NRj9e6SXknbydwAAAP//I36W6XIJAAA=",
}

// GetSwagger returns the content of the embedded swagger specification file
// or error if failed to decode
func decodeSpec() ([]byte, error) {
	zipped, err := base64.StdEncoding.DecodeString(strings.Join(swaggerSpec, ""))
	if err != nil {
		return nil, fmt.Errorf("error base64 decoding spec: %s", err)
	}
	zr, err := gzip.NewReader(bytes.NewReader(zipped))
	if err != nil {
		return nil, fmt.Errorf("error decompressing spec: %s", err)
	}
	var buf bytes.Buffer
	_, err = buf.ReadFrom(zr)
	if err != nil {
		return nil, fmt.Errorf("error decompressing spec: %s", err)
	}

	return buf.Bytes(), nil
}

var rawSpec = decodeSpecCached()

// a naive cached of a decoded swagger spec
func decodeSpecCached() func() ([]byte, error) {
	data, err := decodeSpec()
	return func() ([]byte, error) {
		return data, err
	}
}

// Constructs a synthetic filesystem for resolving external references when loading openapi specifications.
func PathToRawSpec(pathToFile string) map[string]func() ([]byte, error) {
	var res = make(map[string]func() ([]byte, error))
	if len(pathToFile) > 0 {
		res[pathToFile] = rawSpec
	}

	pathPrefix := path.Dir(pathToFile)

	for rawPath, rawFunc := range externalRef0.PathToRawSpec(path.Join(pathPrefix, "./components.yaml")) {
		if _, ok := res[rawPath]; ok {
			// it is not possible to compare functions in golang, so always overwrite the old value
		}
		res[rawPath] = rawFunc
	}
	return res
}

// GetSwagger returns the Swagger specification corresponding to the generated code
// in this file. The external references of Swagger specification are resolved.
// The logic of resolving external references is tightly connected to "import-mapping" feature.
// Externally referenced files must be embedded in the corresponding golang packages.
// Urls can be supported but this task was out of the scope.
func GetSwagger() (swagger *openapi3.T, err error) {
	var resolvePath = PathToRawSpec("")

	loader := openapi3.NewLoader()
	loader.IsExternalRefsAllowed = true
	loader.ReadFromURIFunc = func(loader *openapi3.Loader, url *url.URL) ([]byte, error) {
		var pathToFile = url.String()
		pathToFile = path.Clean(pathToFile)
		getSpec, ok := resolvePath[pathToFile]
		if !ok {
			err1 := fmt.Errorf("path not found: %s", pathToFile)
			return nil, err1
		}
		return getSpec()
	}
	var specData []byte
	specData, err = rawSpec()
	if err != nil {
		return
	}
	swagger, err = loader.LoadFromData(specData)
	if err != nil {
		return
	}
	return
}
