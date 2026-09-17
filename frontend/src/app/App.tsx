import React from "react";
import { RouterProvider } from "react-router-dom";
import { Providers } from "./providers";
import { router } from "./router";

export const App: React.FC = () => {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;
