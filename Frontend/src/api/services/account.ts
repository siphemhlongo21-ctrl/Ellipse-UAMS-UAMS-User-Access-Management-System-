import type { AuthResponse } from "../../types/AuthResponse";
import { http, employeeLogin } from "../client";
import type { CurrentUserDetails } from "../types";

export const accountApi = {
  me: () => http.get<CurrentUserDetails>("/Account/Me"),
  login: (username: string, password: string) => employeeLogin("Account/Login?username="+username+"&password="+password),
  validateToken: ()  => http.post<AuthResponse>("Account/ValidateToken")
};
