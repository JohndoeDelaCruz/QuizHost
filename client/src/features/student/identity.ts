export interface Identity {
  id: string;
  token: string;
  name: string;
  pin: string;
}
export function storedIdentity(): Identity | null {
  try {
    return JSON.parse(sessionStorage.getItem("quizhost:player") ?? "null");
  } catch {
    return null;
  }
}
