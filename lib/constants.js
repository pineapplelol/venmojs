const BASE_URL = "https://api.venmo.com/v1";
const PRIVACY_SETTINGS = {
	PRIVATE: "private",
	PUBLIC: "public",
    FRIENDS: "friends"
}
const HEADER_PARAMS = {
    CONTENT_TYPE: "application/json",
}
const HTTP_METHODS = {
    POST: "POST",
    GET: "GET"
}
export default {
    BASE_URL,
    HEADER_PARAMS,
    HTTP_METHODS,
    PRIVACY_SETTINGS
}