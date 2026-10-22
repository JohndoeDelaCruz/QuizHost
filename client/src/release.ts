import { version } from "../../package.json";

export const APP_VERSION = version;
export const RELEASE_CHANNEL = version.includes("-beta") ? "Beta" : "";
