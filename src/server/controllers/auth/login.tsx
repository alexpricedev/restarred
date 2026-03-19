import { Login } from "../../templates/login";
import { render } from "../../utils/response";

export const login = {
  index(req: Request): Response {
    const url = new URL(req.url);
    const error = url.searchParams.get("error") ?? undefined;
    return render(<Login error={error} />);
  },
};
