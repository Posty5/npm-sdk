# 07 - Data and State

- HttpClient stores merged configuration and one Axios instance.
- Feature clients receive an HttpClient; they do not create hidden global clients.
- Response/error mapping is centralized in core.
- Upload workflows request signed configuration, upload binary data, then continue API operations.
- Tests read POSTY5_BASE_URL and POSTY5_API_KEY from the environment.

## Contract rule

Types, request/response shapes, serialized route parameters, persisted settings, and public models are contracts. Update producers, consumers, tests, and AI indexes together when they change.
